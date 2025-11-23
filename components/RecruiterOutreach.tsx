
import React, { useState, useEffect } from 'react';
import { Users, Search, MessageSquare, UserPlus, Send, Loader2, Mail, Linkedin, Phone, Copy, History, CheckCircle, ExternalLink, AlertCircle, BrainCircuit, Zap, Filter, MessageCircle, FileText } from 'lucide-react';
import { findRecruiters, generateRecruiterMessage, analyzeRecruiterReply, generateWhatsAppMessage } from '../services/geminiService';
import { getInteractions, saveInteraction, getExcludedNames, getLastContactDate, getUiState, saveUiState } from '../services/storageService';
import { PersonaType, RecruiterProfile, InteractionRecord, SentimentAnalysis, SearchFocus } from '../types';

interface RecruiterOutreachProps {
  results: RecruiterProfile[];
  setResults: (r: RecruiterProfile[]) => void;
  companyQuery: string;
  setCompanyQuery: (q: string) => void;
}

const RecruiterOutreach: React.FC<RecruiterOutreachProps> = ({
  results,
  setResults,
  companyQuery,
  setCompanyQuery
}) => {
  const [view, setView] = useState<'search' | 'history' | 'intelligence'>('search');
  const [history, setHistory] = useState<InteractionRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRecruiter, setSelectedRecruiter] = useState<RecruiterProfile | null>(null);
  const [generatedMsg, setGeneratedMsg] = useState('');
  const [isMsgLoading, setIsMsgLoading] = useState(false);
  const [persona, setPersona] = useState<PersonaType>(PersonaType.MARKETING);
  const [focus, setFocus] = useState<SearchFocus>(SearchFocus.ALL);
  
  // Intelligence State
  const [replyText, setReplyText] = useState('');
  const [analysis, setAnalysis] = useState<SentimentAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
      setHistory(getInteractions('Recruiter'));
      
      // Load UI State
      const state = getUiState();
      if (state.recruiterView) setView(state.recruiterView as any);
      if (state.recruiterFocus) setFocus(state.recruiterFocus as any);
      if (state.recruiterReplyText) setReplyText(state.recruiterReplyText);
  }, []);

  // Save UI State
  const updateView = (v: any) => { setView(v); saveUiState({ recruiterView: v }); }
  const updateFocus = (f: any) => { setFocus(f); saveUiState({ recruiterFocus: f }); }
  const updateReplyText = (t: string) => { setReplyText(t); saveUiState({ recruiterReplyText: t }); }

  const handleSearch = async () => {
    if (!companyQuery) return;
    setIsLoading(true);
    setResults([]);
    setSelectedRecruiter(null);
    try {
      const excluded = getExcludedNames('Recruiter');
      const data = await findRecruiters(companyQuery, focus, excluded);
      setResults(data);
    } catch (e) { console.error(e); } 
    finally { setIsLoading(false); }
  };

  const handleGenerate = async (rec: RecruiterProfile) => {
    setSelectedRecruiter(rec);
    setIsMsgLoading(true);
    try {
        const msg = await generateRecruiterMessage(rec.name, companyQuery, persona);
        setGeneratedMsg(msg);
    } catch (e) { console.error(e); } 
    finally { setIsMsgLoading(false); }
  };
  
  const handleWhatsApp = async (rec: RecruiterProfile) => {
      if (rec.phone) {
          const text = await generateWhatsAppMessage(rec.name, rec.company, rec.role);
          const url = `https://wa.me/${rec.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(text)}`;
          window.open(url, '_blank');
      } else {
          const q = `site:linkedin.com/in "${rec.name}" "${rec.company}" phone OR mobile OR contact`;
          window.open(`https://www.google.com/search?q=${encodeURIComponent(q)}`, '_blank');
      }
  }

  const handleAnalyzeReply = async () => {
      setIsAnalyzing(true);
      const result = await analyzeRecruiterReply(replyText);
      setAnalysis(result);
      setIsAnalyzing(false);
  }

  const markContacted = () => {
      if (!selectedRecruiter) return;
      saveInteraction(selectedRecruiter.name, 'Recruiter', selectedRecruiter.email || 'Linked');
      setHistory(getInteractions('Recruiter'));
      setResults(results.map(r => r.name === selectedRecruiter.name ? {...r, contacted: true} : r)); 
  }

  const getSpamWarning = (name: string) => {
      const date = getLastContactDate(name);
      if (!date) return null;
      const days = Math.floor((new Date().getTime() - new Date(date).getTime()) / (1000 * 3600 * 24));
      if (days < 30) return `Contacted ${days} days ago`;
      return null;
  }

  const getCategoryBadge = (cat?: string) => {
      if (cat === 'A') return <span className="flex items-center gap-1 text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded border border-green-500/30 font-bold"><Zap size={10}/> PRIORITY</span>;
      if (cat === 'B') return <span className="flex items-center gap-1 text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded border border-blue-500/30 font-bold">ACTIVE</span>;
      return <span className="flex items-center gap-1 text-xs bg-slate-700/50 text-slate-400 px-2 py-0.5 rounded border border-slate-600">HR</span>;
  }

  // Zero Hallucination: If no direct link, construct a precise search URL
  const getSmartSearchLink = (name: string, company: string, type: 'linkedin' | 'email') => {
      const q = type === 'linkedin' 
        ? `site:linkedin.com/in "${name}" "${company}"`
        : `"${name}" "${company}" email contact`;
      return `https://www.google.com/search?q=${encodeURIComponent(q)}`;
  }

  return (
    <div className="p-8 h-screen flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Users className="text-brand-500"/> Recruiter Headhunter
        </h2>
        <div className="flex bg-slate-800 rounded-lg p-1">
            <button onClick={() => updateView('search')} className={`px-4 py-2 rounded-md text-sm ${view === 'search' ? 'bg-brand-600 text-white' : 'text-slate-400'}`}>Search</button>
            <button onClick={() => updateView('intelligence')} className={`px-4 py-2 rounded-md text-sm flex items-center gap-2 ${view === 'intelligence' ? 'bg-brand-600 text-white' : 'text-slate-400'}`}>
                <BrainCircuit size={14}/> Intelligence
            </button>
            <button onClick={() => updateView('history')} className={`px-4 py-2 rounded-md text-sm flex items-center gap-2 ${view === 'history' ? 'bg-brand-600 text-white' : 'text-slate-400'}`}>
                <History size={14}/> History
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-1 overflow-hidden">
        {view === 'intelligence' ? (
             <div className="col-span-2 grid grid-cols-2 gap-8 h-full">
                 <div className="bg-dark-card border border-dark-border p-6 rounded-xl flex flex-col">
                     <h3 className="text-white font-bold mb-4">Input Recruiter Reply</h3>
                     <textarea 
                        className="flex-1 bg-slate-900 border border-slate-800 rounded p-4 text-slate-300 focus:border-brand-500 outline-none resize-none"
                        placeholder="Paste their email or message here..."
                        value={replyText}
                        onChange={(e) => updateReplyText(e.target.value)}
                     />
                     <button onClick={handleAnalyzeReply} disabled={isAnalyzing || !replyText} className="mt-4 bg-brand-600 text-white py-3 rounded font-bold flex justify-center items-center gap-2">
                         {isAnalyzing ? <Loader2 className="animate-spin"/> : <BrainCircuit/>} Analyze & Draft Reply
                     </button>
                 </div>
                 <div className="bg-dark-card border border-dark-border p-6 rounded-xl flex flex-col overflow-y-auto">
                     {analysis ? (
                         <div className="space-y-6">
                             <div className="flex gap-4">
                                 <div className="px-4 py-2 bg-slate-800 rounded border border-slate-700">
                                     <div className="text-xs text-slate-500 uppercase">Sentiment</div>
                                     <div className="font-bold text-white">{analysis.sentiment}</div>
                                 </div>
                                 <div className="px-4 py-2 bg-slate-800 rounded border border-slate-700">
                                     <div className="text-xs text-slate-500 uppercase">Strategy</div>
                                     <div className="font-bold text-brand-400">{analysis.suggestedTone}</div>
                                 </div>
                             </div>
                             <div>
                                 <h4 className="text-sm font-bold text-slate-400 mb-2">Analysis</h4>
                                 <p className="text-sm text-slate-300">{analysis.analysis}</p>
                             </div>
                             <div className="bg-slate-900 p-4 rounded border border-slate-800">
                                 <h4 className="text-sm font-bold text-slate-400 mb-2">Draft Response</h4>
                                 <p className="text-sm text-white whitespace-pre-wrap font-mono">{analysis.draftReply}</p>
                             </div>
                             <button onClick={() => navigator.clipboard.writeText(analysis.draftReply)} className="w-full bg-slate-700 hover:bg-slate-600 text-white py-2 rounded flex items-center justify-center gap-2">
                                 <Copy size={16}/> Copy Response
                             </button>
                         </div>
                     ) : (
                         <div className="flex items-center justify-center h-full text-slate-500">Run analysis to see insights.</div>
                     )}
                 </div>
             </div>
        ) : (
            <>
                {/* Left Panel */}
                <div className="flex flex-col space-y-4 h-full overflow-hidden">
                    {view === 'search' && (
                        <div className="bg-dark-card border border-dark-border p-6 rounded-xl shrink-0 space-y-4 shadow-lg">
                             <div className="flex items-center gap-2 text-xs text-slate-400">
                                <Filter size={12}/> Target Focus:
                                <select 
                                    value={focus}
                                    onChange={(e) => updateFocus(e.target.value as SearchFocus)}
                                    className="bg-slate-800 text-white border border-slate-700 rounded px-2 py-1 outline-none cursor-pointer"
                                >
                                    {Object.values(SearchFocus).map(f => <option key={f} value={f}>{f}</option>)}
                                </select>
                             </div>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={companyQuery}
                                    onChange={(e) => setCompanyQuery(e.target.value)}
                                    placeholder="Target Company (e.g. Careem)..."
                                    className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 text-white focus:border-brand-500 outline-none"
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                />
                                <button onClick={handleSearch} disabled={isLoading} className="bg-brand-600 text-white px-4 py-2 rounded-lg shadow-lg shadow-brand-500/20">
                                    {isLoading ? <Loader2 className="animate-spin"/> : <Search/>}
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="flex-1 overflow-y-auto space-y-3 pr-2 pb-20 custom-scrollbar">
                        {view === 'search' ? results.map((rec, idx) => {
                            const warning = getSpamWarning(rec.name);
                            return (
                                <div 
                                    key={idx} 
                                    className={`p-5 rounded-xl border transition-all cursor-pointer relative ${warning ? 'border-red-500/50 bg-red-900/10' : 'bg-dark-card border-dark-border'} ${selectedRecruiter?.name === rec.name ? 'border-brand-500 shadow-lg shadow-brand-500/10' : 'hover:border-slate-600'}`} 
                                    onClick={() => handleGenerate(rec)}
                                >
                                    {warning && <div className="absolute top-2 right-2 text-[10px] text-red-400 flex items-center gap-1"><AlertCircle size={10}/> {warning}</div>}
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="font-bold text-white text-lg">{rec.name}</div>
                                            <div className="text-sm text-brand-400 font-medium">{rec.role}</div>
                                            <div className="text-xs text-slate-500">{rec.company}</div>
                                        </div>
                                        {getCategoryBadge(rec.category)}
                                    </div>
                                    
                                    {rec.recentPostSnippet && (
                                        <div className="mt-3 text-xs bg-slate-900 p-2 rounded border border-slate-800 flex items-start gap-2">
                                            <MessageSquare size={12} className="text-slate-500 mt-0.5"/>
                                            <span className="text-slate-300 italic">"{rec.recentPostSnippet}"</span>
                                        </div>
                                    )}
                                    
                                    {/* Smart Contact Actions */}
                                    <div className="flex gap-2 mt-4">
                                        {rec.linkedin ? (
                                            <a href={rec.linkedin} target="_blank" onClick={(e) => e.stopPropagation()} className="text-xs bg-[#0077b5]/20 text-[#0077b5] px-3 py-1.5 rounded border border-[#0077b5]/30 flex items-center gap-1 hover:bg-[#0077b5]/30 font-bold"><Linkedin size={12}/> Profile</a>
                                        ) : (
                                            <a href={getSmartSearchLink(rec.name, rec.company, 'linkedin')} target="_blank" onClick={(e) => e.stopPropagation()} className="text-xs bg-slate-800 text-slate-300 px-3 py-1.5 rounded border border-slate-700 flex items-center gap-1 hover:bg-slate-700 font-bold"><Search size={12}/> Find Profile</a>
                                        )}
                                        {rec.email ? (
                                            <a href={`mailto:${rec.email}`} onClick={(e) => e.stopPropagation()} className="text-xs bg-orange-500/20 text-orange-400 px-3 py-1.5 rounded border border-orange-500/30 flex items-center gap-1 hover:bg-orange-500/30 font-bold"><Mail size={12}/> Email</a>
                                        ) : (
                                             <a href={getSmartSearchLink(rec.name, rec.company, 'email')} target="_blank" onClick={(e) => e.stopPropagation()} className="text-xs bg-slate-800 text-slate-300 px-3 py-1.5 rounded border border-slate-700 flex items-center gap-1 hover:bg-slate-700 font-bold"><Search size={12}/> Find Email</a>
                                        )}
                                        <button onClick={(e) => {e.stopPropagation(); handleWhatsApp(rec)}} className="text-xs bg-green-600/20 text-green-400 px-3 py-1.5 rounded border border-green-600/30 flex items-center gap-1 hover:bg-green-600/30 font-bold"><MessageCircle size={12}/> {rec.phone ? 'WhatsApp' : 'Find Phone'}</button>
                                    </div>
                                </div>
                            );
                        }) : history.map(h => (
                            <div key={h.id} className="p-4 rounded-lg border border-slate-800 bg-slate-900/50 flex justify-between">
                                <div>
                                    <div className="text-white font-bold">{h.name}</div>
                                    <div className="text-xs text-slate-500">{new Date(h.date).toLocaleDateString()}</div>
                                </div>
                                <CheckCircle size={16} className="text-green-500"/>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Panel */}
                <div className="flex flex-col h-full bg-dark-card border border-dark-border rounded-xl overflow-hidden">
                    {selectedRecruiter ? (
                        <>
                            <div className="p-4 border-b border-dark-border bg-slate-900/50 flex justify-between items-center">
                                <h3 className="font-semibold text-white">Drafting for: {selectedRecruiter.name}</h3>
                                <button onClick={markContacted} className="text-xs bg-green-600/20 text-green-400 px-3 py-1 rounded border border-green-600/30 hover:bg-green-600/40 transition-colors">Mark Contacted</button>
                            </div>
                            <div className="flex-1 p-6 overflow-y-auto">
                                {isMsgLoading ? <div className="flex flex-col items-center justify-center h-full gap-2"><Loader2 className="animate-spin text-brand-500" size={32}/><span className="text-xs text-slate-500">Writing Hook...</span></div> : <div className="whitespace-pre-wrap font-mono text-sm text-slate-300 leading-relaxed">{generatedMsg}</div>}
                            </div>
                            {generatedMsg && (
                                <div className="p-4 border-t border-dark-border">
                                    <button onClick={() => navigator.clipboard.writeText(generatedMsg)} className="w-full bg-brand-600 text-white py-3 rounded-lg flex justify-center items-center gap-2 font-bold hover:bg-brand-500 shadow-lg shadow-brand-500/20">
                                        <Copy size={18}/> Copy Message
                                    </button>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-500">
                            <Users size={48} className="opacity-20 mb-4"/>
                            <p>Select a recruiter to begin outreach.</p>
                        </div>
                    )}
                </div>
            </>
        )}
      </div>
    </div>
  );
};
export default RecruiterOutreach;
