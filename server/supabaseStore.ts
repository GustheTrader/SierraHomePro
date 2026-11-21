import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import crypto from 'node:crypto';
import type {
  CRMContact,
  LeadStage,
  MaintenancePlan,
  PlanSubscription,
  PropertyType,
  ServiceArea,
  SubscriptionVisit,
  VisitChecklistItem
} from '../types.js';

function createSupabaseClientIfConfigured(): SupabaseClient | null {
  const rawUrl = process.env.SUPABASE_URL?.trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!rawUrl || !serviceKey) {
    return null;
  }

  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      console.error('Invalid SUPABASE_URL protocol; expected https: or http:');
      return null;
    }
    return createClient(parsed.toString(), serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });
  } catch {
    console.error('Invalid SUPABASE_URL format in server environment.');
    return null;
  }
}

const supabase = createSupabaseClientIfConfigured();

// Local fallback data when SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are not yet configured
let memoryPlans: MaintenancePlan[] = [
  {
    id: 'plan-essential',
    slug: 'essential-care',
    name: 'Sierra Essential Care',
    tagline: 'Bi-annual preventive home tune-ups for Reno & Sparks homeowners',
    monthlyPrice: 49,
    annualPrice: 499,
    visitsPerYear: 2,
    handymanDiscountPct: 10,
    priorityWindow: '48-Hour Priority Scheduling',
    features: [
      'Spring & Winter 22-point home inspection',
      'HVAC filter replacement & thermostat check',
      'Smoke & CO detector battery testing',
      'Exterior hose bib winterization & caulk audit',
      '10% off written handyman & painting estimates'
    ],
    isPopular: false,
    active: true
  },
  {
    id: 'plan-seasonal',
    slug: 'seasonal-pro',
    name: 'Sierra Seasonal Pro',
    tagline: 'Quarterly whole-home care built for Northern Nevada freeze-thaw seasons',
    monthlyPrice: 89,
    annualPrice: 899,
    visitsPerYear: 4,
    handymanDiscountPct: 15,
    priorityWindow: '24-Hour Priority Dispatch',
    features: [
      '4 quarterly seasonal visits (Spring, Summer, Fall, Winter)',
      'Gutter clearing, roof-line check & weatherstripping',
      'Smart-home battery, Wi-Fi lock & doorbell checkup',
      'Dryer vent lint inspection & sink trap check',
      '15% off all repair, painting & smart-home jobs',
      '2 included minor handyman fixes per visit'
    ],
    isPopular: true,
    active: true
  },
  {
    id: 'plan-senior',
    slug: 'senior-safety-total',
    name: 'Senior Safety & Total Home',
    tagline: 'Quarterly maintenance + dedicated aging-in-place safety & accessibility care',
    monthlyPrice: 149,
    annualPrice: 1499,
    visitsPerYear: 4,
    handymanDiscountPct: 20,
    priorityWindow: 'Same-Day Emergency Priority',
    features: [
      '4 quarterly whole-home & ADA safety visits',
      'Grab-bar load torque check & non-slip rail inspection',
      'Motion nightlight, lever handle & threshold ramp maintenance',
      'Seasonal winterization, gutter clearing & HVAC filter swaps',
      'Family caregiver photo walk-through report after every visit',
      '20% off additional home safety & repair projects'
    ],
    isPopular: false,
    active: true
  }
];

