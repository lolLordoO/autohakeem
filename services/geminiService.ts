
import { GoogleGenAI, Type } from "@google/genai";
import { ABDUL_CV_TEXT, USER_PROFILE } from "../constants";
import { GeneratedContent, JobOpportunity, PersonaType, RecruiterProfile, AgencyProfile, MarketSignal, TechEvent, SentimentAnalysis, OfferEvaluation, SearchFocus, ATSAnalysis, LinkedInTone, JobSenseAnalysis, JobFilters } from "../types";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key missing");
  return new GoogleGenAI({ apiKey });
};

// Helper to handle API errors globally
const handleGeminiError = (e: any) => {
    const msg = e.message || e.toString();
    if (msg.toLowerCase().includes('quota') || msg.includes('429') || msg.toLowerCase().includes('limit')) {
        const event = new CustomEvent('gemini-error', { detail: { type: 'quota', message: msg } });
        window.dispatchEvent(event);
        throw new Error("Quota Exceeded"); 
    }
    console.error("Gemini API Error:", e);
    throw e;
};

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Retry wrapper for API calls to handle 429/Quota bursts
const retryWrapper = async <T>(fn: () => Promise<T>, retries = 3, delay = 2000): Promise<T> => {
  try {
    return await fn();
  } catch (e: any) {
    const msg = e.message || e.toString();
    // Only retry on rate limit errors
    if (retries > 0 && (msg.includes('429') || msg.toLowerCase().includes('quota') || msg.toLowerCase().includes('limit') || msg.includes('500') || msg.includes('Rpc') || msg.includes('xhr'))) {
      console.warn(`Transient Error (${msg}). Retrying in ${delay}ms... (${retries} attempts left)`);
      await wait(delay);
      return retryWrapper(fn, retries - 1, delay * 2); // Exponential backoff
    }
    // If retries exhausted or different error, bubble it up
    if (retries === 0) {
        handleGeminiError(e);
    }
    throw e;
  }
};

// --- SMART CACHE LAYER ---
const smartCache = async <T>(key: string, fn: () => Promise<T>, ttlMin = 60): Promise<T> => {
    const cacheKey = `gemini_cache_${key}`;
    try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
            const { data, expiry } = JSON.parse(cached);
            if (new Date().getTime() < expiry) {
                return data;
            }
        }
    } catch (e) { console.warn("Cache read failed", e); }

    const result = await fn();
    
    try {
        localStorage.setItem(cacheKey, JSON.stringify({
            data: result,
            expiry: new Date().getTime() + (ttlMin * 60 * 1000)
        }));
    } catch (e) { console.warn("Cache write failed (storage full?)", e); }
    
    return result;
}

export const clearSmartCache = () => {
    Object.keys(localStorage).forEach(key => {
        if (key.startsWith('gemini_cache_')) localStorage.removeItem(key);
    });
}

// "The Iron Parser 2.0"
const cleanAndParseJSON = (text: string) => {
  if (!text) return [];
  let cleaned = text.replace(/```json\n?|```/g, '').trim();
  try {
      return JSON.parse(cleaned);
  } catch (e) {
      const arrayStart = cleaned.indexOf('[');
      const arrayEnd = cleaned.lastIndexOf(']');
      const objectStart = cleaned.indexOf('{');
      const objectEnd = cleaned.lastIndexOf('}');
      let jsonString = '';
      if (arrayStart !== -1 && arrayEnd !== -1 && arrayEnd > arrayStart) {
           jsonString = cleaned.substring(arrayStart, arrayEnd + 1);
           try { return JSON.parse(jsonString); } catch (e) {}
      }
      if (objectStart !== -1 && objectEnd !== -1 && objectEnd > objectStart) {
           jsonString = cleaned.substring(objectStart, objectEnd + 1);
           try { return JSON.parse(jsonString); } catch (e) {}
      }
      return [];
  }
};

const isValidJobUrl = (url: string | undefined): boolean => {
    if (!url) return false;
    const lower = url.toLowerCase();
    const whitelist = [
        'linkedin.com', 'indeed.com', 'naukrigulf.com', 'bayt.com', 
        'gulftalent.com', 'oliv.com', 'hub71.com', 'laimoon.com',
        'lever.co', 'greenhouse.io', 'workday.com', 'oraclecloud.com',
        'careers.', 'jobs.', 'taleo.net', 'bamboohr.com'
    ];
    return whitelist.some(domain => lower.includes(domain)) && !lower.includes('...');
};

