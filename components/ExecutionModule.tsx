import React, { useState } from 'react';
import {
  ClipboardCheck,
  CheckSquare,
  Square,
  Truck,
  PackageCheck,
  ShieldCheck,
  MapPin,
  Clock,
  Sparkles,
  Wrench
} from 'lucide-react';
import RenoManpowerSchedule from './RenoManpowerSchedule';

interface CleanHomeCheck {
  id: string;
  label: string;
  detail: string;
  checked: boolean;
}

interface PickupItem {
  id: string;
  supplier: string;
  location: string;
  items: string;
  assignedVan: string;
  status: 'ready' | 'loaded' | 'pending';
}

const INITIAL_CHECKLIST: CleanHomeCheck[] = [
  {
    id: 'ch-1',
    label: 'Boot covers & canvas floor runners placed',
    detail: 'Verify entryway protection before bringing tools or ladders inside homeowner residences.',
    checked: true
  },
  {
    id: 'ch-2',
    label: 'Upfront written estimate confirmed on-site',
    detail: 'Walk through scope with homeowner and obtain SMS/signature approval for any add-ons.',
    checked: true
  },
  {
    id: 'ch-3',
    label: 'ADA grab-bar stud anchoring & pull-load test',
    detail: 'Confirm 250 lb+ solid blocking or rated WingIts stainless anchor verification on Senior Safety visits.',
    checked: false
  },
  {
    id: 'ch-4',
    label: 'HEPA shop-vac & magnetic hardware sweep',
    detail: 'Leave kitchens, bathrooms, and driveways cleaner than arrival with zero stray fasteners or drywall dust.',
    checked: false
  },
  {
    id: 'ch-5',
    label: 'Before/after photos & homeowner walk-through',
    detail: 'Capture closeout photos in Jobber and review warranty & seasonal maintenance tips.',
    checked: false
  }
];

const INITIAL_PICKUPS: PickupItem[] = [
  {
    id: 'pk-1',
    supplier: 'Reno ADA & Senior Mobility Direct',
    location: 'Sparks, NV',
    items: '1.25" beveled rubber threshold ramp + 4 brushed-nickel lever handles',
    assignedVan: 'Van #1 · Caleb Martinez',
    status: 'ready'
  },
  {
    id: 'pk-2',
    supplier: 'Sherwin-Williams Commercial',
    location: 'Sparks Blvd, Sparks',
    items: '2 gal Resilience Exterior Satin (SW 7006) + 1 gal cedar semi-transparent stain',
    assignedVan: 'Van #2 · Braden Vance',
    status: 'ready'
  },
  {
    id: 'pk-3',
    supplier: 'Sierra Lock & Smart Home Supply',
    location: 'Kietzke Ln, Reno',
    items: '16V/30VA doorbell transformer + 2 Schlage Encode matte black deadbolts',
    assignedVan: 'Van #3 · Elena Morales',
    status: 'loaded'
  },
  {
    id: 'pk-4',
    supplier: 'Home Depot Pro Desk',
    location: 'Sparks Blvd, Sparks',
    items: 'Frost-free hose bib covers, MERV-11 HVAC filters (6-pack) & exterior silicone caulk',
    assignedVan: 'Van #4 · Marcus Reid',
    status: 'pending'
  }
];

const VAN_STOCK = [
  { van: 'Van #1 · Sparks Depot', lead: 'Caleb Martinez', readiness: 96, missing: 'Restock 3" stainless lag screws' },
  { van: 'Van #2 · Reno / Tahoe', lead: 'Braden Vance', readiness: 92, missing: 'Add 2 rolls FrogTape & drop cloths' },
  { van: 'Van #3 · Smart Home', lead: 'Elena Morales', readiness: 98, missing: 'Fully stocked for Wingfield route' },
  { van: 'Van #4 · Carson Route', lead: 'Marcus Reid', readiness: 94, missing: 'Load gutter scoop & foam pipe wrap' }
];

