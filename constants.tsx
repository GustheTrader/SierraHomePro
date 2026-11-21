import React from 'react';
import { 
  LayoutDashboard, 
  Wrench, 
  DollarSign, 
  Users, 
  BrainCircuit, 
  Settings,
  TrendingUp,
  Clock,
  ShoppingCart,
  ClipboardCheck,
  AlertTriangle,
  CheckCircle,
  FileText,
  Activity,
  Home,
  BarChart3,
  HeartHandshake,
  HelpCircle,
  Truck
} from 'lucide-react';
import { Agent, ConstructionProject, Task, Subcontractor, BuyoutPackage, Integration } from './types';

export const COMPANY_INFO = {
  name: 'Sierra Home Pros',
  legalName: 'Sierra Home Pros LLC',
  website: 'https://sierrahomepros.com',
  phone: '(888) 919-6447',
  email: 'hello@sierrahomepros.com',
  headquarters: 'Sparks, NV',
  serviceAreas: ['Reno–Sparks', 'Carson City', 'Lake Tahoe'],
  tagline: 'Written Estimates · Local Home Repair & Maintenance Pros'
};

export const AGENTS: Agent[] = [
  { id: 'a1', name: 'Sierra Scheduler', role: 'Planner', description: 'Daily route sequencing across Reno, Sparks, Carson City, and Lake Tahoe', status: 'online', icon: 'Clock' },
  { id: 'a2', name: 'Sierra Estimator', role: 'Predictor', description: 'Upfront written-estimate pricing, materials forecasting, and margin tracking', status: 'online', icon: 'TrendingUp' },
  { id: 'a3', name: 'Sierra Memory', role: 'Memory', description: 'Tracks homeowner preferences, paint colors, and seasonal maintenance history', status: 'online', icon: 'BrainCircuit' },
  { id: 'a4', name: 'Sierra Safety Check', role: 'Validator', description: 'Senior ADA home-safety standards, quality checklists, and clean-home QA', status: 'online', icon: 'ShieldCheck' },
  { id: 'a5', name: 'Sierra Route Pro', role: 'Optimizer', description: 'Balances multi-skilled handyman vans to maximize first-visit fix rates', status: 'online', icon: 'Wrench' },
  { id: 'a6', name: 'Sierra Supply', role: 'Relational', description: 'Coordinates local Sparks & Reno supply pickups and specialty hardware orders', status: 'online', icon: 'Network' },
  { id: 'a7', name: 'Sierra Ops Lead', role: 'Supervisor', description: 'Coordinates dispatch, written estimates, and homeowner follow-ups', status: 'online', icon: 'LayoutDashboard' },
];

export const MOCK_INTEGRATIONS: Integration[] = [
  { id: 'int-1', provider: 'Jobber', status: 'connected', lastSync: '2026-11-21T07:30:00Z', dataPoints: 418 },
  { id: 'int-2', provider: 'QuickBooks', status: 'connected', lastSync: '2026-11-21T07:45:00Z', dataPoints: 295 },
  { id: 'int-3', provider: 'HomeDepotPro', status: 'disconnected', lastSync: '2026-11-20T16:15:00Z', dataPoints: 164 },
];

export const INITIAL_PROJECTS: ConstructionProject[] = [
  {
    id: 'p1',
    name: 'Damonte Ranch Senior Safety & Accessibility Upgrade',
    client: 'Margaret & Robert Chen · Reno, NV',
    status: 'active',
    budget: 3850,
    spent: 2420,
    startDate: '2026-11-18',
    endDate: '2026-11-24',
    completion: 55,
    riskLevel: 'medium',
    serviceCategory: 'Senior Safety',
    locationName: 'Reno, NV',
    latitude: 39.4235,
    longitude: -119.7491,
    assignedPM: 'pm-1',
    isArchived: false
  },
  {
    id: 'p2',
    name: 'Incline Village Exterior Trim & Cedar Deck Painting',
    client: 'Daniel & Claire Vance · Lake Tahoe, NV',
    status: 'on-hold',
    budget: 6400,
    spent: 5780,
    startDate: '2026-11-10',
    endDate: '2026-11-25',
    completion: 78,
    riskLevel: 'high',
    serviceCategory: 'Interior/Exterior Painting',
    locationName: 'Lake Tahoe, NV',
    latitude: 39.2513,
    longitude: -119.9729,
    assignedPM: 'pm-2',
    isArchived: false
  },
  {
    id: 'p3',
    name: 'Wingfield Springs Smart-Home & Security Package',
    client: 'Priya Nair · Sparks, NV',
    status: 'active',
    budget: 1850,
    spent: 740,
    startDate: '2026-11-20',
    endDate: '2026-11-23',
    completion: 45,
    riskLevel: 'low',
    serviceCategory: 'Smart Home',
    locationName: 'Sparks, NV',
    latitude: 39.5912,
    longitude: -119.7014,
    assignedPM: 'pm-3',
    isArchived: false
  },
  {
    id: 'p4',
    name: 'Carson City Winter Home Maintenance Plan',
    client: 'Thomas & Linda Holloway · Carson City, NV',
    status: 'active',
    budget: 1200,
    spent: 360,
    startDate: '2026-11-19',
    endDate: '2026-11-26',
    completion: 35,
    riskLevel: 'low',
    serviceCategory: 'Maintenance Plan',
    locationName: 'Carson City, NV',
    latitude: 39.1638,
    longitude: -119.7674,
    assignedPM: 'pm-1',
    isArchived: false
  },
  {
    id: 'p5',
    name: 'Somersett Drywall, Trim & Interior Door Repair Bundle',
    client: 'Kevin & Sarah Brooks · Reno, NV',
    status: 'active',
    budget: 1480,
    spent: 1190,
    startDate: '2026-11-17',
    endDate: '2026-11-22',
    completion: 65,
    riskLevel: 'medium',
    serviceCategory: 'Handyman Repair',
    locationName: 'Reno, NV',
    latitude: 39.5484,
    longitude: -119.9367,
    assignedPM: 'pm-2',
    isArchived: false
  }
];

