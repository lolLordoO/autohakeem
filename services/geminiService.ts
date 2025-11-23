
import { GoogleGenAI, Type } from "@google/genai";
import { ABDUL_CV_TEXT, USER_PROFILE } from "../constants";
import { GeneratedContent, JobOpportunity, PersonaType, RecruiterProfile, AgencyProfile, MarketSignal, TechEvent, SentimentAnalysis, OfferEvaluation, SearchFocus, ATSAnalysis, LinkedInTone } from "../types";

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

// --- SMART CACHE LAYER ---
// Wraps API calls to prevent quota usage for identical requests
const smartCache = async <T>(key: string, fn: () => Promise<T>, ttlMin = 60): Promise<T> => {
    const cacheKey = `gemini_cache_${key}`;
    try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
            const { data, expiry } = JSON.parse(cached);
            if (new Date().getTime() < expiry) {
                // console.log(`[SmartCache] Hit: ${key}`);
                return data;
            }
        }
    } catch (e) { console.warn("Cache read failed", e); }

    // console.log(`[SmartCache] Miss: ${key}`);
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

// "The Iron Parser": A robust stack-based JSON extractor
const cleanAndParseJSON = (text: string) => {
  if (!text) return [];
  
  // 1. Remove Markdown code blocks
  let cleaned = text.replace(/```json\n?|```/g, '').trim();

  // 2. Try simple parse first
  try {
      return JSON.parse(cleaned);
  } catch (e) {
      // 3. Fallback: Locate the first '[' or '{' and the last ']' or '}'
      const arrayStart = cleaned.indexOf('[');
      const objectStart = cleaned.indexOf('{');
      const arrayEnd = cleaned.lastIndexOf(']');
      const objectEnd = cleaned.lastIndexOf('}');

      let jsonString = '';

      if (arrayStart !== -1 && arrayEnd !== -1) {
           // It's likely an array
           jsonString = cleaned.substring(arrayStart, arrayEnd + 1);
      } else if (objectStart !== -1 && objectEnd !== -1) {
           // It's likely an object
           jsonString = cleaned.substring(objectStart, objectEnd + 1);
      }

      if (jsonString) {
          try {
              return JSON.parse(jsonString);
          } catch (innerE) {
              console.warn("Extracted JSON failed to parse. Returning empty structure.");
              return jsonString.trim().startsWith('[') ? [] : {};
          }
      }
      
      console.warn("No valid JSON structure found in response. Returning empty array.");
      return [];
  }
};

