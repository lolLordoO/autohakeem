
import React, { useEffect, useState } from 'react';
import { Activity, Target, FileText, Send, TrendingUp, Clock, CheckSquare, Settings, RotateCcw, CalendarDays, ExternalLink, Trophy, Flame } from 'lucide-react';
import { USER_PROFILE } from '../constants';
import { getStats, getVisaDetails, saveVisaDetails, getDailyGoals } from '../services/storageService';
import { VisaDetails, DailyGoals } from '../types';

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState({ total: 0, interviewing: 0, applied: 0, rejected: 0, offers: 0 });
  const [visa, setVisa] = useState<VisaDetails>(getVisaDetails());
  const [showVisaSettings, setShowVisaSettings] = useState(false);
  const [goals, setGoals] = useState<DailyGoals>({ date: '', applicationsSent: 0, recruitersContacted: 0, streak: 0 });

  useEffect(() => {
    setStats(getStats());
    setGoals(getDailyGoals());
    
    // Listen for goal updates
    const handleGoalUpdate = () => setGoals(getDailyGoals());
    window.addEventListener('goals-updated', handleGoalUpdate);
    return () => window.removeEventListener('goals-updated', handleGoalUpdate);
  }, []);

  const handleVisaUpdate = (key: keyof VisaDetails['documentsReady']) => {
      const updated = { ...visa, documentsReady: { ...visa.documentsReady, [key]: !visa.documentsReady[key] }};
      setVisa(updated);
      saveVisaDetails(updated);
  }

  const resetVisaTimer = () => {
      const updated = { ...visa, entryDate: new Date().toISOString().split('T')[0] };
      setVisa(updated);
      saveVisaDetails(updated);
      setShowVisaSettings(false);
  }

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const updated = { ...visa, entryDate: e.target.value };
      setVisa(updated);
      saveVisaDetails(updated);
  }

  const daysRemaining = () => {
      const entry = new Date(visa.entryDate);
      const deadline = new Date(entry.setDate(entry.getDate() + visa.visaDurationDays));
      const diff = deadline.getTime() - new Date().getTime();
      return Math.ceil(diff / (1000 * 3600 * 24));
  }

  const daysLeft = daysRemaining();
  const visaColor = daysLeft > 30 ? 'text-emerald-400' : daysLeft > 15 ? 'text-orange-400' : 'text-red-500';
  const progressColor = daysLeft > 30 ? 'bg-emerald-500' : daysLeft > 15 ? 'bg-orange-500' : 'bg-red-500';

  return (
    <div className="p-8 space-y-8 overflow-y-auto h-screen pb-20">
      <header className="flex justify-between items-end border-b border-zinc-800 pb-6">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Mission Control</h2>
          <p className="text-zinc-500 mt-1 font-mono text-xs">SYSTEM STATUS: ONLINE</p>
        </div>
        <div className="flex items-center gap-4">
             <div className="bg-brand-900/20 px-4 py-2 rounded-lg border border-brand-500/30 flex items-center gap-2">
                 <Flame className="text-orange-500" size={18} fill="currentColor"/>
                 <div>
                     <div className="text-[10px] text-brand-300 font-bold uppercase">Daily Streak</div>
                     <div className="text-white font-bold">{goals.streak} Days</div>
                 </div>
             </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* VISA WIDGET */}
          <div className="lg:col-span-1 bg-dark-card border border-dark-border p-6 rounded-xl shadow-sm relative group">
              <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-2">
                      <div className="p-2 bg-zinc-800 rounded-lg text-brand-500">
                        <Clock size={20} />
                      </div>
                      <div>
                        <h3 className="font-bold text-white text-sm">Visa Timeline</h3>
                        <p className="text-[10px] text-zinc-500">Visit Visa (UAE)</p>
                      </div>
                  </div>
                  <button onClick={() => setShowVisaSettings(!showVisaSettings)} className="text-zinc-600 hover:text-white transition-colors">
                      <Settings size={16}/>
                  </button>
              </div>

              {showVisaSettings ? (
                  <div className="bg-zinc-900 rounded-lg p-4 mb-4 border border-zinc-800 space-y-3 animate-in fade-in slide-in-from-top-2">
                      <div>
                          <label className="text-xs text-zinc-500 block mb-1">Start Date</label>
                          <input 
                            type="date" 
                            value={visa.entryDate} 
                            onChange={handleDateChange}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-white focus:border-brand-500 outline-none"
                          />
                      </div>
                      <button 
                        onClick={resetVisaTimer}
                        className="w-full flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white text-xs py-2 rounded transition-colors"
                      >
                          <RotateCcw size={12}/> Reset to Today
                      </button>
                  </div>
              ) : (
                  <>
                    <div className="flex items-baseline gap-1 mb-4">
                        <span className={`text-4xl font-bold ${visaColor}`}>{daysLeft}</span>
                        <span className="text-zinc-500 text-sm">days remaining</span>
                    </div>
                    <div className="w-full bg-zinc-800 h-1.5 rounded-full mb-6 overflow-hidden">
                        <div className={`h-full ${progressColor} transition-all duration-1000 rounded-full`} style={{width: `${Math.max(0, Math.min(100, (daysLeft / visa.visaDurationDays) * 100))}%`}}></div>
                    </div>
                  </>
              )}
              
              <div className="space-y-3">
                  <h4 className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Readiness Checklist</h4>
                  {Object.entries(visa.documentsReady).map(([key, isReady]) => (
                      <div key={key} onClick={() => handleVisaUpdate(key as any)} className="flex items-center gap-3 cursor-pointer group/item">
                          <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${isReady ? 'bg-emerald-500 border-emerald-500' : 'border-zinc-700 group-hover/item:border-brand-500'}`}>
                              {isReady && <CheckSquare size={10} className="text-white"/>}
                          </div>
                          <span className={`text-xs font-medium ${isReady ? 'text-zinc-500 line-through' : 'text-zinc-300'}`}>
                              {key.replace(/([A-Z])/g, ' $1').trim()}
                          </span>
                      </div>
                  ))}
              </div>
          </div>

          {/* MAIN STATS */}
          <div className="lg:col-span-2 grid grid-cols-2 gap-4">
             {/* Daily Goals Widget */}
             <div className="col-span-2 bg-gradient-to-r from-slate-900 to-zinc-900 border border-zinc-800 p-6 rounded-xl flex items-center justify-between">
                 <div className="flex items-center gap-4">
                     <div className="p-3 bg-brand-600 rounded-full shadow-lg shadow-brand-500/30 text-white"><Trophy size={24}/></div>
                     <div>
                         <div className="text-white font-bold text-lg">Daily Goals</div>
                         <div className="text-xs text-slate-400">Keep the momentum going!</div>
                     </div>
                 </div>
                 <div className="flex gap-8">
                     <div className="text-center">
                         <div className="text-xs text-slate-500 mb-1 uppercase font-bold">Applications</div>
                         <div className="flex items-baseline gap-1 justify-center">
                             <span className={`text-2xl font-bold ${goals.applicationsSent >= 5 ? 'text-green-400' : 'text-white'}`}>{goals.applicationsSent}</span>
                             <span className="text-sm text-slate-600">/ 5</span>
                         </div>
                     </div>
                     <div className="text-center">
                         <div className="text-xs text-slate-500 mb-1 uppercase font-bold">Recruiters</div>
                         <div className="flex items-baseline gap-1 justify-center">
                             <span className={`text-2xl font-bold ${goals.recruitersContacted >= 5 ? 'text-green-400' : 'text-white'}`}>{goals.recruitersContacted}</span>
                             <span className="text-sm text-slate-600">/ 5</span>
                         </div>
                     </div>
                 </div>
             </div>

             <div className="bg-dark-card border border-dark-border p-6 rounded-xl flex flex-col justify-between hover:border-zinc-700 transition-colors">
                 <div className="flex justify-between items-start">
                     <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg"><FileText size={20}/></div>
                     <span className="text-zinc-500 text-[10px] uppercase font-bold">Total Apps</span>
                 </div>
                 <div className="mt-4">
                    <div className="text-3xl font-bold text-white">{stats.total}</div>
                    <div className="text-xs text-zinc-500 mt-1">Applications sent</div>
                 </div>
             </div>
             
             <div className="bg-dark-card border border-dark-border p-6 rounded-xl flex flex-col justify-between hover:border-zinc-700 transition-colors">
                 <div className="flex justify-between items-start">
                     <div className="p-2 bg-orange-500/10 text-orange-500 rounded-lg"><Send size={20}/></div>
                     <span className="text-zinc-500 text-[10px] uppercase font-bold">Active</span>
                 </div>
                 <div className="mt-4">
                    <div className="text-3xl font-bold text-white">{stats.interviewing}</div>
                    <div className="text-xs text-zinc-500 mt-1">In progress</div>
                 </div>
             </div>
          </div>
      </div>

      {/* Active Portfolios */}
      <div className="bg-dark-card border border-dark-border rounded-xl p-6">
        <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2 uppercase tracking-wider">
           <Activity size={16} className="text-brand-500"/> Live Portfolios
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(USER_PROFILE.websites).map(([key, url]) => (
                <a href={url} target="_blank" rel="noreferrer" key={key} className="block group">
                    <div className="p-4 rounded-lg border border-dark-border bg-zinc-900/50 hover:bg-zinc-900 hover:border-brand-500/50 transition-all">
                        <div className="flex items-center justify-between mb-2">
                            <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">{key.split(' ')[0]}</div>
                            <ExternalLink size={12} className="text-zinc-600 group-hover:text-brand-500"/>
                        </div>
                        <div className="text-xs text-zinc-300 truncate group-hover:text-white">{url.replace('https://', '')}</div>
                    </div>
                </a>
            ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