let memoryContacts: CRMContact[] = [
  {
    id: 'c-1',
    fullName: 'Margaret & Robert Chen',
    email: 'mchen@example.com',
    phone: '(775) 555-0134',
    streetAddress: '1842 Damonte Ranch Pkwy',
    serviceArea: 'Reno, NV',
    propertyType: 'Senior Residence',
    leadStage: 'Plan Member',
    source: 'Referral',
    lifetimeValue: 5648,
    notes: 'Primary bath ADA grab bars installed. Prefers morning appointments before 11 AM.',
    tags: ['Senior Safety', 'ADA', 'Priority'],
    createdAt: '2026-09-14T16:20:00Z'
  },
  {
    id: 'c-2',
    fullName: 'Thomas & Linda Holloway',
    email: 'tholloway@example.com',
    phone: '(775) 555-0151',
    streetAddress: '614 West King St',
    serviceArea: 'Carson City, NV',
    propertyType: 'Single-Family Home',
    leadStage: 'Plan Member',
    source: 'Website (sierrahomepros.com)',
    lifetimeValue: 2099,
    notes: 'Enrolled in annual Seasonal Pro plan. 2-story stucco with rear patio deck.',
    tags: ['Maintenance Plan', 'Winterization'],
    createdAt: '2026-10-03T18:10:00Z'
  },
  {
    id: 'c-3',
    fullName: 'Daniel & Claire Vance',
    email: 'dvance@example.com',
    phone: '(775) 555-0172',
    streetAddress: '910 Country Club Dr',
    serviceArea: 'Lake Tahoe, NV',
    propertyType: 'Mountain Cabin',
    leadStage: 'Active Client',
    source: 'Google Local',
    lifetimeValue: 6400,
    notes: 'Exterior cedar deck & trim repaint in progress. Interested in Seasonal Pro plan for snow/freeze protection.',
    tags: ['Exterior Paint', 'Tahoe', 'Plan Upsell'],
    createdAt: '2026-10-28T15:00:00Z'
  },
  {
    id: 'c-4',
    fullName: 'Priya Nair',
    email: 'pnair@example.com',
    phone: '(775) 555-0183',
    streetAddress: '3215 Wingfield Hills Rd',
    serviceArea: 'Sparks, NV',
    propertyType: 'Single-Family Home',
    leadStage: 'Active Client',
    source: 'Website (sierrahomepros.com)',
    lifetimeValue: 1850,
    notes: 'Nest thermostat + smart deadbolts + video doorbell install. Great fit for Essential Care.',
    tags: ['Smart Home', 'Sparks'],
    createdAt: '2026-11-11T19:45:00Z'
  },
  {
    id: 'c-5',
    fullName: 'Kevin & Sarah Brooks',
    email: 'kbrooks@example.com',
    phone: '(775) 555-0198',
    streetAddress: '7420 Somersett Ridge Pkwy',
    serviceArea: 'Reno, NV',
    propertyType: 'Single-Family Home',
    leadStage: 'Estimate Sent',
    source: 'Nextdoor Reno',
    lifetimeValue: 1480,
    notes: 'Drywall patch & interior door repair bundle. Sent written add-on for pantry bifold track.',
    tags: ['Handyman', 'Somersett'],
    createdAt: '2026-11-16T21:15:00Z'
  },
  {
    id: 'c-6',
    fullName: 'Arthur & Evelyn Gomez',
    email: 'agomez@example.com',
    phone: '(775) 555-0149',
    streetAddress: '4580 Caughlin Pkwy',
    serviceArea: 'Reno, NV',
    propertyType: 'Senior Residence',
    leadStage: 'New Inquiry',
    source: 'Phone (888) 919-6447',
    lifetimeValue: 0,
    notes: 'Daughter called about Senior Safety & Total Home subscription + bathroom grab bar quote.',
    tags: ['Senior Safety', 'Hot Lead'],
    createdAt: '2026-11-21T15:10:00Z'
  }
];

let memorySubscriptions: PlanSubscription[] = [
  {
    id: 'sub-1',
    contactId: 'c-1',
    planId: 'plan-senior',
    billingCycle: 'monthly',
    status: 'active',
    priceUsd: 149,
    startDate: '2026-09-15',
    nextBillingDate: '2026-12-15',
    nextVisitDate: '2026-11-24',
    assignedTech: 'Caleb Martinez',
    autoRenew: true
  },
  {
    id: 'sub-2',
    contactId: 'c-2',
    planId: 'plan-seasonal',
    billingCycle: 'annual',
    status: 'active',
    priceUsd: 899,
    startDate: '2026-10-05',
    nextBillingDate: '2027-10-05',
    nextVisitDate: '2026-11-26',
    assignedTech: 'Marcus Reid',
    autoRenew: true
  }
];

