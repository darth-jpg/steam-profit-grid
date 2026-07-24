'use client';

import React, { useState, useEffect } from 'react';
import { Game, MarketItem } from '@/lib/types';
import { Language, translations } from '@/lib/translations';
import { TaxDisplayMode, getAdjustedPrice, formatCurrency } from '@/lib/utils';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Calendar } from 'lucide-react';

interface PriceHistoryChartProps {
  selectedGame: Game;
  taxMode: TaxDisplayMode;
  lang?: Language;
}

export default function PriceHistoryChart({ selectedGame, taxMode, lang = 'pt' }: PriceHistoryChartProps) {
  const [selectedItem, setSelectedItem] = useState<MarketItem>(selectedGame.items[0]);
  const [mounted, setMounted] = useState<boolean>(false);

  const t = translations[lang];

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (selectedGame.items.length > 0) {
      setSelectedItem(selectedGame.items[0]);
    }
  }, [selectedGame]);

  if (!selectedItem) {
    return (
      <div className="w-full bg-gaming-card rounded-xl border border-gaming-border p-5 text-center text-neutral-500 text-sm">
        No items available for this game.
      </div>
    );
  }

  const days = [t.daySeg, t.dayTer, t.dayQua, t.dayQui, t.daySex, t.daySab, t.dayDom];
  const chartData = selectedItem.history.map((price, idx) => ({
    name: days[idx] || `D${idx + 1}`,
    price: getAdjustedPrice(price, taxMode),
  }));

  const startPrice = getAdjustedPrice(selectedItem.history[0] || 0, taxMode);
  const endPrice = getAdjustedPrice(selectedItem.history[selectedItem.history.length - 1] || 0, taxMode);
  const percentageChange = startPrice > 0 ? ((endPrice - startPrice) / startPrice) * 100 : 0;
  const isPositive = percentageChange >= 0;

  const currentAdjustedPrice = getAdjustedPrice(selectedItem.price, taxMode);

  return (
    <div className="w-full bg-gaming-card rounded-xl border border-gaming-border p-5 transition-all duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-4 border-b border-gaming-border">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-neon-cyan" />
            <h2 className="text-xl font-bold text-white tracking-wide">
              {t.historyTitle}
            </h2>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            {t.historySubtitle}
          </p>
        </div>

        {/* Item Selector */}
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          {selectedGame.items.map((item) => (
            <button
              key={item.name}
              onClick={() => setSelectedItem(item)}
              className={`px-3 py-1 text-xs font-semibold rounded-full border transition-all duration-300 ${
                selectedItem.name === item.name
                  ? 'bg-neon-cyan/15 text-neon-cyan border-neon-cyan/40'
                  : 'bg-gaming-dark text-neutral-400 border-gaming-border hover:text-white'
              }`}
            >
              {item.name.split(' | ')[1] || item.name} ({formatCurrency(getAdjustedPrice(item.price, taxMode))})
            </button>
          ))}
        </div>
      </div>

      {/* Stats Widget */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6 bg-gaming-dark rounded-lg p-3 border border-gaming-border text-xs">
        <div>
          <span className="text-neutral-500 block">{t.itemSelected}</span>
          <span className="font-bold text-white block truncate">{selectedItem.name}</span>
        </div>
        <div>
          <span className="text-neutral-500 block">{t.currentPrice}</span>
          <span className="font-mono text-neon-green font-bold text-sm">
            {formatCurrency(currentAdjustedPrice)}
          </span>
        </div>
        <div className="col-span-2 sm:col-span-1">
          <span className="text-neutral-500 block">{t.variation}</span>
          <span
            className={`font-mono font-bold inline-flex items-center gap-1 mt-0.5 ${
              isPositive ? 'text-neon-green' : 'text-neon-pink'
            }`}
          >
            {isPositive ? '+' : ''}
            {percentageChange.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="w-full h-64 bg-gaming-dark/40 rounded-lg p-2 relative border border-gaming-border">
        {!mounted ? (
          <div className="absolute inset-0 flex items-center justify-center text-neutral-500 text-sm">
            {t.loadingChart}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={isPositive ? "#0ecb81" : "#f6465d"} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={isPositive ? "#0ecb81" : "#f6465d"} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2638" vertical={false} />
              <XAxis
                dataKey="name"
                stroke="#6b7280"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#6b7280"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `$${value.toFixed(2)}`}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-gaming-dark border border-gaming-border p-2.5 rounded shadow-lg text-xs font-mono">
                        <p className="text-neutral-400 font-bold mb-1 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-neutral-500" />
                          {lang === 'pt' ? 'Dia' : 'Day'}: {payload[0].payload.name}
                        </p>
                        <p className="text-neon-green font-bold">
                          {lang === 'pt' ? 'Preço' : 'Price'}: {formatCurrency(parseFloat(payload[0].value as string))}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey="price"
                stroke={isPositive ? "#0ecb81" : "#f6465d"}
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorPrice)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
