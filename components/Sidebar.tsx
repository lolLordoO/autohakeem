
import React from 'react';
import { LayoutDashboard, Search, Send, Briefcase, UserCircle, ListTodo, ChevronUp, ChevronDown, Copy, Phone, Mail, MapPin, ExternalLink, Globe, Zap, Calendar, Settings } from 'lucide-react';
import { USER_PROFILE } from '../constants';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  toggleProfileHud: () => void;
  showProfileHud: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, toggleProfileHud, showProfileHud }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Mission Control', icon: LayoutDashboard },
    { id: 'signals', label: 'Market Pulse', icon: Zap },
    { id: 'search', label: 'Job Search', icon: Search },
    { id: 'apply', label: 'Auto-Apply', icon: Briefcase },
    { id: 'outreach', label: 'Recruiter Radar', icon: Send },
    { id: 'events', label: 'Events', icon: Calendar },
    { id: 'tracker', label: 'Offers & Tracker', icon: ListTodo },
    { id: 'agencies', label: 'Agencies', icon: UserCircle },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="w-64 bg-dark-card border-r border-dark-border h-screen flex flex-col fixed left-0 top-0 z-50 shadow-2xl">
      <div className="p-6 mb-2">
        <h1 className="text-2xl font-bold text-white tracking-tighter flex items-center gap-2">
          JobHunt<span className="text-brand-500">.</span>
        </h1>
        <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-medium ml-0.5">Career OS v3.0</p>
      </div>

      <nav className="flex-1 px-3 space-y-1 overflow-y-auto custom-scrollbar">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-md transition-all duration-200 group ${
                isActive 
                  ? 'bg-zinc-800 text-white border-l-2 border-brand-500' 
                  : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
              }`}
            >
              <Icon size={18} className={isActive ? 'text-brand-500' : 'text-zinc-500 group-hover:text-zinc-300'} />
              <span className={`font-medium text-sm ${isActive ? 'translate-x-0.5' : ''} transition-transform`}>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-dark-border bg-dark-bg">
        <button 
            onClick={toggleProfileHud}
            className={`w-full flex items-center justify-between p-3 rounded-xl transition-all border ${
                showProfileHud 
                ? 'bg-zinc-800 border-brand-500/50' 
                : 'bg-zinc-900 border-dark-border hover:border-zinc-700'
            }`}
        >
            <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center text-xs font-bold text-white shadow-inner ring-2 ring-brand-900">
                    AH
                </div>
                <div className="text-left">
                    <p className="text-xs text-white font-bold">My Profile</p>
                    <p className="text-[10px] text-emerald-500 flex items-center gap-1">
                       <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Online
                    </p>
                </div>
            </div>
            {showProfileHud ? <ChevronDown size={14} className="text-brand-500"/> : <ChevronUp size={14} className="text-zinc-500"/>}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
