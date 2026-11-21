import React, { useState, useMemo } from 'react';
import {
  HelpCircle,
  Plus,
  Search,
  Sparkles,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Send,
  Loader2,
  MessageSquare,
  X,
  User,
  Home
} from 'lucide-react';
import { aiSuggestRFIAnswer } from '../geminiService';

interface HomeownerRequest {
  id: string;
  code: string;
  jobName: string;
  homeowner: string;
  location: string;
  subject: string;
  question: string;
  category: 'Senior Safety' | 'Painting' | 'Smart Home' | 'Written Estimate' | 'Maintenance';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'pending-homeowner' | 'resolved';
  createdAt: string;
  assignedTech: string;
  response?: string;
}

const INITIAL_REQUESTS: HomeownerRequest[] = [
  {
    id: 'req-1',
    code: 'REQ-101',
    jobName: 'Damonte Ranch Senior Safety & Accessibility Upgrade',
    homeowner: 'Margaret & Robert Chen',
    location: 'Reno, NV',
    subject: 'Primary shower grab bar mounting behind porcelain tile',
    question: 'Tile wall stud spacing in the walk-in shower is 24" on center rather than 16". Should we mount a 24" brushed-nickel ADA bar directly into studs or use WingIts stainless rated anchors for an 18" diagonal bar?',
    category: 'Senior Safety',
    priority: 'high',
    status: 'open',
    createdAt: 'Today · 8:15 AM',
    assignedTech: 'Caleb Martinez'
  },
  {
    id: 'req-2',
    code: 'REQ-102',
    jobName: 'Incline Village Exterior Trim & Cedar Deck Painting',
    homeowner: 'Daniel & Claire Vance',
    location: 'Lake Tahoe, NV',
    subject: 'Low-temp exterior stain & sheen confirmation before finish coat',
    question: 'Nighttime temps in Incline Village are dipping to 34°F. Can the homeowners approve switching the final trim coat to Sherwin-Williams Resilience Satin (35°F rated) in matching SW 7006 Extra White at no added estimate cost?',
    category: 'Painting',
    priority: 'critical',
    status: 'pending-homeowner',
    createdAt: 'Yesterday · 4:30 PM',
    assignedTech: 'Braden Vance',
    response: 'Sent SMS color & low-temp product confirmation to Daniel Vance; awaiting thumbs-up before 11 AM sun window.'
  },
  {
    id: 'req-3',
    code: 'REQ-103',
    jobName: 'Wingfield Springs Smart-Home & Security Package',
    homeowner: 'Priya Nair',
    location: 'Sparks, NV',
    subject: 'Existing doorbell transformer voltage for video doorbell',
    question: 'Tested the existing chime transformer in the hall closet at 12V AC. The new smart video doorbell requires 16–24V AC. Should we swap in our van-stocked 16V/30VA transformer and log a $65 written add-on?',
    category: 'Smart Home',
    priority: 'medium',
    status: 'open',
    createdAt: 'Today · 9:05 AM',
    assignedTech: 'Elena Morales'
  },
  {
    id: 'req-4',
    code: 'REQ-104',
    jobName: 'Somersett Drywall, Trim & Interior Door Repair Bundle',
    homeowner: 'Kevin & Sarah Brooks',
    location: 'Reno, NV',
    subject: 'Add-on written price for pantry bifold door track replacement',
    question: 'While repairing the guest bedroom trim, homeowner asked if we can replace the bent upper bifold track on the kitchen pantry door today.',
    category: 'Written Estimate',
    priority: 'low',
    status: 'resolved',
    createdAt: 'Nov 20 · 2:10 PM',
    assignedTech: 'Braden Vance',
    response: 'Issued $145 written add-on estimate via Jobber SMS. Approved by Kevin Brooks; hardware already on Van #2.'
  }
];

