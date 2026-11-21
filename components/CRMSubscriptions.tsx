import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Plus,
  Search,
  ShieldCheck,
  Calendar,
  CheckCircle2,
  CheckSquare,
  Square,
  Edit3,
  Copy,
  Check,
  Download,
  Database,
  Home,
  Phone,
  Mail,
  MapPin,
  X,
  PauseCircle,
  PlayCircle,
  Sparkles,
  Loader2
} from 'lucide-react';
import {
  CRMContact,
  LeadStage,
  MaintenancePlan,
  PlanSubscription,
  PropertyType,
  ServiceArea,
  SubscriptionVisit
} from '../types';

const SERVICE_AREAS: ServiceArea[] = ['Sparks, NV', 'Reno, NV', 'Carson City, NV', 'Lake Tahoe, NV'];
const PROPERTY_TYPES: PropertyType[] = [
  'Single-Family Home',
  'Townhome / Condo',
  'Mountain Cabin',
  'Senior Residence',
  'Rental Property'
];
const LEAD_STAGES: LeadStage[] = ['New Inquiry', 'Estimate Sent', 'Active Client', 'Plan Member', 'Inactive'];
const TECHS = ['Caleb Martinez', 'Braden Vance', 'Elena Morales', 'Marcus Reid'];

const formatUSD = (v: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v);

