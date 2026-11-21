import crypto from 'node:crypto';
import type {
  ClientPreviewLinkSummary,
  ClientPreviewMilestone,
  ClientPreviewPayload
} from '../types.ts';

interface StoredClientPreviewRecord {
  payload: ClientPreviewPayload;
  expiresInHours: number;
  viewCount: number;
}

const TOKEN_PATTERN = /^[A-Za-z0-9_-]{16,64}$/;
const ALLOWED_STATUSES = ['planning', 'active', 'completed', 'on-hold'] as const;
const ALLOWED_TASK_STATUSES = ['todo', 'in-progress', 'done'] as const;
const ALLOWED_EXPIRY_HOURS = [24, 72, 168] as const;

const PM_TO_TECHNICIAN: Record<string, string> = {
  'pm-1': 'Caleb Martinez · Lead Service Tech',
  'pm-2': 'Braden Vance · Exterior & Paint Specialist',
  'pm-3': 'Elena Morales · Smart Home & Safety Tech'
};

let clientPreviewEnabled = true;
const previewLinks = new Map<string, StoredClientPreviewRecord>();

function cleanText(value: unknown, maxLength: number): string {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, maxLength);
}

export function isValidPreviewToken(token: string): boolean {
  return TOKEN_PATTERN.test(token);
}

export function getClientPreviewEnabled(): boolean {
  return clientPreviewEnabled;
}

export function setClientPreviewEnabled(enabled: boolean): boolean {
  clientPreviewEnabled = Boolean(enabled);
  return clientPreviewEnabled;
}

export function listClientPreviewLinks(): {
  enabled: boolean;
  links: ClientPreviewLinkSummary[];
} {
  const now = Date.now();
  const links: ClientPreviewLinkSummary[] = [];

  for (const record of previewLinks.values()) {
    const { payload } = record;
    links.push({
      token: payload.token,
      projectId: payload.projectId,
      projectName: payload.projectName,
      clientName: payload.clientName,
      serviceCategory: payload.serviceCategory,
      createdAt: payload.createdAt,
      expiresAt: payload.expiresAt,
      expiresInHours: record.expiresInHours,
      isExpired: new Date(payload.expiresAt).getTime() <= now,
      viewCount: record.viewCount,
      welcomeNote: payload.welcomeNote
    });
  }

  links.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return {
    enabled: clientPreviewEnabled,
    links
  };
}

export interface CreateClientPreviewInput {
  projectId: unknown;
  projectName: unknown;
  clientName: unknown;
  serviceCategory?: unknown;
  locationName?: unknown;
  status?: unknown;
  startDate?: unknown;
  endDate?: unknown;
  completion?: unknown;
  assignedPM?: unknown;
  welcomeNote?: unknown;
  expiresInHours?: unknown;
  milestones?: unknown;
}

/**
 * Creates a temporary client-facing preview snapshot using an explicit allowlist.
 * Internal financial fields (budget, spent, margins, cost breakdowns, risk levels, bids)
 * are deliberately excluded and never stored or returned to client links.
 */
