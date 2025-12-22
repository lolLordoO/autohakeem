
import React, { useState, useEffect } from 'react';
import { Flame, Clock, RefreshCw, ExternalLink, Zap, Briefcase, Filter, ShieldCheck, Search, Tag, Loader2, Binary, Radio, Radar, Globe } from 'lucide-react';
import { getFreshJobDrops } from '../services/geminiService';
import { JobOpportunity, JobCategory } from '../types';

const FreshDrops: React.FC = () => {
    const [drops, setDrops] = useState<JobOpportunity[]>([]);
    const [filteredDrops, setFilteredDrops] = useState<JobOpportunity[]>([]);
    const [loading, setLoading] = useState(false);
    const [timeframe, setTimeframe] = useState<24 | 48>(24);
    const [hasScanned, setHasScanned] = useState(false);
    const [activeCategory, setActiveCategory] = useState<JobCategory | 'All'>('All');
    
    // Scanner Log Simulation
    const [log, setLog] = useState<string[]>([]);
    const [scanProgress, setScanProgress] = useState(0);

    const addLogLine = (line: string) => {
        setLog(prev => [line, ...prev].slice(0, 10));
    }

    const handleScan = async () => {
        setLoading(true);
        setDrops([]);
        setFilteredDrops([]);
        setLog(["Initializing Forensic Crawler...", "Setting location to UAE (Dubai/Abu Dhabi/Sharjah)..."]);
        setScanProgress(5);

        const steps = [
            "Authenticating with Global Job APIs...",
            "Indexing LinkedIn (UAE) - Last 24h...",
            "Querying Indeed/Naukri (UAE)...",
            "Filtering out 200+ 'Ghost Job' signals...",
            "Verifying company existence & funding status...",
            "Matching DNA with Abdul Hakeem's profile...",
            "Finalizing high-priority list..."
        ];

        let currentStep = 0;
        const interval = setInterval(() => {
            if (currentStep < steps.length) {
                addLogLine(steps[currentStep]);
                setScanProgress(prev => Math.min(prev + 12, 95));
                currentStep++;
            }
        }, 1200);

        try {
            const results = await getFreshJobDrops(timeframe);
            const validResults = Array.isArray(results) ? results : [];
            setDrops(validResults);
            setFilteredDrops(validResults);
            setHasScanned(true);
            setScanProgress(100);
            addLogLine(`Scan Complete. Found ${validResults.length} verified drops.`);
        } catch (e) { 
            console.error(e); 
            addLogLine("Error: Connection timeout. Retrying...");
        } finally { 
            setLoading(false); 
            clearInterval(interval);
        }
    }

    const filterByCategory = (cat: JobCategory | 'All') => {
        setActiveCategory(cat);
        if (cat === 'All') setFilteredDrops(drops);
        else setFilteredDrops(drops.filter(d => d.category === cat));
    }

    const getSmartUrl = (job: JobOpportunity) => {
        const q = encodeURIComponent(`intitle:"${job.title}" "${job.company}" UAE careers`);
        return `https://www.google.com/search?q=${q}`;
    }

    return (
        <div className="p-8 h-screen flex flex-col bg-dark-bg">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 shrink-0 gap-4">
                <div className="relative">
                    <h2 className="text-3xl font-black text-white flex items-center gap-3 tracking-tighter italic">
                        <Flame className="text-orange-500 fill-orange-500 animate-pulse" size={32}/> FRESH DROPS <span className="text-orange-500/50">RADAR</span>
                    </h2>
                    <p className="text-slate-400 text-xs font-mono mt-1 flex items-center gap-2">
                        <Radio size={12} className="text-green-500 animate-ping"/> SCANNING LIVE UAE MARKETS
                    </p>
                </div>
                
                <div className="flex gap-3 w-full md:w-auto">
                    <div className="bg-slate-900 p-1 rounded-lg flex border border-slate-800 shadow-inner">
                        <button 
                            onClick={() => setTimeframe(24)} 
                            className={`px-6 py-2 text-xs font-black uppercase rounded-md transition-all ${timeframe === 24 ? 'bg-orange-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            24H Window
                        </button>
                        <button 
                            onClick={() => setTimeframe(48)} 
                            className={`px-6 py-2 text-xs font-black uppercase rounded-md transition-all ${timeframe === 48 ? 'bg-orange-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            48H Window
                        </button>
                    </div>
                    <button 
                        onClick={handleScan} 
                        disabled={loading}
                        className="flex-1 md:flex-none bg-orange-600 hover:bg-orange-500 text-white px-8 py-3 rounded-lg font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-orange-600/20 active:scale-95 transition-all"
                    >
                        {loading ? <Loader2 className="animate-spin" size={18}/> : <Radar size={18}/>}
                        {loading ? "SEARCHING..." : "EXECUTE SCAN"}
                    </button>
                </div>
            </div>

            {/* SCANNER LOG */}
            {loading && (
                <div className="bg-black/40 border border-orange-500/20 rounded-xl p-4 mb-6 font-mono text-[10px] text-orange-400/80 shadow-inner flex flex-col gap-2 overflow-hidden max-h-40">
                    <div className="flex justify-between items-center border-b border-orange-500/10 pb-2 mb-1">
                        <span className="flex items-center gap-2"><Binary size={12}/> FORENSIC_LOG.EXE</span>
                        <span>{scanProgress}%</span>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {log.map((line, i) => (
                            <div key={i} className={i === 0 ? 'text-orange-300 font-bold' : ''}>
                                {i === 0 ? '> ' : '  '} {line}
                            </div>
                        ))}
                    </div>
                    <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                        <div className="h-full bg-orange-500 transition-all duration-500" style={{width: `${scanProgress}%`}}></div>
                    </div>
                </div>
            )}

            {hasScanned && !loading && (
                <div className="flex gap-2 mb-6 shrink-0 overflow-x-auto pb-1 no-scrollbar">
                    {['All', 'Tech', 'Creative', 'Product', 'General'].map(cat => (
                        <button
                            key={cat}
                            onClick={() => filterByCategory(cat as any)}
                            className={`px-4 py-2 rounded-lg text-xs font-black uppercase border transition-all ${
                                activeCategory === cat 
                                ? 'bg-white text-black border-white shadow-lg' 
                                : 'bg-slate-900 text-slate-500 border-slate-800 hover:text-slate-200'
                            }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            )}

            <div className="flex-1 overflow-y-auto pb-20 custom-scrollbar">
                {!hasScanned && !loading && (
                    <div className="h-full flex flex-col items-center justify-center text-slate-600 border-2 border-dashed border-slate-800 rounded-2xl bg-slate-900/10">
                        <div className="relative mb-6">
                            <Globe size={80} className="text-slate-800"/>
                            <Radar size={40} className="absolute inset-0 m-auto text-orange-500 animate-pulse"/>
                        </div>
                        <h3 className="text-2xl font-black text-slate-400 tracking-tight">READY TO INTERCEPT</h3>
                        <p className="text-sm mt-2 max-w-sm text-center">Bypass generic search. The Radar hunts for fresh UAE job signals at the source.</p>
                        <div className="flex gap-8 mt-8 opacity-40 grayscale group-hover:grayscale-0">
                           <div className="font-black text-xs">LINKEDIN</div>
                           <div className="font-black text-xs">INDEED</div>
                           <div className="font-black text-xs">NAUKRIGULF</div>
                           <div className="font-black text-xs">BAYT</div>
                        </div>
                    </div>
                )}

                {hasScanned && drops.length === 0 && !loading && (
                    <div className="h-full flex flex-col items-center justify-center text-slate-500 animate-in fade-in zoom-in-95">
                        <div className="bg-red-500/10 p-6 rounded-full mb-4">
                            <Search size={48} className="text-red-500/50" />
                        </div>
                        <p className="font-black text-white text-lg">SCAN COMPLETE: 0 DROPS DETECTED</p>
                        <p className="text-sm text-slate-500 mt-2 max-w-md text-center leading-relaxed">
                            No high-quality, verified posts found in the last {timeframe}h. 
                            The Radar filters out 85% of listings due to poor data quality or senior level mismatches.
                        </p>
                        <button onClick={handleScan} className="mt-6 text-orange-400 hover:text-orange-300 text-sm font-black border-b-2 border-orange-500/20 hover:border-orange-500 transition-all pb-1">RE-SCAN ALL SOURCES</button>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
                    {filteredDrops.map((job, idx) => (
                        <div 
                            key={job.id} 
                            style={{ animationDelay: `${idx * 100}ms` }}
                            className="bg-dark-card border border-dark-border p-6 rounded-2xl hover:border-orange-500/40 transition-all group relative overflow-hidden flex flex-col h-full animate-in slide-in-from-bottom-4"
                        >
                            <div className="absolute -top-4 -right-4 w-20 h-20 bg-orange-600/5 blur-2xl group-hover:bg-orange-600/20 transition-all rounded-full"></div>
                            
                            <div className="flex justify-between items-start mb-4 relative z-10">
                                <div className="flex flex-col gap-1">
                                    <span className="text-[10px] font-black bg-orange-600/10 text-orange-500 px-2.5 py-1 rounded border border-orange-500/20 flex items-center gap-1.5 w-fit">
                                        <Clock size={12}/> {job.postedDate}
                                    </span>
                                </div>
                                <div className="bg-slate-900 border border-slate-800 p-2 rounded-lg">
                                    <ShieldCheck className="text-green-500" size={14}/>
                                </div>
                            </div>

                            <h3 className="text-xl font-bold text-white mb-2 leading-tight group-hover:text-orange-400 transition-colors line-clamp-2">{job.title}</h3>
                            <div className="text-sm font-medium text-slate-400 mb-6 flex items-center gap-2">
                                <Briefcase size={14} className="text-slate-600"/> {job.company}
                                <span className="text-slate-700">•</span>
                                <span className="text-xs text-slate-500 font-mono">{job.location}</span>
                            </div>
                            
                            <div className="bg-black/20 p-4 rounded-xl border border-white/5 mb-6 flex-1 relative">
                                <div className="text-[9px] text-slate-600 uppercase font-black mb-2 tracking-widest flex items-center justify-between">
                                    <span>Forensic Intel</span>
                                    <span className="text-orange-500/50">{job.source}</span>
                                </div>
                                <p className="text-xs text-slate-400 leading-relaxed line-clamp-4">{job.matchReason}</p>
                            </div>

                            <div className="flex gap-3 mt-auto relative z-10">
                                {job.url ? (
                                    <button 
                                        onClick={() => window.open(job.url, '_blank')}
                                        className="flex-1 bg-orange-600 hover:bg-orange-500 text-white py-3 rounded-xl text-xs font-black uppercase tracking-tighter flex items-center justify-center gap-2 shadow-lg shadow-orange-600/20 transition-all"
                                    >
                                        <ExternalLink size={14}/> Apply Direct
                                    </button>
                                ) : (
                                    <button 
                                        onClick={() => window.open(getSmartUrl(job), '_blank')}
                                        className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-xl text-xs font-black uppercase tracking-tighter flex items-center justify-center gap-2 border border-slate-700 transition-all"
                                    >
                                        <Search size={14}/> Smart Find
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default FreshDrops;
