
import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import JobSearch from './components/JobSearch';
import ApplicationBot from './components/ApplicationBot';
import Agencies from './components/Agencies';
import RecruiterOutreach from './components/RecruiterOutreach';
import ApplicationHistory from './components/ApplicationHistory';
import { JobOpportunity, PersonaType, RecruiterProfile, AgencyProfile } from './types';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedJob, setSelectedJob] = useState<JobOpportunity | null>(null);
  const [persona, setPersona] = useState<PersonaType>(PersonaType.MARKETING);
  
  // --- MEMORY RETENTION STATE ---
  
  // Job Search Memory
  const [jobSearchResults, setJobSearchResults] = useState<JobOpportunity[]>([]);
  const [jobSearchQuery, setJobSearchQuery] = useState('');

  // Recruiter Memory
  const [recruiterResults, setRecruiterResults] = useState<RecruiterProfile[]>([]);
  const [recruiterQuery, setRecruiterQuery] = useState('');

  // Agency Memory
  const [agencyResults, setAgencyResults] = useState<AgencyProfile[]>([]);

  // Handler to jump from search to apply
  const handleSelectJob = (job: JobOpportunity) => {
    setSelectedJob(job);
    setActiveTab('apply');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
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
      case 'apply':
        return <ApplicationBot selectedJob={selectedJob} />;
      case 'tracker':
        return <ApplicationHistory />;
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
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex min-h-screen bg-dark-bg text-slate-200 font-sans">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="flex-1 ml-64">
        {renderContent()}
      </main>
    </div>
  );
};

export default App;