const ExecutionModule: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'dispatch' | 'roster'>('dispatch');
  const [checklist, setChecklist] = useState<CleanHomeCheck[]>(INITIAL_CHECKLIST);
  const [pickups, setPickups] = useState<PickupItem[]>(INITIAL_PICKUPS);

  const toggleCheck = (id: string) => {
    setChecklist((prev) => prev.map((c) => (c.id === id ? { ...c, checked: !c.checked } : c)));
  };

  const cyclePickupStatus = (id: string) => {
    setPickups((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const next: PickupItem['status'] =
          p.status === 'pending' ? 'ready' : p.status === 'ready' ? 'loaded' : 'pending';
        return { ...p, status: next };
      })
    );
  };

  const completedChecks = checklist.filter((c) => c.checked).length;
  const loadedPickups = pickups.filter((p) => p.status === 'loaded').length;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-zinc-500 mb-1">
            <span>Sierra Home Pros</span>
            <span>·</span>
            <span>Sparks Dispatch Depot · Clean-Home Quality Standards</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100">Field Dispatch & Quality Control</h1>
        </div>

        <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-lg p-1 self-start md:self-auto">
          <button
            onClick={() => setActiveSubTab('dispatch')}
            className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-colors ${
              activeSubTab === 'dispatch'
                ? 'bg-emerald-600 text-white'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Daily Dispatch & QA
          </button>
          <button
            onClick={() => setActiveSubTab('roster')}
            className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-colors ${
              activeSubTab === 'roster'
                ? 'bg-emerald-600 text-white'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Van Roster & Hours
          </button>
        </div>
      </div>

      {activeSubTab === 'roster' ? (
        <RenoManpowerSchedule />
      ) : (
        <div className="space-y-6">
          {/* Dispatch Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-4">
              <p className="text-xs text-zinc-500">Clean-Home QA Progress</p>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-2xl font-bold font-mono tabular-nums text-emerald-400">
                  {completedChecks} / {checklist.length}
                </span>
                <span className="text-xs text-zinc-400">Daily visit checks</span>
              </div>
            </div>
            <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-4">
              <p className="text-xs text-zinc-500">Sparks Will-Call Pickups Loaded</p>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-2xl font-bold font-mono tabular-nums text-zinc-100">
                  {loadedPickups} / {pickups.length}
                </span>
                <span className="text-xs text-amber-400">2 ready at counter</span>
              </div>
            </div>
            <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-4">
              <p className="text-xs text-zinc-500">Fleet Van Stock Readiness</p>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-2xl font-bold font-mono tabular-nums text-emerald-400">95%</span>
                <span className="text-xs text-zinc-400">4 active vans</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left: Clean-Home Standards Checklist */}
            <div className="lg:col-span-6 bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                  <ShieldCheck size={16} className="text-emerald-400" />
                  Sierra Clean-Home Standards Checklist
                </h2>
                <span className="text-xs font-mono text-emerald-400">
                  {Math.round((completedChecks / checklist.length) * 100)}%
                </span>
              </div>

              <div className="space-y-2.5">
                {checklist.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => toggleCheck(item.id)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-colors flex items-start gap-3 ${
                      item.checked
                        ? 'bg-emerald-500/5 border-emerald-500/25'
                        : 'bg-zinc-950/60 border-zinc-800/80 hover:border-zinc-700'
                    }`}
                  >
                    {item.checked ? (
                      <CheckSquare size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <Square size={16} className="text-zinc-500 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <p
                        className={`text-xs font-semibold ${
                          item.checked ? 'line-through text-zinc-400' : 'text-zinc-100'
                        }`}
                      >
                        {item.label}
                      </p>
                      <p className="text-[11px] text-zinc-500 mt-0.5 leading-relaxed">{item.detail}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Right: Local Supply Pickup Queue + Van Stock */}
            <div className="lg:col-span-6 space-y-6">
              <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-5 space-y-3.5">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                    <PackageCheck size={16} className="text-emerald-400" />
                    Sparks & Reno Material Pickup Queue
                  </h2>
                  <span className="text-[11px] text-zinc-500">Click status to update</span>
                </div>

                <div className="space-y-2.5">
                  {pickups.map((pk) => (
                    <div
                      key={pk.id}
                      className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80 flex items-start justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-zinc-100">
                          {pk.supplier} <span className="text-zinc-500 font-normal">· {pk.location}</span>
                        </p>
                        <p className="text-xs text-zinc-300 mt-1">{pk.items}</p>
                        <p className="text-[11px] text-zinc-500 mt-1">{pk.assignedVan}</p>
                      </div>
                      <button
                        onClick={() => cyclePickupStatus(pk.id)}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-semibold shrink-0 transition-colors ${
                          pk.status === 'loaded'
                            ? 'bg-emerald-500/15 text-emerald-300'
                            : pk.status === 'ready'
                            ? 'bg-amber-500/15 text-amber-300'
                            : 'bg-zinc-800 text-zinc-400'
                        }`}
                      >
                        {pk.status === 'loaded'
                          ? 'Loaded on Van'
                          : pk.status === 'ready'
                          ? 'Ready for Pickup'
                          : 'Order Pending'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Service Van Stock Readiness */}
              <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-5 space-y-3.5">
                <h2 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                  <Truck size={16} className="text-emerald-400" />
                  Service Van Stock Readiness
                </h2>
                <div className="space-y-3">
                  {VAN_STOCK.map((v) => (
                    <div key={v.van} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-zinc-200">
                          {v.van} <span className="text-zinc-500">· {v.lead}</span>
                        </span>
                        <span className="font-mono tabular-nums text-emerald-400">{v.readiness}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${v.readiness}%` }} />
                      </div>
                      <p className="text-[11px] text-zinc-500">{v.missing}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExecutionModule;