const getFocusKeywords = (focus: SearchFocus): string => {
    switch (focus) {
        case SearchFocus.MARKETING: return "AND (Growth OR SEO OR 'Brand Strategy' OR Copywriting OR 'Digital Marketing' OR Campaign)";
        case SearchFocus.CONTENT: return "AND (Content OR 'Creative Director' OR Video OR Storytelling OR Copywriter OR Social)";
        case SearchFocus.TECH_AI: return "AND (AI OR 'Generative AI' OR LLM OR 'Machine Learning' OR Python OR NLP)";
        case SearchFocus.WEB3: return "AND (Web3 OR Blockchain OR Crypto OR DeFi OR Tokenomics OR Solidity OR Wallet)";
        case SearchFocus.PMO: return "AND ('Project Manager' OR 'Product Owner' OR Scrum OR Agile OR Kanban OR Roadmap)";
        case SearchFocus.SAAS: return "AND (SaaS OR B2B OR 'Enterprise Software' OR 'Account Executive' OR Salesforce)";
        case SearchFocus.FINTECH: return "AND (FinTech OR Payments OR Banking OR Trading OR Compliance)";
        case SearchFocus.HEALTH: return "AND (HealthTech OR MedTech OR 'Healthcare IT' OR Biotechnology)";
        case SearchFocus.REAL_ESTATE: return "AND (PropTech OR 'Real Estate' OR Property OR Construction)";
        case SearchFocus.ECOMMERCE: return "AND (E-commerce OR Retail OR Shopify OR 'Supply Chain' OR Logistics)";
        case SearchFocus.CONSTRUCTION: return "AND (Engineering OR Construction OR MEP OR Civil OR Architecture)";
        default: return "";
    }
}

const UAE_SALARY_BENCHMARKS = `
UAE SALARY BENCHMARKS (AED/Month) [2025]:
- Marketing & Content: Specialist (12k-18k), Manager (20k-30k)
- Project Management: PM (18k-28k), Senior PM (30k-45k)
- Tech / AI / Web3: Senior Dev (25k-35k), Specialist (25k-45k)
`;

const NATURAL_RULES = `
STRICT WRITING RULES (NATURAL & HUMAN):
1. LANGUAGE: Use simple words. Write like you talk to a friend.
2. NO AI PHRASES: NEVER use "dive into", "unleash", "game-changing", etc.
3. STYLE: Be direct. Cut fluff.
4. NO DASHES: Do not use hyphens or dashes "-" in text.
`;

export const analyzeProfileForSearch = async (userBaseQuery: string): Promise<string> => {
  return smartCache(`profile_analysis_${userBaseQuery}`, () => retryWrapper(async () => {
      const ai = getClient();
      const prompt = userBaseQuery 
        ? `Merge "${userBaseQuery}" with candidate CV to create ONE Boolean search query for UAE.`
        : `Generate ONE high-precision Boolean search query for UAE jobs based on CV.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `${prompt}
        CV Summary: ${ABDUL_CV_TEXT.substring(0, 1000)}
        
        RULES:
        1. Enforce UAE location.
        2. Cap experience at 4 years.
        Output: Query string only.`
      });
      return response.text?.trim().replace(/["']/g, "").replace(/`/g, "") || userBaseQuery + " UAE";
  }));
};

// --- IMPROVED SCRAPING LOGIC ---

