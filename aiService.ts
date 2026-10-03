import { MonthlyStatsPayload } from '../types';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export async function askAIAssistant(
  messages: ChatMessage[],
  contextSummary?: {
    currentStreakDays: number;
    habitName: string;
    monthlyIncome: number;
    monthlyExpenses: number;
    monthlySavings: number;
    familyMoneyTotal: number;
    currency: string;
  }
): Promise<string> {
  const response = await fetch('/api/ai/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages,
      context: contextSummary,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `AI Assistant server error (${response.status})`);
  }

  const data = await response.json();
  return data.reply;
}

export async function generateMonthlyReport(
  payload: MonthlyStatsPayload,
  currency: string
): Promise<string> {
  const response = await fetch('/api/ai/report', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      stats: payload,
      currency,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `Report generation failed (${response.status})`);
  }

  const data = await response.json();
  return data.report;
}

// ========================================================
// 3-AI Automated Job Application Services
// 1. Gemini: Live European hospitality job search via Google Search grounding
// 2. OpenAI: Verification, organization & duplicate checking
// 3. Grok: Consensus cross-validation
// ========================================================

export async function searchJobsWithGemini(
  roles?: string[],
  locations?: string[]
): Promise<any[]> {
  const response = await fetch('/api/ai/jobs/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ roles, locations }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `Gemini Job Search failed (${response.status})`);
  }
  const data = await response.json();
  return data.jobs || [];
}

export async function verifyJobsWithOpenAI(
  jobs: any[],
  existingEmails: string[] = []
): Promise<any[]> {
  const response = await fetch('/api/ai/jobs/verify-openai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jobs, existingEmails }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `OpenAI Verification failed (${response.status})`);
  }
  const data = await response.json();
  return data.verifiedJobs || [];
}

export async function verifyJobsWithGrok(jobs: any[]): Promise<any[]> {
  const response = await fetch('/api/ai/jobs/verify-grok', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jobs }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `Grok Verification failed (${response.status})`);
  }
  const data = await response.json();
  return data.verifiedJobs || [];
}

export async function runThreeAIPipeline(params: {
  roles?: string[];
  locations?: string[];
  existingEmails?: string[];
  applicantName?: string;
  applicantEmail?: string;
  applicantPhone?: string;
  selectedCvId?: string;
  selectedCvTitle?: string;
}): Promise<any[]> {
  const response = await fetch('/api/ai/jobs/pipeline', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `3-AI Pipeline failed (${response.status})`);
  }
  const data = await response.json();
  return data.applications || [];
}
