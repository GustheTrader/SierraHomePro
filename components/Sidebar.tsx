import React from 'react';
import { NAV_ITEMS, COMPANY_INFO } from '../constants';
import { Phone, Mail } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  theme: 'light' | 'dark';
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, theme }) => {
  return (
    <aside className="w-64 bg-zinc-900 border-r border-zinc-800/80 flex flex-col h-screen fixed left-0 top-0 z-30 transition-colors">
      <div className="p-5 flex-1 overflow-y-auto">
        {/* Sierra Home Pros Official Brand Logo */}
        <div className="mb-7">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-full text-left rounded-xl transition-all block ${
              theme === 'dark'
                ? 'bg-[#FAF8F5] px-3 py-2.5 border border-zinc-700/60 shadow-sm'
                : 'bg-[#FAF8F5] px-3 py-2.5 border border-zinc-800/70'
            }`}
            title="Sierra Home Pros — Daily Operations"
          >
            <img
              src="/assets/aistudio/image_3d60c98b.png"
              alt="Sierra Home Pros"
              className="w-full h-11 object-contain object-left"
            />
          </button>
          <p className="text-[11px] font-medium text-zinc-500 mt-2 px-1">
            Home Repair · Smart Home · Maintenance
          </p>
        </div>

        <nav className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm transition-colors whitespace-nowrap ${
                  isActive
                    ? 'bg-emerald-500/12 text-emerald-400 font-semibold border border-emerald-500/25'
                    : 'text-zinc-400 hover:bg-zinc-950/70 hover:text-zinc-100 border border-transparent'
                }`}
              >
                <span className="shrink-0">{item.icon}</span>
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="p-5 border-t border-zinc-800/80 bg-zinc-950/40">
        <div className="space-y-2 text-xs text-zinc-400">
          <p className="font-semibold text-zinc-100">{COMPANY_INFO.headquarters} Dispatch</p>
          <p className="text-[11px] text-zinc-500 leading-relaxed">
            Serving Reno–Sparks, Carson City & Lake Tahoe
          </p>
          <div className="pt-1.5 space-y-1 text-[11px] text-zinc-400 font-mono tabular-nums">
            <div className="flex items-center gap-2">
              <Phone size={12} className="text-emerald-400 shrink-0" />
              <span>{COMPANY_INFO.phone}</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail size={12} className="text-emerald-400 shrink-0" />
              <span className="truncate">{COMPANY_INFO.email}</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
