'use client';

import React, { useState, useEffect } from 'react';
import { getSteamWeeklyResetRemaining } from '@/lib/utils';
import { Language, translations } from '@/lib/translations';
import { Timer, Sparkles } from 'lucide-react';

interface WeeklyResetWidgetProps {
  lang?: Language;
}

export default function WeeklyResetWidget({ lang = 'pt' }: WeeklyResetWidgetProps) {
  const [timeLeft, setTimeLeft] = useState(getSteamWeeklyResetRemaining());
  const t = translations[lang];

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(getSteamWeeklyResetRemaining());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="w-full bg-gaming-card rounded-xl border border-gaming-border p-4 transition-all duration-300">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gaming-dark rounded-lg border border-gaming-border text-neon-green">
            <Timer className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white tracking-wide">
                {t.resetTitle}
              </h3>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-gaming-dark text-neutral-400 border border-gaming-border">
                {t.resetLabel}
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">
              {t.resetSubtitle}
            </p>
          </div>
        </div>

        {/* Countdown */}
        <div className="flex items-center gap-1.5 font-mono text-sm sm:text-base font-bold bg-gaming-dark px-3 py-1.5 rounded-lg border border-gaming-border">
          <span className="text-white">{String(timeLeft.days).padStart(2, '0')}</span>
          <span className="text-neutral-500 text-xs">d</span>
          <span className="text-neutral-600">:</span>
          <span className="text-neon-cyan">{String(timeLeft.hours).padStart(2, '0')}</span>
          <span className="text-neutral-500 text-xs">h</span>
          <span className="text-neutral-600">:</span>
          <span className="text-neon-cyan">{String(timeLeft.minutes).padStart(2, '0')}</span>
          <span className="text-neutral-500 text-xs">m</span>
          <span className="text-neutral-600">:</span>
          <span className="text-neon-green text-xs w-6">{String(timeLeft.seconds).padStart(2, '0')}s</span>
        </div>
      </div>

      {/* Advisory Info */}
      <div className="mt-3 pt-2.5 border-t border-gaming-border/60 flex items-center gap-2 text-xs text-neutral-400">
        <Sparkles className="w-3.5 h-3.5 text-neon-green flex-shrink-0" />
        <span>
          {timeLeft.isCloseToReset ? t.tipClose : t.tipFar}
        </span>
      </div>
    </div>
  );
}
