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
    <aside className="w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col h-screen fixed left-0 top-0 z-30 transition-colors">
      <div className="py-5 px-3 flex-1 overflow-y-auto">
        {/* Sierra Home Pros Official Brand Logo */}
        <div className="mb-7 px-0.5">
          <button
            onClick={() => setActiveTab('dashboard')}
            className="w-full text-left transition-all block bg-[#FAF8F5] px-3 py-2.5 border border-zinc-700"
            title="Sierra Home Pros — Daily Operations"
          >
            <img
              src="/assets/aistudio/image_3d60c98b.png"
              alt="Sierra Home Pros"
              className="w-full h-11 object-contain object-left"
            />
          </button>
          <p className="text-[10px] uppercase tracking-wider text-zinc-500 mt-2.5 px-0.5">
            Repair · Smart Home · Upkeep
          </p>
        </div>

        <p className="text-[10px] uppercase tracking-wider text-zinc-600 px-3.5 mb-2">Workspace</p>
        <nav className="border-t border-zinc-800">
          {NAV_ITEMS.map((item, index) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`group relative w-full flex items-center gap-3 pl-3.5 pr-3 py-2.5 text-[13px] border-b border-zinc-800 transition-colors whitespace-nowrap ${
                  isActive
                    ? 'bg-zinc-950 text-zinc-50 font-semibold'
                    : 'text-zinc-400 hover:bg-zinc-950/60 hover:text-zinc-100'
                }`}
              >
                <span
                  className={`absolute left-0 top-0 bottom-0 w-[2px] transition-colors ${
                    isActive ? 'bg-emerald-400' : 'bg-transparent group-hover:bg-zinc-700'
                  }`}
                  aria-hidden="true"
                />
                <span className={`shrink-0 ${isActive ? 'text-emerald-400' : ''}`}>{item.icon}</span>
                <span className="truncate flex-1 text-left">{item.label}</span>
                <span
                  className={`font-mono text-[10px] ${isActive ? 'text-emerald-400' : 'text-zinc-600'}`}
                  aria-hidden="true"
                >
                  {String(index + 1).padStart(2, '0')}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="p-5 border-t border-zinc-800 bg-zinc-900">
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
