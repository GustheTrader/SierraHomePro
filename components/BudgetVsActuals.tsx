import React, { useState } from 'react';
import { ConstructionProject } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { DollarSign, AlertTriangle, CheckCircle2, Info } from 'lucide-react';

interface BudgetVsActualsProps {
  projects: ConstructionProject[];
}

export const BudgetVsActuals: React.FC<BudgetVsActualsProps> = ({ projects }) => {
  const [selectedProjectId, setSelectedProjectId] = useState<string>(projects[0]?.id || '');
  const [displayMode, setDisplayMode] = useState<'comparison' | 'drilldown'>('comparison');

  const processedData = projects.map(p => {
    let fMaterialRatio = 0.42;
    let fLaborRatio = 0.58;
    let aMaterialRatio = 0.40;
    let aLaborRatio = 0.60;

    if (p.serviceCategory === 'Smart Home' || p.serviceCategory === 'Senior Safety') {
      fMaterialRatio = 0.48;
      fLaborRatio = 0.52;
      aMaterialRatio = 0.47;
      aLaborRatio = 0.53;
    } else if (p.serviceCategory === 'Interior/Exterior Painting') {
      fMaterialRatio = 0.30;
      fLaborRatio = 0.70;
      aMaterialRatio = 0.28;
      aLaborRatio = 0.72;
    }

    const forecastMaterial = Math.round(p.budget * fMaterialRatio);
    const forecastLabor = Math.round(p.budget * fLaborRatio);
    const actualMaterial = Math.round(p.spent * aMaterialRatio);
    const actualLabor = Math.round(p.spent * aLaborRatio);

    const totalForecast = p.budget;
    const totalActual = p.spent;
    const expectedSpendAtProgress = totalForecast * (p.completion / 100);
    const spendVariance = expectedSpendAtProgress - totalActual;
    const isOverrunRisk = p.completion > 0 && totalActual > expectedSpendAtProgress * 1.12;

    return {
      id: p.id,
      name: p.name.split(' ').slice(0, 2).join(' '),
      fullName: p.name,
      client: p.client,
      category: p.serviceCategory || 'Handyman Repair',
      forecastMaterial,
      forecastLabor,
      actualMaterial,
      actualLabor,
      totalForecast,
      totalActual,
      expectedSpendAtProgress,
      spendVariance,
      isOverrunRisk,
      completion: p.completion,
      status: p.status,
      riskLevel: p.riskLevel
    };
  });

  const selectedProject = processedData.find(d => d.id === selectedProjectId) || processedData[0];

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

  const comparisonChartData = processedData.map(d => ({
    name: d.name,
    id: d.id,
    'Estimate Materials': d.forecastMaterial,
    'Estimate Labor': d.forecastLabor,
    'Actual Materials': d.actualMaterial,
    'Actual Labor': d.actualLabor,
  }));

  const generateVisitBurnData = (proj: typeof selectedProject) => {
    const visits = ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Final'];
    return visits.map((label, index) => {
      const progress = (index + 1) / visits.length;
      const fMat = proj.forecastMaterial * progress;
      const fLab = proj.forecastLabor * progress;
      const maxActualIndex = Math.min(visits.length - 1, Math.round((proj.completion / 100) * (visits.length - 1)));

      let aMat = null;
      let aLab = null;

      if (index <= maxActualIndex && proj.totalActual > 0) {
        const factor = (index + 1) / Math.max(1, maxActualIndex + 1);
        aMat = Math.round(proj.actualMaterial * factor);
        aLab = Math.round(proj.actualLabor * factor);
      }

      return {
        visit: label,
        'Est. Materials': Math.round(fMat),
        'Est. Labor': Math.round(fLab),
        'Actual Materials': aMat,
        'Actual Labor': aLab,
      };
    });
  };

  const visitBurnData = selectedProject ? generateVisitBurnData(selectedProject) : [];

  return (
    <section id="project-financial-widget" className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 lg:p-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
            <DollarSign size={20} className="text-emerald-400" />
            Written Estimate vs. Actual Job Costing
          </h3>
          <p className="text-xs text-zinc-400 mt-1">
            Track hardware, paint, and technician labor costs against upfront homeowner quotes
          </p>
        </div>

        <div className="flex items-center gap-1 bg-zinc-950 p-1 border border-zinc-800 rounded-xl">
          <button
            onClick={() => setDisplayMode('comparison')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
              displayMode === 'comparison'
                ? 'bg-emerald-600 text-white'
                : 'text-zinc-400 hover:text-zinc-100'
            }`}
          >
            All Jobs
          </button>
          <button
            onClick={() => setDisplayMode('drilldown')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
              displayMode === 'drilldown'
                ? 'bg-emerald-600 text-white'
                : 'text-zinc-400 hover:text-zinc-100'
            }`}
          >
            Job Breakdown
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Job List */}
        <div className="lg:col-span-4 space-y-4">
          <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
            {processedData.map((d) => {
              const isSelected = selectedProject?.id === d.id;
              const percentBurned = d.totalForecast > 0 ? Math.round((d.totalActual / d.totalForecast) * 100) : 0;

              return (
                <button
                  key={d.id}
                  onClick={() => {
                    setSelectedProjectId(d.id);
                    setDisplayMode('drilldown');
                  }}
                  className={`w-full p-3.5 rounded-xl border text-left transition-colors flex flex-col gap-2 ${
                    isSelected
                      ? 'bg-emerald-500/10 border-emerald-500/40'
                      : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0">
                      <h4 className={`text-xs font-bold truncate ${isSelected ? 'text-emerald-400' : 'text-zinc-100'}`}>
                        {d.fullName}
                      </h4>
                      <p className="text-[11px] text-zinc-500 truncate mt-0.5">{d.client}</p>
                    </div>
                    <span className={`text-[11px] font-semibold shrink-0 ${
                      d.isOverrunRisk ? 'text-red-400' : d.spendVariance > 0 ? 'text-emerald-400' : 'text-zinc-400'
                    }`}>
                      {d.isOverrunRisk ? 'Tight' : d.spendVariance > 0 ? 'Healthy' : 'On Track'}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-mono tabular-nums text-zinc-400">
                      <span>{formatCurrency(d.totalActual)} / {formatCurrency(d.totalForecast)}</span>
                      <span>{percentBurned}% used · {d.completion}% done</span>
                    </div>
                    <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${d.isOverrunRisk ? 'bg-red-500' : 'bg-emerald-500'}`} 
                        style={{ width: `${Math.min(100, percentBurned)}%` }} 
                      />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {selectedProject && (
            <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 grid grid-cols-2 gap-4 font-mono tabular-nums">
              <div>
                <span className="text-[11px] text-zinc-500 font-sans block">Materials & Parts</span>
                <span className="text-base font-bold text-zinc-100 block mt-0.5">{formatCurrency(selectedProject.actualMaterial)}</span>
                <span className="text-[11px] text-zinc-500 block">Est. {formatCurrency(selectedProject.forecastMaterial)}</span>
              </div>
              <div className="border-l border-zinc-800 pl-4">
                <span className="text-[11px] text-zinc-500 font-sans block">Tech Labor</span>
                <span className="text-base font-bold text-zinc-100 block mt-0.5">{formatCurrency(selectedProject.actualLabor)}</span>
                <span className="text-[11px] text-zinc-500 block">Est. {formatCurrency(selectedProject.forecastLabor)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Right Chart Canvas */}
        <div className="lg:col-span-8">
          {displayMode === 'comparison' ? (
            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5 h-full flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-5">
                  <div>
                    <h4 className="text-sm font-semibold text-zinc-100">Materials & Labor by Service Job</h4>
                    <p className="text-xs text-zinc-500 mt-0.5">Written estimate allowance vs. actual spend</p>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-zinc-400">
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-[#2B5B84]" /> Estimate</span>
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-[#B96626]" /> Actual</span>
                  </div>
                </div>

                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={comparisonChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
                      <XAxis dataKey="name" stroke="var(--chart-axis)" fontSize={11} tickLine={false} axisLine={false} dy={6} />
                      <YAxis stroke="var(--chart-axis)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => `$${(val / 1000).toFixed(1)}k`} />
                      <Tooltip 
                        cursor={{ fill: 'rgba(185, 102, 38, 0.08)' }}
                        contentStyle={{ backgroundColor: 'var(--chart-tooltip-bg)', border: '1px solid var(--chart-tooltip-border)', borderRadius: '14px', padding: '10px' }}
                        itemStyle={{ fontSize: '12px', color: 'var(--chart-tooltip-text)' }}
                        formatter={(value: any) => [formatCurrency(Number(value)), '']}
                      />
                      <Bar dataKey="Estimate Materials" stackId="est" fill="#132C47" barSize={22} />
                      <Bar dataKey="Estimate Labor" stackId="est" fill="#3B77AD" radius={[4, 4, 0, 0]} barSize={22} />
                      <Bar dataKey="Actual Materials" stackId="act" fill="#9A4D16" barSize={22} />
                      <Bar dataKey="Actual Labor" stackId="act" fill="#D97B34" radius={[4, 4, 0, 0]} barSize={22} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="border-t border-zinc-800 pt-3 mt-4 flex items-center gap-2 text-xs text-zinc-500">
                <Info size={14} className="shrink-0" />
                <span>Select any service job on the left to inspect visit-by-visit labor and supply costs.</span>
              </div>
            </div>
          ) : (
            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5 h-full flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-5">
                  <div>
                    <h4 className="text-sm font-bold text-zinc-100">{selectedProject?.fullName}</h4>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      {selectedProject?.category} · Visit-by-visit spend vs. written estimate
                    </p>
                  </div>
                  <span className={`text-xs font-semibold capitalize ${
                    selectedProject?.riskLevel === 'high' ? 'text-red-400' :
                    selectedProject?.riskLevel === 'medium' ? 'text-amber-400' : 'text-emerald-400'
                  }`}>
                    {selectedProject?.riskLevel} risk
                  </span>
                </div>

                <div className="h-[220px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={visitBurnData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
                      <XAxis dataKey="visit" stroke="var(--chart-axis)" fontSize={11} tickLine={false} axisLine={false} dy={6} />
                      <YAxis stroke="var(--chart-axis)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} />
                      <Tooltip
                        contentStyle={{ backgroundColor: 'var(--chart-tooltip-bg)', border: '1px solid var(--chart-tooltip-border)', borderRadius: '14px', padding: '10px' }}
                        itemStyle={{ fontSize: '12px', color: 'var(--chart-tooltip-text)' }}
                        formatter={(value: any, name: string) => value === null ? ['Pending', name] : [formatCurrency(Number(value)), name]}
                      />
                      <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                      <Bar dataKey="Est. Materials" stackId="budget" fill="#132C47" />
                      <Bar dataKey="Est. Labor" stackId="budget" fill="#3B77AD" />
                      <Bar dataKey="Actual Materials" stackId="actual" fill="#9A4D16" />
                      <Bar dataKey="Actual Labor" stackId="actual" fill="#D97B34" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="border-t border-zinc-800 pt-3 mt-4 flex items-center gap-2 text-xs text-zinc-400">
                {selectedProject?.isOverrunRisk ? (
                  <AlertTriangle size={15} className="text-red-400 shrink-0" />
                ) : (
                  <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
                )}
                <span>
                  {selectedProject?.isOverrunRisk
                    ? 'Job costs are pacing ahead of completion. Review extra trips or approve a written add-on before final visit.'
                    : 'Materials and technician hours are tracking cleanly within the homeowner’s written estimate.'}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
