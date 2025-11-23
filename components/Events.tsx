
import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, ExternalLink, RefreshCw, Search, AlertCircle } from 'lucide-react';
import { findTechEvents } from '../services/geminiService';
import { getSavedEvents, saveEvents } from '../services/storageService';
import { TechEvent } from '../types';

const Events: React.FC = () => {
    const [events, setEvents] = useState<TechEvent[]>([]);
    const [loading, setLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

    useEffect(() => {
        const saved = getSavedEvents();
        if (saved.length > 0) {
            setEvents(saved);
            setHasSearched(true);
        }
    }, []);

    const handleScan = async () => {
        setLoading(true);
        setEvents([]); // Clear to show fresh scan
        try {
            const results = await findTechEvents();
            setHasSearched(true);
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

            <div className="flex-1 overflow-y-auto pb-20">
                {!hasSearched && !loading && (
                    <div className="flex flex-col items-center justify-center h-full text-slate-500 border-2 border-dashed border-slate-800 rounded-xl bg-slate-900/10">
                        <Calendar size={48} className="mb-4 opacity-20" />
                        <p className="font-medium">No events loaded.</p>
                        <p className="text-xs mt-2">Click "Scan Events" to find upcoming networking opportunities in UAE.</p>
                    </div>
                )}
                
                {hasSearched && events.length === 0 && !loading && (
                    <div className="flex flex-col items-center justify-center h-full text-slate-500">
                        <AlertCircle size={48} className="mb-4 text-orange-400 opacity-50" />
                        <p className="font-medium text-white">No upcoming tech events found.</p>
                        <p className="text-xs mt-2">Sources: Meetup, Eventbrite, Platinumlist (UAE).</p>
                        <button onClick={handleScan} className="mt-4 text-brand-400 hover:text-brand-300 text-sm font-bold">Try Again</button>
                    </div>
                )}

                {events.length > 0 && (
                    <div className="grid grid-cols-1 gap-4">
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
                )}
            </div>
        </div>
    );
};
export default Events;
