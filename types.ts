
export enum PersonaType {
  MARKETING = 'Marketing & Content',
  PMO = 'Project Management',
  ULT = 'Ultimate / Hybrid'
}

export enum SearchFocus {
  ALL = 'General / Broad',
  MARKETING = 'Marketing, Content & Creative',
  TECH = 'Tech, AI & Web3',
  PMO = 'Project & Product Management',
  CORP = 'Corporate & Enterprise'
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
  status: 'found' | 'applied' | 'interviewing' | 'rejected' | 'offer';
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
}

export interface AgencyProfile {
  name: string;
  focus: string;
  email?: string;
  phone?: string;
  website?: string;
  location?: string;
}

export interface GeneratedContent {
  coverLetter?: string;
  emailDraft?: string;
  linkedinMessage?: string;
  resumeSummary?: string;
  fitScore?: number;
  reasoning?: string;
  emailSubject?: string;
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

// --- NEW MODULE TYPES ---

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

// State Types
export interface JobSearchState {
    results: JobOpportunity[];
    query: string;
}
