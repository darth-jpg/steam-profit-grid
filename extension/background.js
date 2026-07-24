console.log('[Steam Profit Companion] Background Service Worker active.');

// Escutar eventos vindos do content script ou popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'STEAM_INVENTORY_DETECTED') {
    const { appId, itemsCount, steamId } = message.payload;
    
    // Obter as configurações de URL salvas pelo utilizador
    chrome.storage.local.get(['dashboardUrl', 'steamId'], (result) => {
      const dashboardUrl = result.dashboardUrl || 'http://localhost:3000';
      const savedSteamId = result.steamId || steamId;

      if (!savedSteamId) {
        console.warn('[Steam Profit Companion] Cancelado: SteamID em falta.');
        return;
      }

      const telemetryUrl = `${dashboardUrl}/api/report-farm`;
      console.log(`[Steam Profit Companion] A enviar telemetria para: ${telemetryUrl}`);

      // Enviar os dados de farm via POST para o Dashboard Next.js
      fetch(telemetryUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          steamId: savedSteamId,
          appId: appId,
          dropsCount: itemsCount,
          timestamp: new Date().toISOString()
        })
      })
      .then(res => res.json())
      .then(data => {
        console.log('[Steam Profit Companion] Telemetria enviada com sucesso:', data);
      })
      .catch(err => {
        console.error('[Steam Profit Companion] Falha ao comunicar com o dashboard:', err);
      });
    });
  }
});
