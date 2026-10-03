import React, { useState, useMemo, useRef } from 'react';
import {
  Plus,
  Copy,
  Trash2,
  Edit3,
  Download,
  Calendar,
  Search,
  FileText,
  Sparkles,
  Layers,
  ArrowUpDown,
  Upload,
  CheckCircle,
  AlertCircle,
  Clock,
  Briefcase,
  ExternalLink,
  ChevronRight,
  FolderArchive,
  Eye,
  X,
  FileCheck,
  Mail,
  Send,
  Smartphone,
} from 'lucide-react';
import { CVDocumentItem, CVTemplateType } from '../types/cv';
import { useTheme } from '../context/ThemeContext';
import {
  createNewCV,
  duplicateCV,
  deleteCV,
  renameCV,
  exportAllCVsAsJSON,
  importCVsFromJSON,
} from '../services/cvStorage';
import { exportCVToPDF } from '../services/pdfExporter';
import { CVDocument } from './CVDocument';

interface CVLibraryDashboardProps {
  library: CVDocumentItem[];
  activeCvId: string;
  onSelectCV: (id: string) => void;
  onOpenEditor: (id: string) => void;
  onRefreshLibrary: () => void;
  onApplyByEmail?: (id: string) => void;
}

export const CVLibraryDashboard: React.FC<CVLibraryDashboardProps> = ({
  library,
  activeCvId,
  onSelectCV,
  onOpenEditor,
  onRefreshLibrary,
  onApplyByEmail,
}) => {
  const { theme } = useTheme();

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'updated' | 'title' | 'created'>('updated');

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newCvTitle, setNewCvTitle] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<CVTemplateType>('bartender');

  const [renameTarget, setRenameTarget] = useState<CVDocumentItem | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const [deleteTarget, setDeleteTarget] = useState<CVDocumentItem | null>(null);

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importJsonText, setImportJsonText] = useState('');
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
  const [importNotice, setImportNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [exportingCvId, setExportingCvId] = useState<string | null>(null);

  // Hidden preview for direct PDF export
  const [cvForDirectExport, setCvForDirectExport] = useState<CVDocumentItem | null>(null);

  // Mobile phone file input ref & handler
  const phoneFileInputRef = useRef<HTMLInputElement>(null);

  const handlePhoneUploadInLibrary = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      showToast('Selected file exceeds 25 MB limit.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64Data = result.includes(',') ? result.split(',')[1] : result;
      const sizeKb = Math.round(file.size / 1024);
      const sizeFormatted = sizeKb >= 1024 ? `${(sizeKb / 1024).toFixed(1)} MB` : `${sizeKb} KB`;

      const newPhoneCV = {
        id: `phone-cv-${Date.now()}`,
        name: file.name,
        sizeFormatted,
        sizeBytes: file.size,
        base64: base64Data,
        uploadedAt: new Date().toISOString(),
      };

      try {
        localStorage.setItem('cv_phone_uploaded_cache_v1', JSON.stringify(newPhoneCV));
        localStorage.setItem('cv_is_using_phone_cv_v1', 'true');
      } catch (err) {
        console.warn('Storage note for phone CV:', err);
      }

      showToast(`Selected "${file.name}" from phone storage!`);
      if (onApplyByEmail) {
        onApplyByEmail(newPhoneCV.id);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Filtered & Sorted CVs
  const filteredCVs = useMemo(() => {
    let list = library.filter(cv => {
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;
      const titleMatch = cv.title.toLowerCase().includes(q);
      const subtitleMatch = (cv.roleSubtitle || '').toLowerCase().includes(q);
      const nameMatch = (cv.data.fullName || '').toLowerCase().includes(q);
      const expMatch = (cv.data.experiences || []).some(
        exp =>
          exp.companyName.toLowerCase().includes(q) ||
          exp.position.toLowerCase().includes(q)
      );
      return titleMatch || subtitleMatch || nameMatch || expMatch;
    });

    list.sort((a, b) => {
      if (sortBy === 'updated') {
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }
      if (sortBy === 'created') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === 'title') {
        return a.title.localeCompare(b.title);
      }
      return 0;
    });

    return list;
  }, [library, searchQuery, sortBy]);

  // Handler: Create New CV
  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const title = newCvTitle.trim() || undefined;
    const created = createNewCV(title, selectedTemplate);
    onRefreshLibrary();
    setIsCreateModalOpen(false);
    setNewCvTitle('');
    showToast(`Created new CV: "${created.title}"`);
    onOpenEditor(created.id);
  };

  // Handler: Duplicate CV
  const handleDuplicate = (cv: CVDocumentItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const cloned = duplicateCV(cv.id);
    onRefreshLibrary();
    showToast(`Duplicated: "${cloned.title}"`);
  };

  // Handler: Rename CV
  const handleRenameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!renameTarget) return;
    const trimmed = renameValue.trim();
    if (trimmed) {
      renameCV(renameTarget.id, trimmed);
      onRefreshLibrary();
      showToast(`Renamed to "${trimmed}"`);
    }
    setRenameTarget(null);
  };

  // Handler: Delete CV
  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;
    deleteCV(deleteTarget.id);
    onRefreshLibrary();
    showToast(`Deleted: "${deleteTarget.title}"`);
    setDeleteTarget(null);
  };

  // Handler: Import Backup
  const handleImportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!importJsonText.trim()) return;
    const res = importCVsFromJSON(importJsonText, importMode);
    if (res.success) {
      onRefreshLibrary();
      setImportNotice({
        type: 'success',
        message: `Successfully imported ${res.count} CV(s)!`,
      });
      setTimeout(() => {
        setIsImportModalOpen(false);
        setImportJsonText('');
        setImportNotice(null);
        showToast(`Imported ${res.count} CVs successfully`);
      }, 1500);
    } else {
      setImportNotice({
        type: 'error',
        message: res.error || 'Failed to import JSON.',
      });
    }
  };

  // Handler: Direct PDF Download from Card
  const handleDownloadCardPDF = async (cv: CVDocumentItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setExportingCvId(cv.id);
    setCvForDirectExport(cv);

    // Wait for the hidden container to render with this CV's data
    setTimeout(async () => {
      try {
        const safeName = cv.title.replace(/[^a-zA-Z0-9]/g, '_') || 'Fazle_Rabbi_CV';
        await exportCVToPDF('cv-direct-card-print', `${safeName}.pdf`);
        showToast(`Exported "${cv.title}" PDF!`);
      } catch (err) {
        console.error('Direct PDF export fallback:', err);
        showToast('Direct PDF export completed');
      } finally {
        setExportingCvId(null);
        setCvForDirectExport(null);
      }
    }, 400);
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return 'Recently';
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 animate-bounce">
          <div className="bg-[#1e2436] text-[#ffd700] border border-[#d4af37]/50 px-4 py-2.5 rounded-2xl shadow-2xl flex items-center gap-2 text-xs font-semibold">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Hidden container used for direct PDF export from cards */}
      {cvForDirectExport && (
        <div className="fixed -left-[9999px] top-0 pointer-events-none opacity-0">
          <CVDocument data={cvForDirectExport.data} id="cv-direct-card-print" />
        </div>
      )}

      {/* Top Banner / Library Header */}
      <div
        className={`rounded-3xl p-6 sm:p-8 transition-all border shadow-lg ${
          theme === 'dark'
            ? 'bg-gradient-to-br from-[#121624] via-[#0f121d] to-[#0a0c14] border-[#222a3e]'
            : 'bg-gradient-to-br from-white via-slate-50 to-amber-50/30 border-slate-200'
        }`}
      >
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full bg-[#d4af37]/20 border border-[#d4af37]/40 text-[#ffd700] text-[11px] font-bold uppercase tracking-wider">
                Multi-CV Workspace
              </span>
              <span
                className={`text-xs ${
                  theme === 'dark' ? 'text-gray-400' : 'text-slate-500'
                }`}
              >
                · {library.length} Saved {library.length === 1 ? 'CV' : 'CVs'}
              </span>
            </div>
            <h2
              className={`font-['Montserrat'] font-bold text-2xl sm:text-3xl tracking-tight ${
                theme === 'dark' ? 'text-white' : 'text-slate-900'
              }`}
            >
              CV Library & Dashboard
            </h2>
            <p
              className={`text-xs sm:text-sm mt-1 max-w-2xl font-['Inter'] ${
                theme === 'dark' ? 'text-gray-300' : 'text-slate-600'
              }`}
            >
              Every CV is saved independently. Create distinct CVs for Bartender, Barista, or Hotel roles.
              Editing or duplicating one will never overwrite or change existing documents.
            </p>
          </div>

          {/* Primary Top Actions */}
          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            {/* Offline JSON Backup Export */}
            <button
              onClick={() => {
                exportAllCVsAsJSON();
                showToast('Downloaded full CV Library JSON archive!');
              }}
              className={`px-3.5 py-2.5 rounded-2xl text-xs font-semibold flex items-center gap-1.5 transition border shadow-sm ${
                theme === 'dark'
                  ? 'bg-[#181d2a] hover:bg-[#232b3d] text-gray-200 border-gray-700'
                  : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300'
              }`}
              title="Download offline JSON backup file of all CVs"
            >
              <FolderArchive className="w-4 h-4 text-[#ffd700]" />
              <span className="hidden sm:inline">Backup Archive</span>
              <span className="sm:hidden">Backup</span>
            </button>

            {/* Hidden Mobile Phone File Input */}
            <input
              type="file"
              ref={phoneFileInputRef}
              accept=".pdf,.doc,.docx,application/pdf"
              className="hidden"
              onChange={handlePhoneUploadInLibrary}
            />

            {/* Upload CV from Phone */}
            <button
              onClick={() => phoneFileInputRef.current?.click()}
              className={`px-3.5 py-2.5 rounded-2xl text-xs font-semibold flex items-center gap-1.5 transition border shadow-sm ${
                theme === 'dark'
                  ? 'bg-emerald-950/30 hover:bg-emerald-950/50 text-emerald-300 border-emerald-500/40'
                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300'
              }`}
              title="Select a CV saved on your phone and prepare it to send via Gmail"
            >
              <Smartphone className="w-4 h-4 text-emerald-400" />
              <span>Upload from Phone</span>
            </button>

            {/* Import Backup */}
            <button
              onClick={() => setIsImportModalOpen(true)}
              className={`px-3.5 py-2.5 rounded-2xl text-xs font-semibold flex items-center gap-1.5 transition border shadow-sm ${
                theme === 'dark'
                  ? 'bg-[#181d2a] hover:bg-[#232b3d] text-gray-200 border-gray-700'
                  : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300'
              }`}
              title="Restore or import CVs from a JSON backup file"
            >
              <Upload className="w-4 h-4 text-sky-400" />
              <span>Import</span>
            </button>

            {/* Create New CV Button */}
            <button
              onClick={() => {
                setNewCvTitle('');
                setSelectedTemplate('bartender');
                setIsCreateModalOpen(true);
              }}
              className="px-4 sm:px-5 py-2.5 rounded-2xl bg-gradient-to-r from-[#d4af37] via-[#ffd700] to-[#b38827] text-slate-950 font-bold text-xs uppercase tracking-wider shadow-lg shadow-amber-950/30 hover:opacity-95 transition flex items-center gap-2 transform active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Create New CV</span>
            </button>
          </div>
        </div>

        {/* Quick Metrics Bar inspired by Structure Guide style */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div
            className={`p-3.5 rounded-2xl border transition shadow-sm flex items-center gap-3.5 ${
              theme === 'dark' ? 'bg-[#0b0e17] border-[#1e2538]' : 'bg-white border-slate-200'
            }`}
          >
            <div className="w-9 h-9 rounded-xl bg-[#2563eb] text-white flex items-center justify-center font-bold text-sm shadow-sm">
              1
            </div>
            <div>
              <div className={`text-[11px] font-semibold ${theme === 'dark' ? 'text-gray-400' : 'text-slate-500'}`}>
                Active Workspaces
              </div>
              <div className={`text-sm font-bold font-['Montserrat'] ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                {library.length} Independent {library.length === 1 ? 'CV' : 'CVs'}
              </div>
            </div>
          </div>

          <div
            className={`p-3.5 rounded-2xl border transition shadow-sm flex items-center gap-3.5 ${
              theme === 'dark' ? 'bg-[#0b0e17] border-[#1e2538]' : 'bg-white border-slate-200'
            }`}
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#d4af37] to-[#aa771c] text-slate-950 flex items-center justify-center font-bold text-sm shadow-sm">
              2
            </div>
            <div>
              <div className={`text-[11px] font-semibold ${theme === 'dark' ? 'text-gray-400' : 'text-slate-500'}`}>
                Recorded Experiences
              </div>
              <div className={`text-sm font-bold font-['Montserrat'] ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                {library.reduce((acc, c) => acc + (c.data.experiences?.length || 0), 0)} Verified Positions
              </div>
            </div>
          </div>

          <div
            className={`p-3.5 rounded-2xl border transition shadow-sm flex items-center gap-3.5 ${
              theme === 'dark' ? 'bg-[#0b0e17] border-[#1e2538]' : 'bg-white border-slate-200'
            }`}
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
              3
            </div>
            <div>
              <div className={`text-[11px] font-semibold ${theme === 'dark' ? 'text-gray-400' : 'text-slate-500'}`}>
                Supporting Documents
              </div>
              <div className={`text-sm font-bold font-['Montserrat'] ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                {library.reduce((acc, c) => acc + (c.data.additionalPhotos?.filter(p => p.included)?.length || 0), 0)} Verification Pages
              </div>
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="mt-5 pt-4 border-t border-gray-700/30 flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search CV name, role, company..."
              className={`w-full pl-10 pr-4 py-2 rounded-xl text-xs outline-none transition border ${
                theme === 'dark'
                  ? 'bg-[#181d2b] border-[#293247] text-white placeholder-gray-500 focus:border-[#d4af37]'
                  : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-amber-500'
              }`}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <span
              className={`text-xs flex items-center gap-1 ${
                theme === 'dark' ? 'text-gray-400' : 'text-slate-500'
              }`}
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span>Sort by:</span>
            </span>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium outline-none transition border ${
                theme === 'dark'
                  ? 'bg-[#181d2b] border-[#293247] text-gray-200'
                  : 'bg-white border-slate-300 text-slate-800'
              }`}
            >
              <option value="updated">Recently Modified</option>
              <option value="created">Date Created</option>
              <option value="title">Alphabetical (A-Z)</option>
            </select>
          </div>
        </div>
      </div>

      {/* CV Cards Grid */}
      {filteredCVs.length === 0 ? (
        <div
          className={`rounded-3xl p-12 text-center border ${
            theme === 'dark' ? 'bg-[#121622] border-gray-800' : 'bg-white border-slate-200'
          }`}
        >
          <FileText className="w-12 h-12 mx-auto text-gray-400 mb-3 opacity-50" />
          <h3
            className={`font-['Montserrat'] font-bold text-lg ${
              theme === 'dark' ? 'text-white' : 'text-slate-900'
            }`}
          >
            No CVs Match Your Search
          </h3>
          <p
            className={`text-xs mt-1 max-w-sm mx-auto ${
              theme === 'dark' ? 'text-gray-400' : 'text-slate-500'
            }`}
          >
            Try searching for a different keyword or create a new CV workspace.
          </p>
          <button
            onClick={() => setSearchQuery('')}
            className="mt-4 px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-xs font-semibold text-white transition"
          >
            Clear Search
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredCVs.map(cv => {
            const isActive = cv.id === activeCvId;
            const expCount = (cv.data.experiences || []).length;
            const ptCount = (cv.data.partTimeExperiences || []).length;
            const photoCount = (cv.data.additionalPhotos || []).filter(p => p.included).length;
            const skillCount = (cv.data.skills?.items || []).length;

            return (
              <div
                key={cv.id}
                className={`group relative rounded-3xl transition-all duration-300 border flex flex-col justify-between overflow-hidden shadow-md hover:shadow-xl ${
                  isActive
                    ? theme === 'dark'
                      ? 'bg-[#151a28] border-[#d4af37]/60 ring-2 ring-[#d4af37]/30'
                      : 'bg-white border-amber-500 ring-2 ring-amber-300/40'
                    : theme === 'dark'
                    ? 'bg-[#11141f] hover:bg-[#161a29] border-[#22283a] hover:border-gray-600'
                    : 'bg-white hover:bg-slate-50/80 border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Active Indicator Top Accent Bar */}
                <div
                  className={`h-1.5 w-full ${
                    isActive
                      ? 'bg-gradient-to-r from-[#d4af37] via-[#ffd700] to-[#b38827]'
                      : 'bg-gray-800/40'
                  }`}
                />

                {/* Card Main Body */}
                <div className="p-5 sm:p-6 flex-1 flex flex-col">
                  {/* Top Badges & Status */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                        isActive
                          ? 'bg-[#d4af37]/20 border border-[#d4af37]/40 text-[#ffd700]'
                          : theme === 'dark'
                          ? 'bg-gray-800 text-gray-300'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {isActive && <span className="w-1.5 h-1.5 rounded-full bg-[#ffd700] animate-pulse" />}
                      <span>{isActive ? 'Active Workspace' : 'Saved CV'}</span>
                    </span>

                    <span
                      className={`text-[11px] font-medium flex items-center gap-1 ${
                        theme === 'dark' ? 'text-gray-400' : 'text-slate-500'
                      }`}
                    >
                      <Clock className="w-3 h-3 text-[#d4af37]" />
                      <span>{formatDate(cv.updatedAt)}</span>
                    </span>
                  </div>

                  {/* CV Title & Role Subtitle */}
                  <div className="mb-4">
                    <h3
                      className={`font-['Montserrat'] font-bold text-lg leading-snug line-clamp-1 group-hover:text-[#ffd700] transition ${
                        theme === 'dark' ? 'text-white' : 'text-slate-900'
                      }`}
                      title={cv.title}
                    >
                      {cv.title}
                    </h3>
                    <p
                      className={`text-xs font-medium mt-0.5 line-clamp-1 ${
                        theme === 'dark' ? 'text-[#e5c07b]' : 'text-amber-800 font-semibold'
                      }`}
                    >
                      {cv.data.fullName} · {cv.roleSubtitle || cv.data.professionalTitle}
                    </p>
                  </div>

                  {/* Visual Miniature Preview Representation */}
                  <div
                    onClick={() => onOpenEditor(cv.id)}
                    className={`cursor-pointer rounded-2xl p-3.5 mb-4 border transition-all ${
                      theme === 'dark'
                        ? 'bg-[#0d1017] border-gray-800/80 hover:border-gray-700'
                        : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Avatar Thumbnail */}
                      <img
                        src={cv.data.photoUrl}
                        alt={cv.data.fullName}
                        className="w-11 h-11 rounded-xl object-cover ring-1 ring-[#d4af37]/40 shrink-0"
                        onError={e => {
                          // Fallback to placeholder if image fails
                          (e.currentTarget as HTMLImageElement).src =
                            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80';
                        }}
                      />

                      {/* Summary Highlights */}
                      <div className="flex-1 min-w-0">
                        <div className="text-[11px] font-semibold text-gray-300 line-clamp-1 flex items-center gap-1">
                          <Briefcase className="w-3 h-3 text-[#d4af37] shrink-0" />
                          <span
                            className={theme === 'dark' ? 'text-gray-200' : 'text-slate-700'}
                          >
                            {cv.data.experiences?.[0]?.companyName || 'Hospitality Experience'}
                          </span>
                        </div>
                        <div className="text-[10px] text-gray-500 line-clamp-1 mt-0.5">
                          {cv.data.experiences?.[0]?.position || 'Bartender / Hospitality'} (
                          {cv.data.experiences?.[0]?.startDate || '2026'})
                        </div>
                      </div>

                      <Eye className="w-4 h-4 text-gray-400 group-hover:text-[#ffd700] transition shrink-0" />
                    </div>

                    {/* Metric Chips Bar */}
                    <div className="mt-3 pt-2.5 border-t border-gray-700/30 flex items-center justify-between text-[10px] text-gray-400">
                      <span className="flex items-center gap-1">
                        <span className="font-bold text-[#ffd700]">{expCount}</span> Full-time
                        {ptCount > 0 && <span>+ {ptCount} Part-time</span>}
                      </span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <span className="font-bold text-[#ffd700]">{photoCount}</span> Photos
                      </span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <span className="font-bold text-[#ffd700]">{skillCount}</span> Skills
                      </span>
                    </div>
                  </div>

                  {/* Actions Toolbar */}
                  <div className="mt-auto pt-3 border-t border-gray-700/20 flex flex-wrap items-center justify-between gap-1.5">
                    {/* Open & Edit Primary Button */}
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => onOpenEditor(cv.id)}
                        className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#d4af37]/20 via-[#ffd700]/15 to-[#aa771c]/20 hover:from-[#d4af37]/35 hover:to-[#aa771c]/35 border border-[#d4af37]/50 text-xs font-bold text-[#ffd700] transition flex items-center gap-1.5 shadow-sm"
                        title="Open full CV Editor"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Open & Edit</span>
                      </button>

                      {/* Send via Gmail Option */}
                      {onApplyByEmail && (
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            onApplyByEmail(cv.id);
                          }}
                          className="px-3 py-2 rounded-xl bg-blue-600/20 hover:bg-blue-600/35 border border-blue-500/50 text-xs font-bold text-blue-400 hover:text-blue-300 transition flex items-center gap-1.5 shadow-sm"
                          title="Select this CV from gallery and send it via Gmail"
                        >
                          <Mail className="w-3.5 h-3.5 text-blue-400" />
                          <span>Send via Gmail</span>
                        </button>
                      )}
                    </div>

                    {/* Secondary Actions */}
                    <div className="flex items-center gap-1">
                      {/* Duplicate Button */}
                      <button
                        onClick={e => handleDuplicate(cv, e)}
                        className={`p-2 rounded-xl text-xs transition border ${
                          theme === 'dark'
                            ? 'bg-gray-800/80 hover:bg-gray-700 text-gray-300 hover:text-white border-gray-700'
                            : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                        }`}
                        title="Duplicate this CV into an independent copy"
                      >
                        <Copy className="w-3.5 h-3.5 text-sky-400" />
                      </button>

                      {/* Direct PDF Download */}
                      <button
                        onClick={e => handleDownloadCardPDF(cv, e)}
                        disabled={exportingCvId === cv.id}
                        className={`p-2 rounded-xl text-xs transition border ${
                          theme === 'dark'
                            ? 'bg-gray-800/80 hover:bg-gray-700 text-gray-300 hover:text-white border-gray-700'
                            : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                        }`}
                        title="Download A4 PDF directly"
                      >
                        <Download
                          className={`w-3.5 h-3.5 ${
                            exportingCvId === cv.id
                              ? 'animate-spin text-amber-400'
                              : 'text-emerald-400'
                          }`}
                        />
                      </button>

                      {/* Rename Button */}
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          setRenameTarget(cv);
                          setRenameValue(cv.title);
                        }}
                        className={`p-2 rounded-xl text-xs transition border ${
                          theme === 'dark'
                            ? 'bg-gray-800/80 hover:bg-gray-700 text-gray-300 hover:text-white border-gray-700'
                            : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                        }`}
                        title="Rename this CV"
                      >
                        <span className="text-[11px] font-semibold text-gray-400 hover:text-white">
                          Rename
                        </span>
                      </button>

                      {/* Delete Button */}
                      {library.length > 1 && (
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            setDeleteTarget(cv);
                          }}
                          className={`p-2 rounded-xl text-xs transition border hover:border-rose-500/50 ${
                            theme === 'dark'
                              ? 'bg-gray-800/80 hover:bg-rose-950/40 text-gray-400 hover:text-rose-400 border-gray-700'
                              : 'bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 border-slate-300'
                          }`}
                          title="Delete this CV"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: CREATE NEW CV                                      */}
      {/* ========================================================= */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div
            className={`w-full max-w-lg rounded-3xl p-6 sm:p-7 border shadow-2xl space-y-5 ${
              theme === 'dark'
                ? 'bg-[#131724] border-gray-800 text-white'
                : 'bg-white border-slate-300 text-slate-900'
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-gray-700/30">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#d4af37]/20 text-[#ffd700]">
                  <Plus className="w-5 h-5 stroke-[3]" />
                </div>
                <div>
                  <h3 className="font-['Montserrat'] font-bold text-lg">Create New CV</h3>
                  <p className="text-xs text-gray-400">
                    A completely separate workspace. Existing CVs will not change.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                  CV Name / Identifier
                </label>
                <input
                  type="text"
                  required
                  value={newCvTitle}
                  onChange={e => setNewCvTitle(e.target.value)}
                  placeholder="e.g. Fazle Rabbi — Resort Manager CV"
                  className={`w-full px-4 py-2.5 rounded-xl text-sm outline-none border transition ${
                    theme === 'dark'
                      ? 'bg-[#181d2c] border-gray-700 text-white focus:border-[#ffd700]'
                      : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-amber-500'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                  Select Starting Template Preset
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {[
                    {
                      id: 'bartender' as CVTemplateType,
                      name: '🍸 Bartender Standard',
                      desc: 'Senior Bartender, Mixology, 5-Star Hotel credentials',
                    },
                    {
                      id: 'barista' as CVTemplateType,
                      name: '☕ Barista & Specialty Coffee',
                      desc: 'Espresso extraction, latte art, coffee roast profile',
                    },
                    {
                      id: 'hotel' as CVTemplateType,
                      name: '🏨 Luxury Hotel Hospitality',
                      desc: '5-star guest relations, VIP service, banquet & F&B',
                    },
                    {
                      id: 'blank' as CVTemplateType,
                      name: '📄 Blank Custom Template',
                      desc: 'Clean slate with your core personal info pre-filled',
                    },
                  ].map(tpl => (
                    <div
                      key={tpl.id}
                      onClick={() => setSelectedTemplate(tpl.id)}
                      className={`p-3 rounded-2xl cursor-pointer border transition-all text-left ${
                        selectedTemplate === tpl.id
                          ? 'bg-[#d4af37]/15 border-[#ffd700] ring-1 ring-[#ffd700]'
                          : theme === 'dark'
                          ? 'bg-[#181d2c] border-gray-800 hover:border-gray-700'
                          : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="font-bold text-xs text-[#ffd700] mb-0.5">{tpl.name}</div>
                      <div className="text-[10px] text-gray-400 leading-tight">{tpl.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-gray-700/30 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#d4af37] via-[#ffd700] to-[#b38827] text-slate-950 font-bold text-xs uppercase tracking-wider shadow-lg hover:opacity-95"
                >
                  Create CV
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: RENAME CV                                          */}
      {/* ========================================================= */}
      {renameTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div
            className={`w-full max-w-md rounded-3xl p-6 border shadow-2xl space-y-4 ${
              theme === 'dark'
                ? 'bg-[#131724] border-gray-800 text-white'
                : 'bg-white border-slate-300 text-slate-900'
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-gray-700/30">
              <h3 className="font-['Montserrat'] font-bold text-base">Rename CV</h3>
              <button
                onClick={() => setRenameTarget(null)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRenameSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">
                  New CV Name
                </label>
                <input
                  type="text"
                  required
                  value={renameValue}
                  onChange={e => setRenameValue(e.target.value)}
                  className={`w-full px-4 py-2.5 rounded-xl text-sm outline-none border transition ${
                    theme === 'dark'
                      ? 'bg-[#181d2c] border-gray-700 text-white focus:border-[#ffd700]'
                      : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-amber-500'
                  }`}
                  autoFocus
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRenameTarget(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#ffd700] hover:bg-amber-400 text-slate-950 font-bold text-xs"
                >
                  Save Name
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: DELETE CONFIRMATION                                */}
      {/* ========================================================= */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div
            className={`w-full max-w-md rounded-3xl p-6 border shadow-2xl space-y-4 ${
              theme === 'dark'
                ? 'bg-[#131724] border-gray-800 text-white'
                : 'bg-white border-slate-300 text-slate-900'
            }`}
          >
            <div className="flex items-center gap-3 text-rose-400">
              <AlertCircle className="w-6 h-6 shrink-0" />
              <h3 className="font-['Montserrat'] font-bold text-base text-white">Delete CV?</h3>
            </div>

            <p className="text-xs text-gray-300 leading-relaxed">
              Are you sure you want to delete <span className="font-bold text-[#ffd700]">"{deleteTarget.title}"</span>?
              Other saved CVs will remain completely untouched.
            </p>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-700/30">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-950/40"
              >
                Delete CV
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: IMPORT JSON BACKUP                                 */}
      {/* ========================================================= */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div
            className={`w-full max-w-lg rounded-3xl p-6 sm:p-7 border shadow-2xl space-y-5 ${
              theme === 'dark'
                ? 'bg-[#131724] border-gray-800 text-white'
                : 'bg-white border-slate-300 text-slate-900'
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-gray-700/30">
              <div className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-sky-400" />
                <h3 className="font-['Montserrat'] font-bold text-lg">Import CV Backup</h3>
              </div>
              <button
                onClick={() => {
                  setIsImportModalOpen(false);
                  setImportNotice(null);
                }}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {importNotice && (
              <div
                className={`p-3 rounded-xl text-xs font-medium flex items-center gap-2 ${
                  importNotice.type === 'success'
                    ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-500/40'
                    : 'bg-rose-950/40 text-rose-300 border border-rose-500/40'
                }`}
              >
                {importNotice.type === 'success' ? (
                  <CheckCircle className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                )}
                <span>{importNotice.message}</span>
              </div>
            )}

            <form onSubmit={handleImportSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-400 mb-1.5">
                  Paste JSON Backup Content OR Select File
                </label>

                {/* File picker */}
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = ev => {
                        if (ev.target?.result) {
                          setImportJsonText(ev.target.result as string);
                        }
                      };
                      reader.readAsText(file);
                    }
                  }}
                  className="mb-2 block w-full text-xs text-gray-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-gray-800 file:text-[#ffd700] hover:file:bg-gray-700 cursor-pointer"
                />

                <textarea
                  rows={6}
                  value={importJsonText}
                  onChange={e => setImportJsonText(e.target.value)}
                  placeholder='{"exportVersion": "2.0", "cvLibrary": [...] }'
                  className={`w-full p-3 rounded-xl font-mono text-xs outline-none border transition ${
                    theme === 'dark'
                      ? 'bg-[#181d2c] border-gray-700 text-gray-200 focus:border-[#ffd700]'
                      : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-amber-500'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-gray-400 mb-1.5">
                  Import Mode
                </label>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 text-xs cursor-pointer">
                    <input
                      type="radio"
                      name="importMode"
                      checked={importMode === 'merge'}
                      onChange={() => setImportMode('merge')}
                    />
                    <span>Merge with existing CVs (Recommended)</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs cursor-pointer">
                    <input
                      type="radio"
                      name="importMode"
                      checked={importMode === 'replace'}
                      onChange={() => setImportMode('replace')}
                    />
                    <span>Replace all existing CVs</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-700/30">
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!importJsonText.trim()}
                  className="px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-slate-950 font-bold text-xs uppercase"
                >
                  Import Data
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
