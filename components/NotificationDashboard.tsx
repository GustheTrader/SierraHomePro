import React, { useState, useEffect, useRef } from 'react';
import { 
  Bell, AlertTriangle, CheckCircle2, ChevronDown, ChevronUp, 
  RefreshCw, Check, Activity, Info, ShieldAlert, Award, Sparkles
} from 'lucide-react';
import { ConstructionProject, HealthAlert } from '../types';
import { getAgenticHealthAlerts, getFallbackAlerts } from '../geminiService';

interface NotificationDashboardProps {
  projects: ConstructionProject[];
  onUpdateProjects: (projects: ConstructionProject[]) => void;
}

const NotificationDashboard: React.FC<NotificationDashboardProps> = ({ 
  projects, 
  onUpdateProjects 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [alerts, setAlerts] = useState<HealthAlert[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState('');
  const [expandedAlertId, setExpandedAlertId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setAlerts(getFallbackAlerts(projects));
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const runAgenticAnalysis = async () => {
    setIsAnalyzing(true);
    setExpandedAlertId(null);

    const steps = [
      'Checking Reno–Sparks & Tahoe technician routes...',
      'Comparing actual costs against written estimates...',
      'Reviewing Sparks supply pickups & van stock...',
      'Preparing homeowner care recommendations...'
    ];

    for (let i = 0; i < steps.length; i++) {
      setAnalysisStep(steps[i]);
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    try {
      const freshAlerts = await getAgenticHealthAlerts(projects);
      const mergedAlerts = freshAlerts.map((fresh: HealthAlert) => {
        const existing = alerts.find(a => a.id === fresh.id);
        return existing ? { ...fresh, status: existing.status, isRead: existing.isRead } : fresh;
      });
      setAlerts(mergedAlerts);
    } catch (e) {
      console.error(e);
    } finally {
      setIsAnalyzing(false);
      setAnalysisStep('');
    }
  };

  const markAllRead = () => {
    setAlerts(prev => prev.map(a => ({ ...a, isRead: true })));
  };

  const handleMitigate = (alert: HealthAlert, solutionLabel: string) => {
    setAlerts(prev => prev.map(a => a.id === alert.id ? {
      ...a,
      status: 'mitigated',
      summary: `Resolved via ${solutionLabel}.`,
      recommendation: `Applied: ${solutionLabel}.`
    } : a));

    const updatedProjects = projects.map(p => {
      if (p.id === alert.projectId) {
        let updatedSpent = p.spent;
        let updatedRisk = p.riskLevel;
        let updatedCompletion = p.completion;

        if (alert.type === 'budget') {
          updatedSpent = Math.max(p.spent - 320, 0);
          updatedRisk = 'medium';
        } else if (alert.type === 'schedule') {
          updatedRisk = 'low';
          updatedCompletion = Math.min(p.completion + 8, 100);
        } else {
          updatedRisk = 'low';
        }

        return { ...p, spent: updatedSpent, riskLevel: updatedRisk, completion: updatedCompletion };
      }
      return p;
    });

    onUpdateProjects(updatedProjects);
  };

  const activeAlerts = alerts.filter(a => a.status === 'active');
  const unreadCount = activeAlerts.filter(a => !a.isRead).length;

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`p-2 rounded-xl border transition-colors relative flex items-center justify-center ${
          isOpen
            ? 'bg-zinc-800 border-zinc-700 text-emerald-400'
            : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-100'
        }`}
        title="Sierra Dispatch Alerts"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-[10px] font-bold text-white px-1.5 py-0.5 rounded-full border-2 border-zinc-900 font-mono tabular-nums min-w-[18px] h-[18px] flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-[430px] bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl z-50 overflow-hidden">
          <div className="p-4 bg-zinc-950/60 border-b border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles size={15} className="text-emerald-400" />
              <div>
                <h3 className="text-xs font-bold text-zinc-100">Sierra Operations Alerts</h3>
                <p className="text-[11px] text-zinc-500">Margin, parts & weather watch</p>
              </div>
            </div>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="text-xs text-zinc-400 hover:text-zinc-100 font-medium">
                Mark all read
              </button>
            )}
          </div>

          <div className="px-4 py-2.5 bg-zinc-900/20 border-b border-zinc-800 flex items-center justify-between gap-3">
            <span className="text-xs text-zinc-400 truncate">
              {isAnalyzing ? analysisStep : `${activeAlerts.length} active item${activeAlerts.length === 1 ? '' : 's'}`}
            </span>
            <button
              onClick={runAgenticAnalysis}
              disabled={isAnalyzing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-500/30 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 text-xs font-semibold disabled:opacity-50 whitespace-nowrap"
            >
              <RefreshCw size={12} className={isAnalyzing ? 'animate-spin' : ''} />
              {isAnalyzing ? 'Scanning...' : 'Scan Jobs'}
            </button>
          </div>

          <div className="max-h-[380px] overflow-y-auto divide-y divide-zinc-800/80">
            {!isAnalyzing && alerts.map((alert) => {
              const isExpanded = expandedAlertId === alert.id;
              const isMitigated = alert.status === 'mitigated';

              return (
                <div 
                  key={alert.id} 
                  className="p-4 hover:bg-zinc-900/40 cursor-pointer transition-colors"
                  onClick={() => setExpandedAlertId(isExpanded ? null : alert.id)}
                >
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      {isMitigated ? (
                        <CheckCircle2 size={14} className="text-emerald-400" />
                      ) : alert.severity === 'critical' ? (
                        <ShieldAlert size={14} className="text-red-400" />
                      ) : alert.severity === 'warning' ? (
                        <AlertTriangle size={14} className="text-amber-400" />
                      ) : (
                        <Info size={14} className="text-sky-400" />
                      )}
                      <span className={`font-semibold capitalize ${
                        isMitigated ? 'text-emerald-400' :
                        alert.severity === 'critical' ? 'text-red-400' :
                        alert.severity === 'warning' ? 'text-amber-400' : 'text-sky-400'
                      }`}>
                        {isMitigated ? 'Resolved' : alert.severity}
                      </span>
                      <span className="text-zinc-600">·</span>
                      <span className="text-zinc-500 capitalize">{alert.type}</span>
                    </div>
                    <span className="text-[11px] text-zinc-500">{alert.timestamp}</span>
                  </div>

                  <div className="mt-2">
                    <h4 className={`text-xs font-bold leading-snug ${isMitigated ? 'text-zinc-500 line-through' : 'text-zinc-100'}`}>
                      {alert.title}
                    </h4>
                    <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{alert.summary}</p>
                    <p className="text-[11px] text-zinc-500 mt-1.5">{alert.projectName}</p>
                  </div>

                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-zinc-800 space-y-3" onClick={(e) => e.stopPropagation()}>
                      <p className="text-xs text-zinc-300 leading-relaxed bg-zinc-900/70 p-3 rounded-xl border border-zinc-800">
                        {alert.agentFeedback}
                      </p>
                      <div className="text-xs text-zinc-300">
                        <span className="font-semibold text-emerald-400 block mb-1">Recommended Action</span>
                        {alert.recommendation}
                      </div>

                      {!isMitigated ? (
                        <div className="flex items-center gap-2 pt-1">
                          <button
                            onClick={() => handleMitigate(alert, alert.type === 'budget' ? 'Consolidated Finish Visit' : 'Updated Van Dispatch')}
                            className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2 px-3 rounded-lg text-xs flex items-center justify-center gap-1.5"
                          >
                            <Check size={13} /> Apply Fix
                          </button>
                          <button
                            onClick={() => {
                              setAlerts(prev => prev.map(a => a.id === alert.id ? { ...a, status: 'snoozed' } : a));
                              setExpandedAlertId(null);
                            }}
                            className="border border-zinc-800 hover:bg-zinc-900 text-zinc-400 hover:text-zinc-100 py-2 px-3 rounded-lg text-xs"
                          >
                            Snooze
                          </button>
                        </div>
                      ) : (
                        <div className="text-xs text-emerald-400 flex items-center gap-1.5">
                          <Award size={14} /> Mitigation applied to active job.
                        </div>
                      )}
                    </div>
                  )}

                  <div className="mt-2 flex justify-end">
                    <span className="text-[11px] text-zinc-500 flex items-center gap-0.5">
                      {isExpanded ? <>Less <ChevronUp size={12} /></> : <>Details <ChevronDown size={12} /></>}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDashboard;
