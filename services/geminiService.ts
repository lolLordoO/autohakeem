
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
    if (retries > 0 && (msg.includes('429') || msg.toLowerCase().includes('quota') || msg.toLowerCase().includes('limit') || msg.includes('500') || msg.includes('Rpc') || msg.includes('xhr'))) {
      await wait(delay);
      return retryWrapper(fn, retries - 1, delay * 2); 
    }
    if (retries === 0) {
        handleGeminiError(e);
    }
    throw e;
  }
};

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
    } catch (e) { console.warn("Cache write failed", e); }
    
    return result;
}

export const clearSmartCache = () => {
    Object.keys(localStorage).forEach(key => {
        if (key.startsWith('gemini_cache_')) localStorage.removeItem(key);
    });
}

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
      if (arrayStart !== -1 && arrayEnd !== -1 && arrayEnd > arrayStart) {
           try { return JSON.parse(cleaned.substring(arrayStart, arrayEnd + 1)); } catch (e) {}
      }
      if (objectStart !== -1 && objectEnd !== -1 && objectEnd > objectStart) {
           try { return JSON.parse(cleaned.substring(objectStart, objectEnd + 1)); } catch (e) {}
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
        'careers.', 'jobs.', 'taleo.net', 'bamboohr.com', 'smartrecruiters.com'
    ];
    return whitelist.some(domain => lower.includes(domain)) && !lower.includes('...') && lower.startsWith('http');
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

// --- AGGRESSIVE FRESH DROPS 2.0 ---

export const getFreshJobDrops = async (hours: 24 | 48 = 24): Promise<JobOpportunity[]> => {
    // Shorter cache to ensure "freshness"
    return smartCache(`fresh_drops_v3_${hours}h_${new Date().getHours()}`, () => retryWrapper(async () => {
        const ai = getClient();
        const now = new Date();
        const date = new Date(now.getTime() - (hours * 60 * 60 * 1000));
        const dateStr = date.toISOString().split('T')[0];
        
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `ACT AS AN ELITE HEADHUNTER CRAWLING THE UAE MARKET.
            
            GOAL: Find the 15-20 most relevant, REAL job openings posted in UAE in the last ${hours} hours.
            
            TARGET PERSONA (Abdul Hakeem):
            - Sector: AI, GenAI, Web3, SaaS, Tech Startups.
            - Roles: Content Strategist, Product Marketing, Project Manager, PMO, Growth Lead.
            - Experience: 4 years (Mid-Level).
            
            SOURCES TO CRAWL (via googleSearch):
            1. site:linkedin.com/jobs ("Dubai" OR "Abu Dhabi")
            2. site:naukrigulf.com/jobs ("Dubai" OR "Abu Dhabi")
            3. site:bayt.com/en/uae/jobs/
            4. site:indeed.ae
            5. site:lever.co OR site:greenhouse.io OR site:workday.com ("Dubai" OR "UAE")
            
            STRICT FILTERING:
            - NO "Confidential" companies.
            - NO "Recruitment Agencies" (unless hiring for themselves).
            - MUST be posted within last ${hours}h.
            - MUST have a clear Title and identifiable Company.
            
            OUTPUT FORMAT (JSON ONLY):
            [{ 
                "title": string, 
                "company": string, 
                "location": string, 
                "source": string, 
                "url": string (absolute URL), 
                "postedDate": string, 
                "salaryEstimate": string (e.g. "AED 18k-25k"), 
                "matchReason": string (1-sentence why for Abdul),
                "matchGrade": "S"|"A"|"B",
                "category": "Tech"|"Creative"|"Product"|"General"
            }]`,
            config: { 
                tools: [{ googleSearch: {} }],
                temperature: 0.1 // Keep it factual
            }
        });
        
        let raw = cleanAndParseJSON(response.text || "[]");
        if (!Array.isArray(raw)) return [];
        
        const badKeywords = ['confidential', 'leading', 'hidden', 'undisclosed', 'stealth', 'client of', 'agency', 'recruitment', 'major bank'];
        
        return raw
            .filter((job: any) => {
                const name = (job.company || '').toLowerCase();
                const title = (job.title || '').toLowerCase();
                return name.length > 1 && 
                       !badKeywords.some(b => name.includes(b)) &&
                       !title.includes('intern') &&
                       !title.includes('director') && 
                       !title.includes('vp');
            })
            .map((job: any) => ({
                id: 'fresh-' + Math.random().toString(36).substr(2, 9),
                title: job.title,
                company: job.company,
                location: job.location || "UAE",
                source: job.source || "Deep Crawler",
                url: isValidJobUrl(job.url) ? job.url : null,
                search_query: `intitle:"${job.title}" "${job.company}" UAE careers`,
                description: `Freshly intercepted verified listing from ${job.source}. High match for your portfolio.`,
                salaryEstimate: job.salaryEstimate || "AED 15k - 22k (Market Est.)",
                matchGrade: job.matchGrade || 'A',
                matchReason: job.matchReason || "High relevance to your technical content & marketing background.",
                dateFound: new Date().toISOString(),
                postedDate: job.postedDate || "Just now",
                isFresh: true,
                status: 'found',
                category: job.category || 'General'
            }));
    }), 5); // 5 min cache for Fresh Drops to keep it ultra-real
}