// URL Validator
const isValidJobUrl = (url: string | undefined): boolean => {
    if (!url) return false;
    const lower = url.toLowerCase();
    const whitelist = [
        'linkedin.com', 'indeed.com', 'naukrigulf.com', 'bayt.com', 
        'gulftalent.com', 'oliv.com', 'hub71.com', 'laimoon.com',
        'lever.co', 'greenhouse.io', 'workday.com', 'oraclecloud.com',
        'careers.', 'jobs.'
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

// --- SEARCH AGENTS ---

export const analyzeProfileForSearch = async (userBaseQuery: string): Promise<string> => {
  return smartCache(`profile_analysis_${userBaseQuery}`, () => retryWrapper(async () => {
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
        
        Output: Query string only. No markdown.`
      });
      return response.text?.trim().replace(/["']/g, "").replace(/`/g, "") || userBaseQuery + " UAE";
  }));
};

export const searchJobsInUAE = async (query: string, focus: SearchFocus = SearchFocus.ALL): Promise<JobOpportunity[]> => {
  return smartCache(`jobs_${query}_${focus}`, () => retryWrapper(async () => {
      const ai = getClient();
      
      const focusKeywords = getFocusKeywords(focus);
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
        5. VERDICT: Assign a MatchGrade 'S' (Perfect), 'A' (Great), 'B' (Good), 'C' (Average) based on fit for an AI/Web3/Marketing professional.
        
        JSON Output ONLY: [{ "title", "company", "location", "source", "url", "search_query", "applyUrl", "applyEmail", "description", "salaryEstimate", "matchGrade": "S"|"A"|"B"|"C" }]`,
        config: { tools: [{ googleSearch: {} }] }
      });
      const rawJobs = cleanAndParseJSON(response.text || "[]");
      if (!Array.isArray(rawJobs)) return [];

      const seen = new Set<string>();
      const uniqueJobs = rawJobs.filter((job: any) => {
          const key = `${job.title?.toLowerCase().trim()}|${job.company?.toLowerCase().trim()}`;
          if (seen.has(key)) return false;
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
        url: isValidJobUrl(job.url) ? job.url : null,
        search_query: job.search_query || `site:linkedin.com/jobs "${job.title}" "${job.company}" UAE`,
        applyUrl: isValidJobUrl(job.applyUrl) ? job.applyUrl : null,
        applyEmail: job.applyEmail || null,
        description: job.description,
        salaryEstimate: job.salaryEstimate || "AED Market Rate",
        matchGrade: job.matchGrade || 'B',
        dateFound: new Date().toISOString(),
        status: 'found'
      }));
  }));
};

// --- INTELLIGENCE AGENTS ---

export const analyzeMarketSignals = async (): Promise<MarketSignal[]> => {
    // Cache for 4 hours as market news doesn't change by the minute
    return smartCache(`market_signals`, () => retryWrapper(async () => {
        const ai = getClient();
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Deep search UAE Business News (LAST 30 DAYS) for Hiring Signals.
            Sources: Wamda, Magnitt, Zawya, Gulf Business, Arabian Business, The National, Edge Middle East, DIFC News, TradeArabia, MEED.
            Constraint: MUST be UAE-based entities or Global entities expanding specifically into UAE.
            Look for: Funding Rounds, New Office Openings, Product Launches, Contract Wins, Executive Hires, Stealth Startups.
            CRITICAL: OUTPUT STRICT JSON ARRAY ONLY. NO EXPLANATIONS.
            JSON Output: [{ "company", "signalType", "summary", "actionableLeads": ["Role1", "Role2"] }]`,
            config: { tools: [{ googleSearch: {} }] }
        });
        const data = cleanAndParseJSON(response.text || "[]");
        return Array.isArray(data) ? data.map((s:any) => ({...s, id: Math.random().toString(), dateDetected: new Date().toISOString()})) : [];
    }), 240); 
};

export const findTechEvents = async (): Promise<TechEvent[]> => {
    return smartCache(`tech_events`, () => retryWrapper(async () => {
        const ai = getClient();
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Find 15+ upcoming Tech/Business events, Meetups, or Workshops in Dubai, Abu Dhabi & Sharjah.
            Sources: Platinumlist, Eventbrite UAE, Meetup, DIFC Hive, Step Conference, Gitex, In5, Astrolabs.
            Constraint: Physical events in UAE only.
            CRITICAL: OUTPUT STRICT JSON ARRAY ONLY. NO EXPLANATIONS.
            JSON Output: [{ "name", "date", "location", "type", "url", "keyAttendees": [] }]`,
            config: { tools: [{ googleSearch: {} }] }
        });
        const data = cleanAndParseJSON(response.text || "[]");
        return Array.isArray(data) ? data.map((e:any) => ({...e, id: Math.random().toString()})) : [];
    }), 240);
};

// --- BRAND ENGINE (LinkedIn Ghostwriter) ---

export const generateLinkedInPost = async (signal: MarketSignal, tone: LinkedInTone): Promise<string> => {
    return retryWrapper(async () => {
        const ai = getClient();
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Act as a Top Tier LinkedIn Ghostwriter for Abdul Hakeem (AI & Web3 Strategist in UAE).
            Task: Write a viral LinkedIn post based on this market signal:
            "${signal.company} - ${signal.summary}"
            
            Tone: ${tone}
            
            Structure:
            1. The Hook (Stop the scroll).
            2. The Insight (Why this matters for UAE tech ecosystem).
            3. The Expert Take (Connect it to AI, Web3, or Growth Strategy).
            4. The Question (Engagement bait).
            
            Constraints:
            - Use short paragraphs (bro-etry style).
            - Include 3 relevant hashtags.
            - No "I am excited to announce". Be value-driven.`
        });
        return response.text || "";
    });
};

