import React, { useState, useMemo } from 'react';
import {
  ShoppingCart,
  CheckCircle2,
  Plus,
  Sparkles,
  Loader2,
  ArrowRight,
  Package,
  Store,
  FileCheck2,
  Truck,
  X,
  Check
} from 'lucide-react';
import { MOCK_BUYOUT_PACKAGES, MOCK_SUBCONTRACTORS } from '../constants';
import { BuyoutPackage, Subcontractor } from '../types';
import { queryAgent } from '../geminiService';

interface BuyoutModuleProps {
  onNavigate?: (tab: string) => void;
}

const WORKFLOW_STEPS: { id: BuyoutPackage['status']; label: string }[] = [
  { id: 'assessment', label: '1. Scope' },
  { id: 'prequal', label: '2. Suppliers' },
  { id: 'bidding', label: '3. Quotes' },
  { id: 'pricing', label: '4. Compare' },
  { id: 'negotiation', label: '5. Finalize' },
  { id: 'execution', label: '6. Pickup Ready' }
];

const SUPPLY_CATEGORIES = [
  'Senior Safety Hardware',
  'Interior & Exterior Paint',
  'Smart Locks & Sensors',
  'Hardware & Handyman Supplies',
  'Plumbing & Fixture Repairs',
  'Seasonal Maintenance Kits'
];

const formatUSD = (v: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v);

