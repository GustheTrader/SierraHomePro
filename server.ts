import 'dotenv/config';
import express from 'express';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  createContact,
  createSubscription,
  deleteContact,
  getOverviewData,
  updateContact,
  updateMaintenancePlan,
  updateSubscription,
  updateVisit
} from './server/supabaseStore.js';
import {
  createClientPreviewLink,
  listClientPreviewLinks,
  resolveClientPreviewLink,
  revokeClientPreviewLink,
  setClientPreviewEnabled
} from './server/clientPreviewStore.js';
import type { LeadStage, PropertyType, ServiceArea } from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ALLOWED_SERVICE_AREAS: ServiceArea[] = ['Sparks, NV', 'Reno, NV', 'Carson City, NV', 'Lake Tahoe, NV'];
const ALLOWED_PROPERTY_TYPES: PropertyType[] = [
  'Single-Family Home',
  'Townhome / Condo',
  'Mountain Cabin',
  'Senior Residence',
  'Rental Property'
];
const ALLOWED_LEAD_STAGES: LeadStage[] = [
  'New Inquiry',
  'Estimate Sent',
  'Active Client',
  'Plan Member',
  'Inactive'
];
const ALLOWED_SUB_STATUSES = ['active', 'paused', 'past_due', 'cancelled'] as const;
const ALLOWED_VISIT_STATUSES = ['scheduled', 'in-progress', 'completed', 'rescheduled'] as const;

function sanitizeText(val: unknown, maxLen: number): string {
  if (typeof val !== 'string') return '';
  return val.trim().slice(0, maxLen);
}

