import { NextResponse } from 'next/server';
import { steamApi } from '@/lib/steamApi';
import { serverCache } from '@/lib/cache';
import { HybridApiResponse } from '@/lib/types';

const CACHE_KEY = 'hybrid_steam_games_data';
const CACHE_TTL_SECONDS = parseInt(process.env.CACHE_TTL_SECONDS || '900', 10);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const forceRefresh = searchParams.get('force') === 'true';

    // 1. Tentar obter do Cache Server-Side se não for forçado
    if (!forceRefresh) {
      const cachedData = serverCache.get<{ games: any[]; isLive: boolean }>(CACHE_KEY, CACHE_TTL_SECONDS);
      const cacheInfo = serverCache.getInfo(CACHE_KEY);

      if (cachedData) {
        const response: HybridApiResponse = {
          success: true,
          isLive: cachedData.isLive,
          cached: true,
          cacheAgeSeconds: cacheInfo.ageSeconds,
          timestamp: new Date().toISOString(),
          games: cachedData.games,
        };
        return NextResponse.json(response);
      }
    }

    // 2. Se não houver no cache ou se forçado, faz busca híbrida
    console.log('[API /api/steam-live] A consultar Steam Web API...');
    const result = await steamApi.getGamesHybrid();

    // Guardar no cache
    serverCache.set(CACHE_KEY, result);

    const response: HybridApiResponse = {
      success: true,
      isLive: result.isLive,
      cached: false,
      cacheAgeSeconds: 0,
      timestamp: new Date().toISOString(),
      games: result.games,
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('[API /api/steam-live] Erro no processamento:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao processar dados da API Steam.',
        details: error.message || error,
      },
      { status: 500 }
    );
  }
}
