
import { GoogleGenAI, Type } from "@google/genai";
import { ABDUL_CV_TEXT, USER_PROFILE } from "../constants";
import { GeneratedContent, JobOpportunity, PersonaType, RecruiterProfile, AgencyProfile, MarketSignal, TechEvent, SentimentAnalysis, OfferEvaluation, SearchFocus, ATSAnalysis } from "../types";

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
    if (retries > 0 && (msg.includes('429') || msg.toLowerCase().includes('quota') || msg.toLowerCase().includes('limit'))) {
      console.warn(`Quota hit. Retrying in ${delay}ms... (${retries} attempts left)`);
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

const cleanAndParseJSON = (text: string) => {
  if (!text) return [];
  try {
    // 1. Remove Markdown code block syntax
    let cleaned = text.replace(/```json\n?|```/g, '').trim();

    // 2. Locate the outer-most JSON array or object
    const arrayStart = cleaned.indexOf('[');
    const objectStart = cleaned.indexOf('{');
    
    let startIndex = -1;
    let endIndex = -1;

    // Determine if we are looking for an Array or Object
    if (arrayStart > -1 && (objectStart === -1 || arrayStart < objectStart)) {
        startIndex = arrayStart;
        // Find the matching closing bracket by counting depth
        let depth = 0;
        for (let i = startIndex; i < cleaned.length; i++) {
            if (cleaned[i] === '[') depth++;
            else if (cleaned[i] === ']') depth--;
            
            if (depth === 0) {
                endIndex = i;
                break;
            }
        }
    } else if (objectStart > -1) {
        startIndex = objectStart;
        // Find the matching closing brace
        let depth = 0;
        for (let i = startIndex; i < cleaned.length; i++) {
            if (cleaned[i] === '{') depth++;
            else if (cleaned[i] === '}') depth--;
            
            if (depth === 0) {
                endIndex = i;
                break;
            }
        }
    }

    if (startIndex > -1 && endIndex > -1) {
        cleaned = cleaned.substring(startIndex, endIndex + 1);
        return JSON.parse(cleaned);
    }

    // Fallback: Try parsing the whole cleaned string if strict extraction failed
    // If it fails, return empty array/object rather than crashing
    try {
        return JSON.parse(cleaned);
    } catch (innerError) {
        console.warn("Direct JSON parse failed, returning empty structure.");
        return cleaned.trim().startsWith('[') ? [] : {};
    }
  } catch (e) {
    console.error("JSON Parse Error. Raw Text:", text);
    // Safe fallback to prevent app crash
    return []; 
  }
};

// --- FOCUS ENGINE ---

const getFocusKeywords = (focus: SearchFocus): string => {
    switch (focus) {
        case SearchFocus.MARKETING: 
            return "AND (Growth OR SEO OR 'Brand Strategy' OR Copywriting OR 'Digital Marketing' OR Campaign)";
        case SearchFocus.CONTENT: 
            return "AND (Content OR 'Creative Director' OR Video OR Storytelling OR Copywriter OR Social)";
        case SearchFocus.TECH_AI: 
            return "AND (AI OR 'Generative AI' OR LLM OR 'Machine Learning' OR Python OR NLP)";
        case SearchFocus.WEB3: 
            return "AND (Web3 OR Blockchain OR Crypto OR DeFi OR Tokenomics OR Solidity OR Wallet)";
        case SearchFocus.PMO: 
            return "AND ('Project Manager' OR 'Product Owner' OR Scrum OR Agile OR Kanban OR Roadmap)";
        case SearchFocus.SAAS: 
            return "AND (SaaS OR B2B OR 'Enterprise Software' OR 'Account Executive' OR Salesforce)";
        case SearchFocus.FINTECH: 
            return "AND (FinTech OR Payments OR Banking OR Trading OR Compliance)";
        case SearchFocus.HEALTH: 
            return "AND (HealthTech OR MedTech OR 'Healthcare IT' OR Biotechnology)";
        case SearchFocus.REAL_ESTATE: 
            return "AND (PropTech OR 'Real Estate' OR Property OR Construction)";
        case SearchFocus.ECOMMERCE: 
            return "AND (E-commerce OR Retail OR Shopify OR 'Supply Chain' OR Logistics)";
        case SearchFocus.CONSTRUCTION: 
            return "AND (Engineering OR Construction OR MEP OR Civil OR Architecture)";
        default: 
            return "";
    }
}

// --- SEARCH AGENTS ---

export const analyzeProfileForSearch = async (userBaseQuery: string): Promise<string> => {
  return retryWrapper(async () => {
      const ai = getClient();
      const prompt = userBaseQuery 
        ? `Merge this user query "${userBaseQuery}" with the candidate's strongest CV attributes to create a ONE high-precision Boolean search query for UAE jobs (0-4 years exp).`
        : `Analyze CV and generate ONE high-precision Boolean search query for best-fit UAE jobs (0-4 years exp).`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `${prompt}
        CV Summary: ${ABDUL_CV_TEXT.substring(0, 1000)}
        
        RULES:
        1. If user query is provided, it MUST be the core of the search.
        2. Add specific skills from CV (e.g. AI, Web3, SEO) that MATCH the user query.
        3. ENFORCE LOCATION: "United Arab Emirates" OR "Dubai" OR "Abu Dhabi" OR "Sharjah".
        4. ENFORCE EXPERIENCE: Exclude "Senior", "Head", "Director", "VP". Target "Associate", "Specialist", "Manager" (if <5 years).
        
        Output: Query string only. No markdown.
        Example Input: "Marketing" -> Output: "("Marketing Specialist" OR "Growth Associate") AND (AI OR Web3) AND (Dubai OR Abu Dhabi) -Senior -Director"`
      });
      return response.text?.trim().replace(/["']/g, "").replace(/`/g, "") || userBaseQuery + " UAE";
  });
};

export const searchJobsInUAE = async (query: string, focus: SearchFocus = SearchFocus.ALL): Promise<JobOpportunity[]> => {
  return retryWrapper(async () => {
      const ai = getClient();
      
      const focusKeywords = getFocusKeywords(focus);
      
      // Using site: operators to force real results from indexed pages
      // Expanded list of sites based on new requirements
      const searchOperators = "site:linkedin.com/jobs OR site:naukrigulf.com OR site:bayt.com OR site:gulftalent.com OR site:indeed.com OR site:laimoon.com OR site:hub71.com/careers OR site:oliv.com OR site:dubizzle.com/jobs";

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Find 30 REAL, LIVE job listings in the UAE matching: "${query} ${focusKeywords}".
        Use these operators: ${searchOperators}.
        
        STRICT CRITERIA:
        1. LOCATION: MUST be in UAE (Dubai, Abu Dhabi, Sharjah, etc). Exclude "Remote" if implies outside UAE.
        2. EXPERIENCE LEVEL: 0-4 Years. Exclude "Senior Manager" (5+ yrs), "Director", "VP", "Head of". Target "Associate", "Junior", "Specialist", "Officer", or "Manager" (only if <5 years requirement).
        3. ZERO HALLUCINATIONS: If you cannot find a specific deep link, return null for 'url'. Do NOT invent URLs.
        4. SALARY PROJECTION: If salary is hidden, ESTIMATE it based on the Role + Company Tier + UAE Market Data (e.g. "Est. AED 12k-18k").
        5. DIVERSE SOURCES: Do not just use LinkedIn. Look for listings on Bayt, Naukrigulf, and Company Career pages.
        
        JSON Output: [{ "title", "company", "location", "source", "url", "search_query", "applyUrl", "applyEmail", "description", "salaryEstimate" }]`,
        config: { tools: [{ googleSearch: {} }] }
      });
      const rawJobs = cleanAndParseJSON(response.text || "[]");
      if (!Array.isArray(rawJobs)) return [];

      // PRODUCTION HARDENING: De-duplicate and filter low quality results
      const seen = new Set<string>();
      const uniqueJobs = rawJobs.filter((job: any) => {
          // Create a signature key based on title and company
          const key = `${job.title?.toLowerCase().trim()}|${job.company?.toLowerCase().trim()}`;
          
          // Filter out duplicates
          if (seen.has(key)) return false;
          
          // Filter out bad results
          if (!job.title || job.title.toLowerCase().includes('not found') || job.title.toLowerCase().includes('job title')) return false;
          if (!job.company) return false;

          seen.add(key);
          return true;
      });

      return uniqueJobs.map((job: any) => ({
        id: Math.random().toString(36).substr(2, 9),
        title: job.title,
        company: job.company,
        location: job.location || "UAE",
        source: job.source || "Web Search",
        url: job.url || null, // Trust the AI's null judgment
        search_query: job.search_query || `site:linkedin.com/jobs "${job.title}" "${job.company}" UAE`,
        applyUrl: job.applyUrl || null,
        applyEmail: job.applyEmail || null,
        description: job.description,
        salaryEstimate: job.salaryEstimate || "AED Market Rate",
        dateFound: new Date().toISOString(),
        status: 'found'
      }));
  });
};

// --- INTELLIGENCE AGENTS ---

export const analyzeMarketSignals = async (): Promise<MarketSignal[]> => {
    return retryWrapper(async () => {
        const ai = getClient();
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Deep search UAE Business News (last 14 days only) for Hiring Signals.
            Sources: Wamda, Magnitt, Zawya, Gulf Business, Arabian Business, The National, Edge Middle East, DIFC News, TradeArabia, MEED.
            
            Constraint: MUST be UAE-based entities or Global entities expanding specifically into UAE.
            
            Look for:
            1. Funding Rounds (Series A/B)
            2. New Office Openings (DIFC, ADGM, DMCC)
            3. Product Launches (AI/Web3)
            4. Contract Wins (Govt/Enterprise)
            5. Executive Hires (New CTO/CMO usually means team expansion)
            6. Stealth Startups emerging in Hub71/In5.
            
            CRITICAL: OUTPUT STRICT JSON ARRAY ONLY. If no signals found, return []. Do not write explanations.
            JSON Output: [{ "company", "signalType", "summary", "actionableLeads": ["Role1", "Role2"] }]`,
            config: { tools: [{ googleSearch: {} }] }
        });
        const data = cleanAndParseJSON(response.text || "[]");
        return Array.isArray(data) ? data.map((s:any) => ({...s, id: Math.random().toString(), dateDetected: new Date().toISOString()})) : [];
    });
};

