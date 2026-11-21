import React, { useState, useMemo } from 'react';
import {
  Users,
  MapPin,
  Plus,
  Clock,
  Truck,
  CheckCircle2,
  X,
  Phone,
  Wrench,
  DollarSign
} from 'lucide-react';

interface TravelZone {
  id: string;
  label: string;
  cities: string;
  fuelAllowance: number;
}

const TRAVEL_ZONES: TravelZone[] = [
  { id: 'zone-1', label: 'Zone 1 · Local Metro', cities: 'Sparks & Central Reno', fuelAllowance: 0 },
  { id: 'zone-2', label: 'Zone 2 · Foothills', cities: 'South Reno, Damonte Ranch & Somersett', fuelAllowance: 15 },
  { id: 'zone-3', label: 'Zone 3 · Washoe Valley', cities: 'Carson City & Dayton', fuelAllowance: 25 },
  { id: 'zone-4', label: 'Zone 4 · Mountain', cities: 'Incline Village & Lake Tahoe Basin', fuelAllowance: 45 }
];

type TechRole = 'Lead Tech' | 'Smart-Home Installer' | 'Master Painter' | 'Maintenance Specialist';

interface TechnicianShift {
  id: string;
  name: string;
  role: TechRole;
  van: string;
  assignedJob: string;
  zoneId: string;
  hourlyRate: number;
  hours: [number, number, number, number, number]; // Mon-Fri
  status: 'on-route' | 'at-home' | 'available';
}

interface OnCallPro {
  id: string;
  name: string;
  role: TechRole;
  hourlyRate: number;
  specialty: string;
  phone: string;
}

const INITIAL_SHIFTS: TechnicianShift[] = [
  {
    id: 'tech-1',
    name: 'Caleb Martinez',
    role: 'Lead Tech',
    van: 'Van #1',
    assignedJob: 'Damonte Ranch Senior Safety & Carson Winterization',
    zoneId: 'zone-2',
    hourlyRate: 58,
    hours: [8, 8, 8, 8, 6],
    status: 'at-home'
  },
  {
    id: 'tech-2',
    name: 'Braden Vance',
    role: 'Master Painter',
    van: 'Van #2',
    assignedJob: 'Incline Village Exterior Trim & Somersett Drywall',
    zoneId: 'zone-4',
    hourlyRate: 54,
    hours: [8, 8, 6, 8, 8],
    status: 'on-route'
  },
  {
    id: 'tech-3',
    name: 'Elena Morales',
    role: 'Smart-Home Installer',
    van: 'Van #3',
    assignedJob: 'Wingfield Springs Smart-Home & Security Package',
    zoneId: 'zone-1',
    hourlyRate: 56,
    hours: [8, 8, 8, 6, 8],
    status: 'at-home'
  },
  {
    id: 'tech-4',
    name: 'Marcus Reid',
    role: 'Maintenance Specialist',
    van: 'Van #4',
    assignedJob: 'Carson City Winter Maintenance & Gutter Checks',
    zoneId: 'zone-3',
    hourlyRate: 46,
    hours: [8, 8, 8, 8, 8],
    status: 'on-route'
  }
];

const INITIAL_ON_CALL: OnCallPro[] = [
  {
    id: 'oc-1',
    name: 'Devon Brooks',
    role: 'Maintenance Specialist',
    hourlyRate: 44,
    specialty: 'Drywall patching, doors, trim & seasonal weatherstripping',
    phone: '(775) 555-0163'
  },
  {
    id: 'oc-2',
    name: 'Tessa Lin',
    role: 'Master Painter',
    hourlyRate: 52,
    specialty: 'Interior rooms, cabinet touch-ups & exterior cedar stain',
    phone: '(775) 555-0177'
  },
  {
    id: 'oc-3',
    name: 'Gabe Navarro',
    role: 'Smart-Home Installer',
    hourlyRate: 55,
    specialty: 'Video doorbells, smart thermostats, keypad locks & mesh Wi-Fi',
    phone: '(775) 555-0129'
  }
];

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

