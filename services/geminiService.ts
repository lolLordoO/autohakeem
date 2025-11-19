
import { GoogleGenAI, Type } from "@google/genai";
import { ABDUL_CV_TEXT, USER_PROFILE } from "../constants";
import { GeneratedContent, JobOpportunity, PersonaType, RecruiterProfile, AgencyProfile } from "../types";

// Initialize Gemini Client
const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key missing");
  return new GoogleGenAI({ apiKey });
};

// Helper to parse JSON from potentially markdown-wrapped text
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
             const end = isArray ? cleaned.lastIndexOf(']') : cleaned.lastIndexOf('}');
             if (end > start) cleaned = cleaned.substring(start, end + 1);
        }
    }
    return JSON.parse(cleaned);
  } catch (e) {
    console.error("Failed to parse JSON from model response:", text);
    return []; 
  }
};

export const analyzeProfileForSearch = async (): Promise<string> => {
  const ai = getClient();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Analyze the following CV/Profile and generate the single most effective boolean search query to find relevant high-paying jobs specifically in the UAE.
      
      CV CONTEXT:
      ${ABDUL_CV_TEXT}
      
      CRITERIA:
      - Target roles: Marketing Strategist, Product Manager, AI/Web3 Specialist.
      - Location Scope: STRICTLY United Arab Emirates (UAE), Dubai, Abu Dhabi, Sharjah, Ajman, Ras Al Khaimah, Fujairah, or Umm Al Quwain.
      - Format: Use BOOLEAN logic to combine roles with these locations.
      
      OUTPUT:
      Return ONLY the query string. No explanations.
      Example: "(Marketing Strategist OR Product Manager) AND (AI OR Web3) AND (UAE OR Dubai OR Abu Dhabi OR Sharjah)"`
    });
    return response.text?.trim().replace(/["']/g, "") || "Marketing Strategist AI UAE Dubai";
  } catch (e) {
    return "Marketing Strategist AI Web3 UAE Dubai";
  }
};

export const searchJobsInUAE = async (query: string): Promise<JobOpportunity[]> => {
  const ai = getClient();
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Find 20 recent job openings in the UAE (United Arab Emirates) related to: ${query}. 
      
      INSTRUCTIONS:
      - Scour for roles in Tech, AI, Web3, and Marketing.
      - Look for "Easy Apply" options or Direct Email applications if visible.
      - Prioritize listings on LinkedIn, Indeed, Naukrigulf, and Company Career Pages.
      
      CRITICAL FOR URLs:
      - Provide VALID, CLICKABLE links to the job post.
      - If a specific deep link isn't found, provide the main company careers page.
      
      STRICT OUTPUT FORMAT (JSON Array):
      [
        {
          "title": "Job Title",
          "company": "Company Name",
          "location": "Location (Must be in UAE)",
          "source": "Source (LinkedIn, Indeed, etc)",
          "url": "Apply URL or Careers Page",
          "applyUrl": "Direct Apply Link (if different)",
          "applyEmail": "Recruiter Email (if found)",
          "description": "Key requirements snippet (max 200 chars)"
        }
      ]`,
      config: {
        tools: [{ googleSearch: {} }],
      }
    });
    
    const rawJobs = cleanAndParseJSON(response.text || "[]");
    if (!Array.isArray(rawJobs)) return [];

    return rawJobs.map((job: any) => ({
      id: Math.random().toString(36).substr(2, 9),
      title: job.title,
      company: job.company,
      location: job.location || "UAE",
      source: job.source || "Web Search",
      url: job.url,
      applyUrl: job.applyUrl,
      applyEmail: job.applyEmail,
      description: job.description,
      dateFound: new Date().toISOString(),
      status: 'found'
    }));

  } catch (error) {
    console.error("Error searching jobs:", error);
    return [];
  }
};

