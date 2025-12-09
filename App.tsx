
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import JobSearch from './components/JobSearch';
import ApplicationBot from './components/ApplicationBot';
import Agencies from './components/Agencies';
import RecruiterOutreach from './components/RecruiterOutreach';
import ApplicationHistory from './components/ApplicationHistory';
import MarketSignals from './components/MarketSignals';
import Events from './components/Events';
import Settings from './components/Settings';
import BrandEngine from './components/BrandEngine';
import MockInterview from './components/MockInterview';
import JobSense from './components/JobSense';
import FreshDrops from './components/FreshDrops'; // New Import
import { JobOpportunity, PersonaType, RecruiterProfile, AgencyProfile } from './types';
import { USER_PROFILE } from './constants';
import { Mail, MapPin, Globe, Copy, ExternalLink, AlertTriangle, XCircle } from 'lucide-react';
import { getJobSearchResults, saveJobSearchResults, getRecruiterResults, saveRecruiterResults, getAgencyResults, saveAgencyResults, getUiState, saveUiState } from './services/storageService';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedJob, setSelectedJob] = useState<JobOpportunity | null>(null);
  const [persona, setPersona] = useState<PersonaType>(PersonaType.MARKETING);
  const [showProfileHud, setShowProfileHud] = useState(false);
  
  // Persistent States
  const [jobSearchResults, setJobSearchResults] = useState<JobOpportunity[]>([]);
  const [jobSearchQuery, setJobSearchQuery] = useState('');
  
  const [recruiterResults, setRecruiterResults] = useState<RecruiterProfile[]>([]);
  const [recruiterQuery, setRecruiterQuery] = useState('');
  
  const [agencyResults, setAgencyResults] = useState<AgencyProfile[]>([]);

  // Load from Storage on Mount
  useEffect(() => {
      const savedJobs = getJobSearchResults();
      setJobSearchResults(savedJobs.jobs);
      setJobSearchQuery(savedJobs.query);

      const savedRecs = getRecruiterResults();
      setRecruiterResults(savedRecs.recruiters);
      setRecruiterQuery(savedRecs.query);

      setAgencyResults(getAgencyResults());

      // Load UI State (Tab, Last Job)
      const uiState = getUiState();
      if (uiState.activeTab) setActiveTab(uiState.activeTab);
      
      // Try to restore selected job if ID exists and we have results
      if (uiState.lastSelectedJobId && savedJobs.jobs.length > 0) {
          const found = savedJobs.jobs.find(j => j.id === uiState.lastSelectedJobId);
          if (found) setSelectedJob(found);
      }
  }, []);

  // Save to Storage on Update
  useEffect(() => {
      if (jobSearchResults.length > 0) saveJobSearchResults(jobSearchResults, jobSearchQuery);
  }, [jobSearchResults, jobSearchQuery]);

  useEffect(() => {
      if (recruiterResults.length > 0) saveRecruiterResults(recruiterResults, recruiterQuery);
  }, [recruiterResults, recruiterQuery]);
  
  useEffect(() => {
      if (agencyResults.length > 0) saveAgencyResults(agencyResults);
  }, [agencyResults]);

  // Persist Active Tab
  useEffect(() => {
      saveUiState({ activeTab });
  }, [activeTab]);


  // Global Error State
  const [globalError, setGlobalError] = useState<{type: string, message: string} | null>(null);

  useEffect(() => {
      const handleGeminiError = (e: CustomEvent) => {
          setGlobalError(e.detail);
      };
      window.addEventListener('gemini-error' as any, handleGeminiError as any);
      return () => window.removeEventListener('gemini-error' as any, handleGeminiError as any);
  }, []);

  const handleSelectJob = (job: JobOpportunity) => {
    setSelectedJob(job);
    saveUiState({ lastSelectedJobId: job.id });
    setActiveTab('apply');
  };

  const handleSignalAction = (company: string) => {
      setRecruiterQuery(company);
      setActiveTab('outreach');
  }

  // Cross-Pollination Logic
  const handleHuntRecruiters = (company: string) => {
      setRecruiterQuery(company);
      setActiveTab('outreach');
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard />;
      case 'fresh-drops': return <FreshDrops />; // New Route
      case 'signals': return <MarketSignals onSignalAction={handleSignalAction} />;
      case 'events': return <Events />;
      case 'search':
        return (
          <JobSearch 
            onSelectJob={handleSelectJob} 
            setPersona={setPersona}
            results={jobSearchResults}
            setResults={setJobSearchResults}
            query={jobSearchQuery}
            setQuery={setJobSearchQuery}
            onHuntRecruiters={handleHuntRecruiters}
          />
        );
      case 'jobsense': return <JobSense />;
      case 'apply': return <ApplicationBot selectedJob={selectedJob} />;
      case 'tracker': return <ApplicationHistory />;
      case 'outreach':
        return (
          <RecruiterOutreach 
             results={recruiterResults}
             setResults={setRecruiterResults}
             companyQuery={recruiterQuery}
             setCompanyQuery={setRecruiterQuery}
          />
        );
      case 'agencies':
        return (
          <Agencies 
            results={agencyResults}
            setResults={setAgencyResults}
          />
        );
      case 'brand': return <BrandEngine />; 
      case 'settings': return <Settings />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="flex min-h-screen bg-dark-bg text-slate-200 font-sans relative">
      {/* Global Error Banner */}
      {globalError && (
          <div className="fixed top-0 left-0 w-full z-[100] bg-red-600 text-white p-4 shadow-2xl flex justify-between items-center animate-in slide-in-from-top-full">
              <div className="flex items-center gap-3 max-w-4xl mx-auto w-full">
                  <AlertTriangle size={24} className="shrink-0 text-red-200" fill="currentColor"/>
                  <div className="flex-1">
                      <h3 className="font-bold text-lg">System Overload: API Quota Exceeded</h3>
                      <p className="text-sm text-red-100">
                          You have hit the Google Gemini Free Tier rate limit. 
                          <span className="font-bold ml-1">Solution:</span> Wait a few minutes, or enable billing for higher limits.
                      </p>
                  </div>
                  <div className="flex items-center gap-4">
                      <a 
                        href="https://aistudio.google.com/app/settings/billing" 
                        target="_blank"
                        rel="noreferrer"
                        className="px-4 py-2 bg-white text-red-600 rounded-lg font-bold text-sm hover:bg-red-50 transition-colors whitespace-nowrap"
                      >
                          Upgrade Quota
                      </a>
                      <button onClick={() => setGlobalError(null)}><XCircle size={24} className="opacity-80 hover:opacity-100"/></button>
                  </div>
              </div>
          </div>
      )}

      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        toggleProfileHud={() => setShowProfileHud(!showProfileHud)}
        showProfileHud={showProfileHud}
      />
      <main className={`flex-1 ml-64 relative transition-all ${globalError ? 'pt-12' : ''}`}>
        {renderContent()}

        {showProfileHud && (
            <div className="absolute bottom-4 left-4 z-50 w-80 bg-slate-900 border border-brand-500/50 rounded-xl shadow-2xl shadow-black overflow-hidden animate-in slide-in-from-bottom-4 fade-in">
                <div className="bg-brand-900/20 p-4 border-b border-white/5 flex justify-between items-center">
                    <h3 className="font-bold text-white text-sm">Abdul Hakeem</h3>
                    <span className="text-[10px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded border border-green-500/30">AVAILABLE</span>
                </div>
                <div className="p-4 space-y-3">
                    <div className="flex items-center gap-3 text-xs text-slate-300 group cursor-pointer hover:text-white" onClick={() => navigator.clipboard.writeText(USER_PROFILE.email)}>
                        <Mail size={14} className="text-brand-500"/>
                        <span className="truncate flex-1">{USER_PROFILE.email}</span>
                        <Copy size={12} className="opacity-0 group-hover:opacity-100"/>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-300">
                        <MapPin size={14} className="text-brand-500"/>
                        <span className="truncate flex-1">{USER_PROFILE.location}</span>
                    </div>
                    <div className="pt-3 border-t border-white/5 space-y-2">
                        {Object.entries(USER_PROFILE.websites).map(([key, url]) => (
                            <a key={key} href={url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-[10px] text-slate-400 hover:text-brand-400 transition-colors">
                                <Globe size={12}/>
                                <span className="uppercase truncate">{key.split(' ')[0]} Portfolio</span>
                                <ExternalLink size={10} className="ml-auto"/>
                            </a>
                        ))}
                    </div>
                </div>
            </div>
        )}
      </main>
      
      {/* Mock Interview Launch Button (Overlay for quick access if needed) */}
      {activeTab === 'tracker' && (
           <button 
                onClick={() => setActiveTab('mock-interview')} 
                className="fixed bottom-8 right-8 bg-red-600 hover:bg-red-500 text-white rounded-full p-4 shadow-2xl z-50 transition-transform hover:scale-105 hidden"
            >
               <div className="flex items-center gap-2">
                   <div className="font-bold">Practice Mode</div>
               </div>
           </button>
      )}
    </div>
  );
};

export default App;