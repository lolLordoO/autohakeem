
import React, { useState } from 'react';
import { Users, Search, MessageSquare, UserPlus, Send, Loader2, Mail, Linkedin, Phone, Copy, ExternalLink } from 'lucide-react';
import { findRecruiters, generateRecruiterMessage } from '../services/geminiService';
import { PersonaType, RecruiterProfile } from '../types';

const RecruiterOutreach: React.FC = () => {
  const [company, setCompany] = useState('');
  const [recruiters, setRecruiters] = useState<RecruiterProfile[]>([]);
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

  const launchEmail = (email: string) => {
      window.location.href = `mailto:${email}?subject=Inquiry regarding opportunities at ${company}`;
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

            <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                {recruiters.length > 0 && (
                    <p className="text-sm text-slate-500 font-medium">Found People & Contact Info</p>
                )}
                {recruiters.map((rec, idx) => (
                    <div 
                        key={idx}
                        className={`p-4 rounded-lg border transition-all flex flex-col gap-3 group ${
                            selectedRecruiter === rec.name 
                            ? 'bg-brand-900/20 border-brand-500' 
                            : 'bg-dark-card border-dark-border hover:border-slate-600'
                        }`}
                    >
                        <div className="flex justify-between items-start cursor-pointer" onClick={() => handleGenerate(rec.name)}>
                            <div>
                                <div className="font-bold text-white group-hover:text-brand-400">{rec.name}</div>
                                <div className="text-xs text-slate-400">{rec.role}</div>
                                <div className="text-[10px] text-slate-600 mt-1 uppercase">{rec.source || 'Web Search'}</div>
                            </div>
                            <div className="bg-slate-800 p-2 rounded-full text-slate-400 group-hover:text-white group-hover:bg-brand-600 transition-colors">
                                <MessageSquare size={16}/>
                            </div>
                        </div>

                        {/* Contact Details Bar */}
                        <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-800">
                             {/* LinkedIn */}
                             {rec.linkedin && rec.linkedin !== 'Not found' ? (
                                 <a href={rec.linkedin} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs px-2 py-1 rounded bg-[#0077b5]/20 text-[#0077b5] hover:bg-[#0077b5]/30 border border-[#0077b5]/50">
                                     <Linkedin size={12}/> Profile
                                 </a>
                             ) : (
                                 <span className="flex items-center gap-1 text-xs px-2 py-1 rounded bg-slate-800 text-slate-500 cursor-not-allowed">
                                     <Linkedin size={12}/> No URL
                                 </span>
                             )}

                             {/* Email */}
                             {rec.email && rec.email !== 'Not found' ? (
                                 <button onClick={() => launchEmail(rec.email!)} className="flex items-center gap-1 text-xs px-2 py-1 rounded bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 border border-orange-500/50">
                                     <Mail size={12}/> {rec.email}
                                 </button>
                             ) : (
                                 <span className="flex items-center gap-1 text-xs px-2 py-1 rounded bg-slate-800 text-slate-500 cursor-not-allowed">
                                     <Mail size={12}/> No Email
                                 </span>
                             )}

                             {/* Phone */}
                              {rec.phone && rec.phone !== 'Not found' && (
                                 <span className="flex items-center gap-1 text-xs px-2 py-1 rounded bg-green-500/20 text-green-400 border border-green-500/50">
                                     <Phone size={12}/> {rec.phone}
                                 </span>
                             )}
                        </div>
                    </div>
                ))}
                 {recruiters.length === 0 && !isLoading && (
                    <div className="text-center text-slate-600 py-10 border border-dashed border-slate-800 rounded-xl">
                        Enter a company to find key decision makers and their contact info.
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
                 <div className="p-4 border-t border-dark-border bg-slate-900/50 flex gap-3">
                     <button 
                        onClick={() => navigator.clipboard.writeText(generatedMsg)}
                        className="flex-1 py-3 bg-brand-600 hover:bg-brand-500 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                     >
                        <Copy size={16}/> Copy Text
                     </button>
                 </div>
             )}
        </div>
      </div>
    </div>
  );
};

export default RecruiterOutreach;
