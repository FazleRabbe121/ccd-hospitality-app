import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Send,
  Mail,
  User as UserIcon,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Plus,
  FileText,
  Eye,
  RefreshCw,
  ChevronDown,
  Paperclip,
  Check,
  Clock,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Bookmark,
  X,
  ArrowRight,
  HelpCircle,
  Download,
  Layers,
  Smartphone,
  UploadCloud,
  FileUp,
  Inbox,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { CVDocumentItem } from '../types/cv';
import { loadCVLibrary, getActiveCVId } from '../services/cvStorage';
import { CVDocument } from '../components/CVDocument';
import { generateCVPdfBase64 } from '../services/pdfExporter';
import {
  GmailSendingRecord,
  SavedRecipient,
  loadLocalSendingHistory,
  saveLocalSendingHistory,
  loadSavedRecipients,
  saveSavedRecipients,
  loadSavedApplicationDraft,
  saveApplicationDraft,
  sendJobApplicationViaGmail,
  loadSavedPreparedApplications,
  saveSavedPreparedApplications,
  checkApplicationReplyInGmail,
} from '../services/gmailService';
import { auth, getCachedGoogleToken, signInWithGoogle } from '../services/firebase';
import { AIAutomatedJobEngine } from '../components/AIAutomatedJobEngine';
import { PreparedJobApplication } from '../types/jobApplication';
import {
  recordAppliedJob,
  loadAppliedJobRecords,
  isJobAppliedWithin10Days,
} from '../services/jobDatabaseService';

interface ApplyByEmailViewProps {
  initialSelectedCvId?: string;
  onBackToDashboard?: () => void;
  onOpenCVLibrary?: () => void;
}

interface RecipientEntry {
  id: string;
  email: string;
}