export const MOCK_TASKS: Task[] = [
  { id: 't1', projectId: 'p1', title: 'Anchor stainless ADA grab bars into primary bath studs', assignee: 'Caleb Martinez', start: '2026-11-18', end: '2026-11-19', status: 'done' },
  { id: 't2', projectId: 'p1', title: 'Install non-slip threshold ramp & lever door handles', assignee: 'Caleb Martinez', start: '2026-11-20', end: '2026-11-22', status: 'in-progress' },
  { id: 't3', projectId: 'p1', title: 'Wire motion-activated hallway nightlights & final walk-through', assignee: 'Elena Morales', start: '2026-11-23', end: '2026-11-24', status: 'todo' },
  { id: 't4', projectId: 'p2', title: 'Pressure-wash and sand cedar fascia & deck railings', assignee: 'Braden Vance', start: '2026-11-10', end: '2026-11-14', status: 'done' },
  { id: 't5', projectId: 'p2', title: 'Apply cold-weather exterior stain & trim finish coat', assignee: 'Braden Vance', start: '2026-11-22', end: '2026-11-25', status: 'in-progress' },
  { id: 't6', projectId: 'p3', title: 'Mount Nest thermostat, video doorbell & 2 smart deadbolts', assignee: 'Elena Morales', start: '2026-11-20', end: '2026-11-22', status: 'in-progress' },
];

export const MOCK_SUBCONTRACTORS: Subcontractor[] = [
  { id: 's1', name: 'Sherwin-Williams Commercial (Sparks)', trade: 'Interior & Exterior Paint', safetyScore: 0.99, experienceYears: 24, insuranceStatus: 'active', status: 'prequalified' },
  { id: 's2', name: 'Home Depot Pro Desk — Sparks Blvd', trade: 'Hardware & Handyman Supplies', safetyScore: 0.98, experienceYears: 20, insuranceStatus: 'active', status: 'bidding' },
  { id: 's3', name: 'Sierra Lock & Smart Home Supply', trade: 'Smart Locks & Sensors', safetyScore: 0.97, experienceYears: 12, insuranceStatus: 'active', status: 'prequalified' },
  { id: 's4', name: 'Reno ADA & Senior Mobility Direct', trade: 'Senior Safety Hardware', safetyScore: 0.99, experienceYears: 15, insuranceStatus: 'active', status: 'prequalified' },
];

export const MOCK_BUYOUT_PACKAGES: BuyoutPackage[] = [
  { 
    id: 'bp1', 
    projectId: 'p1', 
    title: 'ADA Grab Bars, Threshold Ramp & Motion Lighting Kit', 
    trade: 'Senior Safety Hardware', 
    status: 'bidding', 
    budgetedAmount: 1450, 
    bids: [
      { id: 'b1', subcontractorId: 's4', packageId: 'bp1', amount: 1320, scopeCoverage: 100, proposedStart: '2026-11-18', proposedEnd: '2026-11-20', status: 'submitted' },
      { id: 'b2', subcontractorId: 's2', packageId: 'bp1', amount: 1410, scopeCoverage: 95, proposedStart: '2026-11-19', proposedEnd: '2026-11-21', status: 'submitted' }
    ] 
  },
  { 
    id: 'bp2', 
    projectId: 'p2', 
    title: 'Low-Temp Exterior Trim Paint & Semi-Transparent Deck Stain', 
    trade: 'Interior & Exterior Paint', 
    status: 'assessment', 
    budgetedAmount: 1180, 
    bids: [
      { id: 'b3', subcontractorId: 's1', packageId: 'bp2', amount: 1095, scopeCoverage: 100, proposedStart: '2026-11-21', proposedEnd: '2026-11-22', status: 'submitted' }
    ] 
  },
  { 
    id: 'bp3', 
    projectId: 'p3', 
    title: 'Smart Thermostat, Video Doorbell & Keypad Deadbolt Bundle', 
    trade: 'Smart Locks & Sensors', 
    status: 'bidding', 
    budgetedAmount: 920, 
    bids: [
      { id: 'b4', subcontractorId: 's3', packageId: 'bp3', amount: 865, scopeCoverage: 100, proposedStart: '2026-11-20', proposedEnd: '2026-11-21', status: 'submitted' }
    ] 
  },
];

