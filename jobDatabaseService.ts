import { PreparedJobApplication } from '../types/jobApplication';

export const APPLIED_JOB_COOLDOWN_MS = 10 * 24 * 60 * 60 * 1000; // 10 Days in milliseconds

export interface AppliedJobRecord {
  jobId: string;
  company: string;
  position: string;
  jobUrl: string;
  recipientEmail: string;
  applicationDate: string; // Human / ISO date string
  appliedTimestamp: number; // Epoch timestamp (ms)
  gmailMessageId?: string;
  applicationStatus: string;
  market: 'cyprus' | 'europe';
}

const STORAGE_KEY_APPLIED = 'ccd_applied_jobs_history_v2';
const STORAGE_KEY_JOBS_DB = 'ccd_persistent_job_database_v2';
const STORAGE_KEY_ACTIVE_MARKET = 'ccd_selected_job_market_v2';

// ----------------------------------------------------
// Applied Jobs Tracking (10-Day Rule Persistence)
// ----------------------------------------------------

export function loadAppliedJobRecords(): AppliedJobRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_APPLIED);
    if (!raw) return [];
    const list: AppliedJobRecord[] = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch (err) {
    console.warn('Failed to load applied jobs history:', err);
    return [];
  }
}

export function saveAppliedJobRecords(records: AppliedJobRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_APPLIED, JSON.stringify(records));
  } catch (err) {
    console.warn('Failed to save applied jobs history:', err);
  }
}

/**
 * Record a newly sent application into the 10-day hide database
 */
export function recordAppliedJob(params: {
  job: PreparedJobApplication;
  gmailMessageId?: string;
  status?: string;
}): AppliedJobRecord {
  const existing = loadAppliedJobRecords();
  const now = Date.now();
  const dateStr = new Date().toISOString();

  const market: 'cyprus' | 'europe' =
    params.job.market ||
    (params.job.location?.toLowerCase().includes('cyprus') ? 'cyprus' : 'europe');

  const newRecord: AppliedJobRecord = {
    jobId: params.job.id,
    company: params.job.company.trim(),
    position: params.job.position.trim(),
    jobUrl: (params.job.jobUrl || params.job.sourceUrl || '').trim(),
    recipientEmail: (params.job.recipientEmail || '').trim().toLowerCase(),
    applicationDate: dateStr,
    appliedTimestamp: now,
    gmailMessageId: params.gmailMessageId,
    applicationStatus: params.status || 'sent',
    market,
  };

  // Prepend new record, keeping older records for history
  const filtered = existing.filter(r => r.jobId !== params.job.id);
  const updated = [newRecord, ...filtered];
  saveAppliedJobRecords(updated);

  return newRecord;
}

/**
 * Check if a job matches any record applied within the last 10 days
 */
export function isJobAppliedWithin10Days(
  job: Partial<PreparedJobApplication>,
  appliedRecords?: AppliedJobRecord[]
): { isApplied: boolean; remainingDays?: number; record?: AppliedJobRecord } {
  const records = appliedRecords || loadAppliedJobRecords();
  const now = Date.now();

  const targetId = (job.id || '').trim();
  const targetEmail = (job.recipientEmail || '').trim().toLowerCase();
  const targetUrl = (job.jobUrl || job.sourceUrl || '').trim().toLowerCase();
  const targetCompany = (job.company || '').trim().toLowerCase();
  const targetPosition = (job.position || '').trim().toLowerCase();

  for (const record of records) {
    const elapsed = now - record.appliedTimestamp;
    if (elapsed < APPLIED_JOB_COOLDOWN_MS) {
      const matchId = targetId && record.jobId === targetId;
      const matchEmail = targetEmail && record.recipientEmail === targetEmail;
      const matchUrl = targetUrl && record.jobUrl && record.jobUrl.toLowerCase() === targetUrl;
      const matchRole =
        targetCompany &&
        targetPosition &&
        record.company.toLowerCase() === targetCompany &&
        record.position.toLowerCase() === targetPosition;

      if (matchId || matchEmail || matchUrl || matchRole) {
        const remainingMs = APPLIED_JOB_COOLDOWN_MS - elapsed;
        const remainingDays = Math.max(1, Math.ceil(remainingMs / (24 * 60 * 60 * 1000)));
        return { isApplied: true, remainingDays, record };
      }
    }
  }

  return { isApplied: false };
}

// ----------------------------------------------------
// Persistent Job Database Storage
// ----------------------------------------------------

export function loadPersistentJobDatabase(): PreparedJobApplication[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_JOBS_DB);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn('Failed to load persistent job database:', err);
    return [];
  }
}

