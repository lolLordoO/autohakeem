
import { GoogleGenAI, Type } from "@google/genai";
import { ABDUL_CV_TEXT, USER_PROFILE } from "../constants";
import { GeneratedContent, JobOpportunity, PersonaType, RecruiterProfile, AgencyProfile, MarketSignal, TechEvent, SentimentAnalysis, OfferEvaluation, SearchFocus } from "../types";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key missing");
  return new GoogleGenAI({ apiKey });
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
    return JSON.parse(cleaned);
  } catch (e) {
    console.error("JSON Parse Error. Raw Text:", text);
    return []; 
  }
};

// --- SEARCH AGENTS ---

export const analyzeProfileForSearch = async (): Promise<string> => {
  const ai = getClient();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Analyze CV and generate ONE Boolean search query for UAE jobs. 
      CV: ${ABDUL_CV_TEXT}
      Output: Query string only.`
    });
    return response.text?.trim().replace(/["']/g, "") || "Marketing Strategist AI UAE";
  } catch (e) { return "Marketing Strategist AI UAE"; }
};

export const searchJobsInUAE = async (query: string, focus: SearchFocus = SearchFocus.ALL): Promise<JobOpportunity[]> => {
  const ai = getClient();
  
  let focusKeywords = "";
  switch (focus) {
      case SearchFocus.MARKETING: focusKeywords = "(Marketing OR Content OR Social Media OR Brand)"; break;
      case SearchFocus.TECH: focusKeywords = "(AI OR Web3 OR Blockchain OR Crypto OR Tech)"; break;
      case SearchFocus.PMO: focusKeywords = "(Project Manager OR Product Owner OR Scrum Master)"; break;
      case SearchFocus.CORP: focusKeywords = "(Manager OR Director OR Corporate OR Enterprise)"; break;
      default: focusKeywords = "";
  }

  const searchOperators = "site:linkedin.com/jobs OR site:naukrigulf.com OR site:bayt.com OR site:gulftalent.com OR site:indeed.com OR site:laimoon.com OR site:dubizzle.com OR site:wuzzuf.net";

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Find 30 REAL, RECENT jobs in UAE (Dubai, Abu Dhabi, Sharjah) matching: "${query} ${focusKeywords}".
      Use these operators to find real listings: ${searchOperators}.
      
      EXTENSIVE SOURCE LIST: LinkedIn, Indeed, Naukrigulf, Bayt, GulfTalent, MonsterGulf, Laimoon, Dubizzle, Tanqeeb, Oliv, eFinancialCareers, Hub71, Dubai Careers, YallaMotor, Wuzzuf.
      
      Strictly UAE only. Exclude: US, UK, India, Remote outside UAE.
      
      CRITICAL INSTRUCTIONS: 
      1. OUTPUT STRICT JSON ARRAY ONLY. NO CONVERSATIONAL TEXT.
      2. DO NOT INVENT COMPANY NAMES. Only return companies found in the snippets.
      3. If a deep URL is not explicitly clear, return null for 'url'.
      4. Generate a precise "search_query" (e.g. "Marketing Manager Careem Dubai application") to find this job on Google.
      5. ESTIMATE SALARY ("salaryEstimate"): Based on the Role Title + Company Tier + UAE Market Data, provide a realistic range in AED (e.g., "AED 18k - 22k").
      
      JSON Output Format: [{ "title", "company", "location", "source", "url", "search_query", "applyUrl", "applyEmail", "description", "salaryEstimate" }]`,
      config: { tools: [{ googleSearch: {} }] }
    });
    const rawJobs = cleanAndParseJSON(response.text || "[]");
    if (!Array.isArray(rawJobs)) return [];

    return rawJobs.map((job: any) => ({
      id: Math.random().toString(36).substr(2, 9),
      title: job.title,
      company: job.company,
      location: job.location || "UAE",
      source: job.source || "Web Search",
      url: job.url || null,
      search_query: job.search_query || `${job.title} ${job.company} UAE careers`,
      applyUrl: job.applyUrl || null,
      applyEmail: job.applyEmail || null,
      description: job.description,
      salaryEstimate: job.salaryEstimate || "AED Market Rate",
      dateFound: new Date().toISOString(),
      status: 'found'
    }));
  } catch (e) { return []; }
};

// --- INTELLIGENCE AGENTS ---

