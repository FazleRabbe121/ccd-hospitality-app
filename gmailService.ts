import { User } from 'firebase/auth';
import { db, auth, getCachedGoogleToken, signInWithGoogle, getCachedUserEmail, getCachedUserName } from './firebase';
import { collection, doc, setDoc, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { PreparedJobApplication } from '../types/jobApplication';

export interface GmailSendingRecord {
  id: string;
  timestamp: string;
  recipient: string;
  company?: string;
  position?: string;
  jobUrl?: string;
  subject: string;
  cvTitle: string;
  status: 'sent' | 'failed' | 'delivery_failed';
  deliveryStatus?: 'sent_accepted_by_gmail' | 'delivery_failed' | 'bounced';
  errorReason?: string;
  messageId?: string;
  threadId?: string;
  sourceAI?: string; // 'Gemini + OpenAI + Grok' | 'Manual'
  replyStatus?: 'none' | 'checked_no_reply' | 'reply_received' | 'bounced';
  replySnippet?: string;
  replyTimestamp?: string;
}

export interface SavedRecipient {
  id: string;
  name: string;
  email: string;
  category?: string;
}

const STORAGE_KEY_HISTORY = 'cv_email_sending_history_v1';
const STORAGE_KEY_SAVED_RECIPIENTS = 'cv_saved_recipients_v1';
const STORAGE_KEY_SAVED_DRAFT = 'cv_email_saved_draft_v1';
const STORAGE_KEY_AI_APPLICATIONS = 'cv_ai_prepared_applications_v1';

export interface SavedApplicationDraft {
  subject: string;
  coverLetter: string;
  selectedCvId: string;
}

export const DEFAULT_SAVED_RECIPIENTS: SavedRecipient[] = [
  { id: 'rec-1', name: 'Flamingo Paradise Beach Hotel — HR', email: 'hr@flamingohotel.com', category: 'Hotel' },
  { id: 'rec-2', name: "O'Neill's Irish Bar — Management", email: 'jobs@oneillsirishbar.com', category: 'Bar' },
  { id: 'rec-3', name: 'Lighthouse Beach Lounge — Recruitment', email: 'careers@lighthousebeach.com', category: 'Lounge' },
  { id: 'rec-4', name: 'The Westin Luxury Hotel — Talent Acquisition', email: 'recruitment@westinhotels.com', category: 'Luxury Hotel' },
];

export const DEFAULT_APPLICATION_DRAFT: SavedApplicationDraft = {
  subject: 'Bartender Position Application – Fazle Rabbi',
  coverLetter: `Dear Hiring Manager,

I am writing to express my interest in the Bartender position at your respected establishment. With over 6 years of experience in hospitality, I am confident in my ability to contribute to your team.

Please find my CV attached for your kind consideration.

Best regards,
Fazle Rabbi Boyati`,
  selectedCvId: '',
};

// ==========================================
// Local & Cloud Storage for Sending History
// ==========================================

export function loadLocalSendingHistory(): GmailSendingRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_HISTORY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn('Failed to load local sending history:', err);
  }
  // Initial demo items matching the screenshot reference
  return [
    {
      id: 'hist-1',
      timestamp: '25 Sep 2026, 14:32',
      recipient: 'hr@hotel1.com',
      subject: 'Bartender Position Application – Fazle Rabbi',
      cvTitle: 'Fazle Rabbi — Bartender CV',
      status: 'sent',
      messageId: 'gm-demo-01',
    },
    {
      id: 'hist-2',
      timestamp: '25 Sep 2026, 14:33',
      recipient: 'jobs@hotel2.com',
      subject: 'Bartender Position Application – Fazle Rabbi',
      cvTitle: 'Fazle Rabbi — Bartender CV',
      status: 'sent',
      messageId: 'gm-demo-02',
    },
    {
      id: 'hist-3',
      timestamp: '25 Sep 2026, 14:33',
      recipient: 'careers@hotel3.com',
      subject: 'Bartender Position Application – Fazle Rabbi',
      cvTitle: 'Fazle Rabbi — Bartender CV',
      status: 'sent',
      messageId: 'gm-demo-03',
    },
    {
      id: 'hist-4',
      timestamp: '25 Sep 2026, 14:34',
      recipient: 'hr@restaurant4.com',
      subject: 'Bartender Position Application – Fazle Rabbi',
      cvTitle: 'Fazle Rabbi — Bartender CV',
      status: 'sent',
      messageId: 'gm-demo-04',
    },
  ];
}

