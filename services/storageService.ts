
import { ApplicationRecord, JobOpportunity, GeneratedContent, InteractionRecord, VisaDetails, MarketSignal, TechEvent, RecruiterProfile, AgencyProfile, DailyGoals } from '../types';

const APPS_KEY = 'autohakeem_applications';
const INTERACTIONS_KEY = 'autohakeem_interactions';
const VISA_KEY = 'autohakeem_visa';
const SIGNALS_KEY = 'autohakeem_signals';
const EVENTS_KEY = 'autohakeem_events';

// NEW KEYS FOR PERSISTENCE
const JOB_RESULTS_KEY = 'autohakeem_job_results';
const JOB_QUERY_KEY = 'autohakeem_job_query';
const RECRUITER_RESULTS_KEY = 'autohakeem_recruiter_results';
const RECRUITER_QUERY_KEY = 'autohakeem_recruiter_query';
const AGENCY_RESULTS_KEY = 'autohakeem_agency_results';
const DRAFT_KEY = 'autohakeem_current_draft';
const GOALS_KEY = 'autohakeem_daily_goals';
const UI_STATE_KEY = 'autohakeem_ui_state';

// --- UI STATE (New Global Persistence) ---

export interface UiState {
    activeTab?: string;
    jobSearchFocus?: string;
    recruiterFocus?: string;
    recruiterView?: string;
    recruiterReplyText?: string; // Persist intelligence input
    agencyFocus?: string;
    agencyView?: string;
    agencyDraft?: string;
    lastSelectedJobId?: string;
}

export const getUiState = (): UiState => {
    try {
        const s = localStorage.getItem(UI_STATE_KEY);
        return s ? JSON.parse(s) : {};
    } catch { return {}; }
}

export const saveUiState = (updates: Partial<UiState>) => {
    const current = getUiState();
    localStorage.setItem(UI_STATE_KEY, JSON.stringify({ ...current, ...updates }));
}

// --- Applications ---

