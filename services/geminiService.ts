import { GoogleGenAI, Type } from "@google/genai";
import { ABDUL_CV_TEXT, USER_PROFILE } from "../constants";
import { GeneratedContent, JobOpportunity, PersonaType } from "../types";

// Initialize Gemini Client
const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key missing");
  return new GoogleGenAI({ apiKey });
};

// Helper to parse JSON from potentially markdown-wrapped text or conversational text
const cleanAndParseJSON = (text: string) => {
  try {
    // 1. Try standard cleanup (markdown code blocks)
    let cleaned = text.replace(/```json\n?|```/g, '').trim();

    // 2. If parsing fails or text looks conversational, try finding the array/object boundaries
    if (!cleaned.startsWith('[') && !cleaned.startsWith('{')) {
        const arrayStart = cleaned.indexOf('[');
        const objectStart = cleaned.indexOf('{');
        
        // Determine which comes first (if any)
        let start = -1;
        if (arrayStart > -1 && (objectStart === -1 || arrayStart < objectStart)) {
            start = arrayStart;
        } else if (objectStart > -1) {
            start = objectStart;
        }

        if (start > -1) {
             // Find the matching end based on start type
             const isArray = cleaned[start] === '[';
             const end = isArray ? cleaned.lastIndexOf(']') : cleaned.lastIndexOf('}');
             if (end > start) {
                 cleaned = cleaned.substring(start, end + 1);
             }
        }
    }

    return JSON.parse(cleaned);
  } catch (e) {
    console.error("Failed to parse JSON from model response:", text);
    return []; 
  }
};

export const searchJobsInUAE = async (query: string): Promise<JobOpportunity[]> => {
  const ai = getClient();
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Find 5 recent job openings in the UAE related to: ${query}. 
      Focus on Tech, AI, Web3, and Marketing sectors. 
      
      STRICT OUTPUT FORMAT:
      Return ONLY a raw JSON array. Do not include "Here is the json" or any markdown formatting.
      Structure:
      [
        {
          "title": "Job Title",
          "company": "Company Name",
          "location": "Location",
          "source": "Source (e.g. LinkedIn)",
          "url": "URL if available",
          "description": "Short description"
        }
      ]
      If you find specific URLs in the grounding search, include them.`,
      config: {
        tools: [{ googleSearch: {} }],
      }
    });
    
    const text = response.text;
    if (!text) return [];
    
    const rawJobs = cleanAndParseJSON(text);
    
    if (!Array.isArray(rawJobs)) return [];

    // Map to our internal type and add timestamps
    return rawJobs.map((job: any) => ({
      id: Math.random().toString(36).substr(2, 9),
      title: job.title,
      company: job.company,
      location: job.location || "UAE",
      source: job.source || "Web Search",
      url: job.url,
      description: job.description,
      dateFound: new Date().toISOString(),
      status: 'found'
    }));

  } catch (error) {
    console.error("Error searching jobs:", error);
    // Fallback mock data if search fails or key invalid
    return [
      {
        id: 'mock-1',
        title: 'Senior Content Strategist (Web3)',
        company: 'Binance UAE',
        location: 'Dubai, UAE',
        source: 'LinkedIn',
        dateFound: new Date().toISOString(),
        status: 'found',
        description: 'Leading content strategy for MENA region.'
      },
      {
        id: 'mock-2',
        title: 'Technical Project Manager',
        company: 'G42',
        location: 'Abu Dhabi, UAE',
        source: 'Careers Page',
        dateFound: new Date().toISOString(),
        status: 'found',
        description: 'Manage AI infrastructure projects.'
      }
    ];
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
    Selected Portfolio URL: ${website}
    Target Persona: ${persona}

    TASK:
    The user is applying for a job with the following description:
    "${jobDescription.substring(0, 3000)}"

    Please generate the following application assets:
    1. A highly persuasive Cover Letter tailored to the job, highlighting relevant experience from the CV (specifically mentioning the $2M funding or 150% traffic growth if relevant).
    2. A concise Email Draft to the recruiter attaching the resume.
    3. A short, professional LinkedIn Connection message (max 300 chars).
    4. A "Fit Score" (0-100) estimating how well Abdul matches this job.
    5. A brief reasoning for the score.

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
                coverLetter: { type: Type.STRING },
                emailDraft: { type: Type.STRING },
                linkedinMessage: { type: Type.STRING },
                resumeSummary: { type: Type.STRING },
                fitScore: { type: Type.INTEGER },
                reasoning: { type: Type.STRING }
            }
        }
    }
  });

  if (!response.text) throw new Error("No response from AI");
  return JSON.parse(response.text);
};

export const draftAgencyOutreach = async (agencyName: string, persona: PersonaType): Promise<string> => {
    const ai = getClient();
    const website = USER_PROFILE.websites[persona];

    const prompt = `
        Draft a cold outreach email to a recruitment agency named "${agencyName}" in the UAE.
        
        Sender: Abdul Hakeem (Sharjah, UAE, Immediate Joiner, Visit Visa).
        Role Targeting: ${persona}.
        Portfolio: ${website}.
        
        Key Highlights to mention:
        - 4+ years exp in AI, Web3, Cloud.
        - Proven record in UAE & KSA.
        - Secured $2M+ funding via pitch strategies.
        
        Keep it concise, professional, and asking for a quick call or CV review.
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
    });

    return response.text || "Could not generate email.";
}