export function saveLocalSendingHistory(history: GmailSendingRecord[]) {
  try {
    localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(history));
    // Cloud sync if authenticated
    const currentUser = auth.currentUser;
    if (currentUser) {
      syncHistoryToCloud(currentUser.uid, history).catch(err =>
        console.warn('Deferred cloud sync for sending history:', err)
      );
    }
  } catch (err) {
    console.warn('Failed to save sending history:', err);
  }
}

async function syncHistoryToCloud(userId: string, history: GmailSendingRecord[]) {
  try {
    const historyRef = doc(db, 'users', userId, 'cv_metadata', 'email_sending_history');
    await setDoc(historyRef, { records: history, updatedAt: new Date().toISOString() }, { merge: true });
  } catch (err) {
    console.warn('Cloud sync error for email history:', err);
  }
}

// ==========================================
// Saved Recipients Management
// ==========================================

export function loadSavedRecipients(): SavedRecipient[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SAVED_RECIPIENTS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Failed to load saved recipients:', err);
  }
  return DEFAULT_SAVED_RECIPIENTS;
}

export function saveSavedRecipients(recipients: SavedRecipient[]) {
  try {
    localStorage.setItem(STORAGE_KEY_SAVED_RECIPIENTS, JSON.stringify(recipients));
  } catch (err) {
    console.warn('Failed to save saved recipients:', err);
  }
}

// ==========================================
// Saved Draft Application (Subject & Cover Letter)
// ==========================================

export function loadSavedApplicationDraft(): SavedApplicationDraft {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SAVED_DRAFT);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_APPLICATION_DRAFT, ...parsed };
    }
  } catch (err) {
    console.warn('Failed to load saved draft:', err);
  }
  return DEFAULT_APPLICATION_DRAFT;
}

export function saveApplicationDraft(draft: SavedApplicationDraft) {
  try {
    localStorage.setItem(STORAGE_KEY_SAVED_DRAFT, JSON.stringify(draft));
  } catch (err) {
    console.warn('Failed to save application draft:', err);
  }
}

// ==========================================
// RFC 2822 MIME & Base64URL Construction
// ==========================================

/**
 * Safely converts any UTF-8 string (including Unicode emojis, en-dashes, accents, non-Latin scripts)
 * into a standard Base64 string without triggering Latin-1 range errors in window.btoa().
 */
