'use client';

import React, { useState } from 'react';
import { Game } from '@/lib/types';
import { Language, translations } from '@/lib/translations';
import { formatCurrency, getAdjustedPrice, downloadCSV } from '@/lib/utils';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Wallet, Plus, Trash2, Download, RefreshCw, AlertCircle, CheckCircle2, UserCheck, BarChart } from 'lucide-react';

interface HeldItem {
  id: string;
  gameId: string;
  itemName: string;
  unitPrice: number;
  quantity: number;
}

interface InventorySimulatorProps {
  games: Game[];
  lang?: Language;
}

const COLORS = ['#3b82f6', '#0ecb81', '#f0b90b', '#8b5cf6', '#f6465d', '#14b8a6', '#ec4899'];

export default function InventorySimulator({ games, lang = 'pt' }: InventorySimulatorProps) {
  // 🧼 Carteira inicia completamente vazia por definição do utilizador
  const [inventory, setInventory] = useState<HeldItem[]>([]);

  // Estados de Importação
  const [steamInput, setSteamInput] = useState<string>('');
  const [fetching, setFetching] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [fetchSuccessMsg, setFetchSuccessMsg] = useState<string | null>(null);

  // Estados de Adição Manual
  const [selectedGameId, setSelectedGameId] = useState<string>(games[0]?.id || 'cs2');
  const [selectedItemName, setSelectedItemName] = useState<string>('');
  const [inputQuantity, setInputQuantity] = useState<number>(1);

  // Estado de Filtro de Jogo Ativo na Carteira
  const [activeGameFilter, setActiveGameFilter] = useState<string>('all');

  const t = translations[lang];
  const currentGame = games.find((g) => g.id === selectedGameId) || games[0];

  // Ação: Importar tudo automaticamente da Steam de múltiplos jogos
  const handleFetchSteamInventory = async () => {
    if (!steamInput.trim()) {
      setFetchError(t.importPlaceholder);
      return;
    }

    setFetching(true);
    setFetchError(null);
    setFetchSuccessMsg(null);

    try {
      const res = await fetch(`/api/steam-inventory?input=${encodeURIComponent(steamInput.trim())}`);
      const json = await res.json();

      if (!json.success) {
        setFetchError(json.error || 'Could not fetch inventory.');
        return;
      }

      if (!json.items || json.items.length === 0) {
        setFetchError(lang === 'pt' ? 'Não foram encontrados itens nos jogos suportados desta conta.' : 'No items found in supported games for this account.');
        return;
      }

      // Mapear itens descarregados
      const importedItems: HeldItem[] = json.items.map((imported: { gameId: string; itemName: string; quantity: number }, idx: number) => {
        const gameRef = games.find((g) => g.id === imported.gameId);
        const knownItem = gameRef?.items.find((i) => i.name.toLowerCase() === imported.itemName.toLowerCase());
        const unitPrice = knownItem ? knownItem.price : (gameRef?.avgDropPrice || 0.10);

        return {
          id: `auto_${Date.now()}_${idx}`,
          gameId: imported.gameId,
          itemName: imported.itemName,
          unitPrice,
          quantity: imported.quantity,
        };
      });

      setInventory(importedItems);
      setFetchSuccessMsg(
        t.importSuccess
          .replace('{total}', String(json.totalItemsCount))
          .replace('{unique}', String(json.uniqueTypesCount))
          .replace('{id}', json.steamId)
      );
      setActiveGameFilter('all');
    } catch (err: any) {
      setFetchError(lang === 'pt' ? 'Erro ao conectar à API do inventário.' : 'Error connecting to inventory API.');
    } finally {
      setFetching(false);
    }
  };

  const handleAddItem = () => {
    if (!currentGame) return;
    const itemToUse = currentGame.items.find((i) => i.name === selectedItemName) || currentGame.items[0];
    if (!itemToUse) return;

    const existingIndex = inventory.findIndex((i) => i.itemName === itemToUse.name);
    if (existingIndex >= 0) {
      const updated = [...inventory];
      updated[existingIndex].quantity += inputQuantity;
      setInventory(updated);
    } else {
      setInventory([
        ...inventory,
        {
          id: Date.now().toString(),
          gameId: currentGame.id,
          itemName: itemToUse.name,
          unitPrice: itemToUse.price,
          quantity: inputQuantity,
        },
      ]);
    }
  };

  const handleRemoveItem = (id: string) => {
    setInventory(inventory.filter((item) => item.id !== id));
  };

  const handleClearAll = () => {
    setInventory([]);
    setActiveGameFilter('all');
  };

  const handleExportCSV = () => {
    const headers = [
      'Item Name',
      'Game ID',
      'Unit Price',
      'Quantity',
      'Total Gross',
      'Net Cashout (~70%)'
    ];

    const rows = filteredInventory.map((item) => {
      const gross = item.unitPrice * item.quantity;
      const cashout = getAdjustedPrice(gross, 'real_cashout');
      return [
        item.itemName,
        item.gameId,
        `$${item.unitPrice.toFixed(2)}`,
        String(item.quantity),
        `$${gross.toFixed(2)}`,
        `$${cashout.toFixed(2)}`
      ];
    });

    downloadCSV('meu_inventario_steam.csv', headers, rows);
  };

  // Encontrar os jogos na carteira
  const gamesInInventory = Array.from(new Set(inventory.map((item) => item.gameId))).map((gameId) => {
    return {
      id: gameId,
      name: games.find((g) => g.id === gameId)?.name || gameId,
      count: inventory.filter((item) => item.gameId === gameId).reduce((acc, item) => acc + item.quantity, 0),
    };
  });

  // Filtrar inventário com base no filtro ativo
  const filteredInventory = activeGameFilter === 'all'
    ? inventory
    : inventory.filter((item) => item.gameId === activeGameFilter);

  // Totais apenas para o filtro ativo
  const totalGrossValue = filteredInventory.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);
  const totalSteamNet = getAdjustedPrice(totalGrossValue, 'steam_net');
  const totalRealCashout = getAdjustedPrice(totalGrossValue, 'real_cashout');

  // Dados para o gráfico circular
  const pieDataMap = new Map<string, number>();
  inventory.forEach((item) => {
    const itemValue = item.unitPrice * item.quantity;
    const gameName = games.find((g) => g.id === item.gameId)?.name || item.gameId;
    pieDataMap.set(gameName, (pieDataMap.get(gameName) || 0) + itemValue);
  });

  const pieData = Array.from(pieDataMap.entries()).map(([name, value]) => ({
    name,
    value: parseFloat(value.toFixed(2)),
  }));

  // Ação: Lidar com o clique no Pie Chart e filtrar a tabela
  const handlePieSliceClick = (entry: any) => {
    if (!entry) return;
    const clickedGame = games.find((g) => g.name === entry.name);
    if (clickedGame) {
      // Se já estiver filtrado por este jogo, reseta para 'all', senão filtra pelo jogo clicado
      setActiveGameFilter(activeGameFilter === clickedGame.id ? 'all' : clickedGame.id);
    }
  };

  return (
    <div className="w-full bg-gaming-card rounded-xl border border-gaming-border p-5 transition-all duration-300 space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between pb-3 border-b border-gaming-border">
        <div className="flex items-center gap-2">
          <Wallet className="w-5 h-5 text-neon-green" />
          <h2 className="text-xl font-bold text-white tracking-wide font-sans">
            {t.invTitle}
          </h2>
        </div>
        <span className="text-xs font-mono text-neutral-400 bg-gaming-dark px-2.5 py-1 rounded border border-gaming-border">
          {inventory.length} {t.invSubtitle}
        </span>
      </div>

      {/* Importador Automático */}
      <div className="bg-gaming-dark/80 p-4 rounded-xl border border-gaming-border space-y-3">
        <div className="flex items-center gap-2">
          <Download className="w-4 h-4 text-neon-green" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider font-sans">
            {t.importTitle}
          </h3>
        </div>
        <p className="text-xs text-neutral-400">
          {lang === 'pt' 
            ? 'Introduza o seu SteamID ou Link de Perfil. O scanner irá ler todos os jogos suportados da conta em simultâneo.'
            : 'Enter your SteamID or Profile Link. The scanner will fetch all supported games from this account at once.'
          }
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-1">
          <div className="sm:col-span-3">
            <input
              type="text"
              placeholder={t.importPlaceholder}
              value={steamInput}
              onChange={(e) => setSteamInput(e.target.value)}
              className="w-full bg-gaming-card text-xs text-white border border-gaming-border rounded-lg px-3 py-2.5 focus:outline-none focus:border-neon-green font-mono"
            />
          </div>

          <div>
            <button
              onClick={handleFetchSteamInventory}
              disabled={fetching}
              className="w-full flex items-center justify-center gap-1.5 bg-neon-green text-gaming-dark hover:bg-neon-green/90 text-xs font-bold py-2.5 px-3 rounded-lg transition-colors disabled:opacity-50"
            >
              {fetching ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> {t.btnImporting}
                </>
              ) : (
                <>
                  <UserCheck className="w-4 h-4" /> {t.btnImport}
                </>
              )}
            </button>
          </div>
        </div>

        {fetchError && (
          <div className="p-3 bg-neon-pink/10 border border-neon-pink/20 rounded-lg text-xs text-neon-pink flex items-start gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{fetchError}</span>
          </div>
        )}

        {fetchSuccessMsg && (
          <div className="p-3 bg-neon-green/10 border border-neon-green/20 rounded-lg text-xs text-neon-green flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{fetchSuccessMsg}</span>
          </div>
        )}
      </div>

      {/* Abas internas dos Jogos na Carteira */}
      {inventory.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-gaming-border/60">
          <button
            onClick={() => setActiveGameFilter('all')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${
              activeGameFilter === 'all'
                ? 'bg-neon-green text-gaming-dark border-neon-green/30'
                : 'bg-gaming-dark text-neutral-400 border-gaming-border hover:text-white'
            }`}
          >
            {lang === 'pt' ? 'Todos os Jogos' : 'All Games'} ({inventory.reduce((acc, i) => acc + i.quantity, 0)})
          </button>

          {gamesInInventory.map((game) => (
            <button
              key={game.id}
              onClick={() => setActiveGameFilter(game.id)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                activeGameFilter === game.id
                  ? 'bg-neon-cyan text-gaming-dark border-neon-cyan/30'
                  : 'bg-gaming-dark text-neutral-400 border-gaming-border hover:text-white'
              }`}
            >
              {game.name} ({game.count})
            </button>
          ))}
        </div>
      )}

      {/* Adição Manual */}
      <div className="bg-gaming-dark/40 p-3.5 rounded-lg border border-gaming-border space-y-2">
        <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider block font-sans">
          {t.manualAddTitle}
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div>
            <select
              value={selectedGameId}
              onChange={(e) => {
                setSelectedGameId(e.target.value);
                const g = games.find((x) => x.id === e.target.value);
                if (g && g.items.length > 0) setSelectedItemName(g.items[0].name);
              }}
              className="w-full bg-gaming-card text-xs text-white border border-gaming-border rounded px-2 py-1.5 focus:outline-none focus:border-neon-cyan"
            >
              {games.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedItemName || (currentGame?.items[0]?.name ?? '')}
              onChange={(e) => setSelectedItemName(e.target.value)}
              className="w-full bg-gaming-card text-xs text-white border border-gaming-border rounded px-2 py-1.5 focus:outline-none focus:border-neon-cyan"
            >
              {currentGame?.items.map((i) => (
                <option key={i.name} value={i.name}>
                  {i.name} (${i.price.toFixed(2)})
                </option>
              ))}
            </select>
          </div>

          <div>
            <input
              type="number"
              min="1"
              value={inputQuantity}
              onChange={(e) => setInputQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full bg-gaming-card text-xs font-mono text-white border border-gaming-border rounded px-2 py-1.5 focus:outline-none focus:border-neon-cyan"
            />
          </div>

          <div>
            <button
              onClick={handleAddItem}
              className="w-full flex items-center justify-center gap-1.5 bg-gaming-card text-white border border-gaming-border hover:bg-gaming-card-hover text-xs font-bold py-1.5 px-3 rounded transition-colors"
            >
              <Plus className="w-4 h-4 text-neon-green" /> {t.btnManualAdd}
            </button>
          </div>
        </div>
      </div>

      {/* Resumo Financeiro */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gaming-dark p-3.5 rounded-lg border border-gaming-border">
          <span className="text-[10px] uppercase font-semibold text-neutral-400 block font-sans">
            {t.cardGross}
          </span>
          <span className="text-lg font-mono font-bold text-white block mt-0.5">
            {formatCurrency(totalGrossValue)}
          </span>
        </div>

        <div className="bg-gaming-dark p-3.5 rounded-lg border border-gaming-border">
          <span className="text-[10px] uppercase font-semibold text-neutral-400 block font-sans">
            {t.cardNet}
          </span>
          <span className="text-lg font-mono font-bold text-neon-cyan block mt-0.5">
            {formatCurrency(totalSteamNet)}
          </span>
        </div>

        <div className="bg-gaming-dark p-3.5 rounded-lg border border-gaming-border">
          <span className="text-[10px] uppercase font-semibold text-neutral-400 block font-sans">
            {t.cardCashout}
          </span>
          <span className="text-lg font-mono font-bold text-neon-green block mt-0.5">
            {formatCurrency(totalRealCashout)}
          </span>
        </div>
      </div>

      {/* Tabela & Gráfico Circular */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Tabela */}
        <div className="lg:col-span-2 overflow-x-auto border border-gaming-border rounded-lg bg-gaming-dark/20 p-4 space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-gaming-border">
            <span className="text-xs font-semibold text-neutral-300 font-sans">{t.invLoadedTitle}</span>
            <div className="flex items-center gap-3">
              {filteredInventory.length > 0 && (
                <>
                  <button
                    onClick={handleExportCSV}
                    className="flex items-center gap-1 text-[10px] text-neutral-400 hover:text-white transition-colors font-mono border border-gaming-border rounded px-2 py-1 bg-gaming-dark"
                  >
                    <Download className="w-3 h-3 text-neon-cyan" /> {t.btnExportCSV}
                  </button>
                  <button
                    onClick={handleClearAll}
                    className="text-[10px] text-neutral-400 hover:text-neon-pink transition-colors font-mono"
                  >
                    {t.invClearBtn}
                  </button>
                </>
              )}
            </div>
          </div>
          <table className="w-full text-left text-xs">
            <thead className="bg-gaming-dark text-neutral-400 uppercase font-semibold border-b border-gaming-border">
              <tr>
                <th className="p-3">{t.colItem}</th>
                <th className="p-3">{t.colUnitPrice}</th>
                <th className="p-3">{t.colQty}</th>
                <th className="p-3">{t.colTotalGross}</th>
                <th className="p-3">{t.colCashout}</th>
                <th className="p-3 text-right">{t.colAction}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gaming-border text-neutral-300 font-mono">
              {filteredInventory.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-4 text-center text-neutral-500 font-sans">
                    {t.invEmptyTable}
                  </td>
                </tr>
              ) : (
                filteredInventory.map((item) => {
                  const itemGross = item.unitPrice * item.quantity;
                  const itemCashout = getAdjustedPrice(itemGross, 'real_cashout');

                  return (
                    <tr key={item.id} className="hover:bg-gaming-card-hover transition-colors">
                      <td className="p-3 font-sans font-semibold text-white">
                        <div className="flex flex-col">
                          <span>{item.itemName}</span>
                          <span className="text-[9px] text-neutral-500 uppercase font-mono">
                            {games.find((g) => g.id === item.gameId)?.name || item.gameId}
                          </span>
                        </div>
                      </td>
                      <td className="p-3">{formatCurrency(item.unitPrice)}</td>
                      <td className="p-3 text-neon-green font-bold">{item.quantity}</td>
                      <td className="p-3">{formatCurrency(itemGross)}</td>
                      <td className="p-3 text-neon-green font-bold">{formatCurrency(itemCashout)}</td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          className="text-neutral-500 hover:text-neon-pink p-1 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 🥧 Gráfico Circular Interativo */}
        <div className="lg:col-span-1 border border-gaming-border rounded-lg bg-gaming-dark/20 p-4 flex flex-col justify-between">
          <div className="flex items-center gap-2 pb-2 border-b border-gaming-border">
            <BarChart className="w-4 h-4 text-neon-cyan" />
            <span className="text-xs font-semibold text-neutral-300 font-sans">{t.pieTitle}</span>
          </div>

          {inventory.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-xs text-neutral-500 font-sans min-h-48 text-center p-4">
              {lang === 'pt' ? 'Adicione itens ou carregue a carteira para ver a partilha de ativos.' : 'Add items or scan your wallet to view asset share allocation.'}
            </div>
          ) : (
            <div className="flex-1 flex flex-col justify-center min-h-64 mt-4">
              <div className="w-full h-48 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={65}
                      paddingAngle={4}
                      dataKey="value"
                      // Conectando clique do Pie Chart para filtrar a tabela dinamicamente!
                      onClick={handlePieSliceClick}
                    >
                      {pieData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={COLORS[index % COLORS.length]} 
                          className="cursor-pointer hover:opacity-85 transition-opacity"
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: any) => [`$${parseFloat(value).toFixed(2)}`, 'Value']}
                      contentStyle={{ backgroundColor: '#0b0e14', borderColor: '#1e2638', borderRadius: '4px', color: '#fff', fontSize: '11px', fontFamily: 'monospace' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Legendas com percentagens reais */}
              <div className="flex flex-wrap gap-2.5 justify-center mt-3 text-[10px] font-sans">
                {pieData.map((entry, index) => {
                  const percentage = ((entry.value / inventory.reduce((acc, i) => acc + i.unitPrice * i.quantity, 0)) * 100).toFixed(1);
                  return (
                    <div key={entry.name} className="flex items-center gap-1.5 text-neutral-300">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                      <span>{entry.name} ({percentage}%)</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
