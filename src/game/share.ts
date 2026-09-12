import type { Role } from './types';

export interface SharePlayer {
  role: Role;
  playerName: string;
  team: string;
  worldsYear: number;
}

export interface CampaignShareSummary {
  outcome: string;
  wins: number;
  losses: number;
  confrontations: number;
  team: SharePlayer[];
}

export interface CampaignCard {
  blob: Blob;
  fileName: string;
}

const roleLabels: Record<Role, string> = {
  TOP: 'TOP',
  JUNGLE: 'JG',
  MID: 'MID',
  ADC: 'ADC',
  SUPPORT: 'SUP',
};

function safeOutcomeSlug(outcome: string): string {
  return outcome
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48);
}

export function campaignCardFileName(summary: CampaignShareSummary): string {
  return `draft-lendas-${safeOutcomeSlug(summary.outcome) || 'campanha'}.png`;
}

export function campaignShareText(summary: CampaignShareSummary): string {
  const lineup = summary.team
    .map(
      (player) =>
        `${roleLabels[player.role]} ${player.playerName} (${player.team} ${player.worldsYear})`,
    )
    .join(' · ');
  return `Meu Draft Lendas terminou como ${summary.outcome}: ${summary.wins}V–${summary.losses}D. ${lineup}. Você faria um draft melhor?`;
}

function roundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): void {
  const r = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.moveTo(x + r, y);
  context.arcTo(x + width, y, x + width, y + height, r);
  context.arcTo(x + width, y + height, x, y + height, r);
  context.arcTo(x, y + height, x, y, r);
  context.arcTo(x, y, x + width, y, r);
  context.closePath();
}

function fitText(
  context: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  startSize: number,
  minSize: number,
  weight = 700,
): number {
  let size = startSize;
  while (size > minSize) {
    context.font = `${weight} ${size}px "Barlow Condensed", "Arial Narrow", sans-serif`;
    if (context.measureText(text).width <= maxWidth) break;
    size -= 2;
  }
  return size;
}

export async function createCampaignCard(summary: CampaignShareSummary): Promise<CampaignCard> {
  if (typeof document === 'undefined') throw new Error('Card indisponível fora do navegador.');
  await document.fonts?.ready;
  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1350;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('O navegador não conseguiu preparar o card.');

  context.fillStyle = '#f7f8f4';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = '#b8f34a';
  context.fillRect(0, 0, canvas.width, 24);

  context.fillStyle = '#173f2b';
  context.font = '800 50px "Barlow Condensed", "Arial Narrow", sans-serif';
  context.fillText('DRAFT', 72, 105);
  const draftWidth = context.measureText('DRAFT').width;
  context.fillStyle = '#5ea929';
  context.fillText(' LENDAS.', 72 + draftWidth, 105);
  context.fillStyle = '#687064';
  context.font = '500 22px "DM Sans", Arial, sans-serif';
  context.fillText('CINCO ESCOLHAS · DIFERENTES ERAS · UM SÓ TÍTULO', 72, 146);

  roundedRect(context, 72, 202, 936, 210, 26);
  context.fillStyle = summary.outcome === 'Campeão mundial' ? '#173f2b' : '#e9eee3';
  context.fill();
  context.fillStyle = summary.outcome === 'Campeão mundial' ? '#b8f34a' : '#173f2b';
  context.font = '600 22px "DM Sans", Arial, sans-serif';
  context.fillText('MINHA CAMPANHA', 110, 254);
  const outcome = summary.outcome.toUpperCase();
  fitText(context, outcome, 610, 78, 44, 800);
  context.fillText(outcome, 110, 340);

  context.textAlign = 'center';
  context.fillStyle = summary.outcome === 'Campeão mundial' ? '#ffffff' : '#173f2b';
  context.font = '800 70px "Barlow Condensed", "Arial Narrow", sans-serif';
  context.fillText(String(summary.wins), 830, 315);
  context.fillStyle = summary.outcome === 'Campeão mundial' ? '#9cb68f' : '#8b9586';
  context.font = '500 23px "DM Sans", Arial, sans-serif';
  context.fillText('VITÓRIAS', 830, 348);
  context.textAlign = 'left';

  context.fillStyle = '#173f2b';
  context.font = '700 34px "Barlow Condensed", "Arial Narrow", sans-serif';
  context.fillText('AS CINCO LENDAS', 72, 474);

  summary.team.forEach((player, index) => {
    const y = 510 + index * 138;
    roundedRect(context, 72, y, 936, 116, 18);
    context.fillStyle = index % 2 === 0 ? '#ffffff' : '#f0f3eb';
    context.fill();
    context.strokeStyle = '#d8ded2';
    context.lineWidth = 2;
    context.stroke();

    roundedRect(context, 91, y + 18, 88, 80, 14);
    context.fillStyle = '#b8f34a';
    context.fill();
    context.fillStyle = '#173f2b';
    context.textAlign = 'center';
    context.font = '800 30px "Barlow Condensed", "Arial Narrow", sans-serif';
    context.fillText(roleLabels[player.role], 135, y + 67);
    context.textAlign = 'left';

    context.fillStyle = '#172019';
    fitText(context, player.playerName.toUpperCase(), 510, 46, 30, 800);
    context.fillText(player.playerName.toUpperCase(), 208, y + 61);
    context.fillStyle = '#687064';
    context.font = '500 22px "DM Sans", Arial, sans-serif';
    context.fillText(`${player.team} · WORLDS ${player.worldsYear}`, 210, y + 91);

    context.fillStyle = '#173f2b';
    context.textAlign = 'center';
    context.font = '800 42px "Barlow Condensed", "Arial Narrow", sans-serif';
    context.fillText(player.playerName.charAt(0).toUpperCase(), 943, y + 68);
    context.textAlign = 'left';
  });

  context.fillStyle = '#173f2b';
  context.font = '800 40px "Barlow Condensed", "Arial Narrow", sans-serif';
  context.fillText(
    `${summary.wins}V · ${summary.losses}D · ${summary.confrontations} CONFRONTOS`,
    72,
    1244,
  );
  context.fillStyle = '#687064';
  context.font = '500 24px "DM Sans", Arial, sans-serif';
  context.fillText('VOCÊ FARIA UM DRAFT MELHOR?', 72, 1290);
  context.fillStyle = '#5ea929';
  context.textAlign = 'right';
  context.font = '700 25px "DM Sans", Arial, sans-serif';
  context.fillText('DRAFT LENDAS', 1008, 1289);
  context.textAlign = 'left';

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
  if (!blob) throw new Error('Não foi possível gerar a imagem da campanha.');
  return { blob, fileName: campaignCardFileName(summary) };
}

export function downloadCampaignCard(card: CampaignCard): void {
  const url = URL.createObjectURL(card.blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = card.fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
