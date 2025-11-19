
import React, { useState } from 'react';
import { Search, MapPin, ExternalLink, Loader2, Plus, Briefcase, Mail, Globe, Sparkles } from 'lucide-react';
import { searchJobsInUAE, analyzeProfileForSearch } from '../services/geminiService';
import { JobOpportunity, PersonaType } from '../types';
import { UAE_SEARCH_QUERIES } from '../constants';

interface JobSearchProps {
  onSelectJob: (job: JobOpportunity) => void;
  setPersona: (p: PersonaType) => void;
  results: JobOpportunity[];
  setResults: (jobs: JobOpportunity[]) => void;
  query: string;
  setQuery: (q: string) => void;
}

const JobSearch: React.FC<JobSearchProps> = ({ 
  onSelectJob, 
  setPersona,
  results,
  setResults,
  query,
  setQuery
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleSearch = async (searchQuery: string) => {
    setQuery(searchQuery);
    setIsLoading(true);
    try {
      const jobs = await searchJobsInUAE(searchQuery);
      setResults(jobs);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileMatch = async () => {
    setIsAnalyzing(true);
    try {
        const optimizedQuery = await analyzeProfileForSearch();
        setQuery(optimizedQuery);
        handleSearch(optimizedQuery);
    } catch(e) {
        console.error(e);
    } finally {
        setIsAnalyzing(false);
    }
  }

  // Fail-safe Google Search URL generator
  const getSmartSearchUrl = (job: JobOpportunity) => {
      const q = encodeURIComponent(`${job.title} ${job.company} UAE application`);
      return `https://www.google.com/search?q=${q}`;
  };

  return (
    <div className="p-8 h-screen flex flex-col">
      <h2 className="text-2xl font-bold text-white mb-6">Job Search Agent (Scour & Scrape)</h2>

      {/* Search Input */}
      <div className="flex gap-4 mb-6">
        <div className="relative flex-1">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. Content Strategist Web3 Dubai"
            className="w-full bg-dark-card border border-dark-border rounded-lg py-3 px-4 pl-12 text-white focus:outline-none focus:border-brand-500"
            onKeyDown={(e) => e.key === 'Enter' && handleSearch(query)}
          />
          <Search className="absolute left-4 top-3.5 text-slate-500" size={18} />
        </div>
        
        <button
            onClick={handleProfileMatch}
            disabled={isLoading || isAnalyzing}
            className="bg-purple-600 hover:bg-purple-500 text-white px-4 rounded-lg font-medium flex items-center gap-2 transition-colors shadow-lg shadow-purple-500/20 border border-purple-400/30"
            title="Analyze my CV/Profile to find the best jobs automatically"
        >
            {isAnalyzing ? <Loader2 className="animate-spin" size={18}/> : <Sparkles size={18} />}
            <span className="whitespace-nowrap">Match Profile</span>
        </button>

        <button
          onClick={() => handleSearch(query)}
          disabled={isLoading || isAnalyzing}
          className="bg-brand-600 hover:bg-brand-500 text-white px-6 rounded-lg font-medium disabled:opacity-50 flex items-center gap-2"
        >
          {isLoading ? <Loader2 className="animate-spin" /> : 'Scour Web'}
        </button>
      </div>

      {/* Quick Tags */}
      <div className="flex flex-wrap gap-2 mb-6">
        {UAE_SEARCH_QUERIES.map((q, i) => (
          <button
            key={i}
            onClick={() => handleSearch(q)}
            className="px-3 py-1 rounded-full border border-slate-700 bg-slate-800/50 text-xs text-slate-300 hover:border-brand-500 hover:text-brand-400 transition-colors"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Results List */}
      <div className="flex-1 overflow-y-auto pr-2 pb-20">
        {results.length === 0 && !isLoading && !isAnalyzing && (
          <div className="text-center text-slate-500 py-20 border border-dashed border-slate-800 rounded-xl">
            <Search size={48} className="mx-auto mb-4 opacity-20" />
            <p>Initiate a deep search to find opportunities in the UAE.</p>
            <p className="text-xs text-slate-600 mt-2">Results are preserved when you navigate tabs.</p>
          </div>
        )}
        
        {(isLoading || isAnalyzing) && results.length === 0 && (
             <div className="flex flex-col justify-center items-center py-20 gap-4">
                 <Loader2 className="animate-spin text-brand-500" size={48} />
                 {isAnalyzing && <p className="text-purple-400 text-sm animate-pulse">Analyzing Profile & Resumes...</p>}
             </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {results.map((job) => (
            <div key={job.id} className="bg-dark-card border border-dark-border p-5 rounded-xl hover:border-brand-500/50 transition-all group flex flex-col shadow-lg shadow-black/20">
                <div className="flex-1">
                    <div className="flex justify-between items-start">
                        <h3 className="text-lg font-bold text-white group-hover:text-brand-400 transition-colors line-clamp-2">{job.title}</h3>
                         {/* Type Indicator */}
                        {job.applyEmail ? (
                            <span className="text-[10px] bg-orange-500/20 text-orange-400 px-2 py-1 rounded border border-orange-500/30 flex items-center gap-1 shrink-0">
                                <Mail size={10}/> Direct Email
                            </span>
                        ) : (
                             <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-1 rounded border border-blue-500/30 flex items-center gap-1 shrink-0">
                                <Globe size={10}/> Portal
                            </span>
                        )}
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2 text-sm text-slate-400">
                        <span className="flex items-center gap-1"><Briefcase size={14}/> {job.company}</span>
                        <span className="flex items-center gap-1"><MapPin size={14}/> {job.location}</span>
                        <span className="text-xs px-2 py-0.5 bg-slate-800 rounded border border-slate-700">{job.source}</span>
                    </div>
                    {job.description && (
                        <p className="text-slate-500 text-sm mt-3 line-clamp-3">{job.description}</p>
                    )}
                </div>
                
                <div className="mt-4 pt-4 border-t border-slate-800 flex justify-between items-center gap-3">
                     <div className="flex gap-2 items-center">
                        {(job.url || job.applyUrl) && (
                            <a 
                                href={job.applyUrl || job.url} 
                                target="_blank" 
                                rel="noreferrer" 
                                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs font-medium flex items-center gap-2 transition-colors"
                                title="Open Direct Link"
                            >
                                <ExternalLink size={14}/> Link
                            </a>
                        )}
                        <a 
                            href={getSmartSearchUrl(job)} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="px-3 py-2 bg-blue-900/30 hover:bg-blue-900/50 text-blue-400 rounded text-xs font-medium flex items-center gap-2 border border-blue-900/50 transition-colors"
                            title="Search Google for Application Page (Use if direct link fails)"
                        >
                            <Search size={14}/> Smart Find
                        </a>
                     </div>
                    <button 
                        onClick={() => onSelectJob(job)}
                        className="bg-brand-600 hover:bg-brand-500 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 shadow-lg shadow-brand-500/10 ml-auto"
                    >
                        <Plus size={16}/> Draft App
                    </button>
                </div>
            </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default JobSearch;
