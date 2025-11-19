import { ApplicationRecord, JobOpportunity, GeneratedContent } from '../types';

const APPS_KEY = 'autohakeem_applications';

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