const CRMSubscriptions: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'crm' | 'plans' | 'members' | 'supabase'>('crm');
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const [contacts, setContacts] = useState<CRMContact[]>([]);
  const [plans, setPlans] = useState<MaintenancePlan[]>([]);
  const [subscriptions, setSubscriptions] = useState<PlanSubscription[]>([]);
  const [visits, setVisits] = useState<SubscriptionVisit[]>([]);

  // CRM filters & selection
  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState<'ALL' | LeadStage>('ALL');
  const [selectedContactId, setSelectedContactId] = useState<string>('');

  // Plans billing preview toggle & inline edit
  const [billingPreview, setBillingPreview] = useState<'monthly' | 'annual'>('monthly');
  const [editingPlan, setEditingPlan] = useState<MaintenancePlan | null>(null);
  const [editPlanForm, setEditPlanForm] = useState({
    monthlyPrice: '',
    annualPrice: '',
    handymanDiscountPct: '',
    tagline: ''
  });

  // Modals
  const [isAddContactOpen, setIsAddContactOpen] = useState(false);
  const [newContact, setNewContact] = useState({
    fullName: '',
    email: '',
    phone: '',
    streetAddress: '',
    serviceArea: 'Sparks, NV' as ServiceArea,
    propertyType: 'Single-Family Home' as PropertyType,
    leadStage: 'New Inquiry' as LeadStage,
    source: 'Website (sierrahomepros.com)',
    notes: ''
  });

  const [enrollModal, setEnrollModal] = useState<{ open: boolean; contactId: string; planId: string }>({
    open: false,
    contactId: '',
    planId: ''
  });
  const [enrollForm, setEnrollForm] = useState({
    billingCycle: 'monthly' as 'monthly' | 'annual',
    assignedTech: 'Caleb Martinez',
    nextVisitDate: '2026-12-01'
  });

  // Self-hosted Supabase SQL viewer
  const [schemaBundle, setSchemaBundle] = useState<{
    migrationSql: string;
    seedSql: string;
    setupGuide: string;
  } | null>(null);
  const [sqlSubTab, setSqlSubTab] = useState<'migration' | 'seed' | 'guide'>('migration');
  const [copiedSql, setCopiedSql] = useState(false);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg((prev) => (prev === msg ? null : prev)), 3500);
  };

  const loadOverview = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/crm/overview');
      if (!res.ok) throw new Error('Failed to load CRM data.');
      const data = await res.json();
      setContacts(data.contacts || []);
      setPlans(data.plans || []);
      setSubscriptions(data.subscriptions || []);
      setVisits(data.visits || []);
      if (data.contacts?.length && !selectedContactId) {
        setSelectedContactId(data.contacts[0].id);
      }
    } catch {
      setErrorMsg('Unable to reach the CRM service. Please refresh in a moment.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOverview();
  }, []);

  useEffect(() => {
    if (activeTab === 'supabase' && !schemaBundle) {
      fetch('/api/supabase/schema')
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (data) setSchemaBundle(data);
        })
        .catch(() => {});
    }
  }, [activeTab, schemaBundle]);

  const filteredContacts = useMemo(() => {
    return contacts.filter((c) => {
      if (stageFilter !== 'ALL' && c.leadStage !== stageFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          c.fullName.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          c.serviceArea.toLowerCase().includes(q) ||
          c.streetAddress.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [contacts, stageFilter, searchQuery]);

  const selectedContact = useMemo(() => {
    return contacts.find((c) => c.id === selectedContactId) || filteredContacts[0] || null;
  }, [contacts, selectedContactId, filteredContacts]);

  const metrics = useMemo(() => {
    const activeSubs = subscriptions.filter((s) => s.status === 'active');
    const mrr = activeSubs.reduce((sum, s) => {
      return sum + (s.billingCycle === 'annual' ? s.priceUsd / 12 : s.priceUsd);
    }, 0);
    const openVisits = visits.filter((v) => v.status !== 'completed').length;
    return {
      totalContacts: contacts.length,
      activeMembers: activeSubs.length,
      mrr: Math.round(mrr),
      arr: Math.round(mrr * 12),
      openVisits
    };
  }, [contacts, subscriptions, visits]);

  const handleCreateContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContact.fullName.trim() || !newContact.email.trim()) return;
    const res = await fetch('/api/crm/contacts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newContact)
    });
    if (res.ok) {
      const created: CRMContact = await res.json();
      setContacts((prev) => [created, ...prev]);
      setSelectedContactId(created.id);
      setIsAddContactOpen(false);
      setNewContact({
        fullName: '',
        email: '',
        phone: '',
        streetAddress: '',
        serviceArea: 'Sparks, NV',
        propertyType: 'Single-Family Home',
        leadStage: 'New Inquiry',
        source: 'Website (sierrahomepros.com)',
        notes: ''
      });
      showToast(`Added ${created.fullName} to Homeowner CRM.`);
    }
  };

  const handleUpdateLeadStage = async (contactId: string, leadStage: LeadStage) => {
    const res = await fetch(`/api/crm/contacts/${contactId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leadStage })
    });
    if (res.ok) {
      const updated: CRMContact = await res.json();
      setContacts((prev) => prev.map((c) => (c.id === contactId ? updated : c)));
      showToast(`Updated stage to "${leadStage}".`);
    }
  };

  const handleSavePlanEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan) return;
    const res = await fetch(`/api/plans/${editingPlan.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        monthlyPrice: Number(editPlanForm.monthlyPrice),
        annualPrice: Number(editPlanForm.annualPrice),
        handymanDiscountPct: Number(editPlanForm.handymanDiscountPct),
        tagline: editPlanForm.tagline
      })
    });
    if (res.ok) {
      const updated: MaintenancePlan = await res.json();
      setPlans((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      setEditingPlan(null);
      showToast(`Updated pricing for ${updated.name}.`);
    }
  };

  const openEnrollModal = (contactId?: string, planId?: string) => {
    setEnrollModal({
      open: true,
      contactId: contactId || contacts[0]?.id || '',
      planId: planId || plans[1]?.id || plans[0]?.id || ''
    });
  };

  const handleEnrollSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enrollModal.contactId || !enrollModal.planId) return;
    const res = await fetch('/api/subscriptions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contactId: enrollModal.contactId,
        planId: enrollModal.planId,
        ...enrollForm
      })
    });
    if (res.ok) {
      setEnrollModal({ open: false, contactId: '', planId: '' });
      await loadOverview();
      setActiveTab('members');
      showToast('Enrolled homeowner & scheduled initial seasonal maintenance visit.');
    }
  };

  const handleUpdateSubStatus = async (subId: string, status: PlanSubscription['status']) => {
    const res = await fetch(`/api/subscriptions/${subId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    if (res.ok) {
      const updated: PlanSubscription = await res.json();
      setSubscriptions((prev) => prev.map((s) => (s.id === subId ? updated : s)));
      showToast(`Subscription status updated to ${status}.`);
    }
  };

  const handleToggleVisitCheck = async (visit: SubscriptionVisit, idx: number) => {
    const nextChecklist = visit.checklist.map((item, i) =>
      i === idx ? { ...item, done: !item.done } : item
    );
    const allDone = nextChecklist.length > 0 && nextChecklist.every((i) => i.done);
    const nextStatus: SubscriptionVisit['status'] = allDone ? 'completed' : 'in-progress';

    const res = await fetch(`/api/visits/${visit.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ checklist: nextChecklist, status: nextStatus })
    });
    if (res.ok) {
      const updated: SubscriptionVisit = await res.json();
      setVisits((prev) => prev.map((v) => (v.id === visit.id ? updated : v)));
    }
  };

  const activeSqlText =
    sqlSubTab === 'migration'
      ? schemaBundle?.migrationSql || ''
      : sqlSubTab === 'seed'
      ? schemaBundle?.seedSql || ''
      : schemaBundle?.setupGuide || '';

  const handleCopySql = () => {
    if (!activeSqlText) return;
    navigator.clipboard.writeText(activeSqlText);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  const handleDownloadSql = () => {
    if (!activeSqlText) return;
    const filename =
      sqlSubTab === 'migration'
        ? '001_sierra_crm_maintenance.sql'
        : sqlSubTab === 'seed'
        ? 'seed.sql'
        : 'ZO_SELF_HOSTED_SETUP.md';
    const blob = new Blob([activeSqlText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-zinc-500 mb-1">
            <span>Sierra Home Pros</span>
            <span>·</span>
            <span>Homeowner CRM & Recurring Maintenance Plans</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100">CRM & Maintenance Subscriptions</h1>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => openEnrollModal()}
            className="px-3.5 py-2 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-emerald-500/40 text-xs font-semibold text-zinc-200 flex items-center gap-1.5"
          >
            <ShieldCheck size={14} className="text-emerald-400" /> Enroll Member
          </button>
          <button
            onClick={() => setIsAddContactOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5"
          >
            <Plus size={15} /> Add Homeowner
          </button>
        </div>
      </div>

      {toastMsg && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 px-4 py-2.5 rounded-lg text-xs flex items-center justify-between">
          <span className="flex items-center gap-2">
            <CheckCircle2 size={14} /> {toastMsg}
          </span>
          <button onClick={() => setToastMsg(null)} className="text-emerald-400 hover:text-emerald-200">
            <X size={14} />
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="bg-amber-500/10 border border-amber-500/30 text-amber-300 px-4 py-2.5 rounded-lg text-xs">
          {errorMsg}
        </div>
      )}

      {/* KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-4">
          <p className="text-xs text-zinc-500">Homeowners in CRM</p>
          <p className="text-2xl font-bold font-mono tabular-nums text-zinc-100 mt-1">{metrics.totalContacts}</p>
        </div>
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-4">
          <p className="text-xs text-zinc-500">Active Plan Members</p>
          <p className="text-2xl font-bold font-mono tabular-nums text-emerald-400 mt-1">{metrics.activeMembers}</p>
        </div>
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-4">
          <p className="text-xs text-zinc-500">Monthly Recurring (MRR)</p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-bold font-mono tabular-nums text-zinc-100">{formatUSD(metrics.mrr)}</span>
            <span className="text-[11px] font-mono text-zinc-500">{formatUSD(metrics.arr)}/yr</span>
          </div>
        </div>
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-4">
          <p className="text-xs text-zinc-500">Upcoming Seasonal Visits</p>
          <p className="text-2xl font-bold font-mono tabular-nums text-amber-400 mt-1">{metrics.openVisits}</p>
        </div>
      </div>

      {/* Sub-navigation */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-zinc-800/80 pb-3">
        {(
          [
            { id: 'crm', label: `Homeowner CRM (${contacts.length})` },
            { id: 'plans', label: `Sellable Plans (${plans.length})` },
            { id: 'members', label: `Members & Visits (${subscriptions.length})` },
            { id: 'supabase', label: 'Self-Hosted Supabase SQL (Zo)' }
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === tab.id
                ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30'
                : 'text-zinc-400 hover:text-zinc-200 border border-transparent'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-16 flex items-center justify-center gap-2 text-xs text-zinc-400">
          <Loader2 size={16} className="animate-spin text-emerald-400" /> Loading Sierra Home Pros CRM...
        </div>
      ) : (
        <>
          {/* TAB 1: HOMEOWNER CRM */}
          {activeTab === 'crm' && (
            <div className="space-y-4">
              <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
                <div className="relative flex-1 max-w-md">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search homeowner, email, address, or city..."
                    className="w-full bg-zinc-900/60 border border-zinc-800 rounded-lg pl-9 pr-4 py-2 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(['ALL', ...LEAD_STAGES] as const).map((st) => (
                    <button
                      key={st}
                      onClick={() => setStageFilter(st)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                        stageFilter === st
                          ? 'bg-emerald-600/20 border-emerald-500/40 text-emerald-300'
                          : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      {st === 'ALL' ? 'All Stages' : st}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-5 space-y-2.5">
                  {filteredContacts.map((contact) => {
                    const isSelected = selectedContact?.id === contact.id;
                    return (
                      <button
                        key={contact.id}
                        onClick={() => setSelectedContactId(contact.id)}
                        className={`w-full text-left p-4 rounded-xl border transition-all ${
                          isSelected
                            ? 'bg-zinc-900 border-emerald-500/50 ring-1 ring-emerald-500/20'
                            : 'bg-zinc-900/40 border-zinc-800/80 hover:border-zinc-700'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h3 className="text-sm font-semibold text-zinc-100 truncate">{contact.fullName}</h3>
                            <p className="text-xs text-zinc-400 mt-0.5 truncate">
                              {contact.serviceArea} · {contact.propertyType}
                            </p>
                          </div>
                          <span
                            className={`text-[11px] font-medium px-2 py-0.5 rounded shrink-0 ${
                              contact.leadStage === 'Plan Member'
                                ? 'bg-emerald-500/15 text-emerald-300'
                                : contact.leadStage === 'New Inquiry'
                                ? 'bg-amber-500/15 text-amber-300'
                                : 'bg-zinc-800 text-zinc-300'
                            }`}
                          >
                            {contact.leadStage}
                          </span>
                        </div>
                        <div className="mt-3 pt-2.5 border-t border-zinc-800/70 flex items-center justify-between text-xs">
                          <span className="text-zinc-500 truncate">{contact.streetAddress || contact.email}</span>
                          <span className="font-mono tabular-nums text-zinc-200 font-semibold shrink-0 ml-2">
                            {formatUSD(contact.lifetimeValue)} LTV
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {selectedContact && (
                  <div className="lg:col-span-7 bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-6 space-y-5">
                    <div className="flex flex-wrap items-start justify-between gap-4 border-b border-zinc-800/80 pb-4">
                      <div>
                        <p className="text-xs text-zinc-400">
                          {selectedContact.propertyType} · {selectedContact.source}
                        </p>
                        <h2 className="text-xl font-bold text-zinc-100 mt-0.5">{selectedContact.fullName}</h2>
                        <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-zinc-400">
                          <span className="flex items-center gap-1.5">
                            <Phone size={12} className="text-emerald-400" />
                            {selectedContact.phone || 'Not provided'}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Mail size={12} className="text-emerald-400" />
                            {selectedContact.email}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <select
                          value={selectedContact.leadStage}
                          onChange={(e) => handleUpdateLeadStage(selectedContact.id, e.target.value as LeadStage)}
                          className="bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500"
                        >
                          {LEAD_STAGES.map((st) => (
                            <option key={st} value={st}>
                              {st}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => openEnrollModal(selectedContact.id)}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold"
                        >
                          Enroll in Plan
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-xl p-4">
                        <p className="text-[11px] uppercase tracking-wider text-zinc-500 font-semibold">Property Address</p>
                        <p className="text-sm font-medium text-zinc-200 mt-1 flex items-center gap-1.5">
                          <MapPin size={13} className="text-emerald-400 shrink-0" />
                          {selectedContact.streetAddress || 'Address pending'} · {selectedContact.serviceArea}
                        </p>
                      </div>
                      <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-xl p-4">
                        <p className="text-[11px] uppercase tracking-wider text-zinc-500 font-semibold">Lifetime Value</p>
                        <p className="text-lg font-bold font-mono tabular-nums text-emerald-400 mt-0.5">
                          {formatUSD(selectedContact.lifetimeValue)}
                        </p>
                      </div>
                    </div>

                    <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-xl p-4">
                      <p className="text-[11px] uppercase tracking-wider text-zinc-500 font-semibold mb-1.5">
                        Property & Homeowner Notes
                      </p>
                      <p className="text-xs text-zinc-300 leading-relaxed">
                        {selectedContact.notes || 'No property notes recorded yet.'}
                      </p>
                    </div>

                    {/* Linked Subscriptions */}
                    <div>
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2.5">
                        Active Maintenance Plans
                      </h3>
                      {subscriptions.filter((s) => s.contactId === selectedContact.id).length === 0 ? (
                        <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800/80 flex items-center justify-between gap-3">
                          <p className="text-xs text-zinc-400">
                            Not enrolled in a recurring maintenance subscription yet.
                          </p>
                          <button
                            onClick={() => openEnrollModal(selectedContact.id)}
                            className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 shrink-0"
                          >
                            Offer Seasonal Plan
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {subscriptions
                            .filter((s) => s.contactId === selectedContact.id)
                            .map((sub) => {
                              const plan = plans.find((p) => p.id === sub.planId);
                              return (
                                <div
                                  key={sub.id}
                                  className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/25 flex items-center justify-between gap-3"
                                >
                                  <div>
                                    <p className="text-sm font-semibold text-zinc-100">{plan?.name || 'Maintenance Plan'}</p>
                                    <p className="text-xs text-zinc-400 mt-0.5 font-mono">
                                      {formatUSD(sub.priceUsd)}/{sub.billingCycle === 'annual' ? 'yr' : 'mo'} · Next visit{' '}
                                      {sub.nextVisitDate} · {sub.assignedTech}
                                    </p>
                                  </div>
                                  <span className="text-xs font-semibold text-emerald-400 capitalize">{sub.status}</span>
                                </div>
                              );
                            })}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: SELLABLE MAINTENANCE PLANS */}
          {activeTab === 'plans' && (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-base font-bold text-zinc-100">Sierra Home Pros Maintenance Plans</h2>
                  <p className="text-xs text-zinc-400">
                    Recurring home care tiers designed to sell to Reno–Sparks, Carson City & Lake Tahoe homeowners.
                  </p>
                </div>
                <div className="inline-flex bg-zinc-900 border border-zinc-800 rounded-lg p-1">
                  <button
                    onClick={() => setBillingPreview('monthly')}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold ${
                      billingPreview === 'monthly' ? 'bg-emerald-600 text-white' : 'text-zinc-400'
                    }`}
                  >
                    Monthly Billing
                  </button>
                  <button
                    onClick={() => setBillingPreview('annual')}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold ${
                      billingPreview === 'annual' ? 'bg-emerald-600 text-white' : 'text-zinc-400'
                    }`}
                  >
                    Annual (Save ~15%)
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {plans.map((plan) => {
                  const displayPrice = billingPreview === 'annual' ? plan.annualPrice : plan.monthlyPrice;
                  const memberCount = subscriptions.filter(
                    (s) => s.planId === plan.id && s.status === 'active'
                  ).length;

                  return (
                    <div
                      key={plan.id}
                      className={`rounded-2xl border p-6 flex flex-col justify-between gap-5 ${
                        plan.isPopular
                          ? 'bg-zinc-900 border-emerald-500/50 ring-1 ring-emerald-500/20'
                          : 'bg-zinc-900/60 border-zinc-800/80'
                      }`}
                    >
                      <div className="space-y-4">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400">
                              {plan.visitsPerYear} Visits / Year · {plan.handymanDiscountPct}% Repair Discount
                            </p>
                            <h3 className="text-lg font-bold text-zinc-100 mt-1">{plan.name}</h3>
                          </div>
                          <button
                            onClick={() => {
                              setEditingPlan(plan);
                              setEditPlanForm({
                                monthlyPrice: String(plan.monthlyPrice),
                                annualPrice: String(plan.annualPrice),
                                handymanDiscountPct: String(plan.handymanDiscountPct),
                                tagline: plan.tagline
                              });
                            }}
                            className="p-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-zinc-100"
                            title="Edit Plan Pricing"
                          >
                            <Edit3 size={13} />
                          </button>
                        </div>

                        <p className="text-xs text-zinc-400 leading-relaxed">{plan.tagline}</p>

                        <div className="pb-4 border-b border-zinc-800/80">
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-3xl font-extrabold font-mono tabular-nums text-zinc-100">
                              {formatUSD(displayPrice)}
                            </span>
                            <span className="text-xs text-zinc-500">
                              /{billingPreview === 'annual' ? 'year' : 'month'}
                            </span>
                          </div>
                          <p className="text-[11px] text-zinc-500 mt-1">
                            {plan.priorityWindow} · {memberCount} active member{memberCount === 1 ? '' : 's'}
                          </p>
                        </div>

                        <ul className="space-y-2.5">
                          {plan.features.map((feat, idx) => (
                            <li key={idx} className="text-xs text-zinc-300 flex items-start gap-2 leading-relaxed">
                              <CheckCircle2 size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                              <span>{feat}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <button
                        onClick={() => openEnrollModal(undefined, plan.id)}
                        className={`w-full py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                          plan.isPopular
                            ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                            : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-100'
                        }`}
                      >
                        Enroll Homeowner in {plan.name}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: ACTIVE MEMBERS & SEASONAL VISITS */}
          {activeTab === 'members' && (
            <div className="space-y-6">
              {/* Member Subscriptions Table */}
              <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[720px]">
                  <thead>
                    <tr className="border-b border-zinc-800 text-[11px] uppercase tracking-wider text-zinc-500">
                      <th className="py-3.5 px-4 font-semibold">Homeowner</th>
                      <th className="py-3.5 px-4 font-semibold">Maintenance Tier</th>
                      <th className="py-3.5 px-4 font-semibold">Billing</th>
                      <th className="py-3.5 px-4 font-semibold">Next Seasonal Visit</th>
                      <th className="py-3.5 px-4 font-semibold">Status</th>
                      <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/70 text-xs">
                    {subscriptions.map((sub) => {
                      const contact = contacts.find((c) => c.id === sub.contactId);
                      const plan = plans.find((p) => p.id === sub.planId);
                      return (
                        <tr key={sub.id} className="hover:bg-zinc-900/80">
                          <td className="py-3.5 px-4">
                            <p className="font-semibold text-zinc-100">{contact?.fullName || 'Homeowner'}</p>
                            <p className="text-[11px] text-zinc-500">{contact?.serviceArea || 'Reno–Sparks, NV'}</p>
                          </td>
                          <td className="py-3.5 px-4">
                            <p className="font-medium text-zinc-200">{plan?.name || 'Plan'}</p>
                            <p className="text-[11px] text-zinc-500">Lead: {sub.assignedTech}</p>
                          </td>
                          <td className="py-3.5 px-4 font-mono tabular-nums">
                            <p className="font-semibold text-zinc-100">
                              {formatUSD(sub.priceUsd)}/{sub.billingCycle === 'annual' ? 'yr' : 'mo'}
                            </p>
                            <p className="text-[11px] text-zinc-500">Next bill: {sub.nextBillingDate}</p>
                          </td>
                          <td className="py-3.5 px-4 font-mono tabular-nums text-zinc-300">{sub.nextVisitDate}</td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`px-2 py-0.5 rounded text-[11px] font-semibold capitalize ${
                                sub.status === 'active'
                                  ? 'bg-emerald-500/15 text-emerald-300'
                                  : sub.status === 'paused'
                                  ? 'bg-amber-500/15 text-amber-300'
                                  : 'bg-zinc-800 text-zinc-400'
                              }`}
                            >
                              {sub.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            {sub.status === 'active' ? (
                              <button
                                onClick={() => handleUpdateSubStatus(sub.id, 'paused')}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] font-medium"
                              >
                                <PauseCircle size={12} /> Pause
                              </button>
                            ) : (
                              <button
                                onClick={() => handleUpdateSubStatus(sub.id, 'active')}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 text-[11px] font-medium"
                              >
                                <PlayCircle size={12} /> Resume
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Scheduled Seasonal Preventive Visits */}
              <div className="space-y-3">
                <h2 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                  <Calendar size={15} className="text-emerald-400" />
                  Seasonal Preventive Visit Checklists
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {visits.map((visit) => {
                    const contact = contacts.find((c) => c.id === visit.contactId);
                    const doneCount = visit.checklist.filter((i) => i.done).length;
                    return (
                      <div
                        key={visit.id}
                        className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-5 space-y-3.5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-xs text-emerald-400 font-semibold">
                              {visit.season} Preventive Visit · {visit.visitDate}
                            </p>
                            <h3 className="text-sm font-bold text-zinc-100 mt-0.5">
                              {contact?.fullName || 'Member'} ({contact?.serviceArea})
                            </h3>
                            <p className="text-[11px] text-zinc-500">Technician: {visit.technician}</p>
                          </div>
                          <span
                            className={`text-[11px] font-semibold px-2 py-0.5 rounded capitalize ${
                              visit.status === 'completed'
                                ? 'bg-emerald-500/15 text-emerald-300'
                                : 'bg-amber-500/15 text-amber-300'
                            }`}
                          >
                            {visit.status} ({doneCount}/{visit.checklist.length})
                          </span>
                        </div>

                        <div className="space-y-1.5">
                          {visit.checklist.map((item, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleToggleVisitCheck(visit, idx)}
                              className="w-full text-left flex items-center gap-2.5 p-2 rounded-lg bg-zinc-950/60 border border-zinc-800/70 hover:border-zinc-700 text-xs"
                            >
                              {item.done ? (
                                <CheckSquare size={14} className="text-emerald-400 shrink-0" />
                              ) : (
                                <Square size={14} className="text-zinc-500 shrink-0" />
                              )}
                              <span className={item.done ? 'line-through text-zinc-500' : 'text-zinc-200'}>
                                {item.label}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: SELF-HOSTED SUPABASE ON ZO COMPUTER SQL */}
          {activeTab === 'supabase' && (
            <div className="space-y-4">
              <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                    <Database size={16} className="text-emerald-400" />
                    Self-Hosted Supabase on Zo Computer — PostgreSQL Schema & Setup
                  </h2>
                  <p className="text-xs text-zinc-400 mt-1">
                    Run these SQL scripts in your Zo Computer Supabase Studio SQL Editor, then set{' '}
                    <span className="font-mono text-zinc-200">SUPABASE_URL</span> and{' '}
                    <span className="font-mono text-zinc-200">SUPABASE_SERVICE_ROLE_KEY</span> in your server environment
                    secrets.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={handleCopySql}
                    className="px-3.5 py-2 rounded-lg bg-zinc-950 border border-zinc-800 hover:border-emerald-500/40 text-xs font-semibold text-zinc-200 flex items-center gap-1.5"
                  >
                    {copiedSql ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                    {copiedSql ? 'Copied' : 'Copy'}
                  </button>
                  <button
                    onClick={handleDownloadSql}
                    className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5"
                  >
                    <Download size={13} /> Download File
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {(
                  [
                    { id: 'migration', label: '001_sierra_crm_maintenance.sql' },
                    { id: 'seed', label: 'seed.sql' },
                    { id: 'guide', label: 'Zo Computer Setup Guide' }
                  ] as const
                ).map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setSqlSubTab(t.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono border ${
                      sqlSubTab === t.id
                        ? 'bg-emerald-600/20 border-emerald-500/40 text-emerald-300'
                        : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <pre className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 text-xs font-mono text-zinc-300 overflow-x-auto max-h-[520px] leading-relaxed whitespace-pre-wrap">
                {activeSqlText || 'Loading Supabase schema files...'}
              </pre>
            </div>
          )}
        </>
      )}

      {/* Add Homeowner Modal */}
      {isAddContactOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
              <h2 className="text-base font-bold text-zinc-100">Add Homeowner to CRM</h2>
              <button onClick={() => setIsAddContactOpen(false)} className="text-zinc-500 hover:text-zinc-200">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateContact} className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Full Name</label>
                  <input
                    required
                    type="text"
                    value={newContact.fullName}
                    onChange={(e) => setNewContact({ ...newContact, fullName: e.target.value })}
                    placeholder="e.g. Sarah & David Park"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Email</label>
                  <input
                    required
                    type="email"
                    value={newContact.email}
                    onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                    placeholder="homeowner@example.com"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Phone</label>
                  <input
                    type="text"
                    value={newContact.phone}
                    onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                    placeholder="(775) 555-0190"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Service Area</label>
                  <select
                    value={newContact.serviceArea}
                    onChange={(e) => setNewContact({ ...newContact, serviceArea: e.target.value as ServiceArea })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500"
                  >
                    {SERVICE_AREAS.map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-zinc-400 block mb-1">Street Address</label>
                <input
                  type="text"
                  value={newContact.streetAddress}
                  onChange={(e) => setNewContact({ ...newContact, streetAddress: e.target.value })}
                  placeholder="e.g. 2410 Vista Blvd"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Property Type</label>
                  <select
                    value={newContact.propertyType}
                    onChange={(e) => setNewContact({ ...newContact, propertyType: e.target.value as PropertyType })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500"
                  >
                    {PROPERTY_TYPES.map((pt) => (
                      <option key={pt} value={pt}>
                        {pt}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Lead Stage</label>
                  <select
                    value={newContact.leadStage}
                    onChange={(e) => setNewContact({ ...newContact, leadStage: e.target.value as LeadStage })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500"
                  >
                    {LEAD_STAGES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-zinc-400 block mb-1">Home & Service Notes</label>
                <textarea
                  rows={3}
                  value={newContact.notes}
                  onChange={(e) => setNewContact({ ...newContact, notes: e.target.value })}
                  placeholder="Home age, gate code, pet notes, or maintenance plan interest..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsAddContactOpen(false)}
                  className="px-4 py-2 text-xs text-zinc-400 hover:text-zinc-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-xs font-semibold"
                >
                  Save Homeowner
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Enroll Homeowner Modal */}
      {enrollModal.open && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md">
            <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
              <h2 className="text-base font-bold text-zinc-100">Enroll Homeowner in Maintenance Plan</h2>
              <button
                onClick={() => setEnrollModal({ open: false, contactId: '', planId: '' })}
                className="text-zinc-500 hover:text-zinc-200"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleEnrollSubmit} className="p-5 space-y-4">
              <div>
                <label className="text-xs text-zinc-400 block mb-1">Homeowner</label>
                <select
                  value={enrollModal.contactId}
                  onChange={(e) => setEnrollModal({ ...enrollModal, contactId: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500"
                >
                  {contacts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.fullName} ({c.serviceArea})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-zinc-400 block mb-1">Subscription Tier</label>
                <select
                  value={enrollModal.planId}
                  onChange={(e) => setEnrollModal({ ...enrollModal, planId: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500"
                >
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — {formatUSD(p.monthlyPrice)}/mo or {formatUSD(p.annualPrice)}/yr
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Billing Cycle</label>
                  <select
                    value={enrollForm.billingCycle}
                    onChange={(e) =>
                      setEnrollForm({ ...enrollForm, billingCycle: e.target.value as 'monthly' | 'annual' })
                    }
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="annual">Annual (Prepaid)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">First Seasonal Visit</label>
                  <input
                    type="date"
                    value={enrollForm.nextVisitDate}
                    onChange={(e) => setEnrollForm({ ...enrollForm, nextVisitDate: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-2 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-zinc-400 block mb-1">Assigned Technician</label>
                <select
                  value={enrollForm.assignedTech}
                  onChange={(e) => setEnrollForm({ ...enrollForm, assignedTech: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500"
                >
                  {TECHS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setEnrollModal({ open: false, contactId: '', planId: '' })}
                  className="px-4 py-2 text-xs text-zinc-400 hover:text-zinc-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-xs font-semibold"
                >
                  Activate Subscription
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Plan Pricing Modal */}
      {editingPlan && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md">
            <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
              <h2 className="text-base font-bold text-zinc-100">Edit Plan: {editingPlan.name}</h2>
              <button onClick={() => setEditingPlan(null)} className="text-zinc-500 hover:text-zinc-200">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSavePlanEdit} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Monthly Price (USD)</label>
                  <input
                    required
                    type="number"
                    min={10}
                    value={editPlanForm.monthlyPrice}
                    onChange={(e) => setEditPlanForm({ ...editPlanForm, monthlyPrice: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-zinc-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Annual Price (USD)</label>
                  <input
                    required
                    type="number"
                    min={50}
                    value={editPlanForm.annualPrice}
                    onChange={(e) => setEditPlanForm({ ...editPlanForm, annualPrice: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-zinc-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-zinc-400 block mb-1">Member Handyman Discount (%)</label>
                <input
                  required
                  type="number"
                  min={0}
                  max={50}
                  value={editPlanForm.handymanDiscountPct}
                  onChange={(e) => setEditPlanForm({ ...editPlanForm, handymanDiscountPct: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-zinc-100 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="text-xs text-zinc-400 block mb-1">Plan Tagline</label>
                <input
                  type="text"
                  value={editPlanForm.tagline}
                  onChange={(e) => setEditPlanForm({ ...editPlanForm, tagline: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setEditingPlan(null)}
                  className="px-4 py-2 text-xs text-zinc-400 hover:text-zinc-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-xs font-semibold"
                >
                  Save Plan Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CRMSubscriptions;
