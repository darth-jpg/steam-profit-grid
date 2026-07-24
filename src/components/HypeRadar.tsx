'use client';

import React from 'react';
import { Game } from '@/lib/types';
import { Language } from '@/lib/translations';
import { Flame, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface HypeRadarProps {
  games: Game[];
  onSelectGame: (game: Game) => void;
  lang?: Language;
}

export default function HypeRadar({ games, onSelectGame, lang = 'pt' }: HypeRadarProps) {
  // Ordena os jogos pelo maior crescimento de jogadores nas últimas 48h
  const trendingGames = [...games].sort((a, b) => b.playerGrowth48h - a.playerGrowth48h);

  return (
    <div className="w-full bg-gaming-card rounded-xl border border-gaming-border p-5 transition-all duration-300">
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gaming-border">
        <Flame className="w-5 h-5 text-neon-pink animate-pulse" />
        <h2 className="text-xl font-bold text-white tracking-wide font-sans">
          {lang === 'pt' ? 'Hype Radar (48h)' : 'Hype Radar (48h)'}
        </h2>
      </div>

      <p className="text-xs text-neutral-400 mb-4 leading-relaxed">
        {lang === 'pt'
          ? 'Análise das flutuações rápidas de jogadores ativos. Picos de tráfego geram alta especulação e subida de preços de drops.'
          : 'Analysis of rapid active player fluctuations. Traffic surges drive high speculation and case price rallies.'}
      </p>

      <div className="space-y-3">
        {trendingGames.map((game, idx) => {
          const isPositive = game.playerGrowth48h > 0;
          const isZero = game.playerGrowth48h === 0;

          return (
            <div
              key={game.id}
              onClick={() => onSelectGame(game)}
              className="flex items-center justify-between p-3 bg-gaming-dark/60 rounded-lg border border-gaming-border hover:bg-gaming-card-hover cursor-pointer transition-all duration-200"
            >
              <div className="flex items-center gap-2.5">
                <span className="font-mono text-xs text-neutral-500 font-bold w-4">
                  #{idx + 1}
                </span>
                <span className="text-xs font-semibold text-white truncate max-w-28 sm:max-w-none">
                  {game.name}
                </span>
              </div>

              <div className="flex items-center gap-2 font-mono text-xs">
                {isZero ? (
                  <span className="text-neutral-500 flex items-center gap-0.5 font-bold">
                    <Minus className="w-3.5 h-3.5" /> 0.0%
                  </span>
                ) : isPositive ? (
                  <span className="text-neon-green flex items-center gap-0.5 font-bold">
                    <TrendingUp className="w-3.5 h-3.5" /> +{game.playerGrowth48h.toFixed(1)}%
                  </span>
                ) : (
                  <span className="text-neon-pink flex items-center gap-0.5 font-bold">
                    <TrendingDown className="w-3.5 h-3.5" /> {game.playerGrowth48h.toFixed(1)}%
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