export const findTechEvents = async (): Promise<TechEvent[]> => {
    return retryWrapper(async () => {
        const ai = getClient();
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Find 20+ upcoming Tech/Business events in Dubai, Abu Dhabi & Sharjah (Next 60 days).
            Sources: Platinumlist, Eventbrite UAE, Meetup, DIFC Hive, Step Conference, Gitex, In5, Astrolabs, DWTC.
            
            Constraint: Physical events in UAE only.
            
            CRITICAL: OUTPUT STRICT JSON ARRAY ONLY. If no events found, return [].
            JSON Output: [{ "name", "date", "location", "type", "url", "keyAttendees": [] }]`,
            config: { tools: [{ googleSearch: {} }] }
        });
        const data = cleanAndParseJSON(response.text || "[]");
        return Array.isArray(data) ? data.map((e:any) => ({...e, id: Math.random().toString()})) : [];
    });
};

// --- RECRUITER AGENTS ---

export const findRecruiters = async (company: string, focus: SearchFocus, excludedNames: string[] = []): Promise<RecruiterProfile[]> => {
  return retryWrapper(async () => {
      const ai = getClient();
      const excludeStr = excludedNames.length > 0 ? `Exclude names: ${excludedNames.join(', ')}.` : "";
      
      let roleKeywords = "Recruiter OR Talent Acquisition OR HR";
      
      // Map Focus to specific Recruiter Titles
      switch (focus) {
          case SearchFocus.TECH_AI:
          case SearchFocus.WEB3:
            roleKeywords = "Technical Recruiter OR CTO OR VP Engineering OR 'Head of Talent'";
            break;
          case SearchFocus.MARKETING:
          case SearchFocus.CONTENT:
            roleKeywords = "CMO OR 'Head of Marketing' OR 'Creative Director' OR 'Marketing Recruiter'";
            break;
          case SearchFocus.PMO:
             roleKeywords = "'Head of Product' OR CPO OR 'Program Director' OR 'Head of Projects'";
             break;
          case SearchFocus.FINTECH:
             roleKeywords = "'Head of FinTech' OR 'Payments Lead' OR 'Talent Acquisition Finance'";
             break;
          default:
             roleKeywords = "Recruiter OR 'Talent Acquisition' OR 'Hiring Manager'";
      }

      const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: `Find 5 Key Hiring People at ${company} in UAE matching: ${roleKeywords}.
          ${excludeStr}
          
          Use X-Ray Search Logic (site:linkedin.com/in).
          Constraint: MUST be based in UAE (Dubai/Abu Dhabi). Do not return global heads in UK/USA.
          
          CRITICAL RULES:
          1. DO NOT GUESS EMAILS. If not publicly found, return null.
          2. DO NOT GUESS LINKEDIN URLs. If not confirmed, return null.
          3. Categorize: A (Decision Maker/Head), B (Recruiter), C (HR Admin).
          4. OUTPUT STRICT JSON ARRAY ONLY. If no one is found, return []. DO NOT write "I couldn't find...".
          
          JSON Output: [{ "name", "role", "company", "email", "linkedin", "profileSnippet", "category" }]`,
          config: { tools: [{ googleSearch: {} }] }
      });
      return cleanAndParseJSON(response.text || "[]");
  });
};

export const analyzeRecruiterReply = async (replyText: string): Promise<SentimentAnalysis> => {
    return retryWrapper(async () => {
        const ai = getClient();
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Analyze recruiter email: "${replyText}".
            JSON Output: { "sentiment": "Positive"|"Neutral"|"Negative", "suggestedTone", "analysis", "draftReply" }`,
            config: { responseMimeType: "application/json" }
        });
        return JSON.parse(response.text || "{}");
    });
};

