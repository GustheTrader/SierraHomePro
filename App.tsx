import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import ProjectManagement from './components/ProjectManagement';
import AgentConsole from './components/AgentConsole';
import BuyoutModule from './components/BuyoutModule';
import ExecutionModule from './components/ExecutionModule';
import VoiceAssistant from './components/VoiceAssistant';
import RFITracker from './components/RFITracker';
import Settings from './components/Settings';
import { BudgetVsActuals } from './components/BudgetVsActuals';
import RenoManpowerSchedule from './components/RenoManpowerSchedule';
import PDFReportGenerator from './components/PDFReportGenerator';
import NotificationDashboard from './components/NotificationDashboard';
import CRMSubscriptions from './components/CRMSubscriptions';
import ClientPreviewPortal from './components/ClientPreviewPortal';
import { AGENTS, INITIAL_PROJECTS, MOCK_INTEGRATIONS, COMPANY_INFO, NAV_ITEMS } from './constants';
import { Mic, Phone, User, Sun, Moon } from 'lucide-react';
import { ConstructionProject, Integration } from './types';

function readPreviewTokenFromUrl(): string | null {
  try {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('clientPreview')?.trim();
    return token || null;
  } catch {
    return null;
  }
}

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
  const [clientPreviewToken, setClientPreviewToken] = useState<string | null>(() =>
    readPreviewTokenFromUrl()
  );
  const [enteredPreviewFromAdmin, setEnteredPreviewFromAdmin] = useState<boolean>(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      const saved = window.localStorage.getItem('sierra_theme_v2');
      if (saved === 'dark' || saved === 'light') return saved;
    } catch {
      // ignore storage errors
    }
    return 'dark';
  });

  useEffect(() => {
    const onPopState = () => {
      setClientPreviewToken(readPreviewTokenFromUrl());
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const handleOpenClientPreview = (token: string) => {
    setEnteredPreviewFromAdmin(true);
    setClientPreviewToken(token);
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('clientPreview', token);
      window.history.pushState({}, '', `${url.pathname}${url.search}`);
    } catch {
      // ignore history errors in restricted frames
    }
  };

  const handleExitClientPreview = () => {
    setClientPreviewToken(null);
    setEnteredPreviewFromAdmin(false);
    setActiveTab('settings');
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete('clientPreview');
      const nextUrl = `${url.pathname}${url.search}`;
      window.history.pushState({}, '', nextUrl || '/');
    } catch {
      // ignore history errors in restricted frames
    }
  };

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    try {
      window.localStorage.setItem('sierra_theme_v2', theme);
    } catch {
      // ignore storage errors
    }
  }, [theme]);

  const [projects, setProjects] = useState<ConstructionProject[]>(INITIAL_PROJECTS);
  const [integrations, setIntegrations] = useState<Integration[]>(MOCK_INTEGRATIONS);

  const updateProjectsFromSync = (newProjects: ConstructionProject[]) => {
    setProjects(newProjects);
  };

  const updateIntegrations = (newIntegrations: Integration[]) => {
    setIntegrations(newIntegrations);
  };

  const currentNavLabel = NAV_ITEMS.find(item => item.id === activeTab)?.label || 'Daily Operations';

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard
            projects={projects}
            agents={AGENTS}
            integrations={integrations}
            onUpdateProjects={updateProjectsFromSync}
            onUpdateIntegrations={updateIntegrations}
          />
        );
      case 'crm':
        return <CRMSubscriptions />;
      case 'projects':
        return (
          <ProjectManagement
            projects={projects}
            onUpdateProjects={updateProjectsFromSync}
          />
        );
      case 'rfi':
        return <RFITracker />;
      case 'buyout':
        return <BuyoutModule onNavigate={setActiveTab} />;
      case 'execution':
        return <ExecutionModule />;
      case 'ai':
        return <AgentConsole agents={AGENTS} />;
      case 'settings':
        return (
          <Settings
            integrations={integrations}
            onUpdateIntegrations={updateIntegrations}
            projects={projects}
            onUpdateProjects={updateProjectsFromSync}
            onOpenClientPreview={handleOpenClientPreview}
          />
        );
      case 'financials':
        return <BudgetVsActuals projects={projects} />;
      case 'resources':
        return <RenoManpowerSchedule />;
      case 'reports':
        return <PDFReportGenerator projects={projects} />;
      default:
        return (
          <Dashboard
            projects={projects}
            agents={AGENTS}
            integrations={integrations}
            onUpdateProjects={updateProjectsFromSync}
            onUpdateIntegrations={updateIntegrations}
          />
        );
    }
  };

  if (clientPreviewToken) {
    return (
      <ClientPreviewPortal
        token={clientPreviewToken}
        theme={theme}
        onToggleTheme={setTheme}
        canReturnToAdmin={enteredPreviewFromAdmin}
        onExitPreview={handleExitClientPreview}
      />
    );
  }

  return (
    <div className="flex min-h-screen bg-zinc-950 text-zinc-100 overflow-hidden transition-colors">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} theme={theme} />

      <main className="flex-1 ml-64 flex flex-col h-screen overflow-hidden">
        {/* Top Header */}
        <header className="h-14 border-b border-zinc-800 flex items-center justify-between gap-6 px-8 bg-zinc-900 z-20 shrink-0 transition-colors">
          <div className="flex items-center gap-2.5 min-w-0 font-mono text-[11px] uppercase tracking-wider">
            <span className="text-zinc-500 whitespace-nowrap">Sierra Home Pros</span>
            <span className="text-zinc-700" aria-hidden="true">/</span>
            <span className="text-zinc-100 truncate">{currentNavLabel}</span>
            <span className="hidden xl:inline-flex items-center gap-1.5 ml-3 pl-3 border-l border-zinc-800 text-zinc-500 whitespace-nowrap">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" aria-hidden="true" />
              Reno–Sparks · Carson City · Tahoe
            </span>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <a
              href={`tel:${COMPANY_INFO.phone.replace(/[^0-9]/g, '')}`}
              className="hidden 2xl:flex items-center gap-1.5 text-xs text-zinc-400 hover:text-emerald-400 transition-colors font-mono tabular-nums whitespace-nowrap mr-1"
            >
              <Phone size={13} />
              <span>{COMPANY_INFO.phone}</span>
            </a>

            {/* Light / Dark Mode Switch */}
            <div
              className="flex items-center bg-zinc-950 border border-zinc-800 rounded-xl p-0.5"
              role="group"
              aria-label="Color theme"
            >
              <button
                onClick={() => setTheme('light')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  theme === 'light'
                    ? 'bg-zinc-100 text-zinc-950'
                    : 'text-zinc-400 hover:text-zinc-100'
                }`}
                title="Switch to Light Mode"
              >
                <Sun size={13} />
                <span className="hidden sm:inline">Light</span>
              </button>
              <button
                onClick={() => setTheme('dark')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  theme === 'dark'
                    ? 'bg-zinc-100 text-zinc-950'
                    : 'text-zinc-400 hover:text-zinc-100'
                }`}
                title="Switch to Dark Mode"
              >
                <Moon size={13} />
                <span className="hidden sm:inline">Dark</span>
              </button>
            </div>

            <button
              onClick={() => setIsVoiceOpen(prev => !prev)}
              className={`px-3.5 py-2 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 ${
                isVoiceOpen
                  ? 'bg-emerald-600 border-emerald-500 text-white'
                  : 'bg-zinc-950 border-zinc-800 text-zinc-200 hover:border-emerald-500/40 hover:text-emerald-400'
              }`}
            >
              <Mic size={14} />
              <span>Voice Dispatch</span>
            </button>

            <NotificationDashboard
              projects={projects}
              onUpdateProjects={updateProjectsFromSync}
            />

            <div className="h-6 w-[1px] bg-zinc-800" />

            <div className="flex items-center gap-2.5">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-semibold text-zinc-100 leading-tight">Jordan Vance</p>
                <p className="text-[11px] text-zinc-500 leading-tight">Sparks Ops Lead</p>
              </div>
              <div className="w-8 h-8 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-center">
                <User size={16} className="text-emerald-400" />
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Content Area */}
        <div className="flex-1 overflow-y-auto p-8 scroll-smooth relative ledger-grid">
          <div className="max-w-7xl mx-auto">
            {renderContent()}
          </div>
        </div>

        {/* Voice Dispatch Assistant */}
        {isVoiceOpen && <VoiceAssistant onClose={() => setIsVoiceOpen(false)} />}
      </main>
    </div>
  );
};

export default App;
