
import React, { useState } from 'react';
import { Save, Upload, Database, AlertTriangle, CheckCircle } from 'lucide-react';

const Settings: React.FC = () => {
    const [importStatus, setImportStatus] = useState<string>('');

    const handleExport = () => {
        const data = {
            applications: localStorage.getItem('autohakeem_applications'),
            interactions: localStorage.getItem('autohakeem_interactions'),
            visa: localStorage.getItem('autohakeem_visa'),
            signals: localStorage.getItem('autohakeem_signals'),
            events: localStorage.getItem('autohakeem_events')
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `jobhunt_backup_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
    };

    const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const json = JSON.parse(event.target?.result as string);
                if (json.applications) localStorage.setItem('autohakeem_applications', json.applications);
                if (json.interactions) localStorage.setItem('autohakeem_interactions', json.interactions);
                if (json.visa) localStorage.setItem('autohakeem_visa', json.visa);
                if (json.signals) localStorage.setItem('autohakeem_signals', json.signals);
                if (json.events) localStorage.setItem('autohakeem_events', json.events);
                setImportStatus('Success! Reloading...');
                setTimeout(() => window.location.reload(), 1000);
            } catch (err) {
                setImportStatus('Error: Invalid Backup File');
            }
        };
        reader.readAsText(file);
    };

    return (
        <div className="p-8 h-screen flex flex-col">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <Database className="text-brand-500"/> System Settings
            </h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-dark-card border border-dark-border p-6 rounded-xl">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><Save size={20}/> Backup Data</h3>
                    <p className="text-sm text-slate-400 mb-6">Export your entire career database (Applications, History, Contacts) to a JSON file. Keep this safe.</p>
                    <button onClick={handleExport} className="w-full bg-brand-600 hover:bg-brand-500 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2">
                        Download Backup
                    </button>
                </div>

                <div className="bg-dark-card border border-dark-border p-6 rounded-xl">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><Upload size={20}/> Restore Data</h3>
                    <p className="text-sm text-slate-400 mb-6">Restore from a previous backup file. <span className="text-red-400">Warning: This overwrites current data.</span></p>
                    <div className="relative">
                        <input 
                            type="file" 
                            accept=".json" 
                            onChange={handleImport}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <button className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 py-3 rounded-lg font-bold flex items-center justify-center gap-2">
                            Select Backup File
                        </button>
                    </div>
                    {importStatus && (
                        <div className={`mt-4 text-sm font-bold flex items-center gap-2 ${importStatus.includes('Error') ? 'text-red-400' : 'text-green-400'}`}>
                            {importStatus.includes('Error') ? <AlertTriangle size={16}/> : <CheckCircle size={16}/>}
                            {importStatus}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Settings;