let memoryVisits: SubscriptionVisit[] = [
  {
    id: 'vis-1',
    subscriptionId: 'sub-1',
    contactId: 'c-1',
    season: 'Winter',
    visitDate: '2026-11-24',
    technician: 'Caleb Martinez',
    status: 'scheduled',
    checklist: [
      { label: 'Torque-check primary bath ADA grab bars', done: true },
      { label: 'Test hallway motion nightlights & smoke/CO batteries', done: false },
      { label: 'Swap MERV-11 HVAC filter & insulate exterior spigots', done: false },
      { label: 'Send family caregiver walk-through photo summary', done: false }
    ],
    notes: 'Combine with threshold ramp drop-off.'
  },
  {
    id: 'vis-2',
    subscriptionId: 'sub-2',
    contactId: 'c-2',
    season: 'Winter',
    visitDate: '2026-11-26',
    technician: 'Marcus Reid',
    status: 'in-progress',
    checklist: [
      { label: 'Clear 2-story gutters & downspout elbows', done: true },
      { label: 'Blow out & cap exterior hose bibs', done: true },
      { label: 'Replace furnace filter & weatherstrip garage entry door', done: false },
      { label: 'Inspect exterior window caulk before Tahoe freeze', done: false }
    ],
    notes: 'Homeowner requested spare filter left by furnace.'
  }
];

function mapContactRow(row: Record<string, any>): CRMContact {
  return {
    id: String(row.id),
    fullName: String(row.full_name || ''),
    email: String(row.email || ''),
    phone: String(row.phone || ''),
    streetAddress: String(row.street_address || ''),
    serviceArea: (row.service_area || 'Sparks, NV') as ServiceArea,
    propertyType: (row.property_type || 'Single-Family Home') as PropertyType,
    leadStage: (row.lead_stage || 'New Inquiry') as LeadStage,
    source: String(row.source || 'Website (sierrahomepros.com)'),
    lifetimeValue: Number(row.lifetime_value || 0),
    notes: String(row.notes || ''),
    tags: Array.isArray(row.tags) ? row.tags.map(String) : [],
    createdAt: String(row.created_at || new Date().toISOString())
  };
}

function mapPlanRow(row: Record<string, any>): MaintenancePlan {
  return {
    id: String(row.id),
    slug: String(row.slug || ''),
    name: String(row.name || ''),
    tagline: String(row.tagline || ''),
    monthlyPrice: Number(row.monthly_price || 0),
    annualPrice: Number(row.annual_price || 0),
    visitsPerYear: Number(row.visits_per_year || 2),
    handymanDiscountPct: Number(row.handyman_discount_pct || 10),
    priorityWindow: String(row.priority_window || '48-Hour Priority Scheduling'),
    features: Array.isArray(row.features) ? row.features.map(String) : [],
    isPopular: Boolean(row.is_popular),
    active: row.active !== false
  };
}

function mapSubscriptionRow(row: Record<string, any>): PlanSubscription {
  return {
    id: String(row.id),
    contactId: String(row.contact_id),
    planId: String(row.plan_id),
    billingCycle: row.billing_cycle === 'annual' ? 'annual' : 'monthly',
    status: (row.status || 'active') as PlanSubscription['status'],
    priceUsd: Number(row.price_usd || 0),
    startDate: String(row.start_date || ''),
    nextBillingDate: String(row.next_billing_date || ''),
    nextVisitDate: String(row.next_visit_date || ''),
    assignedTech: String(row.assigned_tech || 'Caleb Martinez'),
    autoRenew: row.auto_renew !== false
  };
}

function mapVisitRow(row: Record<string, any>): SubscriptionVisit {
  const rawList = Array.isArray(row.checklist) ? row.checklist : [];
  const checklist: VisitChecklistItem[] = rawList.map((item: any) => ({
    label: String(item?.label || ''),
    done: Boolean(item?.done)
  }));
  return {
    id: String(row.id),
    subscriptionId: String(row.subscription_id),
    contactId: String(row.contact_id),
    season: (row.season || 'Winter') as SubscriptionVisit['season'],
    visitDate: String(row.visit_date || ''),
    technician: String(row.technician || 'Caleb Martinez'),
    status: (row.status || 'scheduled') as SubscriptionVisit['status'],
    checklist,
    notes: String(row.notes || '')
  };
}

