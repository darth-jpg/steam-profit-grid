'use client';

import React, { useState, useEffect } from 'react';
import { Game, HybridApiResponse } from '@/lib/types';
import { TaxDisplayMode } from '@/lib/utils';
import { Language, translations } from '@/lib/translations';
import ProfitGrid from '@/components/ProfitGrid';
import InventorySimulator from '@/components/InventorySimulator';
import { TrendingUp, RefreshCw, ExternalLink, Radio, Server, CheckCircle2, DollarSign, Wallet, Globe } from 'lucide-react';

type TabId = 'grid' | 'inventory';

export default function Home() {
  const [games, setGames] = useState<Game[]>([]);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [apiMeta, setApiMeta] = useState<{ isLive: boolean; cached: boolean; cacheAgeSeconds?: number } | null>(null);
  const [taxMode, setTaxMode] = useState<TaxDisplayMode>('steam_net'); // Padrão: Steam Net (-15%)
  const [activeTab, setActiveTab] = useState<TabId>('grid'); // Tab padrão
  const [lang, setLang] = useState<Language>('pt'); // Idioma padrão: Português

  const t = translations[lang];

  // Carregar dados híbridos via endpoint /api/steam-live
  const loadData = async (force: boolean = false) => {
    if (force) setRefreshing(true);
    else setLoading(true);

    try {
      const url = `/api/steam-live${force ? '?force=true' : ''}`;
      const res = await fetch(url);
      const json: HybridApiResponse = await res.json();

      if (json.success && json.games) {
        setGames(json.games);
        setApiMeta({
          isLive: json.isLive,
          cached: json.cached,
          cacheAgeSeconds: json.cacheAgeSeconds,
        });

        if (!selectedGame && json.games.length > 0) {
          const cs2 = json.games.find((g) => g.id === 'cs2');
          setSelectedGame(cs2 || json.games[0]);
        } else if (selectedGame) {
          const updated = json.games.find((g) => g.id === selectedGame.id);
          if (updated) setSelectedGame(updated);
        }
      }
    } catch (err) {
      console.error('Erro ao conectar ao endpoint /api/steam-live:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-gaming-dark text-neutral-400 min-h-screen">
        <RefreshCw className="w-10 h-10 text-neon-green animate-spin mb-4" />
        <p className="font-mono text-sm tracking-widest text-white animate-pulse">
          A CONECTAR À STEAM WEB API & TRADING ENGINE...
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-gaming-dark text-neutral-200 min-h-screen font-sans">
      {/* Header */}
      <header className="border-b border-gaming-border bg-gaming-dark/95 backdrop-blur-md sticky top-0 z-40 px-4 py-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gaming-card border border-gaming-border rounded-lg text-neon-green">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-wide font-sans">
                {t.title}
              </h1>
              <p className="text-[10px] text-neutral-400 font-mono tracking-wider">
                {t.subtitle}
              </p>
            </div>
          </div>

          {/* Status Badges, Idioma e Ações */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Seletor de Idioma */}
            <div className="flex items-center gap-1.5 bg-gaming-card border border-gaming-border px-2.5 py-1.5 rounded-lg text-xs font-semibold">
              <Globe className="w-3.5 h-3.5 text-neutral-400" />
              <button
                onClick={() => setLang('pt')}
                className={`transition-colors px-1 ${lang === 'pt' ? 'text-neon-green font-bold' : 'text-neutral-500 hover:text-white'}`}
              >
                PT 🇵🇹
              </button>
              <span className="text-neutral-700">|</span>
              <button
                onClick={() => setLang('en')}
                className={`transition-colors px-1 ${lang === 'en' ? 'text-neon-green font-bold' : 'text-neutral-500 hover:text-white'}`}
              >
                EN 🇬🇧
              </button>
            </div>

            {apiMeta && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gaming-card border border-gaming-border text-xs font-mono">
                {apiMeta.isLive ? (
                  <span className="flex items-center gap-1.5 text-neon-green font-semibold">
                    <Radio className="w-3.5 h-3.5 animate-pulse" />
                    {t.steamApiLive}
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-neon-yellow">
                    <Server className="w-3.5 h-3.5" />
                    {t.fallbackHybrid}
                  </span>
                )}
                <span className="text-neutral-700">|</span>
                <span className="text-neutral-400">
                  {apiMeta.cached ? `${t.cache} (${apiMeta.cacheAgeSeconds}s)` : t.updated}
                </span>
              </div>
            )}

            <button
              onClick={() => loadData(true)}
              disabled={refreshing}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg border border-gaming-border bg-gaming-card hover:bg-gaming-card-hover text-xs font-semibold text-neutral-300 hover:text-white transition-all duration-300 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-neon-green' : ''}`} />
              {refreshing ? t.syncing : t.syncBtn}
            </button>

            <a
              href="/api/steam-live"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gaming-border bg-gaming-dark hover:bg-gaming-card text-xs font-mono text-neutral-400 hover:text-neon-cyan transition-colors"
            >
              {t.liveJson}
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 w-full space-y-6 flex-1">
        
        {/* SELETOR DE SEPARADORES (TABS REDUZIDAS PARA 2) */}
        <div className="flex border-b border-gaming-border/60 overflow-x-auto">
          <button
            onClick={() => setActiveTab('grid')}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-all ${
              activeTab === 'grid'
                ? 'border-b-neon-green text-white bg-gaming-card/45'
                : 'border-b-transparent text-neutral-400 hover:text-neutral-200 hover:bg-gaming-dark/40'
            }`}
          >
            <DollarSign className="w-4 h-4 text-neon-green" />
            {t.tabGrid}
          </button>
          
          <button
            onClick={() => setActiveTab('inventory')}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-all ${
              activeTab === 'inventory'
                ? 'border-b-neon-green text-white bg-gaming-card/45'
                : 'border-b-transparent text-neutral-400 hover:text-neutral-200 hover:bg-gaming-dark/40'
            }`}
          >
            <Wallet className="w-4 h-4 text-neon-yellow" />
            {t.tabInventory}
          </button>
        </div>

        {/* COMPONENTES CONDICIONAIS */}
        <div className="space-y-6 animate-fadeIn">
          {activeTab === 'grid' && games.length > 0 && selectedGame && (
            <div className="space-y-6">
              <ProfitGrid
                games={games}
                selectedGameId={selectedGame.id}
                taxMode={taxMode}
                onTaxModeChange={setTaxMode}
                onSelectGame={(game) => setSelectedGame(game)}
                lang={lang}
              />
              <div className="bg-neon-cyan/5 border border-neon-cyan/20 rounded-xl p-4 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-neon-cyan flex-shrink-0 mt-0.5" />
                <div className="text-xs text-neutral-400 leading-relaxed">
                  <span className="font-bold text-neon-cyan font-sans">{t.gridTipTitle}</span> {t.gridTipText}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'inventory' && (
            <InventorySimulator games={games} lang={lang} />
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gaming-border py-6 mt-12 bg-gaming-dark/60 text-center text-xs text-neutral-500 font-mono">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p>© {new Date().getFullYear()} - To Profit or Not to Profit. Todos os direitos reservados. / All rights reserved.</p>
          <div className="flex gap-4">
            <span className="text-neon-green font-sans">Sleek Financial Tabbed UI</span>
            <span>•</span>
            <span className="text-neutral-400">Valve 15% Tax Engine</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
