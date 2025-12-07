
import React, { useState, useEffect } from 'react';
import { Search, MapPin, ExternalLink, Loader2, Plus, Mail, Globe, Sparkles, Linkedin, CheckCircle2, AlertTriangle, Building2, DollarSign, Filter, Copy, Flame, Trophy, Target, ArrowRight, X, Clock, Zap } from 'lucide-react';
import { searchJobsInUAE, analyzeProfileForSearch, getFreshJobDrops } from '../services/geminiService';
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
  
  // Fresh Drops State
  const [freshDrops, setFreshDrops] = useState<JobOpportunity[]>([]);
  const [loadingDrops, setLoadingDrops] = useState(false);

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
      
      // Auto-load Fresh Drops on mount if empty
      if (freshDrops.length === 0) {
          loadFreshDrops();
      }
  }, []);

  const loadFreshDrops = async () => {
      setLoadingDrops(true);
      try {
          const drops = await getFreshJobDrops();
          setFreshDrops(drops);
      } catch(e) { console.error(e); }
      finally { setLoadingDrops(false); }
  }

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
          case 'S': return <span className="bg-brand-600/20 text-brand-400 border border-brand-500/30 text-[10px] font-bold px-2 py-0.5 rounded">S-TIER</span>;
          case 'A': return <span className="bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded">A-GRADE</span>;
          case 'B': return <span className="bg-blue-600/20 text-blue-400 border border-blue-500/30 text-[10px] font-bold px-2 py-0.5 rounded">B-GRADE</span>;
          default: return null;
      }
  }

  return (
    <div className="h-screen flex flex-col bg-dark-bg overflow-hidden">
      
      {/* 1. FRESH DROPS TICKER (Top Section) */}
      <div className="bg-[#0B1221] border-b border-dark-border shrink-0">
          <div className="max-w-7xl mx-auto p-4">
              <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center gap-2 text-white font-bold text-sm">
                      <Flame className="text-orange-500 fill-orange-500 animate-pulse" size={16}/> 
                      FRESH DROPS (Last 24h)
                  </div>
                  <button onClick={loadFreshDrops} disabled={loadingDrops} className="text-[10px] text-slate-500 hover:text-white">
                      {loadingDrops ? "Scanning..." : "Refresh"}
                  </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 overflow-x-auto pb-2 custom-scrollbar">
                  {loadingDrops ? (
                      [1,2,3,4,5].map(i => <div key={i} className="h-24 bg-slate-900/50 rounded-lg animate-pulse border border-slate-800"></div>)
                  ) : freshDrops.length > 0 ? (
                      freshDrops.map(job => (
                          <div 
                            key={job.id} 
                            onClick={() => setActiveJob(job)}
                            className="bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-brand-500/50 rounded-lg p-3 cursor-pointer transition-all group min-w-[200px]"
                          >
                              <div className="flex justify-between items-start mb-1">
                                  <span className="text-[10px] text-orange-400 font-bold flex items-center gap-1"><Clock size={10}/> {job.postedDate || "New"}</span>
                                  <ExternalLink size={10} className="text-slate-600 group-hover:text-brand-400"/>
                              </div>
                              <div className="font-bold text-white text-xs truncate mb-0.5">{job.title}</div>
                              <div className="text-[10px] text-slate-400 truncate">{job.company}</div>
                              {job.salaryEstimate && <div className="text-[10px] text-emerald-500 mt-2 font-mono">{job.salaryEstimate}</div>}
                          </div>
                      ))
                  ) : (
                      <div className="col-span-full text-xs text-slate-500 italic">No fresh drops found yet. Click refresh to scan.</div>
                  )}
              </div>
          </div>
      </div>

      {/* 2. SEARCH & FILTERS */}
      <div className="p-6 border-b border-dark-border bg-dark-bg shrink-0">
          <div className="flex flex-col gap-4 max-w-7xl mx-auto w-full">
               {/* Search Row */}
               <div className="flex gap-2">
                   <div className="relative flex-1">
                       <input
                           type="text"
                           value={query}
                           onChange={(e) => setQuery(e.target.value)}
                           placeholder={`Search jobs in ${searchFocus === SearchFocus.ALL ? 'UAE' : searchFocus}...`}
                           className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2.5 px-4 pl-10 text-white focus:outline-none focus:border-brand-500 text-sm"
                           onKeyDown={(e) => e.key === 'Enter' && handleSearch(query)}
                       />
                       <Search className="absolute left-3 top-2.5 text-slate-500" size={16} />
                   </div>
                   <button
                       onClick={handleProfileMatch}
                       disabled={isLoading || isAnalyzing}
                       className="bg-purple-900/30 hover:bg-purple-900/50 text-purple-300 border border-purple-500/30 px-4 rounded-lg font-medium flex items-center gap-2 text-sm whitespace-nowrap"
                   >
                       {isAnalyzing ? <Loader2 className="animate-spin" size={14}/> : <Sparkles size={14} />} Match Profile
                   </button>
                   <button
                       onClick={() => handleSearch(query)}
                       disabled={isLoading || isAnalyzing}
                       className="bg-brand-600 hover:bg-brand-500 text-white px-6 rounded-lg font-bold disabled:opacity-50 text-sm shadow-lg shadow-brand-500/20"
                   >
                       {isLoading ? <Loader2 className="animate-spin" size={14}/> : 'Deep Search'}
                   </button>
               </div>

               {/* Advanced Controls Row */}
               <div className="flex flex-wrap items-center gap-4">
                   {/* Quick Chips */}
                   <div className="flex items-center gap-2">
                       <span className="text-[10px] uppercase font-bold text-slate-500">Quick Add:</span>
                       {['Remote', 'Dubai', 'High Salary', 'Manager', 'Startup'].map(chip => (
                           <button key={chip} onClick={() => addChipToQuery(chip)} className="px-2 py-1 bg-slate-800 border border-slate-700 rounded text-[10px] text-slate-300 hover:text-white hover:border-brand-500 transition-colors">+ {chip}</button>
                       ))}
                   </div>

                   <div className="h-4 w-px bg-slate-800 hidden md:block"></div>

                   {/* Filter Dropdowns */}
                   <div className="flex items-center gap-2">
                       <select 
                            value={filters.emirate} 
                            onChange={e => setFilters({...filters, emirate: e.target.value as any})}
                            className="bg-slate-900 border border-slate-800 text-xs text-white rounded px-2 py-1 outline-none focus:border-brand-500"
                        >
                           <option value="All">All Emirates</option>
                           <option value="Dubai">Dubai</option>
                           <option value="Abu Dhabi">Abu Dhabi</option>
                           <option value="Remote">Remote</option>
                       </select>
                       <select 
                            value={filters.level} 
                            onChange={e => setFilters({...filters, level: e.target.value as any})}
                            className="bg-slate-900 border border-slate-800 text-xs text-white rounded px-2 py-1 outline-none focus:border-brand-500"
                        >
                           <option value="All">All Levels</option>
                           <option value="Junior">Junior (0-2y)</option>
                           <option value="Mid-Senior">Mid (3-5y)</option>
                           <option value="Lead/Manager">Manager</option>
                       </select>
                   </div>
               </div>

               {/* Focus Bar */}
               <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1">
                    {Object.values(SearchFocus).map(focus => (
                        <button
                            key={focus}
                            onClick={() => handleFocusChange(focus)}
                            className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase transition-all whitespace-nowrap ${
                                searchFocus === focus 
                                ? 'bg-white text-black' 
                                : 'bg-slate-900 text-slate-500 border border-slate-800 hover:text-slate-300'
                            }`}
                        >
                            {focus}
                        </button>
                    ))}
                </div>
          </div>
      </div>

      {/* SPLIT PANE CONTENT */}
      <div className="flex-1 flex overflow-hidden">
          {/* LEFT: LIST VIEW */}
          <div className={`${activeJob ? 'w-1/3 hidden lg:block border-r border-dark-border' : 'w-full max-w-7xl mx-auto'} overflow-y-auto custom-scrollbar bg-[#0B1221]`}>
                {(isLoading || isAnalyzing) && results.length === 0 && (
                    <div className="flex flex-col justify-center items-center py-20 gap-4">
                        <Loader2 size={32} className="animate-spin text-brand-500"/>
                        <p className="text-brand-400 font-mono text-xs animate-pulse">Scouring 30+ UAE sources...</p>
                    </div>
                )}
                
                {!isLoading && results.length === 0 && (
                    <div className="h-64 flex flex-col items-center justify-center text-slate-500">
                        <Globe size={48} className="mb-4 opacity-20" />
                        <p className="text-sm">Start a deep search to see results</p>
                    </div>
                )}

                <div className={`divide-y divide-slate-800 ${!activeJob ? 'border border-slate-800 rounded-xl my-4' : ''}`}>
                    {results.map((job) => (
                        <div 
                            key={job.id} 
                            onClick={() => setActiveJob(job)}
                            className={`p-4 cursor-pointer hover:bg-slate-800/50 transition-colors group relative ${activeJob?.id === job.id ? 'bg-brand-900/10 border-l-2 border-brand-500' : 'border-l-2 border-transparent'}`}
                        >
                            <div className="flex justify-between items-start mb-1">
                                <h3 className={`text-sm font-bold line-clamp-1 flex items-center gap-2 ${activeJob?.id === job.id ? 'text-brand-400' : 'text-slate-200'}`}>
                                    {job.title}
                                    {job.matchGrade === 'S' && <span className="flex h-2 w-2 rounded-full bg-brand-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]"></span>}
                                </h3>
                                {getVerdictBadge(job.matchGrade)}
                            </div>
                            <div className="text-xs text-slate-400 mb-2 truncate">{job.company} • {job.location}</div>
                            
                            {job.matchReason && (
                                <div className="mb-2 text-[10px] text-slate-500 italic bg-slate-900/50 p-1.5 rounded inline-block border border-slate-800">
                                    <Zap size={10} className="inline mr-1 text-yellow-500"/> {job.matchReason}
                                </div>
                            )}

                            <div className="flex justify-between items-center mt-2">
                                <div className="flex gap-2">
                                    <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700">{job.source}</span>
                                    {job.salaryEstimate && !job.salaryEstimate.includes('Market') && (
                                        <span className="text-[10px] bg-emerald-900/20 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-900/30 font-mono">{job.salaryEstimate}</span>
                                    )}
                                </div>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={(e) => { e.stopPropagation(); window.open(getSmartSearchUrl(job), '_blank'); }} className="p-1.5 bg-slate-700 rounded text-slate-300 hover:text-white flex items-center gap-1 text-[10px]" title="Google Search"><Search size={10}/> Google It</button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
          </div>

          {/* RIGHT: INSPECTOR VIEW */}
          {activeJob ? (
              <div className="flex-1 bg-dark-card overflow-y-auto custom-scrollbar flex flex-col animate-in slide-in-from-right-4">
                  <div className="p-6 border-b border-dark-border bg-slate-900/50 sticky top-0 z-10 backdrop-blur-sm">
                      <div className="flex justify-between items-start mb-4">
                          <div>
                              <button onClick={() => setActiveJob(null)} className="lg:hidden text-slate-500 hover:text-white mb-2 flex items-center gap-1 text-xs"><ArrowRight className="rotate-180" size={12}/> Back to List</button>
                              <h2 className="text-2xl font-bold text-white mb-1">{activeJob.title}</h2>
                              <div className="flex items-center gap-2 text-slate-400 text-sm">
                                  <Building2 size={14}/> {activeJob.company}
                                  <span className="w-1 h-1 rounded-full bg-slate-600"></span>
                                  <MapPin size={14}/> {activeJob.location}
                              </div>
                          </div>
                          {getVerdictBadge(activeJob.matchGrade)}
                      </div>
                      
                      {/* PRIMARY ACTIONS */}
                      <div className="flex gap-3">
                          <button 
                              onClick={() => onSelectJob(activeJob)}
                              className="flex-1 bg-brand-600 hover:bg-brand-500 text-white py-2.5 rounded-lg font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-brand-500/20"
                          >
                              <Plus size={16}/> Draft Application
                          </button>
                          
                          {activeJob.url ? (
                               <a href={activeJob.url} target="_blank" rel="noreferrer" className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium text-sm border border-slate-700">
                                   Verified Link
                               </a>
                          ) : (
                              <button className="px-4 py-2.5 bg-slate-800 text-slate-500 rounded-lg text-sm border border-slate-700 cursor-not-allowed opacity-50">
                                  No Direct Link
                              </button>
                          )}
                          
                          <a href={getSmartSearchUrl(activeJob)} target="_blank" rel="noreferrer" className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium text-sm flex items-center gap-2">
                              <Search size={16}/> Google It
                          </a>
                      </div>
                  </div>

                  <div className="p-8 space-y-8">
                      <div className="space-y-4">
                          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Job Context</h3>
                          <div className="bg-slate-900 rounded-xl p-6 border border-slate-800 text-slate-300 leading-relaxed whitespace-pre-wrap font-sans">
                              {activeJob.description || "No detailed description available. Use the 'Google It' button to find the live listing."}
                          </div>
                      </div>
                      
                      <div className="space-y-4">
                          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Cross-Pollination</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <button 
                                  onClick={() => onHuntRecruiters(activeJob.company)}
                                  className="p-4 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-brand-500 rounded-xl text-left transition-all group"
                              >
                                  <div className="flex justify-between items-center mb-2">
                                      <Target className="text-brand-500"/>
                                      <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400"/>
                                  </div>
                                  <div className="font-bold text-white text-sm">Find Recruiters</div>
                                  <div className="text-xs text-slate-500">Scan for HR at {activeJob.company}</div>
                              </button>
                              
                              <div className="p-4 bg-slate-800/30 border border-slate-800 rounded-xl">
                                  <div className="flex justify-between items-center mb-2">
                                      <DollarSign className="text-emerald-500"/>
                                  </div>
                                  <div className="font-bold text-white text-sm">Salary Estimate</div>
                                  <div className="text-xs text-emerald-400 font-mono">{activeJob.salaryEstimate}</div>
                              </div>
                          </div>
                      </div>
                  </div>
              </div>
          ) : (
              <div className="flex-1 hidden lg:flex flex-col items-center justify-center bg-dark-card border-l border-dark-border">
                 <div className="text-center space-y-4">
                    <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mx-auto border border-slate-800">
                        <ArrowRight size={24} className="text-slate-600"/>
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white">Select a job</h3>
                        <p className="text-sm text-slate-500">View details, applying options, and insights here.</p>
                    </div>
                 </div>
              </div>
          )}
      </div>
    </div>
  );
}
