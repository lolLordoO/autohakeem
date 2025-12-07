
export enum PersonaType {
  MARKETING = 'Marketing & Content',
  PMO = 'Project Management',
  ULT = 'Ultimate / Hybrid'
}

export enum SearchFocus {
  ALL = 'General / Broad',
  MARKETING = 'Growth & Marketing',
  CONTENT = 'Content & Creative',
  TECH_AI = 'AI & Machine Learning',
  WEB3 = 'Web3, Crypto & Blockchain',
  PMO = 'Product & Project Mgmt',
  SAAS = 'SaaS & Enterprise SW',
  FINTECH = 'FinTech & Payments',
  HEALTH = 'HealthTech & MedTech',
  REAL_ESTATE = 'PropTech & Real Estate',
  ECOMMERCE = 'E-commerce & Retail',
  CONSTRUCTION = 'Construction & Eng.'
}

export interface UserProfile {
  name: string;
  email: string;
  phone: string;
  location: string;
  websites: {
    [key in PersonaType]: string;
  };
  cvText: string;
}

export type MatchGrade = 'S' | 'A' | 'B' | 'C'; // S = Perfect, C = Low

export interface JobFilters {
    emirate: 'All' | 'Dubai' | 'Abu Dhabi' | 'Sharjah' | 'Remote';
    level: 'All' | 'Junior' | 'Mid-Senior' | 'Lead/Manager';
    dateRange: 'Any' | 'Past 24h' | 'Past Week' | 'Past Month';
}

export interface JobOpportunity {
  id: string;
  title: string;
  company: string;
  location: string;
  source: string; 
  url?: string; 
  search_query?: string; 
  applyUrl?: string; 
  applyEmail?: string; 
  description?: string;
  salaryEstimate?: string; // e.g. "AED 15,000 - 20,000"
  dateFound: string;
  postedDate?: string; // e.g., "2 hours ago"
  status: 'found' | 'applied' | 'interviewing' | 'rejected' | 'offer';
  matchGrade?: MatchGrade; // New AI Verdict
  matchReason?: string; // "Why" this job was shown
  isFresh?: boolean; // If found in the 24h drop
}

export interface RecruiterProfile {
  name: string;
  role: string;
  company: string;
  email?: string;
  phone?: string;
  linkedin?: string;
  source?: string;
  profileSnippet?: string;
  category?: 'A' | 'B' | 'C'; // A: Active/Tech, B: General, C: Corporate/Slow
  contacted?: boolean;
  lastContactDate?: string;
  recentPostSnippet?: string; // New: What are they talking about?
}

export interface AgencyProfile {
  name: string;
  focus: string;
  email?: string;
  phone?: string;
  website?: string;
  location?: string;
  activeRoles?: string[]; // New: List of active job titles found
}

export interface GeneratedContent {
  coverLetter?: string;
  emailDraft?: string;
  linkedinMessage?: string;
  resumeSummary?: string;
  fitScore?: number;
  reasoning?: string;
  emailSubject?: string;
  // New Strategic Fields
  strategicAngle?: string; // e.g. "Focus on ROI & MQL Growth"
  whyFitSummary?: string; // Concise bullet points on why matched
}

export interface ATSAnalysis {
  matchScore: number; // 0-100
  missingKeywords: string[];
  strengths: string[];
  summary: string;
  suggestedBullet?: string;
}

// NEW: Job Sense Deep Analysis
export interface JobSenseAnalysis {
    jobTitle: string;
    company: string;
    roleSummary: string;
    companyVibe: string; // Culture/Reputation
    matchScore: number;
    usedPersona: PersonaType; // Which profile was used
    verification: {
        isCompanyReal: boolean;
        isJobReal: boolean; // Based on search signals
        notes: string;
    };
    salaryAnalysis: {
        estimated: string;
        marketAvg: string;
        status: 'Below Market' | 'Fair' | 'Above Market' | 'Unknown';
    };
    atsGap: {
        score: number;
        missingSkills: string[];
    };
    redFlags: string[]; // e.g., "High turnover", "Vague description"
    greenFlags: string[];
    strategicAdvice: string; // "How to win this"
}

export interface ApplicationRecord extends JobOpportunity {
  appliedDate: string;
  applicationMaterials: GeneratedContent;
  method: 'Email' | 'LinkedIn' | 'Portal';
  notes?: string;
  offerDetails?: OfferEvaluation;
}

export interface InteractionRecord {
  id: string;
  name: string; 
  targetType: 'Agency' | 'Recruiter';
  date: string;
  details: string; 
  status: 'Contacted';
}

export interface MarketSignal {
  id: string;
  company: string;
  signalType: 'Funding' | 'Expansion' | 'Hiring Spree' | 'Product Launch' | 'Executive Hire' | 'Contract Win';
  summary: string;
  dateDetected: string;
  actionableLeads: string[]; // Names of roles to target (e.g. "CTO", "Head of Product")
}

export interface TechEvent {
  id: string;
  name: string;
  date: string;
  location: string;
  type: 'Meetup' | 'Conference' | 'Workshop' | 'Hackathon' | 'Career Fair';
  url?: string;
  keyAttendees?: string[];
}

export interface VisaDetails {
  entryDate: string;
  visaDurationDays: number; // e.g., 60 or 90
  documentsReady: {
      passport: boolean;
      photo: boolean;
      attestedDegree: boolean;
      insurance: boolean;
  };
}

export interface SentimentAnalysis {
  sentiment: 'Positive' | 'Neutral' | 'Negative' | 'Blunt';
  suggestedTone: 'Enthusiastic' | 'Professional' | 'Concise' | 'Persuasive';
  analysis: string;
  draftReply: string;
}

export interface OfferEvaluation {
  salary: number;
  currency: string;
  benefitsScore: number; // 1-10
  commuteMinutes: number;
  growthPotential: number; // 1-10
  totalScore: number; // 0-100
  recommendation: string;
}

export interface DailyGoals {
    date: string;
    applicationsSent: number; // Target 5
    recruitersContacted: number; // Target 5
    streak: number;
}

// Brand Engine Types
export type LinkedInTone = 'Thought Leader' | 'Controversial' | 'Data-Driven' | 'Celebratory';

export interface LinkedInPost {
    id: string;
    signalId: string;
    topic: string;
    content: string;
    tone: LinkedInTone;
    dateCreated: string;
}

// Mock Interview Types
export interface ChatMessage {
    role: 'ai' | 'user';
    text: string;
    critique?: string; // AI critique of the user's previous answer
    timestamp: string;
}

// State Types
export interface JobSearchState {
    results: JobOpportunity[];
    query: string;
}
