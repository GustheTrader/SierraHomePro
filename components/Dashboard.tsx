import React, { useState, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { ConstructionProject, Agent, Integration, SyncActivity } from '../types';
import { 
  CheckCircle, Clock, Settings2, X, Target, BarChart3, Zap, 
  Sparkles, Loader2, BrainCircuit, RefreshCcw, Database, Wrench,
  Box, Users, Sliders
} from 'lucide-react';
import { KPI_MASTER_LIST, KPI_PRESETS } from '../constants';
import { suggestKPIs, getProjectPredictions } from '../geminiService';
import { WeatherRadar } from './WeatherRadar';
import { BudgetVsActuals } from './BudgetVsActuals';
import { DailyHuddleSummary } from './DailyHuddleSummary';

interface DashboardProps {
  projects: ConstructionProject[];
  agents: Agent[];
  integrations: Integration[];
  onUpdateProjects: (projects: ConstructionProject[]) => void;
  onUpdateIntegrations: (integrations: Integration[]) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ 
  projects: rawProjects, 
  integrations, 
  onUpdateProjects, 
  onUpdateIntegrations 
}) => {
  const projects = useMemo(() => {
    return rawProjects.filter(p => !p.isArchived);
  }, [rawProjects]);

  const [selectedKPIIds, setSelectedKPIIds] = useState<string[]>([
    'kpi-1', 'kpi-2', 'kpi-3', 'kpi-4', 'kpi-5', 'kpi-8'
  ]);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [aiContextInput, setAiContextInput] = useState('');
  const [isAiSuggesting, setIsAiSuggesting] = useState(false);
  const [isSyncing, setIsSyncing] = useState<string | null>(null);
  const [syncLogs, setSyncLogs] = useState<SyncActivity[]>([]);
  const [lastSyncTimestamp, setLastSyncTimestamp] = useState<number>(0);
  const [activePredictions, setActivePredictions] = useState<any[]>([
    {
      type: 'cost',
      content: 'Incline Village exterior trim job is at 90% of written estimate; consolidating final stain coat into one midday crew visit protects ~$420 in margin.',
      confidence: 0.92
    },
    {
      type: 'timeline',
      content: 'Loading the Damonte Ranch ADA doorway ramp at Sparks depot before 8 AM keeps Margaret & Robert Chen on track for Tuesday sign-off.',
      confidence: 0.87
    },
    {
      type: 'resource',
      content: '3 recurring winter maintenance plans in Carson City can be batched onto Van 3 on Thursday, saving ~65 minutes of drive time.',
      confidence: 0.84
    }
  ]);

  const [scheduleTab, setScheduleTab] = useState<'gantt' | 'milestones'>('gantt');

  // Residential Service Vans & Daily Route Allocation (8 AM - 5 PM window = hours 8 to 17)
  const [ganttCrews, setGanttCrews] = useState([
    { id: 'c1', name: 'Van 1 · Senior Safety', start: 8, end: 14, range: [8, 14], headCount: 2, progress: 55, task: 'ADA Grab Bars & Non-Slip Threshold Ramp', status: 'Optimal', location: 'Damonte Ranch, Reno', color: '#2B5B84' },
    { id: 'c2', name: 'Van 2 · Paint & Trim', start: 10, end: 16, range: [10, 16], headCount: 3, progress: 78, task: 'Exterior Cedar Fascia & Deck Stain', status: 'Over-booked', location: 'Incline Village, Tahoe', color: '#c2410c' },
    { id: 'c3', name: 'Van 3 · Smart Home', start: 8, end: 12, range: [8, 12], headCount: 1, progress: 100, task: 'Nest Thermostat, Doorbell & Smart Locks', status: 'Completed', location: 'Wingfield Springs, Sparks', color: '#132C47' },
    { id: 'c4', name: 'Van 4 · Maintenance', start: 11, end: 16, range: [11, 16], headCount: 1, progress: 35, task: 'Winterization, Gutters & HVAC Filters', status: 'Light Load', location: 'Carson City, NV', color: '#B96626' },
    { id: 'c5', name: 'Van 5 · Handyman Pro', start: 9, end: 15, range: [9, 15], headCount: 2, progress: 65, task: 'Drywall Patch, Sticking Doors & Trim', status: 'Optimal', location: 'Somersett, Reno', color: '#2B5B84' }
  ]);

  const [selectedCrewId, setSelectedCrewId] = useState<string>('c2');

  const getCrewStatus = (headCount: number, id: string) => {
    if (id === 'c3') return 'Completed';
    if (headCount < 2) return 'Light Load';
    if (headCount > 2) return 'Over-booked';
    return 'Optimal';
  };

  const getCrewColor = (status: string) => {
    switch (status) {
      case 'Completed': return '#132C47';
      case 'Optimal': return '#2B5B84';
      case 'Over-booked': return '#c2410c';
      case 'Light Load': return '#B96626';
      default: return '#607286';
    }
  };

  const handleHeadcountChange = (id: string, newHeadcount: number) => {
    setGanttCrews(prev => prev.map(crew => {
      if (crew.id === id) {
        const nextStatus = getCrewStatus(newHeadcount, id);
        return {
          ...crew,
          headCount: newHeadcount,
          status: nextStatus,
          color: getCrewColor(nextStatus)
        };
      }
      return crew;
    }));
  };

  const getDynamicKPIValue = (kpiId: string) => {
    const kpi = KPI_MASTER_LIST.find(k => k.id === kpiId);
    if (!kpi) return '';

    const activeProjects = projects.filter(p => p.status === 'active');
    const totalBudget = projects.reduce((acc, p) => acc + p.budget, 0);
    const totalSpent = projects.reduce((acc, p) => acc + p.spent, 0);
    const holdOrHighRisk = projects.filter(p => p.status === 'on-hold' || p.riskLevel === 'high').length;

    switch (kpiId) {
      case 'kpi-1':
        return activeProjects.length.toString();
      case 'kpi-2':
        return `$${(totalBudget / 1000).toFixed(1)}K`;
      case 'kpi-3': {
        const baseFixRate = 96.5;
        const highRiskPenalty = projects.filter(p => p.riskLevel === 'high').length * 2.0;
        return `${(baseFixRate - highRiskPenalty).toFixed(1)}%`;
      }
      case 'kpi-4':
        return holdOrHighRisk.toString();
      case 'kpi-5': {
        const margin = totalBudget > 0 ? ((totalBudget - totalSpent) / totalBudget) * 100 : 0;
        return `${margin.toFixed(1)}%`;
      }
      case 'kpi-6':
        return '4.2 Hrs';
      case 'kpi-7':
        return '100%';
      case 'kpi-8':
        return (36 + projects.filter(p => p.serviceCategory === 'Maintenance Plan').length * 2).toString();
      case 'kpi-9':
        return '4.9 / 5';
      case 'kpi-10':
        return '96%';
      default:
        return kpi.value;
    }
  };

  const handleSync = async (id: string) => {
    setIsSyncing(id);
    const tool = integrations.find(i => i.id === id);

    setTimeout(async () => {
      const newIntegrations = integrations.map(int =>
        int.id === id
          ? {
              ...int,
              status: 'connected' as const,
              lastSync: new Date().toISOString(),
              dataPoints: int.dataPoints + Math.floor(Math.random() * 18) + 3
            }
          : int
      );
      onUpdateIntegrations(newIntegrations);

      let updatedProjects = [...projects];
      let logType: SyncActivity['type'] = 'Work Order';
      let logDesc = '';

      if (tool?.provider === 'Jobber') {
        logType = 'Work Order';
        updatedProjects = projects.map(p => {
          const addedSpend = Math.floor(Math.random() * 160) + 45;
          const newSpent = Math.min(p.budget * 1.05, p.spent + addedSpend);
          const newComp = Math.min(100, p.completion + Math.floor(Math.random() * 5) + 2);
          const adherence = p.budget > 0 ? newSpent / p.budget : 0;
          const newRisk: 'low' | 'medium' | 'high' =
            adherence > 0.88 ? 'high' : adherence > 0.65 ? 'medium' : 'low';

          return {
            ...p,
            spent: Math.round(newSpent),
            completion: newComp,
            riskLevel: newRisk
          };
        });
        logDesc = 'Synced technician timecards & homeowner approvals from Jobber.';
      } else if (tool?.provider === 'QuickBooks') {
        logType = 'Estimate';
        updatedProjects = projects.map(p => ({
          ...p,
          completion: Math.min(100, p.completion + 2)
        }));
        logDesc = 'Reconciled Sparks material receipts and paid written estimates in QuickBooks.';
      } else {
        logType = 'Maintenance';
        logDesc = 'Verified local Sparks Pro Desk hardware pickup stock for morning vans.';
      }

      onUpdateProjects(updatedProjects);

      const projectSummary = updatedProjects
        .map(p => `${p.name} (${p.locationName}): ${p.completion}% done, $${p.spent}/$${p.budget}, ${p.riskLevel} risk`)
        .join('; ');
      const predictions = await getProjectPredictions(projectSummary);
      if (predictions && predictions.length > 0) {
        setActivePredictions(predictions);
      }

      const newLog: SyncActivity = {
        id: Date.now().toString(),
        tool: tool?.provider || 'Dispatch',
        type: logType,
        description: logDesc,
        timestamp: new Date().toISOString(),
        status: 'processed'
      };
      setSyncLogs(prev => [newLog, ...prev].slice(0, 4));
      setLastSyncTimestamp(Date.now());
      setIsSyncing(null);
    }, 1200);
  };

  const toggleKPI = (id: string) => {
    setSelectedKPIIds(prev =>
      prev.includes(id) ? prev.filter(k => k !== id) : [...prev, id]
    );
  };

  const applyPreset = (kpiIds: string[]) => {
    setSelectedKPIIds(kpiIds);
  };

  const handleAiSuggestion = async () => {
    if (!aiContextInput.trim()) return;
    setIsAiSuggesting(true);
    const suggestedIds = await suggestKPIs(aiContextInput);
    if (suggestedIds && suggestedIds.length > 0) {
      setSelectedKPIIds(suggestedIds);
      setAiContextInput('');
    }
    setIsAiSuggesting(false);
  };

  const chartData = useMemo(() => {
    return projects.map(p => ({
      name: p.name.split(' ').slice(0, 2).join(' '),
      budget: p.budget,
      spent: p.spent,
      completion: p.completion
    }));
  }, [projects]);

  const pieData = useMemo(() => [
    { name: 'Tech Labor', value: Math.round(projects.reduce((acc, p) => acc + p.spent * 0.52, 0)) },
    { name: 'Paint & Materials', value: Math.round(projects.reduce((acc, p) => acc + p.spent * 0.24, 0)) },
    { name: 'Smart & Safety Gear', value: Math.round(projects.reduce((acc, p) => acc + p.spent * 0.16, 0)) },
    { name: 'Van & Supplies', value: Math.round(projects.reduce((acc, p) => acc + p.spent * 0.08, 0)) },
  ], [projects]);

  const COLORS = ['#1E4976', '#B96626', '#4A7CA8', '#8F5B32'];
  const totalSpent = projects.reduce((a, b) => a + b.spent, 0);

  return (
    <div className="space-y-8 pb-12">
      {/* Page Title & Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-zinc-100 tracking-tight">
            Sierra Home Pros Operations
          </h2>
          <p className="text-zinc-400 text-sm mt-1">
            Daily handyman repairs, smart-home installs, painting, maintenance plans, and senior safety upgrades.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs text-zinc-400 font-mono tabular-nums">
            {integrations.filter(i => i.status === 'connected').length}/{integrations.length} apps synced
          </span>
          <button 
            onClick={() => setIsConfigOpen(true)}
            className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-200 px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors whitespace-nowrap"
          >
            <Settings2 size={15} /> Customize Metrics
          </button>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {selectedKPIIds.length === 0 ? (
          <div className="col-span-full py-10 flex flex-col items-center justify-center text-zinc-500 border border-dashed border-zinc-800 rounded-2xl bg-zinc-900/40">
            <BarChart3 size={36} className="mb-3 opacity-30" />
            <p className="text-sm font-semibold">No metrics selected.</p>
            <button onClick={() => setIsConfigOpen(true)} className="mt-3 text-emerald-400 text-xs font-semibold hover:underline">
              Choose operations metrics
            </button>
          </div>
        ) : (
          KPI_MASTER_LIST.filter(k => selectedKPIIds.includes(k.id)).map((stat) => (
            <div 
              key={stat.id} 
              className={`bg-zinc-900 border p-5 rounded-2xl transition-colors flex flex-col justify-between ${
                lastSyncTimestamp > Date.now() - 2500 ? 'border-emerald-500/60' : 'border-zinc-800 hover:border-zinc-700'
              }`}
            >
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs text-zinc-400 font-medium">{stat.label}</span>
                <span className="shrink-0">{stat.icon}</span>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-zinc-100 font-mono tabular-nums">
                  {getDynamicKPIValue(stat.id)}
                </h3>
                <p className="text-xs text-zinc-500 mt-1">{stat.trend}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Daily Huddle Priority Matrix (Top 3 Residential Jobs) */}
      <DailyHuddleSummary projects={projects} onUpdateProjects={onUpdateProjects} />

      {/* Main Chart + Advisor & Sync Column */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <div className="xl:col-span-3 bg-zinc-900 border border-zinc-800 p-6 lg:p-8 rounded-3xl">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div>
              <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2.5">
                <Target size={20} className="text-emerald-400" />
                Written Estimates vs. Actual Job Costs
              </h3>
              <p className="text-xs text-zinc-400 mt-1">
                Comparing approved homeowner quotes against current materials and technician labor costs.
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs text-zinc-400">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#2B5B84]" />
                <span>Written Estimate</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#B96626]" />
                <span>Actual Spend</span>
              </div>
            </div>
          </div>

          <div className="h-[340px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 16, right: 20, left: 10, bottom: 16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="var(--chart-axis)" 
                  fontSize={11} 
                  fontWeight="600" 
                  tickLine={false} 
                  axisLine={false} 
                  dy={8}
                />
                <YAxis 
                  stroke="var(--chart-axis)" 
                  fontSize={11} 
                  fontWeight="600" 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(val) => `$${(val / 1000).toFixed(1)}k`}
                />
                <Tooltip 
                  cursor={{ fill: 'rgba(185, 102, 38, 0.08)' }}
                  contentStyle={{ backgroundColor: 'var(--chart-tooltip-bg)', border: '1px solid var(--chart-tooltip-border)', borderRadius: '14px', padding: '12px' }}
                  itemStyle={{ fontSize: '12px', fontWeight: '600', color: 'var(--chart-tooltip-text)' }}
                  labelStyle={{ fontWeight: '700', color: 'var(--chart-secondary)', marginBottom: '6px', fontSize: '12px' }}
                  formatter={(value: any) => [`$${Number(value).toLocaleString()}`, '']}
                />
                <Bar name="Written Estimate" dataKey="budget" fill="var(--chart-primary)" radius={[6, 6, 0, 0]} barSize={32} />
                <Bar name="Actual Cost" dataKey="spent" fill="var(--chart-secondary)" radius={[6, 6, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Column: Insights + Sync */}
        <div className="flex flex-col gap-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 flex-1">
            <h3 className="text-base font-bold text-zinc-100 mb-4 flex items-center justify-between">
              <span>Dispatch Insights</span>
              <span className="text-xs font-medium text-emerald-400">Sierra AI</span>
            </h3>
            <div className="space-y-3">
              {activePredictions.map((pred, i) => (
                <div key={i} className="p-3.5 bg-zinc-950 border border-zinc-800 rounded-xl space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className={`font-semibold capitalize ${
                      pred.type === 'cost' ? 'text-amber-400' : pred.type === 'timeline' ? 'text-sky-400' : 'text-emerald-400'
                    }`}>
                      {pred.type}
                    </span>
                    <span className="font-mono tabular-nums text-zinc-500">
                      {Math.round(pred.confidence * 100)}% conf.
                    </span>
                  </div>
                  <p className="text-xs text-zinc-300 leading-relaxed">{pred.content}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
            <h3 className="text-base font-bold text-zinc-100 mb-4">Connected Tools</h3>
            <div className="space-y-2.5">
              {integrations.map(int => (
                <div key={int.id} className="flex items-center justify-between p-3 bg-zinc-950 border border-zinc-800 rounded-xl">
                  <div className="flex items-center gap-3 min-w-0">
                    {int.provider === 'Jobber' ? (
                      <Wrench className="text-emerald-400 shrink-0" size={16} />
                    ) : (
                      <Database className="text-amber-400 shrink-0" size={16} />
                    )}
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-zinc-100 truncate">{int.provider}</p>
                      <p className="text-[11px] text-zinc-500 capitalize">{int.status}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleSync(int.id)}
                    disabled={isSyncing === int.id}
                    className={`p-2 rounded-lg border border-zinc-800 transition-colors ${
                      isSyncing === int.id
                        ? 'bg-zinc-800 text-zinc-500'
                        : 'bg-zinc-900 text-zinc-400 hover:text-zinc-100 hover:border-zinc-700'
                    }`}
                    title={`Sync ${int.provider}`}
                  >
                    {isSyncing === int.id ? <Loader2 size={14} className="animate-spin" /> : <RefreshCcw size={14} />}
                  </button>
                </div>
              ))}
            </div>
            {syncLogs.length > 0 && (
              <p className="text-[11px] text-zinc-500 mt-3 leading-relaxed">
                Latest: {syncLogs[0].description}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Live Reno-Sparks / Carson City / Lake Tahoe Weather Dispatch Radar */}
      <WeatherRadar projects={projects} />

      {/* Residential Job Costing Ledger */}
      <BudgetVsActuals projects={projects} />

      {/* Cost Breakdown & Daily Service Van Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cost Breakdown */}
        <div className="bg-zinc-900 border border-zinc-800 p-6 lg:p-8 rounded-3xl">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
              <Box size={19} className="text-emerald-400" />
              Active Job Cost Breakdown
            </h3>
            <p className="text-xs text-zinc-400 mt-1">
              Distribution of technician labor, paint/materials, smart-home hardware, and van stock
            </p>
          </div>
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="h-[240px] w-full md:w-1/2 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={64}
                    outerRadius={92}
                    paddingAngle={6}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--chart-tooltip-bg)', border: '1px solid var(--chart-tooltip-border)', borderRadius: '14px', padding: '10px' }}
                    itemStyle={{ fontSize: '12px', fontWeight: '600', color: 'var(--chart-tooltip-text)' }}
                    formatter={(value: any) => [`$${Number(value).toLocaleString()}`, 'Cost']}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <p className="text-xl font-bold text-zinc-100 font-mono tabular-nums">
                  ${totalSpent.toLocaleString()}
                </p>
                <p className="text-[11px] text-zinc-500">Current Spend</p>
              </div>
            </div>
            <div className="flex-1 w-full space-y-2.5">
              {pieData.map((d, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-zinc-950 border border-zinc-800 rounded-xl">
                  <div className="flex items-center gap-3">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[i] }} />
                    <span className="text-xs font-medium text-zinc-300">{d.name}</span>
                  </div>
                  <span className="text-xs font-bold text-zinc-100 font-mono tabular-nums">
                    ${d.value.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Daily Service Van Dispatch Gantt */}
        <div className="bg-zinc-900 border border-zinc-800 p-6 lg:p-8 rounded-3xl">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                <Clock size={19} className="text-emerald-400" />
                {scheduleTab === 'gantt' ? 'Daily Van Dispatch Schedule' : 'Completion vs. Quote'}
              </h3>
              <p className="text-xs text-zinc-400 mt-1">
                {scheduleTab === 'gantt'
                  ? 'Today’s 8 AM – 5 PM technician routing across Northern Nevada'
                  : 'Work progress compared across open homeowner jobs'}
              </p>
            </div>

            <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-800">
              <button
                onClick={() => setScheduleTab('gantt')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  scheduleTab === 'gantt' ? 'bg-emerald-600 text-white' : 'text-zinc-400 hover:text-zinc-100'
                }`}
              >
                Van Routes
              </button>
              <button
                onClick={() => setScheduleTab('milestones')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  scheduleTab === 'milestones' ? 'bg-emerald-600 text-white' : 'text-zinc-400 hover:text-zinc-100'
                }`}
              >
                Job Progress
              </button>
            </div>
          </div>

          {scheduleTab === 'gantt' ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              <div className="lg:col-span-7 flex flex-col justify-between">
                <div className="h-[240px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart 
                      layout="vertical" 
                      data={ganttCrews} 
                      margin={{ top: 8, right: 16, left: 0, bottom: 4 }}
                      onClick={(state: any) => {
                        if (state && state.activePayload && state.activePayload.length) {
                          setSelectedCrewId(state.activePayload[0].payload.id);
                        }
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" horizontal={true} vertical={false} />
                      <XAxis 
                        type="number" 
                        domain={[8, 17]} 
                        ticks={[8, 10, 12, 14, 16]} 
                        stroke="var(--chart-axis)" 
                        fontSize={10} 
                        tickLine={false} 
                        axisLine={false}
                        tickFormatter={(val) => val === 12 ? '12p' : val > 12 ? `${val - 12}p` : `${val}a`}
                      />
                      <YAxis 
                        type="category" 
                        dataKey="name" 
                        stroke="var(--chart-axis)" 
                        fontSize={10} 
                        tickLine={false} 
                        axisLine={false} 
                        width={120}
                      />
                      <Tooltip 
                        cursor={{ fill: 'rgba(185, 102, 38, 0.08)' }}
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-xl shadow-xl text-xs">
                                <p className="font-bold text-zinc-100">{data.name}</p>
                                <p className="text-zinc-400 mt-1">{data.task}</p>
                                <p className="text-zinc-500 mt-1 font-mono">
                                  {data.location} · {data.headCount} tech(s)
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar dataKey="range" radius={8} barSize={16} cursor="pointer">
                        {ganttCrews.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={entry.color} 
                            stroke={selectedCrewId === entry.id ? 'var(--chart-tooltip-text)' : 'none'} 
                            strokeWidth={selectedCrewId === entry.id ? 2 : 0}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap gap-4 justify-center text-[11px] text-zinc-400 mt-2">
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#2B5B84]" /> Optimal</span>
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#c2410c]" /> Over-booked</span>
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#B96626]" /> Light Load</span>
                </div>
              </div>

              <div className="lg:col-span-5 bg-zinc-950 border border-zinc-800 rounded-2xl p-4 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                      <Sliders size={13} className="text-emerald-400" /> Van Staffing
                    </span>
                    <span className="text-xs font-semibold text-emerald-400">
                      {ganttCrews.find(c => c.id === selectedCrewId)?.status}
                    </span>
                  </div>

                  <select 
                    value={selectedCrewId}
                    onChange={(e) => setSelectedCrewId(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 text-xs text-zinc-100 px-3 py-2 rounded-xl focus:outline-none focus:border-emerald-500 mb-3"
                  >
                    {ganttCrews.map(crew => (
                      <option key={crew.id} value={crew.id}>{crew.name}</option>
                    ))}
                  </select>

                  {(() => {
                    const crew = ganttCrews.find(c => c.id === selectedCrewId) || ganttCrews[0];
                    return (
                      <div className="space-y-3">
                        <div className="text-xs space-y-1">
                          <p className="text-zinc-200 font-semibold">{crew.task}</p>
                          <p className="text-zinc-500">{crew.location} · {crew.progress}% done</p>
                        </div>

                        {crew.id !== 'c3' ? (
                          <div className="space-y-2 pt-2 border-t border-zinc-800">
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-zinc-400 flex items-center gap-1">
                                <Users size={13} /> Technicians
                              </span>
                              <span className="font-mono font-bold text-zinc-100">
                                {crew.headCount} pro{crew.headCount > 1 ? 's' : ''}
                              </span>
                            </div>
                            <input 
                              type="range" 
                              min="1" 
                              max="4" 
                              value={crew.headCount}
                              onChange={(e) => handleHeadcountChange(crew.id, parseInt(e.target.value))}
                              className="w-full accent-emerald-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
                            />
                            <div className="flex justify-between text-[11px] text-zinc-500">
                              <span>1 Solo</span>
                              <span>2 Pair</span>
                              <span>4 Full Crew</span>
                            </div>
                          </div>
                        ) : (
                          <p className="text-xs text-emerald-400 flex items-center gap-1.5 pt-2 border-t border-zinc-800">
                            <CheckCircle size={14} /> Visit completed & signed off
                          </p>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 16 }}>
                  <defs>
                    <linearGradient id="colorCompletion" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#B96626" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#B96626" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
                  <XAxis dataKey="name" stroke="var(--chart-axis)" fontSize={11} tickLine={false} axisLine={false} dy={8} />
                  <YAxis stroke="var(--chart-axis)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--chart-tooltip-bg)', border: '1px solid var(--chart-tooltip-border)', borderRadius: '14px' }}
                    itemStyle={{ fontSize: '12px', color: 'var(--chart-tooltip-text)' }}
                    formatter={(value: any) => [`${value}%`, 'Completion']}
                  />
                  <Area type="monotone" name="Completion %" dataKey="completion" stroke="var(--chart-secondary)" strokeWidth={2.5} fillOpacity={1} fill="url(#colorCompletion)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* KPI Configuration Modal */}
      {isConfigOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-4xl max-h-[90vh] rounded-3xl overflow-hidden flex flex-col">
            <div className="px-6 py-5 border-b border-zinc-800 flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-lg font-bold text-zinc-100">Customize Dashboard Metrics</h3>
                <p className="text-xs text-zinc-400 mt-0.5">Choose the KPIs that matter most for Sierra Home Pros dispatch</p>
              </div>
              <button 
                onClick={() => setIsConfigOpen(false)}
                className="w-9 h-9 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-zinc-100"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
              <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-zinc-800 p-5 space-y-3 shrink-0 overflow-y-auto">
                <p className="text-xs font-semibold text-zinc-400">Role Presets</p>
                {KPI_PRESETS.map(preset => (
                  <button 
                    key={preset.id}
                    onClick={() => applyPreset(preset.kpis)}
                    className="w-full text-left p-3.5 rounded-xl border border-zinc-800 bg-zinc-950/60 hover:border-emerald-500/40 transition-colors"
                  >
                    <p className="text-xs font-semibold text-zinc-100">{preset.label}</p>
                    <p className="text-[11px] text-zinc-500 mt-1 leading-snug">{preset.description}</p>
                  </button>
                ))}
              </div>

              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="p-5 border-b border-zinc-800">
                  <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-2 flex items-center gap-3">
                    <BrainCircuit size={18} className="text-emerald-400 ml-2 shrink-0" />
                    <input 
                      type="text" 
                      value={aiContextInput}
                      onChange={(e) => setAiContextInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAiSuggestion()}
                      placeholder="Ask AI e.g. 'Focus on written estimate margins and senior safety'..." 
                      className="flex-1 bg-transparent border-none text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none"
                    />
                    <button 
                      onClick={handleAiSuggestion}
                      disabled={isAiSuggesting || !aiContextInput.trim()}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap"
                    >
                      {isAiSuggesting ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
                      Suggest
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {KPI_MASTER_LIST.map(kpi => {
                      const active = selectedKPIIds.includes(kpi.id);
                      return (
                        <button
                          key={kpi.id}
                          onClick={() => toggleKPI(kpi.id)}
                          className={`p-4 rounded-xl border text-left transition-colors ${
                            active
                              ? 'bg-emerald-500/10 border-emerald-500/40'
                              : 'bg-zinc-950/60 border-zinc-800 hover:border-zinc-700'
                          }`}
                        >
                          <div className="flex justify-between items-center mb-1.5">
                            <span className="text-xs font-semibold text-zinc-100">{kpi.label}</span>
                            <CheckCircle size={15} className={active ? 'text-emerald-400' : 'text-zinc-600'} />
                          </div>
                          <p className="text-[11px] text-zinc-400 leading-relaxed">{kpi.description}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-zinc-800 flex items-center justify-between shrink-0">
              <span className="text-xs text-zinc-400 font-mono tabular-nums">
                {selectedKPIIds.length} metrics selected
              </span>
              <button 
                onClick={() => setIsConfigOpen(false)}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition-colors"
              >
                Save Layout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
