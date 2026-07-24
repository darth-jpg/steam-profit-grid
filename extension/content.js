console.log('[Steam Profit Companion] Content Script active.');

// Aguarda o inventário da Steam carregar completamente na página
window.addEventListener('load', () => {
  setTimeout(parseInventoryAndNotify, 3000); // Aguarda renderização dos itens no DOM
});

function parseInventoryAndNotify() {
  try {
    // 1. Detetar o AppID ativo a partir do URL (ex: #730 para CS2, #252490 para Rust)
    const hash = window.location.hash;
    let appId = '730'; // CS2 por padrão
    if (hash && hash.includes('_')) {
      const parts = hash.replace('#', '').split('_');
      if (parts[0]) appId = parts[0];
    } else {
      // Tentar ler do seletor do jogo no DOM da Steam
      const activeAppEl = document.querySelector('.games_list_tab.active');
      if (activeAppEl) {
        const idAttr = activeAppEl.id; // ex: "game_button_730"
        const match = idAttr.match(/\d+/);
        if (match) appId = match[0];
      }
    }

    // 2. Contar número de itens renderizados no inventário
    const itemCards = document.querySelectorAll('.inventory_page:not([style*="display: none"]) .itemCard');
    const itemsCount = itemCards.length || 0;

    console.log(`[Steam Profit Companion] Detetados ${itemsCount} itens para o AppID ${appId}`);

    // 3. Obter o SteamID64 do dono do perfil a partir do código do DOM (g_rgProfileData)
    let profileSteamId = '';
    const scriptText = Array.from(document.scripts)
      .map(s => s.textContent)
      .find(t => t && t.includes('g_rgProfileData'));
      
    if (scriptText) {
      const match = scriptText.match(/"steamid":"(\d+)"/);
      if (match && match[1]) {
        profileSteamId = match[1];
      }
    }

    // 4. Enviar mensagem ao background.js para reportar telemetria
    chrome.runtime.sendMessage({
      type: 'STEAM_INVENTORY_DETECTED',
      payload: {
        appId: appId,
        itemsCount: itemsCount,
        steamId: profileSteamId
      }
    });

  } catch (error) {
    console.error('[Steam Profit Companion] Erro ao analisar inventário:', error);
  }
}