export const NAV_ITEMS = [
  { icon: <LayoutDashboard size={18} />, label: 'Daily Operations', id: 'dashboard' },
  { icon: <HeartHandshake size={18} />, label: 'CRM & Plans', id: 'crm' },
  { icon: <Wrench size={18} />, label: 'Service Jobs', id: 'projects' },
  { icon: <HelpCircle size={18} />, label: 'Homeowner Requests', id: 'rfi' },
  { icon: <ShoppingCart size={18} />, label: 'Estimates & Supply', id: 'buyout' },
  { icon: <ClipboardCheck size={18} />, label: 'Field Dispatch', id: 'execution' },
  { icon: <DollarSign size={18} />, label: 'Job Costing', id: 'financials' },
  { icon: <Users size={18} />, label: 'Tech Schedules', id: 'resources' },
  { icon: <FileText size={18} />, label: 'Client Reports', id: 'reports' },
  { icon: <BrainCircuit size={18} />, label: 'Sierra AI Desk', id: 'ai' },
  { icon: <Settings size={18} />, label: 'Integrations', id: 'settings' },
];

export interface KPIItem {
  id: string;
  label: string;
  value: string;
  trend: string;
  icon: React.ReactNode;
  category: 'Financial' | 'Safety' | 'Operations' | 'Quality';
  description: string;
}

export const KPI_MASTER_LIST: KPIItem[] = [
  { id: 'kpi-1', label: 'Active Home Jobs', value: '4', trend: '+2 this week', icon: <Home className="text-emerald-400" size={18} />, category: 'Operations', description: 'Total residential repair, smart-home, painting, and safety visits scheduled.' },
  { id: 'kpi-2', label: 'Written Estimates Pipeline', value: '$14.8K', trend: '100% upfront pricing', icon: <TrendingUp className="text-emerald-400" size={18} />, category: 'Financial', description: 'Total approved written estimate value across active Northern Nevada jobs.' },
  { id: 'kpi-3', label: 'First-Visit Fix Rate', value: '94.5%', trend: 'Vans stocked daily', icon: <CheckCircle className="text-emerald-400" size={18} />, category: 'Quality', description: 'Percentage of handyman & smart-home calls completed on the first scheduled visit.' },
  { id: 'kpi-4', label: 'Weather / Risk Holds', value: '1', trend: 'Tahoe exterior paint', icon: <AlertTriangle className="text-amber-400" size={18} />, category: 'Operations', description: 'Jobs needing rescheduling or scope adjustment due to weather or homeowner changes.' },
  { id: 'kpi-5', label: 'Gross Job Margin', value: '29.1%', trend: 'Target 30%+', icon: <DollarSign className="text-emerald-400" size={18} />, category: 'Financial', description: 'Average margin across labor and materials after written estimate lock-in.' },
  { id: 'kpi-6', label: 'Estimate Turnaround', value: '4.2 Hrs', trend: 'Same-day quotes', icon: <FileText className="text-sky-400" size={18} />, category: 'Operations', description: 'Average time from homeowner inquiry to delivered written price estimate.' },
  { id: 'kpi-7', label: 'Senior Safety Pass Rate', value: '100%', trend: 'ADA stud-verified', icon: <HeartHandshake className="text-amber-400" size={18} />, category: 'Safety', description: 'Grab bars, ramps, and lighting upgrades passing pull-load and ADA safety checks.' },
  { id: 'kpi-8', label: 'Maintenance Plan Members', value: '38', trend: '+5 this month', icon: <Activity className="text-emerald-400" size={18} />, category: 'Operations', description: 'Active homeowners enrolled in recurring seasonal Sierra Home Pros maintenance plans.' },
  { id: 'kpi-9', label: 'Homeowner CSAT', value: '4.9 / 5', trend: '140+ local reviews', icon: <BarChart3 className="text-emerald-400" size={18} />, category: 'Quality', description: 'Post-visit homeowner satisfaction rating across Reno, Sparks, Carson City, and Tahoe.' },
  { id: 'kpi-10', label: 'Van Stock Readiness', value: '96%', trend: 'Sparks depot restock', icon: <Truck className="text-zinc-400" size={18} />, category: 'Financial', description: 'Percentage of standard repair hardware, anchors, and caulk stocked on service vans.' },
];

export const KPI_PRESETS = [
  { id: 'ops', label: 'Dispatch & Field Lead', kpis: ['kpi-1', 'kpi-3', 'kpi-4', 'kpi-10'], description: 'Focus on active daily visits, first-visit fix rate, holds, and van stock readiness.' },
  { id: 'owner', label: 'Owner & Written Estimates', kpis: ['kpi-2', 'kpi-5', 'kpi-6', 'kpi-8'], description: 'Focus on written estimate volume, job margins, quote speed, and maintenance plans.' },
  { id: 'care', label: 'Homeowner Care & Safety', kpis: ['kpi-7', 'kpi-9', 'kpi-3', 'kpi-1'], description: 'Focus on senior home-safety quality, homeowner reviews, and completion reliability.' },
];
