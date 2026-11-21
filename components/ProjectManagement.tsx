import React, { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  Sparkles,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
  ChevronRight,
  ChevronDown,
  MapPin,
  FileText,
  Upload,
  CheckSquare,
  Square,
  Edit3,
  Trash2,
  Archive,
  RotateCcw,
  UserCheck,
  Mail,
  Phone,
  ShieldCheck,
  Image as ImageIcon,
  ClipboardCheck,
  Wrench,
  Home,
  X,
  Check
} from 'lucide-react';
import { ConstructionProject, HomeServiceCategory, Task } from '../types';
import { MOCK_TASKS } from '../constants';
import { generateProjectDetails, suggestProjectField } from '../geminiService';

interface ProjectManagementProps {
  projects: ConstructionProject[];
  onUpdateProjects: (projects: ConstructionProject[]) => void;
}

interface LeadTechProfile {
  id: string;
  name: string;
  title: string;
  email: string;
  phone: string;
  specialty: string;
  van: string;
  initials: string;
}

interface JobDocumentRecord {
  id: string;
  projectId: string;
  name: string;
  category: 'Written Estimate' | 'Before / After Photo' | 'Paint & Color Sheet' | 'Safety Checklist';
  uploadedAt: string;
  size: string;
  uploadedBy: string;
}

const LEAD_TECHS: LeadTechProfile[] = [
  {
    id: 'pm-1',
    name: 'Caleb Martinez',
    title: 'Senior Safety & Carpentry Lead',
    email: 'caleb@sierrahomepros.com',
    phone: '(775) 555-0142',
    specialty: 'ADA Grab Bars, Ramps & Winter Maintenance',
    van: 'Van #1 · Sparks Depot',
    initials: 'CM'
  },
  {
    id: 'pm-2',
    name: 'Braden Vance',
    title: 'Master Painter & Drywall Lead',
    email: 'braden@sierrahomepros.com',
    phone: '(775) 555-0188',
    specialty: 'Interior/Exterior Painting & Trim Repairs',
    van: 'Van #2 · Reno / Tahoe',
    initials: 'BV'
  },
  {
    id: 'pm-3',
    name: 'Elena Morales',
    title: 'Smart-Home & Handyman Specialist',
    email: 'elena@sierrahomepros.com',
    phone: '(775) 555-0194',
    specialty: 'Smart Locks, Thermostats & Doorbells',
    van: 'Van #3 · Sparks / Reno',
    initials: 'EM'
  }
];

const SERVICE_CATEGORIES: HomeServiceCategory[] = [
  'Handyman Repair',
  'Smart Home',
  'Interior/Exterior Painting',
  'Maintenance Plan',
  'Senior Safety'
];

const SERVICE_LOCATIONS = [
  { name: 'Sparks, NV', lat: 39.5349, lng: -119.7527 },
  { name: 'Reno, NV', lat: 39.5296, lng: -119.8138 },
  { name: 'Carson City, NV', lat: 39.1638, lng: -119.7674 },
  { name: 'Lake Tahoe (Incline Village), NV', lat: 39.2513, lng: -119.9729 },
  { name: 'South Reno / Damonte Ranch, NV', lat: 39.4235, lng: -119.7491 }
];

const INITIAL_RECORDS: JobDocumentRecord[] = [
  {
    id: 'doc-1',
    projectId: 'p1',
    name: 'Written_Estimate_Chen_SeniorSafety_v2.pdf',
    category: 'Written Estimate',
    uploadedAt: 'Nov 17, 2026',
    size: '420 KB',
    uploadedBy: 'Jordan Vance'
  },
  {
    id: 'doc-2',
    projectId: 'p1',
    name: 'PrimaryBath_StudLocations_PullLoad_Checklist.pdf',
    category: 'Safety Checklist',
    uploadedAt: 'Nov 19, 2026',
    size: '310 KB',
    uploadedBy: 'Caleb Martinez'
  },
  {
    id: 'doc-3',
    projectId: 'p2',
    name: 'SherwinWilliams_SW7006_Trim_CedarStain_Sheet.pdf',
    category: 'Paint & Color Sheet',
    uploadedAt: 'Nov 10, 2026',
    size: '580 KB',
    uploadedBy: 'Braden Vance'
  },
  {
    id: 'doc-4',
    projectId: 'p2',
    name: 'InclineVillage_DeckSanding_Progress_Photos.zip',
    category: 'Before / After Photo',
    uploadedAt: 'Nov 14, 2026',
    size: '4.6 MB',
    uploadedBy: 'Braden Vance'
  },
  {
    id: 'doc-5',
    projectId: 'p3',
    name: 'Written_Estimate_Nair_SmartHomeBundle.pdf',
    category: 'Written Estimate',
    uploadedAt: 'Nov 19, 2026',
    size: '390 KB',
    uploadedBy: 'Elena Morales'
  },
  {
    id: 'doc-6',
    projectId: 'p4',
    name: 'Holloway_Winterization_22Point_Checklist.pdf',
    category: 'Safety Checklist',
    uploadedAt: 'Nov 19, 2026',
    size: '275 KB',
    uploadedBy: 'Caleb Martinez'
  },
  {
    id: 'doc-7',
    projectId: 'p5',
    name: 'Somersett_DrywallPatch_BeforeAfter.jpg',
    category: 'Before / After Photo',
    uploadedAt: 'Nov 18, 2026',
    size: '1.8 MB',
    uploadedBy: 'Braden Vance'
  }
];

