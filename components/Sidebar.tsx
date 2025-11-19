import React from 'react';
import { LayoutDashboard, Search, Send, Briefcase, Settings, UserCircle, ListTodo } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Mission Control', icon: LayoutDashboard },
    { id: 'search', label: 'Job Search Agent', icon: Search },
    { id: 'apply', label: 'Auto-Apply Bot', icon: Briefcase },
    { id: 'tracker', label: 'Application Tracker', icon: ListTodo },
    { id: 'outreach', label: 'Recruiter Reachout', icon: Send },
    { id: 'agencies', label: 'Agency Network', icon: UserCircle },
  ];

  return (
    <div className="w-64 bg-dark-card border-r border-dark-border h-screen flex flex-col fixed left-0 top-0 z-50">
      <div className="p-6 border-b border-dark-border">
        <h1 className="text-xl font-bold text-brand-500 tracking-tight">
          AUTO<span className="text-white">HAKEEM</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">Career Automation System</p>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                isActive 
                  ? 'bg-brand-500/10 text-brand-500 border border-brand-500/20' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <Icon size={20} />
              <span className="font-medium text-sm">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-dark-border">
        <div className="flex items-center space-x-3 px-4 py-2">
          <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center text-xs font-bold text-white">
            AH
          </div>
          <div>
            <p className="text-sm text-white font-medium">Abdul Hakeem</p>
            <p className="text-xs text-green-400">● System Online</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;