const RFITracker: React.FC = () => {
  const [requests, setRequests] = useState<HomeownerRequest[]>(INITIAL_REQUESTS);
  const [selectedId, setSelectedId] = useState<string>(INITIAL_REQUESTS[0].id);
  const [statusFilter, setStatusFilter] = useState<'all' | HomeownerRequest['status']>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Reply & AI Assistant
  const [draftReply, setDraftReply] = useState('');
  const [isDraftingAI, setIsDraftingAI] = useState(false);

  // New Request Modal
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [newForm, setNewForm] = useState({
    jobName: 'Damonte Ranch Senior Safety & Accessibility Upgrade',
    homeowner: '',
    location: 'Sparks, NV',
    subject: '',
    question: '',
    category: 'Written Estimate' as HomeownerRequest['category'],
    priority: 'medium' as HomeownerRequest['priority'],
    assignedTech: 'Caleb Martinez'
  });

  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          r.code.toLowerCase().includes(q) ||
          r.subject.toLowerCase().includes(q) ||
          r.homeowner.toLowerCase().includes(q) ||
          r.jobName.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [requests, statusFilter, searchQuery]);

  const selectedRequest = useMemo(
    () => requests.find((r) => r.id === selectedId) || filteredRequests[0] || null,
    [requests, selectedId, filteredRequests]
  );

  const handleAIDraft = async () => {
    if (!selectedRequest) return;
    setIsDraftingAI(true);
    const res = await aiSuggestRFIAnswer(
      `${selectedRequest.subject} — ${selectedRequest.question} (Job: ${selectedRequest.jobName}, ${selectedRequest.location})`
    );
    if (res?.suggestedAnswer) {
      setDraftReply(res.suggestedAnswer);
    }
    setIsDraftingAI(false);
  };

  const handleSendResponse = (nextStatus: 'pending-homeowner' | 'resolved') => {
    if (!selectedRequest || !draftReply.trim()) return;
    setRequests((prev) =>
      prev.map((r) =>
        r.id === selectedRequest.id
          ? { ...r, response: draftReply.trim(), status: nextStatus }
          : r
      )
    );
    setDraftReply('');
  };

  const handleCreateRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newForm.subject.trim() || !newForm.question.trim() || !newForm.homeowner.trim()) {
      setValidationError('Please enter the homeowner name, subject, and scope question.');
      return;
    }
    setValidationError(null);
    const nextNum = 101 + requests.length;
    const created: HomeownerRequest = {
      id: `req-${Date.now()}`,
      code: `REQ-${nextNum}`,
      jobName: newForm.jobName,
      homeowner: newForm.homeowner.trim(),
      location: newForm.location,
      subject: newForm.subject.trim(),
      question: newForm.question.trim(),
      category: newForm.category,
      priority: newForm.priority,
      status: 'open',
      createdAt: 'Just now',
      assignedTech: newForm.assignedTech
    };
    setRequests((prev) => [created, ...prev]);
    setSelectedId(created.id);
    setIsNewModalOpen(false);
    setNewForm({
      jobName: 'Damonte Ranch Senior Safety & Accessibility Upgrade',
      homeowner: '',
      location: 'Sparks, NV',
      subject: '',
      question: '',
      category: 'Written Estimate',
      priority: 'medium',
      assignedTech: 'Caleb Martinez'
    });
  };

  const openCount = requests.filter((r) => r.status === 'open').length;
  const pendingCount = requests.filter((r) => r.status === 'pending-homeowner').length;
  const resolvedCount = requests.filter((r) => r.status === 'resolved').length;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-zinc-500 mb-1">
            <span>Sierra Home Pros</span>
            <span>·</span>
            <span>Homeowner Clarifications & Written Add-On Approvals</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100">Homeowner Requests</h1>
        </div>
        <button
          onClick={() => setIsNewModalOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors self-start md:self-auto"
        >
          <Plus size={15} /> Log Scope Question
        </button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-4">
          <p className="text-xs text-zinc-500">Needs Coordinator Review</p>
          <p className="text-2xl font-bold font-mono tabular-nums text-amber-400 mt-1">{openCount}</p>
        </div>
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-4">
          <p className="text-xs text-zinc-500">Awaiting Homeowner SMS</p>
          <p className="text-2xl font-bold font-mono tabular-nums text-sky-400 mt-1">{pendingCount}</p>
        </div>
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-4">
          <p className="text-xs text-zinc-500">Approved & Closed</p>
          <p className="text-2xl font-bold font-mono tabular-nums text-emerald-400 mt-1">{resolvedCount}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search REQ code, homeowner, or topic..."
            className="w-full bg-zinc-900/60 border border-zinc-800 rounded-lg pl-9 pr-4 py-2 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500/60"
          />
        </div>
        <div className="flex items-center gap-1.5">
          {(
            [
              { id: 'all', label: 'All' },
              { id: 'open', label: 'Open' },
              { id: 'pending-homeowner', label: 'Awaiting Homeowner' },
              { id: 'resolved', label: 'Resolved' }
            ] as const
          ).map((f) => (
            <button
              key={f.id}
              onClick={() => setStatusFilter(f.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                statusFilter === f.id
                  ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-zinc-900/60 text-zinc-400 border border-zinc-800 hover:text-zinc-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Split Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Request List */}
        <div className="lg:col-span-5 space-y-2.5">
          {filteredRequests.map((req) => {
            const isSelected = selectedRequest?.id === req.id;
            return (
              <button
                key={req.id}
                onClick={() => {
                  setSelectedId(req.id);
                  setDraftReply(req.response || '');
                }}
                className={`w-full text-left p-4 rounded-xl border transition-all ${
                  isSelected
                    ? 'bg-zinc-900 border-emerald-500/50 ring-1 ring-emerald-500/20'
                    : 'bg-zinc-900/40 border-zinc-800/80 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="font-mono font-semibold text-emerald-400">
                    {req.code} · {req.category}
                  </span>
                  <span
                    className={`font-medium ${
                      req.priority === 'critical'
                        ? 'text-red-400'
                        : req.priority === 'high'
                        ? 'text-amber-400'
                        : 'text-zinc-400'
                    }`}
                  >
                    {req.priority.toUpperCase()}
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-zinc-100 leading-snug">{req.subject}</h3>
                <p className="text-xs text-zinc-400 mt-1 truncate">
                  {req.homeowner} · {req.location}
                </p>
                <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-zinc-800/70 text-[11px]">
                  <span className="text-zinc-500">{req.assignedTech}</span>
                  <span
                    className={`font-medium ${
                      req.status === 'resolved'
                        ? 'text-emerald-400'
                        : req.status === 'pending-homeowner'
                        ? 'text-sky-400'
                        : 'text-amber-400'
                    }`}
                  >
                    {req.status === 'resolved'
                      ? 'Resolved'
                      : req.status === 'pending-homeowner'
                      ? 'Awaiting Homeowner'
                      : 'Open'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Request Detail & AI Reply */}
        {selectedRequest && (
          <div className="lg:col-span-7 bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-6 space-y-5">
            <div className="flex items-start justify-between gap-4 border-b border-zinc-800/80 pb-4">
              <div>
                <div className="flex items-center gap-2 text-xs text-zinc-400">
                  <span className="font-mono font-semibold text-emerald-400">{selectedRequest.code}</span>
                  <span>·</span>
                  <span>{selectedRequest.category}</span>
                  <span>·</span>
                  <span>{selectedRequest.createdAt}</span>
                </div>
                <h2 className="text-lg font-bold text-zinc-100 mt-1">{selectedRequest.subject}</h2>
                <p className="text-xs text-zinc-400 mt-1 flex items-center gap-1.5">
                  <Home size={13} className="text-emerald-400" />
                  {selectedRequest.jobName} — {selectedRequest.homeowner} ({selectedRequest.location})
                </p>
              </div>
              <span
                className={`px-2.5 py-1 rounded-md text-xs font-semibold shrink-0 ${
                  selectedRequest.status === 'resolved'
                    ? 'bg-emerald-500/15 text-emerald-300'
                    : selectedRequest.status === 'pending-homeowner'
                    ? 'bg-sky-500/15 text-sky-300'
                    : 'bg-amber-500/15 text-amber-300'
                }`}
              >
                {selectedRequest.status === 'resolved'
                  ? 'Approved & Closed'
                  : selectedRequest.status === 'pending-homeowner'
                  ? 'Sent to Homeowner'
                  : 'Open Question'}
              </span>
            </div>

            <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-xl p-4">
              <p className="text-[11px] uppercase tracking-wider text-zinc-500 font-semibold mb-1.5">
                Field Technician Note ({selectedRequest.assignedTech})
              </p>
              <p className="text-sm text-zinc-200 leading-relaxed">{selectedRequest.question}</p>
            </div>

            {selectedRequest.response && (
              <div className="bg-emerald-500/5 border border-emerald-500/25 rounded-xl p-4">
                <p className="text-[11px] uppercase tracking-wider text-emerald-400 font-semibold mb-1.5 flex items-center gap-1.5">
                  <CheckCircle2 size={13} /> Recorded Coordinator & Homeowner Resolution
                </p>
                <p className="text-sm text-zinc-200 leading-relaxed">{selectedRequest.response}</p>
              </div>
            )}

            {/* Response Composer */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                  <MessageSquare size={14} className="text-emerald-400" />
                  Homeowner Guidance / Written Add-On Note
                </label>
                <button
                  onClick={handleAIDraft}
                  disabled={isDraftingAI}
                  className="text-xs font-medium text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isDraftingAI ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
                  Draft with Sierra Safety Check AI
                </button>
              </div>

              <textarea
                rows={4}
                value={draftReply}
                onChange={(e) => setDraftReply(e.target.value)}
                placeholder="Write a clear recommendation or upfront written add-on price for the homeowner..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500"
              />

              <div className="flex flex-wrap items-center justify-end gap-2">
                <button
                  onClick={() => handleSendResponse('pending-homeowner')}
                  disabled={!draftReply.trim()}
                  className="px-3.5 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-xs font-semibold text-zinc-100 flex items-center gap-1.5"
                >
                  <Send size={13} /> Send SMS Approval Request
                </button>
                <button
                  onClick={() => handleSendResponse('resolved')}
                  disabled={!draftReply.trim()}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-xs font-semibold text-white flex items-center gap-1.5"
                >
                  <CheckCircle2 size={13} /> Mark Approved & Resolved
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* New Request Modal */}
      {isNewModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg">
            <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
              <h2 className="text-base font-bold text-zinc-100">Log Homeowner Request or Scope Question</h2>
              <button onClick={() => setIsNewModalOpen(false)} className="text-zinc-500 hover:text-zinc-200">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateRequest} className="p-5 space-y-4">
              {validationError && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-300 text-xs px-3 py-2 rounded-lg">
                  {validationError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Homeowner Name</label>
                  <input
                    type="text"
                    value={newForm.homeowner}
                    onChange={(e) => setNewForm({ ...newForm, homeowner: e.target.value })}
                    placeholder="e.g. Linda Holloway"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">City</label>
                  <select
                    value={newForm.location}
                    onChange={(e) => setNewForm({ ...newForm, location: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Sparks, NV">Sparks, NV</option>
                    <option value="Reno, NV">Reno, NV</option>
                    <option value="Carson City, NV">Carson City, NV</option>
                    <option value="Lake Tahoe, NV">Lake Tahoe, NV</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-zinc-400 block mb-1">Subject</label>
                <input
                  type="text"
                  value={newForm.subject}
                  onChange={(e) => setNewForm({ ...newForm, subject: e.target.value })}
                  placeholder="e.g. Confirm hallway paint sheen or grab bar placement"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Category</label>
                  <select
                    value={newForm.category}
                    onChange={(e) =>
                      setNewForm({ ...newForm, category: e.target.value as HomeownerRequest['category'] })
                    }
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Written Estimate">Written Estimate</option>
                    <option value="Senior Safety">Senior Safety</option>
                    <option value="Painting">Painting</option>
                    <option value="Smart Home">Smart Home</option>
                    <option value="Maintenance">Maintenance</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Priority</label>
                  <select
                    value={newForm.priority}
                    onChange={(e) =>
                      setNewForm({ ...newForm, priority: e.target.value as HomeownerRequest['priority'] })
                    }
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-zinc-400 block mb-1">Field Question / Add-On Details</label>
                <textarea
                  rows={3}
                  value={newForm.question}
                  onChange={(e) => setNewForm({ ...newForm, question: e.target.value })}
                  placeholder="Describe what the technician found on-site and what homeowner decision is needed..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-4 py-2 text-xs text-zinc-400 hover:text-zinc-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-xs font-semibold"
                >
                  Save Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RFITracker;