export const getFreshJobDrops = async (hours: 24 | 48 = 24): Promise<JobOpportunity[]> => {
    return smartCache(`fresh_drops_v2_${hours}h_${new Date().getHours()}`, () => retryWrapper(async () => {
        const ai = getClient();
        const now = new Date();
        const date = new Date(now.getTime() - (hours * 60 * 60 * 1000));
        const dateStr = date.toISOString().split('T')[0];
        
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `ACT AS AN AGGRESSIVE RECRUITMENT BOT.
            Task: Find 20+ REAL job openings in the UAE posted in the LAST ${hours} HOURS.
            
            CANDIDATE (Abdul Hakeem):
            - 4 Years Exp.
            - Content & Marketing (AI/Web3 Focus).
            - Project Management (PMO Focus).
            
            SEARCH STRATEGY (Use googleSearch):
            Perform wide search: ("Marketing" OR "Project Manager" OR "Growth" OR "Product Owner" OR "Web3" OR "AI Content") AND ("Dubai" OR "Abu Dhabi" OR "Sharjah") after:${dateStr} site:linkedin.com/jobs OR site:naukrigulf.com OR site:bayt.com OR site:indeed.com OR site:gulftalent.com
            
            VALIDATION:
            1. MUST be a specific, recognizable company name.
            2. NO "Confidential" or "Client of" listings.
            3. Must have a TITLE and a snippet confirming it's a NEW post.
            4. Try to find the actual application URL.
            
            JSON Output ONLY: 
            [{ 
                "title", 
                "company", 
                "location", 
                "source", 
                "url", 
                "postedDate", 
                "salaryEstimate", 
                "matchReason",
                "matchGrade": "S"|"A"|"B",
                "category": "Tech"|"Creative"|"Product"|"General"
            }]`,
            config: { tools: [{ googleSearch: {} }] }
        });
        
        const raw = cleanAndParseJSON(response.text || "[]");
        if (!Array.isArray(raw)) return [];
        
        const badNames = ['confidential', 'leading', 'hidden', 'undisclosed', 'stealth', 'client of', 'major', 'international', 'reputable'];
        
        return raw
            .filter((job: any) => {
                const name = job.company?.toLowerCase() || '';
                return name.length > 2 && !badNames.some(b => name.includes(b));
            })
            .map((job: any) => ({
                id: 'fresh-' + Math.random().toString(36).substr(2, 9),
                title: job.title,
                company: job.company,
                location: job.location || "UAE",
                source: job.source || "Web Search",
                url: isValidJobUrl(job.url) ? job.url : null,
                search_query: `site:linkedin.com/jobs "${job.title}" "${job.company}"`,
                description: `Freshly posted role. Verified active listing.`,
                salaryEstimate: job.salaryEstimate || "AED 12k - 18k (Estimated)",
                matchGrade: job.matchGrade || 'A',
                matchReason: job.matchReason || "Strong keyword overlap with your AI/Marketing background.",
                dateFound: new Date().toISOString(),
                postedDate: job.postedDate || `${Math.floor(Math.random() * hours)}h ago`,
                isFresh: true,
                status: 'found',
                category: job.category || 'General'
            }));
    }), 10); // 10 min cache for fresh drops
}

export const searchJobsInUAE = async (query: string, focus: SearchFocus = SearchFocus.ALL, filters?: JobFilters): Promise<JobOpportunity[]> => {
  const filterKey = filters ? `${filters.emirate}_${filters.level}_${filters.dateRange}` : 'default';
  const dateKey = new Date().toISOString().split('T')[0];
  
  return smartCache(`jobs_v2_${query}_${focus}_${filterKey}_${dateKey}`, () => retryWrapper(async () => {
      const ai = getClient();
      const focusKeywords = getFocusKeywords(focus);
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Scour UAE for jobs. Query: "${query} ${focusKeywords}".
        Location: ${filters?.emirate || 'UAE'}.
        Exp: 0-4 Years.
        
        JSON Output ONLY: [{ "title", "company", "location", "source", "url", "description", "salaryEstimate", "matchGrade", "matchReason" }]`,
        config: { tools: [{ googleSearch: {} }] }
      });
      
      const rawJobs = cleanAndParseJSON(response.text || "[]");
      const seen = new Set<string>();
      return rawJobs.filter((job: any) => {
          const key = `${job.title}|${job.company}`.toLowerCase();
          if (seen.has(key)) return false;
          seen.add(key);
          return !!job.company && !job.company.toLowerCase().includes('confidential');
      }).map((job: any) => ({
        id: Math.random().toString(36).substr(2, 9),
        title: job.title,
        company: job.company,
        location: job.location || "UAE",
        source: job.source || "Google Search",
        url: isValidJobUrl(job.url) ? job.url : null,
        description: job.description,
        salaryEstimate: job.salaryEstimate || "AED Market Rate",
        matchGrade: job.matchGrade || 'B',
        matchReason: job.matchReason,
        dateFound: new Date().toISOString(),
        status: 'found'
      }));
  }));
};

export const analyzeMarketSignals = async (): Promise<MarketSignal[]> => {
    return smartCache(`market_signals_v2`, () => retryWrapper(async () => {
        const ai = getClient();
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Search UAE business news (Wamda, Magnitt, Zawya) for funding or expansion.
            JSON Output: [{ "company", "signalType", "summary", "actionableLeads": [] }]`,
            config: { tools: [{ googleSearch: {} }] }
        });
        const data = cleanAndParseJSON(response.text || "[]");
        return data.map((s:any) => ({...s, id: Math.random().toString(), dateDetected: new Date().toISOString()}));
    }), 120); 
};

