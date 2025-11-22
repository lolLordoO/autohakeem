
import React, { useState, useEffect } from 'react';
import { Bot, FileText, Linkedin, Mail, Copy, Check, Sparkles, Trash2, CheckCircle, ExternalLink, Save, ArrowRight, Globe, Wand2, Eraser, AlignLeft, RefreshCw, AlertCircle, BrainCircuit, Loader2, ScanSearch, TrendingUp, Hammer, Clipboard } from 'lucide-react';
import { PersonaType, GeneratedContent, JobOpportunity, ATSAnalysis } from '../types';
import { generateApplicationMaterials, refineContent, recommendPersona, analyzeJobFit, generateResumeBullet } from '../services/geminiService';
import { saveApplication } from '../services/storageService';

interface ApplicationBotProps {
  selectedJob: JobOpportunity | null;
}

const ApplicationBot: React.FC<ApplicationBotProps> = ({ selectedJob }) => {
  const [jobDescription, setJobDescription] = useState('');
  const [persona, setPersona] = useState<PersonaType>(PersonaType.MARKETING);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [isBrainWorking, setIsBrainWorking] = useState(false);
  const [isCheckingATS, setIsCheckingATS] = useState(false);
  const [content, setContent] = useState<GeneratedContent | null>(null);
  const [atsResult, setAtsResult] = useState<ATSAnalysis | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [isApplied, setIsApplied] = useState(false);
  const [recruiterEmail, setRecruiterEmail] = useState('');
  
  // Fix It State
  const [fixingKeyword, setFixingKeyword] = useState<string | null>(null);
  const [generatedBullet, setGeneratedBullet] = useState<string | null>(null);

  // Toast State
  const [toast, setToast] = useState<{msg: string, type: 'success'|'error'} | null>(null);

  const mode = selectedJob?.applyEmail ? 'Email' : 'Portal';

  useEffect(() => {
      if (toast) {
          const timer = setTimeout(() => setToast(null), 3000);
          return () => clearTimeout(timer);
      }
  }, [toast]);

  useEffect(() => {
    if (selectedJob) {
        const desc = selectedJob.description 
            ? `Title: ${selectedJob.title}\nCompany: ${selectedJob.company}\nLocation: ${selectedJob.location}\n\n${selectedJob.description}`
            : `Title: ${selectedJob.title}\nCompany: ${selectedJob.company}`;
        setJobDescription(desc);
        setRecruiterEmail(selectedJob.applyEmail || '');
        setContent(null);
        setAtsResult(null);
        setIsApplied(false);
    }
  }, [selectedJob]);

  const handleAutoRoute = async () => {
      if (!jobDescription) return;
      setIsBrainWorking(true);
      try {
          const rec = await recommendPersona(jobDescription);
          setPersona(rec);
          setToast({msg: `Switched to ${rec} persona based on JD`, type: 'success'});
      } catch(e) { console.error(e); } 
      finally { setIsBrainWorking(false); }
  }

  const handleATSCheck = async () => {
      if (!jobDescription) return;
      setIsCheckingATS(true);
      setGeneratedBullet(null);
      try {
          const result = await analyzeJobFit(jobDescription);
          setAtsResult(result);
      } catch(e) { console.error(e); }
      finally { setIsCheckingATS(false); }
  }

  const handleFixATS = async (keyword: string) => {
      setFixingKeyword(keyword);
      setGeneratedBullet(null);
      try {
          const bullet = await generateResumeBullet(keyword, selectedJob?.title || 'Target Role');
          setGeneratedBullet(bullet);
      } catch(e) { console.error(e); }
      finally { setFixingKeyword(null); }
  }

  const handleGenerate = async () => {
    if (!jobDescription) return;
    setIsGenerating(true);
    setIsApplied(false);
    try {
      const result = await generateApplicationMaterials(jobDescription, persona);
      setContent(result);
    } catch (error) { console.error(error); } 
    finally { setIsGenerating(false); }
  };

  const handleRefine = async (instruction: string) => {
      if (!content) return;
      setIsRefining(true);
      try {
          const refined = await refineContent(content, instruction);
          setContent(refined);
      } catch (e) { console.error(e); } 
      finally { setIsRefining(false); }
  };

  const executeApplication = () => {
      if (!content) return;
      
      if (mode === 'Email') {
          const targetEmail = recruiterEmail || "recruiter@example.com";
          const subject = encodeURIComponent(content.emailSubject || `Application: ${selectedJob?.title}`);
          const body = encodeURIComponent(content.emailDraft || '');
          const mailtoLink = `mailto:${targetEmail}?subject=${subject}&body=${body}`;

          // Check for mailto limits (approx 2000 chars depends on browser)
          if (mailtoLink.length > 2000) {
              navigator.clipboard.writeText(content.emailDraft || '');
              setToast({msg: "Email body too long for direct link. Copied to Clipboard!", type: 'error'});
              // Still try to open with empty body or just subject
              window.location.href = `mailto:${targetEmail}?subject=${subject}`;
          } else {
              window.location.href = mailtoLink;
              setToast({msg: "Opening Email Client...", type: 'success'});
          }
      } else {
          const targetUrl = selectedJob?.applyUrl || selectedJob?.url;
          if (targetUrl) window.open(targetUrl, '_blank');
          else setToast({msg: "No URL found. Check job details.", type: 'error'});
      }

      if (!isApplied && selectedJob) {
        saveApplication(selectedJob, content, mode);
        setIsApplied(true);
      }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="h-screen flex flex-col bg-dark-bg relative">
      {/* Toast Notification */}
      {toast && (
          <div className={`absolute top-20 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-full shadow-xl font-bold text-sm animate-in fade-in slide-in-from-top-4 ${toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-brand-600 text-white'}`}>
              {toast.msg}
          </div>
      )}

      {/* JOB DOSSIER */}
      <div className="bg-dark-card border-b border-dark-border px-8 py-4 flex justify-between items-center shadow-md z-10">
         <div>
             {selectedJob ? (
                 <div>
                     <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        {selectedJob.title}
                        <span className="text-xs font-normal text-slate-400 px-2 py-0.5 bg-slate-800 rounded border border-slate-700">{selectedJob.company}</span>
                     </h2>
                     <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                         <span className="flex items-center gap-1"><Globe size={12}/> {selectedJob.location}</span>
                         <span className="flex items-center gap-1"><Bot size={12}/> Mode: <span className={mode === 'Email' ? "text-orange-400 font-bold" : "text-blue-400 font-bold"}>{mode}</span></span>
                     </div>
                 </div>
             ) : (
                 <h2 className="text-lg font-bold text-slate-500">No Active Job Selected</h2>
             )}
         </div>
         
         <div className="flex items-center gap-2">
            <button onClick={handleAutoRoute} className="flex items-center gap-1 px-3 py-1.5 bg-purple-900/20 border border-purple-500/50 text-purple-300 text-xs rounded-md mr-2 hover:bg-purple-900/30 transition-colors">
                {isBrainWorking ? <Loader2 className="animate-spin" size={12}/> : <BrainCircuit size={12}/>} Auto-Detect Persona
            </button>
            {Object.values(PersonaType).map((p) => (
                <button
                    key={p}
                    onClick={() => setPersona(p)}
                    className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-md transition-all ${
                        persona === p 
                        ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/20' 
                        : 'text-slate-400 bg-slate-900 border border-slate-800 hover:text-white'
                    }`}
                >
                    {p.split(' ')[0]}
                </button>
            ))}
         </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 overflow-hidden">
        {/* STRATEGY INPUT */}
        <div className="p-8 border-r border-dark-border flex flex-col overflow-hidden bg-dark-bg">
            <div className="bg-dark-card border border-dark-border rounded-xl p-4 flex-1 flex flex-col shadow-sm relative mb-4">
                <div className="absolute top-4 right-4 opacity-10 pointer-events-none"><FileText size={64}/></div>
                <textarea
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    placeholder="Paste JD here..."
                    className="flex-1 w-full bg-slate-900/50 border border-slate-800 rounded-lg p-4 text-sm text-slate-300 focus:outline-none focus:border-brand-500 resize-none font-mono leading-relaxed"
                />
                <div className="mt-4 flex gap-2">
                    <button
                        onClick={handleATSCheck}
                        disabled={isCheckingATS || !jobDescription}
                        className="bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 px-4 rounded-lg font-bold flex justify-center items-center gap-2 transition-all"
                    >
                        {isCheckingATS ? <Loader2 className="animate-spin" size={18}/> : <ScanSearch size={18}/>} ATS Check
                    </button>
                    <button
                        onClick={handleGenerate}
                        disabled={isGenerating || !jobDescription}
                        className="flex-1 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white py-3 rounded-lg font-bold tracking-wide shadow-lg flex justify-center items-center gap-2 transition-all"
                    >
                        {isGenerating ? <span className="animate-pulse">Crafting Strategy...</span> : <><Sparkles size={18}/> GENERATE MATERIALS</>}
                    </button>
                </div>
            </div>

            {/* ATS RESULTS */}
            {atsResult && (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 animate-in slide-in-from-bottom-4">
                    <div className="flex items-center justify-between mb-3">
                        <h4 className="text-white font-bold text-sm flex items-center gap-2"><ScanSearch size={16}/> ATS Gap Analysis</h4>
                        <div className={`text-xl font-bold ${atsResult.matchScore > 75 ? 'text-green-400' : atsResult.matchScore > 50 ? 'text-orange-400' : 'text-red-400'}`}>
                            {atsResult.matchScore}% Match
                        </div>
                    </div>
                    <p className="text-xs text-slate-400 mb-3">{atsResult.summary}</p>
                    
                    {atsResult.missingKeywords.length > 0 && (
                        <div>
                            <div className="text-[10px] text-red-400 uppercase font-bold mb-2">Missing Keywords (Click to Fix)</div>
                            <div className="flex flex-wrap gap-2 mb-3">
                                {atsResult.missingKeywords.map((kw, i) => (
                                    <button 
                                        key={i} 
                                        onClick={() => handleFixATS(kw)}
                                        disabled={fixingKeyword !== null}
                                        className="group flex items-center gap-1 px-2 py-1 bg-red-900/20 text-red-300 border border-red-900/30 rounded text-[10px] hover:bg-red-900/40 hover:border-red-500/50 transition-colors"
                                    >
                                        {kw}
                                        {fixingKeyword === kw ? <Loader2 size={10} className="animate-spin"/> : <Hammer size={10} className="opacity-0 group-hover:opacity-100"/>}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                    
                    {generatedBullet && (
                        <div className="bg-brand-900/20 border border-brand-500/30 rounded p-3 animate-in fade-in">
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-[10px] font-bold text-brand-400">GENERATED BULLET POINT</span>
                                <button onClick={() => copyToClipboard(generatedBullet, 'bullet')} className="text-brand-400 hover:text-white"><Copy size={12}/></button>
                            </div>
                            <p className="text-xs text-slate-300 font-mono">{generatedBullet}</p>
                            {copied === 'bullet' && <span className="text-[10px] text-green-500 flex items-center gap-1 mt-1"><Check size={10}/> Copied</span>}
                        </div>
                    )}
                </div>
            )}
        </div>

        {/* OUTPUT */}
        <div className="p-8 flex flex-col overflow-y-auto bg-[#0B1221]">
            {!content && !isGenerating && (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-slate-800 rounded-xl bg-slate-900/10">
                    <Bot size={48} className="opacity-20 mb-4"/>
                    <p className="font-medium">Ready to draft content</p>
                </div>
            )}
            
            {content && content.fitScore && content.fitScore > 0 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                    {/* Refinement Bar */}
                    <div className="flex gap-2 overflow-x-auto pb-2">
                         <button disabled={isRefining} onClick={() => handleRefine("Make it shorter and punchier")} className="whitespace-nowrap px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-full text-xs text-slate-300 hover:border-brand-500 transition-colors flex items-center gap-1"><Wand2 size={12}/> Shorter</button>
                         <button disabled={isRefining} onClick={() => handleRefine("Make it more formal and corporate")} className="whitespace-nowrap px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-full text-xs text-slate-300 hover:border-brand-500 transition-colors">More Formal</button>
                         <button disabled={isRefining} onClick={() => handleRefine("Emphasize my Leadership experience")} className="whitespace-nowrap px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-full text-xs text-slate-300 hover:border-brand-500 transition-colors">Focus: Leadership</button>
                         {isRefining && <span className="text-xs text-brand-500 animate-pulse flex items-center ml-2">Refining...</span>}
                    </div>

                    {/* Action Card */}
                    <div className="bg-gradient-to-r from-brand-900/40 to-slate-900 border border-brand-500/30 p-5 rounded-xl shadow-lg">
                         {mode === 'Email' && (
                             <div className="mb-4">
                                 <label className="text-xs text-brand-300 uppercase font-bold mb-1 block">Target Recruiter Email</label>
                                 <input 
                                    type="text" 
                                    value={recruiterEmail}
                                    onChange={(e) => setRecruiterEmail(e.target.value)}
                                    placeholder="recruiter@company.com (Edit if needed)"
                                    className="w-full bg-slate-950/50 border border-brand-500/20 rounded px-3 py-2 text-white text-sm focus:border-brand-500 outline-none"
                                 />
                             </div>
                         )}
                         
                         <div className="flex justify-between items-center">
                             <div>
                                 <h4 className="font-bold text-white text-lg">Ready to Launch</h4>
                                 <p className="text-xs text-brand-200">Fit Score: {content.fitScore}/100</p>
                             </div>
                             <button onClick={executeApplication} className={`px-6 py-3 rounded-lg font-bold text-white shadow-lg flex items-center gap-2 transition-transform active:scale-95 ${isApplied ? 'bg-green-600' : 'bg-brand-600 hover:bg-brand-500'}`}>
                                 {isApplied ? <CheckCircle size={18}/> : (mode === 'Email' ? <Mail size={18}/> : <Globe size={18}/>)}
                                 {isApplied ? 'Applied' : (mode === 'Email' ? 'Launch Email Client' : 'Open Portal')}
                             </button>
                         </div>
                    </div>

                    {/* Subject Line (Email Mode Only) */}
                    {mode === 'Email' && content.emailSubject && (
                        <div className="bg-dark-card border border-dark-border rounded-xl overflow-hidden group">
                            <div className="bg-slate-900 px-4 py-2 border-b border-dark-border flex justify-between items-center">
                                <span className="text-xs font-bold text-slate-500 uppercase">Subject Line</span>
                                <button onClick={() => copyToClipboard(content.emailSubject!, 'subj')} className="text-brand-500 opacity-50 group-hover:opacity-100 transition-opacity">
                                    {copied === 'subj' ? <Check size={14}/> : <Copy size={14}/>}
                                </button>
                            </div>
                            <div className="p-4 text-sm text-white font-medium">{content.emailSubject}</div>
                        </div>
                    )}

                    {/* Main Content */}
                    <div className="bg-dark-card border border-dark-border rounded-xl overflow-hidden group flex-1">
                        <div className="bg-slate-900 px-4 py-2 border-b border-dark-border flex justify-between items-center">
                             <span className="text-xs font-bold text-slate-500 uppercase">
                                 {mode === 'Email' ? 'Email Body' : 'Cover Letter'}
                             </span>
                             <button onClick={() => copyToClipboard(mode === 'Email' ? content.emailDraft! : content.coverLetter!, 'body')} className="text-brand-500 opacity-50 group-hover:opacity-100 transition-opacity">
                                 {copied === 'body' ? <Check size={14}/> : <Copy size={14}/>}
                             </button>
                        </div>
                        <div className="p-6 text-sm text-slate-300 whitespace-pre-wrap font-mono leading-loose selection:bg-brand-500/30">
                            {mode === 'Email' ? content.emailDraft : content.coverLetter}
                        </div>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default ApplicationBot;
