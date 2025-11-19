
import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, ExternalLink, RefreshCw, Search } from 'lucide-react';
import { findTechEvents } from '../services/geminiService';
import { getSavedEvents, saveEvents } from '../services/storageService';
import { TechEvent } from '../types';

const Events: React.FC = () => {
    const [events, setEvents] = useState<TechEvent[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const saved = getSavedEvents();
        if (saved.length > 0) setEvents(saved);
        else handleScan();
    }, []);

    const handleScan = async () => {
        setLoading(true);
        try {
            const results = await findTechEvents();
            if (results.length > 0) {
                setEvents(results);
                saveEvents(results);
            }
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }

    const getSmartEventUrl = (evt: TechEvent) => {
        return `https://www.google.com/search?q=${encodeURIComponent(`${evt.name} Dubai RSVP`)}`;
    }

    return (
        <div className="p-8 h-screen flex flex-col">
             <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <Calendar className="text-purple-500"/> Events Radar
                </h2>
                <button onClick={handleScan} disabled={loading} className="bg-brand-600 hover:bg-brand-500 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2">
                    {loading ? <RefreshCw className="animate-spin" size={16}/> : <RefreshCw size={16}/>}
                    Scan Events
                </button>
            </div>

            <div className="grid grid-cols-1 gap-4 overflow-y-auto pb-20">
                {events.map(evt => (
                    <div key={evt.id} className="bg-dark-card border border-dark-border p-6 rounded-xl flex flex-col md:flex-row justify-between items-center gap-6 hover:border-purple-500/30 transition-all">
                        <div className="flex-1">
                            <div className="flex gap-2 mb-2">
                                <span className="text-xs bg-purple-900/30 text-purple-300 px-2 py-1 rounded border border-purple-800">{evt.type}</span>
                                <span className="text-xs bg-slate-800 text-slate-300 px-2 py-1 rounded border border-slate-700">{evt.date}</span>
                            </div>
                            <h3 className="text-xl font-bold text-white mb-1">{evt.name}</h3>
                            <div className="flex items-center gap-2 text-sm text-slate-400 mb-3">
                                <MapPin size={14}/> {evt.location}
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {evt.keyAttendees?.map((attendee, i) => (
                                    <span key={i} className="text-xs text-slate-500 italic">#{attendee}</span>
                                ))}
                            </div>
                        </div>
                        {evt.url ? (
                            <a href={evt.url} target="_blank" rel="noreferrer" className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-bold flex items-center gap-2 border border-slate-700 transition-colors">
                                <ExternalLink size={16}/> RSVP
                            </a>
                        ) : (
                            <a href={getSmartEventUrl(evt)} target="_blank" rel="noreferrer" className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-bold flex items-center gap-2 border border-slate-700 transition-colors">
                                <Search size={16}/> Find Event
                            </a>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};
export default Events;
