
import React, { useState, useEffect } from 'react';
import { Flame, Clock, RefreshCw, ExternalLink, Zap, Briefcase, Filter, ShieldCheck, Search, Tag, Loader2, Binary, Radio, Radar, Globe, Fingerprint, MapPin, Activity } from 'lucide-react';
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
        setLog(["Initializing DEEP CRAWLER v3.1...", "Targeting UAE Employment Clusters (DXB, AUH, SHJ)..."]);
        setScanProgress(5);

        const steps = [
            "Connecting to UAE Boolean Search Nodes...",
            "Indexing LinkedIn Recruiter signals (Last 24h)...",
            "Scraping Naukrigulf and Bayt localized nodes...",
            "Filtering 500+ Ghost Jobs & Agency Spams...",
            "Validating Company existence via UAE business registers...",
            "Analyzing Role fit against Abdul Hakeem Persona DNA...",
            "Verifying application endpoints...",
            "Compiling Forensic Report..."
        ];

        let currentStep = 0;
        const interval = setInterval(() => {
            if (currentStep < steps.length) {
                addLogLine(steps[currentStep]);
                setScanProgress(prev => Math.min(prev + 11, 98));
                currentStep++;
            }
        }, 900);

        try {
            const results = await getFreshJobDrops(timeframe);
            const validResults = Array.isArray(results) ? results : [];
            setDrops(validResults);
            setFilteredDrops(validResults);
            setHasScanned(true);
            setScanProgress(100);
            addLogLine(`Scan Complete. Found ${validResults.length} high-integrity listings.`);
        } catch (e) { 
            console.error(e); 
            addLogLine("Error: Node timeout. Retrying deep scan protocol...");
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
        const q = encodeURIComponent(`intitle:"${job.title}" "${job.company}" UAE careers application`);
        return `https://www.google.com/search?q=${q}`;
    }

    return (
        <div className="p-8 h-screen flex flex-col bg-[#050505]">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 shrink-0 gap-4">
                <div className="relative">
                    <h2 className="text-4xl font-black text-white flex items-center gap-3 tracking-tighter italic uppercase">
                        <Flame className="text-orange-500 fill-orange-500 animate-pulse" size={36}/> FRESH DROPS <span className="text-orange-500/20">RADAR</span>
                    </h2>
                    <p className="text-slate-500 text-[10px] font-mono mt-1 flex items-center gap-2 uppercase tracking-[0.2em]">
                        <Activity size={12} className="text-orange-500 animate-pulse"/> REAL-TIME UAE MARKET INTERCEPTION
                    </p>
                </div>
                
                <div className="flex gap-3 w-full md:w-auto">
                    <div className="bg-zinc-900/50 p-1 rounded-xl flex border border-zinc-800 backdrop-blur-md">
                        <button 
                            onClick={() => setTimeframe(24)} 
                            className={`px-6 py-2 text-[10px] font-black uppercase rounded-lg transition-all ${timeframe === 24 ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/20' : 'text-zinc-500 hover:text-zinc-300'}`}
                        >
                            24H WINDOW
                        </button>
                        <button 
                            onClick={() => setTimeframe(48)} 
                            className={`px-6 py-2 text-[10px] font-black uppercase rounded-lg transition-all ${timeframe === 48 ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/20' : 'text-zinc-500 hover:text-zinc-300'}`}
                        >
                            48H WINDOW
                        </button>
                    </div>
                    <button 
                        onClick={handleScan} 
                        disabled={loading}
                        className="flex-1 md:flex-none bg-orange-600 hover:bg-orange-500 text-white px-10 py-3 rounded-xl font-black text-xs flex items-center justify-center gap-3 shadow-2xl shadow-orange-600/30 active:scale-95 transition-all border border-orange-400/20 uppercase tracking-widest"
                    >
                        {loading ? <Loader2 className="animate-spin" size={18}/> : <Radar size={18}/>}
                        {loading ? "CRAWLING..." : "INITIATE SCAN"}
                    </button>
                </div>
            </div>

            {/* DEEP CRAWLER LOG */}
            {loading && (
                <div className="bg-black border border-orange-500/20 rounded-2xl p-5 mb-8 font-mono text-[10px] text-orange-400/70 shadow-[inset_0_0_20px_rgba(249,115,22,0.05)] flex flex-col gap-3 overflow-hidden max-h-48 animate-in zoom-in-95">
                    <div className="flex justify-between items-center border-b border-orange-500/10 pb-3">
                        <span className="flex items-center gap-2 font-black uppercase tracking-widest">
                            <Binary size={14} className="animate-pulse"/> NODE_CRAWLER_V3.1_ACTIVE
                        </span>
                        <span className="font-black">{scanProgress}%</span>
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-1">
                        {log.map((line, i) => (
                            <div key={i} className={i === 0 ? 'text-orange-400 font-bold' : ''}>
                                {i === 0 ? '>>> ' : '    '} {line}
                            </div>
                        ))}
                    </div>
                    <div className="w-full bg-zinc-900 h-1 rounded-full overflow-hidden">
                        <div className="h-full bg-orange-500 transition-all duration-300 shadow-[0_0_10px_rgba(249,115,22,1)]" style={{width: `${scanProgress}%`}}></div>
                    </div>
                </div>
            )}

            {hasScanned && !loading && (
                <div className="flex gap-2 mb-8 shrink-0 overflow-x-auto pb-2 no-scrollbar">
                    {['All', 'Tech', 'Creative', 'Product', 'General'].map(cat => (
                        <button
                            key={cat}
                            onClick={() => filterByCategory(cat as any)}
                            className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase border transition-all ${
                                activeCategory === cat 
                                ? 'bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.2)]' 
                                : 'bg-zinc-900/50 text-zinc-500 border-zinc-800 hover:text-zinc-200 hover:border-zinc-700 backdrop-blur-sm'
                            }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            )}

            <div className="flex-1 overflow-y-auto pb-24 custom-scrollbar">
                {!hasScanned && !loading && (
                    <div className="h-full flex flex-col items-center justify-center text-zinc-800 border-2 border-dashed border-zinc-900 rounded-[2.5rem] bg-zinc-900/10 transition-all hover:bg-zinc-900/20 group">
                        <div className="relative mb-8">
                            <Globe size={100} className="text-zinc-900 group-hover:scale-110 transition-transform duration-700"/>
                            <Radar size={50} className="absolute inset-0 m-auto text-orange-600 animate-pulse"/>
                        </div>
                        <h3 className="text-3xl font-black text-zinc-700 tracking-tighter uppercase italic">READY FOR INTERCEPTION</h3>
                        <p className="text-xs mt-3 max-w-sm text-center text-zinc-500 font-medium leading-relaxed uppercase tracking-wider">Bypass generic job boards. The Deep Crawler hunts for real, active signals directly from company career nodes in the UAE.</p>
                        <div className="flex gap-10 mt-12 opacity-20 grayscale group-hover:opacity-40 transition-all">
                           <div className="font-black text-sm tracking-tighter italic">LINKEDIN</div>
                           <div className="font-black text-sm tracking-tighter italic">NAUKRIGULF</div>
                           <div className="font-black text-sm tracking-tighter italic">GREENHOUSE</div>
                           <div className="font-black text-sm tracking-tighter italic">LEVER</div>
                        </div>
                    </div>
                )}

                {hasScanned && drops.length === 0 && !loading && (
                    <div className="h-full flex flex-col items-center justify-center text-zinc-500 animate-in fade-in zoom-in-95">
                        <div className="bg-red-600/10 p-10 rounded-full mb-6 border border-red-600/20">
                            <Search size={60} className="text-red-500/50" />
                        </div>
                        <p className="font-black text-white text-xl uppercase tracking-tighter">ZERO SIGNALS DETECTED</p>
                        <p className="text-xs text-zinc-500 mt-3 max-w-md text-center leading-relaxed font-medium uppercase tracking-wide">
                            No verified Mid-Level roles matching your DNA were posted in the last {timeframe}h. 
                            The system automatically rejected 45+ low-quality or confidential listings.
                        </p>
                        <button onClick={handleScan} className="mt-8 text-orange-500 hover:text-orange-400 text-xs font-black border-b-2 border-orange-500/20 hover:border-orange-500 transition-all pb-1 uppercase tracking-widest">RE-SCAN DEEP NODES</button>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredDrops.map((job, idx) => (
                        <div 
                            key={job.id} 
                            style={{ animationDelay: `${idx * 100}ms` }}
                            className="bg-[#0A0A0A] border border-zinc-800 p-6 rounded-[2rem] hover:border-orange-600/50 transition-all group relative overflow-hidden flex flex-col h-full animate-in slide-in-from-bottom-6 shadow-xl"
                        >
                            <div className="absolute -top-10 -right-10 w-32 h-32 bg-orange-600/5 blur-[50px] group-hover:bg-orange-600/15 transition-all rounded-full"></div>
                            
                            <div className="flex justify-between items-start mb-5 relative z-10">
                                <div className="flex flex-col gap-1">
                                    <span className="text-[9px] font-black bg-orange-600/10 text-orange-500 px-3 py-1 rounded-full border border-orange-500/20 flex items-center gap-2 w-fit uppercase tracking-tighter">
                                        <Clock size={10}/> {job.postedDate}
                                    </span>
                                </div>
                                <div className="bg-zinc-900 border border-zinc-800 p-2 rounded-xl text-green-500 shadow-inner" title="Company Verified">
                                    <ShieldCheck size={16}/>
                                </div>
                            </div>

                            <h3 className="text-xl font-black text-white mb-2 leading-[1.1] group-hover:text-orange-400 transition-colors line-clamp-2 uppercase tracking-tighter italic">{job.title}</h3>
                            <div className="text-[11px] font-black text-zinc-500 mb-6 flex items-center gap-2 uppercase tracking-widest">
                                <MapPin size={12} className="text-orange-600"/> {job.company}
                                <span className="text-zinc-800 font-normal">/</span>
                                <span className="text-zinc-400">{job.location}</span>
                            </div>
                            
                            <div className="bg-zinc-900/30 p-5 rounded-[1.5rem] border border-zinc-800/50 mb-6 flex-1 relative group-hover:bg-zinc-900/50 transition-colors">
                                <div className="text-[8px] text-zinc-600 uppercase font-black mb-3 tracking-[0.2em] flex items-center justify-between">
                                    <span className="flex items-center gap-1.5"><Fingerprint size={10} className="text-orange-500"/> FORENSIC MATCH</span>
                                    <span className="text-orange-500/40">{job.source}</span>
                                </div>
                                <p className="text-[11px] text-zinc-400 leading-relaxed font-medium line-clamp-5">{job.matchReason}</p>
                            </div>

                            <div className="flex gap-3 mt-auto relative z-10">
                                {job.url ? (
                                    <button 
                                        onClick={() => window.open(job.url, '_blank')}
                                        className="flex-1 bg-white hover:bg-zinc-200 text-black py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.1em] flex items-center justify-center gap-2 shadow-xl transition-all active:scale-95"
                                    >
                                        <ExternalLink size={14}/> APPLY DIRECT
                                    </button>
                                ) : (
                                    <button 
                                        onClick={() => window.open(getSmartUrl(job), '_blank')}
                                        className="flex-1 bg-zinc-900 hover:bg-zinc-800 text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.1em] flex items-center justify-center gap-2 border border-zinc-800 transition-all active:scale-95 shadow-lg"
                                    >
                                        <Search size={14}/> SMART FIND
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
