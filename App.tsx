import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import JobSearch from './components/JobSearch';
import ApplicationBot from './components/ApplicationBot';
import Agencies from './components/Agencies';
import RecruiterOutreach from './components/RecruiterOutreach';
import { JobOpportunity, PersonaType } from './types';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedJob, setSelectedJob] = useState<JobOpportunity | null>(null);
  const [persona, setPersona] = useState<PersonaType>(PersonaType.MARKETING);

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
        return <JobSearch onSelectJob={handleSelectJob} setPersona={setPersona} />;
      case 'apply':
        return <ApplicationBot selectedJob={selectedJob} />;
      case 'outreach':
        return <RecruiterOutreach />;
      case 'agencies':
        return <Agencies />;
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