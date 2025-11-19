import React, { useState, useEffect } from 'react';
import { Bot, FileText, Linkedin, Mail, Copy, Check, Sparkles, Trash2, CheckCircle } from 'lucide-react';
import { PersonaType, GeneratedContent, JobOpportunity } from '../types';
import { generateApplicationMaterials } from '../services/geminiService';

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

  useEffect(() => {
    if (selectedJob && selectedJob.description) {
        setJobDescription(`Title: ${selectedJob.title}\nCompany: ${selectedJob.company}\n\n${selectedJob.description}`);
        setContent(null);
        setIsApplied(false);
    } else if (selectedJob) {
        setJobDescription(`Title: ${selectedJob.title}\nCompany: ${selectedJob.company}`);
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

  return (
    <div className="p-8 h-screen flex flex-col">
      <header className="mb-6 flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Bot className="text-brand-500"/> Auto-Apply Bot
        </h2>
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
                    {p}
                </button>
            ))}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 overflow-hidden">
        {/* Input Section */}
        <div className="flex flex-col h-full space-y-4">
            <div className="bg-dark-card border border-dark-border rounded-xl p-4 flex-1 flex flex-col">
                <div className="flex justify-between items-center mb-2">
                    <label className="text-sm text-slate-400 font-medium">Job Description Source</label>
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
                <button
                    onClick={handleGenerate}
                    disabled={isGenerating || !jobDescription}
                    className="mt-4 w-full bg-brand-600 hover:bg-brand-500 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-lg font-semibold shadow-lg shadow-brand-500/20 flex justify-center items-center gap-2 transition-all"
                >
                    {isGenerating ? (
                        <><span className="animate-pulse">Analyzing fit & Generating assets...</span></>
                    ) : (
                        <><Sparkles size={18}/> Generate Application Package</>
                    )}
                </button>
            </div>
        </div>

        {/* Output Section */}
        <div className="flex flex-col h-full overflow-y-auto space-y-4 pr-2">
            {!content && !isGenerating && (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 border border-dashed border-slate-800 rounded-xl bg-slate-900/20">
                    <FileText size={48} className="opacity-20 mb-4"/>
                    <p>Ready to process application data.</p>
                </div>
            )}

            {content && (
                <>
                    {/* Action Bar */}
                    <div className="flex gap-3">
                        <button 
                            onClick={() => setIsApplied(!isApplied)}
                            className={`flex-1 py-2 rounded-lg border text-sm font-medium flex items-center justify-center gap-2 transition-all ${
                                isApplied 
                                ? 'bg-green-500/20 border-green-500 text-green-400' 
                                : 'border-slate-600 text-slate-300 hover:bg-slate-800'
                            }`}
                        >
                           {isApplied ? <><CheckCircle size={16}/> Applied</> : 'Mark as Applied'}
                        </button>
                    </div>

                    {/* Score Card */}
                    <div className="bg-gradient-to-r from-slate-900 to-slate-800 border border-slate-700 p-4 rounded-xl flex items-center justify-between">
                        <div>
                            <p className="text-xs text-slate-400 uppercase tracking-wider font-bold">Match Score</p>
                            <p className="text-xs text-slate-400 mt-1 max-w-xs">{content.reasoning}</p>
                        </div>
                        <div className="relative w-16 h-16 flex items-center justify-center">
                             <svg className="w-full h-full" viewBox="0 0 36 36">
                                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#1e293b" strokeWidth="3" />
                                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={content.fitScore! > 80 ? "#10b981" : "#f59e0b"} strokeWidth="3" strokeDasharray={`${content.fitScore}, 100`} />
                            </svg>
                            <span className="absolute text-sm font-bold text-white">{content.fitScore}%</span>
                        </div>
                    </div>

                    {/* Cover Letter */}
                    <div className="bg-dark-card border border-dark-border rounded-xl overflow-hidden">
                        <div className="bg-slate-800/50 px-4 py-2 border-b border-slate-700 flex justify-between items-center">
                            <div className="flex items-center gap-2 text-sm font-medium text-white">
                                <FileText size={16} className="text-blue-400"/> Cover Letter
                            </div>
                            <button onClick={() => copyToClipboard(content.coverLetter || '', 'cl')} className="text-slate-400 hover:text-white">
                                {copied === 'cl' ? <Check size={16}/> : <Copy size={16}/>}
                            </button>
                        </div>
                        <div className="p-4 text-sm text-slate-300 whitespace-pre-wrap font-sans leading-relaxed h-64 overflow-y-auto custom-scrollbar">
                            {content.coverLetter}
                        </div>
                    </div>

                    {/* Email Draft */}
                    <div className="bg-dark-card border border-dark-border rounded-xl overflow-hidden">
                        <div className="bg-slate-800/50 px-4 py-2 border-b border-slate-700 flex justify-between items-center">
                            <div className="flex items-center gap-2 text-sm font-medium text-white">
                                <Mail size={16} className="text-purple-400"/> Email to Recruiter
                            </div>
                            <button onClick={() => copyToClipboard(content.emailDraft || '', 'email')} className="text-slate-400 hover:text-white">
                                {copied === 'email' ? <Check size={16}/> : <Copy size={16}/>}
                            </button>
                        </div>
                        <div className="p-4 text-sm text-slate-300 whitespace-pre-wrap font-mono">
                            {content.emailDraft}
                        </div>
                    </div>

                    {/* LinkedIn Message */}
                    <div className="bg-dark-card border border-dark-border rounded-xl overflow-hidden">
                        <div className="bg-slate-800/50 px-4 py-2 border-b border-slate-700 flex justify-between items-center">
                            <div className="flex items-center gap-2 text-sm font-medium text-white">
                                <Linkedin size={16} className="text-blue-500"/> LinkedIn Connection Note
                            </div>
                            <button onClick={() => copyToClipboard(content.linkedinMessage || '', 'li')} className="text-slate-400 hover:text-white">
                                {copied === 'li' ? <Check size={16}/> : <Copy size={16}/>}
                            </button>
                        </div>
                        <div className="p-4 text-sm text-slate-300 whitespace-pre-wrap">
                            {content.linkedinMessage}
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