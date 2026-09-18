import type { Role } from './types';
import { gameModeLabel } from './mode';
import type { GameMode } from './mode';
import { gamePlanLabel } from './plan';
import type { GamePlan } from './plan';
import type { CampaignReport } from './report';
import { buildJourneyNodes } from './journey';

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
  gameMode: GameMode;
  gamePlan: GamePlan | null;
  team: SharePlayer[];
  challengeCode?: string;
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

export function journeyCardFileName(report: Pick<CampaignReport, 'outcome'>): string {
  return `draft-lendas-jornada-${safeOutcomeSlug(report.outcome) || 'campanha'}.png`;
}

export function campaignShareText(summary: CampaignShareSummary, challengeUrl?: string): string {
  const lineup = summary.team
    .map(
      (player) =>
        `${roleLabels[player.role]} ${player.playerName} (${player.team} ${player.worldsYear})`,
    )
    .join(' · ');
  const challenge = challengeUrl
    ? ` Desafio ${summary.challengeCode ?? ''}: tente vencer meu draft nas mesmas condições: ${challengeUrl}`
    : '';
  const plan = summary.gamePlan ? `, plano ${gamePlanLabel(summary.gamePlan)}` : '';
  return `Meu Draft Lendas no modo ${gameModeLabel(summary.gameMode)}${plan} terminou como ${summary.outcome}: ${summary.wins}V–${summary.losses}D. ${lineup}. Você faria um draft melhor?${challenge}`;
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
  context.fillText(
    summary.gamePlan
      ? `MODO ${gameModeLabel(summary.gameMode).toUpperCase()} · PLANO ${gamePlanLabel(summary.gamePlan).toUpperCase()}`
      : `MODO ${gameModeLabel(summary.gameMode).toUpperCase()} · DIFERENTES ERAS · UM SÓ TÍTULO`,
    72,
    146,
  );

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
  context.fillText(
    summary.challengeCode ? `DESAFIO ${summary.challengeCode}` : 'DRAFT LENDAS',
    1008,
    1289,
  );
  context.textAlign = 'left';

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
  if (!blob) throw new Error('Não foi possível gerar a imagem da campanha.');
  return { blob, fileName: campaignCardFileName(summary) };
}

export async function createJourneyCard(report: CampaignReport): Promise<CampaignCard> {
  if (typeof document === 'undefined') throw new Error('Card indisponível fora do navegador.');
  await document.fonts?.ready;
  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1350;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('O navegador não conseguiu preparar a jornada.');
  const nodes = buildJourneyNodes(report);

  context.fillStyle = '#f7f8f4';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = '#b8f34a';
  context.fillRect(0, 0, canvas.width, 24);
  context.fillStyle = '#173f2b';
  context.font = '800 48px "Barlow Condensed", "Arial Narrow", sans-serif';
  context.fillText('DRAFT LENDAS.', 70, 94);
  context.fillStyle = '#172019';
  context.font = '800 70px "Barlow Condensed", "Arial Narrow", sans-serif';
  context.fillText('SUA JORNADA', 70, 178);
  context.fillStyle = '#687064';
  context.font = '500 22px "DM Sans", Arial, sans-serif';
  context.fillText(`${report.outcome.toUpperCase()} · ${report.totals.wins}V–${report.totals.losses}D`, 72, 216);

  nodes.forEach((node, index) => {
    const y = 270 + index * 116;
    if (index < nodes.length - 1) {
      context.strokeStyle = '#9bac93';
      context.lineWidth = 5;
      context.beginPath();
      context.moveTo(112, y + 55);
      context.lineTo(112, y + 128);
      context.stroke();
    }
    context.beginPath();
    context.arc(112, y + 37, 31, 0, Math.PI * 2);
    context.fillStyle = node.won ? '#b8f34a' : '#dc786b';
    context.fill();
    context.fillStyle = '#173f2b';
    context.textAlign = 'center';
    context.font = '800 24px "Barlow Condensed", "Arial Narrow", sans-serif';
    context.fillText(String(index + 1), 112, y + 46);
    context.textAlign = 'left';

    roundedRect(context, 168, y, 840, 84, 14);
    context.fillStyle = node.highlight ? '#e8f5dd' : '#ffffff';
    context.fill();
    context.strokeStyle = node.highlight ? '#86bf61' : '#d8ded2';
    context.lineWidth = 2;
    context.stroke();
    context.fillStyle = '#64705f';
    context.font = '700 16px "DM Sans", Arial, sans-serif';
    context.fillText(stageLabelForCard(node.stage).toUpperCase(), 192, y + 27);
    context.fillStyle = '#172019';
    fitText(context, node.opponentName.toUpperCase(), 550, 34, 22, 800);
    context.fillText(node.opponentName.toUpperCase(), 192, y + 61);
    context.textAlign = 'right';
    context.font = '800 42px "Barlow Condensed", "Arial Narrow", sans-serif';
    context.fillText(`${node.wins}–${node.losses}`, 970, y + 56);
    context.textAlign = 'left';
  });

  context.fillStyle = '#173f2b';
  context.font = '800 38px "Barlow Condensed", "Arial Narrow", sans-serif';
  context.fillText(`PLANO ${report.plan.label.toUpperCase()} · ${report.plan.totalEffect > 0 ? '+' : ''}${report.plan.totalEffect.toFixed(1)}`, 72, 1248);
  context.fillStyle = '#687064';
  context.font = '500 21px "DM Sans", Arial, sans-serif';
  context.fillText('CADA NÓ É UM CONFRONTO REAL DA CAMPANHA.', 72, 1290);

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
  if (!blob) throw new Error('Não foi possível gerar a imagem da jornada.');
  return { blob, fileName: journeyCardFileName(report) };
}

function stageLabelForCard(stage: 'swiss' | 'quarters' | 'semis' | 'final'): string {
  return {
    swiss: 'Etapa Suíça',
    quarters: 'Quartas de final',
    semis: 'Semifinal',
    final: 'Final',
  }[stage];
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
