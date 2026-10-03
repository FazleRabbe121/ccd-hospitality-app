import React, { useState } from 'react';
import {
  CVData,
  WorkExperience,
  EmploymentType,
  PersonalInfoItem,
  TrainingItem,
  AcademicItem,
  LanguageItem,
  AdditionalPhoto,
} from '../types/cv';
import {
  Plus,
  Trash2,
  MoveUp,
  MoveDown,
  Copy,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  Sparkles,
  MapPin,
  Briefcase,
  User,
  GraduationCap,
  Award,
  Globe,
  RotateCcw,
  Clock,
  Eye,
  EyeOff,
  Camera,
} from 'lucide-react';
import { DEFAULT_CV_DATA } from '../services/cvStorage';
import { useTheme } from '../context/ThemeContext';

interface CVEditorProps {
  cvData: CVData;
  onChange: (data: CVData) => void;
  onReset: () => void;
}

export const CVEditor: React.FC<CVEditorProps> = ({ cvData, onChange, onReset }) => {
  const { theme } = useTheme();
  const [activeSection, setActiveSection] = useState<string>('experience');
  const [editingExpId, setEditingExpId] = useState<string | null>(null);
  const [editingPtId, setEditingPtId] = useState<string | null>(null);

  // Field updater helpers
  const updateField = <K extends keyof CVData>(field: K, value: CVData[K]) => {
    onChange({ ...cvData, [field]: value });
  };

  // Main Profile Photo Upload handler
  const handleMainPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = event => {
        if (event.target?.result) {
          updateField('photoUrl', event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Additional Photos Handlers (Up to 3 Photos)
  const handleAdditionalPhotoUpload = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = event => {
        if (event.target?.result) {
          const list = [...(cvData.additionalPhotos || [])];
          if (list[index]) {
            list[index] = { ...list[index], url: event.target.result as string, included: true };
          } else {
            list.push({
              id: `photo-${Date.now()}`,
              url: event.target.result as string,
              caption: `Work Verification Photo ${index + 1}`,
              included: true,
            });
          }
          onChange({
            ...cvData,
            additionalPhotos: list,
            showAdditionalPhotosPage: true,
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateAdditionalPhoto = (index: number, updates: Partial<AdditionalPhoto>) => {
    const list = [...(cvData.additionalPhotos || [])];
    if (list[index]) {
      list[index] = { ...list[index], ...updates };
      updateField('additionalPhotos', list);
    }
  };

  const handleMoveAdditionalPhoto = (index: number, direction: 'left' | 'right') => {
    const newIndex = direction === 'left' ? index - 1 : index + 1;
    const list = [...(cvData.additionalPhotos || [])];
    if (newIndex < 0 || newIndex >= list.length) return;
    const [moved] = list.splice(index, 1);
    list.splice(newIndex, 0, moved);
    updateField('additionalPhotos', list);
  };

  const handleDeleteAdditionalPhoto = (index: number) => {
    const list = [...(cvData.additionalPhotos || [])];
    list.splice(index, 1);
    updateField('additionalPhotos', list);
  };

  // Full-Time Experience Handlers
  const handleAddExperience = () => {
    const newExp: WorkExperience = {
      id: `exp-${Date.now()}`,
      companyName: 'New Hotel or Bar',
      position: 'Senior Bartender',
      employmentType: 'Full-time',
      startDate: '2026',
      endDate: 'Present',
      location: 'Limassol, Cyprus',
      responsibilities: [
        'Preparing and serving drinks efficiently.',
        'Providing excellent customer service.',
      ],
    };

    const updated = [newExp, ...(cvData.experiences || [])];
    updateField('experiences', updated);
    setEditingExpId(newExp.id);
  };

  const handleUpdateExperience = (id: string, updates: Partial<WorkExperience>) => {
    const updated = (cvData.experiences || []).map(exp =>
      exp.id === id ? { ...exp, ...updates } : exp
    );
    updateField('experiences', updated);
  };

  const handleDeleteExperience = (id: string) => {
    const updated = (cvData.experiences || []).filter(exp => exp.id !== id);
    updateField('experiences', updated);
    if (editingExpId === id) setEditingExpId(null);
  };

  const handleDuplicateExperience = (exp: WorkExperience) => {
    const clone: WorkExperience = {
      ...exp,
      id: `exp-${Date.now()}`,
      companyName: `${exp.companyName} (Copy)`,
    };
    const index = (cvData.experiences || []).findIndex(e => e.id === exp.id);
    const updated = [...(cvData.experiences || [])];
    updated.splice(index + 1, 0, clone);
    updateField('experiences', updated);
    setEditingExpId(clone.id);
  };

  const handleMoveExperience = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= (cvData.experiences || []).length) return;

    const list = [...(cvData.experiences || [])];
    const [moved] = list.splice(index, 1);
    list.splice(newIndex, 0, moved);
    updateField('experiences', list);
  };

  // Part-Time Experience Handlers
  const handleAddPartTime = () => {
    const newPt: WorkExperience = {
      id: `pt-${Date.now()}`,
      companyName: 'Beach Club / Lounge',
      position: 'Bartender',
      employmentType: 'Part-time',
      startDate: 'Jun 2025',
      endDate: 'Sep 2025',
      location: 'Limassol, Cyprus',
      responsibilities: [
        'Crafting classic and sunset signature cocktails.',
        'Maintaining prompt and attentive service.',
      ],
    };

    const list = [...(cvData.partTimeExperiences || []), newPt];
    updateField('partTimeExperiences', list);
    setEditingPtId(newPt.id);
  };

  const handleUpdatePartTime = (id: string, updates: Partial<WorkExperience>) => {
    const list = (cvData.partTimeExperiences || []).map(pt =>
      pt.id === id ? { ...pt, ...updates } : pt
    );
    updateField('partTimeExperiences', list);
  };

  const handleDeletePartTime = (id: string) => {
    const list = (cvData.partTimeExperiences || []).filter(pt => pt.id !== id);
    updateField('partTimeExperiences', list);
    if (editingPtId === id) setEditingPtId(null);
  };

  // Responsibilities bullet points handlers
  const handleAddResponsibility = (expId: string, isPartTime: boolean = false) => {
    const list = isPartTime ? (cvData.partTimeExperiences || []) : (cvData.experiences || []);
    const exp = list.find(e => e.id === expId);
    if (!exp) return;
    const newResp = 'Delivered high-standard customer service.';
    if (isPartTime) {
      handleUpdatePartTime(expId, { responsibilities: [...exp.responsibilities, newResp] });
    } else {
      handleUpdateExperience(expId, { responsibilities: [...exp.responsibilities, newResp] });
    }
  };

  const handleUpdateResponsibility = (expId: string, rIdx: number, val: string, isPartTime: boolean = false) => {
    const list = isPartTime ? (cvData.partTimeExperiences || []) : (cvData.experiences || []);
    const exp = list.find(e => e.id === expId);
    if (!exp) return;
    const rList = [...exp.responsibilities];
    rList[rIdx] = val;
    if (isPartTime) {
      handleUpdatePartTime(expId, { responsibilities: rList });
    } else {
      handleUpdateExperience(expId, { responsibilities: rList });
    }
  };

  const handleDeleteResponsibility = (expId: string, rIdx: number, isPartTime: boolean = false) => {
    const list = isPartTime ? (cvData.partTimeExperiences || []) : (cvData.experiences || []);
    const exp = list.find(e => e.id === expId);
    if (!exp) return;
    const rList = exp.responsibilities.filter((_, idx) => idx !== rIdx);
    if (isPartTime) {
      handleUpdatePartTime(expId, { responsibilities: rList });
    } else {
      handleUpdateExperience(expId, { responsibilities: rList });
    }
  };

  // Skills Handlers
  const handleAddSkill = () => {
    const current = cvData.skills?.items || [];
    const updated = [...current, 'NEW PROFESSIONAL SKILL'];
    updateField('skills', {
      enabled: true,
      title: cvData.skills?.title || 'SKILL',
      items: updated,
    });
  };

  const handleUpdateSkill = (idx: number, val: string) => {
    const current = [...(cvData.skills?.items || [])];
    current[idx] = val;
    updateField('skills', {
      enabled: true,
      title: cvData.skills?.title || 'SKILL',
      items: current,
    });
  };

  const handleDeleteSkill = (idx: number) => {
    const current = (cvData.skills?.items || []).filter((_, i) => i !== idx);
    updateField('skills', {
      enabled: true,
      title: cvData.skills?.title || 'SKILL',
      items: current,
    });
  };

  return (
    <div
      className={`border rounded-3xl p-5 sm:p-6 shadow-xl space-y-5 transition-colors ${
        theme === 'dark'
          ? 'bg-[#12151e] border-gray-800 text-[#f3f4f6]'
          : 'bg-white border-slate-200 text-slate-900'
      }`}
    >
      {/* Editor Header Bar */}
      <div
        className={`flex items-center justify-between pb-4 border-b ${
          theme === 'dark' ? 'border-gray-800' : 'border-slate-200'
        }`}
      >
        <div>
          <h2
            className={`font-['Montserrat'] font-bold text-lg ${
              theme === 'dark' ? 'text-white' : 'text-slate-900'
            }`}
          >
            CV Content Editor
          </h2>
          <p
            className={`text-xs font-['Inter'] ${
              theme === 'dark' ? 'text-gray-400' : 'text-slate-500'
            }`}
          >
            Your data automatically populates the exact professional A4 template
          </p>
        </div>
        <button
          onClick={onReset}
          className={`px-3 py-1.5 rounded-xl text-xs transition flex items-center gap-1.5 ${
            theme === 'dark'
              ? 'bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900'
          }`}
          title="Restore reference sample data"
        >
          <RotateCcw className="w-3.5 h-3.5 text-[#ffd700]" />
          <span>Reset Sample</span>
        </button>
      </div>

      {/* Navigation Section Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
        {[
          { id: 'experience', label: 'Work Experience', icon: Briefcase },
          { id: 'parttime', label: 'Part-Time Experience', icon: Clock },
          { id: 'photos', label: 'Photo & Media', icon: ImageIcon },
          { id: 'skills', label: 'Skills', icon: Sparkles },
          { id: 'header', label: 'Header & Contact', icon: User },
          { id: 'about', label: 'About Me', icon: Sparkles },
          { id: 'personal', label: 'Personal Info', icon: User },
          { id: 'training', label: 'Training Summary', icon: Award },
          { id: 'education', label: 'Academics', icon: GraduationCap },
          { id: 'languages', label: 'Languages', icon: Globe },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeSection === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition flex items-center gap-2 shrink-0 ${
                isActive
                  ? 'bg-gradient-to-r from-[#d4af37] to-[#aa771c] text-[#0b0c10] shadow font-bold'
                  : theme === 'dark'
                  ? 'bg-[#181d2a] text-gray-400 hover:text-white border border-gray-800'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ============================================================
          SECTION 1: WORK EXPERIENCE (MAIN FULL-TIME TIMELINE)
          ============================================================ */}
      {activeSection === 'experience' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2">
            <div>
              <span className="font-['Montserrat'] font-bold text-sm text-white">
                Main Work Experiences ({cvData.experiences?.length || 0})
              </span>
              <p className="text-[11px] text-gray-400">
                Connected by dynamic vertical timeline with circular node markers
              </p>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={cvData.experienceSortOrder}
                onChange={e =>
                  updateField('experienceSortOrder', e.target.value as 'newest-first' | 'oldest-first')
                }
                className="px-2.5 py-1.5 bg-[#0b0d13] border border-gray-800 rounded-xl text-xs text-gray-300 focus:outline-none"
              >
                <option value="newest-first">Newest → Oldest</option>
                <option value="oldest-first">Oldest → Newest</option>
              </select>

              <button
                onClick={handleAddExperience}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#aa771c] text-[#0b0c10] font-bold text-xs uppercase tracking-wider shadow flex items-center gap-1.5 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Experience</span>
              </button>
            </div>
          </div>

          {/* List of Experience Cards */}
          <div className="space-y-3">
            {(cvData.experiences || []).map((exp, index) => {
              const isEditing = editingExpId === exp.id;
              return (
                <div
                  key={exp.id}
                  className={`rounded-2xl border transition ${
                    isEditing
                      ? 'bg-[#151926] border-[#d4af37]/60 shadow-lg'
                      : 'bg-[#0d1017] border-gray-800 hover:border-gray-700'
                  }`}
                >
                  <div
                    onClick={() => setEditingExpId(isEditing ? null : exp.id)}
                    className="p-4 flex items-center justify-between cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-gray-800 text-gray-300 font-mono text-xs flex items-center justify-center font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-['Montserrat'] font-bold text-sm text-white">
                          {exp.companyName || 'Untitled Company'}
                        </div>
                        <div className="text-xs text-[#d4af37] font-medium">
                          {exp.position} · <span className="text-gray-400">{exp.startDate} - {exp.endDate}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => handleMoveExperience(index, 'up')}
                        disabled={index === 0}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-white disabled:opacity-30"
                        title="Move Up"
                      >
                        <MoveUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleMoveExperience(index, 'down')}
                        disabled={index === (cvData.experiences || []).length - 1}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-white disabled:opacity-30"
                        title="Move Down"
                      >
                        <MoveDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDuplicateExperience(exp)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-white"
                        title="Duplicate"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteExperience(exp.id)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-rose-400"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <div className="pl-1">
                        {isEditing ? <ChevronUp className="w-4 h-4 text-[#ffd700]" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                      </div>
                    </div>
                  </div>

                  {isEditing && (
                    <div className="p-4 pt-1 border-t border-gray-800/80 space-y-4 font-['Inter']">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                            Company / Hotel Name *
                          </label>
                          <input
                            type="text"
                            value={exp.companyName}
                            onChange={e => handleUpdateExperience(exp.id, { companyName: e.target.value })}
                            className="w-full px-3 py-2 bg-[#0b0d13] border border-gray-800 rounded-xl text-xs text-white focus:border-[#d4af37] focus:outline-none"
                            placeholder="e.g. Flamingo Paradise Beach Hotel"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                            Job Position *
                          </label>
                          <input
                            type="text"
                            value={exp.position}
                            onChange={e => handleUpdateExperience(exp.id, { position: e.target.value })}
                            className="w-full px-3 py-2 bg-[#0b0d13] border border-gray-800 rounded-xl text-xs text-white focus:border-[#d4af37] focus:outline-none"
                            placeholder="e.g. Senior Bartender"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                            Location (Shows 📍 icon)
                          </label>
                          <input
                            type="text"
                            value={exp.location}
                            onChange={e => handleUpdateExperience(exp.id, { location: e.target.value })}
                            className="w-full px-3 py-2 bg-[#0b0d13] border border-gray-800 rounded-xl text-xs text-white focus:border-[#d4af37] focus:outline-none"
                            placeholder="e.g. 9 Amphitrites Street, Protara 5296"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                              Start Date
                            </label>
                            <input
                              type="text"
                              value={exp.startDate}
                              onChange={e => handleUpdateExperience(exp.id, { startDate: e.target.value })}
                              className="w-full px-3 py-2 bg-[#0b0d13] border border-gray-800 rounded-xl text-xs text-white focus:border-[#d4af37] focus:outline-none"
                              placeholder="Feb 2026"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                              End Date
                            </label>
                            <input
                              type="text"
                              value={exp.endDate}
                              onChange={e => handleUpdateExperience(exp.id, { endDate: e.target.value })}
                              className="w-full px-3 py-2 bg-[#0b0d13] border border-gray-800 rounded-xl text-xs text-white focus:border-[#d4af37] focus:outline-none"
                              placeholder="Present"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Responsibilities */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-[11px] font-semibold text-[#ffd700] uppercase tracking-wider">
                            Responsibilities (Bullet Points)
                          </label>
                          <button
                            type="button"
                            onClick={() => handleAddResponsibility(exp.id, false)}
                            className="text-xs text-[#ffd700] hover:underline flex items-center gap-1"
                          >
                            <Plus className="w-3.5 h-3.5" /> Add Responsibility
                          </button>
                        </div>

                        <div className="space-y-2">
                          {exp.responsibilities.map((resp, rIdx) => (
                            <div key={rIdx} className="flex items-center gap-2">
                              <span className="text-gray-500 font-bold select-none">•</span>
                              <input
                                type="text"
                                value={resp}
                                onChange={e => handleUpdateResponsibility(exp.id, rIdx, e.target.value, false)}
                                className="flex-1 px-3 py-1.5 bg-[#0b0d13] border border-gray-800 rounded-xl text-xs text-white focus:border-[#d4af37] focus:outline-none"
                                placeholder="Describe duty..."
                              />
                              <button
                                type="button"
                                onClick={() => handleDeleteResponsibility(exp.id, rIdx, false)}
                                className="p-1 text-gray-500 hover:text-rose-400"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================================================
          SECTION 2: PART-TIME EXPERIENCE (SEPARATE SMALL HEADING)
          ============================================================ */}
      {activeSection === 'parttime' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2">
            <div>
              <span className="font-['Montserrat'] font-bold text-sm text-white">
                Part-Time Experience ({cvData.partTimeExperiences?.length || 0})
              </span>
              <p className="text-[11px] text-gray-400">
                Displays under a dedicated "PART-TIME EXPERIENCE" section heading in the CV
              </p>
            </div>

            <button
              onClick={handleAddPartTime}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#aa771c] text-[#0b0c10] font-bold text-xs uppercase tracking-wider shadow flex items-center gap-1.5 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Part-Time Role</span>
            </button>
          </div>

          <div className="space-y-3">
            {(cvData.partTimeExperiences || []).map((pt, index) => {
              const isEditing = editingPtId === pt.id;
              return (
                <div
                  key={pt.id}
                  className={`rounded-2xl border transition ${
                    isEditing
                      ? 'bg-[#151926] border-[#d4af37]/60 shadow-lg'
                      : 'bg-[#0d1017] border-gray-800 hover:border-gray-700'
                  }`}
                >
                  <div
                    onClick={() => setEditingPtId(isEditing ? null : pt.id)}
                    className="p-4 flex items-center justify-between cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-gray-800 text-gray-300 font-mono text-xs flex items-center justify-center font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-['Montserrat'] font-bold text-sm text-white">
                          {pt.companyName || 'Untitled Venue'}
                        </div>
                        <div className="text-xs text-[#d4af37] font-medium">
                          {pt.position} · <span className="text-gray-400">{pt.startDate} - {pt.endDate}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => handleDeletePartTime(pt.id)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-rose-400"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <div className="pl-1">
                        {isEditing ? <ChevronUp className="w-4 h-4 text-[#ffd700]" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                      </div>
                    </div>
                  </div>

                  {isEditing && (
                    <div className="p-4 pt-1 border-t border-gray-800/80 space-y-4 font-['Inter']">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                            Venue / Restaurant Name *
                          </label>
                          <input
                            type="text"
                            value={pt.companyName}
                            onChange={e => handleUpdatePartTime(pt.id, { companyName: e.target.value })}
                            className="w-full px-3 py-2 bg-[#0b0d13] border border-gray-800 rounded-xl text-xs text-white focus:border-[#d4af37] focus:outline-none"
                            placeholder="e.g. Lighthouse Beach Lounge"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                            Job Position *
                          </label>
                          <input
                            type="text"
                            value={pt.position}
                            onChange={e => handleUpdatePartTime(pt.id, { position: e.target.value })}
                            className="w-full px-3 py-2 bg-[#0b0d13] border border-gray-800 rounded-xl text-xs text-white focus:border-[#d4af37] focus:outline-none"
                            placeholder="e.g. Bartender · Part-time"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                            Location (Shows 📍 icon)
                          </label>
                          <input
                            type="text"
                            value={pt.location}
                            onChange={e => handleUpdatePartTime(pt.id, { location: e.target.value })}
                            className="w-full px-3 py-2 bg-[#0b0d13] border border-gray-800 rounded-xl text-xs text-white focus:border-[#d4af37] focus:outline-none"
                            placeholder="Limassol, Cyprus"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                              Start Date
                            </label>
                            <input
                              type="text"
                              value={pt.startDate}
                              onChange={e => handleUpdatePartTime(pt.id, { startDate: e.target.value })}
                              className="w-full px-3 py-2 bg-[#0b0d13] border border-gray-800 rounded-xl text-xs text-white focus:border-[#d4af37] focus:outline-none"
                              placeholder="Jun 2025"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                              End Date
                            </label>
                            <input
                              type="text"
                              value={pt.endDate}
                              onChange={e => handleUpdatePartTime(pt.id, { endDate: e.target.value })}
                              className="w-full px-3 py-2 bg-[#0b0d13] border border-gray-800 rounded-xl text-xs text-white focus:border-[#d4af37] focus:outline-none"
                              placeholder="Sep 2025"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Responsibilities */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-[11px] font-semibold text-[#ffd700] uppercase tracking-wider">
                            Responsibilities
                          </label>
                          <button
                            type="button"
                            onClick={() => handleAddResponsibility(pt.id, true)}
                            className="text-xs text-[#ffd700] hover:underline flex items-center gap-1"
                          >
                            <Plus className="w-3.5 h-3.5" /> Add Bullet Point
                          </button>
                        </div>

                        <div className="space-y-2">
                          {pt.responsibilities.map((resp, rIdx) => (
                            <div key={rIdx} className="flex items-center gap-2">
                              <span className="text-gray-500 font-bold select-none">•</span>
                              <input
                                type="text"
                                value={resp}
                                onChange={e => handleUpdateResponsibility(pt.id, rIdx, e.target.value, true)}
                                className="flex-1 px-3 py-1.5 bg-[#0b0d13] border border-gray-800 rounded-xl text-xs text-white focus:border-[#d4af37] focus:outline-none"
                              />
                              <button
                                type="button"
                                onClick={() => handleDeleteResponsibility(pt.id, rIdx, true)}
                                className="p-1 text-gray-500 hover:text-rose-400"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================================================
          SECTION 3: PHOTO & MEDIA MANAGEMENT (MAIN + 3 ADDITIONAL)
          ============================================================ */}
      {activeSection === 'photos' && (
        <div className="space-y-6 font-['Inter']">
          {/* Main Profile Photo - Large, Professional, Touch-Friendly Selection Card */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-[#121622] via-[#0f121a] to-[#0a0c12] border border-[#d4af37]/30 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <div>
                <h3 className="font-['Montserrat'] font-bold text-base text-white flex items-center gap-2">
                  <User className="w-4 h-4 text-[#ffd700]" />
                  <span>Main Profile Photo</span>
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  High-visibility portrait displayed in the upper-left sidebar headshot frame
                </p>
              </div>
              {cvData.photoUrl && (
                <button
                  type="button"
                  onClick={() => updateField('photoUrl', '')}
                  className="px-3 py-1.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/40 text-xs text-rose-300 font-semibold transition flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove Photo</span>
                </button>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-6 py-2">
              {/* Large Profile Photo Preview */}
              <div className="relative group shrink-0">
                <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-full overflow-hidden border-4 border-[#d4af37] bg-gray-900 shadow-2xl flex items-center justify-center transition-transform group-hover:scale-[1.02]">
                  {cvData.photoUrl ? (
                    <img
                      src={cvData.photoUrl}
                      alt="Main Profile Preview"
                      className="w-full h-full object-cover object-top"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-gray-500 text-center p-4">
                      <ImageIcon className="w-12 h-12 text-gray-600 mb-1" />
                      <span className="text-xs font-bold uppercase tracking-wider text-gray-400">No Photo</span>
                    </div>
                  )}
                </div>

                {/* Mobile/Hover Tap Trigger */}
                <label className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white text-xs font-semibold cursor-pointer transition-opacity backdrop-blur-xs">
                  <Camera className="w-6 h-6 text-[#ffd700] mb-1" />
                  <span>Change Photo</span>
                  <input type="file" accept="image/*" onChange={handleMainPhotoUpload} className="hidden" />
                </label>
              </div>

              {/* Upload Controls & Actions */}
              <div className="flex-1 space-y-4 w-full text-center sm:text-left">
                <div>
                  <h4 className="font-['Montserrat'] font-bold text-sm text-gray-200">
                    {cvData.photoUrl ? 'Active Profile Picture' : 'Add Your Profile Picture'}
                  </h4>
                  <p className="text-xs text-gray-400 mt-1">
                    Tap the button below to upload your headshot from your phone or computer.
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
                  <label className="px-5 py-3 rounded-2xl bg-gradient-to-r from-[#d4af37] via-[#ffd700] to-[#b38827] hover:opacity-95 text-slate-950 font-bold text-xs uppercase tracking-wider cursor-pointer shadow-lg shadow-amber-950/40 inline-flex items-center gap-2 transition active:scale-[0.98]">
                    <Camera className="w-4 h-4 stroke-[2.5]" />
                    <span>{cvData.photoUrl ? '📷 Change Profile Photo' : '📷 Choose Profile Photo'}</span>
                    <input type="file" accept="image/*" onChange={handleMainPhotoUpload} className="hidden" />
                  </label>

                  {cvData.photoUrl && (
                    <button
                      type="button"
                      onClick={() => updateField('photoUrl', '')}
                      className="px-4 py-3 rounded-2xl bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white border border-gray-700 text-xs font-semibold transition"
                    >
                      Remove Photo
                    </button>
                  )}
                </div>

                <div className="pt-1">
                  <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                    Or Paste Direct Web URL
                  </label>
                  <input
                    type="text"
                    value={cvData.photoUrl}
                    onChange={e => updateField('photoUrl', e.target.value)}
                    placeholder="https://images.unsplash.com/photo-..."
                    className="w-full px-3.5 py-2.5 bg-[#07090e] border border-gray-800 rounded-xl text-xs text-white focus:outline-none focus:border-[#d4af37]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Supporting Portfolio Photos (Each gets its own clean A4 page) */}
          <div className="p-5 rounded-2xl bg-[#0b0d13] border border-gray-800 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-800 pb-2">
              <div>
                <h3 className="font-['Montserrat'] font-bold text-sm text-white">Supporting Photos & Portfolio (Separate A4 Pages)</h3>
                <p className="text-xs text-gray-400">Preserves original aspect ratio & resolution. Each photo gets its own dedicated A4 page after the CV.</p>
              </div>

              <label className="flex items-center gap-2 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={cvData.showAdditionalPhotosPage}
                  onChange={e => updateField('showAdditionalPhotosPage', e.target.checked)}
                  className="rounded accent-[#d4af37]"
                />
                <span className="text-[#ffd700] font-semibold">Include in CV / PDF</span>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {(cvData.additionalPhotos || []).map((photo, slotIdx) => (
                <div key={photo.id || slotIdx} className="p-3.5 bg-[#161a24] border border-gray-800 rounded-2xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-['Montserrat'] font-bold text-gray-300">Photo {slotIdx + 1}</span>
                    <div className="flex items-center gap-1">
                      {photo?.url && slotIdx > 0 && (
                        <button
                          type="button"
                          onClick={() => handleMoveAdditionalPhoto(slotIdx, 'left')}
                          className="p-1 text-gray-400 hover:text-[#ffd700]"
                          title="Move Earlier"
                        >
                          <MoveUp className="w-3 h-3 -rotate-90" />
                        </button>
                      )}
                      {photo?.url && slotIdx < (cvData.additionalPhotos || []).length - 1 && (
                        <button
                          type="button"
                          onClick={() => handleMoveAdditionalPhoto(slotIdx, 'right')}
                          className="p-1 text-gray-400 hover:text-[#ffd700]"
                          title="Move Later"
                        >
                          <MoveDown className="w-3 h-3 -rotate-90" />
                        </button>
                      )}
                      {photo?.url && (
                        <button
                          type="button"
                          onClick={() => handleDeleteAdditionalPhoto(slotIdx)}
                          className="p-1 text-gray-500 hover:text-rose-400"
                          title="Delete Photo"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="w-full h-32 rounded-xl bg-gray-900 border border-gray-800 overflow-hidden flex items-center justify-center">
                    {photo?.url ? (
                      <img src={photo.url} alt={`Slot ${slotIdx + 1}`} className="w-full h-full object-contain bg-black/40" />
                    ) : (
                      <ImageIcon className="w-8 h-8 text-gray-700" />
                    )}
                  </div>

                  <input
                    type="text"
                    value={photo?.caption || ''}
                    onChange={e => handleUpdateAdditionalPhoto(slotIdx, { caption: e.target.value })}
                    placeholder="Caption (e.g. Cocktail Pouring)"
                    className="w-full px-2.5 py-1.5 bg-[#0b0d13] border border-gray-700 rounded-lg text-xs text-white focus:outline-none"
                  />

                  <div className="flex items-center gap-2">
                    <label className="flex-1 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-xs text-gray-200 cursor-pointer flex items-center justify-center gap-1.5 transition">
                      <ImageIcon className="w-3 h-3 text-[#ffd700]" />
                      <span>{photo?.url ? 'Replace' : 'Upload'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={e => handleAdditionalPhotoUpload(slotIdx, e)}
                        className="hidden"
                      />
                    </label>
                    <label className="flex items-center gap-1 px-2.5 py-1.5 bg-gray-800/80 rounded-lg text-[10px] text-gray-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={photo.included}
                        onChange={e => handleUpdateAdditionalPhoto(slotIdx, { included: e.target.checked })}
                        className="rounded accent-[#d4af37]"
                      />
                      <span>Active</span>
                    </label>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-1 flex justify-start">
              <label className="px-4 py-2 rounded-xl bg-[#d4af37]/15 hover:bg-[#d4af37]/25 border border-[#d4af37]/40 text-xs font-semibold text-[#ffd700] cursor-pointer flex items-center gap-2 transition">
                <Plus className="w-3.5 h-3.5" />
                <span>Add Another Supporting Photo</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={e => handleAdditionalPhotoUpload((cvData.additionalPhotos || []).length, e)}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          SECTION 4: SKILLS (COMPACT INLINE LAYOUT)
          ============================================================ */}
      {activeSection === 'skills' && (
        <div className="space-y-4 font-['Inter']">
          <div className="flex items-center justify-between pb-2 border-b border-gray-800">
            <div>
              <span className="font-['Montserrat'] font-bold text-sm text-white">Skills Section (Compact Inline)</span>
              <p className="text-xs text-gray-400">Wraps naturally in tight lines: Skill 1 • Skill 2 • Skill 3</p>
            </div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={cvData.skills?.enabled ?? true}
                  onChange={e =>
                    updateField('skills', {
                      enabled: e.target.checked,
                      title: cvData.skills?.title || 'SKILL',
                      items: cvData.skills?.items || [],
                    })
                  }
                  className="rounded accent-[#d4af37]"
                />
                <span className="text-gray-300">Visible</span>
              </label>

              <button
                type="button"
                onClick={handleAddSkill}
                className="px-3 py-1 rounded-xl bg-gray-800 hover:bg-gray-700 text-xs text-[#ffd700] flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Skill
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {(cvData.skills?.items || []).map((skill, idx) => (
              <div key={idx} className="flex items-center gap-2 p-2 bg-[#0b0d13] border border-gray-800 rounded-xl">
                <span className="text-gray-500 font-bold select-none">•</span>
                <input
                  type="text"
                  value={skill}
                  onChange={e => handleUpdateSkill(idx, e.target.value)}
                  className="flex-1 px-2.5 py-1 bg-[#161a24] border border-gray-700 rounded-lg text-xs text-white focus:outline-none uppercase"
                />
                <button
                  type="button"
                  onClick={() => handleDeleteSkill(idx)}
                  className="p-1 text-gray-500 hover:text-rose-400"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================
          SECTION 5: HEADER & CONTACT INFO
          ============================================================ */}
      {activeSection === 'header' && (
        <div className="space-y-4 font-['Inter']">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1 font-['Montserrat']">
                Full Name *
              </label>
              <input
                type="text"
                value={cvData.fullName}
                onChange={e => updateField('fullName', e.target.value)}
                className="w-full px-3 py-2 bg-[#0b0d13] border border-gray-800 rounded-xl text-sm text-white focus:border-[#d4af37] focus:outline-none"
                placeholder="e.g. Fazle Rabbi"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1 font-['Montserrat']">
                Professional Title *
              </label>
              <input
                type="text"
                value={cvData.professionalTitle}
                onChange={e => updateField('professionalTitle', e.target.value)}
                className="w-full px-3 py-2 bg-[#0b0d13] border border-gray-800 rounded-xl text-sm text-white focus:border-[#d4af37] focus:outline-none"
                placeholder="e.g. Bartender / Barista"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                📍 Location (Shows 📍 Map Pin)
              </label>
              <input
                type="text"
                value={cvData.location}
                onChange={e => updateField('location', e.target.value)}
                className="w-full px-3 py-2 bg-[#0b0d13] border border-gray-800 rounded-xl text-xs text-white focus:border-[#d4af37] focus:outline-none"
                placeholder="Cyprus, Paphos, Tombs of the Kings Road"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                ✉ Email Address
              </label>
              <input
                type="email"
                value={cvData.email}
                onChange={e => updateField('email', e.target.value)}
                className="w-full px-3 py-2 bg-[#0b0d13] border border-gray-800 rounded-xl text-xs text-white focus:border-[#d4af37] focus:outline-none"
                placeholder="Fazlerabbe905@gmail.com"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                ☎ Phone Number
              </label>
              <input
                type="text"
                value={cvData.phone}
                onChange={e => updateField('phone', e.target.value)}
                className="w-full px-3 py-2 bg-[#0b0d13] border border-gray-800 rounded-xl text-xs text-white focus:border-[#d4af37] focus:outline-none"
                placeholder="+357-95502363"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                🔗 LinkedIn Profile
              </label>
              <input
                type="text"
                value={cvData.linkedIn}
                onChange={e => updateField('linkedIn', e.target.value)}
                className="w-full px-3 py-2 bg-[#0b0d13] border border-gray-800 rounded-xl text-xs text-white focus:border-[#d4af37] focus:outline-none"
                placeholder="Fazle Rabbi - Bartender"
              />
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          SECTION 6: ABOUT ME
          ============================================================ */}
      {activeSection === 'about' && (
        <div className="space-y-4 font-['Inter']">
          <div className="flex items-center justify-between pb-2 border-b border-gray-800">
            <div>
              <span className="font-['Montserrat'] font-bold text-sm text-white">About Me Section</span>
              <p className="text-xs text-gray-400">Positioned in the left sidebar below photo</p>
            </div>
            <label className="flex items-center gap-2 cursor-pointer text-xs">
              <input
                type="checkbox"
                checked={cvData.aboutMe.enabled}
                onChange={e =>
                  updateField('aboutMe', { ...cvData.aboutMe, enabled: e.target.checked })
                }
                className="rounded accent-[#d4af37]"
              />
              <span className="text-gray-300">Visible</span>
            </label>
          </div>

          <textarea
            rows={5}
            value={cvData.aboutMe.content}
            onChange={e =>
              updateField('aboutMe', { ...cvData.aboutMe, content: e.target.value })
            }
            className="w-full p-3 bg-[#0b0d13] border border-gray-800 rounded-2xl text-xs text-white leading-relaxed focus:border-[#d4af37] focus:outline-none resize-none"
            placeholder="Write your professional summary..."
          />
        </div>
      )}

      {/* ============================================================
          SECTION 7: PERSONAL INFORMATION
          ============================================================ */}
      {activeSection === 'personal' && (
        <div className="space-y-4 font-['Inter']">
          <div className="flex items-center justify-between pb-2 border-b border-gray-800">
            <div>
              <span className="font-['Montserrat'] font-bold text-sm text-white">Personal Information Items</span>
              <p className="text-xs text-gray-400">Displayed in sidebar (Name, DOB, Passport, etc.)</p>
            </div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={cvData.personalInfo.enabled}
                  onChange={e =>
                    updateField('personalInfo', { ...cvData.personalInfo, enabled: e.target.checked })
                  }
                  className="rounded accent-[#d4af37]"
                />
                <span className="text-gray-300">Visible</span>
              </label>

              <button
                type="button"
                onClick={() => {
                  const newItem: PersonalInfoItem = {
                    id: `pi-${Date.now()}`,
                    label: 'New Field',
                    value: 'Value',
                  };
                  updateField('personalInfo', {
                    ...cvData.personalInfo,
                    items: [...cvData.personalInfo.items, newItem],
                  });
                }}
                className="px-3 py-1 rounded-xl bg-gray-800 hover:bg-gray-700 text-xs text-[#ffd700] flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Field
              </button>
            </div>
          </div>

          <div className="space-y-2">
            {cvData.personalInfo.items.map((item, idx) => (
              <div key={item.id} className="flex items-center gap-2 p-2 bg-[#0b0d13] border border-gray-800 rounded-xl">
                <input
                  type="text"
                  value={item.label}
                  onChange={e => {
                    const list = [...cvData.personalInfo.items];
                    list[idx].label = e.target.value;
                    updateField('personalInfo', { ...cvData.personalInfo, items: list });
                  }}
                  className="w-1/3 px-2.5 py-1 bg-[#161a24] border border-gray-700 rounded-lg text-xs text-white focus:outline-none"
                />
                <span className="text-gray-500 font-bold">:</span>
                <input
                  type="text"
                  value={item.value}
                  onChange={e => {
                    const list = [...cvData.personalInfo.items];
                    list[idx].value = e.target.value;
                    updateField('personalInfo', { ...cvData.personalInfo, items: list });
                  }}
                  className="flex-1 px-2.5 py-1 bg-[#161a24] border border-gray-700 rounded-lg text-xs text-white focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    const list = cvData.personalInfo.items.filter((_, i) => i !== idx);
                    updateField('personalInfo', { ...cvData.personalInfo, items: list });
                  }}
                  className="p-1 text-gray-500 hover:text-rose-400"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================
          SECTION 8: TRAINING SUMMARY
          ============================================================ */}
      {activeSection === 'training' && (
        <div className="space-y-4 font-['Inter']">
          <div className="flex items-center justify-between pb-2 border-b border-gray-800">
            <div>
              <span className="font-['Montserrat'] font-bold text-sm text-white">Training Summary</span>
              <p className="text-xs text-gray-400">Bartending, mixology & hygiene courses in sidebar</p>
            </div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={cvData.trainingSummary.enabled}
                  onChange={e =>
                    updateField('trainingSummary', { ...cvData.trainingSummary, enabled: e.target.checked })
                  }
                  className="rounded accent-[#d4af37]"
                />
                <span className="text-gray-300">Visible</span>
              </label>

              <button
                type="button"
                onClick={() => {
                  const newItem: TrainingItem = {
                    id: `tr-${Date.now()}`,
                    text: 'Trained in mixology, cocktail preparation, and beverage pairing',
                  };
                  updateField('trainingSummary', {
                    ...cvData.trainingSummary,
                    items: [...cvData.trainingSummary.items, newItem],
                  });
                }}
                className="px-3 py-1 rounded-xl bg-gray-800 hover:bg-gray-700 text-xs text-[#ffd700] flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Course
              </button>
            </div>
          </div>

          <div className="space-y-2">
            {cvData.trainingSummary.items.map((item, idx) => (
              <div key={item.id} className="flex items-center gap-2 p-2 bg-[#0b0d13] border border-gray-800 rounded-xl">
                <span className="text-gray-500 font-bold select-none">•</span>
                <input
                  type="text"
                  value={item.text}
                  onChange={e => {
                    const list = [...cvData.trainingSummary.items];
                    list[idx].text = e.target.value;
                    updateField('trainingSummary', { ...cvData.trainingSummary, items: list });
                  }}
                  className="flex-1 px-3 py-1.5 bg-[#161a24] border border-gray-700 rounded-lg text-xs text-white focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    const list = cvData.trainingSummary.items.filter((_, i) => i !== idx);
                    updateField('trainingSummary', { ...cvData.trainingSummary, items: list });
                  }}
                  className="p-1 text-gray-500 hover:text-rose-400"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================
          SECTION 9: ACADEMIC QUALIFICATIONS
          ============================================================ */}
      {activeSection === 'education' && (
        <div className="space-y-4 font-['Inter']">
          <div className="flex items-center justify-between pb-2 border-b border-gray-800">
            <div>
              <span className="font-['Montserrat'] font-bold text-sm text-white">Academic Qualifications</span>
              <p className="text-xs text-gray-400">College & High School degrees</p>
            </div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={cvData.academicQualifications.enabled}
                  onChange={e =>
                    updateField('academicQualifications', { ...cvData.academicQualifications, enabled: e.target.checked })
                  }
                  className="rounded accent-[#d4af37]"
                />
                <span className="text-gray-300">Visible</span>
              </label>

              <button
                type="button"
                onClick={() => {
                  const newItem: AcademicItem = {
                    id: `ac-${Date.now()}`,
                    degree: 'Higher Secondary Certificate (H.S.C)',
                    institution: 'Shariatpur Govt. College (City: Sariatpur, Bangladesh)',
                    year: '2019-2021',
                  };
                  updateField('academicQualifications', {
                    ...cvData.academicQualifications,
                    items: [...cvData.academicQualifications.items, newItem],
                  });
                }}
                className="px-3 py-1 rounded-xl bg-gray-800 hover:bg-gray-700 text-xs text-[#ffd700] flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Degree
              </button>
            </div>
          </div>

          <div className="space-y-2">
            {cvData.academicQualifications.items.map((item, idx) => (
              <div key={item.id} className="p-3 bg-[#0b0d13] border border-gray-800 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-white">Degree #{idx + 1}</span>
                  <button
                    type="button"
                    onClick={() => {
                      const list = cvData.academicQualifications.items.filter((_, i) => i !== idx);
                      updateField('academicQualifications', { ...cvData.academicQualifications, items: list });
                    }}
                    className="p-1 text-gray-500 hover:text-rose-400"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    value={item.degree}
                    onChange={e => {
                      const list = [...cvData.academicQualifications.items];
                      list[idx].degree = e.target.value;
                      updateField('academicQualifications', { ...cvData.academicQualifications, items: list });
                    }}
                    className="px-2.5 py-1 bg-[#161a24] border border-gray-700 rounded-lg text-xs text-white"
                    placeholder="Degree title"
                  />
                  <input
                    type="text"
                    value={item.institution}
                    onChange={e => {
                      const list = [...cvData.academicQualifications.items];
                      list[idx].institution = e.target.value;
                      updateField('academicQualifications', { ...cvData.academicQualifications, items: list });
                    }}
                    className="px-2.5 py-1 bg-[#161a24] border border-gray-700 rounded-lg text-xs text-white"
                    placeholder="Institution"
                  />
                  <input
                    type="text"
                    value={item.year}
                    onChange={e => {
                      const list = [...cvData.academicQualifications.items];
                      list[idx].year = e.target.value;
                      updateField('academicQualifications', { ...cvData.academicQualifications, items: list });
                    }}
                    className="px-2.5 py-1 bg-[#161a24] border border-gray-700 rounded-lg text-xs text-white"
                    placeholder="Year"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================
          SECTION 10: LANGUAGES
          ============================================================ */}
      {activeSection === 'languages' && (
        <div className="space-y-4 font-['Inter']">
          <div className="flex items-center justify-between pb-2 border-b border-gray-800">
            <div>
              <span className="font-['Montserrat'] font-bold text-sm text-white">Languages</span>
              <p className="text-xs text-gray-400">Bangla, English, Hindi, Greek, etc.</p>
            </div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={cvData.languages.enabled}
                  onChange={e =>
                    updateField('languages', { ...cvData.languages, enabled: e.target.checked })
                  }
                  className="rounded accent-[#d4af37]"
                />
                <span className="text-gray-300">Visible</span>
              </label>

              <button
                type="button"
                onClick={() => {
                  const newItem: LanguageItem = {
                    id: `lang-${Date.now()}`,
                    language: 'New Language',
                    proficiency: 'Proficient',
                  };
                  updateField('languages', {
                    ...cvData.languages,
                    items: [...cvData.languages.items, newItem],
                  });
                }}
                className="px-3 py-1 rounded-xl bg-gray-800 hover:bg-gray-700 text-xs text-[#ffd700] flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Language
              </button>
            </div>
          </div>

          <div className="space-y-2">
            {cvData.languages.items.map((item, idx) => (
              <div key={item.id} className="flex items-center gap-2 p-2 bg-[#0b0d13] border border-gray-800 rounded-xl">
                <input
                  type="text"
                  value={item.language}
                  onChange={e => {
                    const list = [...cvData.languages.items];
                    list[idx].language = e.target.value;
                    updateField('languages', { ...cvData.languages, items: list });
                  }}
                  className="w-1/2 px-2.5 py-1 bg-[#161a24] border border-gray-700 rounded-lg text-xs text-white"
                  placeholder="Language"
                />
                <input
                  type="text"
                  value={item.proficiency}
                  onChange={e => {
                    const list = [...cvData.languages.items];
                    list[idx].proficiency = e.target.value;
                    updateField('languages', { ...cvData.languages, items: list });
                  }}
                  className="flex-1 px-2.5 py-1 bg-[#161a24] border border-gray-700 rounded-lg text-xs text-white"
                  placeholder="Proficiency (Fluent, B2, etc.)"
                />
                <button
                  type="button"
                  onClick={() => {
                    const list = cvData.languages.items.filter((_, i) => i !== idx);
                    updateField('languages', { ...cvData.languages, items: list });
                  }}
                  className="p-1 text-gray-500 hover:text-rose-400"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