export const generateApplicationMaterials = async (
  jobDescription: string, 
  persona: PersonaType
): Promise<GeneratedContent> => {
  const ai = getClient();
  const website = USER_PROFILE.websites[persona];

  const prompt = `
    You are an expert Career Assistant for Abdul Hakeem.
    
    USER CONTEXT:
    CV: ${ABDUL_CV_TEXT}
    Portfolio: ${website}
    Target Persona: ${persona}

    TASK:
    The user is applying for a job with the following description:
    "${jobDescription.substring(0, 3000)}"

    Generate application assets. 
    - If this looks like an email application, write a subject line and email body.
    - If this looks like a portal application, write a cover letter text.
    
    Tone: Professional, Confident, Results-Oriented.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.OBJECT,
            properties: {
                emailSubject: { type: Type.STRING },
                coverLetter: { type: Type.STRING },
                emailDraft: { type: Type.STRING },
                linkedinMessage: { type: Type.STRING },
                fitScore: { type: Type.INTEGER },
                reasoning: { type: Type.STRING }
            }
        }
    }
  });

  if (!response.text) throw new Error("No response from AI");
  return JSON.parse(response.text);
};

export const findAgencies = async (excludedNames: string[] = []): Promise<AgencyProfile[]> => {
    const ai = getClient();
    const excludeStr = excludedNames.length > 0 ? `DO NOT include these agencies: ${excludedNames.join(', ')}.` : "";

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Find 10 recruitment agencies in UAE that specialize in Technology, Marketing, AI, and Crypto/Web3.
            ${excludeStr}
            
            CRITICAL: Find CONTACT DETAILS.
            Look for:
            1. General Inquiry or Careers Email
            2. Office Phone Number
            3. Website URL
            
            STRICT OUTPUT FORMAT (JSON Array):
            [
                {
                    "name": "Agency Name",
                    "focus": "Specialization",
                    "email": "email address (or 'Not found')",
                    "phone": "phone (or 'Not found')",
                    "website": "url (or 'Not found')",
                    "location": "City"
                }
            ]`,
            config: {
                tools: [{ googleSearch: {} }],
            }
        });
        const data = cleanAndParseJSON(response.text || "[]");
        return Array.isArray(data) ? data : [];
    } catch (e) {
        return [];
    }
}

export const draftAgencyOutreach = async (agency: AgencyProfile, persona: PersonaType): Promise<string> => {
    const ai = getClient();
    const website = USER_PROFILE.websites[persona];

    const prompt = `
        Draft a cold outreach email to "${agency.name}" in UAE.
        Sender: Abdul Hakeem (Sharjah, UAE, Immediate Joiner).
        Role: ${persona}.
        Portfolio: ${website}.
        Highlights: 4+ years exp, $2M+ funding secured, AI/Web3.
        Goal: Request CV review or meeting.
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
    });

    return response.text || "Could not generate email.";
}

export const findRecruiters = async (company: string, excludedNames: string[] = []): Promise<RecruiterProfile[]> => {
  const ai = getClient();
  const excludeStr = excludedNames.length > 0 ? `DO NOT include these names: ${excludedNames.join(', ')}.` : "";

  try {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Find 5 specific Talent Acquisition Managers or Recruiters at ${company} in UAE/MENA.
        ${excludeStr}
        
        CRITICAL: Find CONTACT DETAILS and PROFILE INFO.
        - LinkedIn URL is priority #1.
        - Email is priority #2.
        - Write a short "profileSnippet" (2 sentences) about their background or focus based on search results.
        
        STRICT OUTPUT FORMAT (JSON Array):
        [
            {
                "name": "Full Name", 
                "role": "Job Title", 
                "company": "${company}",
                "email": "email (or null)",
                "phone": "phone (or null)",
                "linkedin": "Full LinkedIn URL (or null)",
                "source": "Source",
                "profileSnippet": "Short professional bio..."
            }
        ]`,
        config: {
            tools: [{ googleSearch: {} }],
        }
    });
    const data = cleanAndParseJSON(response.text || "[]");
    return Array.isArray(data) ? data : [];
  } catch (e) {
    console.error(e);
    return [];
  }
};

export const generateRecruiterMessage = async (recruiterName: string, company: string, persona: PersonaType): Promise<string> => {
    const ai = getClient();
    const website = USER_PROFILE.websites[persona];

    const prompt = `
        Draft a LinkedIn connection note (max 300 chars) AND a longer InMail message.
        Recipient: ${recruiterName} at ${company}.
        Sender: Abdul Hakeem.
        Persona: ${persona}.
        Portfolio: ${website}.
        Highlights: 4+ years exp, $2M+ funding, AI/Web3.
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
    });

    return response.text || "Could not generate message.";
};
