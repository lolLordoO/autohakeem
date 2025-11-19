
import React, { useState, useEffect } from 'react';
import { Bot, FileText, Linkedin, Mail, Copy, Check, Sparkles, Trash2, CheckCircle, ExternalLink, Save, ArrowRight, Globe } from 'lucide-react';
import { PersonaType, GeneratedContent, JobOpportunity } from '../types';
import { generateApplicationMaterials } from '../services/geminiService';
import { saveApplication } from '../services/storageService';

interface ApplicationBotProps {
  selectedJob: JobOpportunity | null;
}

const ApplicationBot: React.FC<ApplicationBotProps> = ({ selectedJob }) => {
  const [jobDescription, setJobDescription] = useState('');
  const [persona, setPersona] = useState<PersonaType>(PersonaType.MARKETING);
  const [isGenerating, setIsGenerating] = useState(false);
  const [content, setContent] = useState<GeneratedContent | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [isApplied, setIsApplied] = useState(false);
  const [recruiterEmail, setRecruiterEmail] = useState('');
  
  // Determine Mode
  const hasDirectEmail = !!selectedJob?.applyEmail;
  const hasApplyUrl = !!selectedJob?.applyUrl || !!selectedJob?.url;
  const mode = hasDirectEmail ? 'Email' : 'Portal';

  useEffect(() => {
    if (selectedJob) {
        const desc = selectedJob.description 
            ? `Title: ${selectedJob.title}\nCompany: ${selectedJob.company}\n\n${selectedJob.description}`
            : `Title: ${selectedJob.title}\nCompany: ${selectedJob.company}`;
        
        setJobDescription(desc);
        setRecruiterEmail(selectedJob.applyEmail || '');
        setContent(null);
        setIsApplied(false);
    }
  }, [selectedJob]);

  const handleGenerate = async () => {
    if (!jobDescription) return;
    setIsGenerating(true);
    setIsApplied(false);
    try {
      const result = await generateApplicationMaterials(jobDescription, persona);
      setContent(result);
    } catch (error) {
      console.error(error);
      alert("Failed to generate content. Check API Key.");
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleClear = () => {
      setJobDescription('');
      setContent(null);
      setIsApplied(false);
  }

  const executeApplication = () => {
      if (!content) return;
      
      if (mode === 'Email') {
          const subject = encodeURIComponent(content.emailSubject || `Application: ${selectedJob?.title}`);
          const body = encodeURIComponent(content.emailDraft || '');
          const mailtoLink = `mailto:${recruiterEmail}?subject=${subject}&body=${body}`;
          window.location.href = mailtoLink;
      } else {
          // Portal Mode
          const targetUrl = selectedJob?.applyUrl || selectedJob?.url;
          if (targetUrl) window.open(targetUrl, '_blank');
      }
      
      handleSaveToTracker();
  };

  const handleSaveToTracker = () => {
      if (!selectedJob || !content) return;
      saveApplication(selectedJob, content, mode);
      setIsApplied(true);
  };

  return (
    <div className="p-8 h-screen flex flex-col">
      <header className="mb-6 flex justify-between items-center">
        <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Bot className="text-brand-500"/> Auto-Apply Assistant
            </h2>
            <p className="text-sm text-slate-400 mt-1">Detected Mode: <span className="text-brand-400 font-bold uppercase">{mode} Application</span></p>
        </div>
        
        <div className="flex items-center gap-2 bg-slate-800 p-1 rounded-lg">
            {Object.values(PersonaType).map((p) => (
                <button
                    key={p}
                    onClick={() => setPersona(p)}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                        persona === p 
                        ? 'bg-brand-600 text-white shadow-lg' 
                        : 'text-slate-400 hover:text-white'
                    }`}
                >
                    {p.split(' ')[0]}
                </button>
            ))}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 overflow-hidden">
        {/* Input Section */}
        <div className="flex flex-col h-full space-y-4">
            <div className="bg-dark-card border border-dark-border rounded-xl p-4 flex-1 flex flex-col">
                <div className="flex justify-between items-center mb-2">
                    <label className="text-sm text-slate-400 font-medium">Job Details</label>
                    <button onClick={handleClear} className="text-slate-500 hover:text-red-400 flex items-center gap-1 text-xs">
                        <Trash2 size={12}/> Clear
                    </button>
                </div>
                <textarea
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    placeholder="Paste the Job Description here..."
                    className="flex-1 w-full bg-slate-900/50 border border-slate-800 rounded-lg p-4 text-sm text-slate-300 focus:outline-none focus:border-brand-500 resize-none font-mono leading-relaxed"
                />
                
                {mode === 'Email' && (
                     <div className="mt-4">
                        <label className="text-xs text-slate-500 mb-1 block">Recruiter Email</label>
                        <input 
                            type="email" 
                            value={recruiterEmail} 
                            onChange={(e) => setRecruiterEmail(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white"
                            placeholder="recruiter@company.com"
                        />
                     </div>
                )}

                <button
                    onClick={handleGenerate}
                    disabled={isGenerating || !jobDescription}
                    className="mt-4 w-full bg-brand-600 hover:bg-brand-500 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-lg font-semibold shadow-lg shadow-brand-500/20 flex justify-center items-center gap-2 transition-all"
                >
                    {isGenerating ? (
                        <><span className="animate-pulse">Generating Assets...</span></>
                    ) : (
                        <><Sparkles size={18}/> Generate Application Package</>
                    )}
                </button>
            </div>
        </div>

        {/* Output Section */}
        <div className="flex flex-col h-full overflow-y-auto space-y-4 pr-2 pb-10">
            {!content && !isGenerating && (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 border border-dashed border-slate-800 rounded-xl bg-slate-900/20">
                    <FileText size={48} className="opacity-20 mb-4"/>
                    <p>Ready to draft application.</p>
                </div>
            )}

            {content && (
                <>
                    {/* Execution Card */}
                    <div className="bg-brand-900/20 border border-brand-500/50 p-5 rounded-xl">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="font-bold text-white text-lg">Ready to Apply</h3>
                                <p className="text-sm text-slate-400">
                                    {mode === 'Email' 
                                        ? `Send via Email to ${recruiterEmail || 'Recruiter'}` 
                                        : `Submit via ${selectedJob?.source || 'Portal'}`
                                    }
                                </p>
                            </div>
                            <div className="text-2xl font-bold text-brand-500">{content.fitScore}% Fit</div>
                        </div>
                        
                        <button 
                            onClick={executeApplication}
                            className="w-full py-4 bg-brand-600 hover:bg-brand-500 text-white rounded-lg font-bold text-lg shadow-xl shadow-brand-500/20 flex items-center justify-center gap-3 transition-transform active:scale-95"
                        >
                            {mode === 'Email' ? <Mail size={24}/> : <Globe size={24}/>}
                            {mode === 'Email' ? 'Launch Email Client' : 'Open Application Portal'}
                            <ArrowRight size={20} className="opacity-70"/>
                        </button>
                        
                        {isApplied && (
                            <div className="mt-3 text-center text-green-400 text-sm flex items-center justify-center gap-2">
                                <CheckCircle size={14}/> Marked as Applied in Tracker
                            </div>
                        )}
                    </div>

                    {/* Content Blocks */}
                    {content.emailSubject && (
                        <div className="bg-dark-card border border-dark-border rounded-xl overflow-hidden">
                             <div className="bg-slate-800/50 px-4 py-2 border-b border-slate-700 flex justify-between">
                                <span className="text-xs font-bold text-slate-400 uppercase">Subject Line</span>
                                <button onClick={() => copyToClipboard(content.emailSubject!, 'sub')} className="text-brand-400 hover:text-white">
                                    {copied === 'sub' ? <Check size={14}/> : <Copy size={14}/>}
                                </button>
                             </div>
                             <div className="p-3 text-sm font-medium text-white">{content.emailSubject}</div>
                        </div>
                    )}

                    <div className="bg-dark-card border border-dark-border rounded-xl overflow-hidden flex-1">
                        <div className="bg-slate-800/50 px-4 py-2 border-b border-slate-700 flex justify-between">
                            <span className="text-xs font-bold text-slate-400 uppercase">
                                {mode === 'Email' ? 'Email Body' : 'Cover Letter / Questions'}
                            </span>
                            <button onClick={() => copyToClipboard(mode === 'Email' ? content.emailDraft! : content.coverLetter!, 'body')} className="text-brand-400 hover:text-white">
                                {copied === 'body' ? <Check size={14}/> : <Copy size={14}/>}
                            </button>
                        </div>
                        <div className="p-4 text-sm text-slate-300 whitespace-pre-wrap font-mono leading-relaxed">
                            {mode === 'Email' ? content.emailDraft : content.coverLetter}
                        </div>
                    </div>
                </>
            )}
        </div>
      </div>
    </div>
  );
};

export default ApplicationBot;
