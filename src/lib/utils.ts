export type TaxDisplayMode = 'gross' | 'steam_net' | 'real_cashout';

/**
 * Calcula o preço líquido ajustado pela taxa selecionada
 * - gross: Preço nominal do mercado da Steam (100%)
 * - steam_net: Saldo real que entra na Steam Wallet após 15% de taxa Valve (-15%)
 * - real_cashout: Estimativa em dinheiro real bancário via plataformas de liquidez (~70%)
 */
export function getAdjustedPrice(price: number, mode: TaxDisplayMode): number {
  switch (mode) {
    case 'steam_net':
      // Taxa oficial da Steam é de ~15% (5% Valve + 10% criador do jogo)
      return price * 0.8695;
    case 'real_cashout':
      // Cashout em moeda fiduciária real via mercados de liquidez
      return price * 0.70;
    case 'gross':
    default:
      return price;
  }
}

/**
 * Retorna o sufixo legível para o modo de taxa ativo
 */
export function getTaxModeLabel(mode: TaxDisplayMode): string {
  switch (mode) {
    case 'steam_net':
      return 'Steam Net (-15%)';
    case 'real_cashout':
      return 'Cashout Banco (~70%)';
    case 'gross':
    default:
      return 'Bruto Mercado';
  }
}

/**
 * Formata números de moeda com o símbolo de dólar ($)
 */
export function formatCurrency(val: number, decimals: number = 2): string {
  return `$${val.toFixed(decimals)}`;
}

/**
 * Calcula os segundos e tempo restante até ao próximo Reset Semanal da Steam
 * (Todas as Terças-feiras às 20:00 UTC / ~21:00 Lisboa)
 */
export function getSteamWeeklyResetRemaining(): {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isCloseToReset: boolean;
} {
  const now = new Date();
  
  // Encontra a próxima Terça-feira às 20:00 UTC
  const nextReset = new Date();
  const dayOfWeek = now.getUTCDay(); // 0 = Domingo, 2 = Terça
  let daysUntilTuesday = (2 - dayOfWeek + 7) % 7;
  
  // Se já passou a Terça-feira das 20:00 UTC de hoje, avança para a próxima semana
  if (daysUntilTuesday === 0 && now.getUTCHours() >= 20) {
    daysUntilTuesday = 7;
  }

  nextReset.setUTCDate(now.getUTCDate() + daysUntilTuesday);
  nextReset.setUTCHours(20, 0, 0, 0);

  const diffMs = nextReset.getTime() - now.getTime();
  const totalSeconds = Math.max(0, Math.floor(diffMs / 1000));

  const days = Math.floor(totalSeconds / (3600 * 24));
  const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  // Se faltarem menos de 12 horas para o reset
  const isCloseToReset = totalSeconds < 12 * 3600;

  return { days, hours, minutes, seconds, isCloseToReset };
}

/**
 * Gera e transfere um ficheiro CSV a partir de cabeçalhos e linhas de dados
 */
export function downloadCSV(filename: string, headers: string[], rows: string[][]): void {
  // Delimitador ";" garante compatibilidade direta com Excel em sistemas portugueses/europeus
  const csvContent = [
    headers.join(';'),
    ...rows.map(row => row.map(val => `"${val.replace(/"/g, '""')}"`).join(';'))
  ].join('\n');

  // Adiciona BOM (Byte Order Mark) para suportar caracteres especiais (acentos/UTF-8) no Excel
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