export function createClientPreviewLink(
  input: CreateClientPreviewInput
): { summary: ClientPreviewLinkSummary; error?: string } {
  if (!clientPreviewEnabled) {
    return {
      summary: null as unknown as ClientPreviewLinkSummary,
      error: 'Client Preview mode is currently disabled. Enable it in Settings to generate links.'
    };
  }

  const projectId = cleanText(input.projectId, 64);
  const projectName = cleanText(input.projectName, 160);
  const clientName = cleanText(input.clientName, 160);

  if (!projectId || projectName.length < 2 || clientName.length < 2) {
    return {
      summary: null as unknown as ClientPreviewLinkSummary,
      error: 'A valid project must be selected to generate a client preview link.'
    };
  }

  const requestedHours = Number(input.expiresInHours);
  const expiresInHours = ALLOWED_EXPIRY_HOURS.includes(requestedHours as (typeof ALLOWED_EXPIRY_HOURS)[number])
    ? requestedHours
    : 72;

  const status = ALLOWED_STATUSES.includes(input.status as (typeof ALLOWED_STATUSES)[number])
    ? (input.status as ClientPreviewPayload['status'])
    : 'active';

  const completionRaw = Number(input.completion);
  const completion = Number.isFinite(completionRaw)
    ? Math.max(0, Math.min(100, Math.round(completionRaw)))
    : 0;

  const assignedKey = cleanText(input.assignedPM, 64);
  const leadTechnician =
    PM_TO_TECHNICIAN[assignedKey] ||
    (assignedKey && !assignedKey.startsWith('pm-') ? assignedKey : 'Sierra Home Pros Assigned Crew');

  const rawMilestones = Array.isArray(input.milestones) ? input.milestones.slice(0, 25) : [];
  const milestones: ClientPreviewMilestone[] = rawMilestones
    .map((m: any, idx: number) => ({
      id: cleanText(m?.id, 48) || `ms-${idx + 1}`,
      title: cleanText(m?.title, 180),
      assignee: cleanText(m?.assignee, 80) || 'Sierra Technician',
      start: cleanText(m?.start, 20),
      end: cleanText(m?.end, 20),
      status: ALLOWED_TASK_STATUSES.includes(m?.status) ? m.status : 'todo'
    }))
    .filter((m) => m.title.length > 0);

  const token = crypto.randomBytes(24).toString('base64url');
  const createdAtDate = new Date();
  const expiresAtDate = new Date(createdAtDate.getTime() + expiresInHours * 60 * 60 * 1000);

  const payload: ClientPreviewPayload = {
    token,
    projectId,
    projectName,
    clientName,
    serviceCategory: cleanText(input.serviceCategory, 80) || 'Home Repair',
    locationName: cleanText(input.locationName, 100) || 'Northern Nevada',
    status,
    startDate: cleanText(input.startDate, 20),
    endDate: cleanText(input.endDate, 20),
    completion,
    leadTechnician,
    welcomeNote: cleanText(input.welcomeNote, 320),
    milestones,
    estimateStatus: 'Approved Written Estimate on File',
    financialsMasked: true,
    createdAt: createdAtDate.toISOString(),
    expiresAt: expiresAtDate.toISOString()
  };

  previewLinks.set(token, {
    payload,
    expiresInHours,
    viewCount: 0
  });

  // Bound total stored links in memory to prevent unbounded growth
  if (previewLinks.size > 100) {
    const oldestKey = previewLinks.keys().next().value;
    if (oldestKey) previewLinks.delete(oldestKey);
  }

  return {
    summary: {
      token,
      projectId: payload.projectId,
      projectName: payload.projectName,
      clientName: payload.clientName,
      serviceCategory: payload.serviceCategory,
      createdAt: payload.createdAt,
      expiresAt: payload.expiresAt,
      expiresInHours,
      isExpired: false,
      viewCount: 0,
      welcomeNote: payload.welcomeNote
    }
  };
}

export function revokeClientPreviewLink(token: string): boolean {
  if (!isValidPreviewToken(token)) return false;
  return previewLinks.delete(token);
}

export type ResolvePreviewResult =
  | { status: 'ok'; data: ClientPreviewPayload }
  | { status: 'disabled'; error: string }
  | { status: 'expired'; error: string }
  | { status: 'not_found'; error: string };

export function resolveClientPreviewLink(token: string): ResolvePreviewResult {
  if (!isValidPreviewToken(token)) {
    return { status: 'not_found', error: 'This client preview link is invalid or has been revoked.' };
  }

  if (!clientPreviewEnabled) {
    return {
      status: 'disabled',
      error: 'Client Preview sharing is temporarily paused by Sierra Home Pros.'
    };
  }

  const record = previewLinks.get(token);
  if (!record) {
    return { status: 'not_found', error: 'This client preview link is invalid or has been revoked.' };
  }

  if (new Date(record.payload.expiresAt).getTime() <= Date.now()) {
    return {
      status: 'expired',
      error: 'This temporary project preview link has expired. Contact Sierra Home Pros for a fresh link.'
    };
  }

  record.viewCount += 1;

  return {
    status: 'ok',
    data: record.payload
  };
}
