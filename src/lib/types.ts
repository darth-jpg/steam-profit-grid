export interface MarketItem {
  name: string;
  price: number;
  history: number[];
}

export type LiquidityIndex = 'High' | 'Medium' | 'Low';
export type HypeTrend = 'stable' | 'growing' | 'hype' | 'fading';

export interface Game {
  id: string;
  steamAppId?: number; // ID numérico oficial da Steam (ex: 730 para CS2)
  name: string;
  activePlayers24h: number;
  playerGrowth48h: number;
  estSalesVolume24h: number;
  liquidityIndex: LiquidityIndex;
  avgDropPrice: number;
  dropsPerHour: number;
  communityMarketEnabled: boolean;
  hypeTrend: HypeTrend;
  items: MarketItem[];
  isLiveData?: boolean; // Verdadeiro se os dados de jogadores forem em tempo real da API Oficial
  lastUpdated?: string; // Data/hora em formato ISO da última sincronização
}

export interface HybridApiResponse {
  success: boolean;
  isLive: boolean;
  cached: boolean;
  cacheAgeSeconds?: number;
  timestamp: string;
  games: Game[];
}

export interface FarmReportPayload {
  userId: string;
  gameId: string;
  hoursPlayed: number;
  itemsDroppedCount: number;
}
