
import React, { useState, useEffect } from 'react';
import { Users, Search, MessageSquare, UserPlus, Send, Loader2, Mail, Linkedin, Phone, Copy, History, CheckCircle, ExternalLink, AlertCircle } from 'lucide-react';
import { findRecruiters, generateRecruiterMessage } from '../services/geminiService';
import { getInteractions, saveInteraction, getExcludedNames } from '../services/storageService';
import { PersonaType, RecruiterProfile, InteractionRecord } from '../types';

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
  const [view, setView] = useState<'search' | 'history'>('search');
  const [history, setHistory] = useState<InteractionRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRecruiter, setSelectedRecruiter] = useState<RecruiterProfile | null>(null);
  const [generatedMsg, setGeneratedMsg] = useState('');
  const [isMsgLoading, setIsMsgLoading] = useState(false);
  const [persona, setPersona] = useState<PersonaType>(PersonaType.MARKETING);

  useEffect(() => {
      setHistory(getInteractions('Recruiter'));
  }, []);

  const handleSearch = async () => {
    if (!companyQuery) return;
    setIsLoading(true);
    setResults([]); // Clear previous
    setSelectedRecruiter(null);
    setGeneratedMsg('');
    
    try {
      // Pass excluded names to avoid duplicates
      const excluded = getExcludedNames('Recruiter');
      const data = await findRecruiters(companyQuery, excluded);
      setResults(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerate = async (rec: RecruiterProfile) => {
    setSelectedRecruiter(rec);
    setIsMsgLoading(true);
    try {
        const msg = await generateRecruiterMessage(rec.name, companyQuery, persona);
        setGeneratedMsg(msg);
    } catch (e) {
        console.error(e);
    } finally {
        setIsMsgLoading(false);
    }
  };

  const markContacted = () => {
      if (!selectedRecruiter) return;
      saveInteraction(selectedRecruiter.name, 'Recruiter', selectedRecruiter.email || selectedRecruiter.linkedin || 'No info');
      setHistory(getInteractions('Recruiter'));
      // Optional: Remove from list or just mark visually
      setResults(results.map(r => r.name === selectedRecruiter.name ? {...r, contacted: true} : r)); 
      setSelectedRecruiter(null);
      setGeneratedMsg('');
  }

  return (
    <div className="p-8 h-screen flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Users className="text-brand-500"/> Recruiter Headhunter
        </h2>
        <div className="flex bg-slate-800 rounded-lg p-1">
            <button onClick={() => setView('search')} className={`px-4 py-2 rounded-md text-sm ${view === 'search' ? 'bg-brand-600 text-white' : 'text-slate-400'}`}>Search</button>
            <button onClick={() => setView('history')} className={`px-4 py-2 rounded-md text-sm flex items-center gap-2 ${view === 'history' ? 'bg-brand-600 text-white' : 'text-slate-400'}`}>
                <History size={14}/> History
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-1 overflow-hidden">
        {/* Left Panel: Search & List */}
        <div className="flex flex-col space-y-4 h-full overflow-hidden">
            {view === 'search' ? (
                <>
                    <div className="bg-dark-card border border-dark-border p-6 rounded-xl shrink-0">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={companyQuery}
                                onChange={(e) => setCompanyQuery(e.target.value)}
                                placeholder="Target Company (e.g. Careem, Talabat)"
                                className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 text-white focus:border-brand-500 outline-none"
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            />
                            <button 
                                onClick={handleSearch}
                                disabled={isLoading || !companyQuery}
                                className="bg-brand-600 hover:bg-brand-500 text-white px-4 py-2 rounded-lg disabled:opacity-50"
                            >
                                {isLoading ? <Loader2 className="animate-spin" size={18}/> : <Search size={18}/>}
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-3 pr-2 pb-20">
                        {results.length === 0 && !isLoading && (
                            <div className="text-center text-slate-500 mt-10">Search for a company to find its talent team.</div>
                        )}
                        
                        {results.map((rec, idx) => (
                            <div 
                                key={idx} 
                                className={`p-5 rounded-xl border transition-all cursor-pointer shadow-lg relative overflow-hidden ${selectedRecruiter?.name === rec.name ? 'bg-brand-900/20 border-brand-500' : 'bg-dark-card border-dark-border hover:border-brand-500/50'}`} 
                                onClick={() => handleGenerate(rec)}
                            >
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="font-bold text-white text-lg">{rec.name}</div>
                                        <div className="text-sm text-brand-400 font-medium">{rec.role}</div>
                                        <div className="text-xs text-slate-500 mt-0.5">{rec.company}</div>
                                    </div>
                                </div>

                                {/* Profile Snippet */}
                                {rec.profileSnippet && (
                                    <div className="mt-3 text-sm text-slate-400 italic border-l-2 border-slate-700 pl-3">
                                        "{rec.profileSnippet}"
                                    </div>
                                )}

                                {/* Action Buttons */}
                                <div className="flex gap-3 mt-4 pt-4 border-t border-slate-800">
                                    {rec.linkedin && (
                                        <a 
                                            href={rec.linkedin} 
                                            target="_blank" 
                                            rel="noreferrer"
                                            onClick={(e) => e.stopPropagation()}
                                            className="flex-1 flex items-center justify-center gap-2 py-2 bg-[#0077b5]/20 text-[#0077b5] border border-[#0077b5]/30 rounded hover:bg-[#0077b5]/30 transition-colors text-sm font-medium"
                                        >
                                            <Linkedin size={16}/> Profile
                                        </a>
                                    )}
                                    {rec.email && (
                                        <a 
                                            href={`mailto:${rec.email}`}
                                            onClick={(e) => e.stopPropagation()}
                                            className="flex-1 flex items-center justify-center gap-2 py-2 bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded hover:bg-orange-500/30 transition-colors text-sm font-medium"
                                        >
                                            <Mail size={16}/> Email
                                        </a>
                                    )}
                                    {(!rec.linkedin && !rec.email) && (
                                        <div className="text-xs text-slate-500 flex items-center gap-1">
                                            <AlertCircle size={12}/> No direct contact found
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            ) : (
                <div className="flex-1 overflow-y-auto space-y-2">
                    {history.map(h => (
                        <div key={h.id} className="p-4 rounded-lg border border-slate-800 bg-slate-900/50 flex justify-between items-center">
                            <div>
                                <div className="text-white font-medium">{h.name}</div>
                                <div className="text-xs text-slate-500">{new Date(h.date).toLocaleDateString()}</div>
                            </div>
                            <CheckCircle size={16} className="text-green-500"/>
                        </div>
                    ))}
                </div>
            )}
        </div>

        {/* Right Panel: Message Generator */}
        <div className="flex flex-col h-full bg-dark-card border border-dark-border rounded-xl overflow-hidden">
             {selectedRecruiter ? (
                 <>
                    <div className="p-4 border-b border-dark-border bg-slate-900/50 flex justify-between items-center">
                        <h3 className="font-semibold text-white">Message Draft: <span className="text-brand-400">{selectedRecruiter.name}</span></h3>
                        <button onClick={markContacted} className="text-xs bg-green-600/20 text-green-400 border border-green-600/50 px-3 py-1 rounded hover:bg-green-600/30">
                            Mark Contacted
                        </button>
                    </div>
                    <div className="flex-1 p-6 overflow-y-auto">
                        {isMsgLoading ? (
                            <div className="flex flex-col items-center justify-center h-full">
                                <Loader2 className="animate-spin text-brand-500 mb-2" size={32}/>
                                <p className="text-sm text-slate-500">Personalizing message...</p>
                            </div>
                        ) : (
                            <div className="whitespace-pre-wrap font-mono text-sm text-slate-300 leading-relaxed">
                                {generatedMsg}
                            </div>
                        )}
                    </div>
                    {generatedMsg && (
                         <div className="p-4 border-t border-dark-border flex">
                             <button onClick={() => navigator.clipboard.writeText(generatedMsg)} className="flex-1 bg-brand-600 hover:bg-brand-500 text-white py-3 rounded-lg flex justify-center items-center gap-2 font-bold transition-colors shadow-lg">
                                <Copy size={18}/> Copy Message
                             </button>
                         </div>
                    )}
                 </>
             ) : (
                 <div className="h-full flex flex-col items-center justify-center text-slate-500 p-8 text-center">
                    <MessageSquare size={48} className="mb-4 opacity-20"/>
                    <p>Select a recruiter from the list to draft a highly personalized connection request or InMail.</p>
                 </div>
             )}
        </div>
      </div>
    </div>
  );
};

export default RecruiterOutreach;