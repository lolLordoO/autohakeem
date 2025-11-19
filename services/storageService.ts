
import { ApplicationRecord, JobOpportunity, GeneratedContent, InteractionRecord, VisaDetails, MarketSignal, TechEvent } from '../types';

const APPS_KEY = 'autohakeem_applications';
const INTERACTIONS_KEY = 'autohakeem_interactions';
const VISA_KEY = 'autohakeem_visa';
const SIGNALS_KEY = 'autohakeem_signals';
const EVENTS_KEY = 'autohakeem_events';

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
  if (exists) return;

  const newApp: ApplicationRecord = {
    ...job,
    appliedDate: new Date().toISOString(),
    applicationMaterials: materials,
    method,
    status: 'applied'
  };

  localStorage.setItem(APPS_KEY, JSON.stringify([newApp, ...apps]));
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