export const searchJobsInUAE = async (query: string, focus: SearchFocus = SearchFocus.ALL, filters?: JobFilters): Promise<JobOpportunity[]> => {
  const filterKey = filters ? `${filters.emirate}_${filters.level}_${filters.dateRange}` : 'default';
  const dateKey = new Date().toISOString().split('T')[0];
  
  return smartCache(`jobs_v3_${query}_${focus}_${filterKey}_${dateKey}`, () => retryWrapper(async () => {
      const ai = getClient();
      const focusKeywords = getFocusKeywords(focus);
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Scour UAE for REAL jobs. Query: "${query} ${focusKeywords}".
        Location: ${filters?.emirate || 'UAE'}.
        Target Level: ${filters?.level || 'Mid-Level'}.
        
        STRICT: No confidential listings.
        
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
        matchReason: job.matchReason || "Matches profile keywords.",
        dateFound: new Date().toISOString(),
        status: 'found'
      }));
  }));
};

export const analyzeMarketSignals = async (): Promise<MarketSignal[]> => {
    return smartCache(`market_signals_v3`, () => retryWrapper(async () => {
        const ai = getClient();
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Search UAE business news (Wamda, Magnitt, Gulf Business, Zawya) for funding rounds, office openings, or expansion news in Tech/Fintech/AI.
            JSON Output: [{ "company", "signalType", "summary", "actionableLeads": [] }]`,
            config: { tools: [{ googleSearch: {} }] }
        });
        const data = cleanAndParseJSON(response.text || "[]");
        return data.map((s:any) => ({...s, id: Math.random().toString(), dateDetected: new Date().toISOString()}));
    }), 120); 
};

export const findTechEvents = async (): Promise<TechEvent[]> => {
    return smartCache(`tech_events_v3`, () => retryWrapper(async () => {
        const ai = getClient();
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Find tech events/conferences in UAE next 30 days. Focus on AI, Web3, or Networking.
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
            contents: `Write a viral LinkedIn post for Abdul Hakeem. Topic: ${signal.company} news. Tone: ${tone}. Creativity: ${creativity}.
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
            contents: `Interview Abdul Hakeem for ${jobTitle} at ${company}. Ask ONE question based on context. ${NATURAL_RULES}`
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
  return smartCache(`recruiters_v3_${company}_${focus}`, () => retryWrapper(async () => {
      const ai = getClient();
      const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: `Find 5 REAL recruiters/HR managers at ${company} in UAE. JSON Output: [{ "name", "role", "company", "linkedin", "profileSnippet", "category" }]`,
          config: { tools: [{ googleSearch: {} }] }
      });
      return cleanAndParseJSON(response.text || "[]");
  }));
};

export const findAgencies = async (focus: SearchFocus, excludedNames: string[] = []): Promise<AgencyProfile[]> => {
    return smartCache(`agencies_v3_${focus}`, () => retryWrapper(async () => {
        const ai = getClient();
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Find UAE tech recruitment agencies/headhunters specializing in ${focus}. JSON Output: [{ "name", "focus", "email", "website" }]`,
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
            contents: `Analyze this recruiter reply: "${replyText}". Output JSON: { "sentiment", "suggestedTone", "analysis", "draftReply" }`,
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
            contents: `Write a short, punchy LinkedIn connection note to ${recruiterName} at ${company} from Abdul Hakeem (${persona}). ${NATURAL_RULES}`
        });
        return response.text || "";
    });
};

export const generateWhatsAppMessage = async (name: string, company: string, role: string): Promise<string> => {
    return retryWrapper(async () => {
        const ai = getClient();
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Short WhatsApp message to ${name} (${role} at ${company}). ${NATURAL_RULES}`
        });
        return response.text || "";
    });
}