export const generateRecruiterMessage = async (recruiterName: string, company: string, persona: PersonaType): Promise<string> => {
    return retryWrapper(async () => {
        const ai = getClient();
        const website = USER_PROFILE.websites[persona];
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Write a high-impact LinkedIn connection note (max 300 chars) to ${recruiterName} at ${company} (UAE).
            Sender: Abdul Hakeem (${persona}). Link: ${website}.
            
            STYLE: "Hook-Value-Ask".
            - Hook: Mention ${company}'s recent UAE growth/news.
            - Value: Mention "$2M funding secured" or "40% MQL growth".
            - Ask: "Open to connecting?"`
        });
        return response.text || "";
    });
};

export const generateWhatsAppMessage = async (name: string, company: string, role: string): Promise<string> => {
    return retryWrapper(async () => {
        const ai = getClient();
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Write a short, casual but professional WhatsApp message to ${name} (${role} at ${company}).
            Context: I applied for a role / want to connect regarding opportunities.
            Tone: Polite, brief, no fluff. Max 2 sentences.
            Output: Plain text message.`
        });
        return response.text || "";
    });
}

// --- AGENCY AGENTS ---

export const findAgencies = async (focus: SearchFocus, excludedNames: string[] = []): Promise<AgencyProfile[]> => {
    return retryWrapper(async () => {
        const ai = getClient();
        const focusKeywords = getFocusKeywords(focus);
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Find 15 UAE Recruitment Agencies specializing in: ${focus}. 
            Keywords to match: ${focusKeywords}.
            Exclude: ${excludedNames.join(',')}.
            Sources: LinkedIn, Google Maps, Agency Directories.
            
            Constraint: Physical presence in Dubai or Abu Dhabi.
            
            CRITICAL: OUTPUT STRICT JSON ARRAY ONLY. If none found, return [].
            JSON Output: [{ "name", "focus", "email", "phone", "website", "location" }]`,
            config: { tools: [{ googleSearch: {} }] }
        });
        return cleanAndParseJSON(response.text || "[]");
    });
}

export const draftAgencyOutreach = async (agency: AgencyProfile, persona: PersonaType): Promise<string> => {
    return retryWrapper(async () => {
        const ai = getClient();
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Write a cold email to ${agency.name} (UAE Agency). Focus: ${agency.focus}.
            Persona: ${persona}.
            Style: Professional, Confident, Direct.
            Goal: Get on their candidate roster for UAE roles.`
        });
        return response.text || "";
    });
}