// --- MOCK INTERVIEW DOJO ---

export const getInterviewQuestion = async (jobTitle: string, company: string, history: any[]): Promise<string> => {
    return retryWrapper(async () => {
        const ai = getClient();
        const context = history.map(m => `${m.role}: ${m.text}`).join('\n');
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Act as a Tough Senior Recruiter at ${company} interviewing a candidate for ${jobTitle}.
            Current Conversation:
            ${context}
            
            Task: Ask the NEXT question.
            - If this is the start, ask a behavioral opener (Tell me about yourself / Why ${company}).
            - If the candidate answered, dig deeper or move to technical/strategy competence.
            - Be professional but challenging.
            
            Output: Just the question text.`
        });
        return response.text || "Tell me about yourself and why you fit this role.";
    });
};

export const critiqueAnswer = async (question: string, answer: string): Promise<string> => {
    return retryWrapper(async () => {
        const ai = getClient();
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Critique this interview answer.
            Question: ${question}
            Answer: ${answer}
            
            Provide:
            1. Rating (0-10).
            2. What was good.
            3. What was weak (red flags).
            4. How to improve it (concise tip).
            
            Keep it constructive and brief (max 3 sentences).`
        });
        return response.text || "";
    });
};

// --- RECRUITER & AGENCY ---

export const findRecruiters = async (company: string, focus: SearchFocus, excludedNames: string[] = []): Promise<RecruiterProfile[]> => {
  return smartCache(`recruiters_${company}_${focus}`, () => retryWrapper(async () => {
      const ai = getClient();
      const excludeStr = excludedNames.length > 0 ? `Exclude names: ${excludedNames.join(', ')}.` : "";
      let roleKeywords = "Recruiter OR Talent Acquisition OR HR";
      // ... (existing switch logic logic) ...
      switch (focus) {
          case SearchFocus.TECH_AI:
          case SearchFocus.WEB3: roleKeywords = "Technical Recruiter OR CTO OR VP Engineering OR 'Head of Talent'"; break;
          case SearchFocus.MARKETING:
          case SearchFocus.CONTENT: roleKeywords = "CMO OR 'Head of Marketing' OR 'Creative Director'"; break;
          case SearchFocus.PMO: roleKeywords = "'Head of Product' OR CPO OR 'Program Director'"; break;
          default: roleKeywords = "Recruiter OR 'Talent Acquisition' OR 'Hiring Manager'";
      }

      const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: `Find 5 Key Hiring People at ${company} in UAE matching: ${roleKeywords}.
          ${excludeStr}
          Use X-Ray Search Logic (site:linkedin.com/in).
          Constraint: MUST be based in UAE.
          CRITICAL: OUTPUT STRICT JSON ONLY. NO CHAT.
          JSON Output: [{ "name", "role", "company", "email", "linkedin", "profileSnippet", "category", "recentPostSnippet" }]`,
          config: { tools: [{ googleSearch: {} }] }
      });
      return cleanAndParseJSON(response.text || "[]");
  }));
};

