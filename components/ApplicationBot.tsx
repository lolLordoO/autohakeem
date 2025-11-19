
import React, { useState, useEffect } from 'react';
import { Bot, FileText, Linkedin, Mail, Copy, Check, Sparkles, Trash2, CheckCircle, ExternalLink, Save, ArrowRight, Globe, Wand2, Eraser, AlignLeft, RefreshCw, AlertCircle, BrainCircuit, Loader2 } from 'lucide-react';
import { PersonaType, GeneratedContent, JobOpportunity } from '../types';
import { generateApplicationMaterials, refineContent, recommendPersona } from '../services/geminiService';
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
  const [content, setContent] = useState<GeneratedContent | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [isApplied, setIsApplied] = useState(false);
  const [recruiterEmail, setRecruiterEmail] = useState('');
  
  const mode = selectedJob?.applyEmail ? 'Email' : 'Portal';

  useEffect(() => {
    if (selectedJob) {
        const desc = selectedJob.description 
            ? `Title: ${selectedJob.title}\nCompany: ${selectedJob.company}\nLocation: ${selectedJob.location}\n\n${selectedJob.description}`
            : `Title: ${selectedJob.title}\nCompany: ${selectedJob.company}`;
        setJobDescription(desc);
        setRecruiterEmail(selectedJob.applyEmail || '');
        setContent(null);
        setIsApplied(false);
    }
  }, [selectedJob]);

  const handleAutoRoute = async () => {
      if (!jobDescription) return;
      setIsBrainWorking(true);
      try {
          const rec = await recommendPersona(jobDescription);
          setPersona(rec);
      } catch(e) { console.error(e); } 
      finally { setIsBrainWorking(false); }
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
          const subject = encodeURIComponent(content.emailSubject || `Application: ${selectedJob?.title}`);
          const body = encodeURIComponent(content.emailDraft || '');
          window.location.href = `mailto:${recruiterEmail}?subject=${subject}&body=${body}`;
      } else {
          const targetUrl = selectedJob?.applyUrl || selectedJob?.url;
          if (targetUrl) window.open(targetUrl, '_blank');
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
    <div className="h-screen flex flex-col bg-dark-bg">
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
                         <span className="flex items-center gap-1"><Bot size={12}/> Mode: <span className={mode === 'Email' ? "text-orange-400" : "text-blue-400"}>{mode}</span></span>
                     </div>
                 </div>
             ) : (
                 <h2 className="text-lg font-bold text-slate-500">No Active Job Selected</h2>
             )}
         </div>
         
         <div className="flex items-center gap-2">
            <button onClick={handleAutoRoute} className="flex items-center gap-1 px-3 py-1.5 bg-purple-900/20 border border-purple-500/50 text-purple-300 text-xs rounded-md mr-2">
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
        {/* STRATEGY */}
        <div className="p-8 border-r border-dark-border flex flex-col overflow-hidden bg-dark-bg">
            <div className="bg-dark-card border border-dark-border rounded-xl p-4 flex-1 flex flex-col shadow-sm">
                <textarea
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    placeholder="Paste JD here..."
                    className="flex-1 w-full bg-slate-900/50 border border-slate-800 rounded-lg p-4 text-sm text-slate-300 focus:outline-none focus:border-brand-500 resize-none font-mono leading-relaxed"
                />
                <button
                    onClick={handleGenerate}
                    disabled={isGenerating || !jobDescription}
                    className="mt-4 w-full bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white py-3 rounded-lg font-bold tracking-wide shadow-lg flex justify-center items-center gap-2"
                >
                    {isGenerating ? <span className="animate-pulse">Generating...</span> : <><Sparkles size={18}/> GENERATE PACKAGE</>}
                </button>
            </div>
        </div>

        {/* OUTPUT */}
        <div className="p-8 flex flex-col overflow-y-auto bg-[#0B1221]">
            {!content && !isGenerating && (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-slate-800 rounded-xl bg-slate-900/10">
                    <Bot size={48} className="opacity-20 mb-4"/>
                    <p className="font-medium">Awaiting Strategy Input</p>
                </div>
            )}
            
            {content && content.fitScore > 0 && (
                <div className="space-y-6">
                    {/* Refinement Bar */}
                    <div className="flex gap-2 overflow-x-auto pb-2">
                         <button disabled={isRefining} onClick={() => handleRefine("Make it shorter")} className="whitespace-nowrap px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-full text-xs text-slate-300 hover:border-brand-500 transition-colors flex items-center gap-1"><Wand2 size={12}/> Shorter</button>
                         <button disabled={isRefining} onClick={() => handleRefine("Make it more formal")} className="whitespace-nowrap px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-full text-xs text-slate-300 hover:border-brand-500 transition-colors">More Formal</button>
                         {isRefining && <span className="text-xs text-brand-500 animate-pulse flex items-center">Refining...</span>}
                    </div>

                    {/* Action Card */}
                    <div className="bg-gradient-to-r from-brand-900/40 to-slate-900 border border-brand-500/30 p-5 rounded-xl shadow-lg">
                         <div className="flex justify-between items-center">
                             <div>
                                 <h4 className="font-bold text-white text-lg">Ready</h4>
                                 <p className="text-xs text-brand-200">Fit Score: {content.fitScore}/100</p>
                             </div>
                             <button onClick={executeApplication} className={`px-6 py-3 rounded-lg font-bold text-white shadow-lg flex items-center gap-2 ${isApplied ? 'bg-green-600' : 'bg-brand-600'}`}>
                                 {isApplied ? <CheckCircle size={18}/> : (mode === 'Email' ? <Mail size={18}/> : <Globe size={18}/>)}
                                 {isApplied ? 'Applied' : (mode === 'Email' ? 'Launch Email' : 'Open Portal')}
                             </button>
                         </div>
                    </div>

                    {/* Content */}
                    <div className="bg-dark-card border border-dark-border rounded-xl overflow-hidden group flex-1">
                        <div className="bg-slate-900 px-4 py-2 border-b border-dark-border flex justify-between items-center">
                             <span className="text-xs font-bold text-slate-500 uppercase">
                                 {mode === 'Email' ? 'Email Body' : 'Cover Letter'}
                             </span>
                             <button onClick={() => copyToClipboard(mode === 'Email' ? content.emailDraft! : content.coverLetter!, 'body')} className="text-brand-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                 {copied === 'body' ? <Check size={14}/> : <Copy size={14}/>}
                             </button>
                        </div>
                        <div className="p-6 text-sm text-slate-300 whitespace-pre-wrap font-mono leading-loose">
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
