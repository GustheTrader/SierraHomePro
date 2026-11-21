export type AgentRole = 
  | 'Planner' 
  | 'Predictor' 
  | 'Memory' 
  | 'Validator' 
  | 'Optimizer' 
  | 'Relational' 
  | 'Supervisor';

export interface Agent {
  id: string;
  name: string;
  role: AgentRole;
  description: string;
  status: 'idle' | 'processing' | 'online';
  icon: string;
}

export interface SyncActivity {
  id: string;
  tool: string;
  type: 'Estimate' | 'Work Order' | 'Photo' | 'Timecard' | 'Maintenance';
  description: string;
  timestamp: string;
  status: 'processed' | 'flagged';
}

export interface Integration {
  id: string;
  provider: 'Jobber' | 'QuickBooks' | 'HomeDepotPro' | 'GoogleCalendar';
  status: 'connected' | 'disconnected' | 'syncing' | 'error';
  lastSync: string;
  dataPoints: number;
}

export type HomeServiceCategory =
  | 'Handyman Repair'
  | 'Smart Home'
  | 'Interior/Exterior Painting'
  | 'Maintenance Plan'
  | 'Senior Safety';

export interface ConstructionProject {
  id: string;
  name: string;
  client: string;
  status: 'planning' | 'active' | 'completed' | 'on-hold';
  budget: number; // Written estimate price in USD
  spent: number;  // Actual materials + tech labor cost incurred in USD
  startDate: string;
  endDate: string;
  completion: number;
  riskLevel: 'low' | 'medium' | 'high';
  serviceCategory?: HomeServiceCategory;
  externalId?: string; // Jobber Work Order ID
  locationName?: string;
  latitude?: number;
  longitude?: number;
  isArchived?: boolean;
  assignedPM?: string; // Assigned Lead Tech / Coordinator
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  assignee: string;
  start: string;
  end: string;
  status: 'todo' | 'in-progress' | 'done';
  dependencyIds?: string[];
}

export interface Prediction {
  id: string;
  projectId: string;
  type: 'timeline' | 'cost' | 'resource';
  content: string;
  confidence: number;
  timestamp: string;
}

export interface Message {
  id: string;
  sender: 'user' | AgentRole;
  text: string;
  timestamp: string;
}

// Local Supply & Trade Partner Types
export interface Subcontractor {
  id: string;
  name: string;
  trade: string;
  safetyScore: number;
  experienceYears: number;
  insuranceStatus: 'active' | 'expired' | 'pending';
  status: 'prequalified' | 'bidding' | 'selected' | 'rejected';
  ratings?: Record<string, number>;
}

export interface Bid {
  id: string;
  subcontractorId: string;
  packageId: string;
  amount: number;
  scopeCoverage: number;
  proposedStart: string;
  proposedEnd: string;
  status: 'submitted' | 'shortlisted' | 'rejected' | 'accepted';
  ratings?: Record<string, number>;
}

export interface BuyoutPackage {
  id: string;
  projectId: string;
  title: string;
  trade: string;
  status: 'assessment' | 'prequal' | 'bidding' | 'pricing' | 'negotiation' | 'execution';
  budgetedAmount: number;
  bids: Bid[];
}

export interface HealthAlert {
  id: string;
  projectId: string;
  projectName: string;
  type: 'budget' | 'schedule' | 'risk';
  severity: 'critical' | 'warning' | 'info';
  title: string;
  summary: string;
  agentFeedback: string;
  confidence: number;
  recommendation: string;
  timestamp: string;
  isRead: boolean;
  status: 'active' | 'mitigated' | 'snoozed';
}

export type ServiceArea = 'Sparks, NV' | 'Reno, NV' | 'Carson City, NV' | 'Lake Tahoe, NV';
export type PropertyType =
  | 'Single-Family Home'
  | 'Townhome / Condo'
  | 'Mountain Cabin'
  | 'Senior Residence'
  | 'Rental Property';
export type LeadStage = 'New Inquiry' | 'Estimate Sent' | 'Active Client' | 'Plan Member' | 'Inactive';

export interface CRMContact {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  streetAddress: string;
  serviceArea: ServiceArea;
  propertyType: PropertyType;
  leadStage: LeadStage;
  source: string;
  lifetimeValue: number;
  notes: string;
  tags: string[];
  createdAt: string;
}

export interface MaintenancePlan {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  monthlyPrice: number;
  annualPrice: number;
  visitsPerYear: number;
  handymanDiscountPct: number;
  priorityWindow: string;
  features: string[];
  isPopular: boolean;
  active: boolean;
}

export interface PlanSubscription {
  id: string;
  contactId: string;
  planId: string;
  billingCycle: 'monthly' | 'annual';
  status: 'active' | 'paused' | 'past_due' | 'cancelled';
  priceUsd: number;
  startDate: string;
  nextBillingDate: string;
  nextVisitDate: string;
  assignedTech: string;
  autoRenew: boolean;
}

export interface VisitChecklistItem {
  label: string;
  done: boolean;
}

export interface SubscriptionVisit {
  id: string;
  subscriptionId: string;
  contactId: string;
  season: 'Spring' | 'Summer' | 'Fall' | 'Winter';
  visitDate: string;
  technician: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'rescheduled';
  checklist: VisitChecklistItem[];
  notes: string;
}

export interface ClientPreviewMilestone {
  id: string;
  title: string;
  assignee: string;
  start: string;
  end: string;
  status: 'todo' | 'in-progress' | 'done';
}

export interface ClientPreviewPayload {
  token: string;
  projectId: string;
  projectName: string;
  clientName: string;
  serviceCategory: string;
  locationName: string;
  status: 'planning' | 'active' | 'completed' | 'on-hold';
  startDate: string;
  endDate: string;
  completion: number;
  leadTechnician: string;
  welcomeNote: string;
  milestones: ClientPreviewMilestone[];
  estimateStatus: string;
  financialsMasked: true;
  createdAt: string;
  expiresAt: string;
}

export interface ClientPreviewLinkSummary {
  token: string;
  projectId: string;
  projectName: string;
  clientName: string;
  serviceCategory: string;
  createdAt: string;
  expiresAt: string;
  expiresInHours: number;
  isExpired: boolean;
  viewCount: number;
  welcomeNote: string;
}


