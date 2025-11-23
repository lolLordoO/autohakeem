
import React, { useState, useEffect } from 'react';
import { getApplications, updateApplicationStatus } from '../services/storageService';
import { generateInterviewBrief, evaluateOffer } from '../services/geminiService';
import { ApplicationRecord } from '../types';
import { Calendar, MapPin, ExternalLink, Briefcase, Search, FileText, Calculator, X, Loader2, Mic } from 'lucide-react';
import MockInterview from './MockInterview'; // Though this component doesn't embed MockInterview, we want to route to it.

const ApplicationHistory: React.FC = () => {
  const [applications, setApplications] = useState<ApplicationRecord[]>([]);
  const [activeModal, setActiveModal] = useState<{type: 'brief' | 'offer' | 'mock', appId: string} | null>(null);
  const [loading, setLoading] = useState(false);
  const [modalContent, setModalContent] = useState<any>(null);
  
  // Offer Form State
  const [offerForm, setOfferForm] = useState({ salary: '', benefits: '' });

  useEffect(() => {
    setApplications(getApplications());
  }, []);

  const handleStatusChange = (id: string, newStatus: any) => {
    updateApplicationStatus(id, newStatus);
    setApplications(getApplications());
  };

  const handlePrep = async (app: ApplicationRecord) => {
      setActiveModal({type: 'brief', appId: app.id});
      setLoading(true);
      setModalContent(null);
      const brief = await generateInterviewBrief(app);
      setModalContent(brief);
      setLoading(false);
  }

  const triggerEval = async (app: ApplicationRecord) => {
      setLoading(true);
      const result = await evaluateOffer(offerForm.salary, app.location, offerForm.benefits);
      setModalContent(result);
      setLoading(false);
  }

  const openOfferModal = (appId: string) => {
      setOfferForm({ salary: '', benefits: '' });
      setModalContent(null);
      setActiveModal({ type: 'offer', appId });
  }

  // We are using the MockInterview component as a separate route in App.tsx now
  // But we can keep a local modal for quick access or redirect logic if needed. 
  // For now, let's keep the MockInterview in its own tab for full screen experience.
  
  const currentApp = activeModal ? applications.find(a => a.id === activeModal.appId) : null;

  return (
    <div className="p-8 h-screen flex flex-col relative">
      <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
        <Briefcase className="text-brand-500"/> Application Tracker
      </h2>

      <div className="flex-1 bg-dark-card border border-dark-border rounded-xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-dark-border bg-slate-900/50 grid grid-cols-12 gap-4 text-xs font-medium text-slate-400 uppercase tracking-wider">
            <div className="col-span-3">Role & Company</div>
            <div className="col-span-2">Location</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-5">Tools</div>
        </div>

        {/* List */}
        <div className="overflow-y-auto flex-1">
            {applications.map((app) => (
                <div key={app.id} className="p-4 border-b border-dark-border grid grid-cols-12 gap-4 items-center hover:bg-slate-800/30 transition-colors">
                    <div className="col-span-3">
                        <div className="font-medium text-white truncate">{app.title}</div>
                        <div className="text-sm text-slate-400 truncate">{app.company}</div>
                    </div>
                    <div className="col-span-2 flex items-center gap-1 text-sm text-slate-400">
                        <MapPin size={14}/> {app.location}
                    </div>
                    <div className="col-span-2">
                        <select 
                            value={app.status}
                            onChange={(e) => handleStatusChange(app.id, e.target.value)}
                            className={`bg-slate-900 border border-slate-700 rounded px-2 py-1 text-sm focus:outline-none focus:border-brand-500 ${
                                app.status === 'interviewing' ? 'text-orange-400' :
                                app.status === 'offer' ? 'text-green-400' :
                                'text-slate-400'
                            }`}
                        >
                            <option value="applied">Applied</option>
                            <option value="interviewing">Interviewing</option>
                            <option value="offer">Offer Received</option>
                            <option value="rejected">Rejected</option>
                        </select>
                    </div>
                    <div className="col-span-5 flex gap-2">
                        <button onClick={() => handlePrep(app)} className="px-3 py-1 bg-blue-900/20 text-blue-400 border border-blue-500/30 rounded text-xs flex items-center gap-1 hover:bg-blue-900/40">
                            <FileText size={12}/> Brief
                        </button>
                        {app.status === 'offer' && (
                             <button onClick={() => openOfferModal(app.id)} className="px-3 py-1 bg-green-900/20 text-green-400 border border-green-500/30 rounded text-xs flex items-center gap-1 hover:bg-green-900/40">
                                <Calculator size={12}/> Eval
                            </button>
                        )}
                        {/* Note: The full simulation is best accessed via the sidebar 'Events' or a new 'Training' tab, but we can nudge them */}
                    </div>
                </div>
            ))}
        </div>
      </div>

      {/* MODAL */}
      {activeModal && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-12">
              <div className="bg-dark-card border border-dark-border rounded-xl shadow-2xl w-full max-w-3xl h-[80vh] flex flex-col overflow-hidden">
                  <div className="p-4 border-b border-dark-border flex justify-between items-center bg-slate-900">
                      <h3 className="font-bold text-white">{activeModal.type === 'brief' ? 'Interview Intelligence Brief' : 'Offer Evaluator'}</h3>
                      <button onClick={() => setActiveModal(null)}><X className="text-slate-500 hover:text-white"/></button>
                  </div>
                  <div className="flex-1 p-8 overflow-y-auto">
                      {loading ? <div className="flex items-center justify-center h-full"><Loader2 className="animate-spin text-brand-500" size={48}/></div> : (
                          activeModal.type === 'brief' ? (
                              <div className="whitespace-pre-wrap text-slate-300 font-mono text-sm">
                                  {modalContent}
                              </div>
                          ) : (
                              // Offer Evaluator Content
                              !modalContent ? (
                                  <div className="max-w-md mx-auto space-y-4">
                                      <div>
                                          <label className="block text-sm text-slate-400 mb-1">Monthly Salary (AED)</label>
                                          <input 
                                            type="number" 
                                            value={offerForm.salary} 
                                            onChange={e => setOfferForm({...offerForm, salary: e.target.value})}
                                            className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
                                          />
                                      </div>
                                      <div>
                                          <label className="block text-sm text-slate-400 mb-1">Benefits Included</label>
                                          <textarea 
                                            value={offerForm.benefits} 
                                            onChange={e => setOfferForm({...offerForm, benefits: e.target.value})}
                                            className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white h-24"
                                            placeholder="e.g. Full Family Visa, Flights, Health Insurance..."
                                          />
                                      </div>
                                      <button onClick={() => currentApp && triggerEval(currentApp)} className="w-full bg-green-600 hover:bg-green-500 text-white py-2 rounded font-bold">
                                          Analyze Offer
                                      </button>
                                  </div>
                              ) : (
                                  <div className="space-y-6">
                                      <div className="grid grid-cols-3 gap-4">
                                          <div className="bg-slate-800 p-4 rounded text-center">
                                              <div className="text-xs text-slate-500">Score</div>
                                              <div className="text-2xl font-bold text-white">{modalContent.totalScore}/100</div>
                                          </div>
                                          <div className="bg-slate-800 p-4 rounded text-center">
                                              <div className="text-xs text-slate-500">Growth</div>
                                              <div className="text-2xl font-bold text-brand-400">{modalContent.growthPotential}/10</div>
                                          </div>
                                          <div className="bg-slate-800 p-4 rounded text-center">
                                              <div className="text-xs text-slate-500">Benefits</div>
                                              <div className="text-2xl font-bold text-green-400">{modalContent.benefitsScore}/10</div>
                                          </div>
                                      </div>
                                      <div className="bg-slate-900 p-6 rounded border border-slate-800">
                                          <h4 className="font-bold text-white mb-2">Recommendation</h4>
                                          <p className="text-slate-300 text-sm leading-relaxed">{modalContent.recommendation}</p>
                                      </div>
                                      <button onClick={() => setModalContent(null)} className="text-sm text-slate-500 hover:text-white">Evaluate Another</button>
                                  </div>
                              )
                          )
                      )}
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default ApplicationHistory;
