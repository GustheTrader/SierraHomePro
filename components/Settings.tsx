import React, { useEffect, useState } from 'react';
import {
  RefreshCw,
  CheckCircle2,
  Link2,
  Plus,
  Send,
  ShieldCheck,
  Sparkles,
  Home,
  Calendar,
  FileSpreadsheet,
  Store,
  Eye,
  EyeOff,
  Copy,
  Check,
  Trash2,
  Clock,
  ExternalLink
} from 'lucide-react';
import {
  ClientPreviewLinkSummary,
  ConstructionProject,
  HomeServiceCategory,
  Integration
} from '../types';
import { COMPANY_INFO, MOCK_TASKS } from '../constants';

interface SettingsProps {
  integrations: Integration[];
  onUpdateIntegrations: (integrations: Integration[]) => void;
  projects: ConstructionProject[];
  onUpdateProjects: (projects: ConstructionProject[]) => void;
  onOpenClientPreview: (token: string) => void;
}

interface IncomingLead {
  id: string;
  jobberRequestId: string;
  title: string;
  homeowner: string;
  city: string;
  category: HomeServiceCategory;
  estimatedPrice: number;
  receivedAt: string;
  summary: string;
}

const INITIAL_INCOMING_LEADS: IncomingLead[] = [
  {
    id: 'lead-1',
    jobberRequestId: 'JB-4821',
    title: 'Spanish Springs Exterior Door Weatherstrip & Smart Deadbolt',
    homeowner: 'Rachel & Owen Diaz · Sparks, NV',
    city: 'Sparks, NV',
    category: 'Smart Home',
    estimatedPrice: 780,
    receivedAt: 'Today · 8:40 AM',
    summary: 'Front entry draft sealing + Schlage keypad lock install with existing deadbolt haul-away.'
  },
  {
    id: 'lead-2',
    jobberRequestId: 'JB-4822',
    title: 'Caughlin Ranch Master Bath Senior Grab Bars & Hand-Held Shower',
    homeowner: 'Arthur & Evelyn Gomez · Reno, NV',
    city: 'Reno, NV',
    category: 'Senior Safety',
    estimatedPrice: 1650,
    receivedAt: 'Today · 9:15 AM',
    summary: 'Install 3 brushed-nickel ADA grab bars into framing + slip-resistant shower bar and lever handles.'
  },
  {
    id: 'lead-3',
    jobberRequestId: 'JB-4823',
    title: 'Tahoe Vista Seasonal Winterization & Deck Rail Touch-Up',
    homeowner: 'Melissa Chen-Park · Lake Tahoe, NV',
    city: 'Lake Tahoe, NV',
    category: 'Maintenance Plan',
    estimatedPrice: 1340,
    receivedAt: 'Yesterday · 5:20 PM',
    summary: 'Blow out exterior spigots, clear pine needles from gutters, caulk trim gaps, and tighten deck rail posts.'
  }
];

const PROVIDER_META: Record<
  Integration['provider'],
  { label: string; description: string; icon: React.ReactNode }
> = {
  Jobber: {
    label: 'Jobber Dispatch & Estimates',
    description: 'Syncs homeowner requests, written estimates, SMS approvals, and daily technician routes.',
    icon: <Home size={16} className="text-emerald-400" />
  },
  QuickBooks: {
    label: 'QuickBooks Online',
    description: 'Syncs paid homeowner invoices, material receipts, and job-level gross margins.',
    icon: <FileSpreadsheet size={16} className="text-emerald-400" />
  },
  HomeDepotPro: {
    label: 'Home Depot Pro Xtra (Sparks)',
    description: 'Links Sparks Blvd will-call receipts and van stock restock lists to active service jobs.',
    icon: <Store size={16} className="text-amber-400" />
  },
  GoogleCalendar: {
    label: 'Google Calendar Dispatch',
    description: 'Mirrors arrival windows for Reno–Sparks, Carson City, and Lake Tahoe technicians.',
    icon: <Calendar size={16} className="text-sky-400" />
  }
};

const formatUSD = (v: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v);

