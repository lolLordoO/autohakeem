
import { ApplicationRecord, JobOpportunity, GeneratedContent, InteractionRecord } from '../types';

const APPS_KEY = 'autohakeem_applications';
const INTERACTIONS_KEY = 'autohakeem_interactions';

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
  
  // Check if already exists to prevent duplicates
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

export const updateApplicationStatus = (id: string, status: 'found' | 'applied' | 'interviewing' | 'rejected') => {
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
  };
};

// --- Interactions (Agencies / Recruiters) ---

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
    // Prevent exact dupes
    if (all.find((i: InteractionRecord) => i.name === name && i.targetType === type)) return;

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
