import React, { useState, useMemo } from 'react';
import { ConstructionProject } from '../types';
import { 
  AlertTriangle, 
  CheckCircle2, 
  MapPin, 
  ArrowUpRight, 
  ClipboardCheck,
  ShieldAlert
} from 'lucide-react';

interface DailyHuddleSummaryProps {
  projects: ConstructionProject[];
  onUpdateProjects?: (projects: ConstructionProject[]) => void;
}

interface PriorityCardData {
  project: ConstructionProject;
  priorityRank: number;
  priorityScore: number;
  budgetUtilization: number;
  burnVariance: number;
  remainingBudget: number;
  budgetHealth: 'Margin Tight' | 'Watch Costs' | 'Healthy Margin';
  primaryDriver: string;
  huddleDirective: string;
  actionItems: string[];
  serviceFocus: string;
}

const formatUSD = (val: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(val);

export const DailyHuddleSummary: React.FC<DailyHuddleSummaryProps> = ({ 
  projects,
  onUpdateProjects 
}) => {
  const [checkedActions, setCheckedActions] = useState<Record<string, boolean>>({});
  const [acknowledgedIds, setAcknowledgedIds] = useState<string[]>([]);
  const [huddleFilter, setHuddleFilter] = useState<'combined' | 'risk' | 'budget'>('combined');

  const topPriorities: PriorityCardData[] = useMemo(() => {
    const scored = projects.map((project) => {
      const budgetUtilization = project.budget > 0 ? (project.spent / project.budget) * 100 : 0;
      const burnVariance = budgetUtilization - project.completion;
      const remainingBudget = Math.max(0, project.budget - project.spent);

      const riskPoints = project.riskLevel === 'high' ? 50 : project.riskLevel === 'medium' ? 28 : 10;
      const statusPoints = project.status === 'on-hold' ? 18 : project.status === 'active' ? 14 : 5;
      const utilizationPoints = Math.min(40, budgetUtilization * 0.35);
      const variancePoints = burnVariance > 0 ? Math.min(30, burnVariance * 1.4) : 0;

      let totalScore = riskPoints + statusPoints + utilizationPoints + variancePoints;
      if (huddleFilter === 'risk') {
        totalScore = riskPoints * 1.8 + statusPoints + variancePoints * 0.5;
      } else if (huddleFilter === 'budget') {
        totalScore = utilizationPoints * 1.8 + variancePoints * 1.8 + riskPoints * 0.4;
      }

      const budgetHealth: PriorityCardData['budgetHealth'] =
        budgetUtilization >= 85 || burnVariance >= 10
          ? 'Margin Tight'
          : budgetUtilization >= 60 || burnVariance > 2
          ? 'Watch Costs'
          : 'Healthy Margin';

      const serviceFocus = project.serviceCategory || 'Handyman Repair';
      let primaryDriver = '';
      let huddleDirective = '';
      let actionItems: string[] = [];

      if (serviceFocus === 'Interior/Exterior Painting' || project.riskLevel === 'high') {
        primaryDriver = `${budgetUtilization.toFixed(0)}% of the ${formatUSD(project.budget)} written estimate used at ${project.completion}% completion (${burnVariance >= 0 ? `+${burnVariance.toFixed(0)}%` : `${burnVariance.toFixed(0)}%`} cost pace).`;
        huddleDirective = 'Lock the warm midday Tahoe sun window and finish trim & deck coats in one consolidated crew visit.';
        actionItems = [
          `Protect remaining ${formatUSD(remainingBudget)} margin by pairing 2 painters for final coat`,
          'Verify Sherwin-Williams cold-cure stain tint and surface moisture (<15%)',
          'Text homeowner arrival window and clear deck furniture ahead of finish coat'
        ];
      } else if (serviceFocus === 'Senior Safety') {
        primaryDriver = `Medium priority safety install with ${formatUSD(project.spent)} spent of ${formatUSD(project.budget)} written estimate (${project.completion}% done).`;
        huddleDirective = 'Pick up the beveled doorway ramp in Sparks before 8 AM so safety rails and lighting wrap up together.';
        actionItems = [
          'Load ADA threshold ramp & lever handles from Sparks supply before dispatch',
          'Run 250-lb pull test on all primary bathroom stainless grab bar anchors',
          'Complete homeowner safety walk-through and verify motion hallway lighting'
        ];
      } else if (serviceFocus === 'Handyman Repair') {
        primaryDriver = `Repair punch list at ${budgetUtilization.toFixed(0)}% of estimate (${formatUSD(remainingBudget)} left) with ${project.completion}% completed.`;
        huddleDirective = 'Approve the extra pantry door repair with a written add-on price before starting additional work.';
        actionItems = [
          'Send $145 written SMS estimate add-on for pantry bifold track replacement',
          'Match orange-peel drywall texture and prime hallway patch before lunch',
          'Verify shoe covers, drop cloths, and clean sweep before sign-off'
        ];
      } else if (serviceFocus === 'Smart Home') {
        primaryDriver = `On-schedule smart-home upgrade with ${formatUSD(remainingBudget)} remaining in the ${formatUSD(project.budget)} written estimate.`;
        huddleDirective = 'Verify C-wire power at the thermostat and pair all cameras and smart deadbolts on the homeowner Wi-Fi.';
        actionItems = [
          'Test doorbell transformer voltage and chime compatibility prior to mounting',
          'Configure homeowner app access, backup PIN codes, and motion zones',
          'Leave printed quick-start card and reset codes with homeowner'
        ];
      } else {
        primaryDriver = `Recurring seasonal maintenance plan running cleanly at ${budgetUtilization.toFixed(0)}% of budget (${project.completion}% complete).`;
        huddleDirective = 'Finish winterization checklist before overnight Carson City freezes hit outdoor spigots.';
        actionItems = [
          'Flush gutters, check downspouts, and install insulated hose bib covers',
          'Replace HVAC MERV-11 filters and test all smoke/CO detector batteries',
          'Log photos and next spring visit reminder in homeowner maintenance file'
        ];
      }

      return {
        project,
        priorityRank: 0,
        priorityScore: Math.min(99, Math.round(totalScore)),
        budgetUtilization,
        burnVariance,
        remainingBudget,
        budgetHealth,
        primaryDriver,
        huddleDirective,
        actionItems,
        serviceFocus
      };
    });

    return scored
      .sort((a, b) => b.priorityScore - a.priorityScore)
      .slice(0, 3)
      .map((item, idx) => ({
        ...item,
        priorityRank: idx + 1
      }));
  }, [projects, huddleFilter]);

  const toggleActionCheck = (key: string) => {
    setCheckedActions(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const toggleAcknowledge = (projectId: string) => {
    setAcknowledgedIds(prev =>
      prev.includes(projectId)
        ? prev.filter(id => id !== projectId)
        : [...prev, projectId]
    );
  };

  const handleMitigateRisk = (project: ConstructionProject) => {
    if (!onUpdateProjects) return;
    const nextRisk: ConstructionProject['riskLevel'] =
      project.riskLevel === 'high' ? 'medium' : 'low';
    const updated = projects.map(p =>
      p.id === project.id ? { ...p, riskLevel: nextRisk } : p
    );
    onUpdateProjects(updated);
    if (!acknowledgedIds.includes(project.id)) {
      setAcknowledgedIds(prev => [...prev, project.id]);
    }
  };

  const totalTopBudget = topPriorities.reduce((acc, item) => acc + item.project.budget, 0);
  const totalTopSpent = topPriorities.reduce((acc, item) => acc + item.project.spent, 0);
  const highRiskCount = topPriorities.filter(i => i.project.riskLevel === 'high').length;

  return (
    <section className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 lg:p-8">
      {/* Header Row */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 pb-6 border-b border-zinc-800">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400 mb-1.5">
            <span className="font-semibold text-emerald-400">Morning Dispatch Huddle</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">
              {acknowledgedIds.length}/{topPriorities.length} jobs briefed
            </span>
            {highRiskCount > 0 && (
              <>
                <span aria-hidden="true">·</span>
                <span className="text-red-400 font-medium inline-flex items-center gap-1">
                  <AlertTriangle size={12} /> {highRiskCount} urgent review
                </span>
              </>
            )}
          </div>
          <h3 className="text-xl font-bold text-zinc-100 tracking-tight">
            Top 3 Service Job Priorities
          </h3>
          <p className="text-sm text-zinc-400 mt-1">
            Ranked daily by job risk, weather hold status, and written-estimate margin across Reno–Sparks, Carson City, and Lake Tahoe.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4 self-stretch lg:self-auto justify-between lg:justify-end">
          <div className="bg-zinc-950 p-1 rounded-xl border border-zinc-800 flex items-center gap-1">
            {([
              { id: 'combined', label: 'Combined' },
              { id: 'risk', label: 'Risk Level' },
              { id: 'budget', label: 'Estimate Margin' }
            ] as const).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setHuddleFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                  huddleFilter === tab.id
                    ? 'bg-emerald-600 text-white'
                    : 'text-zinc-400 hover:text-zinc-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="text-right font-mono tabular-nums">
            <p className="text-[11px] text-zinc-500">Top 3 Cost vs. Estimate</p>
            <p className="text-sm font-bold text-zinc-100">
              {formatUSD(totalTopSpent)}{' '}
              <span className="text-zinc-500 font-normal">/ {formatUSD(totalTopBudget)}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Top 3 Priority Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {topPriorities.map((item) => {
          const {
            project,
            priorityRank,
            budgetUtilization,
            burnVariance,
            remainingBudget,
            budgetHealth,
            primaryDriver,
            huddleDirective,
            actionItems,
            serviceFocus
          } = item;

          const isAcknowledged = acknowledgedIds.includes(project.id);
          const completedChecklistCount = actionItems.filter(
            (_, idx) => checkedActions[`${project.id}-${idx}`]
          ).length;

          const riskTextColor =
            project.riskLevel === 'high'
              ? 'text-red-400'
              : project.riskLevel === 'medium'
              ? 'text-amber-400'
              : 'text-emerald-400';

          const cardBorder = isAcknowledged
            ? 'border-emerald-500/40'
            : project.riskLevel === 'high'
            ? 'border-red-500/35 hover:border-red-500/60'
            : project.riskLevel === 'medium'
            ? 'border-amber-500/30 hover:border-amber-500/50'
            : 'border-zinc-800 hover:border-zinc-700';

          return (
            <article
              key={project.id}
              className={`bg-zinc-950 border ${cardBorder} rounded-2xl p-5 flex flex-col justify-between transition-colors`}
            >
              <div>
                {/* Clean quiet metadata kicker (no pill sandwich) */}
                <div className="flex items-center justify-between gap-2 text-xs mb-2">
                  <div className="flex items-center gap-2 text-zinc-400 min-w-0">
                    <span className="font-mono font-bold text-zinc-100">0{priorityRank}.</span>
                    <span className="truncate">{serviceFocus}</span>
                    <span aria-hidden="true">·</span>
                    <span className="inline-flex items-center gap-1 text-zinc-500 shrink-0">
                      <MapPin size={11} />
                      {project.locationName || 'Sparks, NV'}
                    </span>
                  </div>

                  <span className={`font-semibold inline-flex items-center gap-1 shrink-0 capitalize ${riskTextColor}`}>
                    <ShieldAlert size={12} />
                    {project.riskLevel} risk
                  </span>
                </div>

                {/* Job Title & Homeowner */}
                <h4 className="text-base font-bold text-zinc-100 leading-snug">
                  {project.name}
                </h4>
                <p className="text-xs text-zinc-500 mt-1 truncate">
                  {project.client}
                </p>

                {/* Financial & Progress Metrics */}
                <div className="mt-4 pt-4 border-t border-zinc-800/80 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-400 font-medium">Written Estimate Status</span>
                    <span
                      className={`font-semibold ${
                        budgetHealth === 'Margin Tight'
                          ? 'text-red-400'
                          : budgetHealth === 'Watch Costs'
                          ? 'text-amber-400'
                          : 'text-emerald-400'
                      }`}
                    >
                      {budgetHealth}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-xs font-mono tabular-nums">
                    <div>
                      <p className="text-[11px] text-zinc-500 font-sans">Cost / Quote</p>
                      <p className="font-bold text-zinc-100 mt-0.5">
                        {formatUSD(project.spent)}
                        <span className="text-zinc-500 font-normal">/{formatUSD(project.budget)}</span>
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] text-zinc-500 font-sans">Cost vs. Done</p>
                      <p
                        className={`font-bold mt-0.5 ${
                          burnVariance > 8
                            ? 'text-red-400'
                            : burnVariance > 0
                            ? 'text-amber-400'
                            : 'text-emerald-400'
                        }`}
                      >
                        {budgetUtilization.toFixed(0)}% / {project.completion}%
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[11px] text-zinc-500 font-sans">Remaining</p>
                      <p className="font-bold text-emerald-400 mt-0.5">
                        {formatUSD(remainingBudget)}
                      </p>
                    </div>
                  </div>

                  {/* Dual Progress Bars */}
                  <div className="space-y-2 pt-1">
                    <div>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-zinc-400">Budget Used</span>
                        <span className="font-mono tabular-nums text-zinc-200">
                          {budgetUtilization.toFixed(0)}%
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            budgetUtilization >= 85
                              ? 'bg-red-500'
                              : budgetUtilization >= 60
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min(100, budgetUtilization)}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-zinc-500">Work Completed</span>
                        <span className="font-mono tabular-nums text-emerald-400">
                          {project.completion}%
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(100, project.completion)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Huddle Directive */}
                <div className="mt-4 pt-4 border-t border-zinc-800/80 space-y-1.5">
                  <p className="text-xs font-semibold text-zinc-200 leading-relaxed">
                    {huddleDirective}
                  </p>
                  <p className="text-xs text-zinc-500 leading-relaxed">
                    {primaryDriver}
                  </p>
                </div>

                {/* Checklist */}
                <div className="mt-4 pt-4 border-t border-zinc-800/80 space-y-2 mb-5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-400 font-medium inline-flex items-center gap-1.5">
                      <ClipboardCheck size={13} /> Crew Checklist
                    </span>
                    <span className="font-mono tabular-nums text-zinc-500">
                      {completedChecklistCount}/{actionItems.length}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    {actionItems.map((action, idx) => {
                      const key = `${project.id}-${idx}`;
                      const isDone = !!checkedActions[key];
                      return (
                        <button
                          key={key}
                          onClick={() => toggleActionCheck(key)}
                          className={`w-full text-left py-2 px-2.5 rounded-lg text-xs flex items-start gap-2 transition-colors ${
                            isDone
                              ? 'bg-emerald-500/10 text-zinc-400 line-through'
                              : 'bg-zinc-900/70 text-zinc-300 hover:bg-zinc-900'
                          }`}
                        >
                          <CheckCircle2
                            size={14}
                            className={`mt-0.5 shrink-0 ${
                              isDone ? 'text-emerald-400' : 'text-zinc-600'
                            }`}
                          />
                          <span className="leading-snug">{action}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="pt-4 border-t border-zinc-800/80 flex items-center gap-2">
                <button
                  onClick={() => toggleAcknowledge(project.id)}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-colors whitespace-nowrap ${
                    isAcknowledged
                      ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-200 hover:border-zinc-700'
                  }`}
                >
                  <CheckCircle2 size={14} />
                  {isAcknowledged ? 'Briefed' : 'Mark Briefed'}
                </button>

                {project.riskLevel !== 'low' && onUpdateProjects && (
                  <button
                    onClick={() => handleMitigateRisk(project)}
                    className="py-2 px-3 rounded-xl text-xs font-semibold bg-emerald-600/15 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-600 hover:text-white transition-colors inline-flex items-center gap-1 whitespace-nowrap"
                    title="Lower job risk level after huddle mitigation"
                  >
                    Lower Risk <ArrowUpRight size={13} />
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
};

export default DailyHuddleSummary;
