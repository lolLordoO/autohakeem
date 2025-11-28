
import React, { useState } from 'react';
import { Microscope, Search, AlertTriangle, CheckCircle, TrendingUp, DollarSign, BrainCircuit, Loader2, Link as LinkIcon, Briefcase } from 'lucide-react';
import { analyzeJobSense } from '../services/geminiService';
import { JobSenseAnalysis } from '../types';

const JobSense: React.FC = () => {
    const [url, setUrl] = useState('');
    const [analysis, setAnalysis] = useState<JobSenseAnalysis | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleAnalyze = async () => {
        if (!url) return;
        setIsLoading(true);
        setError('');
        setAnalysis(null);
        try {
            const result = await analyzeJobSense(url);
            if (!result.jobTitle) throw new Error("Could not parse job details. Link might be invalid.");
            setAnalysis(result);
        } catch (e: any) {
            setError(e.message || "Failed to analyze job link. Please try a direct career page link.");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="p-8 h-screen flex flex-col bg-dark-bg">
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <Microscope className="text-cyan-400"/> Job Sense
                </h2>
                <p className="text-slate-400 text-sm mt-1">Forensic Job Analysis & Market Reality Check</p>
            </div>

            {/* Input Section */}
            <div className="bg-dark-card border border-dark-border p-6 rounded-xl mb-8 shadow-lg">
                <label className="text-xs text-slate-500 font-bold uppercase mb-2 block">Job Post URL</label>
                <div className="flex gap-3">
                    <div className="relative flex-1">
                        <input 
                            type="text" 
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="Paste LinkedIn, Indeed, or Career Page URL..."
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg py-3 pl-10 pr-4 text-white focus:border-cyan-500 outline-none transition-colors"
                            onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
                        />
                        <LinkIcon className="absolute left-3 top-3.5 text-slate-500" size={16}/>
                    </div>
                    <button 
                        onClick={handleAnalyze} 
                        disabled={isLoading || !url}
                        className="bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white px-6 rounded-lg font-bold flex items-center gap-2 transition-all shadow-lg shadow-cyan-500/20"
                    >
                        {isLoading ? <Loader2 className="animate-spin"/> : <Search size={18}/>} 
                        Analyze
                    </button>
                </div>
                {error && (
                    <div className="mt-4 p-3 bg-red-900/20 border border-red-500/30 rounded-lg text-red-300 text-sm flex items-center gap-2">
                        <AlertTriangle size={16}/> {error}
                    </div>
                )}
            </div>

            {/* Results Dashboard */}
            {analysis ? (
                <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-3 gap-6 pb-20 animate-in slide-in-from-bottom-4">
                    {/* Header Card */}
                    <div className="lg:col-span-3 bg-gradient-to-r from-slate-900 to-cyan-900/20 border border-slate-700 rounded-xl p-6 flex justify-between items-start">
                        <div>
                            <div className="text-xs text-cyan-400 font-bold uppercase mb-1">Target Identified</div>
                            <h3 className="text-2xl font-bold text-white">{analysis.jobTitle}</h3>
                            <div className="flex items-center gap-2 text-slate-300 mt-1">
                                <Briefcase size={14}/> {analysis.company}
                            </div>
                            <p className="text-sm text-slate-400 mt-4 max-w-2xl italic">"{analysis.roleSummary}"</p>
                        </div>
                        <div className="text-right">
                            <div className="text-xs text-slate-500 font-bold uppercase">Match Score</div>
                            <div className={`text-4xl font-bold ${analysis.matchScore > 80 ? 'text-green-400' : analysis.matchScore > 50 ? 'text-orange-400' : 'text-red-400'}`}>
                                {analysis.matchScore}%
                            </div>
                        </div>
                    </div>

                    {/* Salary & Vibe */}
                    <div className="bg-dark-card border border-dark-border rounded-xl p-6 flex flex-col justify-between">
                        <div>
                            <h4 className="text-slate-400 text-xs font-bold uppercase mb-4 flex items-center gap-2"><DollarSign size={14}/> Salary Reality</h4>
                            <div className="text-2xl font-bold text-white mb-1">{analysis.salaryAnalysis.estimated}</div>
                            <div className="flex items-center gap-2 text-xs">
                                <span className="text-slate-500">Market Avg: {analysis.salaryAnalysis.marketAvg}</span>
                                <span className={`px-2 py-0.5 rounded border ${
                                    analysis.salaryAnalysis.status === 'Above Market' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                                    analysis.salaryAnalysis.status === 'Below Market' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                                    'bg-blue-500/20 text-blue-400 border-blue-500/30'
                                }`}>{analysis.salaryAnalysis.status}</span>
                            </div>
                        </div>
                        <div className="mt-6 pt-6 border-t border-slate-800">
                             <h4 className="text-slate-400 text-xs font-bold uppercase mb-2">Company Vibe</h4>
                             <p className="text-sm text-slate-300">{analysis.companyVibe}</p>
                        </div>
                    </div>

                    {/* ATS Gap */}
                    <div className="bg-dark-card border border-dark-border rounded-xl p-6">
                        <h4 className="text-slate-400 text-xs font-bold uppercase mb-4 flex items-center gap-2"><BrainCircuit size={14}/> ATS Analysis</h4>
                        <div className="mb-4">
                            <div className="flex justify-between text-sm mb-1 text-slate-300">
                                <span>ATS Score</span>
                                <span>{analysis.atsGap.score}/100</span>
                            </div>
                            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full ${analysis.atsGap.score > 75 ? 'bg-green-500' : 'bg-orange-500'}`} style={{width: `${analysis.atsGap.score}%`}}></div>
                            </div>
                        </div>
                        <div>
                            <div className="text-xs text-slate-500 mb-2">Missing Critical Skills:</div>
                            <div className="flex flex-wrap gap-2">
                                {analysis.atsGap.missingSkills.map((skill, i) => (
                                    <span key={i} className="px-2 py-1 bg-red-900/20 text-red-300 border border-red-900/30 rounded text-xs">{skill}</span>
                                ))}
                                {analysis.atsGap.missingSkills.length === 0 && <span className="text-green-400 text-xs">No gaps found!</span>}
                            </div>
                        </div>
                    </div>

                    {/* Flags & Advice */}
                    <div className="bg-dark-card border border-dark-border rounded-xl p-6 flex flex-col gap-4">
                        <div>
                            <h4 className="text-slate-400 text-xs font-bold uppercase mb-2 flex items-center gap-2"><TrendingUp size={14}/> Strategic Advice</h4>
                            <p className="text-sm text-cyan-100 bg-cyan-900/20 p-3 rounded border border-cyan-500/30">
                                {analysis.strategicAdvice}
                            </p>
                        </div>
                        <div className="grid grid-cols-2 gap-4 mt-auto">
                            <div>
                                <div className="text-xs text-green-500 font-bold uppercase mb-1 flex items-center gap-1"><CheckCircle size={10}/> Green Flags</div>
                                <ul className="text-xs text-slate-400 space-y-1 list-disc pl-3">
                                    {analysis.greenFlags.map((f,i) => <li key={i}>{f}</li>)}
                                </ul>
                            </div>
                            <div>
                                <div className="text-xs text-red-500 font-bold uppercase mb-1 flex items-center gap-1"><AlertTriangle size={10}/> Red Flags</div>
                                <ul className="text-xs text-slate-400 space-y-1 list-disc pl-3">
                                    {analysis.redFlags.map((f,i) => <li key={i}>{f}</li>)}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                !isLoading && (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-slate-800 rounded-xl bg-slate-900/10">
                        <Microscope size={48} className="mb-4 opacity-20"/>
                        <p>Paste a job URL to start the investigation.</p>
                    </div>
                )
            )}
        </div>
    );
};

export default JobSense;
