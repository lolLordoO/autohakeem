
import React, { useState, useEffect } from 'react';
import { Search, MapPin, ExternalLink, Loader2, Plus, Mail, Globe, Sparkles, Linkedin, CheckCircle2, AlertTriangle, Building2, DollarSign, Filter, Copy, Flame, Trophy, Target, ArrowRight, X, Clock, Zap, BarChart3, Fingerprint } from 'lucide-react';
import { searchJobsInUAE, analyzeProfileForSearch } from '../services/geminiService';
import { JobOpportunity, PersonaType, SearchFocus, MatchGrade, JobFilters } from '../types';
import { getUiState, saveUiState } from '../services/storageService';

interface JobSearchProps {
  onSelectJob: (job: JobOpportunity) => void;
  setPersona: (p: PersonaType) => void;
  results: JobOpportunity[];
  setResults: (jobs: JobOpportunity[]) => void;
  query: string;
  setQuery: (q: string) => void;
  onHuntRecruiters: (company: string) => void; 
}

export default function JobSearch({ 
  onSelectJob, 
  setPersona,
  results,
  setResults,
  query,
  setQuery,
  onHuntRecruiters
}: JobSearchProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [searchFocus, setSearchFocus] = useState<SearchFocus>(SearchFocus.ALL);
  const [activeJob, setActiveJob] = useState<JobOpportunity | null>(null);

  // Filters
  const [filters, setFilters] = useState<JobFilters>({
      emirate: 'All',
      level: 'All',
      dateRange: 'Past Month'
  });

  // Load Persisted Focus
  useEffect(() => {
      const saved = getUiState().jobSearchFocus;
      if (saved) setSearchFocus(saved as SearchFocus);
  }, []);

  const handleFocusChange = (focus: SearchFocus) => {
      setSearchFocus(focus);
      saveUiState({ jobSearchFocus: focus });
  }

  const handleSearch = async (searchQuery: string) => {
    setQuery(searchQuery);
    setIsLoading(true);
    setActiveJob(null);
    try {
      const jobs = await searchJobsInUAE(searchQuery, searchFocus, filters);
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
        const optimizedQuery = await analyzeProfileForSearch(query);
        setQuery(optimizedQuery);
        // Safe delay to prevent instant 429 after profile analysis
        await new Promise(resolve => setTimeout(resolve, 1500)); 
        handleSearch(optimizedQuery);
    } catch(e) {
        console.error(e);
    } finally {
        setIsAnalyzing(false);
    }
  }

  const addChipToQuery = (chip: string) => {
      if (!query.includes(chip)) {
          const newQ = `${query} ${chip}`.trim();
          setQuery(newQ);
      }
  }

  const getSmartSearchUrl = (job: JobOpportunity) => {
      const q = encodeURIComponent(`intitle:"${job.title}" "${job.company}" UAE`);
      return `https://www.google.com/search?q=${q}`;
  };

  const getVerdictBadge = (grade: MatchGrade | undefined) => {
      switch(grade) {
          case 'S': return <span className="bg-brand-600/20 text-brand-400 border border-brand-500/30 text-[10px] font-bold px-2 py-0.5 rounded shadow-[0_0_10px_rgba(99,102,241,0.3)]">S-TIER</span>;
          case 'A': return <span className="bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded">A-GRADE</span>;
          case 'B': return <span className="bg-blue-600/20 text-blue-400 border border-blue-500/30 text-[10px] font-bold px-2 py-0.5 rounded">B-GRADE</span>;
          default: return null;
      }
  }

  return (
    <div className="h-screen flex flex-col bg-dark-bg overflow-hidden">
      
      {/* COMMAND CENTER HEADER */}
      <div className="p-6 border-b border-dark-border bg-dark-bg shrink-0 z-20 shadow-xl">
          <div className="flex flex-col gap-4 max-w-7xl mx-auto w-full">
               {/* Search Row */}
               <div className="flex gap-2">
                   <div className="relative flex-1 group">
                       <input
                           type="text"
                           value={query}
                           onChange={(e) => setQuery(e.target.value)}
                           placeholder={`Command Search in ${searchFocus === SearchFocus.ALL ? 'UAE' : searchFocus}...`}
                           className="w-full bg-slate-900 border border-slate-800 rounded-lg py-3 px-4 pl-10 text-white focus:outline-none focus:border-brand-500 text-sm transition-all shadow-inner group-hover:border-slate-700"
                           onKeyDown={(e) => e.key === 'Enter' && handleSearch(query)}
                       />
                       <Search className="absolute left-3 top-3.5 text-slate-500 group-hover:text-slate-300 transition-colors" size={16} />
                   </div>
                   <button
                       onClick={handleProfileMatch}
                       disabled={isLoading || isAnalyzing}
                       className="bg-purple-900/30 hover:bg-purple-900/50 text-purple-300 border border-purple-500/30 px-5 rounded-lg font-medium flex items-center gap-2 text-sm whitespace-nowrap transition-all"
                   >
                       {isAnalyzing ? <Loader2 className="animate-spin" size={16}/> : <Fingerprint size={16} />} 
                       Match DNA
                   </button>
                   <button
                       onClick={() => handleSearch(query)}
                       disabled={isLoading || isAnalyzing}
                       className="bg-brand-600 hover:bg-brand-500 text-white px-8 rounded-lg font-bold disabled:opacity-50 text-sm shadow-lg shadow-brand-500/20 transition-all active:scale-95"
                   >
                       {isLoading ? <Loader2 className="animate-spin" size={16}/> : 'Execute'}
                   </button>
               </div>

               {/* Advanced Filters & Focus */}
               <div className="flex flex-wrap items-center justify-between gap-4">
                   {/* Filters */}
                   <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-lg border border-slate-800">
                       <div className="px-2 text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1"><Filter size={10}/> Filters</div>
                       <select 
                            value={filters.emirate} 
                            onChange={e => setFilters({...filters, emirate: e.target.value as any})}
                            className="bg-slate-800 border-none text-xs text-white rounded px-2 py-1 outline-none hover:bg-slate-700 cursor-pointer"
                        >
                           <option value="All">All Emirates</option>
                           <option value="Dubai">Dubai</option>
                           <option value="Abu Dhabi">Abu Dhabi</option>
                           <option value="Remote">Remote</option>
                       </select>
                       <div className="w-px h-4 bg-slate-700"></div>
                       <select 
                            value={filters.level} 
                            onChange={e => setFilters({...filters, level: e.target.value as any})}
                            className="bg-slate-800 border-none text-xs text-white rounded px-2 py-1 outline-none hover:bg-slate-700 cursor-pointer"
                        >
                           <option value="All">All Levels</option>
                           <option value="Junior">Junior (0-2y)</option>
                           <option value="Mid-Senior">Mid (3-5y)</option>
                           <option value="Lead/Manager">Manager</option>
                       </select>
                   </div>

                   {/* Focus Bar */}
                   <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1 flex-1 justify-end">
                        {Object.values(SearchFocus).map(focus => (
                            <button
                                key={focus}
                                onClick={() => handleFocusChange(focus)}
                                className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase transition-all whitespace-nowrap border ${
                                    searchFocus === focus 
                                    ? 'bg-brand-900/40 text-brand-300 border-brand-500' 
                                    : 'bg-slate-900 text-slate-500 border-slate-800 hover:text-slate-300 hover:border-slate-700'
                                }`}
                            >
                                {focus}
                            </button>
                        ))}
                    </div>
               </div>
          </div>
      </div>

      {/* SPLIT PANE CONTENT */}
      <div className="flex-1 flex overflow-hidden">
          {/* LEFT: HIGH DENSITY GRID */}
          <div className={`${activeJob ? 'w-1/3 hidden lg:block border-r border-dark-border' : 'w-full max-w-7xl mx-auto'} overflow-y-auto custom-scrollbar bg-[#0B1221]`}>
                {(isLoading || isAnalyzing) && results.length === 0 && (
                    <div className="flex flex-col justify-center items-center py-32 gap-6">
                        <div className="relative">
                            <div className="w-16 h-16 rounded-full border-4 border-slate-800 border-t-brand-500 animate-spin"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Search size={24} className="text-brand-500"/>
                            </div>
                        </div>
                        <p className="text-brand-400 font-mono text-xs animate-pulse">Scouring 30+ UAE sources for verified roles...</p>
                    </div>
                )}
                
                {!isLoading && results.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-slate-500 py-20">
                        <BarChart3 size={64} className="mb-6 opacity-20" />
                        <h3 className="text-lg font-bold text-slate-300">Command Center Ready</h3>
                        <p className="text-sm max-w-sm text-center mt-2">Execute a search or run "Match DNA" to populate the grid with verified UAE opportunities.</p>
                    </div>
                )}

                <div className={`grid gap-3 p-4 ${!activeJob ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'}`}>
                    {results.map((job) => (
                        <div 
                            key={job.id} 
                            onClick={() => setActiveJob(job)}
                            className={`p-4 cursor-pointer hover:bg-slate-800/80 transition-all group relative rounded-xl border flex flex-col ${
                                activeJob?.id === job.id 
                                ? 'bg-brand-900/10 border-brand-500 shadow-[0_0_15px_rgba(99,102,241,0.15)]' 
                                : 'bg-dark-card border-slate-800 hover:border-slate-600 hover:shadow-lg'
                            }`}
                        >
                            <div className="flex justify-between items-start mb-3">
                                <div className="w-8 h-8 rounded bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-400 border border-slate-700">
                                    {job.company.substring(0,2).toUpperCase()}
                                </div>
                                {getVerdictBadge(job.matchGrade)}
                            </div>

                            <h3 className={`text-sm font-bold line-clamp-2 mb-1 ${activeJob?.id === job.id ? 'text-brand-300' : 'text-slate-200 group-hover:text-white'}`}>
                                {job.title}
                            </h3>
                            <div className="text-xs text-slate-500 mb-3 truncate">{job.company} • {job.location}</div>
                            
                            <div className="mt-auto space-y-2">
                                {/* Match DNA */}
                                {job.matchReason && (
                                    <div className="text-[10px] text-slate-400 bg-slate-900/50 p-1.5 rounded border border-slate-800 flex items-center gap-1.5">
                                        <Fingerprint size={10} className="text-brand-500"/>
                                        <span className="truncate">{job.matchReason}</span>
                                    </div>
                                )}
                                
                                <div className="flex justify-between items-center pt-2 border-t border-slate-800/50">
                                    <span className="text-[10px] text-slate-500 font-mono">{job.salaryEstimate?.split(' ')[1] || 'Market'}</span>
                                    <div className="flex gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                                        <button onClick={(e) => { e.stopPropagation(); window.open(getSmartSearchUrl(job), '_blank'); }} className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-white" title="Google Search"><Search size={12}/></button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
          </div>

          {/* RIGHT: INSPECTOR VIEW */}
          {activeJob ? (
              <div className="flex-1 bg-dark-card overflow-y-auto custom-scrollbar flex flex-col animate-in slide-in-from-right-4 relative z-10 border-l border-dark-border">
                  <div className="p-6 border-b border-dark-border bg-slate-900/80 sticky top-0 z-10 backdrop-blur-md">
                      <div className="flex justify-between items-start mb-4">
                          <div>
                              <button onClick={() => setActiveJob(null)} className="lg:hidden text-slate-500 hover:text-white mb-2 flex items-center gap-1 text-xs"><ArrowRight className="rotate-180" size={12}/> Back to Grid</button>
                              <h2 className="text-2xl font-bold text-white mb-1 leading-tight">{activeJob.title}</h2>
                              <div className="flex items-center gap-2 text-slate-400 text-sm font-medium">
                                  <Building2 size={14} className="text-brand-500"/> {activeJob.company}
                                  <span className="text-slate-700 mx-1">|</span>
                                  <MapPin size={14} className="text-brand-500"/> {activeJob.location}
                              </div>
                          </div>
                          {getVerdictBadge(activeJob.matchGrade)}
                      </div>
                      
                      {/* PRIMARY ACTIONS */}
                      <div className="flex gap-3">
                          <button 
                              onClick={() => onSelectJob(activeJob)}
                              className="flex-1 bg-brand-600 hover:bg-brand-500 text-white py-3 rounded-lg font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-brand-500/20 hover:scale-[1.02] transition-transform"
                          >
                              <Plus size={16}/> Draft Application
                          </button>
                          
                          {activeJob.url ? (
                               <a href={activeJob.url} target="_blank" rel="noreferrer" className="px-5 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium text-sm border border-slate-700 flex items-center gap-2">
                                   <ExternalLink size={16}/> Direct Link
                               </a>
                          ) : (
                              <button className="px-5 py-3 bg-slate-800 text-slate-600 rounded-lg text-sm border border-slate-800 cursor-not-allowed">
                                  No Direct Link
                              </button>
                          )}
                          
                          <a href={getSmartSearchUrl(activeJob)} target="_blank" rel="noreferrer" className="px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium text-sm flex items-center gap-2 shadow-lg shadow-blue-500/20">
                              <Search size={16}/> Google It
                          </a>
                      </div>
                  </div>

                  <div className="p-8 space-y-8">
                      <div className="grid grid-cols-2 gap-4">
                          <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl">
                              <div className="text-xs text-slate-500 uppercase font-bold mb-1">Salary Estimation</div>
                              <div className="text-lg font-bold text-emerald-400 font-mono">{activeJob.salaryEstimate}</div>
                          </div>
                          <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl">
                               <div className="text-xs text-slate-500 uppercase font-bold mb-1">Source Validity</div>
                               <div className="text-lg font-bold text-white">{activeJob.source}</div>
                          </div>
                      </div>

                      <div className="space-y-4">
                          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2"><Fingerprint size={16}/> Match DNA Analysis</h3>
                          <div className="bg-slate-900/30 border border-slate-800 rounded-xl p-5">
                               <p className="text-slate-300 text-sm italic">"{activeJob.matchReason}"</p>
                          </div>
                      </div>

                      <div className="space-y-4">
                          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Job Context</h3>
                          <div className="bg-slate-900 rounded-xl p-6 border border-slate-800 text-slate-300 leading-relaxed whitespace-pre-wrap font-sans text-sm">
                              {activeJob.description || "No detailed description available. Use the 'Google It' button to find the live listing."}
                          </div>
                      </div>
                      
                      <div className="space-y-4">
                          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Cross-Pollination</h3>
                          <button 
                              onClick={() => onHuntRecruiters(activeJob.company)}
                              className="w-full p-4 bg-gradient-to-r from-slate-900 to-indigo-900/20 hover:to-indigo-900/40 border border-slate-800 hover:border-brand-500 rounded-xl text-left transition-all group flex justify-between items-center"
                          >
                              <div>
                                  <div className="font-bold text-white text-sm flex items-center gap-2"><Target className="text-brand-500" size={16}/> Find Recruiters</div>
                                  <div className="text-xs text-slate-500 mt-1">Scan for HR at {activeJob.company}</div>
                              </div>
                              <ArrowRight size={16} className="text-slate-400 group-hover:text-brand-500 group-hover:translate-x-1 transition-all"/>
                          </button>
                      </div>
                  </div>
              </div>
          ) : (
              <div className="flex-1 hidden lg:flex flex-col items-center justify-center bg-dark-card border-l border-dark-border">
                 <div className="text-center space-y-4 opacity-50">
                    <div className="w-20 h-20 bg-slate-900 rounded-2xl flex items-center justify-center mx-auto border border-slate-800 shadow-xl">
                        <ArrowRight size={32} className="text-slate-600"/>
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white">Select a job</h3>
                        <p className="text-sm text-slate-500">View forensic details and apply.</p>
                    </div>
                 </div>
              </div>
          )}
      </div>
    </div>
  );
}
