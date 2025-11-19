
export enum PersonaType {
  MARKETING = 'Marketing & Content',
  PMO = 'Project Management',
  ULT = 'Ultimate / Hybrid'
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
  source: string; // LinkedIn, Indeed, etc.
  url?: string; // The scraping source URL
  applyUrl?: string; // Specific apply link if found
  applyEmail?: string; // Recruiter email if found
  description?: string;
  dateFound: string;
  status: 'found' | 'applied' | 'interviewing' | 'rejected';
}

export interface RecruiterProfile {
  name: string;
  role: string;
  company: string;
  email?: string;
  phone?: string;
  linkedin?: string;
  source?: string;
  profileSnippet?: string; // New bio field
  contacted?: boolean;
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
}

export interface InteractionRecord {
  id: string;
  name: string; // Agency Name or Recruiter Name
  targetType: 'Agency' | 'Recruiter';
  date: string;
  details: string; // Email used or LinkedIn URL
  status: 'Contacted';
}

export interface AgentLog {
  id: string;
  timestamp: Date;
  agent: 'Search' | 'Application' | 'Outreach';
  message: string;
  details?: string;
}