export async function getOverviewData() {
  if (supabase) {
    try {
      const [contactsRes, plansRes, subsRes, visitsRes] = await Promise.all([
        supabase.from('crm_contacts').select('*').order('created_at', { ascending: false }),
        supabase.from('maintenance_plans').select('*').order('monthly_price', { ascending: true }),
        supabase.from('plan_subscriptions').select('*').order('created_at', { ascending: false }),
        supabase.from('subscription_visits').select('*').order('visit_date', { ascending: true })
      ]);

      if (!contactsRes.error && !plansRes.error && !subsRes.error && !visitsRes.error) {
        return {
          contacts: (contactsRes.data || []).map(mapContactRow),
          plans: (plansRes.data || []).map(mapPlanRow),
          subscriptions: (subsRes.data || []).map(mapSubscriptionRow),
          visits: (visitsRes.data || []).map(mapVisitRow)
        };
      }
      console.error('Supabase query returned error; falling back to local preview store.');
    } catch (err) {
      console.error('Supabase connection failed; falling back to local preview store:', err);
    }
  }

  return {
    contacts: memoryContacts,
    plans: memoryPlans,
    subscriptions: memorySubscriptions,
    visits: memoryVisits
  };
}

export async function createContact(input: Omit<CRMContact, 'id' | 'createdAt'>): Promise<CRMContact> {
  if (supabase) {
    const { data, error } = await supabase
      .from('crm_contacts')
      .insert({
        full_name: input.fullName,
        email: input.email,
        phone: input.phone,
        street_address: input.streetAddress,
        service_area: input.serviceArea,
        property_type: input.propertyType,
        lead_stage: input.leadStage,
        source: input.source,
        lifetime_value: input.lifetimeValue,
        notes: input.notes,
        tags: input.tags
      })
      .select()
      .single();

    if (!error && data) {
      return mapContactRow(data);
    }
    throw new Error('Could not save homeowner contact to Supabase.');
  }

  const created: CRMContact = {
    ...input,
    id: `c-${crypto.randomUUID().slice(0, 8)}`,
    createdAt: new Date().toISOString()
  };
  memoryContacts = [created, ...memoryContacts];
  return created;
}

export async function updateContact(
  id: string,
  patch: Partial<Omit<CRMContact, 'id' | 'createdAt'>>
): Promise<CRMContact | null> {
  if (supabase) {
    const dbPatch: Record<string, any> = {};
    if (patch.fullName !== undefined) dbPatch.full_name = patch.fullName;
    if (patch.email !== undefined) dbPatch.email = patch.email;
    if (patch.phone !== undefined) dbPatch.phone = patch.phone;
    if (patch.streetAddress !== undefined) dbPatch.street_address = patch.streetAddress;
    if (patch.serviceArea !== undefined) dbPatch.service_area = patch.serviceArea;
    if (patch.propertyType !== undefined) dbPatch.property_type = patch.propertyType;
    if (patch.leadStage !== undefined) dbPatch.lead_stage = patch.leadStage;
    if (patch.source !== undefined) dbPatch.source = patch.source;
    if (patch.lifetimeValue !== undefined) dbPatch.lifetime_value = patch.lifetimeValue;
    if (patch.notes !== undefined) dbPatch.notes = patch.notes;
    if (patch.tags !== undefined) dbPatch.tags = patch.tags;

    const { data, error } = await supabase
      .from('crm_contacts')
      .update(dbPatch)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) return null;
    return mapContactRow(data);
  }

  let updated: CRMContact | null = null;
  memoryContacts = memoryContacts.map((c) => {
    if (c.id !== id) return c;
    updated = { ...c, ...patch };
    return updated;
  });
  return updated;
}

export async function deleteContact(id: string): Promise<boolean> {
  if (supabase) {
    const { error } = await supabase.from('crm_contacts').delete().eq('id', id);
    return !error;
  }

  const before = memoryContacts.length;
  memoryContacts = memoryContacts.filter((c) => c.id !== id);
  memorySubscriptions = memorySubscriptions.filter((s) => s.contactId !== id);
  memoryVisits = memoryVisits.filter((v) => v.contactId !== id);
  return memoryContacts.length < before;
}

