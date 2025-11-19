import React, { useState } from 'react';
import { Users, Search, MessageSquare, UserPlus, Send, Loader2 } from 'lucide-react';
import { findRecruiters, generateRecruiterMessage } from '../services/geminiService';
import { PersonaType } from '../types';

const RecruiterOutreach: React.FC = () => {
  const [company, setCompany] = useState('');
  const [recruiters, setRecruiters] = useState<{name: string, role: string, source?: string}[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRecruiter, setSelectedRecruiter] = useState<string | null>(null);
  const [generatedMsg, setGeneratedMsg] = useState('');
  const [isMsgLoading, setIsMsgLoading] = useState(false);
  const [persona, setPersona] = useState<PersonaType>(PersonaType.MARKETING);

  const handleSearch = async () => {
    if (!company) return;
    setIsLoading(true);
    setRecruiters([]);
    setSelectedRecruiter(null);
    setGeneratedMsg('');
    
    try {
      const results = await findRecruiters(company);
      setRecruiters(results);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerate = async (name: string) => {
    setSelectedRecruiter(name);
    setIsMsgLoading(true);
    try {
        const msg = await generateRecruiterMessage(name, company, persona);
        setGeneratedMsg(msg);
    } catch (e) {
        console.error(e);
    } finally {
        setIsMsgLoading(false);
    }
  };

  return (
    <div className="p-8 h-screen flex flex-col">
      <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
        <Users className="text-brand-500"/> Recruiter Headhunter
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-1 overflow-hidden">
        {/* Search Section */}
        <div className="flex flex-col space-y-4">
            <div className="bg-dark-card border border-dark-border p-6 rounded-xl">
                <label className="block text-sm text-slate-400 mb-2">Target Company</label>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        placeholder="e.g. Binance, Careem, G42"
                        className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 text-white focus:border-brand-500 outline-none"
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    />
                    <button 
                        onClick={handleSearch}
                        disabled={isLoading || !company}
                        className="bg-brand-600 hover:bg-brand-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 disabled:opacity-50"
                    >
                        {isLoading ? <Loader2 className="animate-spin" size={18}/> : <Search size={18}/>}
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3">
                {recruiters.length > 0 && (
                    <p className="text-sm text-slate-500 font-medium">Found People</p>
                )}
                {recruiters.map((rec, idx) => (
                    <div 
                        key={idx}
                        onClick={() => handleGenerate(rec.name)}
                        className={`p-4 rounded-lg border cursor-pointer transition-all flex justify-between items-center group ${
                            selectedRecruiter === rec.name 
                            ? 'bg-brand-900/20 border-brand-500' 
                            : 'bg-dark-card border-dark-border hover:border-slate-600'
                        }`}
                    >
                        <div>
                            <div className="font-bold text-white group-hover:text-brand-400">{rec.name}</div>
                            <div className="text-xs text-slate-400">{rec.role}</div>
                        </div>
                        <div className="bg-slate-800 p-2 rounded-full text-slate-400 group-hover:text-white group-hover:bg-brand-600 transition-colors">
                            <MessageSquare size={16}/>
                        </div>
                    </div>
                ))}
                 {recruiters.length === 0 && !isLoading && (
                    <div className="text-center text-slate-600 py-10 border border-dashed border-slate-800 rounded-xl">
                        Enter a company to find key decision makers.
                    </div>
                 )}
            </div>
        </div>

        {/* Message Generation Section */}
        <div className="flex flex-col h-full bg-dark-card border border-dark-border rounded-xl overflow-hidden">
             <div className="p-4 border-b border-dark-border bg-slate-900/50 flex justify-between items-center">
                <h3 className="font-semibold text-white flex items-center gap-2">
                    <Send size={16} className="text-brand-500"/> Outreach Composer
                </h3>
                <div className="flex gap-2">
                     {Object.values(PersonaType).map(p => (
                        <button
                            key={p}
                            onClick={() => setPersona(p)}
                            className={`text-[10px] px-2 py-1 rounded uppercase tracking-wider ${
                                persona === p ? 'bg-brand-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
                            }`}
                        >
                            {p.split(' ')[0]}
                        </button>
                     ))}
                </div>
             </div>

             <div className="flex-1 p-6 overflow-y-auto">
                {isMsgLoading ? (
                    <div className="h-full flex flex-col items-center justify-center text-brand-500 gap-3">
                        <Loader2 className="animate-spin" size={32}/>
                        <span className="text-sm">Crafting persuasive message...</span>
                    </div>
                ) : generatedMsg ? (
                    <div className="whitespace-pre-wrap font-mono text-sm text-slate-300 leading-relaxed">
                        {generatedMsg}
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-3">
                        <UserPlus size={48} className="opacity-20"/>
                        <p className="text-sm">Select a recruiter to generate a message.</p>
                    </div>
                )}
             </div>

             {generatedMsg && (
                 <div className="p-4 border-t border-dark-border bg-slate-900/50">
                     <button 
                        onClick={() => navigator.clipboard.writeText(generatedMsg)}
                        className="w-full py-3 bg-brand-600 hover:bg-brand-500 text-white rounded-lg font-medium transition-colors"
                     >
                        Copy to Clipboard
                     </button>
                 </div>
             )}
        </div>
      </div>
    </div>
  );
};

export default RecruiterOutreach;