export function savePersistentJobDatabase(jobs: PreparedJobApplication[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_JOBS_DB, JSON.stringify(jobs));
  } catch (err) {
    console.warn('Failed to save persistent job database:', err);
  }
}

// ----------------------------------------------------
// Active Market Preference Persistence
// ----------------------------------------------------

export function loadSelectedMarket(): 'cyprus' | 'europe' {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_ACTIVE_MARKET);
    if (saved === 'cyprus' || saved === 'europe') {
      return saved;
    }
  } catch {
    // fallback
  }
  return 'cyprus'; // Default to Cyprus as candidate is located in Limassol Marina, Cyprus
}

export function saveSelectedMarket(market: 'cyprus' | 'europe'): void {
  try {
    localStorage.setItem(STORAGE_KEY_ACTIVE_MARKET, market);
  } catch (err) {
    console.warn('Failed to save selected market preference:', err);
  }
}

// ----------------------------------------------------
// Smart Job Deduplication & Priority Merge
// ----------------------------------------------------

/**
 * Filter out jobs that are hidden by the 10-day applied job rule
 */
export function filterVisibleJobsForMarket(
  jobs: PreparedJobApplication[],
  market: 'cyprus' | 'europe',
  appliedRecords?: AppliedJobRecord[]
): PreparedJobApplication[] {
  const records = appliedRecords || loadAppliedJobRecords();

  return jobs.filter(job => {
    // Market isolation check
    const isCyprusJob =
      job.market === 'cyprus' ||
      job.location?.toLowerCase().includes('cyprus') ||
      job.country?.toLowerCase().includes('cyprus');

    if (market === 'cyprus' && !isCyprusJob) {
      return false; // Never mix non-Cyprus jobs into Cyprus market
    }
    if (market === 'europe' && isCyprusJob) {
      // In Europe market, you can choose to include or focus on other European countries
    }

    // 10-Day Applied Hide Rule Check
    const { isApplied } = isJobAppliedWithin10Days(job, records);
    if (isApplied) {
      return false; // HIDE FOR 10 DAYS
    }

    return true;
  });
}

/**
 * Merge fresh jobs with persistent database:
 * - Assigns deterministic identifiers
 * - Filters out 10-day applied jobs
 * - Prioritizes new vacancies at top
 * - Preserves status for already verified/reviewed jobs
 */
export function mergeFreshJobsIntoDatabase(
  existingJobs: PreparedJobApplication[],
  freshJobs: PreparedJobApplication[],
  market: 'cyprus' | 'europe'
): { merged: PreparedJobApplication[]; newCount: number } {
  const appliedRecords = loadAppliedJobRecords();
  const existingMap = new Map<string, PreparedJobApplication>();

  for (const job of existingJobs) {
    const key = makeJobKey(job);
    existingMap.set(key, job);
  }

  let newCount = 0;
  const processedFresh: PreparedJobApplication[] = [];

  for (const fresh of freshJobs) {
    // Enforce market tag
    fresh.market = market;
    const key = makeJobKey(fresh);

    // If job was applied within last 10 days, do NOT display
    const { isApplied } = isJobAppliedWithin10Days(fresh, appliedRecords);
    if (isApplied) {
      continue;
    }

    if (existingMap.has(key)) {
      // Retain existing state (approval, user edits, notes)
      const existing = existingMap.get(key)!;
      processedFresh.push({
        ...fresh,
        ...existing,
        // Update freshness timestamps
        lastSeenAt: Date.now(),
      });
      existingMap.delete(key);
    } else {
      // Genuinely fresh vacancy
      newCount++;
      processedFresh.push({
        ...fresh,
        isNewVacancy: true,
        firstDiscoveredAt: Date.now(),
        lastSeenAt: Date.now(),
        status: fresh.status || 'pending_approval',
      });
    }
  }

  // Append remaining existing jobs that weren't in this fresh batch,
  // excluding any that were applied within 10 days
  const remainingExisting: PreparedJobApplication[] = [];
  for (const remaining of existingMap.values()) {
    const { isApplied } = isJobAppliedWithin10Days(remaining, appliedRecords);
    if (!isApplied) {
      remainingExisting.push(remaining);
    }
  }

  const merged = [...processedFresh, ...remainingExisting];
  savePersistentJobDatabase(merged);

  return { merged, newCount };
}

export function makeJobKey(job: Partial<PreparedJobApplication>): string {
  if (job.id && job.id.startsWith('job-db-')) {
    return job.id;
  }
  const comp = (job.company || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const pos = (job.position || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const loc = (job.location || job.city || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  return `${comp}_${pos}_${loc}`;
}
