import React from 'react';
import { CVData, WorkExperience } from '../types/cv';
import { MapPin, Mail, Phone } from 'lucide-react';

interface CVDocumentProps {
  data: CVData;
  scale?: number;
  id?: string;
}

export const CVDocument: React.FC<CVDocumentProps> = ({
  data,
  scale = 1,
  id = 'cv-print-area',
}) => {
  // Sort experiences according to user preference
  const sortedExperiences = [...(data.experiences || [])].sort((a, b) => {
    if (data.experienceSortOrder === 'oldest-first') {
      return (a.startDate || '').localeCompare(b.startDate || '');
    }
    return 0; // maintain default / newest-first
  });

  const partTimeList = data.partTimeExperiences || [];
  const additionalPhotos = (data.additionalPhotos || []).filter(p => p.included && p.url);
  const showPhotosPage = data.showAdditionalPhotosPage !== false && additionalPhotos.length > 0;

  // Natural content-driven capacity calculation for A4:
  // Standard A4 height is 297mm ≈ 1122.5px @ 96 DPI.
  // With 4-5 compact hospitality experiences, part-time role, and inline skills,
  // everything fits cleanly and comfortably on Page 1.
  const PAGE1_USABLE_HEIGHT = 1040;

  const estimateExpHeight = (exp: WorkExperience): number => {
    let h = 32;
    const resps = exp.responsibilities || [];
    for (const r of resps) {
      const lines = Math.max(1, Math.ceil((r || '').length / 70));
      h += lines * 13 + 2;
    }
    return h;
  };

  // Determine intelligent pagination without artificial gaps
  let page1ContentHeight = 100; // header overhead
  const page1Experiences: WorkExperience[] = [];
  const page2Experiences: WorkExperience[] = [];

  for (let i = 0; i < sortedExperiences.length; i++) {
    const exp = sortedExperiences[i];
    const eh = estimateExpHeight(exp) + 8;
    if (page2Experiences.length === 0 && page1ContentHeight + eh <= PAGE1_USABLE_HEIGHT) {
      page1Experiences.push(exp);
      page1ContentHeight += eh;
    } else {
      page2Experiences.push(exp);
    }
  }

  // Part-Time Experience: Positioned naturally right after Work Experience
  const page1PartTime: WorkExperience[] = [];
  const page2PartTime: WorkExperience[] = [];

  if (partTimeList.length > 0) {
    const ptTotal = 24 + partTimeList.reduce((acc, p) => acc + estimateExpHeight(p) + 6, 0);
    if (page2Experiences.length === 0 && page1ContentHeight + ptTotal <= PAGE1_USABLE_HEIGHT) {
      page1PartTime.push(...partTimeList);
      page1ContentHeight += ptTotal;
    } else {
      page2PartTime.push(...partTimeList);
    }
  }

  // Skills Section: Placed naturally after Part-Time Experience
  const skillsCount =
    data.skills && data.skills.enabled && data.skills.items ? data.skills.items.length : 0;
  const skillsHeight = skillsCount > 0 ? 20 + Math.ceil(skillsCount / 3) * 14 : 0;

  let page1HasSkills = false;
  let page2HasSkills = false;

  if (skillsCount > 0) {
    if (
      page2Experiences.length === 0 &&
      page2PartTime.length === 0 &&
      page1ContentHeight + skillsHeight <= PAGE1_USABLE_HEIGHT
    ) {
      page1HasSkills = true;
    } else {
      page2HasSkills = true;
    }
  }

  const isMultiPage = page2Experiences.length > 0 || page2PartTime.length > 0 || page2HasSkills;
  const mainCvPages = isMultiPage ? 2 : 1;
  const photoPagesCount = showPhotosPage ? additionalPhotos.length : 0;
  const totalPages = mainCvPages + photoPagesCount;

  // Timeline Item Renderer
  const renderTimelineItem = (
    exp: WorkExperience,
    isLast: boolean,
    key: string
  ) => {
    return (
      <div key={key} className="relative flex items-start group">
        {/* Left Block: Company Name, Location Pin, Dates */}
        <div className="w-[36%] pr-3 text-left shrink-0">
          <div className="font-['Inter'] font-semibold text-[11px] text-[#1e293b] leading-snug">
            {exp.companyName}
          </div>

          {exp.location && (
            <div className="flex items-start gap-1 font-['Inter'] font-normal text-[8.5px] text-[#4b5563] mt-1 leading-snug">
              <span className="text-red-600 text-[9.5px] shrink-0 select-none">📍</span>
              <span>{exp.location}</span>
            </div>
          )}

          {exp.startDate && (
            <div className="font-['Inter'] font-normal text-[8.5px] text-[#555555] mt-1">
              {exp.startDate} – {exp.endDate || 'Present'}
            </div>
          )}
        </div>

        {/* Center Spine: Vertical timeline line & solid black circular marker */}
        <div className="relative flex flex-col items-center w-5 shrink-0 self-stretch">
          <div className="w-2 h-2 rounded-full bg-[#1e293b] border border-white shadow-xs mt-1 z-10 shrink-0" />
          {!isLast && (
            <div className="w-[1.2px] bg-[#1e293b]/40 flex-1 -mt-0.5 -mb-2" />
          )}
        </div>

        {/* Right Block: Job Title & Responsibilities Bullet Points */}
        <div className="flex-1 pl-2.5 text-left pb-1">
          <div className="flex items-baseline gap-2">
            <h4 className="font-['Inter'] font-semibold text-[11px] text-[#111111] leading-tight">
              {exp.position}
            </h4>
            {exp.employmentType && exp.employmentType !== 'Full-time' && (
              <span className="font-['Inter'] text-[8px] text-[#64748b] font-medium">
                · {exp.employmentType}
              </span>
            )}
          </div>

          {/* Responsibilities list */}
          {exp.responsibilities && exp.responsibilities.length > 0 && (
            <ul className="mt-1 space-y-1 font-['Inter'] font-normal text-[8.8px] leading-[1.4] text-[#222222]">
              {exp.responsibilities.map((resp, rIdx) => (
                <li key={rIdx} className="flex items-start gap-1.5">
                  <span className="text-[#111111] select-none font-bold text-[8.5px] shrink-0 mt-0.5">•</span>
                  <span className="flex-1">{resp}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    );
  };

  // Skills Section Renderer: Compact inline bullet style matching reference
  const renderSkillsSection = () => {
    if (!data.skills || !data.skills.enabled || !data.skills.items || data.skills.items.length === 0) {
      return null;
    }

    return (
      <div className="mt-4 pt-2.5 border-t border-[#1e293b]/40 pb-1">
        <h3 className="font-['Montserrat'] font-semibold text-center text-[11.5px] tracking-[0.25em] text-[#1e293b] uppercase mb-1.5">
          S K I L L
        </h3>
        <div className="flex flex-wrap items-center justify-center gap-x-3.5 gap-y-1.5 font-['Inter'] font-medium text-[8.2px] text-[#374151] uppercase tracking-wide text-center leading-relaxed max-w-[96%] mx-auto">
          {data.skills.items.map((skill, sIdx) => (
            <span key={sIdx} className="inline-flex items-center gap-1.5 whitespace-nowrap">
              <span className="text-[#111111] select-none font-bold text-[8px]">•</span>
              <span>{skill}</span>
            </span>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div
      id={id}
      className="flex flex-col items-center gap-8 print:gap-0 print:m-0"
      style={{
        transform: scale !== 1 ? `scale(${scale})` : undefined,
        transformOrigin: 'top center',
      }}
    >
      {/* ============================================================
          PAGE 1: HOSPITALITY CURRICULUM VITAE
          Exact Visual Match to User Reference Screenshot:
          - Dark Charcoal Sidebar (#333333) with Circular Photo
          - Pure White Main Area (#FFFFFF)
          - Name & Spaced Title on Top Left
          - Contact Info on Top Right with Icons
          - Work Experience with Vertical Timeline
          - PART-TIME EXPERIENCE
          - Inline Bullet S K I L L Section
          ============================================================ */}
      <div
        className="cv-page relative bg-white text-[#111111] shadow-2xl print:shadow-none overflow-hidden flex flex-row items-stretch"
        style={{
          width: '210mm',
          minHeight: '297mm',
          height: '297mm',
          boxSizing: 'border-box',
        }}
      >
        {/* LEFT SIDEBAR: Dark Charcoal (#424242) */}
        <aside className="w-[70mm] flex-shrink-0 bg-[#424242] text-[#f3f4f6] px-4 py-5 flex flex-col justify-between select-none">
          <div className="space-y-4">
            {/* Circular Profile Photo in upper-left sidebar */}
            <div className="flex flex-col items-center pt-0.5 pb-1">
              <div className="relative w-26 h-26 rounded-full overflow-hidden border-2 border-white/90 shadow-md bg-[#252525] flex items-center justify-center">
                {data.photoUrl ? (
                  <img
                    src={data.photoUrl}
                    alt={data.fullName}
                    className="w-full h-full object-cover object-top"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80';
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-3xl font-bold font-['Montserrat'] text-white/40">
                    {data.fullName?.charAt(0) || 'F'}
                  </div>
                )}
              </div>
            </div>

            {/* 1. ABOUT ME */}
            {data.aboutMe.enabled && (
              <div>
                <h3 className="font-['Montserrat'] font-semibold text-[11px] tracking-wider text-white uppercase">
                  {data.aboutMe.title || 'ABOUT ME'}
                </h3>
                <div className="w-full h-[1px] bg-white/60 mt-0.5 mb-1.5" />
                <p className="font-['Inter'] font-normal text-[8.8px] leading-[1.38] text-white/90 text-justify">
                  {data.aboutMe.content}
                </p>
              </div>
            )}

            {/* 2. PERSONAL INFORMATION - Professionally arranged with comfortable spacing */}
            {data.personalInfo.enabled && (
              <div>
                <h3 className="font-['Montserrat'] font-semibold text-[11px] tracking-wider text-white uppercase">
                  {data.personalInfo.title || 'PERSONAL INFORMATION'}
                </h3>
                <div className="w-full h-[1px] bg-white/60 mt-0.5 mb-1.5" />
                <div className="space-y-2 font-['Inter'] text-[9px] text-white/90">
                  {data.personalInfo.items.map(item => (
                    <div key={item.id} className="leading-snug">
                      <span className="font-semibold text-white">{item.label} : </span>
                      <span className="font-normal text-white/85">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 3. TRAINING SUMMARY */}
            {data.trainingSummary.enabled && (
              <div>
                <h3 className="font-['Montserrat'] font-semibold text-[11px] tracking-wider text-white uppercase">
                  {data.trainingSummary.title || 'TRAINING SUMMARY'}
                </h3>
                <div className="w-full h-[1px] bg-white/60 mt-0.5 mb-1.5" />
                <ul className="space-y-1 font-['Inter'] font-normal text-[8.2px] leading-snug text-white/90">
                  {data.trainingSummary.items.map(item => (
                    <li key={item.id} className="flex items-start gap-1">
                      <span className="text-white select-none">•</span>
                      <span>{item.text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* 4. ACADEMIC QUALIFICATIONS */}
            {data.academicQualifications.enabled && (
              <div>
                <h3 className="font-['Montserrat'] font-semibold text-[11px] tracking-wider text-white uppercase">
                  {data.academicQualifications.title || 'ACADEMIC QUALIFICATIONS'}
                </h3>
                <div className="w-full h-[1px] bg-white/60 mt-0.5 mb-1.5" />
                <div className="space-y-1 font-['Inter'] text-[8.2px] text-white/90">
                  {data.academicQualifications.items.map(item => (
                    <div key={item.id} className="leading-tight">
                      <div className="font-semibold text-white">{item.degree}</div>
                      <div className="font-normal text-white/80 text-[8px]">{item.institution}</div>
                      {item.year && <div className="font-normal text-white/70 text-[7.5px]">{item.year}</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 5. LANGUAGES */}
            {data.languages.enabled && (
              <div>
                <h3 className="font-['Montserrat'] font-semibold text-[11px] tracking-wider text-white uppercase">
                  {data.languages.title || 'LANGUAGE'}
                </h3>
                <div className="w-full h-[1px] bg-white/60 mt-0.5 mb-1.5" />
                <div className="space-y-1.2 font-['Inter'] text-[8.5px] text-white/90">
                  {data.languages.items.map(item => (
                    <div key={item.id} className="flex justify-between leading-tight">
                      <span className="font-normal text-white">{item.language}</span>
                      <span className="font-normal text-white/80 text-[8px]">{item.proficiency}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar Bottom Page Indicator */}
          <div className="text-[8px] font-['Inter'] font-normal text-white/50 text-center pt-2 border-t border-white/10 mt-auto">
            Page 1 of {totalPages}
          </div>
        </aside>

        {/* RIGHT MAIN AREA: Pure White (#FFFFFF) */}
        <main className="flex-1 bg-white text-[#111111] px-5 py-4 flex flex-col justify-between overflow-hidden">
          <div>
            {/* Header: Full Name, Professional Title, Contact Information */}
            <header className="flex items-start justify-between pb-2.5">
              {/* Left Header: Name & Spaced Title */}
              <div className="space-y-0.5">
                <h1 className="font-['Montserrat'] font-bold text-[24px] leading-tight text-[#0f172a] tracking-tight">
                  {data.fullName}
                </h1>
                <div className="font-['Montserrat'] font-medium text-[11.5px] tracking-[0.25em] text-[#334155] uppercase">
                  {data.professionalTitle.split('').join(' ')}
                </div>
              </div>

              {/* Right Contact Info: Minimal icons on the right */}
              <div className="space-y-0.5 text-right font-['Inter'] font-normal text-[8.8px] text-[#222222] max-w-[240px]">
                {data.location && (
                  <div className="flex items-center justify-end gap-1.5 leading-snug">
                    <span className="text-right">{data.location}</span>
                    <span className="text-red-600 shrink-0 font-bold select-none text-[10px]">📍</span>
                  </div>
                )}

                {data.email && (
                  <div className="flex items-center justify-end gap-1.5 leading-snug">
                    <span className="text-right truncate">{data.email}</span>
                    <span className="text-[#1e293b] shrink-0">
                      <Mail className="w-3.5 h-3.5 text-[#1e293b] fill-[#1e293b]" />
                    </span>
                  </div>
                )}

                {data.phone && (
                  <div className="flex items-center justify-end gap-1.5 leading-snug">
                    <span className="text-right font-mono text-[8.5px]">{data.phone}</span>
                    <span className="text-[#1e293b] shrink-0">
                      <Phone className="w-3.5 h-3.5 text-[#1e293b] fill-[#1e293b]" />
                    </span>
                  </div>
                )}

                {data.linkedIn && (
                  <div className="flex items-center justify-end gap-1.5 leading-snug">
                    <span className="text-right truncate">{data.linkedIn}</span>
                    <span className="text-[#1e293b] font-bold text-[10px] leading-none shrink-0">
                      in
                    </span>
                  </div>
                )}
              </div>
            </header>

            {/* Work Experience Section Title with dividing bar */}
            <div className="mt-1 mb-2">
              <div className="flex items-baseline justify-between">
                <h2 className="font-['Montserrat'] font-semibold text-[14px] text-[#1e293b] tracking-wide inline-block uppercase">
                  {data.workExperienceTitle || 'Work Experience'}
                </h2>
                <span className="font-['Inter'] font-normal text-[8.5px] text-[#475569] uppercase tracking-wider pr-1">
                  {data.jobResponsibilitiesTitle || 'JOB RESPONSIBILITIES'}
                </span>
              </div>
              <div className="w-full h-[1.2px] bg-[#1e293b]/70 mt-0.5 mb-1.5" />
            </div>

            {/* Dynamic Work Experience Timeline List for Page 1 */}
            <div className="relative space-y-2.5 pt-0.5">
              {page1Experiences.map((exp, index) =>
                renderTimelineItem(
                  exp,
                  index === page1Experiences.length - 1 && page1PartTime.length === 0 && !page1HasSkills,
                  `p1-${exp.id}`
                )
              )}
            </div>

            {/* PART-TIME EXPERIENCE: Positioned naturally right after Work Experience */}
            {page1PartTime.length > 0 && (
              <div className="mt-3">
                <div className="flex items-baseline justify-between mb-0.5">
                  <h3 className="font-['Montserrat'] font-semibold text-[11.5px] text-[#1e293b] tracking-wider uppercase inline-block">
                    PART-TIME EXPERIENCE
                  </h3>
                </div>
                <div className="w-full h-[1px] bg-[#1e293b]/50 mt-0.5 mb-1.5" />

                <div className="relative space-y-2 pt-0.5">
                  {page1PartTime.map((exp, index) =>
                    renderTimelineItem(
                      exp,
                      index === page1PartTime.length - 1 && !page1HasSkills,
                      `p1-pt-${exp.id}`
                    )
                  )}
                </div>
              </div>
            )}

            {/* SKILLS SECTION: Compact inline bullets right below Part-Time Experience */}
            {page1HasSkills && renderSkillsSection()}
          </div>

          {/* Bottom Footer: Placed with clean spacing */}
          <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[8px] font-['Inter'] font-normal text-[#888888] mt-auto">
            <span>{data.fullName} — Hospitality Curriculum Vitae</span>
            <span>Page 1 of {totalPages}</span>
          </div>
        </main>
      </div>

      {/* ============================================================
          PAGE 2 (OVERFLOW ONLY: If user adds 6+ experiences)
          ============================================================ */}
      {isMultiPage && (
        <div
          className="cv-page relative bg-white text-[#111111] shadow-2xl print:shadow-none overflow-hidden flex flex-row items-stretch"
          style={{
            width: '210mm',
            minHeight: '297mm',
            height: '297mm',
            boxSizing: 'border-box',
          }}
        >
          {/* Page 2 Sidebar (Matching Charcoal Background #424242) */}
          <aside className="w-[70mm] flex-shrink-0 bg-[#424242] text-[#f3f4f6] px-4 py-5 flex flex-col justify-between select-none">
            <div className="space-y-4">
              <div className="pt-1 pb-2 text-center border-b border-white/20">
                <div className="font-['Montserrat'] font-bold text-xs tracking-wider uppercase text-white/95">
                  {data.fullName}
                </div>
                <div className="font-['Montserrat'] font-medium text-[9px] tracking-widest uppercase text-white/70 mt-0.5">
                  {data.professionalTitle}
                </div>
              </div>

              {/* Continuation sections on Page 2 if applicable */}
              <div className="space-y-2 font-['Inter'] font-normal text-[8.5px] text-white/80 pt-1">
                {data.location && (
                  <div className="leading-snug">
                    <span className="text-white/50 block text-[7.5px] uppercase tracking-wider font-semibold">Location</span>
                    <span className="text-white/90">{data.location}</span>
                  </div>
                )}
                {data.email && (
                  <div className="leading-snug">
                    <span className="text-white/50 block text-[7.5px] uppercase tracking-wider font-semibold">Email</span>
                    <span className="text-white/90">{data.email}</span>
                  </div>
                )}
                {data.phone && (
                  <div className="leading-snug">
                    <span className="text-white/50 block text-[7.5px] uppercase tracking-wider font-semibold">Phone</span>
                    <span className="text-white/90">{data.phone}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar Bottom Page Indicator */}
            <div className="text-[8px] font-['Inter'] font-normal text-white/50 text-center pt-2 border-t border-white/10 mt-auto">
              Page 2 of {totalPages}
            </div>
          </aside>

          {/* Page 2 Main Content Area */}
          <main className="flex-1 bg-white text-[#111111] px-5 py-4 flex flex-col justify-between overflow-hidden">
            <div>
              {/* Continued Work Experience */}
              {page2Experiences.length > 0 && (
                <div>
                  <div className="flex items-baseline justify-between mb-1">
                    <h2 className="font-['Montserrat'] font-semibold text-[14px] text-[#1e293b] tracking-wide inline-block uppercase">
                      {data.workExperienceTitle || 'Work Experience'} (Continued)
                    </h2>
                  </div>
                  <div className="w-full h-[1.2px] bg-[#1e293b]/70 mt-0.5 mb-2" />

                  <div className="relative space-y-1.5 pt-0.5">
                    {page2Experiences.map((exp, index) =>
                      renderTimelineItem(
                        exp,
                        index === page2Experiences.length - 1 && page2PartTime.length === 0 && !page2HasSkills,
                        `p2-exp-${exp.id}`
                      )
                    )}
                  </div>
                </div>
              )}

              {/* Continued Part-Time Experience on Page 2 */}
              {page2PartTime.length > 0 && (
                <div className="mt-2.5">
                  <div className="flex items-baseline justify-between mb-0.5">
                    <h3 className="font-['Montserrat'] font-semibold text-[11.5px] text-[#1e293b] tracking-wider uppercase inline-block">
                      PART-TIME EXPERIENCE
                    </h3>
                  </div>
                  <div className="w-full h-[1px] bg-[#1e293b]/50 mt-0.5 mb-1.5" />

                  <div className="relative space-y-1.5 pt-0.5">
                    {page2PartTime.map((exp, index) =>
                      renderTimelineItem(
                        exp,
                        index === page2PartTime.length - 1 && !page2HasSkills,
                        `p2-pt-${exp.id}`
                      )
                    )}
                  </div>
                </div>
              )}

              {/* Skills on Page 2 if pushed */}
              {page2HasSkills && renderSkillsSection()}
            </div>

            {/* Bottom Footer: Placed with clean spacing */}
            <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[8px] font-['Inter'] font-normal text-[#888888] mt-auto">
              <span>{data.fullName} — Hospitality Curriculum Vitae</span>
              <span>Page 2 of {totalPages}</span>
            </div>
          </main>
        </div>
      )}

      {/* ============================================================
          SUPPORTING WORKPLACE PHOTOS & PORTFOLIO VERIFICATION
          - 1 Full A4 page per photo strictly after CV pages
          - Original aspect ratio preserved without stretching, cropping, or distortion
          - Free of decorative CV framing, headers, or footers
          ============================================================ */}
      {showPhotosPage &&
        additionalPhotos.map((photo, pIdx) => (
          <div
            key={photo.id || `photo-page-${pIdx}`}
            className="cv-page relative bg-white shadow-2xl print:shadow-none overflow-hidden flex items-center justify-center"
            style={{
              width: '210mm',
              minHeight: '297mm',
              height: '297mm',
              boxSizing: 'border-box',
              padding: '12mm',
            }}
          >
            <img
              src={photo.url}
              alt={`Supporting Document ${pIdx + 1}`}
              className="max-w-full max-h-full w-auto h-auto object-contain select-none"
              style={{
                maxWidth: '186mm',
                maxHeight: '273mm',
              }}
            />
          </div>
        ))}
    </div>
  );
};
