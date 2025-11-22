
import React, { useState } from 'react';
import { Search, MapPin, ExternalLink, Loader2, Plus, Mail, Globe, Sparkles, Linkedin, CheckCircle2, AlertTriangle, Building2, DollarSign, Filter, Copy, Flame } from 'lucide-react';
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
        // Pass the current query to hybridize user intent with CV profile
        const optimizedQuery = await analyzeProfileForSearch(query);
        setQuery(optimizedQuery);
        await new Promise(resolve => setTimeout(resolve, 1500)); // Safety delay for Rate Limit
        handleSearch(optimizedQuery);
    } catch(e) {
        console.error(e);
    } finally {
        setIsAnalyzing(false);
    }
  }

  const getSmartSearchUrl = (job: JobOpportunity) => {
      // Construct a high-precision Google Search query to avoid 404s
      // Use intitle: to be more precise if possible
      const q = encodeURIComponent(`intitle:"${job.title}" "${job.company}" site:linkedin.com/jobs OR site:naukrigulf.com`);
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

  const calculateRelevanceScore = (job: JobOpportunity): number => {
      let score = 50; // Base score
      const q = query.toLowerCase();
      const title = job.title.toLowerCase();
      
      if (title.includes(q)) score += 20;
      if (job.salaryEstimate && !job.salaryEstimate.includes('Market')) score += 15;
      if (job.source.toLowerCase() !== 'web search') score += 15;
      
      return Math.min(99, score);
  }

  const copyJobDetails = (job: JobOpportunity) => {
      const text = `${job.title} at ${job.company}\nLocation: ${job.location}\nSource: ${job.source}`;
      navigator.clipboard.writeText(text);
      setCopiedId(job.id);
      setTimeout(() => setCopiedId(null), 2000);
  }

  return (
    <div className="p-8 h-screen flex flex-col bg-dark-bg">
      <div className="max-w-7xl mx-auto w-full flex flex-col h-full">
        <header className="mb-8 shrink-0">
            <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                <Search className="text-brand-500" size={32}/> 
                Job Search Agent
            </h2>
            <p className="text-slate-400">Multi-source scraping with salary estimation.</p>
        </header>

        {/* Search Interface */}
        <div className="bg-dark-card border border-dark-border p-4 rounded-xl mb-6 shadow-lg shrink-0">
            <div className="flex items-center gap-4 mb-4 border-b border-slate-800 pb-4 overflow-x-auto custom-scrollbar">
                <div className="flex items-center gap-2 text-sm text-slate-400 shrink-0">
                    <Filter size={14} /> Target Sector:
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

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
                {results.map((job) => {
                    const linkQuality = getLinkQuality(job);
                    const score = calculateRelevanceScore(job);
                    return (
                    <div key={job.id} className="group bg-dark-card border border-dark-border hover:border-brand-500/50 rounded-xl p-5 transition-all hover:shadow-xl hover:shadow-black/40 flex flex-col relative">
                        <button onClick={() => copyJobDetails(job)} className="absolute top-4 right-4 text-slate-600 hover:text-brand-500 transition-colors">
                            {copiedId === job.id ? <CheckCircle2 size={16} className="text-green-500"/> : <Copy size={16}/>}
                        </button>

                        {/* Header */}
                        <div className="flex justify-between items-start gap-3 mb-3 pr-8">
                            <div>
                                <h3 className="text-lg font-bold text-white group-hover:text-brand-400 transition-colors leading-tight mb-1">{job.title}</h3>
                                <div className="flex items-center gap-2 text-sm text-slate-400">
                                    <Building2 size={14} /> {job.company}
                                </div>
                            </div>
                        </div>

                        {/* Metadata */}
                        <div className="flex flex-wrap items-center gap-2 mb-4">
                            <span className="px-2 py-1 rounded bg-slate-800 text-xs text-slate-300 border border-slate-700 flex items-center gap-1">
                                <MapPin size={10}/> {job.location}
                            </span>
                            {job.salaryEstimate && (
                                <span className="px-2 py-1 rounded bg-emerald-900/20 text-xs text-emerald-400 border border-emerald-900/30 flex items-center gap-1 font-mono font-bold">
                                    <DollarSign size={10}/> {job.salaryEstimate}
                                </span>
                            )}
                            <span className={`px-2 py-1 rounded text-xs border flex items-center gap-1 font-bold ${score > 80 ? 'bg-purple-900/20 text-purple-300 border-purple-800' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                                <Flame size={10}/> {score}% Match
                            </span>
                        </div>

                        {/* Description Snippet */}
                        <p className="text-sm text-slate-500 line-clamp-2 mb-5 font-sans leading-relaxed flex-1">
                            {job.description || "No description preview available. Check the job post for full details."}
                        </p>
                        
                        {/* Actions Footer */}
                        <div className="mt-auto pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
                            <div className="flex gap-2">
                                {/* Primary Logic: Smart Find is default fallback, Direct Link only if Verified */}
                                {linkQuality !== 'verified' && (
                                    <a 
                                        href={getSmartSearchUrl(job)} 
                                        target="_blank" 
                                        rel="noreferrer" 
                                        className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-bold flex items-center gap-2 transition-colors shadow-lg shadow-blue-500/20"
                                        title="Search specifically for this role on LinkedIn/Google"
                                    >
                                        <Search size={14}/> Smart Apply
                                    </a>
                                )}
                                
                                {linkQuality === 'verified' && (
                                    <a 
                                        href={job.applyUrl || job.url} 
                                        target="_blank" 
                                        rel="noreferrer" 
                                        className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded text-xs font-medium flex items-center gap-2 transition-colors"
                                    >
                                        <ExternalLink size={14}/> Direct Link
                                    </a>
                                )}
                            </div>

                            <button 
                                onClick={() => onSelectJob(job)}
                                className="bg-brand-600 hover:bg-brand-500 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-lg shadow-brand-500/10 transition-transform active:scale-95"
                            >
                                <Plus size={16}/> Draft
                            </button>
                        </div>
                    </div>
                )})}
            </div>
        </div>
      </div>
    </div>
  );
}
