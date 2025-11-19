import React, { useState, useEffect } from 'react';
import { Building2, Mail, UserCheck, RefreshCw, ArrowRight } from 'lucide-react';
import { findAgencies, draftAgencyOutreach } from '../services/geminiService';
import { PersonaType } from '../types';

const Agencies: React.FC = () => {
    const [agencies, setAgencies] = useState<{name: string, focus: string}[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedAgency, setSelectedAgency] = useState<string | null>(null);
    const [draft, setDraft] = useState('');
    const [persona, setPersona] = useState<PersonaType>(PersonaType.MARKETING);

    useEffect(() => {
        loadAgencies();
    }, []);

    const loadAgencies = async () => {
        setLoading(true);
        const data = await findAgencies();
        setAgencies(data);
        setLoading(false);
    }

    const handleDraft = async (name: string) => {
        setSelectedAgency(name);
        setDraft("Drafting personalized outreach...");
        const text = await draftAgencyOutreach(name, persona);
        setDraft(text);
    }

    return (
        <div className="p-8 h-screen flex flex-col">
             <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <Building2 className="text-brand-500"/> Agency Network Hub
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full">
                {/* Agency List */}
                <div className="col-span-1 bg-dark-card border border-dark-border rounded-xl p-4 flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-semibold text-white">Top UAE Agencies</h3>
                        <button onClick={loadAgencies} className="text-slate-400 hover:text-brand-500">
                            <RefreshCw size={16} className={loading ? "animate-spin" : ""}/>
                        </button>
                    </div>
                    
                    <div className="space-y-3 flex-1 overflow-y-auto">
                        {agencies.map((agency, idx) => (
                            <div 
                                key={idx} 
                                onClick={() => handleDraft(agency.name)}
                                className={`p-4 rounded-lg border cursor-pointer transition-all ${
                                    selectedAgency === agency.name 
                                    ? 'bg-brand-900/20 border-brand-500' 
                                    : 'bg-slate-900 border-slate-800 hover:border-slate-600'
                                }`}
                            >
                                <div className="font-medium text-white">{agency.name}</div>
                                <div className="text-xs text-slate-500 mt-1">{agency.focus}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Drafter */}
                <div className="col-span-2 bg-dark-card border border-dark-border rounded-xl p-6 flex flex-col">
                    {selectedAgency ? (
                        <>
                            <div className="mb-6 flex justify-between items-center">
                                <div>
                                    <h3 className="text-lg font-bold text-white">Outreach to {selectedAgency}</h3>
                                    <p className="text-sm text-slate-400">Persona: {persona}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => setPersona(PersonaType.MARKETING)} className="text-xs px-2 py-1 bg-slate-800 rounded hover:bg-slate-700 text-slate-300">Marketing</button>
                                    <button onClick={() => setPersona(PersonaType.PMO)} className="text-xs px-2 py-1 bg-slate-800 rounded hover:bg-slate-700 text-slate-300">PMO</button>
                                </div>
                            </div>

                            <div className="flex-1 bg-slate-900 rounded-lg border border-slate-800 p-4 font-mono text-sm text-slate-300 whitespace-pre-wrap overflow-y-auto mb-4">
                                {draft}
                            </div>

                            <div className="flex gap-4">
                                <button 
                                    onClick={() => navigator.clipboard.writeText(draft)}
                                    className="flex-1 bg-brand-600 hover:bg-brand-500 text-white py-3 rounded-lg font-medium flex justify-center items-center gap-2"
                                >
                                    <Mail size={18}/> Copy to Email Client
                                </button>
                                <button 
                                    onClick={() => handleDraft(selectedAgency)}
                                    className="px-6 border border-slate-600 text-slate-300 hover:bg-slate-800 rounded-lg"
                                >
                                    Regenerate
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-500">
                            <ArrowRight size={48} className="opacity-20 mb-4"/>
                            <p>Select an agency to start drafting outreach.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Agencies;