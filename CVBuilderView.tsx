import React, { useState, useEffect, useMemo } from 'react';
import { CVData, CVDocumentItem } from '../types/cv';
import {
  loadCVLibrary,
  saveCVLibrary,
  getActiveCVId,
  setActiveCVId,
  getCVById,
  updateCVData,
  createNewCV,
  duplicateCV,
} from '../services/cvStorage';
import { exportCVToPDF } from '../services/pdfExporter';
import { CVDocument } from '../components/CVDocument';
import { CVEditor } from '../components/CVEditor';
import { CVLibraryDashboard } from '../components/CVLibraryDashboard';
import { ApplyByEmailView } from './ApplyByEmailView';
import { CCDLogo } from '../components/CCDLogo';
import { ThemeToggle, useTheme } from '../context/ThemeContext';
import {
  Download,
  Printer,
  Save,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Eye,
  Edit3,
  CheckCircle,
  ArrowLeft,
  Layers,
  ChevronDown,
  Plus,
  Copy,
  FolderOpen,
  Lock,
  Mail,
} from 'lucide-react';

interface CVBuilderViewProps {
  onBackToApp?: () => void;
  isCvOnlyMode?: boolean;
  onExitSession?: () => void;
  onOpenApplyByEmail?: () => void;
}

export type CVViewMode = 'library' | 'editor' | 'apply-email';

