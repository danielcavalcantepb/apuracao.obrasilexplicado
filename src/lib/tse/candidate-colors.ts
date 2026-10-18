import type { CandidateResult } from './types';

// Representative party identity colors, not a palette assigned by vote ranking.
// Used by the candidate list, map legend and regional aggregation alike.
export const PARTY_COLORS: Readonly<Record<string, string>> = {
  PL: '#005CAA',
  PT: '#E31837',
  PSD: '#008642',
  AVANTE: '#F58220',
  NOVO: '#EF6500',
  MISSÃO: '#F2C500',
  DC: '#1762A5',
  DEMOCRATA: '#1976B9',
  PCB: '#B71920',
  PSTU: '#D62027',
  UP: '#CC2027',
  PCO: '#A71930',
};

export function candidateColor(candidate: Pick<CandidateResult, 'party'>): string {
  return PARTY_COLORS[candidate.party.trim().normalize('NFC').toUpperCase()] ?? '#64748B';
}
