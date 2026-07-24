'use client';

import React, { useState, useEffect } from 'react';
import { Game } from '@/lib/types';
import { Language, translations } from '@/lib/translations';
import { TaxDisplayMode, getAdjustedPrice, formatCurrency, getTaxModeLabel } from '@/lib/utils';
import { Calculator, Clock, Zap, Coins, CheckCircle, XCircle, Info } from 'lucide-react';

interface RoiCalculatorProps {
  games: Game[];
  selectedGame: Game;
  taxMode: TaxDisplayMode;
  onSelectGameById: (id: string) => void;
  lang?: Language;
}

export default function RoiCalculator({
  games,
  selectedGame,
  taxMode,
  onSelectGameById,
  lang = 'pt',
}: RoiCalculatorProps) {
  const [hours, setHours] = useState<number>(24);
  const [powerConsumption, setPowerConsumption] = useState<number>(200);
  const [electricityTariff, setElectricityTariff] = useState<number>(0.20);
  const [includeElectricity, setIncludeElectricity] = useState<boolean>(true);

  const [grossProfit, setGrossProfit] = useState<number>(0);
  const [electricityCost, setElectricityCost] = useState<number>(0);
  const [netProfit, setNetProfit] = useState<number>(0);

  const t = translations[lang];

  useEffect(() => {
    const rawGross = selectedGame.avgDropPrice * selectedGame.dropsPerHour * hours;
    const adjustedGross = getAdjustedPrice(rawGross, taxMode);
    setGrossProfit(adjustedGross);

    const cost = includeElectricity ? (powerConsumption * hours) / 1000 * electricityTariff : 0;
    setElectricityCost(cost);

    setNetProfit(adjustedGross - cost);
  }, [selectedGame, hours, powerConsumption, electricityTariff, includeElectricity, taxMode]);

  const rawHourlyGross = selectedGame.avgDropPrice * selectedGame.dropsPerHour;
  const adjustedHourlyGross = getAdjustedPrice(rawHourlyGross, taxMode);
  const isWorthIt = netProfit > 0;

  return (
    <div className="w-full bg-gaming-card rounded-xl border border-gaming-border p-5 transition-all duration-300">
      <div className="flex items-center justify-between mb-4 border-b border-gaming-border pb-3">
        <div className="flex items-center gap-2">
          <Calculator className="w-5 h-5 text-neon-green" />
          <h2 className="text-xl font-bold text-white tracking-wide">
            {t.roiTitle}
          </h2>
        </div>
        <span className="text-xs font-mono text-neutral-400 bg-gaming-dark px-2 py-1 rounded border border-gaming-border">
          {t.roiSubtitle} {getTaxModeLabel(taxMode)}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Input Form */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">
              {t.selectGame}
            </label>
            <select
              value={selectedGame.id}
              onChange={(e) => onSelectGameById(e.target.value)}
              className="w-full bg-gaming-dark text-neutral-200 border border-gaming-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-neon-cyan transition-colors"
            >
              {games.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name} ({formatCurrency(getAdjustedPrice(g.avgDropPrice * g.dropsPerHour, taxMode), 3)}/h)
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex justify-between mb-1.5">
              <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-neutral-500" />
                {t.farmHours}
              </label>
              <span className="text-xs font-mono font-bold text-neon-cyan">{hours} {lang === 'pt' ? 'horas' : 'hours'}</span>
            </div>
            <input
              type="range"
              min="1"
              max="168"
              value={hours}
              onChange={(e) => setHours(parseInt(e.target.value))}
              className="w-full h-1 bg-gaming-dark rounded-lg appearance-none cursor-pointer accent-neon-cyan"
            />
            <div className="flex justify-between text-[10px] text-neutral-500 font-mono mt-1">
              <span>1h</span>
              <span>24h ({lang === 'pt' ? '1 Dia' : '1 Day'})</span>
              <span>72h ({lang === 'pt' ? '3 Dias' : '3 Days'})</span>
              <span>168h ({lang === 'pt' ? '1 Sem' : '1 Week'})</span>
            </div>
          </div>

          <div className="pt-2 border-t border-gaming-border/40">
            <label className="flex items-center gap-2 cursor-pointer text-sm text-neutral-300 mb-3">
              <input
                type="checkbox"
                checked={includeElectricity}
                onChange={(e) => setIncludeElectricity(e.target.checked)}
                className="rounded border-gaming-border text-neon-cyan focus:ring-neon-cyan bg-gaming-dark"
              />
              {t.calcElectricity}
            </label>

            {includeElectricity && (
              <div className="grid grid-cols-2 gap-3 pl-6">
                <div>
                  <label className="block text-[10px] font-semibold text-neutral-400 uppercase tracking-wider mb-1">
                    {t.pcWatts}
                  </label>
                  <input
                    type="number"
                    value={powerConsumption}
                    onChange={(e) => setPowerConsumption(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full bg-gaming-dark text-neutral-200 border border-gaming-border rounded px-2.5 py-1 text-xs font-mono focus:outline-none focus:border-neon-cyan"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-neutral-400 uppercase tracking-wider mb-1">
                    {t.tariff}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={electricityTariff}
                    onChange={(e) => setElectricityTariff(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full bg-gaming-dark text-neutral-200 border border-gaming-border rounded px-2.5 py-1 text-xs font-mono focus:outline-none focus:border-neon-cyan"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Results Panel */}
        <div className="bg-gaming-dark/60 border border-gaming-border rounded-lg p-4 flex flex-col justify-between">
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-neutral-300 pb-2 border-b border-gaming-border/40 uppercase tracking-wide">
              {t.resultsTitle} ({getTaxModeLabel(taxMode)})
            </h3>

            <div className="flex justify-between items-center text-xs">
              <span className="text-neutral-400 flex items-center gap-1">
                <Coins className="w-3.5 h-3.5 text-neutral-500" /> {t.adjustedReturn}
              </span>
              <span className="font-mono text-white font-bold">{formatCurrency(grossProfit)}</span>
            </div>

            {includeElectricity && (
              <div className="flex justify-between items-center text-xs">
                <span className="text-neutral-400 flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-neon-pink" /> {t.electricityCost}
                </span>
                <span className="font-mono text-neon-pink font-bold">-{formatCurrency(electricityCost)}</span>
              </div>
            )}

            <div className="pt-2 border-t border-gaming-border/40 flex justify-between items-center">
              <span className="text-sm font-bold text-neutral-300">{t.estNetProfit}</span>
              <span
                className={`font-mono text-lg font-extrabold ${
                  isWorthIt ? 'text-neon-green' : 'text-neon-pink'
                }`}
              >
                {formatCurrency(netProfit)}
              </span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-gaming-border/40">
            {isWorthIt ? (
              <div className="flex gap-2.5 items-start bg-neon-green/10 border border-neon-green/20 rounded p-3 text-xs text-neutral-300">
                <CheckCircle className="w-5 h-5 text-neon-green flex-shrink-0" />
                <div>
                  <span className="font-bold text-neon-green">{t.profitable}</span>
                  <p className="text-[10px] text-neutral-400 mt-0.5">
                    {t.profitableDesc.replace('{mode}', getTaxModeLabel(taxMode))}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex gap-2.5 items-start bg-neon-pink/10 border border-neon-pink/20 rounded p-3 text-xs text-neutral-300">
                <XCircle className="w-5 h-5 text-neon-pink flex-shrink-0" />
                <div>
                  <span className="font-bold text-neon-pink">{t.unprofitable}</span>
                  <p className="text-[10px] text-neutral-400 mt-0.5">
                    {t.unprofitableDesc}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 bg-gaming-dark/30 rounded p-2 text-[10px] text-neutral-500 flex items-start gap-1">
        <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-neutral-400" />
        <span>
          {t.calcFootnote.replace('{game}', selectedGame.name).replace('{roi}', formatCurrency(adjustedHourlyGross, 3))}
        </span>
      </div>
    </div>
  );
}
