import React, { useEffect, useState } from 'react';
import { Activity, Target, FileText, Send, TrendingUp } from 'lucide-react';
import { USER_PROFILE } from '../constants';
import { getStats } from '../services/storageService';

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState({ total: 0, interviewing: 0, applied: 0, rejected: 0 });

  useEffect(() => {
    setStats(getStats());
  }, []);

  return (
    <div className="p-8 space-y-8">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-white">Welcome back, Abdul</h2>
          <p className="text-slate-400 mt-2">Your automated career agents are standing by.</p>
        </div>
        <div className="flex gap-4">
           <span className="px-3 py-1 rounded-full bg-blue-900/30 text-blue-400 text-xs font-mono border border-blue-800">
             LOC: {USER_PROFILE.location}
           </span>
           <span className="px-3 py-1 rounded-full bg-purple-900/30 text-purple-400 text-xs font-mono border border-purple-800">
             VISA: Visit
           </span>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-dark-card border border-dark-border p-6 rounded-xl">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-400 text-sm">Total Applications</p>
              <h3 className="text-2xl font-bold text-white mt-1">{stats.total}</h3>
            </div>
            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
              <Target size={20} />
            </div>
          </div>
          <p className="text-xs text-green-400 mt-4">Tracked in system</p>
        </div>

        <div className="bg-dark-card border border-dark-border p-6 rounded-xl">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-400 text-sm">Applied</p>
              <h3 className="text-2xl font-bold text-white mt-1">{stats.applied}</h3>
            </div>
            <div className="p-2 bg-purple-500/10 rounded-lg text-purple-500">
              <FileText size={20} />
            </div>
          </div>
           <p className="text-xs text-slate-500 mt-4">Pending response</p>
        </div>

        <div className="bg-dark-card border border-dark-border p-6 rounded-xl">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-400 text-sm">Interviewing</p>
              <h3 className="text-2xl font-bold text-white mt-1">{stats.interviewing}</h3>
            </div>
            <div className="p-2 bg-orange-500/10 rounded-lg text-orange-500">
              <Send size={20} />
            </div>
          </div>
          <p className="text-xs text-green-400 mt-4">Active conversations</p>
        </div>

        <div className="bg-dark-card border border-dark-border p-6 rounded-xl">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-400 text-sm">Profile Views</p>
              <h3 className="text-2xl font-bold text-white mt-1">150%</h3>
            </div>
            <div className="p-2 bg-green-500/10 rounded-lg text-green-500">
              <TrendingUp size={20} />
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-4">Based on historic data</p>
        </div>
      </div>

      {/* Active Portfolios */}
      <div className="bg-dark-card border border-dark-border rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
           <Activity size={18} className="text-brand-500"/> Active Portfolios
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(USER_PROFILE.websites).map(([key, url]) => (
                <a href={url} target="_blank" rel="noreferrer" key={key} className="block group">
                    <div className="p-4 rounded-lg border border-dark-border bg-slate-900/50 hover:border-brand-500/50 transition-colors">
                        <div className="text-xs font-mono text-slate-500 mb-1 uppercase">{key}</div>
                        <div className="text-sm text-brand-400 truncate group-hover:text-brand-300">{url}</div>
                    </div>
                </a>
            ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;