
import React, { useState, useEffect } from 'react';
import { Zap, RefreshCw, ArrowRight, Target, ExternalLink } from 'lucide-react';
import { analyzeMarketSignals } from '../services/geminiService';
import { getSavedSignals, saveSignals } from '../services/storageService';
import { MarketSignal } from '../types';

interface MarketSignalsProps {
    onSignalAction: (company: string) => void;
}

const MarketSignals: React.FC<MarketSignalsProps> = ({ onSignalAction }) => {
    const [signals, setSignals] = useState<MarketSignal[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const saved = getSavedSignals();
        if (saved.length > 0) setSignals(saved);
        // Auto-scan removed as per request
    }, []);

    const handleScan = async () => {
        setLoading(true);
        try {
            const results = await analyzeMarketSignals();
            if (results.length > 0) {
                setSignals(results);
                saveSignals(results);
            }
        } catch(e) { console.error(e); }
        finally { setLoading(false); }
    }

    const verifySignal = (signal: MarketSignal) => {
        // Specific News Search for verification
        const q = encodeURIComponent(`${signal.company} ${signal.signalType} UAE news`);
        // Use tbs=qdr:m to filter for past month only
        window.open(`https://www.google.com/search?q=${q}&tbs=qdr:m`, '_blank');
    }

    return (
        <div className="p-8 h-screen flex flex-col">
             <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <Zap className="text-yellow-500"/> Dynamic Opportunity Analyzer
                </h2>
                <button onClick={handleScan} disabled={loading} className="bg-brand-600 hover:bg-brand-500 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2">
                    {loading ? <RefreshCw className="animate-spin" size={16}/> : <RefreshCw size={16}/>}
                    Scan Signals
                </button>
            </div>

            <div className="flex-1 overflow-y-auto pb-20">
                {signals.length === 0 && !loading ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-500 border-2 border-dashed border-slate-800 rounded-xl bg-slate-900/10">
                        <Zap size={48} className="mb-4 opacity-20" />
                        <p className="font-medium">Market Pulse is waiting.</p>
                        <p className="text-xs mt-2">Click "Scan Signals" to analyze recent UAE market movements.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                        {signals.map(signal => (
                            <div key={signal.id} className="bg-dark-card border border-dark-border p-5 rounded-xl hover:border-brand-500/50 transition-all group">
                                <div className="flex justify-between items-start mb-2">
                                    <span className={`text-xs px-2 py-1 rounded font-bold uppercase ${
                                        signal.signalType === 'Funding' ? 'bg-green-500/20 text-green-400' :
                                        signal.signalType === 'Expansion' ? 'bg-blue-500/20 text-blue-400' :
                                        'bg-purple-500/20 text-purple-400'
                                    }`}>
                                        {signal.signalType}
                                    </span>
                                    <span className="text-xs text-slate-500">{new Date(signal.dateDetected).toLocaleDateString()}</span>
                                </div>
                                <h3 className="text-xl font-bold text-white mb-1">{signal.company}</h3>
                                <p className="text-sm text-slate-400 mb-4 line-clamp-3">{signal.summary}</p>
                                
                                <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-800 mb-4">
                                    <div className="text-xs text-slate-500 uppercase mb-1">Recommended Targets</div>
                                    <div className="flex flex-wrap gap-2">
                                        {signal.actionableLeads.map(lead => (
                                            <span key={lead} className="text-xs bg-slate-800 text-slate-300 px-2 py-1 rounded border border-slate-700">
                                                {lead}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => verifySignal(signal)}
                                        className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium text-sm border border-slate-700 flex items-center justify-center gap-2"
                                        title="Verify this news on Google"
                                    >
                                        <ExternalLink size={16}/>
                                    </button>
                                    <button 
                                        onClick={() => onSignalAction(signal.company)}
                                        className="flex-1 py-2 bg-brand-600/20 hover:bg-brand-600 text-brand-400 hover:text-white border border-brand-500/30 rounded-lg font-bold text-sm transition-colors flex justify-center items-center gap-2"
                                    >
                                        <Target size={16}/> Hunt Recruiters
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
export default MarketSignals;
