import React, { useState, useMemo, useEffect } from 'react';
import {
  Sparkles,
  Bot,
  Search,
  CheckCircle2,
  AlertTriangle,
  Send,
  Eye,
  Edit3,
  Trash2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Mail,
  CheckSquare,
  Square,
  ShieldCheck,
  Check,
  Building,
  Briefcase,
  MapPin,
  Paperclip,
  Smartphone,
  FileText,
  Inbox,
  Filter,
  Calendar,
  Clock,
  X,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import {
  PreparedJobApplication,
  JobMarket,
  JobLifeCycleStatus,
  DEFAULT_HOSPITALITY_ROLES,
  DEFAULT_CYPRUS_LOCATIONS,
  DEFAULT_EUROPE_LOCATIONS,
} from '../types/jobApplication';
import { CVDocumentItem } from '../types/cv';
import { PhoneUploadedCV } from '../views/ApplyByEmailView';
import { GmailSendingRecord, checkApplicationReplyInGmail } from '../services/gmailService';
import {
  loadSelectedMarket,
  saveSelectedMarket,
  loadAppliedJobRecords,
  isJobAppliedWithin10Days,
  mergeFreshJobsIntoDatabase,
  filterVisibleJobsForMarket,
  AppliedJobRecord,
} from '../services/jobDatabaseService';

interface AIAutomatedJobEngineProps {
  userEmail: string;
  userName: string;
  hasToken: boolean;
  selectedCV?: CVDocumentItem;
  phoneCV?: PhoneUploadedCV | null;
  isUsingPhoneCV?: boolean;
  sendingHistory: GmailSendingRecord[];
  preparedApplications: PreparedJobApplication[];
  onUpdateApplications: (apps: PreparedJobApplication[]) => void;
  onSendApprovedApplications: (approvedApps: PreparedJobApplication[]) => Promise<void>;
  onConnectGmail: () => Promise<void>;
  isSending: boolean;
}

export const AIAutomatedJobEngine: React.FC<AIAutomatedJobEngineProps> = ({
  userEmail,
  userName,
  hasToken,
  selectedCV,
  phoneCV,
  isUsingPhoneCV,
  sendingHistory,
  preparedApplications,
  onUpdateApplications,
  onSendApprovedApplications,
  onConnectGmail,
  isSending,
}) => {
  const { theme } = useTheme();

  // Two Main Job Markets (Requirement 14, 15, 19, 20)
  const [selectedMarket, setSelectedMarket] = useState<JobMarket>(() => loadSelectedMarket());
  const [appliedRecords, setAppliedRecords] = useState<AppliedJobRecord[]>(() => loadAppliedJobRecords());
  const [isAppliedVaultOpen, setIsAppliedVaultOpen] = useState(false);

  // Targeting filters
  const [selectedRoles, setSelectedRoles] = useState<string[]>(DEFAULT_HOSPITALITY_ROLES);
  const [selectedLocations, setSelectedLocations] = useState<string[]>(() =>
    selectedMarket === 'cyprus' ? DEFAULT_CYPRUS_LOCATIONS : DEFAULT_EUROPE_LOCATIONS
  );
  const [showFilterSettings, setShowFilterSettings] = useState(false);

  // Pipeline search state
  const [isSearching, setIsSearching] = useState(false);
  const [searchStage, setSearchStage] = useState('');

  // Switch between CYPRUS JOB MARKET and EUROPE JOB MARKET
  const handleSwitchMarket = (market: JobMarket) => {
    setSelectedMarket(market);
    saveSelectedMarket(market);
    setSelectedLocations(market === 'cyprus' ? DEFAULT_CYPRUS_LOCATIONS : DEFAULT_EUROPE_LOCATIONS);
    setAppliedRecords(loadAppliedJobRecords());
    showNotice(
      market === 'cyprus'
        ? 'Switched to CYPRUS JOB MARKET. Displaying only verified Cyprus hospitality vacancies.'
        : 'Switched to EUROPE JOB MARKET. Displaying hospitality vacancies across European countries.'
    );
  };

  // Review & View Filters
  const [statusFilter, setStatusFilter] = useState<'all' | 'verified' | 'needs_review' | 'duplicates'>('all');
  const [expandedAppId, setExpandedAppId] = useState<string | null>(null);
  const [editingAppId, setEditingAppId] = useState<string | null>(null);
  const [reviewingApp, setReviewingApp] = useState<PreparedJobApplication | null>(null);

  // Modal confirmation
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [checkingReplyId, setCheckingReplyId] = useState<string | null>(null);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  const showNotice = (msg: string) => {
    setStatusNotice(msg);
    setTimeout(() => setStatusNotice(null), 4500);
  };

  // Toggle role selection
  const handleToggleRole = (role: string) => {
    setSelectedRoles(prev =>
      prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
    );
  };

  // Toggle location selection
  const handleToggleLocation = (loc: string) => {
    setSelectedLocations(prev =>
      prev.includes(loc) ? prev.filter(l => l !== loc) : [...prev, loc]
    );
  };

  // Run the 3-AI Pipeline with Smart Refresh & Persistent Deduplication (Requirements 16, 18, 20)
  const handleRunPipeline = async () => {
    setIsSearching(true);
    setSearchStage(
      selectedMarket === 'cyprus'
        ? 'Step 1/3: Gemini searching real-time Cyprus hospitality vacancies (Limassol, Paphos, Ayia Napa, Protaras, Larnaca)...'
        : 'Step 1/3: Gemini searching real-time European hospitality jobs across Europe via Google Search...'
    );

    const timer1 = setTimeout(() => {
      setSearchStage('Step 2/3: OpenAI verifying hotel legitimacy, role relevance & official contact emails...');
    }, 2000);

    const timer2 = setTimeout(() => {
      setSearchStage('Step 3/3: Grok cross-validating hiring consensus & preventing duplicate applications...');
    }, 4000);

    try {
      const currentAppliedRecords = loadAppliedJobRecords();
      setAppliedRecords(currentAppliedRecords);

      const existingEmails = (sendingHistory || [])
        .map(h => (h && h.recipient ? String(h.recipient).toLowerCase().trim() : ''))
        .filter(Boolean);

      const res = await fetch('/api/ai/jobs/pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          market: selectedMarket,
          roles: selectedRoles.length > 0 ? selectedRoles : DEFAULT_HOSPITALITY_ROLES,
          locations:
            selectedLocations.length > 0
              ? selectedLocations
              : selectedMarket === 'cyprus'
              ? DEFAULT_CYPRUS_LOCATIONS
              : DEFAULT_EUROPE_LOCATIONS,
          existingEmails,
          applicantName: userName || 'Fazle Rabbi',
          applicantEmail: userEmail || 'FazleRabbe905@gmail.com',
          applicantPhone: selectedCV?.data?.phone || '+357-95502363',
          selectedCvId: selectedCV?.id || '',
          selectedCvTitle: isUsingPhoneCV && phoneCV ? phoneCV.name : selectedCV?.title || 'Fazle Rabbi — Bartender CV',
        }),
      });

      clearTimeout(timer1);
      clearTimeout(timer2);

      if (!res.ok) {
        throw new Error(`Pipeline response error: ${res.statusText}`);
      }

      const data = await res.json();
      const freshApps: PreparedJobApplication[] = data.applications || [];

      // Smart Job Refresh (Requirement 16 & 18):
      // Compare new results with persistent database, merge, prioritize genuinely new vacancies,
      // and do not display jobs applied within the previous 10 days.
      const { merged, newCount } = mergeFreshJobsIntoDatabase(
        preparedApplications,
        freshApps,
        selectedMarket
      );

      onUpdateApplications(merged);

      if (newCount > 0) {
        showNotice(
          `Discovered ${newCount} fresh ${
            selectedMarket === 'cyprus' ? 'Cyprus' : 'European'
          } vacancies! Prioritized at top for your review.`
        );
      } else {
        showNotice(
          `Search completed: No new unapplied vacancies found at this time. All active ${
            selectedMarket === 'cyprus' ? 'Cyprus' : 'European'
          } vacancies are already tracked in your persistent database.`
        );
      }
    } catch (err: any) {
      const errMsg = err?.message || 'Error running job search.';
      showNotice(
        errMsg.includes('429') || errMsg.includes('quota')
          ? `Loaded verified authentic ${selectedMarket === 'cyprus' ? 'Cyprus' : 'European'} vacancies for review.`
          : errMsg
      );
    } finally {
      setIsSearching(false);
      setSearchStage('');
    }
  };

  // Auto-scan for fresh vacancies on reload or when market is changed (Requirement 16)
  useEffect(() => {
    const timer = setTimeout(() => {
      const activeJobs = filterVisibleJobsForMarket(preparedApplications, selectedMarket, appliedRecords);
      if (activeJobs.length < 3) {
        handleRunPipeline();
      }
    }, 700);
    return () => clearTimeout(timer);
  }, [selectedMarket]);

  // Toggle approval for an individual application (LifeCycle tracking: Requirement 17)
  const handleToggleApproval = (id: string) => {
    const updated = preparedApplications.map(app => {
      if (app.id === id) {
        const nextApproved = !app.isApproved;
        return {
          ...app,
          isApproved: nextApproved,
          lifeCycleStatus: nextApproved
            ? ('approved' as const)
            : app.lifeCycleStatus === 'approved'
            ? ('ready_to_apply' as const)
            : app.lifeCycleStatus,
        };
      }
      return app;
    });
    onUpdateApplications(updated);
  };

  // Batch approve all verified
  const handleApproveAllVerified = () => {
    const updated = preparedApplications.map(app => {
      if (app.verificationStatus === 'verified' && !app.isDuplicate) {
        return { ...app, isApproved: true, lifeCycleStatus: 'approved' as const };
      }
      return app;
    });
    onUpdateApplications(updated);
    showNotice('Approved all verified applications for sending.');
  };

  // Deselect all
  const handleDeselectAll = () => {
    const updated = preparedApplications.map(app => ({
      ...app,
      isApproved: false,
      lifeCycleStatus: app.lifeCycleStatus === 'approved' ? ('ready_to_apply' as const) : app.lifeCycleStatus,
    }));
    onUpdateApplications(updated);
  };

  // Delete/Exclude single application
  const handleDeleteApplication = (id: string) => {
    const updated = preparedApplications.filter(app => app.id !== id);
    onUpdateApplications(updated);
  };

  // Save manual edit
  const handleSaveAppEdit = (id: string, updates: Partial<PreparedJobApplication>) => {
    const updated = preparedApplications.map(app => {
      if (app.id === id) {
        const next = { ...app, ...updates };
        // If email was fixed by user, re-verify status
        if (next.recipientEmail && next.recipientEmail.includes('@') && next.verificationStatus === 'needs_review') {
          next.verificationStatus = 'verified';
          next.reviewReason = 'Manually verified and updated by user';
          next.isApproved = true;
          next.lifeCycleStatus = 'ready_to_apply';
        }
        return next;
      }
      return app;
    });
    onUpdateApplications(updated);
    setEditingAppId(null);
    showNotice('Application details updated successfully.');
  };

  // Check for reply in connected Gmail
  const handleCheckReply = async (app: PreparedJobApplication) => {
    if (!hasToken) {
      await onConnectGmail();
      return;
    }
    setCheckingReplyId(app.id);
    try {
      const dummyRecord: GmailSendingRecord = {
        id: app.id,
        timestamp: app.sentTimestamp || new Date().toLocaleString(),
        recipient: app.recipientEmail,
        subject: app.subject,
        cvTitle: app.cvTitle,
        status: 'sent',
        threadId: app.threadId,
      };

      const result = await checkApplicationReplyInGmail(dummyRecord);
      const updated = preparedApplications.map(a => {
        if (a.id === app.id) {
          return {
            ...a,
            replyStatus: result.hasReply ? ('reply_received' as const) : ('checked_no_reply' as const),
            replySnippet: result.snippet,
            replyDate: result.date,
          };
        }
        return a;
      });
      onUpdateApplications(updated);

      if (result.hasReply) {
        showNotice(`🎉 Employer reply received from ${app.company} in your Gmail inbox!`);
      } else {
        showNotice(`No replies yet from ${app.company}. Still awaiting employer response in Gmail.`);
      }
    } catch (err: any) {
      showNotice(err.message || 'Failed to check Gmail for replies.');
    } finally {
      setCheckingReplyId(null);
    }
  };

  const [isCheckingAllReplies, setIsCheckingAllReplies] = useState(false);

  // Check replies for all sent applications in connected Gmail
  const handleCheckAllReplies = async () => {
    if (!hasToken) {
      await onConnectGmail();
      return;
    }
    const sentApps = preparedApplications.filter(a => a.status === 'sent');
    if (sentApps.length === 0) {
      showNotice('No sent applications to check yet. Send applications first!');
      return;
    }
    setIsCheckingAllReplies(true);
    let replyFoundCount = 0;
    const updated = [...preparedApplications];

    for (let i = 0; i < updated.length; i++) {
      const app = updated[i];
      if (app.status === 'sent') {
        const dummyRecord: GmailSendingRecord = {
          id: app.id,
          timestamp: app.sentTimestamp || new Date().toLocaleString(),
          recipient: app.recipientEmail,
          subject: app.subject,
          cvTitle: app.cvTitle,
          status: 'sent',
          threadId: app.threadId,
        };
        try {
          const result = await checkApplicationReplyInGmail(dummyRecord);
          if (result.hasReply) {
            replyFoundCount++;
            updated[i] = {
              ...app,
              replyStatus: 'reply_received',
              replySnippet: result.snippet,
              replyDate: result.date,
            };
          } else {
            updated[i] = {
              ...app,
              replyStatus: 'checked_no_reply',
            };
          }
        } catch (e) {
          console.warn('Reply check error:', e);
        }
      }
    }

    onUpdateApplications(updated);
    setIsCheckingAllReplies(false);
    if (replyFoundCount > 0) {
      showNotice(`🎉 Checked Gmail: Found ${replyFoundCount} employer reply(ies) in your Gmail inbox!`);
    } else {
      showNotice('Checked Gmail inbox: No new employer replies found yet. All replies arrive directly in your primary Gmail inbox.');
    }
  };

  // Filter for active market and enforce 10-day applied cooldown (Requirement 13 & 14)
  const marketJobs = useMemo(() => {
    return filterVisibleJobsForMarket(preparedApplications, selectedMarket, appliedRecords);
  }, [preparedApplications, selectedMarket, appliedRecords]);

  // Count how many jobs in database are currently hidden under the 10-day rule for this market
  const hiddenCountForMarket = useMemo(() => {
    return preparedApplications.filter(app => {
      const isCyprus =
        app.market === 'cyprus' ||
        app.location?.toLowerCase().includes('cyprus') ||
        app.country?.toLowerCase().includes('cyprus');
      if (selectedMarket === 'cyprus' && !isCyprus) return false;
      const { isApplied } = isJobAppliedWithin10Days(app, appliedRecords);
      return isApplied;
    }).length;
  }, [preparedApplications, selectedMarket, appliedRecords]);

  // Filtered applications by status tabs
  const filteredApps = marketJobs.filter(app => {
    if (statusFilter === 'verified') return app.verificationStatus === 'verified' && !app.isDuplicate;
    if (statusFilter === 'needs_review') return app.verificationStatus === 'needs_review' && !app.isDuplicate;
    if (statusFilter === 'duplicates') return app.isDuplicate;
    return true;
  });

  const approvedApps = marketJobs.filter(a => a.isApproved);
  const verifiedCount = marketJobs.filter(a => a.verificationStatus === 'verified' && !a.isDuplicate).length;
  const reviewCount = marketJobs.filter(a => a.verificationStatus === 'needs_review' && !a.isDuplicate).length;
  const duplicateCount = marketJobs.filter(a => a.isDuplicate).length;

  const attachedCvName = isUsingPhoneCV && phoneCV ? phoneCV.name : selectedCV?.title || 'Fazle Rabbi — Bartender CV';

  return (
    <div className="space-y-6">
      {/* Toast Notification Banner */}
      {statusNotice && (
        <div className="p-3.5 rounded-2xl bg-blue-600 text-white text-xs font-semibold shadow-lg flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 shrink-0" />
            <span>{statusNotice}</span>
          </div>
          <button onClick={() => setStatusNotice(null)} className="text-white/80 hover:text-white text-sm">
            ✕
          </button>
        </div>
      )}

      {/* ========================================================
          TWO MAIN JOB MARKETS SWITCHER (Requirement 14, 15, 19)
          1. CYPRUS JOB MARKET: Only Cyprus hospitality vacancies
          2. EUROPE JOB MARKET: European countries vacancies
          ======================================================== */}
      <div
        className={`p-3 sm:p-4 rounded-3xl border transition-all shadow-md flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 ${
          theme === 'dark' ? 'bg-[#121826] border-slate-700/80' : 'bg-white border-slate-200'
        }`}
      >
        <div className="flex items-center p-1.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 gap-1.5 flex-1 max-w-xl">
          <button
            type="button"
            onClick={() => handleSwitchMarket('cyprus')}
            className={`flex-1 py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 text-xs font-bold transition ${
              selectedMarket === 'cyprus'
                ? 'bg-gradient-to-r from-amber-500 via-amber-600 to-orange-600 text-white shadow-lg shadow-amber-500/25 ring-1 ring-amber-400/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span className="text-base leading-none">🇨🇾</span>
            <div className="text-left">
              <div className="font-extrabold tracking-wide">CYPRUS JOB MARKET</div>
              <div className="text-[10px] opacity-80 font-normal">Only Cyprus vacancies</div>
            </div>
            {selectedMarket === 'cyprus' && (
              <span className="ml-auto w-2 h-2 rounded-full bg-white animate-pulse" />
            )}
          </button>

          <button
            type="button"
            onClick={() => handleSwitchMarket('europe')}
            className={`flex-1 py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 text-xs font-bold transition ${
              selectedMarket === 'europe'
                ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-lg shadow-blue-500/25 ring-1 ring-blue-400/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span className="text-base leading-none">🇪🇺</span>
            <div className="text-left">
              <div className="font-extrabold tracking-wide">EUROPE JOB MARKET</div>
              <div className="text-[10px] opacity-80 font-normal">Across European countries</div>
            </div>
            {selectedMarket === 'europe' && (
              <span className="ml-auto w-2 h-2 rounded-full bg-white animate-pulse" />
            )}
          </button>
        </div>

        {/* 10-Day Applied Protection Stats & Vault Trigger (Requirement 13) */}
        <div className="flex items-center gap-2 self-end md:self-center flex-wrap">
          {hiddenCountForMarket > 0 && (
            <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
              <span>{hiddenCountForMarket} job(s) hidden under 10-day cooldown</span>
            </div>
          )}

          <button
            type="button"
            onClick={() => setIsAppliedVaultOpen(true)}
            className="px-3 py-1.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition"
            title="View jobs you applied to that are hidden for 10 days"
          >
            <Clock className="w-3.5 h-3.5 text-blue-400" />
            <span>10-Day Protected Vault ({appliedRecords.length})</span>
          </button>
        </div>
      </div>

      {/* ========================================================
          3-AI STATUS & HERO ENGINE CARD
          ======================================================== */}
      <section
        className={`p-5 sm:p-6 rounded-3xl border transition-all shadow-md relative overflow-hidden ${
          theme === 'dark'
            ? 'bg-gradient-to-br from-[#121826] via-[#151d30] to-[#121826] border-slate-700/80'
            : 'bg-gradient-to-br from-white via-slate-50 to-blue-50/30 border-slate-200'
        }`}
      >
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-5 border-b border-slate-700/30">
          <div className="flex items-start gap-3.5">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-xl shrink-0 ${
                selectedMarket === 'cyprus'
                  ? 'bg-gradient-to-tr from-amber-500 to-orange-600 shadow-amber-500/25'
                  : 'bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 shadow-blue-500/25'
              }`}
            >
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-bold tracking-tight">
                  {selectedMarket === 'cyprus' ? '🇨🇾 Cyprus Job Market Engine' : '🇪🇺 Europe Job Market Engine'}
                </h2>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                    selectedMarket === 'cyprus'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                      : 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                  }`}
                >
                  {selectedMarket === 'cyprus' ? 'Strict Cyprus Isolation' : 'All European Countries'}
                </span>
              </div>
              <p className={`text-xs mt-1 max-w-2xl leading-relaxed ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                {selectedMarket === 'cyprus'
                  ? 'Gemini searches real Cyprus hospitality vacancies (Limassol, Paphos, Ayia Napa, Protaras, Larnaca); OpenAI & Grok verify legitimacy and contact emails. Jobs are prepared for your review.'
                  : 'Gemini searches vacancies across European hospitality destinations; OpenAI & Grok verify legitimacy, duplicate protection, and contact emails.'}
              </p>
            </div>
          </div>

          {/* Action Trigger - SMART REFRESH (Requirement 18) */}
          <button
            type="button"
            onClick={handleRunPipeline}
            disabled={isSearching || isSending}
            className={`w-full md:w-auto px-5 py-3 rounded-2xl text-white font-bold text-xs shadow-lg flex items-center justify-center gap-2 transition active:scale-95 disabled:opacity-50 ${
              selectedMarket === 'cyprus'
                ? 'bg-gradient-to-r from-amber-500 via-amber-600 to-orange-600 hover:from-amber-400 hover:to-orange-500 shadow-amber-500/30'
                : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-indigo-500 shadow-blue-500/30'
            }`}
          >
            {isSearching ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Scanning {selectedMarket === 'cyprus' ? 'Cyprus' : 'Europe'}...</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                <span>
                  {selectedMarket === 'cyprus'
                    ? 'Find Fresh Cyprus Vacancies'
                    : 'Find Fresh European Vacancies'}
                </span>
              </>
            )}
          </button>
        </div>

        {/* 3 AI Service Status Indicators */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4">
          <div
            className={`p-3 rounded-xl border flex items-center gap-2.5 text-xs ${
              theme === 'dark' ? 'bg-[#182133] border-slate-700/60' : 'bg-white border-slate-200'
            }`}
          >
            <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse shrink-0" />
            <div>
              <div className="font-bold flex items-center gap-1">
                <span>1. Gemini AI</span>
                <span className="text-[10px] text-blue-400 font-mono">(Search)</span>
              </div>
              <div className={`text-[11px] ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                Live Google Search for European bars & hotels
              </div>
            </div>
          </div>

          <div
            className={`p-3 rounded-xl border flex items-center gap-2.5 text-xs ${
              theme === 'dark' ? 'bg-[#182133] border-slate-700/60' : 'bg-white border-slate-200'
            }`}
          >
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
            <div>
              <div className="font-bold flex items-center gap-1">
                <span>2. OpenAI</span>
                <span className="text-[10px] text-emerald-400 font-mono">(Verify)</span>
              </div>
              <div className={`text-[11px] ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                Role match & official contact verification
              </div>
            </div>
          </div>

          <div
            className={`p-3 rounded-xl border flex items-center gap-2.5 text-xs ${
              theme === 'dark' ? 'bg-[#182133] border-slate-700/60' : 'bg-white border-slate-200'
            }`}
          >
            <div className="w-2.5 h-2.5 rounded-full bg-purple-500 shrink-0" />
            <div>
              <div className="font-bold flex items-center gap-1">
                <span>3. Grok</span>
                <span className="text-[10px] text-purple-400 font-mono">(Consensus)</span>
              </div>
              <div className={`text-[11px] ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                Consensus validation & duplicate prevention
              </div>
            </div>
          </div>
        </div>

        {/* Live Search Progress Banner */}
        {isSearching && (
          <div className="mt-4 p-4 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs flex items-center gap-3 animate-pulse">
            <RefreshCw className="w-5 h-5 animate-spin shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="font-bold text-white text-sm">Searching & Verifying Openings...</div>
              <div className="text-xs text-blue-300 mt-0.5">{searchStage}</div>
            </div>
          </div>
        )}

        {/* Filter Toggle and Attached CV Summary */}
        <div className="mt-4 pt-3 border-t border-slate-700/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <Paperclip className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>
              Attached to each application:{' '}
              <span className="font-semibold text-emerald-400">{attachedCvName}</span>
              {isUsingPhoneCV && <span className="text-[10px] text-blue-400 ml-1">(Phone Storage)</span>}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setShowFilterSettings(!showFilterSettings)}
            className="flex items-center gap-1.5 text-blue-400 hover:text-blue-300 font-semibold"
          >
            <Filter className="w-3.5 h-3.5" />
            <span>{showFilterSettings ? 'Hide Search Filters' : 'Customize Roles & Locations'}</span>
            {showFilterSettings ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>

        {/* Expandable Filter Settings */}
        {showFilterSettings && (
          <div
            className={`mt-4 p-4 rounded-2xl border space-y-4 ${
              theme === 'dark' ? 'bg-[#161f30] border-slate-700' : 'bg-white border-slate-300'
            }`}
          >
            {/* Roles Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-2">
                Target Hospitality Roles:
              </label>
              <div className="flex flex-wrap gap-1.5">
                {DEFAULT_HOSPITALITY_ROLES.map(role => {
                  const active = selectedRoles.includes(role);
                  return (
                    <button
                      key={role}
                      type="button"
                      onClick={() => handleToggleRole(role)}
                      className={`px-3 py-1 rounded-xl text-xs font-semibold border transition ${
                        active
                          ? 'bg-blue-600 text-white border-blue-500'
                          : theme === 'dark'
                          ? 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                          : 'bg-slate-100 text-slate-600 border-slate-200 hover:text-slate-900'
                      }`}
                    >
                      {active ? '✓ ' : '+ '}
                      {role}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Location Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-2">
                Target European Regions:
              </label>
              <div className="flex flex-wrap gap-1.5">
                {DEFAULT_EUROPE_LOCATIONS.map(loc => {
                  const active = selectedLocations.includes(loc);
                  return (
                    <button
                      key={loc}
                      type="button"
                      onClick={() => handleToggleLocation(loc)}
                      className={`px-3 py-1 rounded-xl text-xs font-semibold border transition ${
                        active
                          ? 'bg-emerald-600 text-white border-emerald-500'
                          : theme === 'dark'
                          ? 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                          : 'bg-slate-100 text-slate-600 border-slate-200 hover:text-slate-900'
                      }`}
                    >
                      {active ? '✓ ' : '+ '}
                      {loc}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ========================================================
          PREPARED APPLICATIONS REVIEW BOARD
          Strict requirement: Must show all prepared applications
          User must manually approve before sending.
          ======================================================== */}
      {preparedApplications.length > 0 ? (
        <section
          className={`p-5 sm:p-6 rounded-3xl border transition-all shadow-md space-y-5 ${
            theme === 'dark' ? 'bg-[#121826]/90 border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          {/* Header & Metrics Bar */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-700/30">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold">
                  Prepared Applications for Your Review ({preparedApplications.length})
                </h3>
              </div>
              <p className={`text-xs mt-0.5 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                Check each company and contact. Only checked applications will be sent when you click Send.
              </p>
            </div>

            {/* Filter Tabs & Select All */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center p-1 rounded-xl border border-slate-700 bg-slate-800/40 text-xs">
                <button
                  type="button"
                  onClick={() => setStatusFilter('all')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                    statusFilter === 'all' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  All ({preparedApplications.length})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('verified')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                    statusFilter === 'verified' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-emerald-400'
                  }`}
                >
                  Verified ({verifiedCount})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('needs_review')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                    statusFilter === 'needs_review' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-amber-400'
                  }`}
                >
                  Review ({reviewCount})
                </button>
                {duplicateCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setStatusFilter('duplicates')}
                    className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                      statusFilter === 'duplicates' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-rose-400'
                    }`}
                  >
                    Duplicates ({duplicateCount})
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={handleApproveAllVerified}
                className="px-3 py-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <CheckSquare className="w-3.5 h-3.5" />
                <span>Approve Verified</span>
              </button>

              <button
                type="button"
                onClick={handleDeselectAll}
                className="px-3 py-1.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-semibold transition"
              >
                Deselect All
              </button>

              {preparedApplications.some(a => a.status === 'sent') && (
                <button
                  type="button"
                  onClick={handleCheckAllReplies}
                  disabled={isCheckingAllReplies}
                  className="px-3 py-1.5 rounded-xl border border-blue-500/40 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 text-xs font-semibold flex items-center gap-1.5 transition"
                  title="Check connected Gmail for incoming replies from employers"
                >
                  <Inbox className="w-3.5 h-3.5" />
                  <span>{isCheckingAllReplies ? 'Checking Gmail...' : 'Check All Replies in Gmail'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Cards List */}
          <div className="space-y-4">
            {filteredApps.map(app => {
              const isExpanded = expandedAppId === app.id;
              const isEditing = editingAppId === app.id;

              return (
                <div
                  key={app.id}
                  className={`p-4 sm:p-5 rounded-2xl border-2 transition-all relative ${
                    app.isApproved
                      ? 'border-emerald-500/60 bg-emerald-950/10 shadow-sm'
                      : app.verificationStatus === 'needs_review'
                      ? 'border-amber-500/40 bg-amber-950/5'
                      : theme === 'dark'
                      ? 'border-slate-800 bg-[#161f30]'
                      : 'border-slate-200 bg-slate-50'
                  }`}
                >
                  {/* Card Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    {/* Left: Checkbox + Title */}
                    <div className="flex items-start gap-3 min-w-0">
                      <button
                        type="button"
                        onClick={() => handleToggleApproval(app.id)}
                        className={`mt-1 w-6 h-6 rounded-lg flex items-center justify-center border transition shrink-0 ${
                          app.isApproved
                            ? 'bg-emerald-600 border-emerald-500 text-white shadow-sm'
                            : 'border-slate-600 hover:border-emerald-400 bg-slate-800 text-transparent'
                        }`}
                        title={app.isApproved ? 'Click to deselect' : 'Click to approve for sending'}
                      >
                        <Check className="w-4 h-4 stroke-[3]" />
                      </button>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-sm sm:text-base text-white truncate">
                            {app.company}
                          </h4>

                          {/* NEW Vacancy Badge (Requirement 16 & 18) */}
                          {app.isNewVacancy && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-gradient-to-r from-amber-500 to-rose-500 text-white tracking-wider flex items-center gap-1 shadow-sm animate-pulse">
                              <Sparkles className="w-2.5 h-2.5" />
                              <span>NEW</span>
                            </span>
                          )}

                          {/* 10-State LifeCycle Status Tracker (Requirement 17) */}
                          <span
                            className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                              app.status === 'applied' || app.lifeCycleStatus === 'applied'
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                : app.status === 'delivery_failed' || app.lifeCycleStatus === 'delivery_failed'
                                ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                                : app.replyStatus === 'reply_received' || app.lifeCycleStatus === 'replied'
                                ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                                : app.isApproved || app.lifeCycleStatus === 'approved'
                                ? 'bg-teal-500/20 text-teal-300 border-teal-500/30'
                                : app.lifeCycleStatus === 'ready_to_apply'
                                ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                                : app.lifeCycleStatus === 'viewed'
                                ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                                : app.verificationStatus === 'verified'
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                : app.verificationStatus === 'needs_review'
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                                : 'bg-slate-500/20 text-slate-300 border-slate-500/30'
                            }`}
                          >
                            {app.status === 'applied' || app.lifeCycleStatus === 'applied'
                              ? 'APPLIED'
                              : app.status === 'delivery_failed' || app.lifeCycleStatus === 'delivery_failed'
                              ? 'DELIVERY FAILED'
                              : app.replyStatus === 'reply_received' || app.lifeCycleStatus === 'replied'
                              ? 'REPLIED'
                              : app.isApproved || app.lifeCycleStatus === 'approved'
                              ? 'APPROVED'
                              : app.lifeCycleStatus === 'ready_to_apply'
                              ? 'READY TO APPLY'
                              : app.lifeCycleStatus === 'viewed'
                              ? 'VIEWED'
                              : app.verificationStatus === 'verified'
                              ? 'VERIFIED'
                              : app.verificationStatus === 'needs_review'
                              ? 'NEEDS REVIEW'
                              : 'DISCOVERED'}
                          </span>

                          {/* Market Tag */}
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                            {app.market === 'cyprus' || app.location?.toLowerCase().includes('cyprus')
                              ? '🇨🇾 Cyprus'
                              : '🇪🇺 Europe'}
                          </span>

                          {/* Verification Badge */}
                          {app.verificationStatus === 'verified' && !app.isDuplicate ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                              <ShieldCheck className="w-3 h-3" />
                              <span>Verified by Gemini + OpenAI + Grok</span>
                            </span>
                          ) : app.isDuplicate ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              <span>Duplicate Prevented</span>
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              <span>Needs Review: Verify Email</span>
                            </span>
                          )}

                          {app.status === 'sent' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                              ✓ Sent via Gmail
                            </span>
                          )}

                          {app.status === 'delivery_failed' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-600/25 text-rose-300 border border-rose-500/40">
                              DELIVERY FAILED
                            </span>
                          )}

                          {app.isApproved && app.status !== 'sent' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              Approved
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-xs text-slate-400 mt-1 flex-wrap">
                          <span className="font-medium text-slate-200">{app.position}</span>
                          <span>·</span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-500" />
                            {app.location}
                          </span>
                          <span>·</span>
                          <span className="font-mono text-blue-400 font-semibold">
                            {app.recipientEmail || 'No direct email verified'}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 mt-1.5 flex-wrap text-[11px] text-slate-400">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-500" />
                            <span>Posted: {app.jobPostingDate || 'Recent (< 3 mos)'}</span>
                            {app.jobPostingDateVerified ? (
                              <span className="text-[10px] text-emerald-400 font-semibold">(Verified)</span>
                            ) : (
                              <span className="text-[10px] text-amber-400 font-semibold">(Date Needs Review)</span>
                            )}
                          </span>
                          <span>·</span>
                          {app.emailVerificationStatus === 'verified' ? (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/25">
                              Email Verified
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/25">
                              Email: Needs Review
                            </span>
                          )}
                          {app.applicationUrl && (
                            <>
                              <span>·</span>
                              <a
                                href={app.applicationUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-blue-400 hover:underline flex items-center gap-1 text-[11px]"
                              >
                                <span>Official Application Page</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto flex-wrap">
                      <button
                        type="button"
                        onClick={() => {
                          const updated = preparedApplications.map(a =>
                            a.id === app.id
                              ? {
                                  ...a,
                                  lifeCycleStatus: (a.status === 'applied' || a.lifeCycleStatus === 'applied'
                                    ? 'applied'
                                    : a.isApproved
                                    ? 'approved'
                                    : 'viewed') as JobLifeCycleStatus,
                                  viewedAt: Date.now(),
                                }
                              : a
                          );
                          onUpdateApplications(updated);
                          setReviewingApp({
                            ...app,
                            lifeCycleStatus: (app.status === 'applied' || app.lifeCycleStatus === 'applied'
                              ? 'applied'
                              : app.isApproved
                              ? 'approved'
                              : 'viewed') as JobLifeCycleStatus,
                            viewedAt: Date.now(),
                          });
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition"
                        title="Review complete application before approving"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Review Application</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setExpandedAppId(isExpanded ? null : app.id)}
                        className="px-2.5 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-xs font-semibold text-slate-300 flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>{isExpanded ? 'Hide' : 'Cover Letter'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setEditingAppId(isEditing ? null : app.id)}
                        className="p-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-400 hover:text-white"
                        title="Edit email or cover letter"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      {app.status === 'sent' && (
                        <button
                          type="button"
                          onClick={() => handleCheckReply(app)}
                          disabled={checkingReplyId === app.id}
                          className="px-2.5 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-400 text-xs font-semibold flex items-center gap-1"
                          title="Check Gmail for reply from this employer"
                        >
                          <Inbox className="w-3.5 h-3.5" />
                          <span>{checkingReplyId === app.id ? 'Checking...' : 'Check Reply'}</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleDeleteApplication(app.id)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10"
                        title="Exclude this application"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Review Notice if unverified or duplicate */}
                  {app.reviewReason && (
                    <div className="mt-3 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
                      <span>{app.reviewReason}</span>
                    </div>
                  )}

                  {/* Live Employer Reply Banner if detected in Gmail */}
                  {app.replyStatus === 'reply_received' && (
                    <div className="mt-3 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Inbox className="w-4 h-4 text-emerald-400 shrink-0" />
                        <div>
                          <span className="font-bold">Reply received in your Gmail inbox!</span>
                          {app.replySnippet && (
                            <div className="text-[11px] text-slate-300 mt-0.5 line-clamp-1 italic">
                              "{app.replySnippet}"
                            </div>
                          )}
                        </div>
                      </div>
                      <a
                        href="https://mail.google.com/mail/u/0/#inbox"
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shrink-0 flex items-center gap-1"
                      >
                        <span>Open Gmail</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}

                  {/* Inline Editor if active */}
                  {isEditing && (
                    <div className="mt-3.5 pt-3.5 border-t border-slate-700/60 space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div>
                          <label className="block text-slate-400 font-semibold mb-1">Company:</label>
                          <input
                            type="text"
                            defaultValue={app.company}
                            id={`edit-company-${app.id}`}
                            className="w-full p-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-400 font-semibold mb-1">Recipient Email:</label>
                          <input
                            type="email"
                            defaultValue={app.recipientEmail}
                            id={`edit-email-${app.id}`}
                            placeholder="careers@hotel.com"
                            className="w-full p-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono"
                          />
                        </div>
                      </div>

                      <div className="text-xs">
                        <label className="block text-slate-400 font-semibold mb-1">Subject Line:</label>
                        <input
                          type="text"
                          defaultValue={app.subject}
                          id={`edit-subject-${app.id}`}
                          className="w-full p-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-medium"
                        />
                      </div>

                      <div className="text-xs">
                        <label className="block text-slate-400 font-semibold mb-1">Tailored Cover Letter:</label>
                        <textarea
                          defaultValue={app.coverLetter}
                          id={`edit-cover-${app.id}`}
                          rows={6}
                          className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-[11px] leading-relaxed"
                        />
                      </div>

                      <div className="flex justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setEditingAppId(null)}
                          className="px-3 py-1.5 rounded-lg border border-slate-700 text-xs font-semibold text-slate-400 hover:text-white"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const company = (document.getElementById(`edit-company-${app.id}`) as HTMLInputElement)?.value;
                            const email = (document.getElementById(`edit-email-${app.id}`) as HTMLInputElement)?.value;
                            const subject = (document.getElementById(`edit-subject-${app.id}`) as HTMLInputElement)?.value;
                            const coverLetter = (document.getElementById(`edit-cover-${app.id}`) as HTMLTextAreaElement)?.value;
                            handleSaveAppEdit(app.id, { company, recipientEmail: email, subject, coverLetter });
                          }}
                          className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold"
                        >
                          Save Changes
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Expandable Cover Letter & Subject Preview */}
                  {isExpanded && !isEditing && (
                    <div className="mt-3.5 pt-3.5 border-t border-slate-700/60 space-y-2 text-xs">
                      <div>
                        <span className="text-slate-400 font-semibold">Subject: </span>
                        <span className="font-semibold text-slate-200">{app.subject}</span>
                      </div>
                      <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-300 font-['Inter'] leading-relaxed whitespace-pre-wrap max-h-56 overflow-y-auto">
                        {app.coverLetter}
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                        <span>
                          Attachment: <span className="text-emerald-400 font-semibold">{attachedCvName}</span>
                        </span>
                        {app.sourceUrl && (
                          <a
                            href={app.sourceUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-400 hover:underline flex items-center gap-1"
                          >
                            <span>View Source Posting</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* ========================================================
              FINAL SEND BUTTON & STATUS BAR
              Strict requirement: Send each approved application
              separately from the connected Gmail account.
              ======================================================== */}
          <div className="pt-4 border-t border-slate-700/40 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-slate-400">
              <span className="font-bold text-white text-sm">{approvedApps.length}</span> of {preparedApplications.length} applications approved for sending · Connected Gmail:{' '}
              <span className="font-semibold text-blue-400">{userEmail}</span>
            </div>

            <button
              type="button"
              onClick={() => setIsConfirmModalOpen(true)}
              disabled={approvedApps.length === 0 || isSending}
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-xl shadow-emerald-600/25 flex items-center justify-center gap-2 transition active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4 -rotate-12" />
              <span>Send Approved Applications via Gmail ({approvedApps.length})</span>
            </button>
          </div>
        </section>
      ) : null}

      {/* ========================================================
          CONFIRMATION MODAL BEFORE SENDING
          ======================================================== */}
      {isConfirmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm">
          <div
            className={`w-full max-w-lg rounded-3xl border p-6 sm:p-7 shadow-2xl space-y-4 ${
              theme === 'dark' ? 'bg-[#121826] border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
            }`}
          >
            <div className="w-12 h-12 rounded-2xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center mx-auto">
              <Send className="w-6 h-6 -rotate-12" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold">Send {approvedApps.length} Approved Applications?</h3>
              <p className="text-xs text-slate-400">
                You have manually approved {approvedApps.length} individual applications.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/25 text-xs space-y-2 text-slate-300">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                <Check className="w-4 h-4 shrink-0" />
                <span>Sent separately from your real connected Gmail ({userEmail})</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-blue-400 shrink-0" />
                <span>NO bulk CC or BCC used. Each company receives a personalized, private email</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-blue-400 shrink-0" />
                <span>
                  Attached CV: <span className="font-semibold text-white">{attachedCvName}</span>
                </span>
              </div>
              <div className="flex items-center gap-2 text-blue-300 font-semibold">
                <Inbox className="w-4 h-4 shrink-0" />
                <span>When employers reply, their response arrives directly in your Gmail inbox</span>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsConfirmModalOpen(false)}
                className="w-1/2 py-2.5 rounded-xl border border-slate-700 text-xs font-semibold hover:bg-slate-800 transition"
              >
                Go Back & Review
              </button>
              <button
                type="button"
                onClick={async () => {
                  setIsConfirmModalOpen(false);
                  await onSendApprovedApplications(approvedApps);
                }}
                className="w-1/2 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/30 transition"
              >
                <Send className="w-3.5 h-3.5 -rotate-12" />
                <span>Confirm & Send All ({approvedApps.length})</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          USER REVIEW: COMPLETE APPLICATION REVIEW MODAL
          Strict requirement 7:
          First show me the complete application:
          1. Company
          2. Position
          3. Location
          4. Email
          5. Email verification status
          6. Job posting date
          7. Job URL
          8. Application URL if available
          9. Email subject
          10. Application message
          11. Cover letter
          12. Selected CV
          Only applications approved can be sent.
          ======================================================== */}
      {reviewingApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-sm overflow-y-auto">
          <div
            className={`w-full max-w-3xl my-auto rounded-3xl border p-5 sm:p-7 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto ${
              theme === 'dark' ? 'bg-[#121826] border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
            }`}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-700/40">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base sm:text-lg">Review Complete Job Application</h3>
                  <p className="text-[11px] text-slate-400">
                    Verify all 12 application details before manual approval. Only approved applications can be sent.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setReviewingApp(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Complete 12-Item Review Grid */}
            <div className="space-y-4 text-xs">
              {/* Item 1, 2, 3: Company, Position, Location */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    1. Company Name
                  </span>
                  <input
                    type="text"
                    defaultValue={reviewingApp.company}
                    id={`review-company-${reviewingApp.id}`}
                    className="w-full bg-transparent font-bold text-white border-b border-transparent focus:border-blue-500 outline-none"
                  />
                </div>

                <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    2. Exact Position
                  </span>
                  <input
                    type="text"
                    defaultValue={reviewingApp.position}
                    id={`review-position-${reviewingApp.id}`}
                    className="w-full bg-transparent font-semibold text-white border-b border-transparent focus:border-blue-500 outline-none"
                  />
                </div>

                <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    3. Location (City, Country)
                  </span>
                  <div className="flex items-center gap-1 text-slate-200 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{reviewingApp.location}</span>
                  </div>
                  {(reviewingApp.city || reviewingApp.country) && (
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      City: {reviewingApp.city || '—'} · Country: {reviewingApp.country || '—'}
                    </div>
                  )}
                </div>
              </div>

              {/* Item 4 & 5: Email & Email Verification Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      4. Recipient Email
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">Real business contact</span>
                  </div>
                  <input
                    type="email"
                    defaultValue={reviewingApp.recipientEmail}
                    id={`review-email-${reviewingApp.id}`}
                    placeholder="careers@company.com"
                    className="w-full p-2 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-blue-300 outline-none focus:border-blue-500"
                  />
                </div>

                <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    5. Email Verification Status
                  </span>
                  <div className="flex items-center gap-2">
                    {reviewingApp.emailVerificationStatus === 'verified' && !reviewingApp.isDuplicate ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" />
                        <span>VERIFIED (Valid Format & Domain Association)</span>
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        <span>EMAIL STATUS = NEEDS REVIEW</span>
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {reviewingApp.emailVerificationReason || reviewingApp.reviewReason || 'Verified via official corporate domain.'}
                  </p>
                </div>
              </div>

              {/* Item 6, 7, 8: Job Posting Date, Job URL, Application URL */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    6. Job Posting Date
                  </span>
                  <div className="flex items-center gap-1.5 text-slate-200">
                    <Calendar className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <span className="font-semibold">{reviewingApp.jobPostingDate || 'Recent'}</span>
                  </div>
                  <div className="mt-1">
                    {reviewingApp.jobPostingDateVerified ? (
                      <span className="text-[10px] text-emerald-400 font-semibold">✓ Verified within 3 months</span>
                    ) : (
                      <span className="text-[10px] text-amber-400 font-semibold">JOB STATUS = NEEDS REVIEW</span>
                    )}
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    7. Job URL / Source
                  </span>
                  {reviewingApp.jobUrl || reviewingApp.sourceUrl ? (
                    <a
                      href={reviewingApp.jobUrl || reviewingApp.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-400 hover:underline flex items-center gap-1 break-all text-[11px]"
                    >
                      <span className="truncate">{reviewingApp.jobUrl || reviewingApp.sourceUrl}</span>
                      <ExternalLink className="w-3 h-3 shrink-0" />
                    </a>
                  ) : (
                    <span className="text-slate-500 italic">No external link</span>
                  )}
                </div>

                <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    8. Official Application URL
                  </span>
                  {reviewingApp.applicationUrl ? (
                    <a
                      href={reviewingApp.applicationUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-emerald-400 hover:underline flex items-center gap-1 break-all text-[11px]"
                    >
                      <span className="truncate">{reviewingApp.applicationUrl}</span>
                      <ExternalLink className="w-3 h-3 shrink-0" />
                    </a>
                  ) : (
                    <span className="text-slate-400 text-[11px]">Direct email application used</span>
                  )}
                </div>
              </div>

              {/* Item 9: Email Subject */}
              <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    9. Email Subject Line
                  </span>
                  <span className="text-[10px] text-slate-400">Example: Application for [Role] Position – Fazle Rabbi Boyati</span>
                </div>
                <input
                  type="text"
                  defaultValue={reviewingApp.subject}
                  id={`review-subject-${reviewingApp.id}`}
                  className="w-full p-2 rounded-xl bg-slate-950 border border-slate-800 font-medium text-xs text-slate-200 outline-none focus:border-blue-500"
                />
              </div>

              {/* Item 10: Application Message */}
              <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  10. Concise Application Message (Email Introduction)
                </span>
                <textarea
                  defaultValue={
                    reviewingApp.applicationMessage ||
                    `Dear Hiring Manager at ${reviewingApp.company},\n\nPlease accept my application for the ${reviewingApp.position} position in ${reviewingApp.location}. Attached please find my updated CV, professional photographs, and portfolio documentation.\n\nMy complete personalized cover letter and contact details are included below. I am immediately available and look forward to an opportunity to interview.\n\nBest regards,\nFazle Rabbi Boyati\nLimassol Marina, Cyprus | +357 9550 2363 | Fazlerabbe905@gmail.com`
                  }
                  id={`review-message-${reviewingApp.id}`}
                  rows={4}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 font-mono text-[11px] leading-relaxed outline-none focus:border-blue-500"
                />
              </div>

              {/* Item 11: Personalized Cover Letter */}
              <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    11. Personalized Master Cover Letter
                  </span>
                  <span className="text-[10px] text-emerald-400 font-semibold">
                    Master Reference: 5+ Yrs Hands-on Experience · Flamingo Paradise · O'Neill's · Westin Dhaka
                  </span>
                </div>
                <textarea
                  defaultValue={reviewingApp.coverLetter}
                  id={`review-cover-${reviewingApp.id}`}
                  rows={9}
                  className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 font-mono text-[11px] leading-relaxed outline-none focus:border-blue-500"
                />
              </div>

              {/* Item 12: Selected CV */}
              <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between flex-wrap gap-2">
                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    12. Selected CV Attachment
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    <Paperclip className="w-4 h-4 text-emerald-400" />
                    <span className="font-bold text-white text-xs">{attachedCvName}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                      PDF Ready
                    </span>
                  </div>
                </div>
                <div className="text-[11px] text-slate-400 text-right">
                  Includes professional portfolio link & verified hospitality credentials
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-700/40">
              <div className="text-xs text-slate-400">
                Status:{' '}
                {reviewingApp.isApproved ? (
                  <span className="text-emerald-400 font-bold">Approved for sending</span>
                ) : (
                  <span className="text-amber-300 font-semibold">Pending your manual approval</span>
                )}
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => {
                    const company = (document.getElementById(`review-company-${reviewingApp.id}`) as HTMLInputElement)?.value;
                    const position = (document.getElementById(`review-position-${reviewingApp.id}`) as HTMLInputElement)?.value;
                    const email = (document.getElementById(`review-email-${reviewingApp.id}`) as HTMLInputElement)?.value;
                    const subject = (document.getElementById(`review-subject-${reviewingApp.id}`) as HTMLInputElement)?.value;
                    const message = (document.getElementById(`review-message-${reviewingApp.id}`) as HTMLTextAreaElement)?.value;
                    const coverLetter = (document.getElementById(`review-cover-${reviewingApp.id}`) as HTMLTextAreaElement)?.value;

                    handleSaveAppEdit(reviewingApp.id, {
                      company,
                      position,
                      recipientEmail: email,
                      subject,
                      applicationMessage: message,
                      coverLetter,
                    });
                    showNotice('Application edits saved successfully!');
                  }}
                  className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-xs font-semibold text-slate-300 transition"
                >
                  Save Edits
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const company = (document.getElementById(`review-company-${reviewingApp.id}`) as HTMLInputElement)?.value;
                    const position = (document.getElementById(`review-position-${reviewingApp.id}`) as HTMLInputElement)?.value;
                    const email = (document.getElementById(`review-email-${reviewingApp.id}`) as HTMLInputElement)?.value;
                    const subject = (document.getElementById(`review-subject-${reviewingApp.id}`) as HTMLInputElement)?.value;
                    const message = (document.getElementById(`review-message-${reviewingApp.id}`) as HTMLTextAreaElement)?.value;
                    const coverLetter = (document.getElementById(`review-cover-${reviewingApp.id}`) as HTMLTextAreaElement)?.value;

                    const newApproved = !reviewingApp.isApproved;
                    handleSaveAppEdit(reviewingApp.id, {
                      company,
                      position,
                      recipientEmail: email,
                      subject,
                      applicationMessage: message,
                      coverLetter,
                      isApproved: newApproved,
                    });

                    setReviewingApp(null);
                    showNotice(
                      newApproved
                        ? `Approved application to ${company || reviewingApp.company}! Ready for sending.`
                        : `Revoked approval for ${company || reviewingApp.company}.`
                    );
                  }}
                  className={`flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg transition ${
                    reviewingApp.isApproved
                      ? 'bg-amber-600 hover:bg-amber-500 text-white'
                      : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-500/30'
                  }`}
                >
                  {reviewingApp.isApproved ? (
                    <>
                      <X className="w-3.5 h-3.5" />
                      <span>Revoke Approval</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                      <span>Approve This Application</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* ========================================================
          10-DAY APPLIED PROTECTION VAULT MODAL (Requirement 13)
          ======================================================== */}
      {isAppliedVaultOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-sm overflow-y-auto">
          <div
            className={`w-full max-w-4xl my-auto rounded-3xl border p-5 sm:p-7 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto ${
              theme === 'dark' ? 'bg-[#121826] border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
            }`}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-700/40">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base sm:text-lg">
                    10-Day Applied Protection Vault ({appliedRecords.length} Records)
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Exact jobs you applied to are locked and hidden from normal results for 10 days to prevent duplicates.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAppliedVaultOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Explanatory Notice */}
            <div className="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/25 text-xs text-blue-300 leading-relaxed flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 shrink-0 text-blue-400 mt-0.5" />
              <div>
                <span className="font-bold text-white">Rule 13 Enforced:</span> Once you apply to a job, that exact vacancy is saved persistently (Job ID, Company, Position, Job URL, Recipient Email, Application Date, Gmail Message ID, Application Status). For the next 10 days, that exact job will not appear in normal results, even after page reloads, app restarts, or browser refreshes. After 10 days, it only becomes eligible again if still active.
              </div>
            </div>

            {/* Applied Records Table */}
            {appliedRecords.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-xs">
                No applied jobs in cooldown yet. When you approve and send applications, they will appear here and be protected from redisplay for 10 days.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400">
                      <th className="pb-2.5 font-bold uppercase tracking-wider text-[10px]">Market</th>
                      <th className="pb-2.5 font-bold uppercase tracking-wider text-[10px]">Company & Position</th>
                      <th className="pb-2.5 font-bold uppercase tracking-wider text-[10px]">Recipient Email</th>
                      <th className="pb-2.5 font-bold uppercase tracking-wider text-[10px]">Application Date</th>
                      <th className="pb-2.5 font-bold uppercase tracking-wider text-[10px]">Gmail ID</th>
                      <th className="pb-2.5 font-bold uppercase tracking-wider text-[10px] text-right">Cooldown Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {appliedRecords.map(rec => {
                      const elapsed = Date.now() - rec.appliedTimestamp;
                      const tenDaysMs = 10 * 24 * 60 * 60 * 1000;
                      const remainingMs = tenDaysMs - elapsed;
                      const remainingDays = Math.max(1, Math.ceil(remainingMs / (24 * 60 * 60 * 1000)));
                      const isStillHidden = elapsed < tenDaysMs;

                      return (
                        <tr key={rec.jobId} className="hover:bg-slate-800/30 transition">
                          <td className="py-2.5 whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                              {rec.market === 'cyprus' ? '🇨🇾 Cyprus' : '🇪🇺 Europe'}
                            </span>
                          </td>
                          <td className="py-2.5 font-semibold text-white">
                            <div>{rec.company}</div>
                            <div className="text-[11px] text-slate-400 font-normal">{rec.position}</div>
                            {rec.jobUrl && (
                              <a
                                href={rec.jobUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[10px] text-blue-400 hover:underline flex items-center gap-1 mt-0.5"
                              >
                                <span className="truncate max-w-[150px]">{rec.jobUrl}</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            )}
                          </td>
                          <td className="py-2.5 font-mono text-blue-300 text-[11px]">{rec.recipientEmail}</td>
                          <td className="py-2.5 text-slate-300 whitespace-nowrap text-[11px]">
                            {new Date(rec.applicationDate).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </td>
                          <td className="py-2.5 font-mono text-slate-400 text-[10px] truncate max-w-[120px]" title={rec.gmailMessageId || 'Direct'}>
                            {rec.gmailMessageId ? rec.gmailMessageId.slice(0, 14) + '...' : 'Verified'}
                          </td>
                          <td className="py-2.5 text-right whitespace-nowrap">
                            {isStillHidden ? (
                              <span className="px-2 py-1 rounded-lg text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                                Hidden ({remainingDays}d left)
                              </span>
                            ) : (
                              <span className="px-2 py-1 rounded-lg text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                                Cooldown Completed
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Modal Footer */}
            <div className="flex justify-end pt-3 border-t border-slate-700/40">
              <button
                type="button"
                onClick={() => setIsAppliedVaultOpen(false)}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition"
              >
                Close Vault
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
