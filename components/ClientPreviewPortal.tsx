import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  EyeOff,
  Lock,
  Mail,
  MapPin,
  Moon,
  Phone,
  ShieldCheck,
  Sun,
  UserCheck,
  Wrench
} from 'lucide-react';
import { ClientPreviewPayload } from '../types';
import { COMPANY_INFO } from '../constants';

interface ClientPreviewPortalProps {
  token: string;
  theme: 'light' | 'dark';
  onToggleTheme: (next: 'light' | 'dark') => void;
  canReturnToAdmin: boolean;
  onExitPreview: () => void;
}

const STATUS_LABELS: Record<ClientPreviewPayload['status'], string> = {
  planning: 'Scheduled',
  active: 'In Progress',
  completed: 'Completed',
  'on-hold': 'Weather / Schedule Hold'
};

const MILESTONE_LABELS: Record<'todo' | 'in-progress' | 'done', string> = {
  done: 'Completed',
  'in-progress': 'In Progress',
  todo: 'Scheduled'
};

function formatFriendlyDate(dateStr: string): string {
  if (!dateStr) return 'TBD';
  const parsed = new Date(dateStr.includes('T') ? dateStr : `${dateStr}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return dateStr;
  return parsed.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

function formatExpiry(iso: string): string {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return 'Temporary link';
  return parsed.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
}

const ClientPreviewPortal: React.FC<ClientPreviewPortalProps> = ({
  token,
  theme,
  onToggleTheme,
  canReturnToAdmin,
  onExitPreview
}) => {
  const [data, setData] = useState<ClientPreviewPayload | null>(null);
  const [error, setError] = useState<{ message: string; reason?: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadPreview() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/client-preview/view/${encodeURIComponent(token)}`, {
          cache: 'no-store'
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) {
          if (!cancelled) {
            setData(null);
            setError({
              message: body?.error || 'This temporary client preview link is unavailable.',
              reason: body?.reason
            });
          }
          return;
        }
        if (!cancelled) {
          setData(body as ClientPreviewPayload);
        }
      } catch {
        if (!cancelled) {
          setError({
            message: 'Unable to load project preview right now. Please try again shortly.'
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadPreview();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const completedCount = data ? data.milestones.filter((m) => m.status === 'done').length : 0;
  const totalMilestones = data ? data.milestones.length : 0;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col transition-colors">
      {/* Top Bar — 3-Zone Contract */}
      <header className="border-b border-zinc-800/80 bg-zinc-900/95 backdrop-blur-xl sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between gap-6">
          <div className="flex items-center gap-3 shrink-0">
            <div className="rounded-lg bg-[#FAF8F5] border border-zinc-800/40 px-2.5 py-1.5 flex items-center">
              <img
                src="/assets/aistudio/image_3d60c98b.png"
                alt="Sierra Home Pros"
                referrerPolicy="no-referrer"
                className="h-7 w-auto object-contain"
              />
            </div>
          </div>

          <div className="hidden md:flex items-center gap-2 text-xs text-zinc-400 truncate">
            <span className="font-semibold text-zinc-200 whitespace-nowrap">Homeowner Project View</span>
            <span aria-hidden="true">·</span>
            <span className="whitespace-nowrap">Read-Only Progress Link</span>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <div
              className="flex items-center bg-zinc-950 border border-zinc-800 rounded-lg p-0.5"
              role="group"
              aria-label="Color theme"
            >
              <button
                onClick={() => onToggleTheme('light')}
                className={`px-2 py-1 rounded-md text-xs font-semibold flex items-center gap-1 transition-colors whitespace-nowrap shrink-0 ${
                  theme === 'light'
                    ? 'bg-sierra-navy text-white'
                    : 'text-zinc-400 hover:text-zinc-100'
                }`}
                aria-label="Light mode"
              >
                <Sun size={13} />
              </button>
              <button
                onClick={() => onToggleTheme('dark')}
                className={`px-2 py-1 rounded-md text-xs font-semibold flex items-center gap-1 transition-colors whitespace-nowrap shrink-0 ${
                  theme === 'dark'
                    ? 'bg-emerald-600 text-white'
                    : 'text-zinc-400 hover:text-zinc-100'
                }`}
                aria-label="Dark mode"
              >
                <Moon size={13} />
              </button>
            </div>

            {canReturnToAdmin ? (
              <button
                onClick={onExitPreview}
                className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
              >
                <ArrowLeft size={14} />
                <span>Exit Client Preview</span>
              </button>
            ) : (
              <a
                href={`tel:${COMPANY_INFO.phone.replace(/[^0-9]/g, '')}`}
                className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 font-mono tabular-nums"
              >
                <Phone size={13} />
                <span>{COMPANY_INFO.phone}</span>
              </a>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-10">
        {loading ? (
          <div className="space-y-6 animate-pulse">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 space-y-4">
              <div className="h-3 w-48 bg-zinc-800 rounded" />
              <div className="h-8 w-2/3 bg-zinc-800 rounded" />
              <div className="h-4 w-1/2 bg-zinc-800 rounded" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[0, 1, 2, 3].map((idx) => (
                <div key={idx} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 h-24" />
              ))}
            </div>
          </div>
        ) : error || !data ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-10 text-center max-w-xl mx-auto mt-8 space-y-5">
            <div className="w-12 h-12 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center mx-auto">
              <Lock size={20} className="text-emerald-400" />
            </div>
            <div className="space-y-2">
              <h1 className="text-xl font-bold text-zinc-100">
                {error?.reason === 'expired'
                  ? 'Temporary Preview Link Expired'
                  : error?.reason === 'disabled'
                  ? 'Client Preview Temporarily Paused'
                  : 'Preview Link Unavailable'}
              </h1>
              <p className="text-sm text-zinc-400 leading-relaxed">
                {error?.message || 'This temporary shareable link is no longer active.'}
              </p>
            </div>
            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              {canReturnToAdmin && (
                <button
                  onClick={onExitPreview}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5"
                >
                  <ArrowLeft size={14} />
                  <span>Return to Settings</span>
                </button>
              )}
              <a
                href={`tel:${COMPANY_INFO.phone.replace(/[^0-9]/g, '')}`}
                className="px-4 py-2 rounded-lg bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-xs font-semibold text-zinc-200 flex items-center gap-1.5"
              >
                <Phone size={13} className="text-emerald-400" />
                <span>Call {COMPANY_INFO.phone}</span>
              </a>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Project Hero Summary */}
            <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sm:p-8 space-y-6">
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                <div className="space-y-2 max-w-2xl">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400">
                    <span>{data.serviceCategory}</span>
                    <span aria-hidden="true">·</span>
                    <span>{data.locationName}</span>
                    <span aria-hidden="true">·</span>
                    <span>Prepared for {data.clientName}</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-100 [text-wrap:balance]">
                    {data.projectName}
                  </h1>
                </div>

                <div className="text-left lg:text-right shrink-0">
                  <p className="text-xs text-zinc-400">Overall Progress</p>
                  <p className="text-3xl font-bold font-mono tabular-nums text-zinc-100 mt-0.5">
                    {data.completion}%
                  </p>
                  <p className="text-xs font-semibold text-emerald-400 mt-0.5">
                    {STATUS_LABELS[data.status]}
                  </p>
                </div>
              </div>

              {/* Clean Progress Bar */}
              <div className="space-y-2">
                <div className="w-full h-2.5 bg-zinc-950 border border-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-600 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, Math.max(0, data.completion))}%` }}
                  />
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-400 font-mono tabular-nums">
                  <span>Start: {formatFriendlyDate(data.startDate)}</span>
                  <span>Target Completion: {formatFriendlyDate(data.endDate)}</span>
                </div>
              </div>

              {data.welcomeNote && (
                <div className="pt-4 border-t border-zinc-800/80">
                  <p className="text-xs font-semibold text-zinc-300 mb-1">Note from Sierra Home Pros</p>
                  <p className="text-sm text-zinc-300 leading-relaxed">{data.welcomeNote}</p>
                </div>
              )}
            </section>

            {/* 4-Column Project Facts Strip (Zero Internal Financials) */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-1.5">
                <div className="flex items-center gap-2 text-xs text-zinc-400">
                  <UserCheck size={14} className="text-emerald-400" />
                  <span>Lead Technician</span>
                </div>
                <p className="text-sm font-semibold text-zinc-100">{data.leadTechnician}</p>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-1.5">
                <div className="flex items-center gap-2 text-xs text-zinc-400">
                  <Calendar size={14} className="text-emerald-400" />
                  <span>Service Window</span>
                </div>
                <p className="text-sm font-semibold text-zinc-100 font-mono tabular-nums">
                  {formatFriendlyDate(data.startDate)} – {formatFriendlyDate(data.endDate)}
                </p>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-1.5">
                <div className="flex items-center gap-2 text-xs text-zinc-400">
                  <Wrench size={14} className="text-emerald-400" />
                  <span>Completed Steps</span>
                </div>
                <p className="text-sm font-semibold text-zinc-100 font-mono tabular-nums">
                  {totalMilestones > 0 ? `${completedCount} of ${totalMilestones} tasks` : `${data.completion}% complete`}
                </p>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-1.5">
                <div className="flex items-center gap-2 text-xs text-zinc-400">
                  <EyeOff size={14} className="text-emerald-400" />
                  <span>Estimate & Billing</span>
                </div>
                <p className="text-sm font-semibold text-zinc-100">{data.estimateStatus}</p>
                <p className="text-[11px] text-zinc-400">Internal cost data hidden</p>
              </div>
            </section>

            {/* Milestones & Work Scope */}
            <section className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
              <div className="px-6 py-5 border-b border-zinc-800/80 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-base font-bold text-zinc-100">Scheduled Work & Milestones</h2>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Live progress checklist for your home service visit
                  </p>
                </div>
                <span className="text-xs text-zinc-400 font-mono tabular-nums">
                  {totalMilestones} {totalMilestones === 1 ? 'milestone' : 'milestones'}
                </span>
              </div>

              {data.milestones.length === 0 ? (
                <div className="px-6 py-10 text-center space-y-1">
                  <p className="text-sm font-medium text-zinc-200">
                    Your service scope is confirmed and assigned to {data.leadTechnician}.
                  </p>
                  <p className="text-xs text-zinc-400">
                    Detailed visit milestones will appear here as your technician checks in on site.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-zinc-800/80">
                  {data.milestones.map((item) => (
                    <div
                      key={item.id}
                      className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="mt-0.5 shrink-0">
                          {item.status === 'done' ? (
                            <CheckCircle2 size={16} className="text-emerald-400" />
                          ) : item.status === 'in-progress' ? (
                            <Clock size={16} className="text-amber-400" />
                          ) : (
                            <Calendar size={16} className="text-zinc-500" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-zinc-100">{item.title}</p>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400 mt-0.5">
                            <span>Assigned to {item.assignee}</span>
                            {item.start && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span className="font-mono tabular-nums">
                                  {formatFriendlyDate(item.start)}
                                  {item.end && item.end !== item.start ? ` – ${formatFriendlyDate(item.end)}` : ''}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <span
                        className={`text-xs font-semibold shrink-0 whitespace-nowrap ${
                          item.status === 'done'
                            ? 'text-emerald-400'
                            : item.status === 'in-progress'
                            ? 'text-amber-400'
                            : 'text-zinc-400'
                        }`}
                      >
                        {MILESTONE_LABELS[item.status]}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Homeowner Support & Privacy Footer Card */}
            <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-5">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm font-bold text-zinc-100">
                  <ShieldCheck size={16} className="text-emerald-400" />
                  <span>Questions about your visit?</span>
                </div>
                <p className="text-xs text-zinc-400">
                  Reach our {COMPANY_INFO.headquarters} dispatch desk directly for scheduling updates or written estimate copies.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-200">
                <a
                  href={`tel:${COMPANY_INFO.phone.replace(/[^0-9]/g, '')}`}
                  className="flex items-center gap-1.5 hover:text-emerald-400 transition-colors font-mono tabular-nums whitespace-nowrap"
                >
                  <Phone size={13} className="text-emerald-400" />
                  <span>{COMPANY_INFO.phone}</span>
                </a>
                <a
                  href={`mailto:${COMPANY_INFO.email}`}
                  className="flex items-center gap-1.5 hover:text-emerald-400 transition-colors whitespace-nowrap"
                >
                  <Mail size={13} className="text-emerald-400" />
                  <span>{COMPANY_INFO.email}</span>
                </a>
                <span className="flex items-center gap-1.5 text-zinc-400 whitespace-nowrap">
                  <MapPin size={13} />
                  <span>{COMPANY_INFO.headquarters}</span>
                </span>
              </div>
            </section>
          </div>
        )}
      </main>

      {/* Quiet Footer */}
      <footer className="border-t border-zinc-800/80 py-5 px-6">
        <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs text-zinc-500">
          <span>{COMPANY_INFO.legalName} · {COMPANY_INFO.serviceAreas.join(' · ')}</span>
          {data && (
            <span className="font-mono tabular-nums">
              Temporary preview expires {formatExpiry(data.expiresAt)}
            </span>
          )}
        </div>
      </footer>
    </div>
  );
};

export default ClientPreviewPortal;