export const CVBuilderView: React.FC<CVBuilderViewProps> = ({
  onBackToApp,
  isCvOnlyMode = false,
  onExitSession,
  onOpenApplyByEmail,
}) => {
  const { theme } = useTheme();

  // Multi-CV Library State
  const [library, setLibrary] = useState<CVDocumentItem[]>(() => loadCVLibrary());
  const [activeCvId, setActiveCvIdState] = useState<string>(() => getActiveCVId());
  const [viewMode, setViewMode] = useState<CVViewMode>('library');

  // Active CV Data
  const activeCV = useMemo(() => {
    const found = library.find(item => item.id === activeCvId);
    return found || library[0] || null;
  }, [library, activeCvId]);

  const [cvData, setCvData] = useState<CVData>(() => {
    const init = library.find(item => item.id === activeCvId);
    return init?.data || library[0]?.data;
  });

  // Keep cvData in sync whenever activeCvId or activeCV changes
  useEffect(() => {
    if (activeCV) {
      setCvData(activeCV.data);
    }
  }, [activeCvId, activeCV]);

  // UI state for editor
  const [zoomScale, setZoomScale] = useState<number>(0.85);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [isMobilePreview, setIsMobilePreview] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isCvSwitcherOpen, setIsCvSwitcherOpen] = useState(false);

  // Auto-fit zoom on mount depending on viewport width
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 640) {
        setZoomScale(0.42);
      } else if (width < 1024) {
        setZoomScale(0.62);
      } else if (width < 1440) {
        setZoomScale(0.8);
      } else {
        setZoomScale(0.88);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Listen for real-time cloud updates from other devices / login
  useEffect(() => {
    const handleCloudUpdate = (e: any) => {
      if (e.detail && Array.isArray(e.detail) && e.detail.length > 0) {
        setLibrary(e.detail);
        const currentActive = e.detail.find((c: any) => c.id === activeCvId) || e.detail[0];
        if (currentActive) {
          setCvData(currentActive.data);
        }
      } else {
        refreshLibrary();
      }
    };
    window.addEventListener('cv_library_cloud_updated', handleCloudUpdate);
    return () => window.removeEventListener('cv_library_cloud_updated', handleCloudUpdate);
  }, [activeCvId]);

  const refreshLibrary = () => {
    const fresh = loadCVLibrary();
    setLibrary(fresh);
    const activeId = getActiveCVId();
    setActiveCvIdState(activeId);
  };

  // Switch active CV
  const handleSelectCV = (id: string) => {
    setActiveCVId(id);
    setActiveCvIdState(id);
    const target = library.find(item => item.id === id);
    if (target) {
      setCvData(target.data);
    }
  };

  // Open full editor for a specific CV
  const handleOpenEditor = (id: string) => {
    handleSelectCV(id);
    setViewMode('editor');
  };

  // Field change in editor: updates active CV independently
  const handleCvDataChange = (updatedData: CVData) => {
    setCvData(updatedData);
    updateCVData(activeCvId, updatedData);
    setLibrary(prev =>
      prev.map(c =>
        c.id === activeCvId
          ? { ...c, data: updatedData, updatedAt: new Date().toISOString() }
          : c
      )
    );
  };

  // Manual Save handler
  const handleManualSave = async () => {
    setIsSaving(true);
    updateCVData(activeCvId, cvData);
    setSaveMessage('Saved locally!');
    setIsSaving(false);
    setTimeout(() => setSaveMessage(''), 3000);
  };

  // Print Handler
  const handlePrint = () => {
    window.print();
  };

  // Download PDF Handler
  const handleDownloadPDF = async () => {
    setIsGeneratingPDF(true);
    try {
      const title = activeCV?.title || cvData.fullName || 'Fazle_Rabbi';
      const sanitizedName = title.replace(/[^a-zA-Z0-9]/g, '_');
      await exportCVToPDF('cv-print-area', `${sanitizedName}.pdf`);
      setSaveMessage('PDF exported successfully!');
      setTimeout(() => setSaveMessage(''), 3500);
    } catch (err: any) {
      console.error('PDF generation fallback to print dialog:', err);
      window.print();
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // Duplicate current active CV
  const handleDuplicateCurrent = () => {
    const cloned = duplicateCV(activeCvId);
    refreshLibrary();
    handleSelectCV(cloned.id);
    setSaveMessage(`Duplicated as "${cloned.title}"`);
    setTimeout(() => setSaveMessage(''), 3000);
  };

  // Reset active CV to its initial template data
  const handleResetCurrent = () => {
    if (!activeCV) return;
    const confirmed = window.confirm(
      `Reset this specific CV ("${activeCV.title}") back to its starter template? Other saved CVs will not be affected.`
    );
    if (confirmed) {
      const freshLib = loadCVLibrary();
      const current = freshLib.find(c => c.id === activeCvId);
      if (current) {
        handleCvDataChange(current.data);
      }
    }
  };

  return (
    <div
      className={`min-h-screen flex flex-col font-sans pb-24 transition-colors duration-200 ${
        theme === 'dark' ? 'bg-[#090b10] text-[#e2e8f0]' : 'bg-[#f8fafc] text-[#0f172a]'
      }`}
    >
      {/* ========================================================= */}
      {/* TOP HEADER BAR (Dynamic depending on view mode)          */}
      {/* ========================================================= */}
      <header
        className={`sticky top-0 z-40 backdrop-blur-md px-4 sm:px-6 py-3 border-b transition-colors no-print ${
          theme === 'dark'
            ? 'bg-[#0d0f15]/95 border-gray-800 text-white'
            : 'bg-white/95 border-slate-200 text-slate-900 shadow-sm'
        }`}
      >
        <div className="max-w-[1700px] mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Brand & Left Controls */}
          <div className="flex items-center justify-between w-full md:w-auto">
            <div className="flex items-center gap-3">
              {/* Return to Dashboard / Return to Library */}
              {viewMode === 'editor' || viewMode === 'apply-email' ? (
                <button
                  onClick={() => setViewMode('library')}
                  className={`px-3 py-2 rounded-xl transition flex items-center gap-2 text-xs font-semibold border shadow-sm ${
                    theme === 'dark'
                      ? 'bg-gray-800 hover:bg-gray-700 text-gray-200 border-gray-700'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                  }`}
                  title="Return to CV Library Dashboard"
                >
                  <ArrowLeft className="w-4 h-4 text-[#ffd700]" />
                  <span>← Back to CV Library</span>
                </button>
              ) : isCvOnlyMode ? (
                <button
                  onClick={onExitSession}
                  className="px-3 py-2 rounded-xl transition flex items-center gap-1.5 text-xs font-semibold bg-rose-950/50 hover:bg-rose-900/60 text-rose-300 border border-rose-500/40 shadow-sm"
                  title="Exit CV-Only session and return to lock screen"
                >
                  <Lock className="w-3.5 h-3.5 text-rose-400" />
                  <span>Exit Session</span>
                </button>
              ) : (
                onBackToApp && (
                  <button
                    onClick={onBackToApp}
                    className={`px-3 py-2 rounded-xl transition flex items-center gap-2 text-xs font-semibold border shadow-sm ${
                      theme === 'dark'
                        ? 'bg-gray-800 hover:bg-gray-700 text-gray-200 border-gray-700'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                    }`}
                    title="Return to Main Application"
                  >
                    <ArrowLeft className="w-4 h-4 text-[#ffd700]" />
                    <span>Home Dashboard</span>
                  </button>
                )
              )}

              <CCDLogo size={38} showSubtitle={false} className="shrink-0" />

              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-['Montserrat'] font-bold text-base sm:text-lg tracking-wide">
                    {viewMode === 'editor' ? 'CV Editor' : 'CV Builder & Library'}
                  </h1>

                  {isCvOnlyMode && (
                    <span className="px-2.5 py-0.5 rounded-full bg-sky-950/50 border border-sky-500/40 text-sky-300 text-[10px] font-bold">
                      CV Workspace Only
                    </span>
                  )}

                  {/* Mode Pill Switcher */}
                  <div
                    className={`hidden sm:inline-flex p-0.5 rounded-lg border text-[11px] font-semibold ${
                      theme === 'dark'
                        ? 'bg-[#151926] border-gray-800'
                        : 'bg-slate-100 border-slate-300'
                    }`}
                  >
                    <button
                      onClick={() => setViewMode('library')}
                      className={`px-2.5 py-0.5 rounded-md transition ${
                        viewMode === 'library'
                          ? 'bg-[#d4af37] text-slate-950 font-bold shadow-sm'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      Library ({library.length})
                    </button>
                    <button
                      onClick={() => setViewMode('editor')}
                      className={`px-2.5 py-0.5 rounded-md transition ${
                        viewMode === 'editor'
                          ? 'bg-[#d4af37] text-slate-950 font-bold shadow-sm'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      Editor
                    </button>
                  </div>
                </div>

                <p
                  className={`text-[11px] font-['Inter'] ${
                    theme === 'dark' ? 'text-gray-400' : 'text-slate-500'
                  }`}
                >
                  {viewMode === 'editor'
                    ? `Editing: ${activeCV?.title || 'Fazle Rabbi CV'} · Content-Driven A4 Layout`
                    : 'Manage Multiple Independent CVs · Real-time Persistent Storage'}
                </p>
              </div>
            </div>

            {/* Mobile Controls */}
            <div className="flex items-center md:hidden gap-1.5">
              {viewMode === 'editor' && (
                <button
                  onClick={() => setIsMobilePreview(!isMobilePreview)}
                  className={`px-2.5 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1 ${
                    theme === 'dark'
                      ? 'bg-gray-800 border-gray-700 text-white'
                      : 'bg-slate-100 border-slate-300 text-slate-900'
                  }`}
                >
                  {isMobilePreview ? <Edit3 className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{isMobilePreview ? 'Edit' : 'Preview'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Action Controls & Theme Toggle */}
          <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3 w-full md:w-auto">
            {/* THEME TOGGLE: ☀ LIGHT MODE / 🌙 DARK MODE */}
            <ThemeToggle compact={false} />

            {/* Active CV Quick Switcher (when in editor mode) */}
            {viewMode === 'editor' && (
              <div className="relative">
                <button
                  onClick={() => setIsCvSwitcherOpen(!isCvSwitcherOpen)}
                  className={`px-3 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition shadow-sm ${
                    theme === 'dark'
                      ? 'bg-[#181d2c] hover:bg-[#22293d] border-gray-700 text-[#ffd700]'
                      : 'bg-white hover:bg-slate-100 border-slate-300 text-amber-800'
                  }`}
                  title="Switch between your saved CVs"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span className="max-w-[130px] truncate">{activeCV?.title}</span>
                  <ChevronDown className="w-3 h-3 text-gray-400" />
                </button>

                {isCvSwitcherOpen && (
                  <div
                    className={`absolute right-0 mt-2 w-64 rounded-2xl p-2 border shadow-2xl z-50 animate-fade-in ${
                      theme === 'dark'
                        ? 'bg-[#121622] border-gray-700 text-white'
                        : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  >
                    <div className="px-3 py-1.5 text-[10px] font-bold uppercase text-gray-400 border-b border-gray-700/30">
                      Switch CV Workspace
                    </div>
                    <div className="max-h-60 overflow-y-auto py-1 space-y-1">
                      {library.map(c => (
                        <button
                          key={c.id}
                          onClick={() => {
                            handleSelectCV(c.id);
                            setIsCvSwitcherOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition ${
                            c.id === activeCvId
                              ? 'bg-[#d4af37]/20 text-[#ffd700] font-bold'
                              : theme === 'dark'
                              ? 'hover:bg-white/5 text-gray-300'
                              : 'hover:bg-slate-100 text-slate-700'
                          }`}
                        >
                          <span className="truncate">{c.title}</span>
                          {c.id === activeCvId && (
                            <CheckCircle className="w-3.5 h-3.5 text-[#ffd700] shrink-0 ml-1" />
                          )}
                        </button>
                      ))}
                    </div>
                    <div className="pt-1.5 border-t border-gray-700/30">
                      <button
                        onClick={() => {
                          setIsCvSwitcherOpen(false);
                          setViewMode('library');
                        }}
                        className="w-full px-3 py-1.5 text-center text-xs font-semibold text-[#ffd700] hover:underline"
                      >
                        + Manage all in Library
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Quick Duplicate Current in Editor */}
            {viewMode === 'editor' && (
              <button
                onClick={handleDuplicateCurrent}
                className={`px-3 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition ${
                  theme === 'dark'
                    ? 'bg-gray-800 hover:bg-gray-700 text-gray-200 border-gray-700'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                }`}
                title="Duplicate this CV into a separate copy"
              >
                <Copy className="w-3.5 h-3.5 text-sky-400" />
                <span className="hidden xl:inline">Duplicate</span>
              </button>
            )}

            {saveMessage && (
              <span className="text-xs text-emerald-400 flex items-center gap-1 font-medium mr-1 animate-fade-in">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>{saveMessage}</span>
              </span>
            )}

            {/* Save Button (when in editor mode) */}
            {viewMode === 'editor' && (
              <button
                onClick={handleManualSave}
                disabled={isSaving}
                className={`px-3.5 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition shadow-sm ${
                  theme === 'dark'
                    ? 'bg-gray-800 hover:bg-gray-700 text-gray-200 border-gray-700'
                    : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300'
                }`}
                title="Save CV changes to persistent local storage"
              >
                <Save className="w-3.5 h-3.5 text-[#ffd700]" />
                <span className="hidden sm:inline">Save CV</span>
              </button>
            )}

            {/* Print / Save as PDF */}
            {viewMode === 'editor' && (
              <button
                onClick={handlePrint}
                className={`px-3.5 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition shadow-sm ${
                  theme === 'dark'
                    ? 'bg-gray-800 hover:bg-gray-700 text-gray-200 border-gray-700'
                    : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300'
                }`}
                title="Print or Save via browser"
              >
                <Printer className="w-3.5 h-3.5 text-sky-400" />
                <span className="hidden sm:inline">Print / Save PDF</span>
                <span className="sm:hidden">Print</span>
              </button>
            )}

            {/* Download Real PDF Button */}
            {viewMode === 'editor' && (
              <button
                onClick={handleDownloadPDF}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#d4af37] via-[#ffd700] to-[#c5a059] text-slate-950 font-bold text-xs uppercase tracking-wider shadow-lg shadow-amber-950/40 hover:opacity-95 transition flex items-center gap-1.5"
              >
                <Download className="w-4 h-4 stroke-[2.5]" />
                <span>Download PDF</span>
              </button>
            )}

            {/* When in Library Mode: Quick button to open Active Editor */}
            {viewMode === 'library' && (
              <button
                onClick={() => setViewMode('editor')}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#d4af37] via-[#ffd700] to-[#c5a059] text-slate-950 font-bold text-xs uppercase tracking-wider shadow-lg shadow-amber-950/40 hover:opacity-95 transition flex items-center gap-1.5"
              >
                <Edit3 className="w-4 h-4" />
                <span>Open Active CV</span>
              </button>
            )}

            {/* Apply by Email Navigation Option */}
            <button
              onClick={() => {
                if (onOpenApplyByEmail) {
                  onOpenApplyByEmail();
                } else {
                  setViewMode('apply-email');
                }
              }}
              className={`px-3.5 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition ${
                viewMode === 'apply-email'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-md shadow-blue-500/25'
              }`}
              title="Apply by Email with your selected CV"
            >
              <Mail className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Apply by Email</span>
              <span className="sm:hidden">Apply</span>
            </button>
          </div>
        </div>
      </header>

      {/* Generating PDF Loader Banner */}
      {isGeneratingPDF && (
        <div className="bg-gradient-to-r from-[#d4af37] via-[#f3e5ab] to-[#aa771c] text-[#0b0c10] px-4 py-2 text-xs font-bold text-center animate-pulse shadow-md z-50">
          Generating high-resolution vector A4 PDF... Please wait a moment.
        </div>
      )}

      {/* ========================================================= */}
      {/* MAIN VIEW CONTENT: LIBRARY vs EDITOR vs APPLY BY EMAIL    */}
      {/* ========================================================= */}
      <main className="flex-1 max-w-[1700px] w-full mx-auto p-3 sm:p-5 lg:p-6">
        {viewMode === 'apply-email' ? (
          <ApplyByEmailView
            initialSelectedCvId={activeCvId}
            onBackToDashboard={() => setViewMode('library')}
            onOpenCVLibrary={() => setViewMode('library')}
          />
        ) : viewMode === 'library' ? (
          <CVLibraryDashboard
            library={library}
            activeCvId={activeCvId}
            onSelectCV={handleSelectCV}
            onOpenEditor={handleOpenEditor}
            onRefreshLibrary={refreshLibrary}
            onApplyByEmail={id => {
              handleSelectCV(id);
              if (onOpenApplyByEmail) {
                onOpenApplyByEmail();
              } else {
                setViewMode('apply-email');
              }
            }}
          />
        ) : (
          /* Editor Mode: Form Editor on Left / Live CV Document on Right */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Form Editor (hidden on mobile when previewing) */}
            <div
              className={`lg:col-span-5 xl:col-span-5 space-y-4 ${
                isMobilePreview ? 'hidden lg:block' : 'block'
              }`}
            >
              {/* Active CV indicator banner */}
              <div
                className={`p-3.5 rounded-2xl border flex items-center justify-between transition ${
                  theme === 'dark'
                    ? 'bg-[#121622] border-gray-800'
                    : 'bg-white border-slate-200 shadow-sm'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-[#d4af37]/20 text-[#ffd700]">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                      Currently Editing
                    </div>
                    <div
                      className={`font-['Montserrat'] font-bold text-sm leading-tight ${
                        theme === 'dark' ? 'text-white' : 'text-slate-900'
                      }`}
                    >
                      {activeCV?.title || 'Fazle Rabbi CV'}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setViewMode('library')}
                  className="px-2.5 py-1 rounded-lg bg-gray-800/60 hover:bg-gray-800 text-[11px] font-semibold text-[#ffd700] transition"
                >
                  View Library
                </button>
              </div>

              {/* Core CV Editor Form */}
              <CVEditor
                cvData={cvData}
                onChange={handleCvDataChange}
                onReset={handleResetCurrent}
              />
            </div>

            {/* Right Column: Live A4 Document Preview */}
            <div
              className={`lg:col-span-7 xl:col-span-7 flex flex-col items-center ${
                !isMobilePreview ? 'hidden lg:flex' : 'flex'
              }`}
            >
              {/* Zoom and Document Controls Bar */}
              <div
                className={`w-full flex items-center justify-between rounded-2xl px-4 py-2.5 mb-4 shadow text-xs border no-print transition ${
                  theme === 'dark'
                    ? 'bg-[#12151e] border-gray-800 text-gray-300'
                    : 'bg-white border-slate-200 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`font-['Montserrat'] font-bold text-xs ${
                      theme === 'dark' ? 'text-white' : 'text-slate-900'
                    }`}
                  >
                    A4 Live Document
                  </span>
                  <span
                    className={`text-[10px] ${
                      theme === 'dark' ? 'text-gray-500' : 'text-slate-400'
                    }`}
                  >
                    • 210mm × 297mm Standard
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setZoomScale(s => Math.max(0.35, s - 0.1))}
                    className={`p-1.5 rounded-lg transition ${
                      theme === 'dark'
                        ? 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>

                  <span className="font-mono text-xs text-[#ffd700] w-12 text-center">
                    {Math.round(zoomScale * 100)}%
                  </span>

                  <button
                    onClick={() => setZoomScale(s => Math.min(1.3, s + 0.1))}
                    className={`p-1.5 rounded-lg transition ${
                      theme === 'dark'
                        ? 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                    title="Zoom In"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => setZoomScale(0.85)}
                    className={`p-1.5 rounded-lg ml-1 transition ${
                      theme === 'dark'
                        ? 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                    title="Reset Zoom"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Scalable Container for A4 Document */}
              <div className="w-full overflow-x-auto flex justify-center py-2 no-scrollbar">
                <CVDocument data={cvData} scale={zoomScale} id="cv-print-area" />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
