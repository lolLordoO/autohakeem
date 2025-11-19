
import { GoogleGenAI, Type } from "@google/genai";
import { ABDUL_CV_TEXT, USER_PROFILE } from "../constants";
import { GeneratedContent, JobOpportunity, PersonaType, RecruiterProfile, AgencyProfile, MarketSignal, TechEvent, SentimentAnalysis, OfferEvaluation } from "../types";

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

// --- EXISTING SEARCH AGENTS ---

export const analyzeProfileForSearch = async (): Promise<string> => {
  const ai = getClient();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Analyze CV and generate ONE Boolean search query for UAE jobs. 
      CV: ${ABDUL_CV_TEXT}
      Criteria: Senior roles, Tech/AI/Marketing, UAE specific.
      Output: Query string only.`
    });
    return response.text?.trim().replace(/["']/g, "") || "Marketing Strategist AI UAE";
  } catch (e) { return "Marketing Strategist AI UAE"; }
};

export const searchJobsInUAE = async (query: string): Promise<JobOpportunity[]> => {
  const ai = getClient();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Find 30 recent jobs in UAE (Dubai, Abu Dhabi, Sharjah) for: ${query}.
      Sources: LinkedIn, Indeed, Naukrigulf, Bayt, Laimoon, Hub71, Tanqeeb.
      Strictly UAE only. Exclude: US, UK, India, Remote outside UAE.
      
      CRITICAL INSTRUCTIONS: 
      1. DO NOT HALLUCINATE URLS. If you cannot find a specific deep link, return null for "url".
      2. Generate a precise "search_query" (e.g. "Marketing Manager Emirates Airlines Dubai careers") to find this specific job on Google.
      3. Extract "applyEmail" only if explicitly visible.
      
      Output JSON Array: [{ "title", "company", "location", "source", "url", "search_query", "applyUrl", "applyEmail", "description" }]`,
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
      dateFound: new Date().toISOString(),
      status: 'found'
    }));
  } catch (e) { return []; }
};

// --- INTELLIGENCE AGENTS (NEW) ---

export const analyzeMarketSignals = async (): Promise<MarketSignal[]> => {
    const ai = getClient();
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Perform a deep web search for the UAE Tech & Business ecosystem (last 14 days). 
            Sources: Magnitt, Wamda, Gulf Business, Zawya, LinkedIn, DIFC/ADGM/DMCC Press Releases, MEED, Arabian Business, TradeArabia, Hub71 News.
            
            Look for: 
            1. Funding Rounds (Seed/Series A/B).
            2. Market Entry (Global tech companies opening Dubai/Abu Dhabi offices).
            3. Major Product Launches or Digital Transformation partnerships.
            4. Executive Hires (New CTO, CMO, or VP hired - implies team building).
            5. Major Contract Wins (Govt or Enterprise contracts).
            
            STRICTLY REAL DATA ONLY. Verify the company exists in UAE.
            
            Identify the company and the signal. 
            Suggest who to contact (e.g. "CTO", "CMO", "Founder").
            
            JSON Output: [{ "company", "signalType", "summary", "actionableLeads": ["Role1", "Role2"] }]`,
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
            contents: `Find upcoming Tech, AI, Web3, and Marketing events/meetups in Dubai and Abu Dhabi for the next 45 days.
            Specific Platforms: Platinumlist UAE, Eventbrite Dubai, Meetup.com (Dubai Tech), DIFC FinTech Hive, ADGM Events, In5, Astrolabs, Dubai World Trade Centre.
            Include: Hackathons, Career Fairs, Networking Nights.
            
            JSON Output: [{ "name", "date", "location", "type", "url", "keyAttendees": ["Developers", "Investors", etc] }]`,
            config: { tools: [{ googleSearch: {} }] }
        });
        const data = cleanAndParseJSON(response.text || "[]");
        return Array.isArray(data) ? data.map((e:any) => ({...e, id: Math.random().toString()})) : [];
    } catch (e) { return []; }
};

// --- RECRUITER AGENTS ---

export const findRecruiters = async (company: string, excludedNames: string[] = []): Promise<RecruiterProfile[]> => {
  const ai = getClient();
  const excludeStr = excludedNames.length > 0 ? `Exclude: ${excludedNames.join(', ')}.` : "";
  try {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Find 5 Talent Acquisition/Recruiters at ${company} in UAE. ${excludeStr}.
        
        CRITICAL:
        1. DO NOT GUESS EMAILS. If not found in snippet, return null.
        2. Prioritize LinkedIn URLs. If not found, return null.
        3. Write a 2-sentence bio "profileSnippet" based on their real profile.
        
        CATEGORIZE THEM:
        "A": Active Tech/Product/AI hiring (High Priority)
        "B": General Recruitment (Active but general)
        "C": Corporate HR / Admin (Slow)
        
        JSON Output: [{ "name", "role", "company", "email", "linkedin", "profileSnippet", "category": "A"|"B"|"C" }]`,
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
            contents: `Analyze this email from a recruiter:
            "${replyText}"
            
            1. Determine Sentiment (Positive/Neutral/Negative/Blunt).
            2. Suggest Response Tone.
            3. Draft a response from Abdul Hakeem (Candidate).
            
            JSON Output: { "sentiment", "suggestedTone", "analysis", "draftReply" }`,
            config: { responseMimeType: "application/json" }
        });
        return JSON.parse(response.text || "{}");
    } catch (e) { return { sentiment: 'Neutral', suggestedTone: 'Professional', analysis: 'Error', draftReply: 'Error generating.' }; }
};