const formatUSD = (v: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v);

const RenoManpowerSchedule: React.FC = () => {
  const [shifts, setShifts] = useState<TechnicianShift[]>(INITIAL_SHIFTS);
  const [onCallPros, setOnCallPros] = useState<OnCallPro[]>(INITIAL_ON_CALL);
  const [zoneFilter, setZoneFilter] = useState<string>('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [newTech, setNewTech] = useState({
    name: '',
    role: 'Lead Tech' as TechRole,
    van: `Van #${INITIAL_SHIFTS.length + 1}`,
    assignedJob: 'Sparks & Reno Same-Day Handyman Route',
    zoneId: 'zone-1',
    hourlyRate: '50'
  });

  const visibleShifts = useMemo(() => {
    if (zoneFilter === 'ALL') return shifts;
    return shifts.filter((s) => s.zoneId === zoneFilter);
  }, [shifts, zoneFilter]);

  const handleAdjustHours = (techId: string, dayIdx: number, delta: number) => {
    setShifts((prev) =>
      prev.map((s) => {
        if (s.id !== techId) return s;
        const nextHours = [...s.hours] as [number, number, number, number, number];
        nextHours[dayIdx] = Math.max(0, Math.min(12, nextHours[dayIdx] + delta));
        return { ...s, hours: nextHours };
      })
    );
  };

  const handleDispatchOnCall = (pro: OnCallPro) => {
    const dispatched: TechnicianShift = {
      id: `tech-${Date.now()}`,
      name: pro.name,
      role: pro.role,
      van: `Van #${shifts.length + 1}`,
      assignedJob: `Dispatched: ${pro.specialty.split(',')[0]}`,
      zoneId: 'zone-1',
      hourlyRate: pro.hourlyRate,
      hours: [8, 8, 8, 8, 0],
      status: 'on-route'
    };
    setShifts((prev) => [...prev, dispatched]);
    setOnCallPros((prev) => prev.filter((p) => p.id !== pro.id));
  };

  const handleAddTech = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTech.name.trim()) return;
    const created: TechnicianShift = {
      id: `tech-${Date.now()}`,
      name: newTech.name.trim(),
      role: newTech.role,
      van: newTech.van.trim() || `Van #${shifts.length + 1}`,
      assignedJob: newTech.assignedJob.trim() || 'Reno–Sparks Residential Route',
      zoneId: newTech.zoneId,
      hourlyRate: Math.max(30, Number(newTech.hourlyRate) || 48),
      hours: [8, 8, 8, 8, 8],
      status: 'available'
    };
    setShifts((prev) => [...prev, created]);
    setIsAddModalOpen(false);
    setNewTech({
      name: '',
      role: 'Lead Tech',
      van: `Van #${shifts.length + 2}`,
      assignedJob: 'Sparks & Reno Same-Day Handyman Route',
      zoneId: 'zone-1',
      hourlyRate: '50'
    });
  };

  const weeklySummary = useMemo(() => {
    let totalHours = 0;
    let totalLaborCost = 0;
    let totalFuel = 0;
    visibleShifts.forEach((s) => {
      const hrs = s.hours.reduce((a, b) => a + b, 0);
      const zone = TRAVEL_ZONES.find((z) => z.id === s.zoneId);
      const activeDays = s.hours.filter((h) => h > 0).length;
      totalHours += hrs;
      totalLaborCost += hrs * s.hourlyRate;
      totalFuel += (zone?.fuelAllowance || 0) * activeDays;
    });
    return { totalHours, totalLaborCost, totalFuel };
  }, [visibleShifts]);

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-zinc-500 mb-1">
            <span>Sierra Home Pros</span>
            <span>·</span>
            <span>Reno–Sparks · Carson City · Lake Tahoe Van Roster</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100">Technician & Service Van Schedule</h1>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 self-start md:self-auto"
        >
          <Plus size={15} /> Add Service Van / Tech
        </button>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-4">
          <p className="text-xs text-zinc-500">Scheduled Weekly Field Hours</p>
          <p className="text-2xl font-bold font-mono tabular-nums text-zinc-100 mt-1">{weeklySummary.totalHours} hrs</p>
        </div>
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-4">
          <p className="text-xs text-zinc-500">Weekly Technician Payroll</p>
          <p className="text-2xl font-bold font-mono tabular-nums text-emerald-400 mt-1">
            {formatUSD(weeklySummary.totalLaborCost)}
          </p>
        </div>
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-4">
          <p className="text-xs text-zinc-500">Mountain & Valley Travel Stipends</p>
          <p className="text-2xl font-bold font-mono tabular-nums text-amber-400 mt-1">
            {formatUSD(weeklySummary.totalFuel)}
          </p>
        </div>
      </div>

      {/* Zone Filter Bar */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setZoneFilter('ALL')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
            zoneFilter === 'ALL'
              ? 'bg-emerald-600/20 border-emerald-500/40 text-emerald-300'
              : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-zinc-200'
          }`}
        >
          All Northern NV Zones
        </button>
        {TRAVEL_ZONES.map((z) => (
          <button
            key={z.id}
            onClick={() => setZoneFilter(z.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              zoneFilter === z.id
                ? 'bg-emerald-600/20 border-emerald-500/40 text-emerald-300'
                : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {z.label} ({z.fuelAllowance === 0 ? '$0' : `$${z.fuelAllowance}/day`})
          </button>
        ))}
      </div>

      {/* Interactive Weekly Schedule Table */}
      <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[780px]">
          <thead>
            <tr className="border-b border-zinc-800 text-[11px] uppercase tracking-wider text-zinc-500">
              <th className="py-3.5 px-4 font-semibold">Technician & Van</th>
              <th className="py-3.5 px-4 font-semibold">Route & Travel Zone</th>
              <th className="py-3.5 px-3 font-semibold text-right">Rate</th>
              {DAYS.map((d) => (
                <th key={d} className="py-3.5 px-2 font-semibold text-center">
                  {d}
                </th>
              ))}
              <th className="py-3.5 px-4 font-semibold text-right">Weekly Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/70 text-xs">
            {visibleShifts.map((tech) => {
              const zone = TRAVEL_ZONES.find((z) => z.id === tech.zoneId) || TRAVEL_ZONES[0];
              const totalHrs = tech.hours.reduce((a, b) => a + b, 0);
              const activeDays = tech.hours.filter((h) => h > 0).length;
              const weeklyCost = totalHrs * tech.hourlyRate + activeDays * zone.fuelAllowance;
              return (
                <tr key={tech.id} className="hover:bg-zinc-900/80 transition-colors">
                  <td className="py-3.5 px-4">
                    <p className="font-semibold text-zinc-100">{tech.name}</p>
                    <p className="text-[11px] text-zinc-400">
                      {tech.role} · <span className="text-emerald-400">{tech.van}</span>
                    </p>
                  </td>
                  <td className="py-3.5 px-4">
                    <p className="text-zinc-200 truncate max-w-[240px]">{tech.assignedJob}</p>
                    <p className="text-[11px] text-zinc-500 flex items-center gap-1 mt-0.5">
                      <MapPin size={11} className="text-emerald-400" />
                      {zone.cities}
                    </p>
                  </td>
                  <td className="py-3.5 px-3 text-right font-mono tabular-nums text-zinc-300">
                    ${tech.hourlyRate}/hr
                  </td>
                  {tech.hours.map((hrs, idx) => (
                    <td key={idx} className="py-3.5 px-1.5 text-center">
                      <div className="inline-flex items-center gap-1 bg-zinc-950 border border-zinc-800 rounded-md px-1.5 py-1">
                        <button
                          onClick={() => handleAdjustHours(tech.id, idx, -1)}
                          className="text-zinc-500 hover:text-zinc-200 px-0.5 font-mono"
                          title="Decrease hours"
                        >
                          -
                        </button>
                        <span className="font-mono tabular-nums w-5 text-center text-zinc-100">{hrs}</span>
                        <button
                          onClick={() => handleAdjustHours(tech.id, idx, 1)}
                          className="text-zinc-500 hover:text-emerald-400 px-0.5 font-mono"
                          title="Increase hours"
                        >
                          +
                        </button>
                      </div>
                    </td>
                  ))}
                  <td className="py-3.5 px-4 text-right font-mono tabular-nums">
                    <p className="font-semibold text-zinc-100">{formatUSD(weeklyCost)}</p>
                    <p className="text-[11px] text-zinc-500">{totalHrs} hrs</p>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* On-Call Northern NV Pros */}
      <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-zinc-100">On-Call Reno–Sparks Home Pros</h2>
            <p className="text-xs text-zinc-400">
              Dispatch vetted local technicians when same-day handyman or weather-window painting spikes.
            </p>
          </div>
          <span className="text-xs font-mono text-emerald-400">{onCallPros.length} ready</span>
        </div>

        {onCallPros.length === 0 ? (
          <p className="text-xs text-zinc-500 py-4 text-center">All on-call technicians are currently scheduled on active vans.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {onCallPros.map((pro) => (
              <div
                key={pro.id}
                className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800/80 flex flex-col justify-between gap-3"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-zinc-100">{pro.name}</p>
                    <span className="text-xs font-mono tabular-nums text-emerald-400">${pro.hourlyRate}/hr</span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-0.5">{pro.role}</p>
                  <p className="text-[11px] text-zinc-500 mt-2 leading-relaxed">{pro.specialty}</p>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-zinc-800/70">
                  <span className="text-[11px] text-zinc-400 flex items-center gap-1 font-mono">
                    <Phone size={11} className="text-emerald-400" />
                    {pro.phone}
                  </span>
                  <button
                    onClick={() => handleDispatchOnCall(pro)}
                    className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
                  >
                    Dispatch
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Service Van / Tech Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md">
            <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
              <h2 className="text-base font-bold text-zinc-100">Add Service Technician & Van</h2>
              <button onClick={() => setIsAddModalOpen(false)} className="text-zinc-500 hover:text-zinc-200">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleAddTech} className="p-5 space-y-4">
              <div>
                <label className="text-xs text-zinc-400 block mb-1">Technician Name</label>
                <input
                  required
                  type="text"
                  value={newTech.name}
                  onChange={(e) => setNewTech({ ...newTech, name: e.target.value })}
                  placeholder="e.g. Jordan Reyes"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Specialty Role</label>
                  <select
                    value={newTech.role}
                    onChange={(e) => setNewTech({ ...newTech, role: e.target.value as TechRole })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Lead Tech">Lead Tech</option>
                    <option value="Smart-Home Installer">Smart-Home Installer</option>
                    <option value="Master Painter">Master Painter</option>
                    <option value="Maintenance Specialist">Maintenance Specialist</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Hourly Rate (USD)</label>
                  <input
                    required
                    type="number"
                    min={30}
                    max={95}
                    value={newTech.hourlyRate}
                    onChange={(e) => setNewTech({ ...newTech, hourlyRate: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-zinc-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Service Van</label>
                  <input
                    type="text"
                    value={newTech.van}
                    onChange={(e) => setNewTech({ ...newTech, van: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Travel Zone</label>
                  <select
                    value={newTech.zoneId}
                    onChange={(e) => setNewTech({ ...newTech, zoneId: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500"
                  >
                    {TRAVEL_ZONES.map((z) => (
                      <option key={z.id} value={z.id}>
                        {z.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-zinc-400 block mb-1">Assigned Residential Route</label>
                <input
                  type="text"
                  value={newTech.assignedJob}
                  onChange={(e) => setNewTech({ ...newTech, assignedJob: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs text-zinc-400 hover:text-zinc-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-xs font-semibold"
                >
                  Add to Roster
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RenoManpowerSchedule;