export const findAgencies = async (focus: SearchFocus, excludedNames: string[] = []): Promise<AgencyProfile[]> => {
    return smartCache(`agencies_${focus}`, () => retryWrapper(async () => {
        const ai = getClient();
        const focusKeywords = getFocusKeywords(focus);
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Find 15 UAE Recruitment Agencies specializing in: ${focus}. 
            Keywords to match: ${focusKeywords}.
            Exclude: ${excludedNames.join(',')}.
            Sources: LinkedIn, Google Maps, Agency Directories.
            Constraint: Physical presence in Dubai/Abu Dhabi.
            CRITICAL: OUTPUT STRICT JSON ARRAY ONLY.
            JSON Output: [{ "name", "focus", "email", "phone", "website", "location", "activeRoles": [] }]`,
            config: { tools: [{ googleSearch: {} }] }
        });
        return cleanAndParseJSON(response.text || "[]");
    }));
}

// ... (keep existing exports: analyzeRecruiterReply, generateRecruiterMessage, generateWhatsAppMessage, draftAgencyOutreach, recommendPersona, analyzeJobFit, generateResumeBullet, evaluateOffer, generateInterviewBrief)

export const analyzeRecruiterReply = async (replyText: string): Promise<SentimentAnalysis> => {
    return retryWrapper(async () => {
        const ai = getClient();
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Analyze recruiter email: "${replyText}". JSON Output: { "sentiment": "Positive"|"Neutral"|"Negative", "suggestedTone", "analysis", "draftReply" }`,
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
            4. Provide an Action Plan (3 specific steps to improve fit).

            JSON Output: { "matchScore": number, "missingKeywords": string[], "strengths": string[], "summary": string, "actionPlan": string[] }`,
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
      
      const prompt = `
      ACT AS: A Top-Tier Career Consultant & Copywriter.
      TASK: Write a highly persuasive, tailored Application Strategy for Abdul Hakeem for this JD.
      
      STEP 1: ANALYZE STRATEGY
      - Identify the top 2-3 "Pain Points" in the JD (what problem are they hiring to solve?).
      - Map Abdul's CV Metrics ($2M funding, 40% MQLs, 150% Traffic, etc.) as EVIDENCE that he solves these pains.
      - Formulate a "Strategic Angle" (e.g., "The Growth-Focused Project Manager").
      
      STEP 2: WRITE CONTENT
      - EMAIL DRAFT: Short (under 150 words). NO FLUFF.
        - Structure: Hook (Company News/Trend) -> Bridge (My Metric) -> Value (I solve X) -> Ask (Chat?).
        - TONE: "Peer-to-Peer", confident, humane. NOT "I am writing to apply".
      - COVER LETTER: Deeper dive (300 words).
        - Use "Hook-Value-Proof-CTA" framework.
        - Must mention specific company name and role.
      
      INPUTS:
      - PERSONA: ${persona}
      - CV HIGHLIGHTS: ${ABDUL_CV_TEXT.substring(0, 1200)}
      - JD: ${jobDescription.substring(0, 1000)}
      
      JSON OUTPUT FORMAT:
      {
        "strategicAngle": "One sentence summary of the pitch approach",
        "whyFitSummary": "3 concise bullet points explaining why I am the perfect fit based on JD pain points",
        "emailSubject": "Punchy subject line (e.g. 'Growth Strategy for [Company]')",
        "emailDraft": "The short email text",
        "coverLetter": "The full cover letter",
        "fitScore": number (0-100),
        "reasoning": "Brief explanation of the score"
      }
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
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
            contents: `Refine this content. Instruction: ${instruction}. 
            Maintain the existing JSON structure and only update the text fields (emailDraft, coverLetter).
            JSON Input: ${JSON.stringify(content)}`,
            config: { responseMimeType: "application/json" }
        });
        return JSON.parse(response.text || "{}");
    });
};

export const generateInterviewBrief = async (job: JobOpportunity): Promise<string> => {
    return smartCache(`brief_${job.id}`, () => retryWrapper(async () => {
        const ai = getClient();
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Create 1-page Interview Brief for ${job.title} at ${job.company} (UAE).
            Sections: Company Mission, Key Talking Points (Map CV to JD), 3 Smart Questions for Interviewer.`,
            config: { tools: [{ googleSearch: {} }] }
        });
        return response.text || "Error generating brief.";
    }));
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