export const analyzeMarketSignals = async (): Promise<MarketSignal[]> => {
    const ai = getClient();
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Deep search UAE Business News (last 14 days) for 20+ signals.
            Sources: Magnitt, Wamda, Gulf Business, Zawya, MEED, Arabian Business, TradeArabia, Khaleej Times, The National, TechCrunch Middle East, Edge Middle East, Entrepreneur ME.
            
            Find Signals: Funding (Seed/Series A+), Market Entry (New Office), Product Launches, Executive Hires (New CTO/CMO), Contract Wins, Stealth Mode Openings.
            
            CRITICAL:
            1. OUTPUT STRICT JSON ARRAY ONLY. DO NOT START WITH "I have searched...". JUST THE JSON.
            2. VERIFY: Must be real events in UAE.
            
            JSON Output: [{ "company", "signalType", "summary", "actionableLeads": ["Role1"] }]`,
            config: { tools: [{ googleSearch: {} }] }
        });
        const data = cleanAndParseJSON(response.text || "[]");
        return Array.isArray(data) ? data.map((s:any) => ({...s, id: Math.random().toString(), dateDetected: new Date().toISOString()})) : [];
    } catch (e) { return []; }
};

export const findTechEvents = async (): Promise<TechEvent[]> => {
    const ai = getClient();
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Find 20+ upcoming professional events in Dubai/Abu Dhabi (Next 60 days).
            Sources: Platinumlist, Eventbrite, Meetup, DIFC Hive, ADGM, DWTC, Step Conference, Gitex, In5, Astrolabs, Sharjah Entrepreneurship Center.
            Types: Meetups, Conferences, Hackathons, Career Fairs, Networking Nights.
            
            CRITICAL: OUTPUT STRICT JSON ARRAY ONLY. NO CONVERSATIONAL FILLER.
            
            JSON Output: [{ "name", "date", "location", "type", "url", "keyAttendees": [] }]`,
            config: { tools: [{ googleSearch: {} }] }
        });
        const data = cleanAndParseJSON(response.text || "[]");
        return Array.isArray(data) ? data.map((e:any) => ({...e, id: Math.random().toString()})) : [];
    } catch (e) { return []; }
};

// --- RECRUITER AGENTS ---

export const findRecruiters = async (company: string, focus: SearchFocus, excludedNames: string[] = []): Promise<RecruiterProfile[]> => {
  const ai = getClient();
  const excludeStr = excludedNames.length > 0 ? `Exclude: ${excludedNames.join(', ')}.` : "";
  
  let roleKeywords = "Recruiter OR Talent Acquisition OR HR Manager";
  if (focus === SearchFocus.TECH) roleKeywords = "Technical Recruiter OR CTO OR Engineering Manager";
  if (focus === SearchFocus.MARKETING) roleKeywords = "Marketing Director OR CMO OR Head of Content";

  try {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Find 5 Specific People at ${company} in UAE fitting role: ${roleKeywords}.
        ${excludeStr}
        
        Sources: LinkedIn, Company Team Pages, ZoomInfo, RocketReach.
        Use X-Ray search logic to find real profiles.
        
        CRITICAL: 
        1. NO GUESSING EMAILS. Return null if not found.
        2. Categorize: A (Decision Maker), B (Recruiter), C (HR Admin).
        3. OUTPUT STRICT JSON ARRAY ONLY.
        
        JSON Output: [{ "name", "role", "company", "email", "linkedin", "profileSnippet", "category" }]`,
        config: { tools: [{ googleSearch: {} }] }
    });
    return cleanAndParseJSON(response.text || "[]");
  } catch (e) { return []; }
};

export const analyzeRecruiterReply = async (replyText: string): Promise<SentimentAnalysis> => {
    const ai = getClient();
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Analyze recruiter email: "${replyText}".
            JSON Output: { "sentiment", "suggestedTone", "analysis", "draftReply" }`,
            config: { responseMimeType: "application/json" }
        });
        return JSON.parse(response.text || "{}");
    } catch (e) { return { sentiment: 'Neutral', suggestedTone: 'Professional', analysis: 'Error', draftReply: 'Error' }; }
};

