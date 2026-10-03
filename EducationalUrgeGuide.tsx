import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Wind,
  Compass,
  Footprints,
  Sparkles,
  Timer,
  CheckCircle2,
  ChevronRight,
  Flame,
  BrainCircuit,
} from 'lucide-react';

interface EducationalUrgeGuideProps {
  onClose?: () => void;
  habitName?: string;
}

export const EducationalUrgeGuide: React.FC<EducationalUrgeGuideProps> = ({
  onClose,
  habitName = 'compulsive habit',
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [isBreathing, setIsBreathing] = useState(false);
  const [breathPhase, setBreathPhase] = useState<'Inhale' | 'Hold' | 'Exhale'>('Inhale');
  const [breathTimer, setBreathTimer] = useState(4);
  const [delayTimerSeconds, setDelayTimerSeconds] = useState(600); // 10 minutes
  const [delayActive, setDelayActive] = useState(false);

  // 4-7-8 Breathing Loop
  useEffect(() => {
    if (!isBreathing) return;

    let timeout: NodeJS.Timeout;
    if (breathPhase === 'Inhale') {
      setBreathTimer(4);
      const interval = setInterval(() => {
        setBreathTimer(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            setBreathPhase('Hold');
            return 7;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    } else if (breathPhase === 'Hold') {
      const interval = setInterval(() => {
        setBreathTimer(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            setBreathPhase('Exhale');
            return 8;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    } else if (breathPhase === 'Exhale') {
      const interval = setInterval(() => {
        setBreathTimer(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            setBreathPhase('Inhale');
            return 4;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isBreathing, breathPhase]);

  // 10-Minute Delay Timer
  useEffect(() => {
    if (!delayActive || delayTimerSeconds <= 0) return;
    const t = setInterval(() => {
      setDelayTimerSeconds(s => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(t);
  }, [delayActive, delayTimerSeconds]);

  const formatDelayTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const steps = [
    {
      title: '1. Recognize the Wave (Urge Surfing)',
      icon: <BrainCircuit className="w-5 h-5 text-[#d4af37]" />,
      summary: 'An urge is not a command; it is simply a temporary neurochemical surge.',
      details:
        'Cravings resemble ocean waves: they rise in intensity, reach a crest, and naturally break and dissolve within 10 to 15 minutes. You do not need to fight the wave or drown in it. Observe the physical sensations without self-judgment.',
      actionTitle: 'Start 10-Minute Urge Surfer Timer',
    },
    {
      title: '2. Immediate Physical Displacement',
      icon: <Footprints className="w-5 h-5 text-emerald-400" />,
      summary: 'Change your physical coordinate instantly. Do not stay alone in the trigger zone.',
      details:
        'Stand up right now. Step away from your phone/screen. Walk to a different room, open the front door for fresh air, or immediately splash cold water on your temples and wrists. Cold water triggers the mammalian diving reflex, instantly lowering heart rate and blunting dopamine cravings.',
    },
    {
      title: '3. Regulate the Nervous System (4-7-8 Breath)',
      icon: <Wind className="w-5 h-5 text-sky-400" />,
      summary: 'Shift your autonomic nervous system from panic/craving into parasympathetic calm.',
      details:
        'Inhale quietly through your nose for 4 seconds, hold your breath steadily for 7 seconds, and exhale completely through your mouth for 8 seconds. Four cycles dramatically lower neurological adrenaline.',
      actionTitle: 'Interactive Breathing Tool',
    },
    {
      title: '4. Non-Destructive Dopamine Pivot',
      icon: <Sparkles className="w-5 h-5 text-amber-400" />,
      summary: 'Provide your brain with an immediate sensory reset.',
      details:
        'Your brain is demanding a dopamine shift. Satisfy it with a constructive ritual: complete 15 push-ups, drink a large glass of ice water, pull a fresh espresso, or prepare an artisanal mocktail from your CCD Recipe Library.',
    },
    {
      title: '5. Reclaim Your Sovereignty & Purpose',
      icon: <Compass className="w-5 h-5 text-[#f9e498]" />,
      summary: 'Remember who you are becoming and what you are building.',
      details:
        `Conquering this exact moment is where true character is forged. The temporary dopamine spike of ${habitName} lasts minutes, but the regret lasts days. Your pride, your mental sharpness, and your family's future are worth infinitely more.`,
    },
  ];

  return (
    <div className="bg-[#12151e] border border-[#d4af37]/30 rounded-3xl p-6 sm:p-8 text-[#e2e8f0] shadow-2xl max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between pb-6 border-b border-[#232838]">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#d4af37]/10 border border-[#d4af37]/40 flex items-center justify-center text-[#d4af37]">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold font-['Cinzel'] text-[#fdf8f0] tracking-wide">
              Emergency Urge Protocol
            </h2>
            <p className="text-xs sm:text-sm text-[#94a3b8] mt-0.5">
              Practical, scientific guidance when cravings feel intense
            </p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-[#94a3b8] hover:text-[#fdf8f0] p-1.5 rounded-xl hover:bg-[#1b202e] transition"
          >
            ✕
          </button>
        )}
      </div>

      {/* Emergency Delay Bar */}
      <div className="mt-6 p-4 rounded-2xl bg-gradient-to-r from-[#171a26] via-[#1f2434] to-[#171a26] border border-[#d4af37]/25 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Timer className="w-6 h-6 text-[#ffd700]" />
          <div>
            <div className="text-xs uppercase tracking-wider text-[#94a3b8] font-semibold">
              The 10-Minute Urge Delay
            </div>
            <div className="text-xl font-bold font-mono text-[#ffd700]">
              {formatDelayTime(delayTimerSeconds)}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!delayActive ? (
            <button
              onClick={() => {
                setDelayActive(true);
              }}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#aa771c] text-[#0b0c10] font-semibold text-xs tracking-wider uppercase shadow hover:opacity-90 transition"
            >
              Start 10-Min Timer
            </button>
          ) : (
            <button
              onClick={() => {
                setDelayActive(false);
                setDelayTimerSeconds(600);
              }}
              className="px-4 py-2 rounded-xl bg-[#232838] text-[#e2e8f0] text-xs font-semibold hover:bg-[#2c3347] transition"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Interactive Breathing Tool (if opened) */}
      {isBreathing && (
        <div className="my-6 p-6 rounded-2xl bg-[#0b0d13] border border-sky-500/40 text-center flex flex-col items-center justify-center animate-fade-in">
          <div className="text-xs uppercase tracking-widest text-sky-400 font-semibold mb-2">
            Autonomic Pacing (4-7-8)
          </div>
          <div className="relative w-36 h-36 flex items-center justify-center my-4">
            <div
              className={`absolute inset-0 rounded-full transition-all duration-1000 ${
                breathPhase === 'Inhale'
                  ? 'bg-sky-500/20 scale-110 border-2 border-sky-400'
                  : breathPhase === 'Hold'
                  ? 'bg-amber-500/20 scale-100 border-2 border-amber-400'
                  : 'bg-emerald-500/20 scale-90 border-2 border-emerald-400'
              }`}
            />
            <div className="relative z-10 text-center">
              <div className="text-lg font-bold text-white tracking-wide">{breathPhase}</div>
              <div className="text-3xl font-mono font-extrabold text-[#ffd700]">{breathTimer}s</div>
            </div>
          </div>
          <p className="text-xs text-[#94a3b8] max-w-sm mb-4">
            Relax your shoulders and jaw. Feel your abdomen expand on the inhale and drop on the exhale.
          </p>
          <button
            onClick={() => setIsBreathing(false)}
            className="px-4 py-1.5 text-xs text-[#94a3b8] hover:text-white border border-[#232838] rounded-xl hover:bg-[#1b202e]"
          >
            End Breathing Exercise
          </button>
        </div>
      )}

      {/* Step Selector & Details */}
      <div className="mt-6 space-y-3">
        {steps.map((step, idx) => {
          const isSelected = activeStep === idx;
          return (
            <div
              key={idx}
              className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                isSelected
                  ? 'bg-[#181d2a] border-[#d4af37]/50 shadow-lg'
                  : 'bg-[#10131c] border-[#202534] hover:border-[#2f374c]'
              }`}
            >
              <button
                onClick={() => setActiveStep(idx)}
                className="w-full p-4 flex items-center justify-between text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-[#0b0d13] border border-[#232838]">
                    {step.icon}
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-semibold text-[#f1f5f9]">
                      {step.title}
                    </h3>
                    <p className="text-xs text-[#8c96ab] line-clamp-1">{step.summary}</p>
                  </div>
                </div>
                <ChevronRight
                  className={`w-4 h-4 text-[#94a3b8] transition-transform ${
                    isSelected ? 'rotate-90 text-[#d4af37]' : ''
                  }`}
                />
              </button>

              {isSelected && (
                <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-[#cbd5e1] leading-relaxed border-t border-[#232838]/60 space-y-3">
                  <p>{step.details}</p>
                  {idx === 0 && (
                    <button
                      onClick={() => setDelayActive(true)}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#ffd700]/10 border border-[#ffd700]/30 text-[#ffd700] text-xs font-medium hover:bg-[#ffd700]/20 transition"
                    >
                      <Timer className="w-3.5 h-3.5" /> Start Surfer Countdown
                    </button>
                  )}
                  {idx === 2 && !isBreathing && (
                    <button
                      onClick={() => setIsBreathing(true)}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-sky-500/10 border border-sky-400/30 text-sky-300 text-xs font-medium hover:bg-sky-500/20 transition"
                    >
                      <Wind className="w-3.5 h-3.5" /> Launch Breath Pacer
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom Reassurance */}
      <div className="mt-6 p-4 rounded-2xl bg-[#0b0c10] border border-[#232838] flex items-center gap-3 text-xs text-[#94a3b8]">
        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
        <span>
          Every urge you endure without acting physically weakens the addictive neural connection in your brain. You are stronger than this craving.
        </span>
      </div>
    </div>
  );
};
