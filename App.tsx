
import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import JobSearch from './components/JobSearch';
import ApplicationBot from './components/ApplicationBot';
import Agencies from './components/Agencies';
import RecruiterOutreach from './components/RecruiterOutreach';
import ApplicationHistory from './components/ApplicationHistory';
import MarketSignals from './components/MarketSignals';
import Events from './components/Events';
import { JobOpportunity, PersonaType, RecruiterProfile, AgencyProfile } from './types';
import { USER_PROFILE } from './constants';
import { Mail, Phone, MapPin, Globe, Copy, ExternalLink } from 'lucide-react';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedJob, setSelectedJob] = useState<JobOpportunity | null>(null);
  const [persona, setPersona] = useState<PersonaType>(PersonaType.MARKETING);
  const [showProfileHud, setShowProfileHud] = useState(false);
  
  const [jobSearchResults, setJobSearchResults] = useState<JobOpportunity[]>([]);
  const [jobSearchQuery, setJobSearchQuery] = useState('');
  const [recruiterResults, setRecruiterResults] = useState<RecruiterProfile[]>([]);
  const [recruiterQuery, setRecruiterQuery] = useState('');
  const [agencyResults, setAgencyResults] = useState<AgencyProfile[]>([]);

  const handleSelectJob = (job: JobOpportunity) => {
    setSelectedJob(job);
    setActiveTab('apply');
  };

  const handleSignalAction = (company: string) => {
      setRecruiterQuery(company);
      setActiveTab('outreach');
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard />;
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
          />
        );
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
      default: return <Dashboard />;
    }
  };

  return (
    <div className="flex min-h-screen bg-dark-bg text-slate-200 font-sans">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        toggleProfileHud={() => setShowProfileHud(!showProfileHud)}
        showProfileHud={showProfileHud}
      />
      <main className="flex-1 ml-64 relative">
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
    </div>
  );
};

export default App;