const Settings: React.FC<SettingsProps> = ({
  integrations,
  onUpdateIntegrations,
  projects,
  onUpdateProjects,
  onOpenClientPreview
}) => {
  const [incomingLeads, setIncomingLeads] = useState<IncomingLead[]>(INITIAL_INCOMING_LEADS);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [webhookLog, setWebhookLog] = useState<string | null>(null);
  const [importNotice, setImportNotice] = useState<string | null>(null);

  // Client Preview Mode state
  const activeProjects = projects.filter((p) => !p.isArchived);
  const [clientPreviewEnabled, setClientPreviewEnabled] = useState<boolean>(true);
  const [previewLinks, setPreviewLinks] = useState<ClientPreviewLinkSummary[]>([]);
  const [selectedPreviewProjectId, setSelectedPreviewProjectId] = useState<string>(
    activeProjects[0]?.id || ''
  );
  const [expiryHours, setExpiryHours] = useState<24 | 72 | 168>(72);
  const [welcomeNote, setWelcomeNote] = useState<string>(
    'Thank you for choosing Sierra Home Pros! Track your scheduled crew visits and milestones here anytime.'
  );
  const [isGeneratingLink, setIsGeneratingLink] = useState<boolean>(false);
  const [isTogglingPreview, setIsTogglingPreview] = useState<boolean>(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [previewFeedback, setPreviewFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  useEffect(() => {
    if (!selectedPreviewProjectId && activeProjects.length > 0) {
      setSelectedPreviewProjectId(activeProjects[0].id);
    }
  }, [activeProjects, selectedPreviewProjectId]);

  useEffect(() => {
    let cancelled = false;
    async function loadPreviewLinks() {
      try {
        const res = await fetch('/api/client-preview/links');
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) {
          setClientPreviewEnabled(Boolean(data.enabled));
          setPreviewLinks(Array.isArray(data.links) ? data.links : []);
        }
      } catch {
        // Keep defaults if request fails transiently
      }
    }
    loadPreviewLinks();
    return () => {
      cancelled = true;
    };
  }, []);

  const buildShareUrl = (token: string) =>
    `${window.location.origin}/?clientPreview=${encodeURIComponent(token)}`;

  const handleToggleClientPreviewMode = async () => {
    const nextValue = !clientPreviewEnabled;
    setIsTogglingPreview(true);
    setPreviewFeedback(null);
    try {
      const res = await fetch('/api/client-preview/config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: nextValue })
      });
      if (!res.ok) throw new Error('Unable to update Client Preview setting.');
      const data = await res.json();
      setClientPreviewEnabled(Boolean(data.enabled));
      setPreviewFeedback({
        type: 'success',
        message: data.enabled
          ? 'Client Preview mode enabled. Temporary links are now active.'
          : 'Client Preview mode paused. Existing links are temporarily inaccessible to homeowners.'
      });
    } catch {
      setPreviewFeedback({
        type: 'error',
        message: 'Could not update Client Preview mode right now.'
      });
    } finally {
      setIsTogglingPreview(false);
    }
  };

  const handleGenerateClientLink = async () => {
    const project = activeProjects.find((p) => p.id === selectedPreviewProjectId);
    if (!project) {
      setPreviewFeedback({ type: 'error', message: 'Select an active project first.' });
      return;
    }

    setIsGeneratingLink(true);
    setPreviewFeedback(null);
    try {
      const projectMilestones = MOCK_TASKS.filter((t) => t.projectId === project.id).map((t) => ({
        id: t.id,
        title: t.title,
        assignee: t.assignee,
        start: t.start,
        end: t.end,
        status: t.status
      }));

      // Note: Internal financial fields (budget, spent, riskLevel) are intentionally omitted here
      // and strictly stripped on the server allowlist as well.
      const res = await fetch('/api/client-preview/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: project.id,
          projectName: project.name,
          clientName: project.client,
          serviceCategory: project.serviceCategory || 'Home Repair',
          locationName: project.locationName || 'Northern Nevada',
          status: project.status,
          startDate: project.startDate,
          endDate: project.endDate,
          completion: project.completion,
          assignedPM: project.assignedPM,
          welcomeNote,
          expiresInHours: expiryHours,
          milestones: projectMilestones
        })
      });

      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setPreviewFeedback({
          type: 'error',
          message: body?.error || 'Unable to generate temporary preview link.'
        });
        return;
      }

      const created = body as ClientPreviewLinkSummary;
      setPreviewLinks((prev) => [created, ...prev]);
      setPreviewFeedback({
        type: 'success',
        message: `Temporary ${expiryHours}-hour client preview link created for "${created.projectName}" with all internal financial data masked.`
      });
    } catch {
      setPreviewFeedback({
        type: 'error',
        message: 'Network error while generating temporary preview link.'
      });
    } finally {
      setIsGeneratingLink(false);
    }
  };

  const handleCopyPreviewLink = async (token: string) => {
    const url = buildShareUrl(token);
    try {
      await navigator.clipboard.writeText(url);
      setCopiedToken(token);
      setTimeout(() => setCopiedToken((curr) => (curr === token ? null : curr)), 2000);
    } catch {
      setPreviewFeedback({
        type: 'error',
        message: `Copy failed — share URL manually: ${url}`
      });
    }
  };

  const handleRevokePreviewLink = async (token: string) => {
    try {
      const res = await fetch(`/api/client-preview/links/${encodeURIComponent(token)}`, {
        method: 'DELETE'
      });
      if (!res.ok) return;
      setPreviewLinks((prev) => prev.filter((l) => l.token !== token));
      setPreviewFeedback({
        type: 'success',
        message: 'Temporary client link revoked immediately.'
      });
    } catch {
      setPreviewFeedback({
        type: 'error',
        message: 'Unable to revoke preview link.'
      });
    }
  };

  const [automations, setAutomations] = useState({
    autoWrittenEstimateReminder: true,
    tahoeFreezePaintAlert: true,
    smsArrivalWindow: true,
    seniorSafetyChecklistGate: true
  });

  const handleToggleConnection = (id: string) => {
    setSyncingId(id);
    setTimeout(() => {
      onUpdateIntegrations(
        integrations.map((intg) => {
          if (intg.id !== id) return intg;
          const nextStatus = intg.status === 'connected' ? 'disconnected' : 'connected';
          return {
            ...intg,
            status: nextStatus,
            lastSync: new Date().toISOString(),
            dataPoints: nextStatus === 'connected' ? intg.dataPoints + 14 : intg.dataPoints
          };
        })
      );
      setSyncingId(null);
    }, 500);
  };

  const handleSyncNow = (id: string) => {
    setSyncingId(id);
    setTimeout(() => {
      onUpdateIntegrations(
        integrations.map((intg) =>
          intg.id === id
            ? { ...intg, status: 'connected', lastSync: new Date().toISOString(), dataPoints: intg.dataPoints + 9 }
            : intg
        )
      );
      setSyncingId(null);
    }, 600);
  };

  const handleImportLead = (lead: IncomingLead) => {
    const newJob: ConstructionProject = {
      id: `p-${Date.now()}`,
      externalId: lead.jobberRequestId,
      name: lead.title,
      client: lead.homeowner,
      status: 'planning',
      budget: lead.estimatedPrice,
      spent: 0,
      startDate: '2026-11-24',
      endDate: '2026-11-26',
      completion: 0,
      riskLevel: lead.city.includes('Tahoe') ? 'medium' : 'low',
      serviceCategory: lead.category,
      locationName: lead.city,
      assignedPM: lead.category === 'Smart Home' ? 'pm-3' : 'pm-1',
      isArchived: false
    };
    onUpdateProjects([newJob, ...projects]);
    setIncomingLeads((prev) => prev.filter((l) => l.id !== lead.id));
    setImportNotice(`Imported "${lead.title}" (${lead.jobberRequestId}) into active Service Jobs.`);
    setTimeout(() => setImportNotice(null), 4000);
  };

  const handleTestWebhook = () => {
    setWebhookLog(
      `200 OK · Jobber Dispatch webhook verified for Sierra Home Pros (${COMPANY_INFO.headquarters}) at ${new Date().toLocaleTimeString()}`
    );
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-zinc-500 mb-1">
            <span>Sierra Home Pros</span>
            <span>·</span>
            <span>Sparks Operations · Connected Home-Service Tools</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100">Integrations & Dispatch Settings</h1>
        </div>
        <button
          onClick={handleTestWebhook}
          className="px-4 py-2 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-emerald-500/40 text-xs font-semibold text-zinc-200 flex items-center gap-2 self-start md:self-auto"
        >
          <Send size={13} className="text-emerald-400" /> Test Jobber Webhook
        </button>
      </div>

      {webhookLog && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 px-4 py-2.5 rounded-lg text-xs font-mono">
          {webhookLog}
        </div>
      )}

      {importNotice && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 px-4 py-2.5 rounded-lg text-xs flex items-center gap-2">
          <CheckCircle2 size={14} />
          {importNotice}
        </div>
      )}

      {/* Client Preview Mode & Temporary Shareable Link Generator */}
      <section className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800/70">
          <div className="space-y-1">
            <h2 className="text-base font-bold text-zinc-100 flex items-center gap-2">
              <Eye size={16} className="text-emerald-400" />
              Client Preview Mode
            </h2>
            <p className="text-xs text-zinc-400 leading-relaxed max-w-2xl">
              Generate temporary, read-only homeowner links for a specific service project. Internal job costs, actual spend, gross margins, and estimate pricing are automatically masked.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <span className={`text-xs font-semibold ${clientPreviewEnabled ? 'text-emerald-400' : 'text-zinc-400'}`}>
              {clientPreviewEnabled ? 'Sharing Enabled' : 'Sharing Paused'}
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={clientPreviewEnabled}
              aria-label="Toggle Client Preview mode"
              disabled={isTogglingPreview}
              onClick={handleToggleClientPreviewMode}
              className={`w-11 h-6 rounded-full transition-colors p-0.5 shrink-0 ${
                clientPreviewEnabled ? 'bg-emerald-600' : 'bg-zinc-700'
              } disabled:opacity-50`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  clientPreviewEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {previewFeedback && (
          <div
            className={`px-4 py-2.5 rounded-lg text-xs flex items-center gap-2 border ${
              previewFeedback.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-red-500/10 border-red-500/30 text-red-400'
            }`}
          >
            <CheckCircle2 size={14} className="shrink-0" />
            <span>{previewFeedback.message}</span>
          </div>
        )}

        {clientPreviewEnabled ? (
          <div className="space-y-5">
            {/* Link Generator Form */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-end">
              <div className="lg:col-span-5 space-y-1.5">
                <label htmlFor="client-preview-project" className="text-xs font-semibold text-zinc-300 block">
                  Select Service Project
                </label>
                <select
                  id="client-preview-project"
                  value={selectedPreviewProjectId}
                  onChange={(e) => setSelectedPreviewProjectId(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500"
                >
                  {activeProjects.map((proj) => (
                    <option key={proj.id} value={proj.id}>
                      {proj.name} — {proj.client}
                    </option>
                  ))}
                </select>
              </div>

              <div className="lg:col-span-4 space-y-1.5">
                <span className="text-xs font-semibold text-zinc-300 block">Link Expiration Window</span>
                <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-1 flex items-center gap-1">
                  {([
                    { hours: 24, label: '24 Hours' },
                    { hours: 72, label: '72 Hours' },
                    { hours: 168, label: '7 Days' }
                  ] as const).map((opt) => (
                    <button
                      key={opt.hours}
                      type="button"
                      onClick={() => setExpiryHours(opt.hours)}
                      className={`flex-1 py-1.5 px-2.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap ${
                        expiryHours === opt.hours
                          ? 'bg-emerald-600 text-white'
                          : 'text-zinc-400 hover:text-zinc-100'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-3">
                <button
                  type="button"
                  onClick={handleGenerateClientLink}
                  disabled={isGeneratingLink || activeProjects.length === 0}
                  className="w-full py-2 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
                >
                  <Link2 size={14} />
                  <span>{isGeneratingLink ? 'Generating...' : 'Generate Temporary Link'}</span>
                </button>
              </div>
            </div>

            {/* Optional Homeowner Note + Financial Masking Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              <div className="lg:col-span-7 space-y-1.5">
                <label htmlFor="client-preview-note" className="text-xs font-semibold text-zinc-300 block">
                  Homeowner Welcome Note (Optional)
                </label>
                <input
                  id="client-preview-note"
                  type="text"
                  maxLength={320}
                  value={welcomeNote}
                  onChange={(e) => setWelcomeNote(e.target.value)}
                  placeholder="Add a brief scheduling or crew note visible to the homeowner..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="lg:col-span-5 bg-zinc-950/60 border border-zinc-800/80 rounded-lg px-4 py-2.5 flex items-start gap-2.5">
                <EyeOff size={15} className="text-emerald-400 mt-0.5 shrink-0" />
                <div className="text-xs space-y-0.5">
                  <p className="font-semibold text-zinc-200">Financial Data Masking Active</p>
                  <p className="text-zinc-400 leading-relaxed">
                    Actual spend, gross margins, labor/material costs, and estimate dollar amounts are stripped server-side before delivery.
                  </p>
                </div>
              </div>
            </div>

            {/* Active Shareable Links List */}
            {previewLinks.length > 0 && (
              <div className="pt-4 border-t border-zinc-800/70 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-zinc-200">Generated Temporary Links</span>
                  <span className="text-zinc-400 font-mono tabular-nums">
                    {previewLinks.length} {previewLinks.length === 1 ? 'active link' : 'active links'}
                  </span>
                </div>

                <div className="divide-y divide-zinc-800/80 border border-zinc-800/80 rounded-xl bg-zinc-950/40 overflow-hidden">
                  {previewLinks.map((link) => {
                    const shareUrl = buildShareUrl(link.token);
                    const isCopied = copiedToken === link.token;
                    return (
                      <div
                        key={link.token}
                        className="p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                      >
                        <div className="min-w-0 space-y-1">
                          <div className="flex flex-wrap items-center gap-2 text-xs">
                            <span className="font-semibold text-zinc-100 truncate">{link.projectName}</span>
                            <span className="text-zinc-500" aria-hidden="true">·</span>
                            <span className="text-zinc-400">{link.clientName}</span>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 text-[11px] text-zinc-400 font-mono tabular-nums">
                            <span className="inline-flex items-center gap-1">
                              <Clock size={11} className="text-emerald-400" />
                              Expires {new Date(link.expiresAt).toLocaleString([], {
                                month: 'short',
                                day: 'numeric',
                                hour: 'numeric',
                                minute: '2-digit'
                              })}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span>Financials masked</span>
                            <span aria-hidden="true">·</span>
                            <span>{link.viewCount} {link.viewCount === 1 ? 'view' : 'views'}</span>
                          </div>
                          <p className="text-[11px] font-mono text-zinc-500 truncate max-w-xl">
                            {shareUrl}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleCopyPreviewLink(link.token)}
                            className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-xs font-semibold text-zinc-200 flex items-center gap-1.5 whitespace-nowrap"
                          >
                            {isCopied ? (
                              <>
                                <Check size={13} className="text-emerald-400" />
                                <span>Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy size={13} />
                                <span>Copy Link</span>
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => onOpenClientPreview(link.token)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap"
                          >
                            <ExternalLink size={13} />
                            <span>Open Preview</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleRevokePreviewLink(link.token)}
                            className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-red-500/40 text-zinc-400 hover:text-red-400 transition-colors"
                            title="Revoke temporary link"
                            aria-label={`Revoke link for ${link.projectName}`}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-zinc-400">
            <p>
              Client Preview mode is paused. Enable the toggle above to generate temporary homeowner links or restore access to active links.
            </p>
            {previewLinks.length > 0 && (
              <span className="font-mono tabular-nums text-zinc-500 shrink-0">
                {previewLinks.length} paused {previewLinks.length === 1 ? 'link' : 'links'}
              </span>
            )}
          </div>
        )}
      </section>

      {/* Connected Apps Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {integrations.map((intg) => {
          const meta = PROVIDER_META[intg.provider];
          const isSyncing = syncingId === intg.id;
          const isConnected = intg.status === 'connected';
          return (
            <div
              key={intg.id}
              className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-5 flex flex-col justify-between gap-4"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-center">
                    {meta.icon}
                  </div>
                  <span
                    className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                      isConnected ? 'bg-emerald-500/15 text-emerald-300' : 'bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    {isConnected ? 'Connected' : 'Disconnected'}
                  </span>
                </div>
                <h2 className="text-sm font-bold text-zinc-100 mt-3">{meta.label}</h2>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{meta.description}</p>
              </div>

              <div className="pt-3 border-t border-zinc-800/70 space-y-3">
                <div className="flex items-center justify-between text-[11px] text-zinc-500 font-mono tabular-nums">
                  <span>{intg.dataPoints} records synced</span>
                  <span>{new Date(intg.lastSync).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleSyncNow(intg.id)}
                    disabled={isSyncing}
                    className="flex-1 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-xs font-medium text-zinc-200 flex items-center justify-center gap-1.5"
                  >
                    <RefreshCw size={12} className={isSyncing ? 'animate-spin text-emerald-400' : ''} />
                    Sync Now
                  </button>
                  <button
                    onClick={() => handleToggleConnection(intg.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                      isConnected
                        ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    }`}
                  >
                    {isConnected ? 'Pause' : 'Connect'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Incoming Homeowner Estimate Requests from Jobber / sierrahomepros.com */}
      <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
              <Link2 size={15} className="text-emerald-400" />
              Incoming Homeowner Estimate Requests (sierrahomepros.com & Jobber)
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Import verified Northern Nevada homeowner inquiries directly into active Service Jobs.
            </p>
          </div>
          <span className="text-xs font-mono text-emerald-400">{incomingLeads.length} pending import</span>
        </div>

        {incomingLeads.length === 0 ? (
          <p className="text-xs text-zinc-500 py-6 text-center">
            All incoming homeowner requests have been imported into your Service Jobs schedule.
          </p>
        ) : (
          <div className="space-y-2.5">
            {incomingLeads.map((lead) => (
              <div
                key={lead.id}
                className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-[11px] text-zinc-400">
                    <span className="font-mono text-emerald-400 font-semibold">{lead.jobberRequestId}</span>
                    <span>·</span>
                    <span>{lead.category}</span>
                    <span>·</span>
                    <span>{lead.receivedAt}</span>
                  </div>
                  <h3 className="text-sm font-semibold text-zinc-100">{lead.title}</h3>
                  <p className="text-xs text-zinc-400">{lead.homeowner}</p>
                  <p className="text-xs text-zinc-500">{lead.summary}</p>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right font-mono tabular-nums">
                    <p className="text-sm font-bold text-zinc-100">{formatUSD(lead.estimatedPrice)}</p>
                    <p className="text-[11px] text-zinc-500">Est. range</p>
                  </div>
                  <button
                    onClick={() => handleImportLead(lead)}
                    className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5"
                  >
                    <Plus size={14} /> Import Job
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sierra AI & Dispatch Automations */}
      <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-5 space-y-4">
        <h2 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
          <Sparkles size={15} className="text-emerald-400" />
          Sierra Operations Automations
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {(
            [
              {
                key: 'autoWrittenEstimateReminder',
                title: 'Upfront Written Estimate Gate',
                desc: 'Prompt technicians to collect SMS written approval before starting any on-site add-on.'
              },
              {
                key: 'tahoeFreezePaintAlert',
                title: 'Lake Tahoe Paint-Cure Weather Alerts',
                desc: 'Flag exterior painting & deck staining jobs when overnight Tahoe lows dip below 38°F.'
              },
              {
                key: 'smsArrivalWindow',
                title: '30-Minute On-My-Way Homeowner SMS',
                desc: 'Automatically notify homeowners in Reno, Sparks, Carson City & Tahoe when their van departs.'
              },
              {
                key: 'seniorSafetyChecklistGate',
                title: 'Senior Safety Stud-Anchor Photo Check',
                desc: 'Require pull-load verification photos before closing ADA grab-bar or threshold-ramp visits.'
              }
            ] as const
          ).map((item) => {
            const enabled = automations[item.key];
            return (
              <div
                key={item.key}
                className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800/80 flex items-start justify-between gap-4"
              >
                <div>
                  <p className="text-xs font-semibold text-zinc-100">{item.title}</p>
                  <p className="text-[11px] text-zinc-500 mt-1 leading-relaxed">{item.desc}</p>
                </div>
                <button
                  onClick={() => setAutomations((prev) => ({ ...prev, [item.key]: !prev[item.key] }))}
                  className={`w-10 h-5 rounded-full transition-colors p-0.5 shrink-0 ${
                    enabled ? 'bg-emerald-600' : 'bg-zinc-700'
                  }`}
                  aria-label={`Toggle ${item.title}`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white transition-transform ${
                      enabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Company Profile Footer */}
      <div className="bg-zinc-900/40 border border-zinc-800/70 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 text-xs text-zinc-400">
        <div className="flex items-center gap-2">
          <ShieldCheck size={15} className="text-emerald-400" />
          <span className="font-semibold text-zinc-200">{COMPANY_INFO.legalName}</span>
          <span>·</span>
          <span>{COMPANY_INFO.headquarters}</span>
          <span>·</span>
          <span>{COMPANY_INFO.serviceAreas.join(' · ')}</span>
        </div>
        <div className="font-mono text-zinc-300">
          {COMPANY_INFO.phone} · {COMPANY_INFO.email}
        </div>
      </div>
    </div>
  );
};

export default Settings;