export const generateRecruiterMessage = async (recruiterName: string, company: string, persona: PersonaType): Promise<string> => {
    const ai = getClient();
    const website = USER_PROFILE.websites[persona];
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Write a short, punchy LinkedIn message to ${recruiterName} at ${company}.
        From: Abdul Hakeem (${persona}). Link: ${website}.
        Context: ${company} is hiring/growing.
        Style: Direct, no fluff, "Hook-Value-Ask". Mention $2M funding or 40% growth metric.`
    });
    return response.text || "";
};

// --- AGENCY AGENTS ---

export const findAgencies = async (focus: SearchFocus, excludedNames: string[] = []): Promise<AgencyProfile[]> => {
    const ai = getClient();
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Find 15 UAE Recruitment Agencies specializing in: ${focus}. 
            Exclude: ${excludedNames.join(',')}.
            Sources: LinkedIn, Agency Directories, Google Maps, UaeStaffing.
            Prioritize boutiques and specialized firms over generic giants.
            
            CRITICAL: OUTPUT STRICT JSON ARRAY ONLY.
            
            JSON Output: [{ "name", "focus", "email", "phone", "website", "location" }]`,
            config: { tools: [{ googleSearch: {} }] }
        });
        return cleanAndParseJSON(response.text || "[]");
    } catch (e) { return []; }
}

export const draftAgencyOutreach = async (agency: AgencyProfile, persona: PersonaType): Promise<string> => {
    const ai = getClient();
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Write a cold email to ${agency.name}. Focus: ${agency.focus}.
        Persona: ${persona}.
        Style: Professional but high-agency. Short. 
        Goal: Get added to their candidate roster.`
    });
    return response.text || "";
}

// --- APPLICATION AGENTS ---

export const recommendPersona = async (jobDescription: string): Promise<PersonaType> => {
    const ai = getClient();
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Select best persona for JD: "${jobDescription.substring(0, 500)}".
            Options: Marketing, PMO, Ult. Output Enum string only.`
        });
        const text = response.text?.trim() || "";
        if (text.includes("Marketing")) return PersonaType.MARKETING;
        if (text.includes("Project")) return PersonaType.PMO;
        return PersonaType.ULT;
    } catch (e) { return PersonaType.ULT; }
}

export const generateApplicationMaterials = async (jobDescription: string, persona: PersonaType): Promise<GeneratedContent> => {
  const ai = getClient();
  try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Generate Application (Cover Letter + Email) for Abdul Hakeem.
        Persona: ${persona}. 
        CV Highligts: ${ABDUL_CV_TEXT.substring(0, 500)}.
        JD: ${jobDescription.substring(0, 1000)}.
        
        CRITICAL TONE & STYLE INSTRUCTIONS:
        1. HUMANE & SPECIFIC: Do NOT start with "I am writing to apply". That is banned. Start with a hook about the company's recent work or industry challenge.
        2. NO CORPORATE FLUFF: Do not use words like "thrilled", "esteemed", "passionate". Be professional, grounded, and expert.
        3. METRIC-DRIVEN: You MUST include specific numbers from the CV (e.g., "$2M+ funding secured", "40% MQL growth").
        4. DIRECT CALL TO ACTION: End with a confident request for a chat.
        5. SHORT: Keep it under 200 words.
        
        JSON Output: { "emailSubject", "coverLetter", "emailDraft", "fitScore", "reasoning" }`,
        config: { responseMimeType: "application/json" }
      });
      return JSON.parse(response.text || "{}");
  } catch (e) { 
      return { emailSubject: "Application", coverLetter: "Error", emailDraft: "Error", fitScore: 0, reasoning: "Error" }; 
  }
};

export const refineContent = async (content: GeneratedContent, instruction: string): Promise<GeneratedContent> => {
    const ai = getClient();
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Refine this content. Instruction: ${instruction}. JSON: ${JSON.stringify(content)}`,
            config: { responseMimeType: "application/json" }
        });
        return JSON.parse(response.text || "{}");
    } catch(e) { return content; }
};

// --- CLOSING AGENTS ---

export const generateInterviewBrief = async (job: JobOpportunity): Promise<string> => {
    const ai = getClient();
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Create 1-page Interview Brief for ${job.title} at ${job.company}.
            Include Mission, Talking Points (map CV metrics to JD), and 3 Strategic Questions.`,
            config: { tools: [{ googleSearch: {} }] }
        });
        return response.text || "Error.";
    } catch (e) { return "Error."; }
}

export const evaluateOffer = async (salary: string, location: string, benefits: string): Promise<OfferEvaluation> => {
    const ai = getClient();
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Evaluate UAE Job Offer. Salary: ${salary}. Location: ${location}. Benefits: ${benefits}.
            JSON Output: { "salary": number, "currency": "AED", "benefitsScore": number, "commuteMinutes": number, "growthPotential": number, "totalScore": number, "recommendation": "string" }`,
            config: { responseMimeType: "application/json" }
        });
        return JSON.parse(response.text || "{}");
    } catch (e) { return { salary: 0, currency: 'AED', benefitsScore: 0, commuteMinutes: 0, growthPotential: 0, totalScore: 0, recommendation: 'Error' }; }
}
