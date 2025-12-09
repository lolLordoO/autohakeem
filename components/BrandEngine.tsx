
import React, { useState, useEffect } from 'react';
import { PenTool, Zap, Sparkles, Copy, CheckCircle, Loader2, Sliders } from 'lucide-react';
import { MarketSignal, LinkedInTone } from '../types';
import { getSavedSignals } from '../services/storageService';
import { generateLinkedInPost } from '../services/geminiService';

const BrandEngine: React.FC = () => {
    const [signals, setSignals] = useState<MarketSignal[]>([]);
    const [selectedSignal, setSelectedSignal] = useState<MarketSignal | null>(null);
    const [tone, setTone] = useState<LinkedInTone>('Thought Leader');
    const [creativity, setCreativity] = useState<'Conservative' | 'Balanced' | 'Wild'>('Balanced');
    const [length, setLength] = useState<'Short' | 'Medium' | 'Long'>('Medium');
    const [generatedPost, setGeneratedPost] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        setSignals(getSavedSignals());
    }, []);

    const handleGenerate = async () => {
        if (!selectedSignal) return;
        setIsGenerating(true);
        try {
            const post = await generateLinkedInPost(selectedSignal, tone, creativity, length);
            setGeneratedPost(post);
        } catch(e) { console.error(e); }
        finally { setIsGenerating(false); }
    }

    return (
        <div className="p-8 h-screen flex flex-col">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <PenTool className="text-brand-500"/> Brand Engine
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-1 overflow-hidden">
                <div className="bg-dark-card border border-dark-border rounded-xl p-6 flex flex-col">
                    <h3 className="text-white font-bold mb-4 flex items-center gap-2"><Zap size={18} className="text-yellow-500"/> Select a Market Signal</h3>
                    <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar">
                        {signals.length === 0 && <div className="text-slate-500 text-sm text-center py-10">No signals found. Go to Market Pulse to scan first.</div>}
                        {signals.map(s => (
                            <div 
                                key={s.id} 
                                onClick={() => setSelectedSignal(s)}
                                className={`p-4 rounded-lg border cursor-pointer transition-all ${selectedSignal?.id === s.id ? 'bg-brand-900/20 border-brand-500' : 'bg-slate-900 border-slate-800 hover:border-slate-700'}`}
                            >
                                <div className="font-bold text-white text-sm">{s.company}</div>
                                <div className="text-xs text-slate-400 line-clamp-2 mt-1">{s.summary}</div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-dark-card border border-dark-border rounded-xl p-6 flex flex-col">
                    {selectedSignal ? (
                        <>
                            <div className="mb-4 space-y-4">
                                <div>
                                    <label className="text-xs text-slate-500 uppercase font-bold mb-2 flex items-center gap-1"><Sliders size={12}/> Controls</label>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <span className="text-[10px] text-slate-400 block mb-1">Tone</span>
                                            <select 
                                                value={tone} 
                                                onChange={(e) => setTone(e.target.value as any)}
                                                className="w-full bg-slate-800 border border-slate-700 text-white text-xs rounded px-2 py-1.5 focus:border-brand-500 outline-none"
                                            >
                                                {['Thought Leader', 'Controversial', 'Data-Driven', 'Celebratory'].map(t => <option key={t} value={t}>{t}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <span className="text-[10px] text-slate-400 block mb-1">Length</span>
                                            <div className="flex bg-slate-800 rounded p-0.5 border border-slate-700">
                                                {['Short', 'Medium', 'Long'].map(l => (
                                                    <button 
                                                        key={l} 
                                                        onClick={() => setLength(l as any)}
                                                        className={`flex-1 text-[10px] py-1 rounded transition-colors ${length === l ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-white'}`}
                                                    >
                                                        {l}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-3">
                                        <span className="text-[10px] text-slate-400 block mb-1">Creativity Level: <span className="text-brand-400">{creativity}</span></span>
                                        <input 
                                            type="range" 
                                            min="0" max="2" 
                                            value={creativity === 'Conservative' ? 0 : creativity === 'Balanced' ? 1 : 2}
                                            onChange={(e) => setCreativity(['Conservative', 'Balanced', 'Wild'][parseInt(e.target.value)] as any)}
                                            className="w-full accent-brand-500 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                                        />
                                        <div className="flex justify-between text-[10px] text-slate-600 mt-1">
                                            <span>Safe</span>
                                            <span>Balanced</span>
                                            <span>Bold</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <button 
                                onClick={handleGenerate} 
                                disabled={isGenerating}
                                className="w-full bg-brand-600 hover:bg-brand-500 text-white py-3 rounded-lg font-bold flex justify-center items-center gap-2 mb-4 shadow-lg shadow-brand-500/20"
                            >
                                {isGenerating ? <Loader2 className="animate-spin"/> : <Sparkles size={18}/>} Generate Post
                            </button>
                            
                            <div className="flex-1 bg-slate-900 border border-slate-800 rounded-lg p-4 font-mono text-sm text-slate-300 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                                {generatedPost || "Select a signal and adjust controls to draft your LinkedIn post..."}
                            </div>
                            
                            {generatedPost && (
                                <button 
                                    onClick={() => {navigator.clipboard.writeText(generatedPost); setCopied(true); setTimeout(() => setCopied(false), 2000)}}
                                    className={`mt-4 flex items-center justify-center gap-2 w-full py-2 rounded font-bold transition-all ${copied ? 'bg-green-600 text-white' : 'bg-slate-800 text-brand-400 hover:text-white hover:bg-slate-700'}`}
                                >
                                    {copied ? <CheckCircle size={16}/> : <Copy size={16}/>} {copied ? "Copied!" : "Copy to Clipboard"}
                                </button>
                            )}
                        </>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-500">
                            <PenTool size={48} className="opacity-20 mb-4"/>
                            <p>Select a signal to start writing.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
export default BrandEngine;