export function createApp() {
  const app = express();
  app.use(express.json({ limit: '256kb' }));

  // CRM & Maintenance Subscriptions overview
  app.get('/api/crm/overview', async (_req, res) => {
    try {
      const data = await getOverviewData();
      res.json(data);
    } catch {
      res.status(500).json({ error: 'Unable to load CRM and subscription data.' });
    }
  });

  // Create homeowner contact
  app.post('/api/crm/contacts', async (req, res) => {
    try {
      const fullName = sanitizeText(req.body?.fullName, 140);
      const email = sanitizeText(req.body?.email, 160).toLowerCase();
      const phone = sanitizeText(req.body?.phone, 40);
      const streetAddress = sanitizeText(req.body?.streetAddress, 200);
      const source = sanitizeText(req.body?.source, 80) || 'Website (sierrahomepros.com)';
      const notes = sanitizeText(req.body?.notes, 1000);
      const serviceArea = ALLOWED_SERVICE_AREAS.includes(req.body?.serviceArea)
        ? (req.body.serviceArea as ServiceArea)
        : 'Sparks, NV';
      const propertyType = ALLOWED_PROPERTY_TYPES.includes(req.body?.propertyType)
        ? (req.body.propertyType as PropertyType)
        : 'Single-Family Home';
      const leadStage = ALLOWED_LEAD_STAGES.includes(req.body?.leadStage)
        ? (req.body.leadStage as LeadStage)
        : 'New Inquiry';
      const lifetimeValue = Math.max(0, Number(req.body?.lifetimeValue) || 0);
      const tags = Array.isArray(req.body?.tags)
        ? req.body.tags.map((t: unknown) => sanitizeText(t, 40)).filter(Boolean).slice(0, 8)
        : [];

      if (fullName.length < 2 || !email.includes('@')) {
        return res.status(400).json({ error: 'Valid homeowner name and email are required.' });
      }

      const created = await createContact({
        fullName,
        email,
        phone,
        streetAddress,
        serviceArea,
        propertyType,
        leadStage,
        source,
        lifetimeValue,
        notes,
        tags
      });
      res.status(201).json(created);
    } catch {
      res.status(500).json({ error: 'Unable to create homeowner contact.' });
    }
  });

  // Update homeowner contact
  app.patch('/api/crm/contacts/:id', async (req, res) => {
    try {
      const id = sanitizeText(req.params.id, 64);
      if (!id) return res.status(400).json({ error: 'Invalid contact ID.' });

      const patch: Record<string, any> = {};
      if (req.body?.fullName !== undefined) patch.fullName = sanitizeText(req.body.fullName, 140);
      if (req.body?.email !== undefined) patch.email = sanitizeText(req.body.email, 160).toLowerCase();
      if (req.body?.phone !== undefined) patch.phone = sanitizeText(req.body.phone, 40);
      if (req.body?.streetAddress !== undefined) patch.streetAddress = sanitizeText(req.body.streetAddress, 200);
      if (req.body?.serviceArea !== undefined && ALLOWED_SERVICE_AREAS.includes(req.body.serviceArea)) {
        patch.serviceArea = req.body.serviceArea;
      }
      if (req.body?.propertyType !== undefined && ALLOWED_PROPERTY_TYPES.includes(req.body.propertyType)) {
        patch.propertyType = req.body.propertyType;
      }
      if (req.body?.leadStage !== undefined && ALLOWED_LEAD_STAGES.includes(req.body.leadStage)) {
        patch.leadStage = req.body.leadStage;
      }
      if (req.body?.notes !== undefined) patch.notes = sanitizeText(req.body.notes, 1000);
      if (req.body?.lifetimeValue !== undefined) {
        patch.lifetimeValue = Math.max(0, Number(req.body.lifetimeValue) || 0);
      }

      const updated = await updateContact(id, patch);
      if (!updated) return res.status(404).json({ error: 'Contact not found.' });
      res.json(updated);
    } catch {
      res.status(500).json({ error: 'Unable to update homeowner contact.' });
    }
  });

  // Delete homeowner contact
  app.delete('/api/crm/contacts/:id', async (req, res) => {
    try {
      const id = sanitizeText(req.params.id, 64);
      const removed = await deleteContact(id);
      if (!removed) return res.status(404).json({ error: 'Contact not found.' });
      res.json({ deleted: true });
    } catch {
      res.status(500).json({ error: 'Unable to remove homeowner contact.' });
    }
  });

  // Update sellable Maintenance Plan pricing / details
  app.patch('/api/plans/:id', async (req, res) => {
    try {
      const id = sanitizeText(req.params.id, 64);
      const patch: Record<string, any> = {};
      if (req.body?.name !== undefined) patch.name = sanitizeText(req.body.name, 100);
      if (req.body?.tagline !== undefined) patch.tagline = sanitizeText(req.body.tagline, 200);
      if (req.body?.monthlyPrice !== undefined) {
        const val = Number(req.body.monthlyPrice);
        if (!Number.isFinite(val) || val <= 0 || val > 5000) {
          return res.status(400).json({ error: 'Monthly price must be between $1 and $5,000.' });
        }
        patch.monthlyPrice = Math.round(val);
      }
      if (req.body?.annualPrice !== undefined) {
        const val = Number(req.body.annualPrice);
        if (!Number.isFinite(val) || val <= 0 || val > 50000) {
          return res.status(400).json({ error: 'Annual price must be between $1 and $50,000.' });
        }
        patch.annualPrice = Math.round(val);
      }
      if (req.body?.handymanDiscountPct !== undefined) {
        patch.handymanDiscountPct = Math.max(0, Math.min(50, Math.round(Number(req.body.handymanDiscountPct) || 0)));
      }
      if (req.body?.visitsPerYear !== undefined) {
        patch.visitsPerYear = Math.max(1, Math.min(12, Math.round(Number(req.body.visitsPerYear) || 2)));
      }
      if (Array.isArray(req.body?.features)) {
        patch.features = req.body.features.map((f: unknown) => sanitizeText(f, 160)).filter(Boolean).slice(0, 12);
      }

      const updated = await updateMaintenancePlan(id, patch);
      if (!updated) return res.status(404).json({ error: 'Maintenance plan not found.' });
      res.json(updated);
    } catch {
      res.status(500).json({ error: 'Unable to update maintenance plan.' });
    }
  });

  // Enroll homeowner in Maintenance Subscription Plan
  app.post('/api/subscriptions', async (req, res) => {
    try {
      const contactId = sanitizeText(req.body?.contactId, 64);
      const planId = sanitizeText(req.body?.planId, 64);
      const billingCycle = req.body?.billingCycle === 'annual' ? 'annual' : 'monthly';
      const assignedTech = sanitizeText(req.body?.assignedTech, 80) || 'Caleb Martinez';
      const nextVisitDate =
        sanitizeText(req.body?.nextVisitDate, 20) || new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);

      if (!contactId || !planId) {
        return res.status(400).json({ error: 'Homeowner and maintenance plan are required.' });
      }

      const result = await createSubscription({
        contactId,
        planId,
        billingCycle,
        assignedTech,
        nextVisitDate
      });
      res.status(201).json(result);
    } catch (err: any) {
      res.status(400).json({ error: err?.message || 'Unable to enroll homeowner.' });
    }
  });

  // Update subscription status / details
  app.patch('/api/subscriptions/:id', async (req, res) => {
    try {
      const id = sanitizeText(req.params.id, 64);
      const patch: Record<string, any> = {};
      if (req.body?.status && ALLOWED_SUB_STATUSES.includes(req.body.status)) {
        patch.status = req.body.status;
      }
      if (req.body?.billingCycle === 'monthly' || req.body?.billingCycle === 'annual') {
        patch.billingCycle = req.body.billingCycle;
      }
      if (req.body?.assignedTech !== undefined) {
        patch.assignedTech = sanitizeText(req.body.assignedTech, 80);
      }
      if (req.body?.nextVisitDate !== undefined) {
        patch.nextVisitDate = sanitizeText(req.body.nextVisitDate, 20);
      }
      if (typeof req.body?.autoRenew === 'boolean') {
        patch.autoRenew = req.body.autoRenew;
      }

      const updated = await updateSubscription(id, patch);
      if (!updated) return res.status(404).json({ error: 'Subscription not found.' });
      res.json(updated);
    } catch {
      res.status(500).json({ error: 'Unable to update subscription.' });
    }
  });

  // Update seasonal maintenance visit
  app.patch('/api/visits/:id', async (req, res) => {
    try {
      const id = sanitizeText(req.params.id, 64);
      const patch: Record<string, any> = {};
      if (req.body?.status && ALLOWED_VISIT_STATUSES.includes(req.body.status)) {
        patch.status = req.body.status;
      }
      if (Array.isArray(req.body?.checklist)) {
        patch.checklist = req.body.checklist.slice(0, 20).map((item: any) => ({
          label: sanitizeText(item?.label, 180),
          done: Boolean(item?.done)
        }));
      }
      if (req.body?.notes !== undefined) {
        patch.notes = sanitizeText(req.body.notes, 800);
      }
      if (req.body?.visitDate !== undefined) {
        patch.visitDate = sanitizeText(req.body.visitDate, 20);
      }
      if (req.body?.technician !== undefined) {
        patch.technician = sanitizeText(req.body.technician, 80);
      }

      const updated = await updateVisit(id, patch);
      if (!updated) return res.status(404).json({ error: 'Visit not found.' });
      res.json(updated);
    } catch {
      res.status(500).json({ error: 'Unable to update seasonal visit.' });
    }
  });

  // Read-only Self-Hosted Supabase SQL & Zo Computer guide bundle (strictly fixed file paths)
  app.get('/api/supabase/schema', async (_req, res) => {
    try {
      const [migrationSql, seedSql, setupGuide] = await Promise.all([
        fs.readFile(path.resolve(__dirname, 'supabase/migrations/001_sierra_crm_maintenance.sql'), 'utf8'),
        fs.readFile(path.resolve(__dirname, 'supabase/seed.sql'), 'utf8'),
        fs.readFile(path.resolve(__dirname, 'supabase/ZO_SELF_HOSTED_SETUP.md'), 'utf8')
      ]);
      res.json({ migrationSql, seedSql, setupGuide });
    } catch {
      res.status(500).json({ error: 'Unable to load Supabase migration files.' });
    }
  });

  // Client Preview Mode — list active temporary shareable links & toggle state
  app.get('/api/client-preview/links', (_req, res) => {
    res.json(listClientPreviewLinks());
  });

  // Client Preview Mode — toggle global sharing enabled/paused
  app.patch('/api/client-preview/config', (req, res) => {
    if (typeof req.body?.enabled !== 'boolean') {
      return res.status(400).json({ error: 'A boolean enabled flag is required.' });
    }
    const enabled = setClientPreviewEnabled(req.body.enabled);
    res.json({ enabled });
  });

  // Client Preview Mode — generate a temporary link with internal financial fields strictly stripped
  app.post('/api/client-preview/links', (req, res) => {
    const result = createClientPreviewLink({
      projectId: req.body?.projectId,
      projectName: req.body?.projectName,
      clientName: req.body?.clientName,
      serviceCategory: req.body?.serviceCategory,
      locationName: req.body?.locationName,
      status: req.body?.status,
      startDate: req.body?.startDate,
      endDate: req.body?.endDate,
      completion: req.body?.completion,
      assignedPM: req.body?.assignedPM,
      welcomeNote: req.body?.welcomeNote,
      expiresInHours: req.body?.expiresInHours,
      milestones: req.body?.milestones
    });

    if (result.error) {
      return res.status(400).json({ error: result.error });
    }
    res.status(201).json(result.summary);
  });

  // Client Preview Mode — immediately revoke a temporary shareable link
  app.delete('/api/client-preview/links/:token', (req, res) => {
    const token = sanitizeText(req.params.token, 80);
    const removed = revokeClientPreviewLink(token);
    if (!removed) {
      return res.status(404).json({ error: 'Preview link not found.' });
    }
    res.json({ revoked: true });
  });

  // Client Preview Mode — public read-only sanitized project view (zero internal financial data)
  app.get('/api/client-preview/view/:token', (req, res) => {
    const token = sanitizeText(req.params.token, 80);
    const resolved = resolveClientPreviewLink(token);

    if (resolved.status === 'disabled') {
      return res.status(403).json({ error: resolved.error, reason: 'disabled' });
    }
    if (resolved.status === 'expired') {
      return res.status(410).json({ error: resolved.error, reason: 'expired' });
    }
    if (resolved.status === 'not_found') {
      return res.status(404).json({ error: resolved.error, reason: 'not_found' });
    }

    res.setHeader('Cache-Control', 'no-store');
    return res.json(resolved.data);
  });

  return app;
}

async function startServer() {
  const app = createApp();

  // Mount Vite middleware in dev or serve static dist in production
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.use((_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  const port = Number(process.env.PORT) || 3000;
  app.listen(port, '0.0.0.0', () => {
    console.log(`Sierra Home Pros server listening on http://0.0.0.0:${port}`);
  });
}

// On Vercel, api/index.ts imports createApp() and Vercel handles requests itself.
if (!process.env.VERCEL) {
  startServer();
}
