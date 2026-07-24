'use client';

import React, { useState, useEffect } from 'react';
import { Game } from '@/lib/types';
import { Language, translations } from '@/lib/translations';
import { TaxDisplayMode, getAdjustedPrice, getTaxModeLabel, formatCurrency, downloadCSV } from '@/lib/utils';
import PriceHistoryChart from './PriceHistoryChart';
import HypeRadar from './HypeRadar';
import { DollarSign, ArrowUpDown, Search, GitCompare, X, Check, TrendingUp, Download, ChevronLeft, ChevronRight, HelpCircle, Flame } from 'lucide-react';

interface ProfitGridProps {
  games: Game[];
  selectedGameId: string;
  taxMode: TaxDisplayMode;
  onTaxModeChange: (mode: TaxDisplayMode) => void;
  onSelectGame: (game: Game) => void;
  lang?: Language;
}

type SortKey = 'rank' | 'name' | 'players' | 'volume' | 'liquidity' | 'roi';
type ProfileFilter = 'all' | 'low_spec' | 'high_yield' | 'hype';

export default function ProfitGrid({
  games,
  selectedGameId,
  taxMode,
  onTaxModeChange,
  onSelectGame,
  lang = 'pt',
}: ProfitGridProps) {
  const [sortKey, setSortKey] = useState<SortKey>('rank');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [profileFilter, setProfileFilter] = useState<ProfileFilter>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [comparedGameIds, setComparedGameIds] = useState<string[]>([]);
  
  // Estado do Accordion: guarda o id do jogo expandido (reutiliza selectedGameId, mas com toggle)
  const [expandedGameId, setExpandedGameId] = useState<string | null>('cs2');
  
  // Paginação
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 10;

  const t = translations[lang];

  useEffect(() => {
    setCurrentPage(1);
  }, [profileFilter, searchQuery, sortKey, sortOrder]);

  const getRecommendation = (game: Game) => {
    const rawHourlyRoi = game.avgDropPrice * game.dropsPerHour;
    const adjustedRoi = getAdjustedPrice(rawHourlyRoi, taxMode);

    if (game.playerGrowth48h > 20) {
      return {
        label: lang === 'pt' ? 'Especulativo' : 'Speculative',
        class: 'bg-neon-pink/15 text-neon-pink border border-neon-pink/40',
        description: 'Abrupt growth. High volatility.',
      };
    }

    if (game.liquidityIndex === 'High' && adjustedRoi >= 0.04) {
      return {
        label: 'To Profit',
        class: 'bg-neon-green/15 text-neon-green border border-neon-green/40',
        description: 'Highly profitable with high liquidity.',
      };
    }

    return {
      label: 'Not to Profit',
      class: 'bg-neutral-500/15 text-neutral-400 border border-neutral-500/30',
      description: 'Low adjusted yield or slow liquidity.',
    };
  };

  const handleRowClick = (game: Game) => {
    onSelectGame(game);
    // Toggle Accordion
    if (expandedGameId === game.id) {
      setExpandedGameId(null);
    } else {
      setExpandedGameId(game.id);
    }
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('desc');
    }
  };

  const handleToggleCompare = (gameId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (comparedGameIds.includes(gameId)) {
      setComparedGameIds(comparedGameIds.filter((id) => id !== gameId));
    } else {
      if (comparedGameIds.length >= 2) {
        setComparedGameIds([comparedGameIds[1], gameId]);
      } else {
        setComparedGameIds([...comparedGameIds, gameId]);
      }
    }
  };

  // Filtragem
  const filteredGames = games.filter((game) => {
    const matchesSearch = game.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          game.id.toLowerCase().includes(searchQuery.toLowerCase());
    
    let matchesProfile = true;
    if (profileFilter === 'low_spec') {
      matchesProfile = game.id === 'taskbarhero' || game.id === 'bongocat' || game.id === 'banana' || game.id === 'cats' || game.id === 'cucumber' || game.id === 'egg';
    } else if (profileFilter === 'high_yield') {
      matchesProfile = game.avgDropPrice * game.dropsPerHour >= 0.05;
    } else if (profileFilter === 'hype') {
      matchesProfile = game.playerGrowth48h >= 15;
    }

    return matchesSearch && matchesProfile;
  });

  // Ordenação
  const sortedGames = [...filteredGames].sort((a, b) => {
    let aVal: any = 0;
    let bVal: any = 0;

    switch (sortKey) {
      case 'rank':
        aVal = a.activePlayers24h * a.avgDropPrice;
        bVal = b.activePlayers24h * b.avgDropPrice;
        return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
      case 'name':
        return sortOrder === 'asc'
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      case 'players':
        aVal = a.activePlayers24h;
        bVal = b.activePlayers24h;
        break;
      case 'volume':
        aVal = a.estSalesVolume24h;
        bVal = b.estSalesVolume24h;
        break;
      case 'liquidity':
        const liqMap = { High: 3, Medium: 2, Low: 1 };
        aVal = liqMap[a.liquidityIndex];
        bVal = liqMap[b.liquidityIndex];
        break;
      case 'roi':
        aVal = getAdjustedPrice(a.avgDropPrice * a.dropsPerHour, taxMode);
        bVal = getAdjustedPrice(b.avgDropPrice * b.dropsPerHour, taxMode);
        break;
      default:
        return 0;
    }

    return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
  });

  // Paginação
  const totalPages = Math.max(1, Math.ceil(sortedGames.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedGames = sortedGames.slice(startIndex, startIndex + itemsPerPage);

  const handleExportCSV = () => {
    const headers = [
      'Rank',
      lang === 'pt' ? 'Nome do Jogo' : 'Game Name',
      'Steam AppID',
      lang === 'pt' ? 'Jogadores Ativos' : 'Active Players',
      lang === 'pt' ? 'Volume Estimado (24h)' : 'Est Volume (24h)',
      lang === 'pt' ? 'Índice de Liquidez' : 'Liquidity Index',
      lang === 'pt' ? 'ROI por Hora' : 'Hourly ROI'
    ];

    const rows = sortedGames.map((game, index) => [
      `#${index + 1}`,
      game.name,
      String(game.steamAppId),
      String(game.activePlayers24h),
      `$${game.estSalesVolume24h}`,
      game.liquidityIndex,
      `$${getAdjustedPrice(game.avgDropPrice * game.dropsPerHour, taxMode).toFixed(3)}`
    ]);

    downloadCSV(`steam_profit_grid_${taxMode}.csv`, headers, rows);
  };

  const compareGame1 = games.find((g) => g.id === comparedGameIds[0]);
  const compareGame2 = games.find((g) => g.id === comparedGameIds[1]);

  return (
    <div className="w-full bg-gaming-card rounded-xl border border-gaming-border overflow-hidden transition-all duration-300 space-y-4 p-5">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-3 border-b border-gaming-border">
        <div>
          <h2 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-neon-green" />
            {t.gridTitle}
          </h2>
          <p className="text-xs text-neutral-400 mt-1">
            {t.gridSubtitle}
          </p>
        </div>

        {/* Tax Mode Toggles */}
        <div className="flex items-center gap-1.5 bg-gaming-dark p-1 rounded-lg border border-gaming-border w-full md:w-auto justify-between md:justify-start">
          {(['gross', 'steam_net', 'real_cashout'] as TaxDisplayMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => onTaxModeChange(mode)}
              className={`px-3 py-1 text-xs font-bold rounded transition-colors ${
                taxMode === mode
                  ? 'bg-neon-green text-gaming-dark'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              {getTaxModeLabel(mode)}
            </button>
          ))}
        </div>
      </div>

      {/* Filters & Search */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {/* Search */}
        <div className="relative md:col-span-1">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="w-4 h-4 text-neutral-500" />
          </span>
          <input
            type="text"
            placeholder={t.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gaming-dark text-xs text-white border border-gaming-border rounded-lg pl-9 pr-3 py-2.5 focus:outline-none focus:border-neon-cyan font-sans"
          />
        </div>

        {/* Profile Filters */}
        <div className="md:col-span-2 flex flex-wrap items-center gap-2">
          <button
            onClick={() => setProfileFilter('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
              profileFilter === 'all'
                ? 'bg-neon-cyan/15 text-neon-cyan border-neon-cyan/40'
                : 'bg-gaming-dark text-neutral-400 border-gaming-border hover:text-white'
            }`}
          >
            {t.filterAll} ({games.length})
          </button>
          <button
            onClick={() => setProfileFilter('low_spec')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
              profileFilter === 'low_spec'
                ? 'bg-neon-cyan/15 text-neon-cyan border-neon-cyan/40'
                : 'bg-gaming-dark text-neutral-400 border-gaming-border hover:text-white'
            }`}
          >
            {t.filterLowSpec}
          </button>
          <button
            onClick={() => setProfileFilter('high_yield')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
              profileFilter === 'high_yield'
                ? 'bg-neon-cyan/15 text-neon-cyan border-neon-cyan/40'
                : 'bg-gaming-dark text-neutral-400 border-gaming-border hover:text-white'
            }`}
          >
            {t.filterHighYield}
          </button>
          <button
            onClick={() => setProfileFilter('hype')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
              profileFilter === 'hype'
                ? 'bg-neon-cyan/15 text-neon-cyan border-neon-cyan/40'
                : 'bg-gaming-dark text-neutral-400 border-gaming-border hover:text-white'
            }`}
          >
            {t.filterHype}
          </button>
        </div>

        {/* Export */}
        <div className="md:col-span-1 flex items-center justify-end">
          <button
            onClick={handleExportCSV}
            className="w-full sm:w-auto flex items-center justify-center gap-1.5 bg-gaming-dark border border-gaming-border hover:bg-gaming-card-hover text-xs font-bold py-2 px-3.5 rounded-lg text-neutral-300 hover:text-white transition-colors"
          >
            <Download className="w-4 h-4" /> {t.btnExportCSV}
          </button>
        </div>
      </div>

      {/* Grid Table */}
      <div className="overflow-x-auto border border-gaming-border rounded-lg">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gaming-border bg-gaming-dark/80 text-xs font-semibold text-neutral-400 uppercase tracking-wider">
              <th className="p-3.5 w-16 text-center">{t.colCompare}</th>
              
              {/* Jogo Header */}
              <th className="p-3.5 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('name')}>
                <div className="flex items-center gap-1.5">
                  {t.colGame} <ArrowUpDown className="w-3.5 h-3.5" />
                </div>
              </th>

              {/* Jogadores Header + Tooltip */}
              <th className="p-3.5 cursor-pointer hover:text-white transition-colors relative group/tooltip" onClick={() => handleSort('players')}>
                <div className="flex items-center gap-1.5">
                  {t.colPlayers} <ArrowUpDown className="w-3.5 h-3.5" />
                  <HelpCircle className="w-3.5 h-3.5 text-neutral-500" />
                </div>
                {/* CSS Tooltip */}
                <div className="absolute hidden group-hover/tooltip:block bg-gaming-dark text-[10px] text-neutral-300 border border-gaming-border rounded p-2 z-50 w-44 font-sans font-normal normal-case -bottom-12 left-0 shadow-xl">
                  {lang === 'pt' ? 'Média de utilizadores ativos em simultâneo nas últimas 24 horas na Steam.' : 'Average concurrent active users on Steam over the last 24h.'}
                </div>
              </th>

              {/* Volume Header + Tooltip */}
              <th className="p-3.5 cursor-pointer hover:text-white transition-colors relative group/tooltip" onClick={() => handleSort('volume')}>
                <div className="flex items-center gap-1.5">
                  {t.colVolume} <ArrowUpDown className="w-3.5 h-3.5" />
                  <HelpCircle className="w-3.5 h-3.5 text-neutral-500" />
                </div>
                {/* CSS Tooltip */}
                <div className="absolute hidden group-hover/tooltip:block bg-gaming-dark text-[10px] text-neutral-300 border border-gaming-border rounded p-2 z-50 w-44 font-sans font-normal normal-case -bottom-12 left-0 shadow-xl">
                  {lang === 'pt' ? 'Estimativa de volume financeiro diário transacionado no Mercado da Comunidade.' : 'Estimated daily transaction volume traded on the Steam Community Market.'}
                </div>
              </th>

              {/* Liquidez Header + Tooltip */}
              <th className="p-3.5 cursor-pointer hover:text-white transition-colors relative group/tooltip" onClick={() => handleSort('liquidity')}>
                <div className="flex items-center gap-1.5">
                  {t.colLiquidity} <ArrowUpDown className="w-3.5 h-3.5" />
                  <HelpCircle className="w-3.5 h-3.5 text-neutral-500" />
                </div>
                {/* CSS Tooltip */}
                <div className="absolute hidden group-hover/tooltip:block bg-gaming-dark text-[10px] text-neutral-300 border border-gaming-border rounded p-2 z-50 w-44 font-sans font-normal normal-case -bottom-12 left-0 shadow-xl">
                  {lang === 'pt' ? 'Facilidade com que um item de drop é vendido instantaneamente no mercado.' : 'How easily and quickly a dropped item sells on the public market.'}
                </div>
              </th>

              {/* ROI Header + Tooltip */}
              <th className="p-3.5 cursor-pointer hover:text-white transition-colors relative group/tooltip" onClick={() => handleSort('roi')}>
                <div className="flex items-center gap-1.5">
                  {t.colRoi} <ArrowUpDown className="w-3.5 h-3.5" />
                  <HelpCircle className="w-3.5 h-3.5 text-neutral-500" />
                </div>
                {/* CSS Tooltip */}
                <div className="absolute hidden group-hover/tooltip:block bg-gaming-dark text-[10px] text-neutral-300 border border-gaming-border rounded p-2 z-50 w-44 font-sans font-normal normal-case -bottom-12 left-0 shadow-xl">
                  {lang === 'pt' ? 'Rendimento estimado por hora de jogo em modo AFK (drops médios após taxas).' : 'Estimated hourly value drop yield from AFK/idle farming after selected taxes.'}
                </div>
              </th>

              <th className="p-3.5 text-right">{t.colRecommend}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gaming-border text-xs">
            {paginatedGames.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-6 text-center text-neutral-500 font-sans">
                  No games matched the active filters and search queries.
                </td>
              </tr>
            ) : (
              paginatedGames.map((game, idx) => {
                const isSelected = game.id === selectedGameId;
                const isExpanded = game.id === expandedGameId;
                const isCompared = comparedGameIds.includes(game.id);
                const recommendation = getRecommendation(game);
                const rawHourlyRoi = game.avgDropPrice * game.dropsPerHour;
                const adjustedHourlyRoi = getAdjustedPrice(rawHourlyRoi, taxMode);
                const globalIndex = startIndex + idx;

                return (
                  <React.Fragment key={game.id}>
                    {/* Linha Normal */}
                    <tr
                      onClick={() => handleRowClick(game)}
                      className={`cursor-pointer transition-all duration-150 group ${
                        isSelected
                          ? 'bg-gaming-dark/95 border-l-4 border-l-neon-green text-white font-semibold'
                          : 'hover:bg-gaming-card-hover text-neutral-300'
                      }`}
                    >
                      <td className="p-3.5 text-center">
                        <button
                          onClick={(e) => handleToggleCompare(game.id, e)}
                          className={`p-1.5 rounded-lg border transition-colors ${
                            isCompared
                              ? 'bg-neon-cyan/20 text-neon-cyan border-neon-cyan/40'
                              : 'bg-gaming-dark text-neutral-600 border-gaming-border hover:text-neutral-400'
                          }`}
                          title="Compare this game"
                        >
                          <GitCompare className="w-4 h-4" />
                        </button>
                      </td>
                      <td className="p-3.5">
                        <div className="flex flex-col">
                          <span className="group-hover:text-white transition-colors font-bold">
                            {game.name}
                          </span>
                          <span className="text-[10px] text-neutral-500 font-mono">AppID: {game.steamAppId}</span>
                        </div>
                      </td>
                      <td className="p-3.5 font-mono">
                        {game.activePlayers24h.toLocaleString()}
                      </td>
                      <td className="p-3.5 font-mono">
                        ${game.estSalesVolume24h.toLocaleString()}
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${
                            game.liquidityIndex === 'High'
                              ? 'bg-neon-green/10 text-neon-green border border-neon-green/30'
                              : game.liquidityIndex === 'Medium'
                              ? 'bg-neon-yellow/10 text-neon-yellow border border-neon-yellow/30'
                              : 'bg-neutral-500/10 text-neutral-400 border border-neutral-500/30'
                          }`}
                        >
                          {game.liquidityIndex}
                        </span>
                      </td>
                      <td className="p-3.5 font-mono text-neon-green font-bold">
                        {formatCurrency(adjustedHourlyRoi, 3)}/h
                      </td>
                      <td className="p-3.5 text-right">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${recommendation.class}`}
                        >
                          {recommendation.label}
                        </span>
                      </td>
                    </tr>

                    {/* 📂 LINHA EXPANDIDA (ACCORDION) */}
                    {isExpanded && (
                      <tr className="bg-gaming-dark/40 border-b border-gaming-border/80">
                        <td colSpan={7} className="p-5">
                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
                            {/* Gráfico de Histórico a 7 Dias */}
                            <div className="lg:col-span-2">
                              <PriceHistoryChart selectedGame={game} taxMode={taxMode} lang={lang} />
                            </div>
                            
                            {/* Resumo de Hype & Métricas */}
                            <div className="lg:col-span-1 bg-gaming-card rounded-xl border border-gaming-border p-5 space-y-4">
                              <div className="flex items-center gap-2 pb-3 border-b border-gaming-border">
                                <Flame className="w-5 h-5 text-neon-pink animate-pulse" />
                                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-sans">
                                  Hype & Estatísticas
                                </h3>
                              </div>

                              <div className="space-y-3 text-xs">
                                <div className="flex justify-between items-center bg-gaming-dark p-2.5 rounded border border-gaming-border/60">
                                  <span className="text-neutral-400">Tendência de Hype</span>
                                  <span className={`font-bold font-mono px-2 py-0.5 rounded text-[10px] uppercase ${
                                    game.hypeTrend === 'hype' 
                                      ? 'bg-neon-pink/15 text-neon-pink border border-neon-pink/30' 
                                      : game.hypeTrend === 'growing' 
                                      ? 'bg-neon-green/15 text-neon-green border border-neon-green/30'
                                      : 'bg-neutral-500/10 text-neutral-400'
                                  }`}>
                                    {game.hypeTrend}
                                  </span>
                                </div>

                                <div className="flex justify-between items-center bg-gaming-dark p-2.5 rounded border border-gaming-border/60">
                                  <span className="text-neutral-400">Crescimento (48h)</span>
                                  <span className={`font-bold font-mono ${game.playerGrowth48h >= 0 ? 'text-neon-green' : 'text-neon-pink'}`}>
                                    {game.playerGrowth48h >= 0 ? '+' : ''}{game.playerGrowth48h.toFixed(1)}%
                                  </span>
                                </div>

                                <div className="flex justify-between items-center bg-gaming-dark p-2.5 rounded border border-gaming-border/60 font-mono">
                                  <span className="text-neutral-400 font-sans">Drops / Hora</span>
                                  <span className="text-white font-bold">{game.dropsPerHour}/h</span>
                                </div>

                                <div className="flex justify-between items-center bg-gaming-dark p-2.5 rounded border border-gaming-border/60 font-mono">
                                  <span className="text-neutral-400 font-sans">Preço Médio Drop</span>
                                  <span className="text-neon-green font-bold">
                                    {formatCurrency(getAdjustedPrice(game.avgDropPrice, taxMode))}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Paginação */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-2">
        <span className="text-xs text-neutral-500">
          {lang === 'pt' 
            ? `A mostrar ${startIndex + 1}-${Math.min(startIndex + itemsPerPage, sortedGames.length)} de ${sortedGames.length} jogos`
            : `Showing ${startIndex + 1}-${Math.min(startIndex + itemsPerPage, sortedGames.length)} of ${sortedGames.length} games`
          }
        </span>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="flex items-center justify-center p-2 rounded-lg border border-gaming-border bg-gaming-dark hover:bg-gaming-card text-neutral-400 hover:text-white transition-colors disabled:opacity-30 disabled:pointer-events-none"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          <span className="text-xs font-mono font-bold px-3 py-1.5 rounded-lg bg-gaming-dark border border-gaming-border text-white">
            {lang === 'pt' ? `Página ${currentPage} de ${totalPages}` : `Page ${currentPage} of ${totalPages}`}
          </span>

          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="flex items-center justify-center p-2 rounded-lg border border-gaming-border bg-gaming-dark hover:bg-gaming-card text-neutral-400 hover:text-white transition-colors disabled:opacity-30 disabled:pointer-events-none"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Comparador */}
      {compareGame1 && compareGame2 && (
        <div className="bg-gaming-dark p-4 rounded-xl border border-gaming-border space-y-4 animate-fadeIn">
          <div className="flex justify-between items-center pb-2 border-b border-gaming-border/60">
            <div className="flex items-center gap-2">
              <GitCompare className="w-5 h-5 text-neon-cyan" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-sans">
                {t.compTitle}
              </h3>
            </div>
            <button
              onClick={() => setComparedGameIds([])}
              className="text-neutral-500 hover:text-white p-1 rounded-full hover:bg-gaming-card-hover transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-4 text-xs font-mono">
            <div className="text-neutral-500 font-sans font-bold">{t.compMetric}</div>
            <div className="text-neon-cyan font-bold truncate">{compareGame1.name}</div>
            <div className="text-neon-cyan font-bold truncate">{compareGame2.name}</div>

            <div className="text-neutral-400 font-sans">{t.compPlayers}</div>
            <div className="text-white flex items-center gap-1.5">
              {compareGame1.activePlayers24h.toLocaleString()}
              {compareGame1.activePlayers24h > compareGame2.activePlayers24h && (
                <Check className="w-3.5 h-3.5 text-neon-green" />
              )}
            </div>
            <div className="text-white flex items-center gap-1.5">
              {compareGame2.activePlayers24h.toLocaleString()}
              {compareGame2.activePlayers24h > compareGame1.activePlayers24h && (
                <Check className="w-3.5 h-3.5 text-neon-green" />
              )}
            </div>

            <div className="text-neutral-400 font-sans">{t.compVolume}</div>
            <div className="text-white">
              ${compareGame1.estSalesVolume24h.toLocaleString()}
              {compareGame1.estSalesVolume24h > compareGame2.estSalesVolume24h && ' 🏆'}
            </div>
            <div className="text-white">
              ${compareGame2.estSalesVolume24h.toLocaleString()}
              {compareGame2.estSalesVolume24h > compareGame1.estSalesVolume24h && ' 🏆'}
            </div>

            <div className="text-neutral-400 font-sans">{t.compLiquidity}</div>
            <div className="text-white">{compareGame1.liquidityIndex}</div>
            <div className="text-white">{compareGame2.liquidityIndex}</div>

            <div className="text-neutral-400 font-sans">{t.compAvgDrop}</div>
            <div className="text-white">{formatCurrency(getAdjustedPrice(compareGame1.avgDropPrice, taxMode))}</div>
            <div className="text-white">{formatCurrency(getAdjustedPrice(compareGame2.avgDropPrice, taxMode))}</div>

            <div className="text-neutral-400 font-sans">{t.compRoi}</div>
            <div className="text-neon-green font-bold">
              {formatCurrency(getAdjustedPrice(compareGame1.avgDropPrice * compareGame1.dropsPerHour, taxMode), 3)}/h
              {compareGame1.avgDropPrice * compareGame1.dropsPerHour > compareGame2.avgDropPrice * compareGame2.dropsPerHour && ' (Best)'}
            </div>
            <div className="text-neon-green font-bold">
              {formatCurrency(getAdjustedPrice(compareGame2.avgDropPrice * compareGame2.dropsPerHour, taxMode), 3)}/h
              {compareGame2.avgDropPrice * compareGame2.dropsPerHour > compareGame1.avgDropPrice * compareGame1.dropsPerHour && ' (Best)'}
            </div>
          </div>

          <div className="bg-gaming-card p-3 rounded-lg border border-gaming-border text-xs flex gap-2">
            <TrendingUp className="w-5 h-5 text-neon-green flex-shrink-0" />
            <div>
              <span className="font-bold text-white block">{t.compVerdict}</span>
              <span className="text-neutral-400 block mt-0.5 font-sans leading-relaxed font-normal">
                {compareGame1.avgDropPrice * compareGame1.dropsPerHour > compareGame2.avgDropPrice * compareGame2.dropsPerHour ? (
                  t.compVerdictText.replace('{game}', compareGame1.name).replace('{other}', compareGame2.name)
                ) : (
                  t.compVerdictText.replace('{game}', compareGame2.name).replace('{other}', compareGame1.name)
                )}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
