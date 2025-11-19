import React, { useState } from 'react';
import { Search, MapPin, ExternalLink, Loader2, Plus, Briefcase } from 'lucide-react';
import { searchJobsInUAE } from '../services/geminiService';
import { JobOpportunity, PersonaType } from '../types';
import { UAE_SEARCH_QUERIES } from '../constants';

interface JobSearchProps {
  onSelectJob: (job: JobOpportunity) => void;
  setPersona: (p: PersonaType) => void;
}

const JobSearch: React.FC<JobSearchProps> = ({ onSelectJob, setPersona }) => {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<JobOpportunity[]>([]);

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

  return (
    <div className="p-8 h-screen flex flex-col">
      <h2 className="text-2xl font-bold text-white mb-6">Job Search Agent (UAE)</h2>

      {/* Search Input */}
      <div className="flex gap-4 mb-8">
        <div className="relative flex-1">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. Content Strategist Web3 Dubai"
            className="w-full bg-dark-card border border-dark-border rounded-lg py-3 px-4 pl-12 text-white focus:outline-none focus:border-brand-500"
          />
          <Search className="absolute left-4 top-3.5 text-slate-500" size={18} />
        </div>
        <button
          onClick={() => handleSearch(query)}
          disabled={isLoading}
          className="bg-brand-600 hover:bg-brand-500 text-white px-6 py-3 rounded-lg font-medium disabled:opacity-50 flex items-center gap-2"
        >
          {isLoading ? <Loader2 className="animate-spin" /> : 'Activate Search'}
        </button>
      </div>

      {/* Quick Tags */}
      <div className="flex flex-wrap gap-2 mb-8">
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
      <div className="flex-1 overflow-y-auto pr-2 space-y-4">
        {results.length === 0 && !isLoading && (
          <div className="text-center text-slate-500 py-20">
            <Search size={48} className="mx-auto mb-4 opacity-20" />
            <p>Initiate a search to find opportunities in the UAE.</p>
          </div>
        )}

        {results.map((job) => (
          <div key={job.id} className="bg-dark-card border border-dark-border p-5 rounded-xl hover:border-slate-500 transition-all group">
            <div className="flex justify-between items-start">
              <div className="flex-1 pr-4">
                <h3 className="text-lg font-bold text-white group-hover:text-brand-400 transition-colors">{job.title}</h3>
                <div className="flex items-center gap-4 mt-2 text-sm text-slate-400">
                  <span className="flex items-center gap-1"><Briefcase size={14}/> {job.company}</span>
                  <span className="flex items-center gap-1"><MapPin size={14}/> {job.location}</span>
                  <span className="text-xs px-2 py-0.5 bg-slate-800 rounded border border-slate-700">{job.source}</span>
                </div>
                {job.description && (
                    <p className="text-slate-400 text-sm mt-3 line-clamp-2">{job.description}</p>
                )}
              </div>
              <div className="flex flex-col gap-2 shrink-0">
                <button 
                    onClick={() => onSelectJob(job)}
                    className="p-2 bg-brand-600/20 text-brand-400 rounded-lg hover:bg-brand-600 hover:text-white transition-colors flex items-center gap-2 text-sm px-4 whitespace-nowrap"
                >
                    <Plus size={16}/> Generate Application
                </button>
                {job.url && (
                    <a href={job.url} target="_blank" rel="noreferrer" className="p-2 text-slate-500 hover:text-slate-300 flex justify-center" title="Open Job Link">
                        <ExternalLink size={16}/>
                    </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default JobSearch;