const formatUSD = (val: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

const ProjectManagement: React.FC<ProjectManagementProps> = ({ projects, onUpdateProjects }) => {
  const [tasks, setTasks] = useState<Task[]>(MOCK_TASKS);
  const [records, setRecords] = useState<JobDocumentRecord[]>(INITIAL_RECORDS);
  const [selectedProjectId, setSelectedProjectId] = useState<string>(projects[0]?.id || 'p1');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [showArchived, setShowArchived] = useState(false);
  const [activeDetailTab, setActiveDetailTab] = useState<'overview' | 'checklist' | 'files'>('overview');

  // New Job Modal state
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [aiBrief, setAiBrief] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [suggestingField, setSuggestingField] = useState<'name' | 'client' | 'budget' | null>(null);
  const [formData, setFormData] = useState<{
    name: string;
    client: string;
    budget: string;
    serviceCategory: HomeServiceCategory;
    locationName: string;
    assignedPM: string;
    startDate: string;
    endDate: string;
    riskLevel: 'low' | 'medium' | 'high';
  }>({
    name: '',
    client: '',
    budget: '1450',
    serviceCategory: 'Handyman Repair',
    locationName: 'Sparks, NV',
    assignedPM: 'pm-1',
    startDate: '2026-11-23',
    endDate: '2026-11-25',
    riskLevel: 'low'
  });
  const [generatedTasks, setGeneratedTasks] = useState<{ title: string; assignee: string }[]>([]);

  // Inline task creation & editing
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskAssignee, setNewTaskAssignee] = useState('Caleb Martinez');
  const [isEditingEstimate, setIsEditingEstimate] = useState(false);
  const [editEstimateValue, setEditEstimateValue] = useState('');
  const [editSpentValue, setEditSpentValue] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const visibleProjects = useMemo(() => {
    return projects.filter((p) => {
      if (Boolean(p.isArchived) !== showArchived) return false;
      if (categoryFilter !== 'ALL' && p.serviceCategory !== categoryFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          p.client.toLowerCase().includes(q) ||
          (p.locationName || '').toLowerCase().includes(q) ||
          (p.serviceCategory || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [projects, showArchived, categoryFilter, searchQuery]);

  const selectedProject = useMemo(() => {
    return (
      projects.find((p) => p.id === selectedProjectId) ||
      visibleProjects[0] ||
      projects[0] ||
      null
    );
  }, [projects, selectedProjectId, visibleProjects]);

  const projectTasks = useMemo(
    () => (selectedProject ? tasks.filter((t) => t.projectId === selectedProject.id) : []),
    [tasks, selectedProject]
  );

  const projectRecords = useMemo(
    () => (selectedProject ? records.filter((r) => r.projectId === selectedProject.id) : []),
    [records, selectedProject]
  );

  const assignedTech = useMemo(() => {
    if (!selectedProject) return LEAD_TECHS[0];
    return LEAD_TECHS.find((t) => t.id === selectedProject.assignedPM) || LEAD_TECHS[0];
  }, [selectedProject]);

  const notify = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage((prev) => (prev === msg ? null : prev)), 3500);
  };

  const handleGenerateWithAI = async () => {
    if (!aiBrief.trim()) return;
    setIsGenerating(true);
    const result = await generateProjectDetails(aiBrief);
    if (result && result.name) {
      setFormData((prev) => ({
        ...prev,
        name: result.name || prev.name,
        client: result.client || prev.client,
        budget: result.budget ? String(Math.round(result.budget)) : prev.budget
      }));
      if (Array.isArray(result.tasks)) {
        setGeneratedTasks(result.tasks);
      }
    }
    setIsGenerating(false);
  };

  const handleSuggestField = async (field: 'name' | 'client' | 'budget') => {
    const context = aiBrief.trim() || `${formData.serviceCategory} home service job in ${formData.locationName}`;
    setSuggestingField(field);
    const val = await suggestProjectField(field, context);
    if (val) {
      setFormData((prev) => ({
        ...prev,
        [field]: field === 'budget' ? val.replace(/[^0-9]/g, '') || prev.budget : val
      }));
    }
    setSuggestingField(null);
  };

  const handleCreateJob = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.client.trim()) return;

    const loc = SERVICE_LOCATIONS.find((l) => l.name === formData.locationName) || SERVICE_LOCATIONS[0];
    const newId = `p-${Date.now()}`;
    const parsedBudget = Math.max(150, Number(formData.budget) || 1200);

    const newJob: ConstructionProject = {
      id: newId,
      name: formData.name.trim(),
      client: formData.client.trim(),
      status: 'active',
      budget: parsedBudget,
      spent: 0,
      startDate: formData.startDate,
      endDate: formData.endDate,
      completion: 0,
      riskLevel: formData.riskLevel,
      serviceCategory: formData.serviceCategory,
      locationName: loc.name,
      latitude: loc.lat,
      longitude: loc.lng,
      assignedPM: formData.assignedPM,
      isArchived: false
    };

    onUpdateProjects([newJob, ...projects]);

    if (generatedTasks.length > 0) {
      const mappedTasks: Task[] = generatedTasks.map((t, idx) => ({
        id: `t-${Date.now()}-${idx}`,
        projectId: newId,
        title: t.title,
        assignee: t.assignee || LEAD_TECHS.find((l) => l.id === formData.assignedPM)?.name || 'Caleb Martinez',
        start: formData.startDate,
        end: formData.endDate,
        status: 'todo'
      }));
      setTasks((prev) => [...mappedTasks, ...prev]);
    }

    setSelectedProjectId(newId);
    setIsNewModalOpen(false);
    setAiBrief('');
    setGeneratedTasks([]);
    setFormData({
      name: '',
      client: '',
      budget: '1450',
      serviceCategory: 'Handyman Repair',
      locationName: 'Sparks, NV',
      assignedPM: 'pm-1',
      startDate: '2026-11-23',
      endDate: '2026-11-25',
      riskLevel: 'low'
    });
    notify(`Created written estimate & service job "${newJob.name}"`);
  };

  const handleToggleTask = (taskId: string) => {
    const updated = tasks.map((t) =>
      t.id === taskId ? { ...t, status: t.status === 'done' ? ('in-progress' as const) : ('done' as const) } : t
    );
    setTasks(updated);

    if (selectedProject) {
      const projTasks = updated.filter((t) => t.projectId === selectedProject.id);
      if (projTasks.length > 0) {
        const doneCount = projTasks.filter((t) => t.status === 'done').length;
        const pct = Math.round((doneCount / projTasks.length) * 100);
        onUpdateProjects(
          projects.map((p) => (p.id === selectedProject.id ? { ...p, completion: pct } : p))
        );
      }
    }
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject || !newTaskTitle.trim()) return;
    const item: Task = {
      id: `t-${Date.now()}`,
      projectId: selectedProject.id,
      title: newTaskTitle.trim(),
      assignee: newTaskAssignee,
      start: selectedProject.startDate,
      end: selectedProject.endDate,
      status: 'todo'
    };
    setTasks((prev) => [...prev, item]);
    setNewTaskTitle('');
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  };

  const handleUpdateJobField = (id: string, patch: Partial<ConstructionProject>) => {
    onUpdateProjects(projects.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  };

  const handleSaveEstimateEdit = () => {
    if (!selectedProject) return;
    const nextBudget = Math.max(100, Number(editEstimateValue) || selectedProject.budget);
    const nextSpent = Math.max(0, Number(editSpentValue) || 0);
    handleUpdateJobField(selectedProject.id, { budget: nextBudget, spent: nextSpent });
    setIsEditingEstimate(false);
    notify('Updated written estimate and incurred job cost.');
  };

  const handleUploadMockFile = (category: JobDocumentRecord['category']) => {
    if (!selectedProject) return;
    const cleanSlug = selectedProject.name.split(' ').slice(0, 2).join('_').replace(/[^a-zA-Z0-9_]/g, '');
    const ext = category === 'Before / After Photo' ? 'jpg' : 'pdf';
    const newRec: JobDocumentRecord = {
      id: `doc-${Date.now()}`,
      projectId: selectedProject.id,
      name: `${cleanSlug}_${category.replace(/[^a-zA-Z]/g, '')}_${new Date().toISOString().slice(5, 10)}.${ext}`,
      category,
      uploadedAt: 'Just now',
      size: category === 'Before / After Photo' ? '2.1 MB' : '340 KB',
      uploadedBy: assignedTech.name
    };
    setRecords((prev) => [newRec, ...prev]);
    notify(`Saved "${newRec.name}" to homeowner folder.`);
  };

  const handleDeleteJob = (id: string) => {
    const remaining = projects.filter((p) => p.id !== id);
    onUpdateProjects(remaining);
    setConfirmDeleteId(null);
    if (selectedProjectId === id && remaining.length > 0) {
      setSelectedProjectId(remaining[0].id);
    }
    notify('Removed service job from active list.');
  };

  const activeCount = projects.filter((p) => !p.isArchived).length;
  const totalEstimateValue = projects.filter((p) => !p.isArchived).reduce((s, p) => s + p.budget, 0);
  const totalSpentValue = projects.filter((p) => !p.isArchived).reduce((s, p) => s + p.spent, 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-zinc-500 mb-1">
            <span>Sierra Home Pros</span>
            <span>·</span>
            <span>Reno–Sparks · Carson City · Lake Tahoe</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100">Service Jobs & Written Estimates</h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowArchived(!showArchived)}
            className={`px-3.5 py-2 rounded-lg text-xs font-medium border transition-colors flex items-center gap-2 ${
              showArchived
                ? 'bg-zinc-800 border-zinc-700 text-zinc-100'
                : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Archive size={14} />
            {showArchived ? 'Viewing Archived' : 'Archived Jobs'}
          </button>
          <button
            onClick={() => setIsNewModalOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors"
          >
            <Plus size={15} /> New Written Estimate
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 px-4 py-2.5 rounded-lg text-xs flex items-center justify-between">
          <span className="flex items-center gap-2">
            <CheckCircle2 size={14} />
            {statusMessage}
          </span>
          <button onClick={() => setStatusMessage(null)} className="text-emerald-400 hover:text-emerald-200">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Compact Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-4">
          <p className="text-xs text-zinc-500">Active Home Jobs</p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-bold font-mono tabular-nums text-zinc-100">{activeCount}</span>
            <span className="text-xs text-emerald-400">Upfront written quotes</span>
          </div>
        </div>
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-4">
          <p className="text-xs text-zinc-500">Approved Written Estimates</p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-bold font-mono tabular-nums text-zinc-100">{formatUSD(totalEstimateValue)}</span>
            <span className="text-xs text-zinc-400 font-mono tabular-nums">Avg {formatUSD(activeCount ? totalEstimateValue / activeCount : 0)}/job</span>
          </div>
        </div>
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-4">
          <p className="text-xs text-zinc-500">Incurred Labor & Materials</p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-bold font-mono tabular-nums text-zinc-100">{formatUSD(totalSpentValue)}</span>
            <span className="text-xs text-emerald-400 font-mono tabular-nums">
              {totalEstimateValue > 0 ? `${Math.round(((totalEstimateValue - totalSpentValue) / totalEstimateValue) * 100)}% remaining` : '0%'}
            </span>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search homeowner, neighborhood, or service..."
            className="w-full bg-zinc-900/60 border border-zinc-800 rounded-lg pl-9 pr-4 py-2 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500/60"
          />
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {['ALL', ...SERVICE_CATEGORIES].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                categoryFilter === cat
                  ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-zinc-900/60 text-zinc-400 border border-zinc-800 hover:text-zinc-200'
              }`}
            >
              {cat === 'ALL' ? 'All Services' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Main Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Service Job List */}
        <div className="lg:col-span-5 space-y-2.5">
          {visibleProjects.length === 0 ? (
            <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-8 text-center">
              <Home size={28} className="mx-auto text-zinc-600 mb-2" />
              <p className="text-sm font-medium text-zinc-300">No service jobs match this filter</p>
              <p className="text-xs text-zinc-500 mt-1">Adjust your search or create a new written estimate.</p>
            </div>
          ) : (
            visibleProjects.map((job) => {
              const isSelected = selectedProject?.id === job.id;
              const marginRatio = job.budget > 0 ? Math.round((job.spent / job.budget) * 100) : 0;
              return (
                <button
                  key={job.id}
                  onClick={() => {
                    setSelectedProjectId(job.id);
                    setIsEditingEstimate(false);
                  }}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${
                    isSelected
                      ? 'bg-zinc-900 border-emerald-500/50 ring-1 ring-emerald-500/20'
                      : 'bg-zinc-900/40 border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-900/70'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs text-zinc-400 truncate">
                        {job.serviceCategory || 'Handyman Repair'} · {job.locationName || 'Reno–Sparks, NV'}
                      </p>
                      <h3 className="text-sm font-semibold text-zinc-100 mt-0.5 truncate">{job.name}</h3>
                      <p className="text-xs text-zinc-500 mt-0.5 truncate">{job.client}</p>
                    </div>
                    <span
                      className={`text-[11px] font-medium px-2 py-0.5 rounded shrink-0 ${
                        job.status === 'on-hold'
                          ? 'bg-amber-500/15 text-amber-300'
                          : job.status === 'completed'
                          ? 'bg-emerald-500/15 text-emerald-300'
                          : 'bg-zinc-800 text-zinc-300'
                      }`}
                    >
                      {job.status === 'on-hold' ? 'Weather Hold' : job.status === 'completed' ? 'Completed' : 'Scheduled'}
                    </span>
                  </div>

                  <div className="mt-3 pt-3 border-t border-zinc-800/70 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3 font-mono tabular-nums">
                      <span className="text-zinc-200 font-semibold">{formatUSD(job.budget)}</span>
                      <span className={marginRatio > 85 ? 'text-amber-400' : 'text-zinc-500'}>
                        {formatUSD(job.spent)} spent
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            job.riskLevel === 'high' ? 'bg-amber-400' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${job.completion}%` }}
                        />
                      </div>
                      <span className="font-mono tabular-nums text-zinc-400">{job.completion}%</span>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Right: Selected Service Job Inspector */}
        {selectedProject && (
          <div className="lg:col-span-7 bg-zinc-900/60 border border-zinc-800/80 rounded-xl overflow-hidden">
            {/* Inspector Header */}
            <div className="p-6 border-b border-zinc-800/80">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-xs text-zinc-400">
                    <span>{selectedProject.serviceCategory || 'Handyman Repair'}</span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <MapPin size={12} className="text-emerald-400" />
                      {selectedProject.locationName || 'Sparks, NV'}
                    </span>
                    <span>·</span>
                    <span className="font-mono tabular-nums">
                      {selectedProject.startDate} to {selectedProject.endDate}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-zinc-100 mt-1">{selectedProject.name}</h2>
                  <p className="text-sm text-zinc-400 mt-0.5">{selectedProject.client}</p>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={selectedProject.status}
                    onChange={(e) =>
                      handleUpdateJobField(selectedProject.id, {
                        status: e.target.value as ConstructionProject['status']
                      })
                    }
                    className="bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="planning">Estimate Pending</option>
                    <option value="active">Scheduled / Active</option>
                    <option value="on-hold">Weather / Parts Hold</option>
                    <option value="completed">Completed</option>
                  </select>

                  <button
                    onClick={() => {
                      handleUpdateJobField(selectedProject.id, { isArchived: !selectedProject.isArchived });
                      notify(selectedProject.isArchived ? 'Restored job to active schedule.' : 'Archived service job.');
                    }}
                    className="p-2 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-zinc-100 transition-colors"
                    title={selectedProject.isArchived ? 'Restore Job' : 'Archive Job'}
                  >
                    {selectedProject.isArchived ? <RotateCcw size={14} /> : <Archive size={14} />}
                  </button>

                  {confirmDeleteId === selectedProject.id ? (
                    <div className="flex items-center gap-1 bg-red-500/10 border border-red-500/30 rounded-lg px-2 py-1">
                      <button
                        onClick={() => handleDeleteJob(selectedProject.id)}
                        className="text-xs font-semibold text-red-400 hover:text-red-300 px-1"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        className="text-zinc-400 hover:text-zinc-200"
                      >
                        <X size={13} />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDeleteId(selectedProject.id)}
                      className="p-2 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-red-400 transition-colors"
                      title="Delete Job"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>

              {/* Detail Tabs */}
              <div className="flex items-center gap-5 mt-5 border-b border-zinc-800/70 -mb-6">
                {(
                  [
                    { id: 'overview', label: 'Estimate & Lead Tech' },
                    { id: 'checklist', label: `Punch-List (${projectTasks.length})` },
                    { id: 'files', label: `Homeowner Docs (${projectRecords.length})` }
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveDetailTab(tab.id)}
                    className={`pb-3 text-xs font-semibold border-b-2 transition-colors ${
                      activeDetailTab === tab.id
                        ? 'border-emerald-500 text-emerald-400'
                        : 'border-transparent text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {activeDetailTab === 'overview' && (
                <div className="space-y-6">
                  {/* Written Estimate & Margin Panel */}
                  <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                        Upfront Written Estimate vs. Cost
                      </h3>
                      {!isEditingEstimate ? (
                        <button
                          onClick={() => {
                            setEditEstimateValue(String(selectedProject.budget));
                            setEditSpentValue(String(selectedProject.spent));
                            setIsEditingEstimate(true);
                          }}
                          className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                        >
                          <Edit3 size={12} /> Adjust Estimate
                        </button>
                      ) : (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={handleSaveEstimateEdit}
                            className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                          >
                            <Check size={13} /> Save
                          </button>
                          <button
                            onClick={() => setIsEditingEstimate(false)}
                            className="text-xs text-zinc-400 hover:text-zinc-200"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>

                    {isEditingEstimate ? (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-[11px] text-zinc-500 block mb-1">Written Estimate (USD)</label>
                          <input
                            type="number"
                            value={editEstimateValue}
                            onChange={(e) => setEditEstimateValue(e.target.value)}
                            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm font-mono text-zinc-100 focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-zinc-500 block mb-1">Incurred Cost (USD)</label>
                          <input
                            type="number"
                            value={editSpentValue}
                            onChange={(e) => setEditSpentValue(e.target.value)}
                            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm font-mono text-zinc-100 focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <p className="text-[11px] text-zinc-500">Written Price</p>
                          <p className="text-lg font-bold font-mono tabular-nums text-zinc-100 mt-0.5">
                            {formatUSD(selectedProject.budget)}
                          </p>
                        </div>
                        <div>
                          <p className="text-[11px] text-zinc-500">Actual Labor + Parts</p>
                          <p className="text-lg font-bold font-mono tabular-nums text-zinc-100 mt-0.5">
                            {formatUSD(selectedProject.spent)}
                          </p>
                        </div>
                        <div>
                          <p className="text-[11px] text-zinc-500">Est. Remaining</p>
                          <p
                            className={`text-lg font-bold font-mono tabular-nums mt-0.5 ${
                              selectedProject.budget - selectedProject.spent < selectedProject.budget * 0.15
                                ? 'text-amber-400'
                                : 'text-emerald-400'
                            }`}
                          >
                            {formatUSD(selectedProject.budget - selectedProject.spent)}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Progress Slider */}
                    <div className="mt-4 pt-4 border-t border-zinc-800/70">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-zinc-400">Visit Completion</span>
                        <span className="font-mono tabular-nums font-semibold text-emerald-400">
                          {selectedProject.completion}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        step={5}
                        value={selectedProject.completion}
                        onChange={(e) =>
                          handleUpdateJobField(selectedProject.id, { completion: Number(e.target.value) })
                        }
                        className="w-full accent-emerald-500 cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Assigned Lead Technician */}
                  <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                        Assigned Lead Technician
                      </h3>
                      <select
                        value={selectedProject.assignedPM || 'pm-1'}
                        onChange={(e) => handleUpdateJobField(selectedProject.id, { assignedPM: e.target.value })}
                        className="bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500"
                      >
                        {LEAD_TECHS.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name} ({t.van.split('·')[0].trim()})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-start gap-3.5">
                      <div className="w-10 h-10 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-300 font-bold text-xs shrink-0">
                        {assignedTech.initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-zinc-100">{assignedTech.name}</p>
                        <p className="text-xs text-zinc-400">
                          {assignedTech.title} · {assignedTech.van}
                        </p>
                        <p className="text-xs text-zinc-500 mt-1">{assignedTech.specialty}</p>
                        <div className="flex flex-wrap items-center gap-4 mt-2.5 text-xs text-zinc-400">
                          <span className="flex items-center gap-1.5">
                            <Phone size={12} className="text-emerald-400" />
                            {assignedTech.phone}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Mail size={12} className="text-emerald-400" />
                            {assignedTech.email}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Clean-Home Promise Reminder */}
                  <div className="flex items-start gap-3 p-3.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                    <ShieldCheck size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                    <div className="text-xs text-zinc-300 leading-relaxed">
                      <span className="font-semibold text-emerald-300">Sierra Home Pros Guarantee:</span> Every add-on
                      item discovered on-site requires a homeowner-approved written estimate update before additional
                      work starts. Floor protection and final walkthrough photos are logged before closeout.
                    </div>
                  </div>
                </div>
              )}

              {activeDetailTab === 'checklist' && (
                <div className="space-y-4">
                  <form onSubmit={handleAddTask} className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      placeholder="Add homeowner punch-list item..."
                      className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500"
                    />
                    <select
                      value={newTaskAssignee}
                      onChange={(e) => setNewTaskAssignee(e.target.value)}
                      className="bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-2 text-xs text-zinc-300 focus:outline-none focus:border-emerald-500"
                    >
                      {LEAD_TECHS.map((t) => (
                        <option key={t.id} value={t.name}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                    <button
                      type="submit"
                      className="bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2 rounded-lg text-xs font-semibold shrink-0"
                    >
                      Add Item
                    </button>
                  </form>

                  <div className="space-y-2">
                    {projectTasks.length === 0 ? (
                      <p className="text-xs text-zinc-500 text-center py-8">
                        No punch-list tasks yet for this service visit.
                      </p>
                    ) : (
                      projectTasks.map((task) => {
                        const isDone = task.status === 'done';
                        return (
                          <div
                            key={task.id}
                            className="flex items-center justify-between gap-3 p-3 rounded-lg bg-zinc-950/60 border border-zinc-800/80"
                          >
                            <button
                              onClick={() => handleToggleTask(task.id)}
                              className="flex items-center gap-3 text-left flex-1 min-w-0"
                            >
                              {isDone ? (
                                <CheckSquare size={16} className="text-emerald-400 shrink-0" />
                              ) : (
                                <Square size={16} className="text-zinc-500 shrink-0" />
                              )}
                              <div className="min-w-0">
                                <p
                                  className={`text-xs font-medium truncate ${
                                    isDone ? 'line-through text-zinc-500' : 'text-zinc-200'
                                  }`}
                                >
                                  {task.title}
                                </p>
                                <p className="text-[11px] text-zinc-500">
                                  {task.assignee} · {task.start} to {task.end}
                                </p>
                              </div>
                            </button>
                            <button
                              onClick={() => handleDeleteTask(task.id)}
                              className="text-zinc-600 hover:text-red-400 p-1 transition-colors"
                              title="Remove task"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {activeDetailTab === 'files' && (
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {(
                      [
                        'Written Estimate',
                        'Before / After Photo',
                        'Paint & Color Sheet',
                        'Safety Checklist'
                      ] as const
                    ).map((cat) => (
                      <button
                        key={cat}
                        onClick={() => handleUploadMockFile(cat)}
                        className="px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 hover:border-emerald-500/40 text-xs text-zinc-300 hover:text-emerald-300 flex items-center gap-1.5 transition-colors"
                      >
                        <Upload size={12} /> Attach {cat}
                      </button>
                    ))}
                  </div>

                  <div className="space-y-2">
                    {projectRecords.length === 0 ? (
                      <p className="text-xs text-zinc-500 text-center py-8">
                        No homeowner documents uploaded yet.
                      </p>
                    ) : (
                      projectRecords.map((rec) => (
                        <div
                          key={rec.id}
                          className="flex items-center justify-between gap-3 p-3 rounded-lg bg-zinc-950/60 border border-zinc-800/80"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-emerald-400 shrink-0">
                              {rec.category === 'Before / After Photo' ? (
                                <ImageIcon size={15} />
                              ) : rec.category === 'Safety Checklist' ? (
                                <ClipboardCheck size={15} />
                              ) : (
                                <FileText size={15} />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-medium text-zinc-200 truncate">{rec.name}</p>
                              <p className="text-[11px] text-zinc-500">
                                {rec.category} · {rec.uploadedBy} · {rec.uploadedAt} · {rec.size}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => setRecords((prev) => prev.filter((r) => r.id !== rec.id))}
                            className="text-zinc-600 hover:text-red-400 p-1"
                            title="Delete file"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* New Written Estimate / Service Job Modal */}
      {isNewModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-zinc-100">Create Service Job & Written Estimate</h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Describe the homeowner request or enter details directly for Reno–Sparks, Carson City, or Lake Tahoe.
                </p>
              </div>
              <button
                onClick={() => setIsNewModalOpen(false)}
                className="text-zinc-500 hover:text-zinc-200 p-1"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateJob} className="p-5 space-y-5">
              {/* AI Estimate Drafter */}
              <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 space-y-2.5">
                <label className="text-xs font-semibold text-emerald-300 flex items-center gap-1.5">
                  <Sparkles size={14} /> AI Written Estimate Assistant
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={aiBrief}
                    onChange={(e) => setAiBrief(e.target.value)}
                    placeholder="e.g. Install 3 bathroom grab bars and patch hallway drywall in Sparks..."
                    className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={handleGenerateWithAI}
                    disabled={isGenerating || !aiBrief.trim()}
                    className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 shrink-0"
                  >
                    {isGenerating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                    Draft Scope
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs text-zinc-400">Service Job Title</label>
                    <button
                      type="button"
                      onClick={() => handleSuggestField('name')}
                      className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                    >
                      {suggestingField === 'name' ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} />}
                      Suggest
                    </button>
                  </div>
                  <input
                    required
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Spanish Springs Bathroom Grab Bars & Drywall Repair"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs text-zinc-400">Homeowner & City</label>
                    <button
                      type="button"
                      onClick={() => handleSuggestField('client')}
                      className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                    >
                      {suggestingField === 'client' ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} />}
                      Suggest
                    </button>
                  </div>
                  <input
                    required
                    type="text"
                    value={formData.client}
                    onChange={(e) => setFormData({ ...formData, client: e.target.value })}
                    placeholder="e.g. Linda & Mark Patel · Sparks, NV"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs text-zinc-400">Written Estimate Price (USD)</label>
                    <button
                      type="button"
                      onClick={() => handleSuggestField('budget')}
                      className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                    >
                      {suggestingField === 'budget' ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} />}
                      Suggest
                    </button>
                  </div>
                  <input
                    required
                    type="number"
                    min={100}
                    value={formData.budget}
                    onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-zinc-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Service Category</label>
                  <select
                    value={formData.serviceCategory}
                    onChange={(e) =>
                      setFormData({ ...formData, serviceCategory: e.target.value as HomeServiceCategory })
                    }
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500"
                  >
                    {SERVICE_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Service Area</label>
                  <select
                    value={formData.locationName}
                    onChange={(e) => setFormData({ ...formData, locationName: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500"
                  >
                    {SERVICE_LOCATIONS.map((loc) => (
                      <option key={loc.name} value={loc.name}>
                        {loc.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Lead Technician</label>
                  <select
                    value={formData.assignedPM}
                    onChange={(e) => setFormData({ ...formData, assignedPM: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500"
                  >
                    {LEAD_TECHS.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} — {t.van}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-zinc-400 block mb-1">Visit Start</label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-2 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-zinc-400 block mb-1">Target Finish</label>
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-2 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {generatedTasks.length > 0 && (
                <div className="bg-zinc-950/60 border border-zinc-800 rounded-xl p-3.5 space-y-2">
                  <p className="text-xs font-semibold text-zinc-300">AI-Generated Punch-List ({generatedTasks.length})</p>
                  <ul className="space-y-1">
                    {generatedTasks.map((gt, idx) => (
                      <li key={idx} className="text-xs text-zinc-400 flex items-center gap-2">
                        <CheckCircle2 size={12} className="text-emerald-400 shrink-0" />
                        <span>{gt.title}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-zinc-400 hover:text-zinc-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2 rounded-lg text-xs font-semibold"
                >
                  Save Written Estimate & Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectManagement;