export interface PhoneUploadedCV {
  id: string;
  name: string;
  sizeFormatted: string;
  sizeBytes: number;
  base64: string;
  uploadedAt: string;
}

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export const ApplyByEmailView: React.FC<ApplyByEmailViewProps> = ({
  initialSelectedCvId,
  onBackToDashboard,
  onOpenCVLibrary,
}) => {
  const { theme } = useTheme();

  // Mobile Phone CV State (Stored on phone or uploaded from device storage)
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [phoneCV, setPhoneCV] = useState<PhoneUploadedCV | null>(() => {
    try {
      const cached = localStorage.getItem('cv_phone_uploaded_cache_v1');
      if (cached) return JSON.parse(cached);
    } catch (e) {
      console.warn('Failed to load cached phone CV:', e);
    }
    return null;
  });
  const [isUsingPhoneCV, setIsUsingPhoneCV] = useState<boolean>(() => {
    try {
      return localStorage.getItem('cv_is_using_phone_cv_v1') === 'true';
    } catch {
      return false;
    }
  });

  // CV Library State
  const [cvLibrary, setCvLibrary] = useState<CVDocumentItem[]>(() => loadCVLibrary());
  const [selectedCvId, setSelectedCvId] = useState<string>(() => {
    if (initialSelectedCvId) return initialSelectedCvId;
    const draft = loadSavedApplicationDraft();
    const active = getActiveCVId();
    return draft.selectedCvId || active || (cvLibrary[0]?.id || 'bartender-master-cv');
  });

  // Sync isUsingPhoneCV preference to storage
  useEffect(() => {
    try {
      localStorage.setItem('cv_is_using_phone_cv_v1', isUsingPhoneCV ? 'true' : 'false');
    } catch (e) {
      console.warn('Failed to persist isUsingPhoneCV:', e);
    }
  }, [isUsingPhoneCV]);

  // Keep selectedCvId in sync if initialSelectedCvId prop updates
  useEffect(() => {
    if (initialSelectedCvId && initialSelectedCvId !== selectedCvId) {
      setSelectedCvId(initialSelectedCvId);
    }
  }, [initialSelectedCvId]);

  const selectedCV = useMemo(() => {
    return cvLibrary.find(c => c.id === selectedCvId) || cvLibrary[0];
  }, [cvLibrary, selectedCvId]);

  // Form Fields (Pre-saved)
  const [draft, setDraft] = useState(() => loadSavedApplicationDraft());
  const [subject, setSubject] = useState(draft.subject);
  const [coverLetter, setCoverLetter] = useState(draft.coverLetter);

  // Recipients: Start with 1 empty field or pre-filled defaults
  const [recipients, setRecipients] = useState<RecipientEntry[]>([
    { id: 'rec-init-1', email: 'hr@hotel1.com' },
    { id: 'rec-init-2', email: 'jobs@hotel2.com' },
    { id: 'rec-init-3', email: 'careers@hotel3.com' },
    { id: 'rec-init-4', email: 'hr@restaurant4.com' },
  ]);

  // Saved Recipients and Sending History
  const [savedRecipients, setSavedRecipients] = useState<SavedRecipient[]>(() => loadSavedRecipients());
  const [sendingHistory, setSendingHistory] = useState<GmailSendingRecord[]>(() => loadLocalSendingHistory());

  // 3-AI Automated Job Application Engine State
  const [activeTabMode, setActiveTabMode] = useState<'3ai-automated' | 'manual'>('3ai-automated');
  const [preparedApplications, setPreparedApplications] = useState<PreparedJobApplication[]>(() =>
    loadSavedPreparedApplications()
  );

  const handleUpdatePreparedApplications = (apps: PreparedJobApplication[]) => {
    setPreparedApplications(apps);
    saveSavedPreparedApplications(apps);
  };

  // Connection & OAuth status
  const [currentUser, setCurrentUser] = useState(() => auth.currentUser);
  const [hasToken, setHasToken] = useState<boolean>(() => !!getCachedGoogleToken());
  const [isConnectingGmail, setIsConnectingGmail] = useState(false);

  // Modals & UI States
  const [isCvDropdownOpen, setIsCvDropdownOpen] = useState(false);
  const [isGalleryModalOpen, setIsGalleryModalOpen] = useState(false);
  const [isTemplateMenuOpen, setIsTemplateMenuOpen] = useState(false);
  const [isSavedRecipientsModalOpen, setIsSavedRecipientsModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewRecipientIndex, setPreviewRecipientIndex] = useState(0);
  const [isConfirmSendOpen, setIsConfirmSendOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sendProgress, setSendProgress] = useState<{ current: number; total: number; recipient: string } | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Monitor auth state changes
  useEffect(() => {
    const unsub = auth.onAuthStateChanged(u => {
      setCurrentUser(u);
      setHasToken(!!getCachedGoogleToken());
    });
    return () => unsub();
  }, []);

  // Auto-save draft changes
  useEffect(() => {
    saveApplicationDraft({
      subject,
      coverLetter,
      selectedCvId,
    });
  }, [subject, coverLetter, selectedCvId]);

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  // Handle mobile phone file selection and upload
  const handlePhoneFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      showToast('Selected file is too large. Please choose a CV under 25 MB.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64Data = result.includes(',') ? result.split(',')[1] : result;
      const sizeKb = Math.round(file.size / 1024);
      const sizeFormatted = sizeKb >= 1024 ? `${(sizeKb / 1024).toFixed(1)} MB` : `${sizeKb} KB`;

      const newPhoneCV: PhoneUploadedCV = {
        id: `phone-cv-${Date.now()}`,
        name: file.name,
        sizeFormatted,
        sizeBytes: file.size,
        base64: base64Data,
        uploadedAt: new Date().toISOString(),
      };

      setPhoneCV(newPhoneCV);
      setIsUsingPhoneCV(true);
      try {
        localStorage.setItem('cv_phone_uploaded_cache_v1', JSON.stringify(newPhoneCV));
      } catch (err) {
        console.warn('Storage quota note for cached phone CV:', err);
      }
      showToast(`Selected "${file.name}" (${sizeFormatted}) from your phone storage!`, 'success');
    };
    reader.onerror = () => {
      showToast('Could not read file from phone storage.', 'error');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Google OAuth Sign-in / Connect Gmail
  const handleConnectGmail = async () => {
    setIsConnectingGmail(true);
    try {
      const res = await signInWithGoogle();
      if (res && res.accessToken) {
        setHasToken(true);
        setCurrentUser(res.user);
        showToast(`Connected to Gmail as ${res.user.email}!`, 'success');
      } else if (res) {
        setHasToken(true);
        showToast('Gmail connected successfully.', 'success');
      }
    } catch (err: any) {
      console.error('Gmail connection error:', err);
      showToast(err.message || 'Failed to connect Gmail. Please try again.', 'error');
    } finally {
      setIsConnectingGmail(false);
    }
  };

  // Recipient list management
  const handleAddRecipient = () => {
    setRecipients(prev => [...prev, { id: `rec-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`, email: '' }]);
  };

  const handleUpdateRecipient = (id: string, email: string) => {
    setRecipients(prev => prev.map(r => (r.id === id ? { ...r, email } : r)));
  };

  const handleRemoveRecipient = (id: string) => {
    if (recipients.length <= 1) {
      // Clear instead of removing if only one
      setRecipients([{ id: `rec-${Date.now()}`, email: '' }]);
      return;
    }
    setRecipients(prev => prev.filter(r => r.id !== id));
  };

  const handleSelectSavedRecipient = (saved: SavedRecipient) => {
    // Check duplicate
    if (recipients.some(r => r.email.trim().toLowerCase() === saved.email.trim().toLowerCase())) {
      showToast(`${saved.email} is already in the recipient list.`, 'info');
      return;
    }
    // If last is empty, replace it
    const last = recipients[recipients.length - 1];
    if (last && !last.email.trim()) {
      handleUpdateRecipient(last.id, saved.email);
    } else {
      setRecipients(prev => [...prev, { id: `rec-${Date.now()}`, email: saved.email }]);
    }
    showToast(`Added ${saved.name} (${saved.email})`, 'success');
  };

  // Validation helpers
  const validateRecipient = (entry: RecipientEntry) => {
    const trimmed = entry.email.trim();
    if (!trimmed) return { valid: false, reason: 'Empty' };
    if (!EMAIL_REGEX.test(trimmed)) return { valid: false, reason: 'Invalid format' };
    const duplicates = recipients.filter(r => r.email.trim().toLowerCase() === trimmed.toLowerCase());
    if (duplicates.length > 1) return { valid: false, reason: 'Duplicate' };
    return { valid: true };
  };

  const validRecipients = useMemo(() => {
    return recipients.filter(r => validateRecipient(r).valid);
  }, [recipients]);

  // Templates
  const handleApplyTemplate = (type: 'fine-dining' | 'resort' | 'fast-paced') => {
    if (type === 'fine-dining') {
      setSubject('Senior Bartender & Mixologist Application – Fazle Rabbi');
      setCoverLetter(`Dear Hiring Manager,

I am writing to express my strong interest in joining your establishment as a Senior Bartender. With over 6 years of experience in luxury 5-star hotels and premium cocktail lounges, I specialize in crafting bespoke cocktails, five-star guest hospitality, and bar cellar management.

I have attached my comprehensive CV and training credentials for your review. I look forward to the possibility of discussing how my dedication to service excellence can elevate your guest experience.

Warm regards,
Fazle Rabbi Boyati
Bartender & Mixologist`);
    } else if (type === 'resort') {
      setSubject('Bartender & Barista Position – Fazle Rabbi');
      setCoverLetter(`Dear Hiring Team,

I am pleased to submit my application for the Bartender & Barista position at your resort. My background encompasses operating high-volume cocktail bars, crafting specialty coffees, and ensuring impeccable hygiene standards in beach and resort environments.

Please find my complete CV attached. I welcome the opportunity to speak with you regarding this role.

Best regards,
Fazle Rabbi Boyati`);
    } else {
      setSubject('Bartender Position Application – Fazle Rabbi');
      setCoverLetter(`Dear Hiring Manager,

I am writing to express my interest in the Bartender position at your respected establishment. With over 6 years of experience in hospitality, I am confident in my ability to contribute to your team.

Please find my CV attached for your kind consideration.

Best regards,
Fazle Rabbi Boyati`);
    }
    setIsTemplateMenuOpen(false);
    showToast('Applied cover letter template', 'info');
  };

  // Formatting actions (Rich-text look)
  const handleFormat = (tag: string) => {
    const textarea = document.getElementById('cover-letter-textarea') as HTMLTextAreaElement;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = coverLetter.substring(start, end);
    let replacement = '';
    if (tag === 'b') replacement = `**${selected || 'bold text'}**`;
    else if (tag === 'i') replacement = `*${selected || 'italic text'}*`;
    else if (tag === 'u') replacement = `_${selected || 'underlined'}_`;
    else if (tag === 'bullet') replacement = `\n• ${selected || 'Key skill or responsibility'}`;
    else if (tag === 'number') replacement = `\n1. ${selected || 'Key point'}`;

    const updated = coverLetter.substring(0, start) + replacement + coverLetter.substring(end);
    setCoverLetter(updated);
  };

  // Test Email
  const handleSendTestEmail = async () => {
    if (!hasToken) {
      await handleConnectGmail();
      return;
    }
    const dest = currentUser?.email || 'FazleRabbe905@gmail.com';
    setIsSending(true);
    try {
      let pdfBase64 = '';
      let pdfFilename = '';
      let cvTitle = '';

      if (isUsingPhoneCV && phoneCV) {
        showToast(`Preparing phone CV "${phoneCV.name}" for test email...`, 'info');
        pdfBase64 = phoneCV.base64;
        pdfFilename = phoneCV.name;
        cvTitle = `${phoneCV.name} (Phone Storage)`;
      } else {
        showToast(`Generating CV PDF for test email...`, 'info');
        try {
          pdfBase64 = await generateCVPdfBase64('email-hidden-cv-container');
        } catch (e) {
          console.warn('PDF generation fallback:', e);
        }
        pdfFilename = `${selectedCV?.title || 'Fazle_Rabbi_CV'}.pdf`;
        cvTitle = selectedCV?.title || 'Fazle Rabbi — Bartender CV';
      }

      await sendJobApplicationViaGmail({
        recipient: dest,
        subject: `[TEST APPLICATION] ${subject}`,
        bodyText: coverLetter,
        pdfBase64: pdfBase64 || undefined,
        pdfFilename,
      });

      const newRecord: GmailSendingRecord = {
        id: `test-${Date.now()}`,
        timestamp: new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
        recipient: dest,
        subject: `[TEST] ${subject}`,
        cvTitle,
        status: 'sent',
      };
      const updatedHistory = [newRecord, ...sendingHistory];
      setSendingHistory(updatedHistory);
      saveLocalSendingHistory(updatedHistory);

      showToast(`Test email successfully sent to ${dest}!`, 'success');
    } catch (err: any) {
      console.error('Test email failed:', err);
      showToast(err.message || 'Failed to send test email', 'error');
    } finally {
      setIsSending(false);
    }
  };

  // Batch Send All Applications
  const handleExecuteSendAll = async () => {
    if (validRecipients.length === 0) {
      showToast('Please add at least one valid recipient.', 'error');
      return;
    }

    if (!hasToken) {
      setIsConfirmSendOpen(false);
      await handleConnectGmail();
      return;
    }

    setIsConfirmSendOpen(false);
    setIsSending(true);
    setSendProgress({ current: 0, total: validRecipients.length, recipient: validRecipients[0].email });

    let pdfBase64 = '';
    let pdfFilename = '';
    let cvTitle = '';

    if (isUsingPhoneCV && phoneCV) {
      pdfBase64 = phoneCV.base64;
      pdfFilename = phoneCV.name;
      cvTitle = `${phoneCV.name} (Phone Storage)`;
    } else {
      try {
        pdfBase64 = await generateCVPdfBase64('email-hidden-cv-container');
      } catch (pdfErr) {
        console.warn('PDF export warning, continuing:', pdfErr);
      }
      pdfFilename = `${selectedCV?.title || 'Fazle_Rabbi_CV'}.pdf`;
      cvTitle = selectedCV?.title || 'Fazle Rabbi — Bartender CV';
    }

    const updatedHistory = [...sendingHistory];
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < validRecipients.length; i++) {
      const rec = validRecipients[i];
      setSendProgress({
        current: i + 1,
        total: validRecipients.length,
        recipient: rec.email,
      });

      const recordId = `send-${Date.now()}-${i}`;
      const nowStr = new Date().toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

      try {
        const sendResult = await sendJobApplicationViaGmail({
          recipient: rec.email.trim(),
          subject: subject.trim(),
          bodyText: coverLetter.trim(),
          pdfBase64: pdfBase64 || undefined,
          pdfFilename,
        });

        updatedHistory.unshift({
          id: recordId,
          timestamp: nowStr,
          recipient: rec.email.trim(),
          subject: subject.trim(),
          cvTitle,
          status: 'sent',
          messageId: sendResult.messageId,
        });
        successCount++;
      } catch (err: any) {
        console.error(`Failed to send to ${rec.email}:`, err);
        updatedHistory.unshift({
          id: recordId,
          timestamp: nowStr,
          recipient: rec.email.trim(),
          subject: subject.trim(),
          cvTitle,
          status: 'failed',
          errorReason: err.message || 'Gmail transmission error',
        });
        failCount++;
      }

      // Small delay between sends for courteous API pacing
      await new Promise(r => setTimeout(r, 600));
    }

    setSendingHistory(updatedHistory);
    saveLocalSendingHistory(updatedHistory);
    setIsSending(false);
    setSendProgress(null);

    if (failCount === 0) {
      showToast(`Successfully sent ${successCount} application email(s) with your CV!`, 'success');
    } else {
      showToast(`Sent ${successCount} successfully, ${failCount} failed. Check Sending History for details.`, 'info');
    }
  };

  // 3-AI Automated Job Applications: Send all user-approved applications individually from connected Gmail
  const handleSendApprovedApplications = async (approvedApps: PreparedJobApplication[]) => {
    if (!hasToken) {
      await handleConnectGmail();
      return;
    }

    if (approvedApps.length === 0) {
      showToast('No approved applications to send. Please check the applications you want to send.', 'info');
      return;
    }

    setIsSending(true);
    setSendProgress({
      current: 0,
      total: approvedApps.length,
      recipient: approvedApps[0]?.recipientEmail || '',
    });

    let successCount = 0;
    let failCount = 0;
    const updatedHistory = [...sendingHistory];
    const updatedApps = [...preparedApplications];

    // Determine CV attachment base64
    let pdfBase64 = '';
    let pdfFilename = '';

    if (isUsingPhoneCV && phoneCV) {
      pdfBase64 = phoneCV.base64;
      pdfFilename = phoneCV.name;
    } else {
      try {
        pdfBase64 = await generateCVPdfBase64('email-hidden-cv-container');
      } catch (pdfErr) {
        console.warn('PDF export note, continuing:', pdfErr);
      }
      pdfFilename = `${selectedCV?.title || 'Fazle_Rabbi_CV'}.pdf`;
    }

    for (let i = 0; i < approvedApps.length; i++) {
      const app = approvedApps[i];
      const targetEmail = (app.recipientEmail || '').trim().toLowerCase();
      const targetCompany = (app.company || '').trim().toLowerCase();
      const targetPosition = (app.position || '').trim().toLowerCase();
      const targetJobUrl = (app.jobUrl || app.sourceUrl || '').trim().toLowerCase();

      // DUPLICATE PROTECTION:
      // Before sending, check: same company, same position, same job URL, same recipient email, previous application, previous failed recipient.
      const prevSent = updatedHistory.find(
        h =>
          (h.recipient.trim().toLowerCase() === targetEmail && h.status === 'sent') ||
          (targetCompany && h.subject.toLowerCase().includes(targetCompany) && h.status === 'sent')
      );

      const prevFailed = updatedHistory.find(
        h =>
          h.recipient.trim().toLowerCase() === targetEmail &&
          (h.status === 'failed' || h.status === 'delivery_failed')
      );

      // If duplicate detected and already sent or previously failed, do not send duplicate unless manually chosen
      if (prevSent && !app.isDuplicate) {
        const idx = updatedApps.findIndex(a => a.id === app.id);
        if (idx !== -1) {
          updatedApps[idx] = {
            ...updatedApps[idx],
            isDuplicate: true,
            isApproved: false,
            verificationStatus: 'needs_review',
            reviewReason: `Duplicate protection: You already sent an application to ${app.recipientEmail} (${prevSent.timestamp}).`,
          };
        }
        continue;
      }

      if (prevFailed && !app.isDuplicate) {
        const idx = updatedApps.findIndex(a => a.id === app.id);
        if (idx !== -1) {
          updatedApps[idx] = {
            ...updatedApps[idx],
            isDuplicate: true,
            isApproved: false,
            verificationStatus: 'needs_review',
            reviewReason: `Duplicate protection: Previous delivery failed to ${app.recipientEmail}. Repeated retry blocked.`,
          };
        }
        continue;
      }

      setSendProgress({
        current: i + 1,
        total: approvedApps.length,
        recipient: `${app.company} (${app.recipientEmail})`,
      });

      const nowStr = new Date().toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

      try {
        // Prepare combined application message and personalized cover letter
        const bodyContent = app.applicationMessage
          ? `${app.applicationMessage.trim()}\n\n---\n\n${app.coverLetter.trim()}`
          : app.coverLetter.trim();

        // Send individually with NO CC and NO BCC from connected Gmail
        const sendResult = await sendJobApplicationViaGmail({
          recipient: app.recipientEmail.trim(),
          subject: app.subject.trim(),
          bodyText: bodyContent,
          pdfBase64: pdfBase64 || undefined,
          pdfFilename,
        });

        // Mark app as sent & applied ONLY after Gmail accepts the message
        const idx = updatedApps.findIndex(a => a.id === app.id);
        if (idx !== -1) {
          updatedApps[idx] = {
            ...updatedApps[idx],
            status: 'applied',
            deliveryStatus: 'sent_accepted_by_gmail',
            sentTimestamp: nowStr,
            appliedAt: Date.now(),
            lifeCycleStatus: 'applied',
            messageId: sendResult.messageId,
            threadId: sendResult.threadId,
            replyStatus: 'none',
          };
        }

        // APPLIED JOB 10-DAY HIDE SYSTEM (Requirement 13 & 20)
        // Store persistently: Job ID, Company, Position, Job URL, Recipient email, Application date, Gmail message ID, Application status
        recordAppliedJob({
          job: {
            ...app,
            status: 'applied',
            sentTimestamp: nowStr,
          },
          gmailMessageId: sendResult.messageId,
          status: 'applied',
        });

        // Add to sending history
        updatedHistory.unshift({
          id: `hist-ai-${Date.now()}-${i}`,
          timestamp: nowStr,
          recipient: app.recipientEmail.trim(),
          subject: app.subject.trim(),
          cvTitle: isUsingPhoneCV && phoneCV ? phoneCV.name : selectedCV?.title || 'Fazle Rabbi — Bartender CV',
          status: 'sent',
          messageId: sendResult.messageId,
          threadId: sendResult.threadId,
          sourceAI: app.verifiedBy || 'Gemini + OpenAI + Grok',
          replyStatus: 'none',
        });
        successCount++;
      } catch (err: any) {
        console.error(`Failed to send to ${app.recipientEmail}:`, err);
        failCount++;

        const errMsg = err?.message || 'Send error';
        const bounceRegex = /550|5\.1\.1|recipient address rejected|user unknown|address not found|mailbox unavailable|delivery failed|message rejected|delivery_failed/i;
        const isBounce = bounceRegex.test(errMsg);
        const finalStatus = isBounce ? 'delivery_failed' : 'failed';
        const cleanErrorReason = isBounce
          ? `DELIVERY FAILED: Recipient address rejected / unreachable (${errMsg})`
          : errMsg;

        const idx = updatedApps.findIndex(a => a.id === app.id);
        if (idx !== -1) {
          updatedApps[idx] = {
            ...updatedApps[idx],
            status: finalStatus,
            deliveryStatus: isBounce ? 'delivery_failed' : undefined,
            errorReason: cleanErrorReason,
            isApproved: false,
          };
        }

        updatedHistory.unshift({
          id: `hist-ai-${Date.now()}-${i}`,
          timestamp: nowStr,
          recipient: app.recipientEmail.trim(),
          subject: app.subject.trim(),
          cvTitle: isUsingPhoneCV && phoneCV ? phoneCV.name : selectedCV?.title || 'Fazle Rabbi — Bartender CV',
          status: finalStatus,
          errorReason: cleanErrorReason,
          sourceAI: app.verifiedBy || 'Gemini + OpenAI + Grok',
        });
      }

      // Small delay between sends to respect Gmail rate limits
      if (i < approvedApps.length - 1) {
        await new Promise(r => setTimeout(r, 600));
      }
    }

    setPreparedApplications(updatedApps);
    saveSavedPreparedApplications(updatedApps);
    setSendingHistory(updatedHistory);
    saveLocalSendingHistory(updatedHistory);
    setIsSending(false);
    setSendProgress(null);

    if (failCount === 0) {
      showToast(`Successfully sent ${successCount} approved application(s) individually from your connected Gmail!`, 'success');
    } else {
      showToast(`Sent ${successCount} successfully, ${failCount} failed. Check Sending History for details.`, 'info');
    }
  };

  // Retry a failed email
  const handleRetryFailed = async (record: GmailSendingRecord) => {
    if (!hasToken) {
      await handleConnectGmail();
      return;
    }
    showToast(`Retrying application to ${record.recipient}...`, 'info');
    try {
      let pdfBase64 = '';
      let pdfFilename = '';

      if (isUsingPhoneCV && phoneCV) {
        pdfBase64 = phoneCV.base64;
        pdfFilename = phoneCV.name;
      } else {
        try {
          pdfBase64 = await generateCVPdfBase64('email-hidden-cv-container');
        } catch (e) {
          console.warn('PDF retry fallback:', e);
        }
        pdfFilename = `${record.cvTitle || 'Fazle_Rabbi_CV'}.pdf`;
      }

      await sendJobApplicationViaGmail({
        recipient: record.recipient,
        subject: record.subject,
        bodyText: coverLetter,
        pdfBase64: pdfBase64 || undefined,
        pdfFilename,
      });

      const updated = sendingHistory.map(h =>
        h.id === record.id ? { ...h, status: 'sent' as const, errorReason: undefined } : h
      );
      setSendingHistory(updated);
      saveLocalSendingHistory(updated);
      showToast(`Application successfully resent to ${record.recipient}!`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Retry failed', 'error');
    }
  };

  return (
    <div
      className={`min-h-screen pb-24 transition-colors ${
        theme === 'dark' ? 'bg-[#0b0f19] text-slate-100' : 'bg-[#f4f6fb] text-slate-900'
      }`}
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 border text-sm font-medium transition transform duration-200 ${
            toastMessage.type === 'success'
              ? 'bg-emerald-950/90 text-emerald-200 border-emerald-500/40'
              : toastMessage.type === 'error'
              ? 'bg-rose-950/90 text-rose-200 border-rose-500/40'
              : 'bg-blue-950/90 text-blue-200 border-blue-500/40'
          }`}
        >
          {toastMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
          {toastMessage.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
          {toastMessage.type === 'info' && <HelpCircle className="w-4 h-4 text-blue-400 shrink-0" />}
          <span>{toastMessage.text}</span>
          <button onClick={() => setToastMessage(null)} className="ml-2 hover:opacity-75">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 pb-12">
        {/* Top Header Bar matching Reference Screenshot */}
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-700/30">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/25">
              <Send className="w-5 h-5 -rotate-12 translate-x-0.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Job Application Email Sender</h1>
                <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-bold uppercase rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  Official
                </span>
              </div>
              <p className={`text-xs sm:text-sm mt-0.5 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                Send your CV and cover letter to multiple companies easily
              </p>
            </div>
          </div>

          {/* Right Status / Google Account Badge */}
          <div className="flex items-center gap-3 self-end sm:self-center">
            {hasToken ? (
              <div
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium ${
                  theme === 'dark'
                    ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-semibold">Gmail: Connected</span>
                <span className="text-[11px] opacity-75 hidden md:inline">({currentUser?.email || 'Authorized'})</span>
              </div>
            ) : (
              <button
                onClick={handleConnectGmail}
                disabled={isConnectingGmail}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md transition"
              >
                {isConnectingGmail ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                )}
                <span>Connect Gmail</span>
              </button>
            )}

            {/* User Profile Capsule */}
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold ${
                theme === 'dark' ? 'bg-slate-800/80 border-slate-700 text-slate-200' : 'bg-white border-slate-200 text-slate-800'
              }`}
            >
              <div className="w-5 h-5 rounded-full bg-blue-600/20 text-blue-500 flex items-center justify-center font-bold text-[10px]">
                {currentUser?.displayName?.charAt(0) || 'F'}
              </div>
              <span>{currentUser?.displayName || 'Fazle Rabbi'}</span>
            </div>
          </div>
        </header>

        {/* Navigation Mode Selector: 3-AI Automated vs Manual Custom Application */}
        <div className="flex items-center gap-2 p-1.5 rounded-2xl border border-slate-700/60 bg-slate-900/60 max-w-xl mx-auto mt-6 mb-2 text-xs font-bold shadow-lg">
          <button
            type="button"
            onClick={() => setActiveTabMode('3ai-automated')}
            className={`flex-1 py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition ${
              activeTabMode === '3ai-automated'
                ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>3-AI Automated Applications</span>
            <span className="px-1.5 py-0.5 rounded-md text-[9px] bg-white/20 text-white font-mono">NEW</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTabMode('manual')}
            className={`flex-1 py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition ${
              activeTabMode === 'manual'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Mail className="w-4 h-4" />
            <span>Manual Email Sender</span>
          </button>
        </div>

        {/* Dynamic View: 3-AI Automated Job Application System OR Manual Form */}
        {activeTabMode === '3ai-automated' ? (
          <div className="mt-6 space-y-6">
            <AIAutomatedJobEngine
              userEmail={currentUser?.email || 'FazleRabbe905@gmail.com'}
              userName={currentUser?.displayName || 'Fazle Rabbi'}
              hasToken={hasToken}
              selectedCV={selectedCV}
              phoneCV={phoneCV}
              isUsingPhoneCV={isUsingPhoneCV}
              sendingHistory={sendingHistory}
              preparedApplications={preparedApplications}
              onUpdateApplications={handleUpdatePreparedApplications}
              onSendApprovedApplications={handleSendApprovedApplications}
              onConnectGmail={handleConnectGmail}
              isSending={isSending}
            />

            {/* Delivery & Employer Reply History in 3-AI Mode */}
            <section
              className={`p-5 rounded-2xl border transition-all ${
                theme === 'dark' ? 'bg-[#121826]/90 border-slate-800 shadow-md' : 'bg-white border-slate-200 shadow-sm'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-700/30">
                <div className="flex items-center gap-2 text-base font-bold">
                  <Clock className="w-4 h-4 text-blue-500" />
                  <span>All Sent Applications & Delivery History</span>
                </div>
                <span className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                  {sendingHistory.length} Recorded · All replies arrive directly in your primary Gmail inbox
                </span>
              </div>

              {/* Sending History Table */}
              <div className="mt-3 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className={`border-b ${theme === 'dark' ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-500'}`}>
                      <th className="pb-2 font-semibold">Date & Time</th>
                      <th className="pb-2 font-semibold">Recipient</th>
                      <th className="pb-2 font-semibold">Subject / Role</th>
                      <th className="pb-2 font-semibold">Method</th>
                      <th className="pb-2 font-semibold text-right">Status / Employer Reply</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40">
                    {sendingHistory.map(record => (
                      <tr key={record.id} className="group">
                        <td className="py-2.5 text-slate-400 whitespace-nowrap text-[11px]">{record.timestamp}</td>
                        <td className="py-2.5 font-medium truncate max-w-[140px]" title={record.recipient}>
                          {record.recipient}
                        </td>
                        <td className="py-2.5 text-slate-300 truncate max-w-[200px]" title={record.subject}>
                          {record.subject}
                        </td>
                        <td className="py-2.5 text-slate-400 text-[11px]">
                          {record.sourceAI ? (
                            <span className="px-2 py-0.5 rounded-full text-[9px] bg-purple-500/15 text-purple-300 border border-purple-500/25">
                              3-AI Verified
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400">Manual</span>
                          )}
                        </td>
                        <td className="py-2.5 text-right">
                          {record.status === 'sent' ? (
                            <div className="inline-flex items-center gap-1.5">
                              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                Sent
                              </span>
                              {record.replyStatus === 'reply_received' ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40 flex items-center gap-1">
                                  <Inbox className="w-3 h-3 text-blue-400" />
                                  <span>Replied in Gmail</span>
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={async () => {
                                    if (!hasToken) {
                                      await handleConnectGmail();
                                      return;
                                    }
                                    const res = await checkApplicationReplyInGmail(record);
                                    if (res.hasReply) {
                                      const updated = sendingHistory.map(h =>
                                        h.id === record.id
                                          ? { ...h, replyStatus: 'reply_received' as const, replySnippet: res.snippet }
                                          : h
                                      );
                                      setSendingHistory(updated);
                                      saveLocalSendingHistory(updated);
                                      showToast(`Reply received from ${record.recipient} in your Gmail inbox!`, 'success');
                                    } else {
                                      showToast(`No reply yet from ${record.recipient}. Still awaiting response in Gmail.`, 'info');
                                    }
                                  }}
                                  className="px-2 py-0.5 rounded text-[10px] text-slate-400 hover:text-blue-400 border border-slate-700 hover:border-blue-500/40"
                                  title="Check if employer replied to this email in your Gmail inbox"
                                >
                                  Check Reply
                                </button>
                              )}
                            </div>
                          ) : record.status === 'delivery_failed' ? (
                            <div className="inline-flex items-center gap-1.5">
                              <span
                                className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-600/25 text-rose-300 border border-rose-500/40"
                                title={record.errorReason || 'Gmail delivery failed: address rejected or unreachable'}
                              >
                                DELIVERY FAILED
                              </span>
                              <button
                                type="button"
                                onClick={() => handleRetryFailed(record)}
                                className="p-1 rounded text-slate-400 hover:text-white border border-slate-700 hover:bg-slate-800"
                                title="Manual resend attempt"
                              >
                                <RefreshCw className="w-2.5 h-2.5" />
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleRetryFailed(record)}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/30 hover:bg-rose-500/25 transition"
                              title={record.errorReason || 'Click to retry'}
                            >
                              <span>Failed</span>
                              <RefreshCw className="w-2.5 h-2.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                    {sendingHistory.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-slate-500">
                          No applications sent yet. Scan and prepare jobs with 3-AI above to start applying!
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        ) : (
          /* 2-Column Responsive Dashboard Layout */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6 items-start">
          {/* ========================================================
              LEFT COLUMN: Form Inputs Steps 1 to 4
              ======================================================== */}
          <div className="lg:col-span-7 space-y-6">
            {/* STEP 1: Select CV */}
            <section
              className={`p-5 rounded-2xl border transition-all ${
                theme === 'dark' ? 'bg-[#121826]/90 border-slate-800 shadow-md' : 'bg-white border-slate-200 shadow-sm'
              }`}
            >
              {/* Hidden File Input for Mobile Phone Storage Upload */}
              <input
                type="file"
                ref={fileInputRef}
                accept=".pdf,.doc,.docx,application/pdf"
                className="hidden"
                onChange={handlePhoneFileUpload}
              />

              <div className="flex items-start gap-3.5">
                <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                  1
                </div>
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h2 className="text-base font-bold tracking-tight">Select CV</h2>
                      <p className={`text-xs mt-0.5 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                        Choose from your CV gallery or upload directly from phone storage
                      </p>
                    </div>

                    {/* Dual Action Buttons: Phone Upload or CV Gallery */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600/15 hover:bg-emerald-600/25 border border-emerald-500/40 text-emerald-400 text-xs font-semibold transition shadow-xs"
                        title="Select and attach a CV document directly from your phone's storage"
                      >
                        <Smartphone className="w-3.5 h-3.5" />
                        <span>Upload from Phone</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setIsGalleryModalOpen(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600/15 hover:bg-blue-600/25 border border-blue-500/40 text-blue-400 text-xs font-semibold transition shadow-xs"
                        title="Open full visual CV Gallery"
                      >
                        <Layers className="w-3.5 h-3.5" />
                        <span>CV Gallery</span>
                      </button>
                    </div>
                  </div>

                  {/* Active Selection Display: Phone Storage CV vs Gallery CV */}
                  {isUsingPhoneCV && phoneCV ? (
                    <div
                      className={`mt-3.5 p-3.5 rounded-xl border-2 border-emerald-500/50 transition relative ${
                        theme === 'dark' ? 'bg-emerald-950/20' : 'bg-emerald-50/70'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                            <Smartphone className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-bold truncate text-emerald-400">
                                {phoneCV.name}
                              </span>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                Attached from Phone
                              </span>
                            </div>
                            <div className={`text-xs mt-0.5 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                              {phoneCV.sizeFormatted} · Stored on your device · Ready to send via Gmail
                            </div>
                          </div>
                        </div>

                        {/* Action buttons on Phone Card */}
                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="px-2.5 py-1.5 rounded-lg border border-emerald-500/40 hover:bg-emerald-500/20 text-emerald-400 text-xs font-semibold transition"
                            title="Pick a different CV file from your phone"
                          >
                            Replace File
                          </button>
                          <button
                            type="button"
                            onClick={() => setIsUsingPhoneCV(false)}
                            className="px-2.5 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-semibold transition"
                            title="Switch back to using a CV from your Library"
                          >
                            Use Gallery CV
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2 mt-3">
                      {/* CV Selection Card / Dropdown */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setIsCvDropdownOpen(!isCvDropdownOpen)}
                          className={`w-full flex items-center justify-between p-3.5 rounded-xl border text-left transition ${
                            theme === 'dark'
                              ? 'bg-[#182133] hover:bg-[#1d273c] border-slate-700/80'
                              : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-12 rounded-md bg-white border border-slate-300 overflow-hidden shrink-0 shadow-xs flex items-center justify-center">
                              {selectedCV?.data?.photoUrl ? (
                                <img
                                  src={selectedCV.data.photoUrl}
                                  alt=""
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <FileText className="w-5 h-5 text-blue-600" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="text-sm font-semibold truncate">{selectedCV?.title || 'Fazle Rabbi — Bartender CV'}</div>
                              <div className={`text-xs mt-0.5 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                                Last updated: {selectedCV?.updatedAt ? new Date(selectedCV.updatedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '25 Sep 2026'}
                              </div>
                            </div>
                          </div>
                          <ChevronDown
                            className={`w-4 h-4 text-slate-400 transition-transform ${isCvDropdownOpen ? 'rotate-180' : ''}`}
                          />
                        </button>

                        {/* CV Dropdown Menu */}
                        {isCvDropdownOpen && (
                          <div
                            className={`absolute left-0 right-0 top-full mt-2 z-30 rounded-xl border shadow-xl overflow-hidden py-1 max-h-72 overflow-y-auto ${
                              theme === 'dark' ? 'bg-[#1a2234] border-slate-700' : 'bg-white border-slate-200'
                            }`}
                          >
                            {/* Option to upload from phone right inside dropdown */}
                            <button
                              type="button"
                              onClick={() => {
                                setIsCvDropdownOpen(false);
                                fileInputRef.current?.click();
                              }}
                              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left text-xs font-semibold border-b ${
                                theme === 'dark'
                                  ? 'bg-emerald-950/20 border-slate-700 text-emerald-400 hover:bg-emerald-950/40'
                                  : 'bg-emerald-50/80 border-slate-200 text-emerald-700 hover:bg-emerald-100'
                              }`}
                            >
                              <Smartphone className="w-4 h-4 text-emerald-400 shrink-0" />
                              <span>+ Select CV from Phone Storage...</span>
                            </button>

                            {cvLibrary.map(item => (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() => {
                                  setSelectedCvId(item.id);
                                  setIsUsingPhoneCV(false);
                                  setIsCvDropdownOpen(false);
                                }}
                                className={`w-full flex items-center justify-between px-3.5 py-2.5 text-left transition ${
                                  !isUsingPhoneCV && item.id === selectedCvId
                                    ? 'bg-blue-600/15 text-blue-500 font-semibold'
                                    : theme === 'dark'
                                    ? 'hover:bg-slate-800/60 text-slate-200'
                                    : 'hover:bg-slate-50 text-slate-800'
                                }`}
                              >
                                <div className="flex items-center gap-2.5 truncate">
                                  <FileText className="w-4 h-4 text-blue-500 shrink-0" />
                                  <span className="truncate text-xs sm:text-sm">{item.title}</span>
                                </div>
                                {!isUsingPhoneCV && item.id === selectedCvId && (
                                  <Check className="w-4 h-4 text-blue-500 shrink-0" />
                                )}
                              </button>
                            ))}

                            <div className="p-2 border-t border-slate-700/40 mt-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setIsCvDropdownOpen(false);
                                  setIsGalleryModalOpen(true);
                                }}
                                className="w-full py-2 px-3 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                              >
                                <Layers className="w-3.5 h-3.5" />
                                <span>Browse Full Visual Gallery ({cvLibrary.length} CVs)</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Quick Banner for Phone CV if already uploaded, or pick one */}
                      {phoneCV ? (
                        <div className="flex items-center justify-between p-2.5 rounded-xl border border-dashed border-emerald-500/40 bg-emerald-500/5 text-xs">
                          <div className="flex items-center gap-2 min-w-0">
                            <Smartphone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span className="truncate text-slate-300">
                              Phone CV loaded: <span className="font-semibold text-emerald-400">{phoneCV.name}</span>
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setIsUsingPhoneCV(true)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] shrink-0"
                          >
                            Use This File
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className={`w-full py-2.5 px-3 rounded-xl border border-dashed text-xs font-medium flex items-center justify-center gap-2 transition ${
                            theme === 'dark'
                              ? 'border-slate-700 hover:border-emerald-500/60 text-slate-400 hover:text-emerald-400 hover:bg-emerald-950/10'
                              : 'border-slate-300 hover:border-emerald-500 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50/50'
                          }`}
                        >
                          <Smartphone className="w-4 h-4 text-emerald-500" />
                          <span>Have a CV saved on your mobile phone? Tap here to select it</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* STEP 2: Email Subject */}
            <section
              className={`p-5 rounded-2xl border transition-all ${
                theme === 'dark' ? 'bg-[#121826]/90 border-slate-800 shadow-md' : 'bg-white border-slate-200 shadow-sm'
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                  2
                </div>
                <div className="flex-1">
                  <h2 className="text-base font-bold tracking-tight">Email Subject</h2>
                  <p className={`text-xs mt-0.5 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                    This subject will be used for all recipients
                  </p>

                  <div className="mt-3">
                    <input
                      type="text"
                      value={subject}
                      onChange={e => setSubject(e.target.value)}
                      placeholder="e.g. Bartender Position Application – Fazle Rabbi"
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-medium transition focus:outline-hidden focus:ring-2 focus:ring-blue-500 ${
                        theme === 'dark'
                          ? 'bg-[#182133] border-slate-700 text-white placeholder-slate-500'
                          : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                      }`}
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* STEP 3: Cover Letter / Email Body */}
            <section
              className={`p-5 rounded-2xl border transition-all ${
                theme === 'dark' ? 'bg-[#121826]/90 border-slate-800 shadow-md' : 'bg-white border-slate-200 shadow-sm'
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div className="w-7 h-7 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                  3
                </div>
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h2 className="text-base font-bold tracking-tight">Cover Letter / Email Body</h2>
                      <p className={`text-xs mt-0.5 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                        This message will be used for all recipients
                      </p>
                    </div>

                    {/* Template Picker */}
                    <div className="relative self-end sm:self-auto">
                      <button
                        type="button"
                        onClick={() => setIsTemplateMenuOpen(!isTemplateMenuOpen)}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold border transition ${
                          theme === 'dark'
                            ? 'bg-slate-800/80 hover:bg-slate-700 border-slate-700 text-slate-200'
                            : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
                        }`}
                      >
                        <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                        <span>Use Template</span>
                        <ChevronDown className="w-3 h-3 text-slate-400" />
                      </button>

                      {isTemplateMenuOpen && (
                        <div
                          className={`absolute right-0 top-full mt-1.5 z-30 w-56 rounded-xl border shadow-xl overflow-hidden py-1 ${
                            theme === 'dark' ? 'bg-[#1a2234] border-slate-700' : 'bg-white border-slate-200'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => handleApplyTemplate('fast-paced')}
                            className={`w-full px-3.5 py-2 text-left text-xs transition ${
                              theme === 'dark' ? 'hover:bg-slate-800 text-slate-200' : 'hover:bg-slate-100 text-slate-800'
                            }`}
                          >
                            <div className="font-semibold">Standard Hospitality</div>
                            <div className="text-[10px] opacity-75">Clean, direct, versatile</div>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleApplyTemplate('fine-dining')}
                            className={`w-full px-3.5 py-2 text-left text-xs transition ${
                              theme === 'dark' ? 'hover:bg-slate-800 text-slate-200' : 'hover:bg-slate-100 text-slate-800'
                            }`}
                          >
                            <div className="font-semibold">Luxury 5-Star Mixologist</div>
                            <div className="text-[10px] opacity-75">Tailored for fine dining & luxury hotels</div>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleApplyTemplate('resort')}
                            className={`w-full px-3.5 py-2 text-left text-xs transition ${
                              theme === 'dark' ? 'hover:bg-slate-800 text-slate-200' : 'hover:bg-slate-100 text-slate-800'
                            }`}
                          >
                            <div className="font-semibold">Beach & Resort Barista</div>
                            <div className="text-[10px] opacity-75">High volume, specialty coffee & cocktails</div>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Rich text formatting toolbar matching reference */}
                  <div
                    className={`flex items-center gap-1 mt-3 px-2 py-1 rounded-t-xl border border-b-0 ${
                      theme === 'dark' ? 'bg-[#161f30] border-slate-700' : 'bg-slate-100 border-slate-300'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => handleFormat('b')}
                      className="w-7 h-7 flex items-center justify-center font-bold text-xs rounded-md hover:bg-slate-700/30"
                      title="Bold"
                    >
                      B
                    </button>
                    <button
                      type="button"
                      onClick={() => handleFormat('i')}
                      className="w-7 h-7 flex items-center justify-center italic text-xs rounded-md hover:bg-slate-700/30"
                      title="Italic"
                    >
                      I
                    </button>
                    <button
                      type="button"
                      onClick={() => handleFormat('u')}
                      className="w-7 h-7 flex items-center justify-center underline text-xs rounded-md hover:bg-slate-700/30"
                      title="Underline"
                    >
                      U
                    </button>
                    <div className="w-[1px] h-4 bg-slate-600/40 mx-1" />
                    <button
                      type="button"
                      onClick={() => handleFormat('bullet')}
                      className="px-2 h-7 flex items-center gap-1 text-xs rounded-md hover:bg-slate-700/30"
                      title="Bullet list"
                    >
                      • List
                    </button>
                    <button
                      type="button"
                      onClick={() => handleFormat('number')}
                      className="px-2 h-7 flex items-center gap-1 text-xs rounded-md hover:bg-slate-700/30"
                      title="Numbered list"
                    >
                      1. List
                    </button>
                  </div>

                  {/* Cover Letter Text Area */}
                  <textarea
                    id="cover-letter-textarea"
                    rows={8}
                    value={coverLetter}
                    onChange={e => setCoverLetter(e.target.value)}
                    placeholder="Write your personalized cover letter..."
                    className={`w-full p-3.5 rounded-b-xl border text-sm leading-relaxed transition focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-['Inter'] ${
                      theme === 'dark'
                        ? 'bg-[#182133] border-slate-700 text-white placeholder-slate-500'
                        : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                    }`}
                  />
                </div>
              </div>
            </section>

            {/* STEP 4: Add Recipients One by One */}
            <section
              className={`p-5 rounded-2xl border transition-all ${
                theme === 'dark' ? 'bg-[#121826]/90 border-slate-800 shadow-md' : 'bg-white border-slate-200 shadow-sm'
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div className="w-7 h-7 rounded-full bg-amber-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                  4
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-bold tracking-tight">Add Recipients</h2>
                      <p className={`text-xs mt-0.5 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                        Add one email address at a time
                      </p>
                    </div>

                    {/* Saved Recipients Trigger */}
                    <button
                      type="button"
                      onClick={() => setIsSavedRecipientsModalOpen(true)}
                      className="flex items-center gap-1.5 text-xs font-semibold text-blue-500 hover:text-blue-400 transition"
                    >
                      <Bookmark className="w-3.5 h-3.5" />
                      <span>Saved Contacts</span>
                    </button>
                  </div>

                  {/* Individual Recipient Rows */}
                  <div className="space-y-2.5 mt-4">
                    {recipients.map((entry, index) => {
                      const validation = validateRecipient(entry);
                      return (
                        <div key={entry.id} className="flex items-center gap-2">
                          <span
                            className={`text-xs font-semibold w-24 shrink-0 hidden sm:inline ${
                              theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                            }`}
                          >
                            Gmail Address
                          </span>

                          <div className="relative flex-1">
                            <input
                              type="email"
                              value={entry.email}
                              onChange={e => handleUpdateRecipient(entry.id, e.target.value)}
                              placeholder={`hr@company${index + 1}.com`}
                              className={`w-full pl-3.5 pr-9 py-2.5 rounded-xl border text-sm font-medium transition focus:outline-hidden focus:ring-2 ${
                                !entry.email.trim()
                                  ? theme === 'dark'
                                    ? 'bg-[#182133] border-slate-700 text-white'
                                    : 'bg-white border-slate-300 text-slate-900'
                                  : validation.valid
                                  ? 'border-emerald-500/60 bg-emerald-950/10 focus:ring-emerald-500'
                                  : 'border-rose-500/60 bg-rose-950/10 focus:ring-rose-500'
                              }`}
                            />

                            {/* Validation Icon Badge */}
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                              {entry.email.trim() && (
                                validation.valid ? (
                                  <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-white" title="Valid email address">
                                    <Check className="w-3 h-3 stroke-[3]" />
                                  </div>
                                ) : (
                                  <div className="w-5 h-5 rounded-full bg-rose-500 flex items-center justify-center text-white" title={validation.reason}>
                                    <AlertCircle className="w-3 h-3" />
                                  </div>
                                )
                              )}
                            </div>
                          </div>

                          {/* Delete Recipient Row */}
                          <button
                            type="button"
                            onClick={() => handleRemoveRecipient(entry.id)}
                            className="w-9 h-9 rounded-xl flex items-center justify-center text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 transition shrink-0"
                            title="Remove recipient"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  {/* + Add Another Recipient Button matching screenshot */}
                  <button
                    type="button"
                    onClick={handleAddRecipient}
                    className={`w-full mt-4 py-3 px-4 rounded-xl border-2 border-dashed font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition ${
                      theme === 'dark'
                        ? 'border-blue-500/30 hover:border-blue-500/60 text-blue-400 hover:bg-blue-500/5'
                        : 'border-blue-300 hover:border-blue-500 text-blue-600 hover:bg-blue-50'
                    }`}
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Another Recipient</span>
                  </button>
                </div>
              </div>
            </section>
          </div>

          {/* ========================================================
              RIGHT COLUMN: Live Preview, Recipient List & Sending History
              ======================================================== */}
          <div className="lg:col-span-5 space-y-6">
            {/* Card 1: Email Preview matching Screenshot */}
            <section
              className={`p-5 rounded-2xl border transition-all ${
                theme === 'dark' ? 'bg-[#121826]/90 border-slate-800 shadow-md' : 'bg-white border-slate-200 shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-700/30">
                <div className="flex items-center gap-2 text-base font-bold">
                  <Eye className="w-4 h-4 text-blue-500" />
                  <span>Email Preview</span>
                </div>

                <button
                  type="button"
                  onClick={handleSendTestEmail}
                  disabled={isSending}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-blue-600/10 hover:bg-blue-600/20 text-blue-500 border border-blue-500/30 transition"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Test Email</span>
                </button>
              </div>

              {/* Preview Body */}
              <div className="space-y-3 pt-3 text-xs leading-relaxed">
                <div>
                  <span className={`font-semibold ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>To: </span>
                  <span className="font-mono text-blue-400">
                    {validRecipients[0]?.email || 'No recipient specified'}
                    {validRecipients.length > 1 && ` (and ${validRecipients.length - 1} more)`}
                  </span>
                </div>

                <div>
                  <span className={`font-semibold ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Subject: </span>
                  <span className="font-medium">{subject || 'No Subject'}</span>
                </div>

                <div
                  className={`p-3.5 rounded-xl border max-h-48 overflow-y-auto whitespace-pre-wrap font-['Inter'] leading-relaxed ${
                    theme === 'dark' ? 'bg-[#182133] border-slate-700/60 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                >
                  {coverLetter}
                </div>

                {/* PDF Attachment Capsule matching reference */}
                <div
                  className={`flex items-center justify-between p-3 rounded-xl border ${
                    isUsingPhoneCV && phoneCV
                      ? 'border-emerald-500/50 bg-emerald-950/20'
                      : theme === 'dark' ? 'bg-[#182133] border-slate-700/60' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        isUsingPhoneCV && phoneCV
                          ? 'bg-emerald-600/20 text-emerald-400'
                          : 'bg-rose-500/10 text-rose-500'
                      }`}
                    >
                      {isUsingPhoneCV && phoneCV ? (
                        <Smartphone className="w-4 h-4" />
                      ) : (
                        <FileText className="w-4 h-4" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold truncate text-xs">
                        {isUsingPhoneCV && phoneCV
                          ? phoneCV.name
                          : `${selectedCV?.title || 'Fazle Rabbi — Bartender CV'}.pdf`}
                      </div>
                      <div className={`text-[10px] ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                        {isUsingPhoneCV && phoneCV
                          ? `${phoneCV.sizeFormatted} · Uploaded from Mobile Phone`
                          : '245 KB · Official A4 PDF'}
                      </div>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold border shrink-0 ${
                      isUsingPhoneCV && phoneCV
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    }`}
                  >
                    {isUsingPhoneCV && phoneCV ? 'Phone File Attached' : 'Attached'}
                  </span>
                </div>
              </div>
            </section>

            {/* Card 2: Recipient List & Send All Actions matching Screenshot */}
            <section
              className={`p-5 rounded-2xl border transition-all ${
                theme === 'dark' ? 'bg-[#121826]/90 border-slate-800 shadow-md' : 'bg-white border-slate-200 shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-700/30">
                <div className="flex items-center gap-2 text-base font-bold">
                  <UserIcon className="w-4 h-4 text-blue-500" />
                  <span>Recipient List ({validRecipients.length})</span>
                </div>
                <span className="text-xs text-slate-400">
                  {validRecipients.length === recipients.length ? 'All Valid' : `${validRecipients.length}/${recipients.length} Ready`}
                </span>
              </div>

              {/* Numbered Table List */}
              <div className="space-y-2 pt-3 max-h-52 overflow-y-auto pr-1">
                {recipients.map((entry, idx) => {
                  const validation = validateRecipient(entry);
                  return (
                    <div
                      key={entry.id}
                      className={`flex items-center justify-between p-2.5 rounded-xl border text-xs ${
                        theme === 'dark' ? 'bg-[#182133] border-slate-700/60' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-slate-400 font-mono w-4">{idx + 1}</span>
                        <span className="font-medium truncate font-mono text-[11px]">
                          {entry.email || <span className="italic text-slate-500">Unspecified email</span>}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {validation.valid ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            Valid
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                            {validation.reason || 'Invalid'}
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={() => handleRemoveRecipient(entry.id)}
                          className="text-slate-400 hover:text-rose-400 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Dual Action Buttons matching reference */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setIsPreviewModalOpen(true)}
                  className={`w-full py-2.5 px-4 rounded-xl border font-semibold text-xs flex items-center justify-center gap-1.5 transition ${
                    theme === 'dark'
                      ? 'border-blue-500/40 hover:bg-blue-600/10 text-blue-400'
                      : 'border-blue-300 hover:bg-blue-50 text-blue-600'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Preview Applications</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsConfirmSendOpen(true)}
                  disabled={validRecipients.length === 0 || isSending}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-blue-500/25 transition disabled:opacity-50"
                >
                  {isSending ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5 -rotate-12" />
                      <span>Send All ({validRecipients.length})</span>
                    </>
                  )}
                </button>
              </div>
            </section>

            {/* Card 3: Sending History matching Screenshot */}
            <section
              className={`p-5 rounded-2xl border transition-all ${
                theme === 'dark' ? 'bg-[#121826]/90 border-slate-800 shadow-md' : 'bg-white border-slate-200 shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-700/30">
                <div className="flex items-center gap-2 text-base font-bold">
                  <Clock className="w-4 h-4 text-blue-500" />
                  <span>Sending History</span>
                </div>
                <span className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                  {sendingHistory.length} Recorded
                </span>
              </div>

              {/* Sending History Table */}
              <div className="mt-3 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className={`border-b ${theme === 'dark' ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-500'}`}>
                      <th className="pb-2 font-semibold">Date & Time</th>
                      <th className="pb-2 font-semibold">Recipient</th>
                      <th className="pb-2 font-semibold text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40">
                    {sendingHistory.slice(0, 6).map(record => (
                      <tr key={record.id} className="group">
                        <td className="py-2.5 text-slate-400 whitespace-nowrap text-[11px]">{record.timestamp}</td>
                        <td className="py-2.5 font-medium truncate max-w-[120px]" title={record.recipient}>
                          {record.recipient}
                        </td>
                        <td className="py-2.5 text-right">
                          {record.status === 'sent' ? (
                            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              Sent
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleRetryFailed(record)}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/30 hover:bg-rose-500/25 transition"
                              title={record.errorReason || 'Click to retry'}
                            >
                              <span>Failed</span>
                              <RefreshCw className="w-2.5 h-2.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                    {sendingHistory.length === 0 && (
                      <tr>
                        <td colSpan={3} className="py-6 text-center text-slate-500">
                          No applications sent yet. Add recipients above to start applying!
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </div>
        )}
      </div>

      {/* ========================================================
          MODAL: Preview Applications (Step through each recipient)
          ======================================================== */}
      {isPreviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div
            className={`w-full max-w-2xl rounded-2xl border p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto ${
              theme === 'dark' ? 'bg-[#131927] border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-700/40">
              <div className="flex items-center gap-2 font-bold text-lg">
                <Eye className="w-5 h-5 text-blue-500" />
                <span>Application Preview ({previewRecipientIndex + 1} of {validRecipients.length || 1})</span>
              </div>
              <button onClick={() => setIsPreviewModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {validRecipients.length > 0 ? (
              <div className="space-y-4 text-xs">
                {/* Stepper buttons if multiple */}
                {validRecipients.length > 1 && (
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <button
                      type="button"
                      disabled={previewRecipientIndex === 0}
                      onClick={() => setPreviewRecipientIndex(p => Math.max(0, p - 1))}
                      className="px-3 py-1.5 rounded-lg border border-slate-700 disabled:opacity-30 text-xs font-semibold"
                    >
                      ← Previous Recipient
                    </button>
                    <span className="font-mono text-slate-400">
                      Showing recipient {previewRecipientIndex + 1} of {validRecipients.length}
                    </span>
                    <button
                      type="button"
                      disabled={previewRecipientIndex === validRecipients.length - 1}
                      onClick={() => setPreviewRecipientIndex(p => Math.min(validRecipients.length - 1, p + 1))}
                      className="px-3 py-1.5 rounded-lg border border-slate-700 disabled:opacity-30 text-xs font-semibold"
                    >
                      Next Recipient →
                    </button>
                  </div>
                )}

                <div className="space-y-1">
                  <span className="text-slate-400 block font-semibold">Recipient:</span>
                  <div className="font-mono text-sm font-bold text-blue-400 bg-blue-500/10 p-2.5 rounded-xl border border-blue-500/20">
                    {validRecipients[previewRecipientIndex]?.email}
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-slate-400 block font-semibold">Subject Line:</span>
                  <div className="font-medium p-2.5 rounded-xl border border-slate-700 bg-slate-800/40">
                    {subject}
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-slate-400 block font-semibold">Cover Letter:</span>
                  <div className="p-3.5 rounded-xl border border-slate-700 bg-slate-800/40 whitespace-pre-wrap leading-relaxed max-h-52 overflow-y-auto">
                    {coverLetter}
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-slate-400 block font-semibold">Attached CV:</span>
                  <div className="flex items-center gap-2 p-2.5 rounded-xl border border-emerald-500/30 bg-emerald-950/20 text-emerald-300">
                    {isUsingPhoneCV && phoneCV ? (
                      <>
                        <Smartphone className="w-4 h-4 text-emerald-400" />
                        <span className="font-semibold">{phoneCV.name}</span>
                        <span className="text-[10px] text-emerald-400/80 ml-auto">{phoneCV.sizeFormatted} · Mobile Storage</span>
                      </>
                    ) : (
                      <>
                        <FileText className="w-4 h-4 text-emerald-400" />
                        <span className="font-semibold">{selectedCV?.title || 'Fazle Rabbi — Bartender CV'}.pdf</span>
                        <span className="text-[10px] text-emerald-400/80 ml-auto">Verified A4 Attachment</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <p className="py-6 text-center text-slate-400">No valid recipients entered yet. Please enter at least one email address.</p>
            )}

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-700/40">
              <button
                type="button"
                onClick={() => setIsPreviewModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-700 text-xs font-semibold hover:bg-slate-800"
              >
                Close Preview
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsPreviewModalOpen(false);
                  setIsConfirmSendOpen(true);
                }}
                disabled={validRecipients.length === 0}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Proceed to Send All ({validRecipients.length})</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: Final Confirmation Before Sending
          ======================================================== */}
      {isConfirmSendOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div
            className={`w-full max-w-md rounded-2xl border p-6 shadow-2xl space-y-4 ${
              theme === 'dark' ? 'bg-[#131927] border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
            }`}
          >
            <div className="w-12 h-12 rounded-2xl bg-blue-600/20 text-blue-500 flex items-center justify-center mx-auto">
              <Send className="w-6 h-6 -rotate-12" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold">Ready to Send Applications?</h3>
              <p className="text-xs text-slate-400">
                You are about to send <span className="font-bold text-white">{validRecipients.length} separate emails</span> directly from your connected Gmail account, each with your attached CV.
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-blue-500/30 bg-blue-500/10 text-xs space-y-1 text-slate-300">
              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-blue-400" />
                <span>Each company receives a private, separate email</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-blue-400" />
                <span>
                  Attached:{' '}
                  <span className="font-semibold text-white">
                    {isUsingPhoneCV && phoneCV ? phoneCV.name : `${selectedCV?.title || 'Fazle Rabbi — Bartender CV'}.pdf`}
                  </span>
                  {isUsingPhoneCV && <span className="text-[10px] text-emerald-400 ml-1.5">(Phone Storage)</span>}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-blue-400" />
                <span>From: <span className="font-semibold text-white">{currentUser?.email || 'Your Gmail'}</span></span>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsConfirmSendOpen(false)}
                className="w-1/2 py-2.5 rounded-xl border border-slate-700 text-xs font-semibold hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteSendAll}
                className="w-1/2 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-blue-500/30 transition"
              >
                <Send className="w-3.5 h-3.5 -rotate-12" />
                <span>Confirm & Send</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: Live Sending Progress Indicator
          ======================================================== */}
      {isSending && sendProgress && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm">
          <div
            className={`w-full max-w-md rounded-2xl border p-6 shadow-2xl space-y-4 text-center ${
              theme === 'dark' ? 'bg-[#131927] border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
            }`}
          >
            <div className="w-12 h-12 rounded-full border-4 border-blue-500/20 border-t-blue-500 animate-spin mx-auto" />
            <div>
              <h3 className="text-base font-bold">Sending Applications...</h3>
              <p className="text-xs text-slate-400 mt-1">
                Sending email {sendProgress.current} of {sendProgress.total}
              </p>
            </div>

            <div className="p-2.5 rounded-xl border border-slate-700 bg-slate-800/60 font-mono text-xs text-blue-400 truncate">
              {sendProgress.recipient}
            </div>

            {/* Progress bar */}
            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-300"
                style={{ width: `${(sendProgress.current / sendProgress.total) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: Saved Recipients Manager
          ======================================================== */}
      {isSavedRecipientsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div
            className={`w-full max-w-lg rounded-2xl border p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto ${
              theme === 'dark' ? 'bg-[#131927] border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-700/40">
              <div className="flex items-center gap-2 font-bold text-base">
                <Bookmark className="w-4 h-4 text-blue-500" />
                <span>Saved Employer Contacts</span>
              </div>
              <button onClick={() => setIsSavedRecipientsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Click any company below to quickly add them to your active recipients list.
            </p>

            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {savedRecipients.map(saved => (
                <div
                  key={saved.id}
                  className={`flex items-center justify-between p-3 rounded-xl border transition ${
                    theme === 'dark' ? 'bg-[#182133] border-slate-700/60 hover:border-blue-500/50' : 'bg-slate-50 border-slate-200 hover:border-blue-400'
                  }`}
                >
                  <div className="min-w-0 pr-2">
                    <div className="text-xs font-semibold truncate">{saved.name}</div>
                    <div className="text-[11px] font-mono text-blue-400 truncate">{saved.email}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      handleSelectSavedRecipient(saved);
                      setIsSavedRecipientsModalOpen(false);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shrink-0 transition"
                  >
                    + Add
                  </button>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setIsSavedRecipientsModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-700 text-xs font-semibold hover:bg-slate-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: Visual CV Gallery Selector
          Allows the user to select any CV from their library/gallery
          to attach and send via Gmail
          ======================================================== */}
      {isGalleryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm">
          <div
            className={`w-full max-w-4xl rounded-3xl border p-6 sm:p-7 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto ${
              theme === 'dark' ? 'bg-[#121826] border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
            }`}
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-700/40">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-600/20 text-blue-400 flex items-center justify-center">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Select CV from Gallery</h3>
                  <p className="text-xs text-slate-400">
                    Choose which saved CV to attach to your Gmail application ({cvLibrary.length} available)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsGalleryModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Upload CV from Phone Banner */}
            <div
              className={`p-4 rounded-2xl border-2 border-dashed transition flex flex-col sm:flex-row items-center justify-between gap-3 ${
                theme === 'dark'
                  ? 'border-emerald-500/40 bg-emerald-950/20 hover:bg-emerald-950/30'
                  : 'border-emerald-400 bg-emerald-50/70 hover:bg-emerald-100/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-emerald-400">Upload CV from Phone Storage</h4>
                  <p className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                    Select an existing PDF or CV document stored directly on your phone
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsGalleryModalOpen(false);
                  fileInputRef.current?.click();
                }}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shrink-0 transition"
              >
                <UploadCloud className="w-4 h-4" />
                <span>Browse Phone Files</span>
              </button>
            </div>

            {/* Gallery Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Phone Uploaded File Tile if present */}
              {phoneCV && (
                <div
                  onClick={() => {
                    setIsUsingPhoneCV(true);
                    setIsGalleryModalOpen(false);
                    showToast(`Selected "${phoneCV.name}" from phone storage for Gmail application!`, 'success');
                  }}
                  className={`group cursor-pointer rounded-2xl p-4 border-2 transition-all relative flex flex-col justify-between ${
                    isUsingPhoneCV
                      ? 'border-emerald-500 bg-emerald-500/10 shadow-lg shadow-emerald-500/15'
                      : theme === 'dark'
                      ? 'bg-[#182133] border-slate-700/80 hover:border-emerald-400/60 hover:bg-[#1d273c]'
                      : 'bg-slate-50 border-slate-200 hover:border-emerald-400 hover:bg-white shadow-xs'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-[10px] font-semibold text-emerald-400">
                      📱 Phone Storage
                    </span>
                    {isUsingPhoneCV ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                        <Check className="w-3 h-3 stroke-[3]" />
                        <span>Attached</span>
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400 group-hover:text-emerald-400 transition font-medium">
                        Click to select
                      </span>
                    )}
                  </div>

                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-12 h-14 rounded-xl bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 overflow-hidden shrink-0 flex items-center justify-center">
                      <Smartphone className="w-6 h-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold text-sm leading-snug line-clamp-1 group-hover:text-emerald-400 transition text-emerald-300">
                        {phoneCV.name}
                      </h4>
                      <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">
                        {phoneCV.sizeFormatted} · Uploaded from Mobile Phone
                      </p>
                      <div className="text-[10px] text-slate-400/80 mt-1">
                        Ready to attach and send via Gmail
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                      isUsingPhoneCV
                        ? 'bg-emerald-600 text-white'
                        : 'bg-emerald-700/80 hover:bg-emerald-600 text-white shadow-sm'
                    }`}
                  >
                    {isUsingPhoneCV ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Attached to Gmail</span>
                      </>
                    ) : (
                      <>
                        <Mail className="w-3.5 h-3.5" />
                        <span>Select Phone CV & Send</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {cvLibrary.map(item => {
                const isSelected = !isUsingPhoneCV && item.id === selectedCvId;
                const expCount = item.data.experiences?.length || 0;
                const skillCount = item.data.skills?.items?.length || 0;
                const photoCount = item.data.additionalPhotos?.filter(p => p.included)?.length || 0;

                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      setSelectedCvId(item.id);
                      setIsUsingPhoneCV(false);
                      setIsGalleryModalOpen(false);
                      showToast(`Selected "${item.title}" from gallery for Gmail application!`, 'success');
                    }}
                    className={`group cursor-pointer rounded-2xl p-4 border-2 transition-all relative flex flex-col justify-between ${
                      isSelected
                        ? 'border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/15'
                        : theme === 'dark'
                        ? 'bg-[#182133] border-slate-700/80 hover:border-blue-400/60 hover:bg-[#1d273c]'
                        : 'bg-slate-50 border-slate-200 hover:border-blue-400 hover:bg-white shadow-xs'
                    }`}
                  >
                    {/* Top status indicator */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="text-[10px] font-semibold text-slate-400">
                        {item.updatedAt ? new Date(item.updatedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Saved'}
                      </span>
                      {isSelected ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                          <Check className="w-3 h-3 stroke-[3]" />
                          <span>Attached</span>
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 group-hover:text-blue-400 transition font-medium">
                          Click to select
                        </span>
                      )}
                    </div>

                    {/* Miniature Avatar & Details */}
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-12 h-14 rounded-xl bg-white border border-slate-300 overflow-hidden shrink-0 shadow-xs flex items-center justify-center">
                        {item.data.photoUrl ? (
                          <img
                            src={item.data.photoUrl}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <FileText className="w-6 h-6 text-blue-600" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-sm leading-snug line-clamp-1 group-hover:text-blue-400 transition">
                          {item.title}
                        </h4>
                        <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">
                          {item.data.fullName} · {item.roleSubtitle || item.data.professionalTitle}
                        </p>
                        <div className="text-[10px] text-slate-400/80 mt-1">
                          {expCount} Experiences · {skillCount} Skills · {photoCount} Photos
                        </div>
                      </div>
                    </div>

                    {/* Bottom action button */}
                    <button
                      type="button"
                      className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                        isSelected
                          ? 'bg-emerald-600 text-white'
                          : 'bg-blue-600 hover:bg-blue-500 text-white shadow-sm'
                      }`}
                    >
                      {isSelected ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Attached to Gmail</span>
                        </>
                      ) : (
                        <>
                          <Mail className="w-3.5 h-3.5" />
                          <span>Select & Send via Gmail</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-slate-700/40">
              <span className="text-xs text-slate-400">
                Currently Selected: <span className="font-semibold text-white">{selectedCV?.title}</span>
              </span>
              <button
                type="button"
                onClick={() => setIsGalleryModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-700 text-xs font-semibold hover:bg-slate-800"
              >
                Close Gallery
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          HIDDEN OFF-SCREEN CV RENDERER FOR LIVE PDF ATTACHMENTS
          This container renders the exact selected CV document
          so that html2canvas / jsPDF can capture and serialize it
          into a real base64 attachment for the Gmail API.
          ======================================================== */}
      <div
        id="email-hidden-cv-container"
        className="fixed top-0 left-[-9999px] pointer-events-none opacity-0 z-[-100]"
        style={{ width: '210mm' }}
      >
        {selectedCV && <CVDocument data={selectedCV.data} scale={1} id="email-hidden-cv-doc" />}
      </div>
    </div>
  );
};