// --- APPLICATION AGENTS ---

export const recommendPersona = async (jobDescription: string): Promise<PersonaType> => {
    return retryWrapper(async () => {
        const ai = getClient();
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Analyze JD: "${jobDescription.substring(0, 500)}".
            Best Persona? Options: Marketing, PMO, Ult. Output ONE word.`
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
            model: 'gemini-2.5-flash',
            contents: `Analyze my fit for this JD.
            CV: ${ABDUL_CV_TEXT.substring(0, 1000)}.
            JD: ${jobDescription.substring(0, 1000)}.

            Task:
            1. Calculate a Match Score (0-100) based on keyword overlap.
            2. List CRITICAL missing keywords/skills found in JD but not in CV.
            3. List strengths.

            JSON Output: { "matchScore": number, "missingKeywords": string[], "strengths": string[], "summary": string }`,
            config: { responseMimeType: "application/json" }
        });
        return JSON.parse(response.text || "{}");
    });
}

export const generateResumeBullet = async (missingKeyword: string, jobTitle: string): Promise<string> => {
    return retryWrapper(async () => {
        const ai = getClient();
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Generate ONE high-impact resume bullet point for Abdul Hakeem's CV to address the missing skill: "${missingKeyword}".
            Target Role: ${jobTitle}.
            Context: Use his existing experience (${ABDUL_CV_TEXT.substring(0, 500)}) but frame it to highlight ${missingKeyword}.
            Rule: Start with a strong verb. Use metrics if possible. Max 20 words.`
        });
        return response.text?.trim() || "";
    });
}

