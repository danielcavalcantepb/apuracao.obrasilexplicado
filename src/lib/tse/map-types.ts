import type { ElectionSnapshot } from './types';
export type MapCandidate = {
  id: string;
  number: string;
  name: string;
  votes: number;
  percentage: number;
  color: string;
};
export type StateMapResult = {
  candidates?: MapCandidate[];
  validVotes?: number | null;
  eligibleVoters?: number | null;
  uf: string;
  name: string;
  region: string;
  status: 'waiting' | 'counting' | 'finished' | 'unavailable';
  outcome: 'leader' | 'tie' | 'waiting' | 'missing';
  leader: MapCandidate | null;
  runnerUp: MapCandidate | null;
  tied: MapCandidate[];
  marginVotes: number | null;
  marginPercentagePoints: number | null;
  countedPercentage: number | null;
  updatedAt: string | null;
  version: string | null;
  stale: boolean;
  issue: string | null;
};
export type MapLegendEntry = {
  id: string;
  number: string;
  name: string;
  color: string;
  stateCount: number;
};
export type RegionalResult = {
  eligibleVoters?: number | null;
  electorateWeight?: number | null;
  name: string;
  availableStates: number;
  totalStates: number;
  reliable: boolean;
  validVotes: number | null;
  countedPercentage: number | null;
  stale: boolean;
  candidates: (MapLegendEntry & { votes: number; percentage: number | null })[];
  issue: string | null;
};
export type ElectionMapSnapshot = {
  status: 'waiting' | 'counting' | 'finished' | 'unavailable';
  updatedAt: string | null;
  oldestUpdatedAt: string | null;
  nationalUpdatedAt: string | null;
  nationalProgress: number | null;
  states: StateMapResult[];
  legend: MapLegendEntry[];
  regions: RegionalResult[];
  missingStates: number;
  waitingStates: number;
  tiedStates: number;
  stale: boolean;
  issue: string | null;
};
export type ElectionMapResponse = {
  snapshot: ElectionMapSnapshot;
  nextPollMs: number;
  staleAfterMs: number;
};
export type StateInput = {
  uf: string;
  name: string;
  region: string;
  snapshot: ElectionSnapshot | null;
  stale: boolean;
  issue: string | null;
};