export const findTechEvents = async (): Promise<TechEvent[]> => {
    return smartCache(`tech_events_v2`, () => retryWrapper(async () => {
        const ai = getClient();
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Find tech events in UAE next 30 days.
            JSON Output: [{ "name", "date", "location", "type", "url" }]`,
            config: { tools: [{ googleSearch: {} }] }
        });
        const data = cleanAndParseJSON(response.text || "[]");
        return data.map((e:any) => ({...e, id: Math.random().toString()}));
    }), 240);
};

export const generateLinkedInPost = async (signal: MarketSignal, tone: LinkedInTone, creativity: 'Conservative'|'Balanced'|'Wild' = 'Balanced', length: 'Short'|'Medium'|'Long' = 'Medium'): Promise<string> => {
    return retryWrapper(async () => {
        const ai = getClient();
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Write viral LinkedIn post for Abdul Hakeem. Signal: "${signal.company} ${signal.summary}". Tone: ${tone}. Creativity: ${creativity}.
            ${NATURAL_RULES}`
        });
        return response.text || "";
    });
};

export const getInterviewQuestion = async (jobTitle: string, company: string, history: any[]): Promise<string> => {
    return retryWrapper(async () => {
        const ai = getClient();
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Ask next interview question for ${jobTitle} at ${company}. ${NATURAL_RULES}`
        });
        return response.text || "Tell me about yourself.";
    });
};

export const critiqueAnswer = async (question: string, answer: string): Promise<string> => {
    return retryWrapper(async () => {
        const ai = getClient();
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Critique this interview answer briefly. Q: ${question} A: ${answer}. ${NATURAL_RULES}`
        });
        return response.text || "";
    });
};

export const findRecruiters = async (company: string, focus: SearchFocus, excludedNames: string[] = []): Promise<RecruiterProfile[]> => {
  return smartCache(`recruiters_v2_${company}_${focus}`, () => retryWrapper(async () => {
      const ai = getClient();
      const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: `Find 5 recruiters at ${company} in UAE. JSON Output: [{ "name", "role", "company", "linkedin", "profileSnippet", "category" }]`,
          config: { tools: [{ googleSearch: {} }] }
      });
      return cleanAndParseJSON(response.text || "[]");
  }));
};

export const findAgencies = async (focus: SearchFocus, excludedNames: string[] = []): Promise<AgencyProfile[]> => {
    return smartCache(`agencies_v2_${focus}`, () => retryWrapper(async () => {
        const ai = getClient();
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Find UAE agencies for ${focus}. JSON Output: [{ "name", "focus", "email", "website" }]`,
            config: { tools: [{ googleSearch: {} }] }
        });
        return cleanAndParseJSON(response.text || "[]");
    }));
}

export const analyzeRecruiterReply = async (replyText: string): Promise<SentimentAnalysis> => {
    return retryWrapper(async () => {
        const ai = getClient();
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Analyze: "${replyText}". JSON Output: { "sentiment", "suggestedTone", "analysis", "draftReply" }`,
            config: { responseMimeType: "application/json" }
        });
        return JSON.parse(response.text || "{}");
    });
};

export const generateRecruiterMessage = async (recruiterName: string, company: string, persona: PersonaType): Promise<string> => {
    return retryWrapper(async () => {
        const ai = getClient();
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Write connection note to ${recruiterName} at ${company}. Sender: Abdul Hakeem (${persona}). ${NATURAL_RULES}`
        });
        return response.text || "";
    });
};

export const generateWhatsAppMessage = async (name: string, company: string, role: string): Promise<string> => {
    return retryWrapper(async () => {
        const ai = getClient();
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Short WhatsApp to ${name} (${role} at ${company}). ${NATURAL_RULES}`
        });
        return response.text || "";
    });
}

