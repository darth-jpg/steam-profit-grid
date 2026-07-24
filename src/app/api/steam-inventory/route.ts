import { NextResponse } from 'next/server';

// Lista de AppIDs suportados com economias ativas de mercado
const SUPPORTED_APPS = [
  { appId: 730, gameId: 'cs2' },
  { appId: 570, gameId: 'dota2' },
  { appId: 440, gameId: 'tf2' },
  { appId: 252490, gameId: 'rust' },
  { appId: 578080, gameId: 'pubg' },
  { appId: 304930, gameId: 'unturned' },
  { appId: 322330, gameId: 'dst' },
  { appId: 2923300, gameId: 'banana' },
  { appId: 2971200, gameId: 'cats' },
  { appId: 3012970, gameId: 'cucumber' },
  { appId: 2786310, gameId: 'egg' },
  { appId: 232090, gameId: 'kf2' },
  { appId: 381210, gameId: 'dbd' },
  { appId: 4000, gameId: 'gmod' }
];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const input = searchParams.get('input')?.trim();

    if (!input) {
      return NextResponse.json(
        { success: false, error: 'Insira um SteamID64 ou o link do perfil da Steam.' },
        { status: 400 }
      );
    }

    // 1. Extrair o identificador a partir de um URL ou string simples
    let steamId = input;
    let isVanity = false;

    if (input.includes('steamcommunity.com/id/')) {
      const match = input.match(/steamcommunity\.com\/id\/([^\/]+)/);
      if (match && match[1]) {
        steamId = match[1];
        isVanity = true;
      }
    } else if (input.includes('steamcommunity.com/profiles/')) {
      const match = input.match(/steamcommunity\.com\/profiles\/([^\/]+)/);
      if (match && match[1]) {
        steamId = match[1];
      }
    } else if (!/^\d{17}$/.test(input)) {
      isVanity = true;
    }

    // 2. Se for Vanity Name e houver uma Steam API Key disponível, resolve o SteamID64
    const apiKey = process.env.STEAM_API_KEY;
    if (isVanity && apiKey) {
      try {
        const resolveUrl = `https://api.steampowered.com/ISteamUser/ResolveVanityURL/v1/?key=${apiKey}&vanityurl=${encodeURIComponent(steamId)}`;
        const res = await fetch(resolveUrl);
        const json = await res.json();
        if (json?.response?.success === 1 && json?.response?.steamid) {
          steamId = json.response.steamid;
        }
      } catch (e) {
        console.warn('Falha ao resolver Vanity URL via API Key, a tentar fallback direto...');
      }
    }

    // 3. Consultar todos os inventários em paralelo usando Promise.all
    let totalItemsLoaded = 0;
    const allImportedItems: any[] = [];
    let privateProfileDetected = false;
    let successFetches = 0;

    const fetchPromises = SUPPORTED_APPS.map(async (app) => {
      const inventoryUrl = `https://steamcommunity.com/inventory/${steamId}/${app.appId}/2?l=english&count=5000`;
      
      try {
        const invRes = await fetch(inventoryUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            'Accept': 'application/json',
          },
          next: { revalidate: 60 } // Cache opcional de 60s
        });

        if (invRes.status === 403) {
          privateProfileDetected = true;
          return;
        }

        if (!invRes.ok) return;

        const invData = await invRes.json();
        if (!invData || !invData.assets || !invData.descriptions) return;

        successFetches++;

        // Mapear descrições
        const descriptionMap = new Map<string, { name: string; icon: string }>();
        invData.descriptions.forEach((desc: any) => {
          const key = `${desc.classid}_${desc.instanceid}`;
          descriptionMap.set(key, {
            name: desc.market_hash_name || desc.name || 'Unknown Item',
            icon: desc.icon_url ? `https://community.cloudflare.steamstatic.com/economy/image/${desc.icon_url}` : '',
          });
        });

        // Contar quantidades
        const itemCounts = new Map<string, { count: number; icon: string }>();
        invData.assets.forEach((asset: any) => {
          const key = `${asset.classid}_${asset.instanceid}`;
          const desc = descriptionMap.get(key);
          if (desc && desc.name) {
            const existing = itemCounts.get(desc.name);
            if (existing) {
              existing.count += 1;
            } else {
              itemCounts.set(desc.name, { count: 1, icon: desc.icon });
            }
          }
        });

        // Adicionar à lista consolidada
        itemCounts.forEach((data, itemName) => {
          allImportedItems.push({
            gameId: app.gameId,
            appId: app.appId,
            itemName,
            quantity: data.count,
            iconUrl: data.icon,
          });
        });

        totalItemsLoaded += invData.assets.length;

      } catch (err) {
        console.error(`Erro ao ler inventário do AppID ${app.appId}:`, err);
      }
    });

    await Promise.all(fetchPromises);

    // Se detetámos perfil privado e não conseguimos ler NADA
    if (privateProfileDetected && successFetches === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'O inventário desta conta Steam está configurado como PRIVADO. Altere a privacidade do inventário para Público nas configurações da Steam.',
        },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      steamId,
      totalItemsCount: totalItemsLoaded,
      uniqueTypesCount: allImportedItems.length,
      items: allImportedItems,
    });
  } catch (error: any) {
    console.error('[API /api/steam-inventory] Erro de execução:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao processar inventário consolidado da Steam.',
        details: error.message || error,
      },
      { status: 500 }
    );
  }
}