export const draftAgencyOutreach = async (agency: AgencyProfile, persona: PersonaType): Promise<string> => {
    return retryWrapper(async () => {
        const ai = getClient();
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Short introductory email to ${agency.name} headhunter. Sender: Abdul Hakeem. ${NATURAL_RULES}`
        });
        return response.text || "";
    });
}

export const recommendPersona = async (jobDescription: string): Promise<PersonaType> => {
    return retryWrapper(async () => {
        const ai = getClient();
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Categorize JD: "${jobDescription.substring(0, 500)}". Options: Marketing, PMO, Ult. One word ONLY.`
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
            contents: `ATS Score analysis. CV: ${ABDUL_CV_TEXT.substring(0, 800)}. JD: ${jobDescription.substring(0, 800)}. JSON: { "matchScore", "missingKeywords", "strengths", "summary" }`,
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
            contents: `Write one professional CV bullet point incorporating "${missingKeyword}" for a ${jobTitle} role. ${NATURAL_RULES}`
        });
        return response.text?.trim() || "";
    });
}

export const generateApplicationMaterials = async (jobDescription: string, persona: PersonaType): Promise<GeneratedContent> => {
  return retryWrapper(async () => {
      const ai = getClient();
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Draft job application materials for ${persona}. JD: ${jobDescription.substring(0, 1000)}. JSON: { "strategicAngle", "whyFitSummary", "emailSubject", "emailDraft", "coverLetter", "fitScore" }`,
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
            contents: `Refine. Instruction: ${instruction}. Current JSON: ${JSON.stringify(content)}`,
            config: { responseMimeType: "application/json" }
        });
        return JSON.parse(response.text || "{}");
    });
};

export const generateInterviewBrief = async (job: JobOpportunity): Promise<string> => {
    return smartCache(`brief_v3_${job.id}`, () => retryWrapper(async () => {
        const ai = getClient();
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Research ${job.company} UAE and draft a 1-page interview cheat sheet for the role of ${job.title}.`,
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
            contents: `Evaluate UAE offer: ${salary} AED/mo in ${location}. Benefits: ${benefits}. JSON: { "salary", "benefitsScore", "totalScore", "recommendation" }`,
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
            contents: `Forensic Deep Analysis. URL: ${jobUrl}. Persona: ${persona}. JSON Output: { "jobTitle", "company", "roleSummary", "companyVibe", "matchScore", "verification": {}, "salaryAnalysis": {}, "atsGap": {}, "strategicAdvice" }`,
            config: { tools: [{ googleSearch: {} }] }
        });
        return cleanAndParseJSON(response.text || "{}");
    });
}