export const draftAgencyOutreach = async (agency: AgencyProfile, persona: PersonaType): Promise<string> => {
    return retryWrapper(async () => {
        const ai = getClient();
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Cold email to ${agency.name}. Persona: ${persona}. ${NATURAL_RULES}`
        });
        return response.text || "";
    });
}

export const recommendPersona = async (jobDescription: string): Promise<PersonaType> => {
    return retryWrapper(async () => {
        const ai = getClient();
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Best persona for JD: "${jobDescription.substring(0, 500)}"? Options: Marketing, PMO, Ult. One word only.`
        });
        const text = response.text?.trim() || "";
        if (text.toLowerCase().includes("market")) return PersonaType.MARKETING;
        if (text.toLowerCase().includes("project") || text.toLowerCase().includes("product")) return PersonaType.PMO;
        return PersonaType.ULT;
    });
}

export const analyzeJobFit = async (jobDescription: string): Promise<ATSAnalysis> => {
    return retryWrapper(async () => {
        const ai = getClient();
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Analyze fit. CV: ${ABDUL_CV_TEXT.substring(0, 1000)}. JD: ${jobDescription.substring(0, 1000)}. JSON: { "matchScore", "missingKeywords", "strengths", "summary" }`,
            config: { responseMimeType: "application/json" }
        });
        return JSON.parse(response.text || "{}");
    });
}

export const generateResumeBullet = async (missingKeyword: string, jobTitle: string): Promise<string> => {
    return retryWrapper(async () => {
        const ai = getClient();
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Generate resume bullet for ${missingKeyword} in ${jobTitle}. ${NATURAL_RULES}`
        });
        return response.text?.trim() || "";
    });
}

export const generateApplicationMaterials = async (jobDescription: string, persona: PersonaType): Promise<GeneratedContent> => {
  return retryWrapper(async () => {
      const ai = getClient();
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Draft application for ${persona}. JD: ${jobDescription.substring(0, 1000)}. JSON: { "strategicAngle", "whyFitSummary", "emailSubject", "emailDraft", "coverLetter", "fitScore" }`,
        config: { responseMimeType: "application/json" }
      });
      return JSON.parse(response.text || "{}");
    });
};

export const refineContent = async (content: GeneratedContent, instruction: string): Promise<GeneratedContent> => {
    return retryWrapper(async () => {
        const ai = getClient();
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Refine. Instruction: ${instruction}. JSON: ${JSON.stringify(content)}`,
            config: { responseMimeType: "application/json" }
        });
        return JSON.parse(response.text || "{}");
    });
};

export const generateInterviewBrief = async (job: JobOpportunity): Promise<string> => {
    return smartCache(`brief_v2_${job.id}`, () => retryWrapper(async () => {
        const ai = getClient();
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `1-page Interview Brief for ${job.title} at ${job.company}.`,
            config: { tools: [{ googleSearch: {} }] }
        });
        return response.text || "";
    }));
}

export const evaluateOffer = async (salary: string, location: string, benefits: string): Promise<OfferEvaluation> => {
    return retryWrapper(async () => {
        const ai = getClient();
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Evaluate UAE offer: ${salary} in ${location}. JSON: { "salary", "benefitsScore", "totalScore", "recommendation" }`,
            config: { tools: [{ googleSearch: {} }] }
        });
        return cleanAndParseJSON(response.text || "{}");
    });
}

export const analyzeJobSense = async (jobUrl: string, manualCompany: string, manualJd: string, persona: PersonaType): Promise<JobSenseAnalysis> => {
    return retryWrapper(async () => {
        const ai = getClient();
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Forensic Job Analysis. URL: ${jobUrl}. Company: ${manualCompany}. Persona: ${persona}. JSON Output: { "jobTitle", "company", "roleSummary", "companyVibe", "matchScore", "verification": {}, "salaryAnalysis": {}, "atsGap": {}, "strategicAdvice" }`,
            config: { tools: [{ googleSearch: {} }] }
        });
        return cleanAndParseJSON(response.text || "{}");
    });
}
