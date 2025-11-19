import React, { useState, useEffect } from 'react';
import { getApplications, updateApplicationStatus } from '../services/storageService';
import { ApplicationRecord } from '../types';
import { Calendar, MapPin, ExternalLink, Briefcase, Search } from 'lucide-react';

const ApplicationHistory: React.FC = () => {
  const [applications, setApplications] = useState<ApplicationRecord[]>([]);

  useEffect(() => {
    setApplications(getApplications());
  }, []);

  const handleStatusChange = (id: string, newStatus: any) => {
    updateApplicationStatus(id, newStatus);
    setApplications(getApplications()); // Refresh
  };

  return (
    <div className="p-8 h-screen flex flex-col">
      <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
        <Briefcase className="text-brand-500"/> Application Tracker
      </h2>

      <div className="flex-1 bg-dark-card border border-dark-border rounded-xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-dark-border bg-slate-900/50 grid grid-cols-12 gap-4 text-xs font-medium text-slate-400 uppercase tracking-wider">
            <div className="col-span-3">Role & Company</div>
            <div className="col-span-2">Location</div>
            <div className="col-span-2">Applied Date</div>
            <div className="col-span-2">Method</div>
            <div className="col-span-3">Status</div>
        </div>

        {/* List */}
        <div className="overflow-y-auto flex-1">
            {applications.length === 0 && (
                 <div className="flex flex-col items-center justify-center h-64 text-slate-500">
                    <Search size={32} className="mb-2 opacity-20"/>
                    <p>No applications tracked yet.</p>
                    <p className="text-xs">Use the Auto-Apply Bot to generate and save applications.</p>
                 </div>
            )}

            {applications.map((app) => (
                <div key={app.id} className="p-4 border-b border-dark-border grid grid-cols-12 gap-4 items-center hover:bg-slate-800/30 transition-colors">
                    <div className="col-span-3">
                        <div className="font-medium text-white truncate">{app.title}</div>
                        <div className="text-sm text-slate-400 truncate">{app.company}</div>
                    </div>
                    <div className="col-span-2 flex items-center gap-1 text-sm text-slate-400">
                        <MapPin size={14}/> {app.location}
                    </div>
                    <div className="col-span-2 flex items-center gap-1 text-sm text-slate-400">
                        <Calendar size={14}/> {new Date(app.appliedDate).toLocaleDateString()}
                    </div>
                    <div className="col-span-2">
                        <span className="text-xs px-2 py-1 rounded bg-slate-800 border border-slate-700 text-slate-300">
                            {app.method}
                        </span>
                    </div>
                    <div className="col-span-3 flex gap-2">
                        <select 
                            value={app.status}
                            onChange={(e) => handleStatusChange(app.id, e.target.value)}
                            className={`bg-slate-900 border border-slate-700 rounded px-2 py-1 text-sm focus:outline-none focus:border-brand-500 ${
                                app.status === 'interviewing' ? 'text-orange-400' :
                                app.status === 'rejected' ? 'text-red-400' :
                                'text-green-400'
                            }`}
                        >
                            <option value="applied">Applied</option>
                            <option value="interviewing">Interviewing</option>
                            <option value="rejected">Rejected</option>
                            <option value="found">Saved (Not Applied)</option>
                        </select>
                    </div>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default ApplicationHistory;