import React from 'react';

interface CCDLogoProps {
  className?: string;
  size?: number;
  showSubtitle?: boolean;
  variant?: 'blue' | 'gold';
}

/**
 * CCD Logo Component
 * Renders the official application logo:
 * Clean white CCD emblem on a rich sapphire/royal blue rounded square (matching logo.jpg),
 * with perfect 1:1 aspect ratio, never oversized, and never distorted.
 */
export const CCDLogo: React.FC<CCDLogoProps> = ({
  className = '',
  size = 40,
  showSubtitle = false,
  variant = 'blue',
}) => {
  return (
    <div className={`flex items-center gap-3 shrink-0 ${className}`}>
      <div
        className="relative flex items-center justify-center rounded-xl overflow-hidden shadow-md shrink-0 transition-transform duration-200 hover:scale-[1.02]"
        style={{ width: size, height: size, aspectRatio: '1 / 1' }}
        title="CCD Official Logo"
      >
        {variant === 'blue' ? (
          // Official Blue Square with Clean White CCD Emblem (matching logo.jpg)
          <div className="w-full h-full relative flex items-center justify-center bg-gradient-to-br from-[#1d4ed8] via-[#1e40af] to-[#172554] p-1 border border-blue-400/30">
            {/* Subtle gloss reflection overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-black/25 pointer-events-none" />

            <svg
              viewBox="0 0 100 100"
              className="w-full h-full relative z-10 select-none"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Outer delicate frame */}
              <rect
                x="8"
                y="8"
                width="84"
                height="84"
                rx="14"
                stroke="rgba(255,255,255,0.35)"
                strokeWidth="1.5"
                fill="none"
              />

              {/* Clean White CCD Monogram */}
              {/* First 'C' */}
              <path
                d="M37 34 C28 36 22 43 22 51 C22 59 28 66 38 66 C42 66 46 64 48 61"
                stroke="#FFFFFF"
                strokeWidth="5"
                strokeLinecap="round"
                fill="none"
              />

              {/* Central 'C' (Interlocking) */}
              <path
                d="M52 32 C44 34 38 42 38 51 C38 60 44 68 53 68 C59 68 64 64 66 61"
                stroke="#FFFFFF"
                strokeWidth="5"
                strokeLinecap="round"
                fill="none"
              />

              {/* 'D' */}
              <path
                d="M62 33 L62 67 M62 33 C72 33 79 40 79 50 C79 60 72 67 62 67"
                stroke="#FFFFFF"
                strokeWidth="5"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />

              {/* Top Accent Star */}
              <polygon
                points="50,16 52,21 57,21 53,24 55,29 50,26 45,29 47,24 43,21 48,21"
                fill="#FFFFFF"
              />

              {/* Bottom Subtle Baseline */}
              <path
                d="M30 76 L70 76"
                stroke="#FFFFFF"
                strokeWidth="2.5"
                strokeLinecap="round"
                opacity="0.85"
              />
            </svg>
          </div>
        ) : (
          // Gold Metallic Variant
          <div className="w-full h-full relative flex items-center justify-center bg-gradient-to-br from-[#1b1e28] via-[#0d0f14] to-[#050608] p-1 border border-[#d4af37]/40">
            <svg
              viewBox="0 0 100 100"
              className="w-full h-full relative z-10 select-none"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="goldMet" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#F9E498" />
                  <stop offset="40%" stopColor="#D4AF37" />
                  <stop offset="80%" stopColor="#AA771C" />
                  <stop offset="100%" stopColor="#F3E5AB" />
                </linearGradient>
              </defs>

              <rect
                x="8"
                y="8"
                width="84"
                height="84"
                rx="14"
                stroke="url(#goldMet)"
                strokeWidth="2"
                fill="none"
              />

              {/* CCD Monogram in Gold */}
              <path
                d="M37 34 C28 36 22 43 22 51 C22 59 28 66 38 66 C42 66 46 64 48 61"
                stroke="url(#goldMet)"
                strokeWidth="5"
                strokeLinecap="round"
                fill="none"
              />
              <path
                d="M52 32 C44 34 38 42 38 51 C38 60 44 68 53 68 C59 68 64 64 66 61"
                stroke="url(#goldMet)"
                strokeWidth="5"
                strokeLinecap="round"
                fill="none"
              />
              <path
                d="M62 33 L62 67 M62 33 C72 33 79 40 79 50 C79 60 72 67 62 67"
                stroke="url(#goldMet)"
                strokeWidth="5"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
              <polygon
                points="50,16 52,21 57,21 53,24 55,29 50,26 45,29 47,24 43,21 48,21"
                fill="url(#goldMet)"
              />
              <path
                d="M30 76 L70 76"
                stroke="url(#goldMet)"
                strokeWidth="2.5"
                strokeLinecap="round"
                opacity="0.85"
              />
            </svg>
          </div>
        )}
      </div>

      {showSubtitle && (
        <div className="flex flex-col select-none">
          <span className="font-['Montserrat'] tracking-wider text-base font-bold text-white flex items-center gap-1.5">
            <span>CCD</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-400/30 font-semibold tracking-normal">
              Official
            </span>
          </span>
          <span className="text-[10px] tracking-[0.16em] uppercase text-[#94a3b8] font-medium">
            A Better You Every Day
          </span>
        </div>
      )}
    </div>
  );
};
