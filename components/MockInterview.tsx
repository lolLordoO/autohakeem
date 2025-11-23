
import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Mic, Play, Send, Bot, User, AlertCircle, Loader2, StopCircle, RefreshCw, Briefcase } from 'lucide-react';
import { JobOpportunity, ChatMessage } from '../types';
import { getApplications } from '../services/storageService';
import { getInterviewQuestion, critiqueAnswer } from '../services/geminiService';

const MockInterview: React.FC = () => {
    const [selectedJobId, setSelectedJobId] = useState('');
    const [apps, setApps] = useState<any[]>([]);
    const [chat, setChat] = useState<ChatMessage[]>([]);
    const [userInput, setUserInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setApps(getApplications());
    }, []);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
        }
    }, [chat, isLoading]);

    const startInterview = async () => {
        if (!selectedJobId) return;
        const job = apps.find(a => a.id === selectedJobId);
        if (!job) return;

        setIsLoading(true);
        setChat([]);
        try {
            const q = await getInterviewQuestion(job.title, job.company, []);
            setChat([{ role: 'ai', text: q, timestamp: new Date().toISOString() }]);
        } catch(e) { console.error(e); }
        finally { setIsLoading(false); }
    }

    const endSession = () => {
        setChat([]);
        setSelectedJobId('');
        setUserInput('');
    }

    const handleSend = async () => {
        if (!userInput.trim() || !selectedJobId) return;
        const job = apps.find(a => a.id === selectedJobId);
        if (!job) return;

        const userMsg: ChatMessage = { role: 'user', text: userInput, timestamp: new Date().toISOString() };
        setChat(prev => [...prev, userMsg]);
        setUserInput('');
        setIsLoading(true);

        try {
            // Get critique for this answer
            const lastAiMsg = chat[chat.length - 1];
            const critique = await critiqueAnswer(lastAiMsg.text, userMsg.text);
            
            // Get next question
            const nextQ = await getInterviewQuestion(job.title, job.company, [...chat, userMsg]);
            
            // Update user message with critique
            setChat(prev => {
                const updated = [...prev];
                updated[updated.length - 1].critique = critique;
                return [...updated, { role: 'ai', text: nextQ, timestamp: new Date().toISOString() }];
            });

        } catch(e) { console.error(e); }
        finally { setIsLoading(false); }
    }

    return (
        <div className="p-4 lg:p-8 h-screen flex flex-col bg-dark-bg">
            <header className="flex justify-between items-center mb-6 shrink-0">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Mic className="text-red-500"/> Interview Dojo
                    </h2>
                    <p className="text-slate-500 text-sm">AI-Powered behavioral & technical simulation.</p>
                </div>
                {chat.length > 0 && (
                    <button onClick={endSession} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors">
                        <StopCircle size={16}/> End Session
                    </button>
                )}
            </header>

            {chat.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center">
                    <div className="bg-dark-card border border-dark-border p-8 rounded-2xl w-full max-w-lg shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-purple-600"></div>
                        <div className="mb-6 flex justify-center">
                            <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center">
                                <Bot size={32} className="text-slate-400 group-hover:text-white transition-colors"/>
                            </div>
                        </div>
                        
                        <h3 className="text-xl font-bold text-white text-center mb-2">Ready to Practice?</h3>
                        <p className="text-slate-400 text-center text-sm mb-6">Select an active application. The AI will adopt the persona of the hiring manager.</p>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs text-slate-500 font-bold uppercase mb-2 block">Select Application</label>
                                <div className="relative">
                                    <select 
                                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 pl-10 text-white appearance-none focus:border-brand-500 outline-none transition-colors"
                                        value={selectedJobId}
                                        onChange={(e) => setSelectedJobId(e.target.value)}
                                    >
                                        <option value="">-- Choose Target Role --</option>
                                        {apps.map(a => <option key={a.id} value={a.id}>{a.title} at {a.company}</option>)}
                                    </select>
                                    <Briefcase size={16} className="absolute left-3 top-3.5 text-slate-500 pointer-events-none"/>
                                </div>
                            </div>

                            <button 
                                onClick={startInterview} 
                                disabled={!selectedJobId || isLoading}
                                className="w-full bg-brand-600 hover:bg-brand-500 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3.5 rounded-lg font-bold flex justify-center items-center gap-2 transition-all shadow-lg shadow-brand-500/20"
                            >
                                {isLoading ? <Loader2 className="animate-spin"/> : <Play size={18}/>} 
                                Start Simulation
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex-1 bg-dark-card border border-dark-border rounded-xl flex flex-col overflow-hidden shadow-inner relative">
                    {/* Chat Area */}
                    <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6 custom-scrollbar scroll-smooth" ref={scrollRef}>
                        {chat.map((msg, i) => (
                            <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-2`}>
                                <div className="flex items-center gap-2 mb-1 px-1">
                                    {msg.role === 'ai' 
                                        ? <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1"><Bot size={10}/> Recruiter</span>
                                        : <span className="text-[10px] font-bold text-brand-400 uppercase flex items-center gap-1">You <User size={10}/></span>
                                    }
                                </div>
                                
                                <div className={`max-w-[85%] lg:max-w-[70%] p-4 rounded-2xl shadow-sm text-sm leading-relaxed whitespace-pre-wrap ${
                                    msg.role === 'user' 
                                    ? 'bg-brand-600 text-white rounded-tr-none' 
                                    : 'bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700'
                                }`}>
                                    {msg.text}
                                </div>

                                {msg.critique && (
                                    <div className="mt-2 max-w-[85%] lg:max-w-[70%] bg-slate-900 border border-orange-500/20 rounded-xl p-3 flex gap-3 animate-in fade-in">
                                        <div className="shrink-0 mt-0.5">
                                            <AlertCircle size={14} className="text-orange-400"/>
                                        </div>
                                        <div>
                                            <div className="text-[10px] font-bold text-orange-400 uppercase mb-1">Coach's Feedback</div>
                                            <p className="text-xs text-slate-400 leading-relaxed">{msg.critique}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                        
                        {isLoading && (
                            <div className="flex items-start animate-pulse">
                                <div className="bg-slate-800/50 p-4 rounded-2xl rounded-tl-none flex items-center gap-3">
                                    <div className="flex gap-1">
                                        <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce"></span>
                                        <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce delay-75"></span>
                                        <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce delay-150"></span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Input Area */}
                    <div className="p-4 bg-slate-900/80 backdrop-blur border-t border-dark-border">
                        <div className="flex gap-2 max-w-4xl mx-auto">
                            <input 
                                className="flex-1 bg-dark-bg border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-brand-500 outline-none text-sm transition-colors shadow-inner"
                                placeholder="Type your answer professionally..."
                                value={userInput}
                                onChange={(e) => setUserInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                disabled={isLoading}
                                autoFocus
                            />
                            <button 
                                onClick={handleSend} 
                                disabled={isLoading || !userInput.trim()} 
                                className="bg-brand-600 hover:bg-brand-500 disabled:opacity-50 disabled:cursor-not-allowed text-white p-3 rounded-xl transition-all shadow-lg shadow-brand-500/20 active:scale-95"
                            >
                                <Send size={20}/>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MockInterview;
