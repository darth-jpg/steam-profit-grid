import { NextResponse } from 'next/server';
import { FarmReportPayload } from '@/lib/types';

export async function POST(request: Request) {
  try {
    const body: FarmReportPayload = await request.json();

    const { userId, gameId, hoursPlayed, itemsDroppedCount } = body;

    // Validação básica de dados
    if (!userId || !gameId || hoursPlayed === undefined || itemsDroppedCount === undefined) {
      return NextResponse.json(
        { error: 'Parâmetros em falta. Requerido: userId, gameId, hoursPlayed, itemsDroppedCount.' },
        { status: 400 }
      );
    }

    if (typeof hoursPlayed !== 'number' || typeof itemsDroppedCount !== 'number' || hoursPlayed < 0 || itemsDroppedCount < 0) {
      return NextResponse.json(
        { error: 'Valores numéricos inválidos para hoursPlayed ou itemsDroppedCount.' },
        { status: 400 }
      );
    }

    // Boilerplate pronto para integrar logs ou DB
    console.log(`[API report-farm] Relatório recebido com sucesso de ${userId}:`);
    console.log(`- Jogo: ${gameId}`);
    console.log(`- Horas jogadas: ${hoursPlayed}h`);
    console.log(`- Itens dropados: ${itemsDroppedCount}`);
    
    // Rácio real calculado com base nos dados reais do utilizador
    const realDropsPerHour = hoursPlayed > 0 ? itemsDroppedCount / hoursPlayed : 0;

    return NextResponse.json({
      success: true,
      message: 'Dados de telemetria recebidos com sucesso.',
      data: {
        userId,
        gameId,
        hoursPlayed,
        itemsDroppedCount,
        realDropsPerHour: parseFloat(realDropsPerHour.toFixed(4)),
        timestamp: new Date().toISOString()
      }
    });

  } catch (error: any) {
    return NextResponse.json(
      { error: 'Erro ao processar dados de telemetria.', details: error.message || error },
      { status: 500 }
    );
  }
}