export async function updateMaintenancePlan(
  id: string,
  patch: Partial<Omit<MaintenancePlan, 'id' | 'slug'>>
): Promise<MaintenancePlan | null> {
  if (supabase) {
    const dbPatch: Record<string, any> = {};
    if (patch.name !== undefined) dbPatch.name = patch.name;
    if (patch.tagline !== undefined) dbPatch.tagline = patch.tagline;
    if (patch.monthlyPrice !== undefined) dbPatch.monthly_price = patch.monthlyPrice;
    if (patch.annualPrice !== undefined) dbPatch.annual_price = patch.annualPrice;
    if (patch.visitsPerYear !== undefined) dbPatch.visits_per_year = patch.visitsPerYear;
    if (patch.handymanDiscountPct !== undefined) dbPatch.handyman_discount_pct = patch.handymanDiscountPct;
    if (patch.priorityWindow !== undefined) dbPatch.priority_window = patch.priorityWindow;
    if (patch.features !== undefined) dbPatch.features = patch.features;
    if (patch.isPopular !== undefined) dbPatch.is_popular = patch.isPopular;
    if (patch.active !== undefined) dbPatch.active = patch.active;

    const { data, error } = await supabase
      .from('maintenance_plans')
      .update(dbPatch)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) return null;
    return mapPlanRow(data);
  }

  let updated: MaintenancePlan | null = null;
  memoryPlans = memoryPlans.map((p) => {
    if (p.id !== id) return p;
    updated = { ...p, ...patch };
    return updated;
  });
  return updated;
}

export async function createSubscription(input: {
  contactId: string;
  planId: string;
  billingCycle: 'monthly' | 'annual';
  assignedTech: string;
  nextVisitDate: string;
}): Promise<{ subscription: PlanSubscription; visit: SubscriptionVisit }> {
  const overview = await getOverviewData();
  const plan = overview.plans.find((p) => p.id === input.planId);
  if (!plan) {
    throw new Error('Selected maintenance plan was not found.');
  }
  const contact = overview.contacts.find((c) => c.id === input.contactId);
  if (!contact) {
    throw new Error('Selected homeowner contact was not found.');
  }

  const today = new Date();
  const startDate = today.toISOString().slice(0, 10);
  const nextBill = new Date(today);
  if (input.billingCycle === 'annual') {
    nextBill.setFullYear(nextBill.getFullYear() + 1);
  } else {
    nextBill.setMonth(nextBill.getMonth() + 1);
  }
  const nextBillingDate = nextBill.toISOString().slice(0, 10);
  const priceUsd = input.billingCycle === 'annual' ? plan.annualPrice : plan.monthlyPrice;

  const defaultChecklist: VisitChecklistItem[] = [
    { label: 'Complete 22-point Sierra Home Pros seasonal walk-through', done: false },
    { label: 'Replace HVAC filter & test thermostat calibration', done: false },
    { label: 'Inspect exterior caulk, hose bibs & weatherstripping', done: false },
    { label: 'Log homeowner before/after photos & summary report', done: false }
  ];

  if (supabase) {
    const { data: subData, error: subErr } = await supabase
      .from('plan_subscriptions')
      .insert({
        contact_id: input.contactId,
        plan_id: input.planId,
        billing_cycle: input.billingCycle,
        status: 'active',
        price_usd: priceUsd,
        start_date: startDate,
        next_billing_date: nextBillingDate,
        next_visit_date: input.nextVisitDate,
        assigned_tech: input.assignedTech,
        auto_renew: true
      })
      .select()
      .single();

    if (subErr || !subData) {
      throw new Error('Failed to create maintenance subscription in Supabase.');
    }

    await supabase
      .from('crm_contacts')
      .update({
        lead_stage: 'Plan Member',
        lifetime_value: Number(contact.lifetimeValue) + priceUsd
      })
      .eq('id', input.contactId);

    const { data: visitData, error: visitErr } = await supabase
      .from('subscription_visits')
      .insert({
        subscription_id: subData.id,
        contact_id: input.contactId,
        season: 'Winter',
        visit_date: input.nextVisitDate,
        technician: input.assignedTech,
        status: 'scheduled',
        checklist: defaultChecklist,
        notes: `Initial ${plan.name} preventive visit.`
      })
      .select()
      .single();

    if (visitErr || !visitData) {
      throw new Error('Subscription created, but failed to schedule initial visit.');
    }

    return {
      subscription: mapSubscriptionRow(subData),
      visit: mapVisitRow(visitData)
    };
  }

  const subscription: PlanSubscription = {
    id: `sub-${crypto.randomUUID().slice(0, 8)}`,
    contactId: input.contactId,
    planId: input.planId,
    billingCycle: input.billingCycle,
    status: 'active',
    priceUsd,
    startDate,
    nextBillingDate,
    nextVisitDate: input.nextVisitDate,
    assignedTech: input.assignedTech,
    autoRenew: true
  };
  memorySubscriptions = [subscription, ...memorySubscriptions];

  memoryContacts = memoryContacts.map((c) =>
    c.id === input.contactId
      ? { ...c, leadStage: 'Plan Member', lifetimeValue: c.lifetimeValue + priceUsd }
      : c
  );

  const visit: SubscriptionVisit = {
    id: `vis-${crypto.randomUUID().slice(0, 8)}`,
    subscriptionId: subscription.id,
    contactId: input.contactId,
    season: 'Winter',
    visitDate: input.nextVisitDate,
    technician: input.assignedTech,
    status: 'scheduled',
    checklist: defaultChecklist,
    notes: `Initial ${plan.name} preventive visit.`
  };
  memoryVisits = [visit, ...memoryVisits];

  return { subscription, visit };
}

