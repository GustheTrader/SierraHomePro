import React, { useState, useMemo } from 'react';
import { jsPDF } from 'jspdf';
import {
  Download,
  CheckCircle2,
  ShieldCheck,
  CheckSquare,
  Square
} from 'lucide-react';
import { ConstructionProject } from '../types';
import { COMPANY_INFO } from '../constants';

interface PDFReportGeneratorProps {
  projects: ConstructionProject[];
}

const formatUSD = (v: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v);

const PDFReportGenerator: React.FC<PDFReportGeneratorProps> = ({ projects }) => {
  const activeProjects = useMemo(() => projects.filter((p) => !p.isArchived), [projects]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>(activeProjects[0]?.id || 'p1');
  const [reportType, setReportType] = useState<'estimate' | 'completion' | 'maintenance'>('estimate');
  const [includeSections, setIncludeSections] = useState({
    writtenPricing: true,
    cleanHomeGuarantee: true,
    scopeNotes: true,
    maintenanceTips: true
  });
  const [customNote, setCustomNote] = useState(
    'All materials and labor are covered under our upfront written estimate. Any additional repairs discovered on-site require homeowner approval before work begins.'
  );
  const [lastExported, setLastExported] = useState<string | null>(null);

  const selectedProject = useMemo(
    () => activeProjects.find((p) => p.id === selectedProjectId) || activeProjects[0],
    [activeProjects, selectedProjectId]
  );

  const handleGeneratePDF = () => {
    if (!selectedProject) return;
    const doc = new jsPDF({ unit: 'pt', format: 'letter' });
    const pageW = doc.internal.pageSize.getWidth();
    const margin = 48;
    let y = 52;

    // Sierra Deep Navy + Copper split brand accent bar
    doc.setFillColor(19, 44, 71);
    doc.rect(0, 0, pageW * 0.72, 10, 'F');
    doc.setFillColor(185, 102, 38);
    doc.rect(pageW * 0.72, 0, pageW * 0.28, 10, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(19, 44, 71);
    doc.text('SIERRA HOME PROS', margin, y);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(96, 114, 134);
    doc.text(
      `${COMPANY_INFO.headquarters}  ·  ${COMPANY_INFO.phone}  ·  ${COMPANY_INFO.email}  ·  sierrahomepros.com`,
      margin,
      y + 16
    );

    const docLabel =
      reportType === 'estimate'
        ? 'UPFRONT WRITTEN ESTIMATE'
        : reportType === 'completion'
        ? 'HOME SERVICE COMPLETION SUMMARY'
        : 'SEASONAL HOME MAINTENANCE REPORT';

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(185, 102, 38);
    doc.text(docLabel, pageW - margin, y, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(96, 114, 134);
    doc.text(`Issued: ${new Date().toLocaleDateString('en-US')}`, pageW - margin, y + 16, { align: 'right' });

    y += 38;
    doc.setDrawColor(226, 220, 210);
    doc.line(margin, y, pageW - margin, y);
    y += 26;

    // Job & Homeowner Block
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(19, 44, 71);
    doc.text(selectedProject.name, margin, y);
    y += 18;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10.5);
    doc.setTextColor(70, 91, 114);
    doc.text(`Homeowner: ${selectedProject.client}`, margin, y);
    y += 15;
    doc.text(
      `Service Category: ${selectedProject.serviceCategory || 'Handyman Repair'}   |   Area: ${
        selectedProject.locationName || 'Reno–Sparks, NV'
      }`,
      margin,
      y
    );
    y += 15;
    doc.text(
      `Scheduled Window: ${selectedProject.startDate} through ${selectedProject.endDate}   |   Progress: ${selectedProject.completion}%`,
      margin,
      y
    );
    y += 28;

    // Written Pricing Table
    if (includeSections.writtenPricing) {
      doc.setFillColor(246, 244, 239);
      doc.roundedRect(margin, y, pageW - margin * 2, 76, 6, 6, 'F');
      doc.setDrawColor(226, 220, 210);
      doc.roundedRect(margin, y, pageW - margin * 2, 76, 6, 6, 'S');

      const materialsEst = Math.round(selectedProject.budget * 0.38);
      const laborEst = selectedProject.budget - materialsEst;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(185, 102, 38);
      doc.text('TRANSPARENT WRITTEN ESTIMATE BREAKDOWN', margin + 16, y + 22);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(41, 62, 86);
      doc.text(`Materials, Hardware & Local Delivery: ${formatUSD(materialsEst)}`, margin + 16, y + 42);
      doc.text(`Skilled Technician Labor & Setup: ${formatUSD(laborEst)}`, margin + 16, y + 58);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(15);
      doc.setTextColor(19, 44, 71);
      doc.text(`Total: ${formatUSD(selectedProject.budget)}`, pageW - margin - 16, y + 48, { align: 'right' });

      y += 100;
    }

    // Scope Notes
    if (includeSections.scopeNotes) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(19, 44, 71);
      doc.text('Scope & Homeowner Notes', margin, y);
      y += 16;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(70, 91, 114);
      const wrappedNote = doc.splitTextToSize(customNote, pageW - margin * 2);
      doc.text(wrappedNote, margin, y, { lineHeightFactor: 1.4 });
      y += wrappedNote.length * 14 + 20;
    }

    // Clean-Home Guarantee
    if (includeSections.cleanHomeGuarantee) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(19, 44, 71);
      doc.text('Sierra Home Pros Clean-Home & Craftsmanship Promise', margin, y);
      y += 16;

      const bullets = [
        '• Upfront written estimate locked before any work starts — zero surprise hourly overages.',
        '• Protective floor runners, boot covers, and dust containment used throughout your home.',
        '• ADA & senior-safety installations are anchored into solid framing or rated stainless anchors.',
        '• Final technician walk-through with before/after photos and local Reno–Sparks warranty support.'
      ];
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor(70, 91, 114);
      bullets.forEach((b) => {
        const lines = doc.splitTextToSize(b, pageW - margin * 2);
        doc.text(lines, margin, y, { lineHeightFactor: 1.4 });
        y += lines.length * 14 + 4;
      });
      y += 14;
    }

    if (includeSections.maintenanceTips) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(19, 44, 71);
      doc.text('Northern Nevada Seasonal Care Reminder', margin, y);
      y += 16;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor(70, 91, 114);
      const tipText =
        'Reno–Sparks, Carson City, and Lake Tahoe freeze-thaw cycles can stress exterior caulk, hose bibs, and cedar trim. Ask about our recurring Sierra Home Pros Maintenance Plan for spring and winter preventive visits.';
      const wrappedTip = doc.splitTextToSize(tipText, pageW - margin * 2);
      doc.text(wrappedTip, margin, y, { lineHeightFactor: 1.4 });
    }

    // Footer
    doc.setFontSize(8.5);
    doc.setTextColor(120, 134, 150);
    doc.text(
      `Sierra Home Pros LLC · Serving Reno–Sparks, Carson City & Lake Tahoe · Call/Text ${COMPANY_INFO.phone}`,
      pageW / 2,
      760,
      { align: 'center' }
    );

    const filename = `SierraHomePros_${reportType}_${selectedProject.name
      .replace(/[^a-zA-Z0-9]+/g, '_')
      .slice(0, 28)}.pdf`;
    doc.save(filename);
    setLastExported(`${filename} (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`);
  };

  const toggleSection = (key: keyof typeof includeSections) => {
    setIncludeSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-zinc-500 mb-1">
            <span>Sierra Home Pros</span>
            <span>·</span>
            <span>Homeowner Written Estimates & Service Walk-Through Packets</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100">Client Reports & Written Estimates</h1>
        </div>
        <button
          onClick={handleGeneratePDF}
          disabled={!selectedProject}
          className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white px-5 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2 self-start md:self-auto"
        >
          <Download size={15} /> Download Branded PDF
        </button>
      </div>

      {lastExported && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 px-4 py-2.5 rounded-lg text-xs flex items-center gap-2">
          <CheckCircle2 size={14} />
          Exported PDF: <span className="font-mono">{lastExported}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Configuration */}
        <div className="lg:col-span-5 bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-5 space-y-5">
          <div>
            <label className="text-xs font-semibold text-zinc-300 block mb-2">1. Select Residential Job</label>
            <select
              value={selectedProject?.id || ''}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2.5 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500"
            >
              {activeProjects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({formatUSD(p.budget)})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-300 block mb-2">2. Document Format</label>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { id: 'estimate', label: 'Written Estimate' },
                  { id: 'completion', label: 'Completion Summary' },
                  { id: 'maintenance', label: 'Maintenance Report' }
                ] as const
              ).map((t) => (
                <button
                  key={t.id}
                  onClick={() => setReportType(t.id)}
                  className={`px-2.5 py-2 rounded-lg text-xs font-medium border transition-colors ${
                    reportType === t.id
                      ? 'bg-emerald-600/20 border-emerald-500/50 text-emerald-300'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-300 block mb-2">3. Included Sections</label>
            <div className="space-y-2">
              {(
                [
                  { key: 'writtenPricing', label: 'Transparent Written Price Breakdown' },
                  { key: 'scopeNotes', label: 'Scope & Technician Notes' },
                  { key: 'cleanHomeGuarantee', label: 'Clean-Home & Craftsmanship Promise' },
                  { key: 'maintenanceTips', label: 'Northern NV Seasonal Care Reminder' }
                ] as const
              ).map((sec) => (
                <button
                  key={sec.key}
                  onClick={() => toggleSection(sec.key)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg bg-zinc-950/60 border border-zinc-800/80 text-xs text-zinc-200 hover:border-zinc-700"
                >
                  {includeSections[sec.key] ? (
                    <CheckSquare size={15} className="text-emerald-400 shrink-0" />
                  ) : (
                    <Square size={15} className="text-zinc-600 shrink-0" />
                  )}
                  <span>{sec.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-300 block mb-1.5">4. Homeowner Cover Note</label>
            <textarea
              rows={3}
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Right: Live Branded Paper Sheet Preview (always crisp paper white in both themes) */}
        {selectedProject && (
          <div className="lg:col-span-7 bg-white text-[#132C47] rounded-xl overflow-hidden shadow-xl border border-zinc-800">
            <div className="flex h-2.5 w-full">
              <div className="w-[72%] bg-[#132C47]" />
              <div className="w-[28%] bg-[#B96626]" />
            </div>
            <div className="p-8 space-y-6">
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#E2DCD2] pb-5">
                <div>
                  <img
                    src="/assets/aistudio/image_3d60c98b.png"
                    alt="Sierra Home Pros"
                    className="h-11 object-contain object-left mb-2"
                  />
                  <p className="text-xs text-[#607286]">
                    {COMPANY_INFO.headquarters} · {COMPANY_INFO.phone} · {COMPANY_INFO.email}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold uppercase tracking-wider text-[#B96626]">
                    {reportType === 'estimate'
                      ? 'Upfront Written Estimate'
                      : reportType === 'completion'
                      ? 'Service Completion Summary'
                      : 'Seasonal Maintenance Report'}
                  </p>
                  <p className="text-xs text-[#607286] mt-0.5 font-mono">
                    {new Date().toLocaleDateString('en-US')}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-xs uppercase tracking-wider text-[#607286] font-semibold">
                  {selectedProject.serviceCategory || 'Home Repair Service'} · {selectedProject.locationName}
                </p>
                <h3 className="text-lg font-bold text-[#132C47] mt-0.5">{selectedProject.name}</h3>
                <p className="text-sm text-[#43576D] mt-0.5">{selectedProject.client}</p>
                <p className="text-xs text-[#607286] mt-1 font-mono">
                  Visit Window: {selectedProject.startDate} to {selectedProject.endDate} · Progress:{' '}
                  {selectedProject.completion}%
                </p>
              </div>

              {includeSections.writtenPricing && (
                <div className="bg-[#F6F4EF] border border-[#E2DCD2] rounded-lg p-4 flex flex-wrap items-center justify-between gap-4">
                  <div className="space-y-1 text-xs text-[#43576D]">
                    <p className="font-bold text-[#B96626] uppercase tracking-wider text-[11px]">
                      Written Estimate Summary
                    </p>
                    <p>
                      Materials & Local Supply:{' '}
                      <span className="font-mono font-semibold text-[#132C47]">
                        {formatUSD(Math.round(selectedProject.budget * 0.38))}
                      </span>
                    </p>
                    <p>
                      Technician Labor & Setup:{' '}
                      <span className="font-mono font-semibold text-[#132C47]">
                        {formatUSD(selectedProject.budget - Math.round(selectedProject.budget * 0.38))}
                      </span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] uppercase tracking-wider text-[#607286]">Locked Written Price</p>
                    <p className="text-2xl font-extrabold font-mono tabular-nums text-[#132C47]">
                      {formatUSD(selectedProject.budget)}
                    </p>
                  </div>
                </div>
              )}

              {includeSections.scopeNotes && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#132C47] mb-1.5">
                    Scope & Homeowner Notes
                  </h4>
                  <p className="text-xs text-[#43576D] leading-relaxed">{customNote}</p>
                </div>
              )}

              {includeSections.cleanHomeGuarantee && (
                <div className="bg-[#FDF6EF] border border-[#F0CDAE] rounded-lg p-4 space-y-1.5">
                  <h4 className="text-xs font-bold text-[#132C47] flex items-center gap-1.5">
                    <ShieldCheck size={14} className="text-[#B96626]" />
                    Clean-Home & Upfront Pricing Guarantee
                  </h4>
                  <ul className="text-xs text-[#43576D] space-y-1 list-disc pl-4">
                    <li>Written estimate locked before work begins — no hidden hourly charges.</li>
                    <li>Boot covers, drop cloths, and full dust cleanup before technician departure.</li>
                    <li>Local Reno–Sparks, Carson City & Lake Tahoe workmanship warranty.</li>
                  </ul>
                </div>
              )}

              {includeSections.maintenanceTips && (
                <div className="border-t border-[#E2DCD2] pt-4 text-[11px] text-[#607286]">
                  Serving Reno–Sparks, Carson City & Lake Tahoe · Schedule seasonal preventive care anytime at{' '}
                  <span className="font-semibold text-[#132C47]">sierrahomepros.com</span> or{' '}
                  <span className="font-semibold text-[#132C47]">{COMPANY_INFO.phone}</span>.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PDFReportGenerator;
