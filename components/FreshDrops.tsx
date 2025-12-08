
import React, { useState } from 'react';
import { Flame, Clock, RefreshCw, ExternalLink, Zap, Briefcase, Filter } from 'lucide-react';
import { getFreshJobDrops } from '../services/geminiService';
import { JobOpportunity } from '../types';

const FreshDrops: React.FC = () => {
    const [drops, setDrops] = useState<JobOpportunity[]>([]);
    const [loading, setLoading] = useState(false);
    const [timeframe, setTimeframe] = useState<24 | 48>(24);
    const [hasScanned, setHasScanned] = useState(false);

    const handleScan = async () => {
        setLoading(true);
        setDrops([]);
        try {
            const results = await getFreshJobDrops(timeframe);
            setDrops(results);
            setHasScanned(true);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }

    const getSmartUrl = (job: JobOpportunity) => {
        const q = encodeURIComponent(`intitle:"${job.title}" "${job.company}" UAE`);
        return `https://www.google.com/search?q=${q}`;
    }

    return (
        <div className="p-8 h-screen flex flex-col bg-dark-bg">
            <div className="flex justify-between items-end mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Flame className="text-orange-500 fill-orange-500"/> Fresh Drops Radar
                    </h2>
                    <p className="text-slate-400 text-sm mt-1">High-Priority Roles posted in the last {timeframe} hours.</p>
                </div>
                
                <div className="flex gap-3">
                    <div className="bg-slate-800 p-1 rounded-lg flex border border-slate-700">
                        <button 
                            onClick={() => setTimeframe(24)} 
                            className={`px-4 py-2 text-xs font-bold rounded-md transition-all ${timeframe === 24 ? 'bg-orange-600 text-white' : 'text-slate-400 hover:text-white'}`}
                        >
                            Last 24h
                        </button>
                        <button 
                            onClick={() => setTimeframe(48)} 
                            className={`px-4 py-2 text-xs font-bold rounded-md transition-all ${timeframe === 48 ? 'bg-orange-600 text-white' : 'text-slate-400 hover:text-white'}`}
                        >
                            Last 48h
                        </button>
                    </div>
                    <button 
                        onClick={handleScan} 
                        disabled={loading}
                        className="bg-brand-600 hover:bg-brand-500 text-white px-6 py-2 rounded-lg font-bold text-sm flex items-center gap-2 shadow-lg shadow-brand-500/20"
                    >
                        {loading ? <RefreshCw className="animate-spin" size={16}/> : <Zap size={16}/>}
                        Start Scan
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto pb-20 custom-scrollbar">
                {!hasScanned && !loading && (
                    <div className="h-full flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-slate-800 rounded-xl bg-slate-900/10">
                        <Flame size={64} className="mb-4 text-orange-500/20" />
                        <h3 className="text-lg font-bold text-slate-300">Ready to Hunt</h3>
                        <p className="text-sm mt-2 max-w-md text-center">Scan for recently posted jobs to get the First Mover Advantage. This tool ignores anything older than {timeframe} hours.</p>
                    </div>
                )}

                {hasScanned && drops.length === 0 && !loading && (
                    <div className="h-full flex flex-col items-center justify-center text-slate-500">
                        <Filter size={64} className="mb-4 opacity-20" />
                        <p>No new high-priority roles found in this window.</p>
                        <button onClick={handleScan} className="mt-4 text-brand-400 hover:text-brand-300 text-sm font-bold">Try Again</button>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {drops.map((job) => (
                        <div key={job.id} className="bg-dark-card border border-dark-border p-5 rounded-xl hover:border-orange-500/50 transition-all group relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                                <Flame size={64} className="text-orange-500"/>
                            </div>
                            
                            <div className="flex justify-between items-start mb-3 relative z-10">
                                <span className="text-[10px] font-bold bg-orange-900/30 text-orange-400 px-2 py-1 rounded border border-orange-500/30 flex items-center gap-1">
                                    <Clock size={10}/> {job.postedDate}
                                </span>
                                {job.salaryEstimate && (
                                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-900/20 px-2 py-1 rounded border border-emerald-500/30">
                                        {job.salaryEstimate}
                                    </span>
                                )}
                            </div>

                            <h3 className="text-lg font-bold text-white mb-1 line-clamp-2 relative z-10">{job.title}</h3>
                            <div className="text-sm text-slate-400 mb-4 flex items-center gap-2 relative z-10">
                                <Briefcase size={12}/> {job.company}
                            </div>
                            
                            <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-800 mb-4 relative z-10">
                                <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Why Match?</div>
                                <p className="text-xs text-slate-300 line-clamp-2">{job.matchReason}</p>
                            </div>

                            <div className="flex gap-2 relative z-10 mt-auto">
                                <button 
                                    onClick={() => window.open(job.url || getSmartUrl(job), '_blank')}
                                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 border border-slate-700"
                                >
                                    <ExternalLink size={12}/> {job.url ? 'Apply' : 'Search'}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default FreshDrops;
    