const BuyoutModule: React.FC<BuyoutModuleProps> = ({ onNavigate }) => {
  const [packages, setPackages] = useState<BuyoutPackage[]>(MOCK_BUYOUT_PACKAGES);
  const [suppliers] = useState<Subcontractor[]>(MOCK_SUBCONTRACTORS);
  const [selectedPkgId, setSelectedPkgId] = useState<string>(MOCK_BUYOUT_PACKAGES[0].id);

  // AI Sourcing Advice
  const [aiAdvice, setAiAdvice] = useState<string | null>(null);
  const [isLoadingAI, setIsLoadingAI] = useState(false);

  // New Material Package Modal
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [newPkg, setNewPkg] = useState({
    title: '',
    trade: SUPPLY_CATEGORIES[0],
    budgetedAmount: '650'
  });

  // Add Quote Inline
  const [quoteSupplierId, setQuoteSupplierId] = useState<string>(MOCK_SUBCONTRACTORS[0].id);
  const [quoteAmount, setQuoteAmount] = useState<string>('');

  const selectedPkg = useMemo(
    () => packages.find((p) => p.id === selectedPkgId) || packages[0],
    [packages, selectedPkgId]
  );

  const stepIndex = WORKFLOW_STEPS.findIndex((s) => s.id === selectedPkg.status);

  const handleAdvanceStep = (targetStatus: BuyoutPackage['status']) => {
    setPackages((prev) =>
      prev.map((p) => (p.id === selectedPkg.id ? { ...p, status: targetStatus } : p))
    );
  };

  const handleAcceptQuote = (bidId: string) => {
    setPackages((prev) =>
      prev.map((p) => {
        if (p.id !== selectedPkg.id) return p;
        return {
          ...p,
          status: 'execution',
          bids: p.bids.map((b) => ({
            ...b,
            status: b.id === bidId ? 'accepted' : 'rejected'
          }))
        };
      })
    );
  };

  const handleAddQuote = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(quoteAmount);
    if (!amt || amt <= 0) return;
    setPackages((prev) =>
      prev.map((p) => {
        if (p.id !== selectedPkg.id) return p;
        return {
          ...p,
          status: p.status === 'assessment' || p.status === 'prequal' ? 'bidding' : p.status,
          bids: [
            ...p.bids,
            {
              id: `b-${Date.now()}`,
              subcontractorId: quoteSupplierId,
              packageId: p.id,
              amount: amt,
              scopeCoverage: 100,
              proposedStart: '2026-11-22',
              proposedEnd: '2026-11-23',
              status: 'submitted'
            }
          ]
        };
      })
    );
    setQuoteAmount('');
  };

  const handleCreatePackage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPkg.title.trim()) return;
    const created: BuyoutPackage = {
      id: `bp-${Date.now()}`,
      projectId: 'p1',
      title: newPkg.title.trim(),
      trade: newPkg.trade,
      status: 'assessment',
      budgetedAmount: Math.max(50, Number(newPkg.budgetedAmount) || 500),
      bids: []
    };
    setPackages((prev) => [created, ...prev]);
    setSelectedPkgId(created.id);
    setIsNewModalOpen(false);
    setNewPkg({ title: '', trade: SUPPLY_CATEGORIES[0], budgetedAmount: '650' });
  };

  const handleAskSupplyAI = async () => {
    setIsLoadingAI(true);
    const quoteLines = selectedPkg.bids
      .map((b) => {
        const sup = suppliers.find((s) => s.id === b.subcontractorId);
        return `${sup?.name || 'Local Supplier'}: ${formatUSD(b.amount)} (${b.scopeCoverage}% in stock)`;
      })
      .join('; ');
    const prompt = `Review this Sierra Home Pros residential material package: "${selectedPkg.title}" (${selectedPkg.trade}). Estimate allowance: ${formatUSD(
      selectedPkg.budgetedAmount
    )}. Local Reno/Sparks supplier quotes: ${
      quoteLines || 'None yet'
    }. Give a concise 3-bullet sourcing and Sparks will-call pickup recommendation.`;
    const res = await queryAgent('Optimizer', prompt);
    setAiAdvice(res || 'Unable to generate sourcing recommendation right now.');
    setIsLoadingAI(false);
  };

  const totalAllowance = packages.reduce((s, p) => s + p.budgetedAmount, 0);
  const readyCount = packages.filter((p) => p.status === 'execution').length;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-zinc-500 mb-1">
            <span>Sierra Home Pros</span>
            <span>·</span>
            <span>Sparks & Reno Local Suppliers · Upfront Material Pricing</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100">Estimates & Material Supply</h1>
        </div>
        <div className="flex items-center gap-3">
          {onNavigate && (
            <button
              onClick={() => onNavigate('execution')}
              className="px-3.5 py-2 rounded-lg bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 text-xs font-medium text-zinc-300 flex items-center gap-1.5"
            >
              Field Dispatch <ArrowRight size={13} />
            </button>
          )}
          <button
            onClick={() => setIsNewModalOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2"
          >
            <Plus size={15} /> New Material Order
          </button>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-4">
          <p className="text-xs text-zinc-500">Material Packages</p>
          <p className="text-2xl font-bold font-mono tabular-nums text-zinc-100 mt-1">{packages.length}</p>
        </div>
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-4">
          <p className="text-xs text-zinc-500">Total Material Allowance</p>
          <p className="text-2xl font-bold font-mono tabular-nums text-zinc-100 mt-1">{formatUSD(totalAllowance)}</p>
        </div>
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-4">
          <p className="text-xs text-zinc-500">Ready for Van Pickup</p>
          <p className="text-2xl font-bold font-mono tabular-nums text-emerald-400 mt-1">
            {readyCount} / {packages.length}
          </p>
        </div>
      </div>

      {/* Main Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Packages List */}
        <div className="lg:col-span-4 space-y-2.5">
          {packages.map((pkg) => {
            const isSelected = selectedPkg.id === pkg.id;
            const lowestBid = pkg.bids.length > 0 ? Math.min(...pkg.bids.map((b) => b.amount)) : null;
            return (
              <button
                key={pkg.id}
                onClick={() => {
                  setSelectedPkgId(pkg.id);
                  setAiAdvice(null);
                }}
                className={`w-full text-left p-4 rounded-xl border transition-all ${
                  isSelected
                    ? 'bg-zinc-900 border-emerald-500/50 ring-1 ring-emerald-500/20'
                    : 'bg-zinc-900/40 border-zinc-800/80 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="text-emerald-400 font-medium">{pkg.trade}</span>
                  <span className="text-zinc-400 capitalize">{pkg.status === 'execution' ? 'Pickup Ready' : pkg.status}</span>
                </div>
                <h3 className="text-sm font-semibold text-zinc-100 leading-snug">{pkg.title}</h3>
                <div className="mt-3 pt-2.5 border-t border-zinc-800/70 flex items-center justify-between text-xs font-mono tabular-nums">
                  <span className="text-zinc-400">Est. {formatUSD(pkg.budgetedAmount)}</span>
                  <span className={lowestBid && lowestBid <= pkg.budgetedAmount ? 'text-emerald-400' : 'text-zinc-300'}>
                    {lowestBid ? `Best: ${formatUSD(lowestBid)}` : `${pkg.bids.length} quotes`}
                  </span>
                </div>
              </button>
            );
          })}

          {/* Local Sparks/Reno Suppliers */}
          <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-4 mt-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-3 flex items-center gap-1.5">
              <Store size={13} className="text-emerald-400" /> Sparks & Reno Supply Partners
            </h3>
            <div className="space-y-2.5">
              {suppliers.map((sup) => (
                <div key={sup.id} className="text-xs pb-2.5 border-b border-zinc-800/60 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-zinc-200">{sup.name}</span>
                    <span className="text-emerald-400 font-mono text-[11px]">{Math.round(sup.safetyScore * 100)}% fill</span>
                  </div>
                  <p className="text-[11px] text-zinc-500 mt-0.5">{sup.trade}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Selected Package Detail */}
        <div className="lg:col-span-8 bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-6 space-y-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs text-emerald-400 font-medium">{selectedPkg.trade}</p>
              <h2 className="text-lg font-bold text-zinc-100 mt-0.5">{selectedPkg.title}</h2>
              <p className="text-xs text-zinc-400 mt-1 font-mono tabular-nums">
                Written Estimate Material Allowance: {formatUSD(selectedPkg.budgetedAmount)}
              </p>
            </div>
            <button
              onClick={handleAskSupplyAI}
              disabled={isLoadingAI}
              className="px-3.5 py-2 rounded-lg bg-emerald-600/15 hover:bg-emerald-600/25 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50"
            >
              {isLoadingAI ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
              Sierra Supply Advice
            </button>
          </div>

          {/* 6-Step Procurement Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-1.5">
            {WORKFLOW_STEPS.map((step, idx) => {
              const isCompleted = idx < stepIndex;
              const isCurrent = idx === stepIndex;
              return (
                <button
                  key={step.id}
                  onClick={() => handleAdvanceStep(step.id)}
                  className={`px-2 py-2 rounded-lg text-[11px] font-medium border text-center transition-colors ${
                    isCurrent
                      ? 'bg-emerald-600/20 border-emerald-500/50 text-emerald-300'
                      : isCompleted
                      ? 'bg-zinc-900 border-zinc-700 text-zinc-200'
                      : 'bg-zinc-950/60 border-zinc-800 text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {step.label}
                </button>
              );
            })}
          </div>

          {aiAdvice && (
            <div className="bg-emerald-500/5 border border-emerald-500/25 rounded-xl p-4 text-xs text-zinc-200 whitespace-pre-line leading-relaxed">
              <p className="font-semibold text-emerald-300 mb-1.5 flex items-center gap-1.5">
                <Sparkles size={13} /> Sierra Route Pro & Supply Recommendation
              </p>
              {aiAdvice}
            </div>
          )}

          {/* Supplier Quotes Table */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Local Supplier Quotes ({selectedPkg.bids.length})
            </h3>

            {selectedPkg.bids.length === 0 ? (
              <div className="p-6 text-center rounded-xl bg-zinc-950/60 border border-zinc-800/80 text-xs text-zinc-500">
                No supplier quotes recorded yet. Add a Sparks/Reno counter quote below.
              </div>
            ) : (
              <div className="space-y-2.5">
                {selectedPkg.bids.map((bid) => {
                  const sup = suppliers.find((s) => s.id === bid.subcontractorId);
                  const delta = selectedPkg.budgetedAmount - bid.amount;
                  const isAccepted = bid.status === 'accepted';
                  return (
                    <div
                      key={bid.id}
                      className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        isAccepted
                          ? 'bg-emerald-500/10 border-emerald-500/40'
                          : 'bg-zinc-950/60 border-zinc-800/80'
                      }`}
                    >
                      <div>
                        <p className="text-sm font-semibold text-zinc-100">{sup?.name || 'Local Supplier'}</p>
                        <p className="text-xs text-zinc-400 mt-0.5">
                          In-stock match: <span className="font-mono">{bid.scopeCoverage}%</span> · Pickup window:{' '}
                          <span className="font-mono">{bid.proposedStart}</span>
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right font-mono tabular-nums">
                          <p className="text-base font-bold text-zinc-100">{formatUSD(bid.amount)}</p>
                          <p className={`text-[11px] ${delta >= 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                            {delta >= 0 ? `${formatUSD(delta)} under est.` : `${formatUSD(Math.abs(delta))} over est.`}
                          </p>
                        </div>
                        {isAccepted ? (
                          <span className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 text-xs font-semibold flex items-center gap-1">
                            <Check size={13} /> Will-Call Locked
                          </span>
                        ) : (
                          <button
                            onClick={() => handleAcceptQuote(bid.id)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
                          >
                            Lock Pickup
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Add Local Counter Quote */}
            <form
              onSubmit={handleAddQuote}
              className="flex flex-col sm:flex-row gap-2 pt-3 border-t border-zinc-800/70"
            >
              <select
                value={quoteSupplierId}
                onChange={(e) => setQuoteSupplierId(e.target.value)}
                className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500"
              >
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min={10}
                value={quoteAmount}
                onChange={(e) => setQuoteAmount(e.target.value)}
                placeholder="Quote USD (e.g. 890)"
                className="w-full sm:w-40 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-zinc-100 focus:outline-none focus:border-emerald-500"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-100 text-xs font-semibold shrink-0"
              >
                Add Quote
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* New Material Order Modal */}
      {isNewModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md">
            <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
              <h2 className="text-base font-bold text-zinc-100">New Residential Material Order</h2>
              <button onClick={() => setIsNewModalOpen(false)} className="text-zinc-500 hover:text-zinc-200">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreatePackage} className="p-5 space-y-4">
              <div>
                <label className="text-xs text-zinc-400 block mb-1">Material Kit / Order Name</label>
                <input
                  required
                  type="text"
                  value={newPkg.title}
                  onChange={(e) => setNewPkg({ ...newPkg, title: e.target.value })}
                  placeholder="e.g. Somersett Drywall Patch & Trim Moulding Kit"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="text-xs text-zinc-400 block mb-1">Supply Category</label>
                <select
                  value={newPkg.trade}
                  onChange={(e) => setNewPkg({ ...newPkg, trade: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500"
                >
                  {SUPPLY_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-zinc-400 block mb-1">Written Estimate Material Allowance (USD)</label>
                <input
                  required
                  type="number"
                  min={25}
                  value={newPkg.budgetedAmount}
                  onChange={(e) => setNewPkg({ ...newPkg, budgetedAmount: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-zinc-100 focus:outline-none focus:border-emerald-500"
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
                  Create Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BuyoutModule;
