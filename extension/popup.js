document.addEventListener('DOMContentLoaded', () => {
  const dashboardUrlInput = document.getElementById('dashboardUrl');
  const steamIdInput = document.getElementById('steamId');
  const saveBtn = document.getElementById('saveBtn');
  const statusDiv = document.getElementById('status');

  // 1. Carregar definições persistidas
  chrome.storage.local.get(['dashboardUrl', 'steamId'], (result) => {
    if (result.dashboardUrl) {
      dashboardUrlInput.value = result.dashboardUrl;
    }
    if (result.steamId) {
      steamIdInput.value = result.steamId;
    }
    updateStatus('Config loaded.');
  });

  // 2. Ação de Salvar Configurações
  saveBtn.addEventListener('click', () => {
    const url = dashboardUrlInput.value.trim().replace(/\/$/, ""); // Remove barra final se houver
    const steamId = steamIdInput.value.trim();

    if (!url) {
      updateStatus('Error: Dashboard URL is required.');
      return;
    }
    if (!steamId) {
      updateStatus('Error: Steam ID is required.');
      return;
    }

    chrome.storage.local.set({
      dashboardUrl: url,
      steamId: steamId
    }, () => {
      updateStatus('Saved successfully!\nOpen your Steam Inventory page to auto-sync.');
    });
  });

  function updateStatus(msg) {
    statusDiv.textContent = `Status: ${msg}`;
  }
});