export const getApplications = (): ApplicationRecord[] => {
  try {
    const stored = localStorage.getItem(APPS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error("Failed to load applications", e);
    return [];
  }
};

export const saveApplication = (
  job: JobOpportunity, 
  materials: GeneratedContent, 
  method: 'Email' | 'LinkedIn' | 'Portal'
) => {
  const apps = getApplications();
  const exists = apps.find(a => a.id === job.id);
  if (exists) return exists; // Return existing if duplicate

  const newApp: ApplicationRecord = {
    ...job,
    appliedDate: new Date().toISOString(),
    applicationMaterials: materials,
    method,
    status: 'applied'
  };

  localStorage.setItem(APPS_KEY, JSON.stringify([newApp, ...apps]));
  
  // Update Daily Goals
  incrementDailyGoal('applicationsSent');
  
  return newApp;
};

export const updateApplicationStatus = (id: string, status: any) => {
  const apps = getApplications();
  const index = apps.findIndex(a => a.id === id);
  if (index !== -1) {
    apps[index].status = status;
    localStorage.setItem(APPS_KEY, JSON.stringify(apps));
  }
};

export const getStats = () => {
  const apps = getApplications();
  return {
    total: apps.length,
    interviewing: apps.filter(a => a.status === 'interviewing').length,
    applied: apps.filter(a => a.status === 'applied').length,
    rejected: apps.filter(a => a.status === 'rejected').length,
    offers: apps.filter(a => a.status === 'offer').length,
  };
};

// --- Interactions ---

export const getInteractions = (type?: 'Agency' | 'Recruiter'): InteractionRecord[] => {
    try {
        const stored = localStorage.getItem(INTERACTIONS_KEY);
        const all = stored ? JSON.parse(stored) : [];
        if (type) {
            return all.filter((i: InteractionRecord) => i.targetType === type);
        }
        return all;
    } catch (e) {
        return [];
    }
}

export const saveInteraction = (name: string, type: 'Agency' | 'Recruiter', details: string) => {
    const all = getInteractions();
    const newRecord: InteractionRecord = {
        id: Math.random().toString(36).substr(2, 9),
        name,
        targetType: type,
        date: new Date().toISOString(),
        details,
        status: 'Contacted'
    };
    localStorage.setItem(INTERACTIONS_KEY, JSON.stringify([newRecord, ...all]));
    
    // Update Daily Goals
    if (type === 'Recruiter') incrementDailyGoal('recruitersContacted');
    
    return newRecord;
}

export const getExcludedNames = (type: 'Agency' | 'Recruiter'): string[] => {
    return getInteractions(type).map(i => i.name);
}

export const getLastContactDate = (name: string): string | null => {
    const all = getInteractions();
    const record = all.find(i => i.name === name);
    return record ? record.date : null;
}

// --- Visa ---

export const getVisaDetails = (): VisaDetails => {
    const stored = localStorage.getItem(VISA_KEY);
    return stored ? JSON.parse(stored) : {
        entryDate: new Date().toISOString().split('T')[0],
        visaDurationDays: 60,
        documentsReady: { passport: true, photo: true, attestedDegree: false, insurance: false }
    };
}

export const saveVisaDetails = (details: VisaDetails) => {
    localStorage.setItem(VISA_KEY, JSON.stringify(details));
}

// --- Signals & Events ---

export const getSavedSignals = (): MarketSignal[] => {
    const stored = localStorage.getItem(SIGNALS_KEY);
    return stored ? JSON.parse(stored) : [];
}

export const saveSignals = (signals: MarketSignal[]) => {
    localStorage.setItem(SIGNALS_KEY, JSON.stringify(signals));
}

export const getSavedEvents = (): TechEvent[] => {
    const stored = localStorage.getItem(EVENTS_KEY);
    return stored ? JSON.parse(stored) : [];
}

export const saveEvents = (events: TechEvent[]) => {
    localStorage.setItem(EVENTS_KEY, JSON.stringify(events));
}

// --- PERSISTENCE HELPERS (New) ---

export const saveJobSearchResults = (jobs: JobOpportunity[], query: string) => {
    localStorage.setItem(JOB_RESULTS_KEY, JSON.stringify(jobs));
    localStorage.setItem(JOB_QUERY_KEY, query);
}

export const getJobSearchResults = (): { jobs: JobOpportunity[], query: string } => {
    const jobs = localStorage.getItem(JOB_RESULTS_KEY);
    const query = localStorage.getItem(JOB_QUERY_KEY);
    return {
        jobs: jobs ? JSON.parse(jobs) : [],
        query: query || ''
    };
}

export const saveRecruiterResults = (recruiters: RecruiterProfile[], query: string) => {
    localStorage.setItem(RECRUITER_RESULTS_KEY, JSON.stringify(recruiters));
    localStorage.setItem(RECRUITER_QUERY_KEY, query);
}

export const getRecruiterResults = (): { recruiters: RecruiterProfile[], query: string } => {
    const recs = localStorage.getItem(RECRUITER_RESULTS_KEY);
    const query = localStorage.getItem(RECRUITER_QUERY_KEY);
    return {
        recruiters: recs ? JSON.parse(recs) : [],
        query: query || ''
    };
}

export const saveAgencyResults = (agencies: AgencyProfile[]) => {
    localStorage.setItem(AGENCY_RESULTS_KEY, JSON.stringify(agencies));
}

export const getAgencyResults = (): AgencyProfile[] => {
    const ag = localStorage.getItem(AGENCY_RESULTS_KEY);
    return ag ? JSON.parse(ag) : [];
}

export const saveDraft = (jd: string, content: GeneratedContent | null) => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ jd, content }));
}

export const getDraft = (): { jd: string, content: GeneratedContent | null } | null => {
    const d = localStorage.getItem(DRAFT_KEY);
    return d ? JSON.parse(d) : null;
}

// --- DAILY GOALS (New) ---

export const getDailyGoals = (): DailyGoals => {
    const today = new Date().toISOString().split('T')[0];
    const stored = localStorage.getItem(GOALS_KEY);
    
    if (stored) {
        const goals: DailyGoals = JSON.parse(stored);
        if (goals.date === today) {
            return goals;
        } else {
            // New day, reset counts but keep streak if consecutive
            const lastDate = new Date(goals.date);
            const diffDays = Math.floor((new Date().getTime() - lastDate.getTime()) / (1000 * 3600 * 24));
            return {
                date: today,
                applicationsSent: 0,
                recruitersContacted: 0,
                streak: diffDays <= 1 ? goals.streak : 0 // Keep streak if yesterday, else reset
            };
        }
    }
    
    return { date: today, applicationsSent: 0, recruitersContacted: 0, streak: 0 };
}

const incrementDailyGoal = (key: 'applicationsSent' | 'recruitersContacted') => {
    const goals = getDailyGoals();
    goals[key]++;
    
    // Check if daily target met (5 apps, 5 recruiters) to increment streak logic could go here
    // For now simple increment
    if (goals.applicationsSent >= 5 && goals.recruitersContacted >= 5 && goals.streak === 0) {
        // First time hitting goals today? maybe logic for streak
    }
    
    localStorage.setItem(GOALS_KEY, JSON.stringify(goals));
    // Dispatch event to update UI
    window.dispatchEvent(new Event('goals-updated'));
}