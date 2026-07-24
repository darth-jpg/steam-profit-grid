import { Game } from './types';
import gamesData from '../data/gamesMock.json';

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0',
];

export class SteamApiClient {
  private userAgents: string[];
  private currentAgentIndex: number = 0;

  constructor() {
    this.userAgents = USER_AGENTS;
  }

  private getRotatedHeaders(): Record<string, string> {
    const userAgent = this.userAgents[this.currentAgentIndex];
    this.currentAgentIndex = (this.currentAgentIndex + 1) % this.userAgents.length;

    return {
      'User-Agent': userAgent,
      'Accept': 'application/json',
      'Accept-Language': 'en-US,en;q=0.9',
    };
  }

  /**
   * Obtém a contagem real de jogadores ativos de um jogo via Steam Web API Oficial
   */
  public async fetchRealTimePlayerCount(appId: number): Promise<number | null> {
    try {
      const url = `https://api.steampowered.com/ISteamUserStats/GetNumberOfCurrentPlayers/v1/?appid=${appId}`;
      const response = await fetch(url, {
        headers: this.getRotatedHeaders(),
        next: { revalidate: 300 }, // Cache no fetch do Next por 5 minutos
      });

      if (!response.ok) return null;

      const data = await response.json();
      if (data && data.response && typeof data.response.player_count === 'number') {
        return data.response.player_count;
      }
      return null;
    } catch (error) {
      console.warn(`[SteamApiClient] Falha ao consultar jogadores reais para o AppID ${appId}:`, error);
      return null;
    }
  }

  /**
   * Obtém o preço atual de um item no Mercado da Comunidade Steam (com fallback)
   */
  public async fetchMarketItemPrice(appId: number, marketHashName: string): Promise<number | null> {
    try {
      const encodedName = encodeURIComponent(marketHashName);
      const url = `https://steamcommunity.com/market/priceoverview/?currency=1&appid=${appId}&market_hash_name=${encodedName}`;
      
      const response = await fetch(url, {
        headers: this.getRotatedHeaders(),
      });

      if (!response.ok) return null;

      const data = await response.json();
      if (data && data.success && data.lowest_price) {
        // Converte string de preço "$1.25" para número 1.25
        const numericPrice = parseFloat(data.lowest_price.replace(/[^0-9.]/g, ''));
        return isNaN(numericPrice) ? null : numericPrice;
      }
      return null;
    } catch (error) {
      // Ignora silenciosamente limites de taxa e cai no fallback
      return null;
    }
  }

  /**
   * Processa e enriquece a lista de jogos com dados reais da Steam API
   */
  public async getGamesHybrid(): Promise<{ games: Game[]; isLive: boolean }> {
    const baseGames: Game[] = JSON.parse(JSON.stringify(gamesData));
    let anyLiveSuccess = false;
    const nowIso = new Date().toISOString();

    // Executa pedidos de jogadores em paralelo para alta performance
    const updatedGames = await Promise.all(
      baseGames.map(async (game) => {
        let isGameLive = false;

        if (game.steamAppId) {
          const livePlayerCount = await this.fetchRealTimePlayerCount(game.steamAppId);
          if (livePlayerCount !== null) {
            game.activePlayers24h = livePlayerCount;
            isGameLive = true;
            anyLiveSuccess = true;
          }
        }

        return {
          ...game,
          isLiveData: isGameLive,
          lastUpdated: nowIso,
        };
      })
    );

    return {
      games: updatedGames,
      isLive: anyLiveSuccess,
    };
  }

  /**
   * Mantém retrocompatibilidade para leituras normais
   */
  public async getGames(): Promise<Game[]> {
    const { games } = await this.getGamesHybrid();
    return games;
  }
}

export const steamApi = new SteamApiClient();