export function utf8ToBase64(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  const chunkSize = 32768;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

/**
 * Safely converts any UTF-8 string into Base64URL format (URL-safe, unpadded)
 * as required by the Gmail API.
 */
export function utf8ToBase64Url(str: string): string {
  return utf8ToBase64(str)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Encodes an email into RFC 2822 standard MIME format with optional PDF attachment,
 * then converts to Base64URL format required by the Gmail API.
 */
export function buildGmailRawMessage(params: {
  recipient: string;
  senderEmail?: string;
  senderName?: string;
  subject: string;
  bodyText: string;
  pdfBase64?: string;
  pdfFilename?: string;
}): string {
  const boundary = `----=_Part_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  
  // RFC 2047 encoded subject safely handles en-dashes (–), quotes, and special characters
  const encodedSubject = `=?UTF-8?B?${utf8ToBase64(params.subject)}?=`;

  let fromHeader = '';
  let replyToHeader = '';
  if (params.senderEmail) {
    if (params.senderName) {
      fromHeader = `From: =?UTF-8?B?${utf8ToBase64(params.senderName)}?= <${params.senderEmail}>`;
    } else {
      fromHeader = `From: <${params.senderEmail}>`;
    }
    // Ensures any reply from employer arrives directly in the user's primary Gmail inbox
    replyToHeader = `Reply-To: <${params.senderEmail}>`;
  }

  const headers = [
    `To: ${params.recipient}`,
    fromHeader,
    replyToHeader,
    `Subject: ${encodedSubject}`,
    `MIME-Version: 1.0`,
  ].filter(Boolean);

  let fullMime = '';

  if (params.pdfBase64) {
    headers.push(`Content-Type: multipart/mixed; boundary="${boundary}"\r\n`);

    const bodyPart = [
      `--${boundary}`,
      `Content-Type: text/plain; charset="UTF-8"`,
      `Content-Transfer-Encoding: base64`,
      ``,
      utf8ToBase64(params.bodyText),
      ``,
    ].join('\r\n');

    const cleanPdfBase64 = params.pdfBase64.replace(/\s+/g, '');
    const cleanFilename = params.pdfFilename
      ? params.pdfFilename.replace(/[^\w\.\-\s]/g, '_')
      : 'Fazle_Rabbi_CV.pdf';

    const attachmentPart = [
      `--${boundary}`,
      `Content-Type: application/pdf; name="${cleanFilename}"`,
      `Content-Description: ${cleanFilename}`,
      `Content-Disposition: attachment; filename="${cleanFilename}"`,
      `Content-Transfer-Encoding: base64`,
      ``,
      cleanPdfBase64,
      `--${boundary}--`,
    ].join('\r\n');

    fullMime = headers.join('\r\n') + '\r\n' + bodyPart + attachmentPart;
  } else {
    headers.push(`Content-Type: text/plain; charset="UTF-8"`);
    headers.push(`Content-Transfer-Encoding: base64\r\n`);
    headers.push(utf8ToBase64(params.bodyText));
    fullMime = headers.join('\r\n');
  }

  // Base64URL encode without padding
  return utf8ToBase64Url(fullMime);
}

// ==========================================
// Gmail API Sending Execution
// ==========================================

export async function sendJobApplicationViaGmail(params: {
  recipient: string;
  subject: string;
  bodyText: string;
  pdfBase64?: string;
  pdfFilename?: string;
  accessToken?: string;
}): Promise<{ success: boolean; messageId?: string; threadId?: string; error?: string }> {
  let token = params.accessToken || getCachedGoogleToken();

  if (!token) {
    throw new Error('NOT_AUTHENTICATED: Please connect your Gmail account to send applications.');
  }

  const currentUser = auth.currentUser;
  const userEmail = currentUser?.email || getCachedUserEmail();
  const userName = currentUser?.displayName || getCachedUserName();

  const rawMessage = buildGmailRawMessage({
    recipient: params.recipient,
    senderEmail: userEmail,
    senderName: userName,
    subject: params.subject,
    bodyText: params.bodyText,
    pdfBase64: params.pdfBase64,
    pdfFilename: params.pdfFilename,
  });

  const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      raw: rawMessage,
    }),
  });

  if (!response.ok) {
    let errorDetail = 'Unknown Gmail API error';
    try {
      const errJson = await response.json();
      errorDetail = errJson?.error?.message || response.statusText;
    } catch {
      errorDetail = response.statusText;
    }

    if (response.status === 401 || response.status === 403) {
      throw new Error(`AUTH_EXPIRED: Gmail authorization expired or permission denied. (${errorDetail})`);
    }

    const bounceRegex = /550|5\.1\.1|recipient address rejected|user unknown|address not found|mailbox unavailable|delivery failed|message rejected/i;
    if (bounceRegex.test(errorDetail)) {
      throw new Error(`DELIVERY_FAILED: ${errorDetail}`);
    }

    throw new Error(`Gmail API error (${response.status}): ${errorDetail}`);
  }

  const result = await response.json();
  return {
    success: true,
    messageId: result.id,
    threadId: result.threadId,
  };
}

// ==========================================
// Check Employer Replies & Delivery Bounces in Gmail
// ==========================================

export async function checkApplicationReplyInGmail(
  record: GmailSendingRecord,
  accessToken?: string
): Promise<{ hasReply: boolean; isBounce?: boolean; snippet?: string; date?: string }> {
  const token = accessToken || getCachedGoogleToken();
  if (!token) return { hasReply: false };

  try {
    const cleanEmail = (record?.recipient || '').trim();

    // 1. Check if a bounce notification exists for this recipient in Gmail
    if (cleanEmail) {
      const bounceQuery = encodeURIComponent(`from:mailer-daemon ${cleanEmail}`);
      const bounceRes = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${bounceQuery}&maxResults=1`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (bounceRes.ok) {
        const bounceData = await bounceRes.json();
        if (Array.isArray(bounceData.messages) && bounceData.messages.length > 0) {
          const bMsgId = bounceData.messages[0].id;
          const bDetailRes = await fetch(
            `https://gmail.googleapis.com/gmail/v1/users/me/messages/${bMsgId}?format=metadata`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          if (bDetailRes.ok) {
            const bMsg = await bDetailRes.json();
            return {
              hasReply: false,
              isBounce: true,
              snippet: bMsg.snippet || `Delivery failed: Address not found (${cleanEmail}). 550 5.1.1`,
              date: bMsg.internalDate ? new Date(parseInt(bMsg.internalDate)).toLocaleString('en-GB') : undefined,
            };
          }
        }
      }
    }

    // 2. Check threadId if available
    if (record.threadId) {
      const threadRes = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/threads/${record.threadId}?format=metadata`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (threadRes.ok) {
        const threadData = await threadRes.json();
        if (Array.isArray(threadData.messages) && threadData.messages.length > 1) {
          const incoming = threadData.messages[threadData.messages.length - 1];
          const incomingSnippet = incoming.snippet || '';
          const isBounce = /550|5\.1\.1|delivery status notification|address not found|user unknown|mailbox unavailable/i.test(incomingSnippet);
          if (isBounce) {
            return {
              hasReply: false,
              isBounce: true,
              snippet: incomingSnippet,
              date: incoming.internalDate ? new Date(parseInt(incoming.internalDate)).toLocaleString('en-GB') : undefined,
            };
          }

          return {
            hasReply: true,
            snippet: incomingSnippet || 'Employer replied to your application in Gmail.',
            date: incoming.internalDate ? new Date(parseInt(incoming.internalDate)).toLocaleString('en-GB') : undefined,
          };
        }
      }
    }

    // 3. Check incoming messages from this recipient
    if (cleanEmail) {
      const queryStr = encodeURIComponent(`from:${cleanEmail}`);
      const searchRes = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${queryStr}&maxResults=2`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (searchRes.ok) {
        const searchData = await searchRes.json();
        if (Array.isArray(searchData.messages) && searchData.messages.length > 0) {
          const firstMsgId = searchData.messages[0].id;
          const msgDetailRes = await fetch(
            `https://gmail.googleapis.com/gmail/v1/users/me/messages/${firstMsgId}?format=metadata`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          if (msgDetailRes.ok) {
            const msgDetail = await msgDetailRes.json();
            return {
              hasReply: true,
              snippet: msgDetail.snippet || 'Reply received from employer.',
              date: msgDetail.internalDate ? new Date(parseInt(msgDetail.internalDate)).toLocaleString('en-GB') : undefined,
            };
          }
        }
      }
    }
  } catch (err) {
    console.warn('Error checking Gmail for replies/bounces:', err);
  }

  return { hasReply: false };
}

// ==========================================
// AI-Prepared Applications Storage
// ==========================================

export function loadSavedPreparedApplications(): PreparedJobApplication[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_AI_APPLICATIONS);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn('Failed to load prepared AI applications:', err);
  }
  return [];
}

export function saveSavedPreparedApplications(apps: PreparedJobApplication[]) {
  try {
    localStorage.setItem(STORAGE_KEY_AI_APPLICATIONS, JSON.stringify(apps));
    const currentUser = auth.currentUser;
    if (currentUser) {
      const docRef = doc(db, 'users', currentUser.uid, 'cv_metadata', 'ai_prepared_applications');
      setDoc(docRef, { applications: apps, updatedAt: new Date().toISOString() }, { merge: true }).catch(err =>
        console.warn('Cloud sync error for AI applications:', err)
      );
    }
  } catch (err) {
    console.warn('Failed to save prepared applications:', err);
  }
}