export const generateRecruiterMessage = async (recruiterName: string, company: string, persona: PersonaType): Promise<string> => {
    const ai = getClient();
    const website = USER_PROFILE.websites[persona];
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Draft LinkedIn InMail for ${recruiterName} at ${company}. 
        Sender: Abdul Hakeem (${persona}). Portfolio: ${website}. 
        Highlights: $2M+ funding, AI/Web3 exp. UAE based.`
    });
    return response.text || "";
};

// --- AGENCY AGENTS ---

export const findAgencies = async (excludedNames: string[] = []): Promise<AgencyProfile[]> => {
    const ai = getClient();
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Find 15 UAE Recruitment Agencies (Tech/AI/Marketing/Crypto). Exclude: ${excludedNames.join(',')}.
            Prioritize Niche boutiques over massive globals.
            Find Email/Phone/Website.
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
        contents: `Draft cold email to ${agency.name} (UAE). Role: ${persona}. Highlights: $2M funding, AI exp. Goal: Meeting.`
    });
    return response.text || "";
}

// --- APPLICATION AGENTS ---

export const recommendPersona = async (jobDescription: string): Promise<PersonaType> => {
    const ai = getClient();
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Analyze this JD and select the best persona for Abdul Hakeem:
            JD: "${jobDescription.substring(0, 500)}"
            
            Options:
            1. MARKETING (Content, SEO, Growth)
            2. PMO (Project Management, Agile, Scrum)
            3. ULT (Hybrid, Founder-level, Strategy + Tech)
            
            Output ONLY the Enum string: "Marketing & Content", "Project Management", or "Ultimate / Hybrid".`
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
        contents: `Generate Cover Letter & Email for Abdul Hakeem.
        Persona: ${persona}. CV: ${ABDUL_CV_TEXT}.
        JD: ${jobDescription.substring(0, 1000)}.
        
        MUST Include: Specific metrics ($2M funding, 40% MQLs, 150% traffic).
        Tone: High-Agency, Professional.
        
        JSON Output: { "emailSubject", "coverLetter", "emailDraft", "fitScore", "reasoning" }`,
        config: { responseMimeType: "application/json" }
      });
      return JSON.parse(response.text || "{}");
  } catch (e) { 
      return { 
          emailSubject: "Application", coverLetter: "Error generating content. Please try again.", emailDraft: "Error", fitScore: 0, reasoning: "Error" 
      }; 
  }
};

export const refineContent = async (content: GeneratedContent, instruction: string): Promise<GeneratedContent> => {
    const ai = getClient();
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Refine this JSON content based on: "${instruction}". JSON: ${JSON.stringify(content)}`,
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
            contents: `Create a 1-page Interview Cheat Sheet for: ${job.title} at ${job.company}.
            Include:
            1. Company Mission (Web Search).
            2. Key Talking Points connecting Abdul's CV (Crypto $2M funding, AI) to their likely needs.
            3. 3 Smart Questions to ask the interviewer.`,
            config: { tools: [{ googleSearch: {} }] }
        });
        return response.text || "Could not generate brief.";
    } catch (e) { return "Error generating brief."; }
}

export const evaluateOffer = async (salary: string, location: string, benefits: string): Promise<OfferEvaluation> => {
    const ai = getClient();
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Evaluate this job offer in UAE context:
            Salary: ${salary}. Location: ${location}. Benefits: ${benefits}.
            
            Output JSON: { "salary": number, "currency": "AED", "benefitsScore": number(1-10), "commuteMinutes": number (estimate), "growthPotential": number (1-10), "totalScore": number, "recommendation": "string" }`,
            config: { responseMimeType: "application/json" }
        });
        return JSON.parse(response.text || "{}");
    } catch (e) { return { salary: 0, currency: 'AED', benefitsScore: 0, commuteMinutes: 0, growthPotential: 0, totalScore: 0, recommendation: 'Error' }; }
}