export const generateApplicationMaterials = async (jobDescription: string, persona: PersonaType): Promise<GeneratedContent> => {
  return retryWrapper(async () => {
      const ai = getClient();
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Write Application (Cover Letter + Email) for Abdul Hakeem.
        Persona: ${persona}.
        CV Highlights: ${ABDUL_CV_TEXT.substring(0, 800)}.
        JD: ${jobDescription.substring(0, 800)}.
        
        CRITICAL "HUMANE" WRITING RULES:
        1. BAN THE PHRASE "I am writing to apply". Start with a "Hook" about the company/industry in UAE.
        2. BAN CORPORATE FLUFF ("thrilled", "esteemed", "perfect fit"). Use strong verbs ("Deployed", "Scaled", "Built").
        3. INJECT METRICS: You MUST use the numbers from the CV ($2M funding, 40% MQLs, 150% traffic).
        4. TONE: Professional equal, not a desperate applicant.
        5. CONCISENESS: Keep the 'emailDraft' strictly under 150 words to ensure compatibility with mailto links.
        
        JSON Output: { "emailSubject", "coverLetter", "emailDraft", "fitScore", "reasoning" }`,
        config: { responseMimeType: "application/json" }
      });
      return JSON.parse(response.text || "{}");
  });
};

export const refineContent = async (content: GeneratedContent, instruction: string): Promise<GeneratedContent> => {
    return retryWrapper(async () => {
        const ai = getClient();
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Refine this content. Instruction: ${instruction}. JSON: ${JSON.stringify(content)}`,
            config: { responseMimeType: "application/json" }
        });
        return JSON.parse(response.text || "{}");
    });
};

// --- CLOSING AGENTS ---

export const generateInterviewBrief = async (job: JobOpportunity): Promise<string> => {
    return retryWrapper(async () => {
        const ai = getClient();
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Create 1-page Interview Brief for ${job.title} at ${job.company} (UAE).
            Sections: Company Mission, Key Talking Points (Map CV to JD), 3 Smart Questions for Interviewer.`,
            config: { tools: [{ googleSearch: {} }] }
        });
        return response.text || "Error generating brief.";
    });
}

export const evaluateOffer = async (salary: string, location: string, benefits: string): Promise<OfferEvaluation> => {
    return retryWrapper(async () => {
        const ai = getClient();
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Evaluate UAE Job Offer. Salary: ${salary}. Location: ${location}. Benefits: ${benefits}.
            Compare against UAE cost of living for that specific emirate.
            JSON Output: { "salary": number, "currency": "AED", "benefitsScore": number, "commuteMinutes": number, "growthPotential": number, "totalScore": number, "recommendation": "string" }`,
            config: { responseMimeType: "application/json" }
        });
        return JSON.parse(response.text || "{}");
    });
}
