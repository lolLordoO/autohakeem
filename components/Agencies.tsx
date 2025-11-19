
import React, { useState, useEffect } from 'react';
import { Building2, Mail, Phone, Globe, RefreshCw, ArrowRight, Copy, CheckCircle, History, Filter } from 'lucide-react';
import { findAgencies, draftAgencyOutreach } from '../services/geminiService';
import { getInteractions, saveInteraction, getExcludedNames } from '../services/storageService';
import { PersonaType, AgencyProfile, InteractionRecord, SearchFocus } from '../types';

interface AgenciesProps {
  results: AgencyProfile[];
  setResults: (a: AgencyProfile[]) => void;
}

const Agencies: React.FC<AgenciesProps> = ({ results, setResults }) => {
    const [activeView, setActiveView] = useState<'search' | 'history'>('search');
    const [history, setHistory] = useState<InteractionRecord[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedAgency, setSelectedAgency] = useState<AgencyProfile | null>(null);
    const [draft, setDraft] = useState('');
    const [isDrafting, setIsDrafting] = useState(false);
    const [persona, setPersona] = useState<PersonaType>(PersonaType.MARKETING);
    const [focus, setFocus] = useState<SearchFocus>(SearchFocus.ALL);

    useEffect(() => {
        setHistory(getInteractions('Agency'));
    }, []);

    const loadNewAgencies = async () => {
        setLoading(true);
        setActiveView('search');
        const excluded = getExcludedNames('Agency');
        const data = await findAgencies(focus, excluded);
        setResults(data);
        setLoading(false);
    }

    const handleDraft = async (agency: AgencyProfile) => {
        setSelectedAgency(agency);
        setIsDrafting(true);
        setDraft("Drafting personalized outreach...");
        try {
            const text = await draftAgencyOutreach(agency, persona);
            setDraft(text);
        } catch (e) {
            setDraft("Error generating draft.");
        } finally {
            setIsDrafting(false);
        }
    }

    const markAsContacted = () => {
        if (!selectedAgency) return;
        const details = selectedAgency.email || selectedAgency.website || 'No details';
        saveInteraction(selectedAgency.name, 'Agency', details);
        setHistory(getInteractions('Agency'));
        setResults(results.filter(a => a.name !== selectedAgency.name));
        setSelectedAgency(null);
        setDraft('');
    }

    return (
        <div className="p-8 h-screen flex flex-col">
             <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Building2 className="text-brand-500"/> Agency Network
                    </h2>
                    <p className="text-slate-500 text-sm">Discover niche recruiters & boutiques.</p>
                </div>
                
                <div className="flex gap-2 items-center">
                     <div className="flex items-center gap-2 bg-slate-800/50 px-3 py-2 rounded-md border border-slate-700">
                        <Filter size={12} className="text-slate-400"/>
                        <select 
                            value={focus}
                            onChange={(e) => setFocus(e.target.value as SearchFocus)}
                            className="bg-transparent text-white text-xs outline-none font-medium cursor-pointer"
                        >
                            {Object.values(SearchFocus).map(f => <option key={f} value={f}>{f}</option>)}
                        </select>
                     </div>

                    <div className="flex bg-slate-800 rounded-lg p-1">
                        <button onClick={() => setActiveView('search')} className={`px-4 py-2 rounded-md text-sm ${activeView === 'search' ? 'bg-brand-600 text-white' : 'text-slate-400'}`}>Search New</button>
                        <button onClick={() => setActiveView('history')} className={`px-4 py-2 rounded-md text-sm flex items-center gap-2 ${activeView === 'history' ? 'bg-brand-600 text-white' : 'text-slate-400'}`}>
                            <History size={14}/> History
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full overflow-hidden">
                {/* Left List Panel */}
                <div className="col-span-1 bg-dark-card border border-dark-border rounded-xl flex flex-col overflow-hidden">
                    {activeView === 'search' ? (
                        <>
                             <div className="p-4 border-b border-dark-border bg-slate-900/50 flex justify-between items-center">
                                <span className="text-xs text-slate-400">{results.length} Found</span>
                                <button onClick={loadNewAgencies} disabled={loading} className="text-brand-400 hover:text-brand-300 flex items-center gap-1 text-xs font-bold">
                                    <RefreshCw size={12} className={loading ? "animate-spin" : ""}/> SCAN NEW
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
                                {results.map((agency, idx) => (
                                    <div key={idx} onClick={() => handleDraft(agency)} className={`p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md ${selectedAgency?.name === agency.name ? 'bg-brand-900/20 border-brand-500' : 'bg-slate-900 border-slate-800 hover:border-slate-700'}`}>
                                        <div className="font-medium text-white">{agency.name}</div>
                                        <div className="text-xs text-slate-500 mt-1 line-clamp-1">{agency.focus}</div>
                                        <div className="flex gap-2 mt-2">
                                            {agency.email && <span className="px-1.5 py-0.5 bg-orange-900/30 text-orange-400 text-[10px] rounded border border-orange-800">Email</span>}
                                            {agency.website && <span className="px-1.5 py-0.5 bg-blue-900/30 text-blue-400 text-[10px] rounded border border-blue-800">Web</span>}
                                        </div>
                                    </div>
                                ))}
                                {results.length === 0 && !loading && (
                                    <div className="p-8 text-center text-slate-500 text-sm flex flex-col items-center gap-2">
                                        <Filter className="opacity-20"/>
                                        Scan to find agencies for {focus}.
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
                            {history.map((item) => (
                                <div key={item.id} className="p-4 rounded-lg border border-slate-800 bg-slate-900/50 opacity-70">
                                    <div className="font-medium text-slate-300">{item.name}</div>
                                    <div className="text-xs text-green-500 flex items-center gap-1 mt-1"><CheckCircle size={10}/> Contacted {new Date(item.date).toLocaleDateString()}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Right Detail Panel */}
                <div className="col-span-2 bg-dark-card border border-dark-border rounded-xl flex flex-col overflow-hidden">
                    {selectedAgency ? (
                        <>
                            <div className="p-6 border-b border-dark-border bg-slate-900/50">
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="text-xl font-bold text-white">{selectedAgency.name}</h3>
                                    <button onClick={markAsContacted} className="px-3 py-1.5 bg-green-600/20 text-green-400 border border-green-600/50 rounded text-xs font-medium hover:bg-green-600/30">
                                        Mark as Contacted
                                    </button>
                                </div>
                                <div className="flex gap-3 text-sm text-slate-400">
                                    {selectedAgency.email && <a href={`mailto:${selectedAgency.email}`} className="flex items-center gap-1 hover:text-white"><Mail size={14}/> {selectedAgency.email}</a>}
                                    {selectedAgency.website && <a href={selectedAgency.website} target="_blank" className="flex items-center gap-1 text-blue-400 hover:underline"><Globe size={14}/> Website</a>}
                                </div>
                            </div>
                            <div className="flex-1 p-6 overflow-y-auto">
                                {isDrafting ? <div className="flex items-center gap-2 text-brand-400"><RefreshCw className="animate-spin"/> Drafting...</div> : (
                                     <div className="bg-slate-900 rounded-lg border border-slate-800 p-6 font-mono text-sm text-slate-300 whitespace-pre-wrap leading-relaxed shadow-inner">
                                        {draft}
                                    </div>
                                )}
                            </div>
                            <div className="p-4 border-t border-dark-border flex gap-4">
                                <button onClick={() => navigator.clipboard.writeText(draft)} className="flex-1 bg-brand-600 hover:bg-brand-500 text-white py-3 rounded-lg flex justify-center items-center gap-2 font-bold">
                                    <Copy size={18}/> Copy Draft
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-500">
                            <Building2 size={48} className="opacity-20 mb-4"/>
                            <p>Select an agency to begin outreach.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Agencies;