export const findAgencies = async (): Promise<{name: string, focus: string}[]> => {
    const ai = getClient();
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `List 5 top recruitment agencies in UAE that specialize in Technology, Marketing, and Crypto/Web3. 
            
            STRICT OUTPUT FORMAT:
            Return ONLY a raw JSON array. No markdown.
            Example: [{"name": "Agency A", "focus": "Tech"}]`,
            config: {
                tools: [{ googleSearch: {} }],
            }
        });
        const data = cleanAndParseJSON(response.text || "[]");
        return Array.isArray(data) ? data : [];
    } catch (e) {
        return [
            { name: "Michael Page Middle East", focus: "General Tech & Marketing" },
            { name: "Hays UAE", focus: "IT & Digital" },
            { name: "Charterhouse", focus: "Corporate & Strategy" }
        ];
    }
}

export const findRecruiters = async (company: string): Promise<{name: string, role: string, source?: string}[]> => {
  const ai = getClient();
  try {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Find 3-5 specific Talent Acquisition Managers, Recruiters, or HR personnel working at ${company} in the UAE or MENA region.
        Use Google Search to find real names if possible.
        
        STRICT OUTPUT FORMAT:
        Return ONLY a raw JSON array. No markdown.
        Structure: [{"name": "Name", "role": "Role", "source": "LinkedIn"}]
        If specific names aren't found, return generic titles.`,
        config: {
            tools: [{ googleSearch: {} }],
        }
    });
    const data = cleanAndParseJSON(response.text || "[]");
    return Array.isArray(data) ? data : [];
  } catch (e) {
    console.error(e);
    return [
        { name: "Talent Acquisition Team", role: "Recruitment", source: "General" },
        { name: "HR Manager", role: "Human Resources", source: "General" }
    ];
  }
};

export const generateRecruiterMessage = async (recruiterName: string, company: string, persona: PersonaType): Promise<string> => {
    const ai = getClient();
    const website = USER_PROFILE.websites[persona];

    const prompt = `
        Draft a LinkedIn connection note (max 300 chars) AND a longer InMail message for a recruiter.
        
        Recipient: ${recruiterName} at ${company}.
        Sender: Abdul Hakeem.
        Persona: ${persona}.
        Website: ${website}.
        
        Context: Abdul is in UAE on visit visa, immediate joiner. 
        Highlights: 4+ years exp, $2M+ funding secured, AI/Web3 expert.
        
        Format output as:
        ---CONNECTION REQUEST---
        (Content)
        
        ---INMAIL---
        (Content)
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
    });

    return response.text || "Could not generate message.";
};