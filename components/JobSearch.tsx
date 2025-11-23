
import React, { useState } from 'react';
import { Search, MapPin, ExternalLink, Loader2, Plus, Mail, Globe, Sparkles, Linkedin, CheckCircle2, AlertTriangle, Building2, DollarSign, Filter, Copy, Flame, Trophy, Target, ArrowRight } from 'lucide-react';
import { searchJobsInUAE, analyzeProfileForSearch } from '../services/geminiService';
import { JobOpportunity, PersonaType, SearchFocus, MatchGrade } from '../types';

interface JobSearchProps {
  onSelectJob: (job: JobOpportunity) => void;
  setPersona: (p: PersonaType) => void;
  results: JobOpportunity[];
  setResults: (jobs: JobOpportunity[]) => void;
  query: string;
  setQuery: (q: string) => void;
  onHuntRecruiters: (company: string) => void; // New Cross-Pollination Prop
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
  const [copiedId, setCopiedId] = useState<string | null>(null);

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
        const optimizedQuery = await analyzeProfileForSearch(query);
        setQuery(optimizedQuery);
        await new Promise(resolve => setTimeout(resolve, 1500)); 
        handleSearch(optimizedQuery);
    } catch(e) {
        console.error(e);
    } finally {
        setIsAnalyzing(false);
    }
  }

  const getSmartSearchUrl = (job: JobOpportunity) => {
      const q = encodeURIComponent(`intitle:"${job.title}" "${job.company}" site:linkedin.com/jobs OR site:naukrigulf.com`);
      return `https://www.google.com/search?q=${q}`;
  };

  const getLinkQuality = (job: JobOpportunity) => {
      // The Service now enforces strict URL validity. If URL exists, it's quality.
      // If URL is null, it requires smart search.
      return job.url ? 'verified' : 'smart-search';
  };

  const calculateRelevanceScore = (job: JobOpportunity): number => {
      let score = 50; 
      const q = query.toLowerCase();
      const title = job.title.toLowerCase();
      if (title.includes(q)) score += 20;
      if (job.salaryEstimate && !job.salaryEstimate.includes('Market')) score += 15;
      if (job.source.toLowerCase() !== 'web search') score += 15;
      return Math.min(99, score);
  }

  const getVerdictBadge = (grade: MatchGrade | undefined) => {
      switch(grade) {
          case 'S': return <span className="absolute top-0 right-0 bg-brand-600 text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg shadow-lg">S-TIER</span>;
          case 'A': return <span className="absolute top-0 right-0 bg-emerald-600 text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg">A-GRADE</span>;
          case 'B': return <span className="absolute top-0 right-0 bg-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg">B-GRADE</span>;
          default: return null;
      }
  }

  const copyJobDetails = (job: JobOpportunity) => {
      const text = `${job.title} at ${job.company}\nLocation: ${job.location}\nSource: ${job.source}`;
      navigator.clipboard.writeText(text);
      setCopiedId(job.id);
      setTimeout(() => setCopiedId(null), 2000);
  }

  return (
    <div className="p-8 h-screen flex flex-col bg-dark-bg">
      <div className="max-w-[1600px] mx-auto w-full flex flex-col h-full">
        <header className="mb-6 shrink-0 flex justify-between items-end">
            <div>
                <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                    <Search className="text-brand-500" size={32}/> 
                    Job Search Agent
                </h2>
                <p className="text-slate-400 text-sm">Real-time scraping with strict verification & salary estimation.</p>
            </div>
            <div className="text-right">
                 <div className="text-xs text-slate-500 font-mono">RESULTS: {results.length}</div>
            </div>
        </header>

        {/* Search Interface */}
        <div className="bg-dark-card border border-dark-border p-4 rounded-xl mb-6 shadow-lg shrink-0">
            <div className="flex items-center gap-4 mb-4 border-b border-slate-800 pb-4 overflow-x-auto custom-scrollbar">
                <div className="flex items-center gap-2 text-sm text-slate-400 shrink-0">
                    <Filter size={14} /> Domain Focus:
                </div>
                <div className="flex gap-2">
                    {Object.values(SearchFocus).map(focus => (
                        <button
                            key={focus}
                            onClick={() => setSearchFocus(focus)}
                            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap ${
                                searchFocus === focus 
                                ? 'bg-brand-600 text-white border border-brand-500 shadow-lg shadow-brand-500/20' 
                                : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white hover:border-slate-600'
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
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg py-3 px-4 pl-12 text-white focus:outline-none focus:border-brand-500 placeholder-slate-600 transition-all font-medium"
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch(query)}
                />
                <Search className="absolute left-4 top-3.5 text-slate-500" size={18} />
                </div>
                
                <button
                    onClick={handleProfileMatch}
                    disabled={isLoading || isAnalyzing}
                    className="bg-purple-900/30 hover:bg-purple-900/50 text-purple-300 border border-purple-500/30 px-6 rounded-lg font-medium flex items-center gap-2 transition-all whitespace-nowrap"
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
            {(isLoading || isAnalyzing) && results.length === 0 && (
                <div className="flex flex-col justify-center items-center py-20 gap-4">
                    <Loader2 size={48} className="animate-spin text-brand-500"/>
                    <p className="text-brand-400 font-mono text-sm animate-pulse">Running live queries across 30+ UAE sources...</p>
                </div>
            )}
            
            {!isLoading && results.length === 0 && (
                 <div className="h-64 flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-slate-800 rounded-xl bg-slate-900/20">
                    <Globe size={48} className="mb-4 opacity-20" />
                    <p className="text-lg font-medium">Ready to explore the UAE job market</p>
                    <p className="text-sm opacity-60">Select a focus area and search.</p>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {results.map((job) => {
                    const linkQuality = getLinkQuality(job);
                    const score = calculateRelevanceScore(job);
                    return (
                    <div key={job.id} className="group bg-dark-card border border-dark-border hover:border-brand-500/50 rounded-xl p-5 transition-all hover:shadow-xl hover:shadow-black/40 flex flex-col relative overflow-hidden h-[340px]">
                        {getVerdictBadge(job.matchGrade)}
                        
                        <button onClick={() => copyJobDetails(job)} className="absolute top-3 right-3 text-slate-600 hover:text-brand-500 transition-colors z-20" title="Copy Details">
                            {copiedId === job.id ? <CheckCircle2 size={14} className="text-green-500"/> : <Copy size={14}/>}
                        </button>

                        {/* Content Top */}
                        <div className="mb-auto">
                            <div className="mb-2 pr-6">
                                <h3 className="text-base font-bold text-white group-hover:text-brand-400 transition-colors leading-tight mb-1 line-clamp-2" title={job.title}>{job.title}</h3>
                                <div className="flex items-center gap-1 text-xs text-slate-400">
                                    <Building2 size={12} /> <span className="truncate">{job.company}</span>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-1.5 mb-3">
                                <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 border border-slate-700 flex items-center gap-1 truncate max-w-[120px]">
                                    <MapPin size={8}/> {job.location}
                                </span>
                                {job.salaryEstimate && (
                                    <span className="px-1.5 py-0.5 rounded bg-emerald-900/20 text-[10px] text-emerald-400 border border-emerald-900/30 flex items-center gap-1 font-mono font-bold">
                                        <DollarSign size={8}/> {job.salaryEstimate}
                                    </span>
                                )}
                            </div>

                            <p className="text-xs text-slate-500 line-clamp-3 font-sans leading-relaxed">
                                {job.description || "Description not available. Click to view full details."}
                            </p>
                        </div>
                        
                        {/* Actions Footer */}
                        <div className="mt-4 pt-4 border-t border-slate-800 space-y-2">
                             {/* Cross-Pollination Button */}
                            <button 
                                onClick={() => onHuntRecruiters(job.company)}
                                className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs font-medium flex items-center justify-center gap-2 border border-slate-700 transition-colors group/recruit"
                            >
                                <Target size={12} className="text-brand-500"/> Find Recruiters <ArrowRight size={10} className="opacity-0 group-hover/recruit:opacity-100 transition-opacity -ml-1"/>
                            </button>

                            <div className="flex gap-2">
                                {linkQuality === 'smart-search' ? (
                                    <a 
                                        href={getSmartSearchUrl(job)} 
                                        target="_blank" 
                                        rel="noreferrer" 
                                        className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-blue-500/20"
                                    >
                                        <Search size={14}/> Smart Find
                                    </a>
                                ) : (
                                    <a 
                                        href={job.url!} 
                                        target="_blank" 
                                        rel="noreferrer" 
                                        className="flex-1 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded text-xs font-medium flex items-center justify-center gap-2 transition-colors"
                                    >
                                        <ExternalLink size={14}/> Verified Link
                                    </a>
                                )}

                                <button 
                                    onClick={() => onSelectJob(job)}
                                    className="flex-1 bg-brand-600 hover:bg-brand-500 text-white px-3 py-2 rounded text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-brand-500/10"
                                >
                                    <Plus size={14}/> Draft App
                                </button>
                            </div>
                        </div>
                    </div>
                )})}
            </div>
        </div>
      </div>
    </div>
  );
}
