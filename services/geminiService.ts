
import { GoogleGenAI, Type } from "@google/genai";
import { ABDUL_CV_TEXT, USER_PROFILE } from "../constants";
import { GeneratedContent, JobOpportunity, PersonaType, RecruiterProfile, AgencyProfile, MarketSignal, TechEvent, SentimentAnalysis, OfferEvaluation, SearchFocus } from "../types";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key missing");
  return new GoogleGenAI({ apiKey });
};

const cleanAndParseJSON = (text: string) => {
  try {
    let cleaned = text.replace(/```json\n?|```/g, '').trim();
    if (!cleaned.startsWith('[') && !cleaned.startsWith('{')) {
        const arrayStart = cleaned.indexOf('[');
        const objectStart = cleaned.indexOf('{');
        let start = -1;
        if (arrayStart > -1 && (objectStart === -1 || arrayStart < objectStart)) start = arrayStart;
        else if (objectStart > -1) start = objectStart;

        if (start > -1) {
             const isArray = cleaned[start] === '[';
             let depth = 0;
             let end = -1;
             const openChar = isArray ? '[' : '{';
             const closeChar = isArray ? ']' : '}';
             for (let i = start; i < cleaned.length; i++) {
                 if (cleaned[i] === openChar) depth++;
                 else if (cleaned[i] === closeChar) depth--;
                 if (depth === 0) { end = i; break; }
             }
             if (end > start) cleaned = cleaned.substring(start, end + 1);
        }
    }
    return JSON.parse(cleaned);
  } catch (e) {
    console.error("JSON Parse Error:", text);
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
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Find 30 recent jobs in UAE (Dubai, Abu Dhabi, Sharjah) matching: "${query}".
      Focus Area: ${focus}.
      
      EXTENSIVE SOURCE LIST: LinkedIn, Indeed, Naukrigulf, Bayt, GulfTalent, MonsterGulf, Laimoon, Dubizzle, Tanqeeb, Oliv, eFinancialCareers, Hub71, Dubai Careers, YallaMotor (for auto), Wuzzuf.
      
      Strictly UAE only. Exclude: US, UK, India, Remote outside UAE.
      
      CRITICAL INSTRUCTIONS: 
      1. DO NOT HALLUCINATE URLS. If deep link is not found, return null.
      2. Generate a precise "search_query" to find this job on Google.
      3. Estimate "salaryEstimate" (e.g., "AED 15k-20k") based on Role + Company Tier + UAE Market Data.
      
      Output JSON Array: [{ "title", "company", "location", "source", "url", "search_query", "applyUrl", "applyEmail", "description", "salaryEstimate" }]`,
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
      salaryEstimate: job.salaryEstimate || "Not listed",
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
            contents: `Deep search UAE Business News (last 14 days). 
            Sources: Magnitt, Wamda, Gulf Business, Zawya, MEED, Arabian Business, TradeArabia, Khaleej Times, The National, TechCrunch Middle East.
            
            Find Signals: Funding, Market Entry, Product Launches, Executive Hires, Contract Wins.
            VERIFY: Must be real events in UAE.
            
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
            contents: `Find upcoming professional events in Dubai/Abu Dhabi (Next 45 days).
            Sources: Platinumlist, Eventbrite, Meetup, DIFC, ADGM, DWTC, Step Conference, Gitex, In5, Astrolabs.
            Types: Meetups, Conferences, Hackathons, Career Fairs.
            
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
  try {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Find 5 Recruiters/Hiring Managers at ${company} in UAE.
        Focus: ${focus === SearchFocus.ALL ? 'Relevant Hiring Managers' : focus}.
        ${excludeStr}
        
        Sources: LinkedIn, Company Team Pages, ZoomInfo, RocketReach (via Google snippets).
        
        CRITICAL: NO GUESSING EMAILS. Return null if not found.
        Categorize: A (High Priority), B (General), C (HR).
        
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
            Sources: LinkedIn, Agency Directories, Google Maps.
            Prioritize boutiques.
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
        contents: `Generate Application for Abdul Hakeem.
        Persona: ${persona}. CV Data: ${ABDUL_CV_TEXT}.
        JD: ${jobDescription.substring(0, 1000)}.
        
        STYLE GUIDE (CRITICAL):
        1. NO "I am writing to apply". Start with a hook about the company/industry.
        2. Be direct and humane. Sound like a senior expert, not a template.
        3. INJECT METRICS: Must mention "$2M+ funding", "40% MQL increase", or "150% traffic growth".
        4. Short paragraphs.
        
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