export async function updateSubscription(
  id: string,
  patch: Partial<Pick<PlanSubscription, 'status' | 'billingCycle' | 'assignedTech' | 'nextVisitDate' | 'autoRenew'>>
): Promise<PlanSubscription | null> {
  if (supabase) {
    const dbPatch: Record<string, any> = {};
    if (patch.status !== undefined) dbPatch.status = patch.status;
    if (patch.billingCycle !== undefined) dbPatch.billing_cycle = patch.billingCycle;
    if (patch.assignedTech !== undefined) dbPatch.assigned_tech = patch.assignedTech;
    if (patch.nextVisitDate !== undefined) dbPatch.next_visit_date = patch.nextVisitDate;
    if (patch.autoRenew !== undefined) dbPatch.auto_renew = patch.autoRenew;

    const { data, error } = await supabase
      .from('plan_subscriptions')
      .update(dbPatch)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) return null;
    return mapSubscriptionRow(data);
  }

  let updated: PlanSubscription | null = null;
  memorySubscriptions = memorySubscriptions.map((s) => {
    if (s.id !== id) return s;
    updated = { ...s, ...patch };
    return updated;
  });
  return updated;
}

export async function updateVisit(
  id: string,
  patch: Partial<Pick<SubscriptionVisit, 'status' | 'checklist' | 'notes' | 'visitDate' | 'technician'>>
): Promise<SubscriptionVisit | null> {
  if (supabase) {
    const dbPatch: Record<string, any> = {};
    if (patch.status !== undefined) dbPatch.status = patch.status;
    if (patch.checklist !== undefined) dbPatch.checklist = patch.checklist;
    if (patch.notes !== undefined) dbPatch.notes = patch.notes;
    if (patch.visitDate !== undefined) dbPatch.visit_date = patch.visitDate;
    if (patch.technician !== undefined) dbPatch.technician = patch.technician;

    const { data, error } = await supabase
      .from('subscription_visits')
      .update(dbPatch)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) return null;
    return mapVisitRow(data);
  }

  let updated: SubscriptionVisit | null = null;
  memoryVisits = memoryVisits.map((v) => {
    if (v.id !== id) return v;
    updated = { ...v, ...patch };
    return updated;
  });
  return updated;
}
