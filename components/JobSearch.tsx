
import React, { useState } from 'react';
import { Search, MapPin, ExternalLink, Loader2, Plus, Mail, Globe, Sparkles, Linkedin, CheckCircle2, AlertTriangle, Building2, DollarSign, Filter } from 'lucide-react';
import { searchJobsInUAE, analyzeProfileForSearch } from '../services/geminiService';
import { JobOpportunity, PersonaType, SearchFocus } from '../types';
import { UAE_SEARCH_QUERIES } from '../constants';

interface JobSearchProps {
  onSelectJob: (job: JobOpportunity) => void;
  setPersona: (p: PersonaType) => void;
  results: JobOpportunity[];
  setResults: (jobs: JobOpportunity[]) => void;
  query: string;
  setQuery: (q: string) => void;
}

export default function JobSearch({ 
  onSelectJob, 
  setPersona,
  results,
  setResults,
  query,
  setQuery
}: JobSearchProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [searchFocus, setSearchFocus] = useState<SearchFocus>(SearchFocus.ALL);

  const handleSearch = async (searchQuery: string) => {
    setQuery(searchQuery);
    setIsLoading(true);
    try {
      const jobs = await searchJobsInUAE(searchQuery, searchFocus);
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
        
        // Artificial delay to prevent Rate Limit (RPM) hit when chaining two API calls
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        handleSearch(optimizedQuery);
    } catch(e) {
        console.error(e);
    } finally {
        setIsAnalyzing(false);
    }
  }

  const getSmartSearchUrl = (job: JobOpportunity) => {
      if (job.search_query) {
          return `https://www.google.com/search?q=${encodeURIComponent(job.search_query)}`;
      }
      const q = encodeURIComponent(`${job.title} ${job.company} UAE careers application`);
      return `https://www.google.com/search?q=${q}`;
  };

  const getSourceBadge = (source: string) => {
      const s = source.toLowerCase();
      if (s.includes('linkedin')) return <span className="flex items-center gap-1 text-[#0077b5]"><Linkedin size={12} fill="currentColor" /> LinkedIn</span>;
      if (s.includes('indeed')) return <span className="text-blue-400 font-bold">Indeed</span>;
      if (s.includes('naukri')) return <span className="text-yellow-500 font-bold">Naukri</span>;
      return <span>{source}</span>;
  };

  const getLinkQuality = (job: JobOpportunity) => {
      if (!job.url && !job.applyUrl) return 'missing';
      const url = (job.applyUrl || job.url || '').toLowerCase();
      if (url.includes('linkedin.com/jobs') || url.includes('indeed') || url.includes('naukrigulf')) return 'verified';
      if (url.includes('career') || url.includes('jobs')) return 'likely';
      return 'generic';
  };

  return (
    <div className="p-8 h-screen flex flex-col bg-dark-bg">
      <header className="mb-8">
          <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <Search className="text-brand-500" size={32}/> 
            Job Search Agent
          </h2>
          <p className="text-slate-400">Multi-source scraping with salary insights across UAE.</p>
      </header>

      {/* Search Interface */}
      <div className="bg-dark-card border border-dark-border p-4 rounded-xl mb-6 shadow-lg">
          <div className="flex items-center gap-4 mb-4 border-b border-slate-800 pb-4">
             <div className="flex items-center gap-2 text-sm text-slate-400">
                 <Filter size={14} /> Focus:
             </div>
             <div className="flex flex-wrap gap-2">
                 {Object.values(SearchFocus).map(focus => (
                     <button
                        key={focus}
                        onClick={() => setSearchFocus(focus)}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                            searchFocus === focus 
                            ? 'bg-brand-600 text-white border border-brand-500' 
                            : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
                        }`}
                     >
                         {focus}
                     </button>
                 ))}
             </div>
          </div>

          <div className="flex gap-4">
            <div className="relative flex-1">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={`Search jobs in ${searchFocus === SearchFocus.ALL ? 'UAE' : searchFocus}...`}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg py-3 px-4 pl-12 text-white focus:outline-none focus:border-brand-500 placeholder-slate-600 transition-all"
                onKeyDown={(e) => e.key === 'Enter' && handleSearch(query)}
              />
              <Search className="absolute left-4 top-3.5 text-slate-500" size={18} />
            </div>
            
            <button
                onClick={handleProfileMatch}
                disabled={isLoading || isAnalyzing}
                className="bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 px-6 rounded-lg font-medium flex items-center gap-2 transition-all whitespace-nowrap"
            >
                {isAnalyzing ? <Loader2 className="animate-spin" size={18}/> : <Sparkles size={18} />}
                Match Profile
            </button>

            <button
              onClick={() => handleSearch(query)}
              disabled={isLoading || isAnalyzing}
              className="bg-brand-600 hover:bg-brand-500 text-white px-8 rounded-lg font-bold disabled:opacity-50 flex items-center gap-2 transition-all shadow-lg shadow-brand-500/20"
            >
              {isLoading ? <Loader2 className="animate-spin" /> : 'Scour Web'}
            </button>
          </div>
      </div>

      {/* Results Grid */}
      <div className="flex-1 overflow-y-auto pr-2 pb-20 custom-scrollbar">
        {results.length === 0 && !isLoading && !isAnalyzing && (
          <div className="h-64 flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-slate-800 rounded-xl bg-slate-900/20">
            <Globe size={48} className="mb-4 opacity-20" />
            <p className="text-lg font-medium">Ready to explore the UAE job market</p>
            <p className="text-sm opacity-60">Select a focus area and search.</p>
          </div>
        )}
        
        {(isLoading || isAnalyzing) && results.length === 0 && (
             <div className="flex flex-col justify-center items-center py-20 gap-4">
                 <Loader2 size={48} className="animate-spin text-brand-500"/>
                 <p className="text-brand-400 font-mono text-sm animate-pulse">Scraping diverse sources & Estimating salaries...</p>
             </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-4">
            {results.map((job) => {
                const linkQuality = getLinkQuality(job);
                return (
                <div key={job.id} className="group bg-dark-card border border-dark-border hover:border-brand-500/50 rounded-xl p-5 transition-all hover:shadow-xl hover:shadow-black/40 flex flex-col">
                    {/* Header */}
                    <div className="flex justify-between items-start gap-3 mb-3">
                        <div>
                            <h3 className="text-lg font-bold text-white group-hover:text-brand-400 transition-colors leading-tight mb-1">{job.title}</h3>
                            <div className="flex items-center gap-2 text-sm text-slate-400">
                                <Building2 size={14} /> {job.company}
                            </div>
                        </div>
                        <div className="shrink-0 flex flex-col items-end gap-1">
                            {job.applyEmail ? (
                                <span className="bg-orange-500/10 text-orange-400 text-[10px] px-2 py-1 rounded border border-orange-500/20 font-mono flex items-center gap-1">
                                    <Mail size={10}/> EMAIL
                                </span>
                            ) : (
                                <span className="bg-blue-500/10 text-blue-400 text-[10px] px-2 py-1 rounded border border-blue-500/20 font-mono flex items-center gap-1">
                                    <Globe size={10}/> PORTAL
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Metadata */}
                    <div className="flex flex-wrap items-center gap-2 mb-4">
                        <span className="px-2 py-1 rounded bg-slate-800 text-xs text-slate-300 border border-slate-700 flex items-center gap-1">
                            <MapPin size={10}/> {job.location}
                        </span>
                        {job.salaryEstimate && (
                            <span className="px-2 py-1 rounded bg-emerald-900/20 text-xs text-emerald-400 border border-emerald-900/30 flex items-center gap-1 font-mono">
                                <DollarSign size={10}/> {job.salaryEstimate}
                            </span>
                        )}
                        <span className="px-2 py-1 rounded bg-slate-800 text-xs text-slate-300 border border-slate-700 flex items-center gap-1">
                            {getSourceBadge(job.source)}
                        </span>
                    </div>

                    {/* Description Snippet */}
                    <p className="text-sm text-slate-500 line-clamp-2 mb-5 font-sans leading-relaxed flex-1">
                        {job.description || "No description preview available. Check the job post for full details."}
                    </p>
                    
                    {/* Actions Footer */}
                    <div className="mt-auto pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
                        <div className="flex gap-2">
                            {linkQuality !== 'verified' && (
                                <a 
                                    href={getSmartSearchUrl(job)} 
                                    target="_blank" 
                                    rel="noreferrer" 
                                    className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-bold flex items-center gap-2 transition-colors shadow-lg shadow-blue-500/20"
                                >
                                    <Search size={14}/> Smart Find
                                </a>
                            )}
                            
                            {linkQuality !== 'missing' && (
                                <a 
                                    href={job.applyUrl || job.url} 
                                    target="_blank" 
                                    rel="noreferrer" 
                                    className={`px-3 py-2 rounded text-xs font-medium flex items-center gap-2 transition-colors border ${
                                        linkQuality === 'verified' 
                                        ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700' 
                                        : 'bg-slate-900 text-slate-500 border-slate-800'
                                    }`}
                                >
                                    <ExternalLink size={14}/> 
                                    {linkQuality === 'verified' ? 'Direct Link' : 'Visit Site'}
                                </a>
                            )}
                        </div>

                        <button 
                            onClick={() => onSelectJob(job)}
                            className="bg-brand-600 hover:bg-brand-500 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-lg shadow-brand-500/10 transition-transform active:scale-95"
                        >
                            <Plus size={16}/> Apply
                        </button>
                    </div>
                </div>
            )})}
        </div>
    </div>
  );
}
