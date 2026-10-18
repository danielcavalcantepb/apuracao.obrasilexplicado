import type { ElectionSnapshot } from './types';
import { candidateColor } from './candidate-colors';
export function validVoteAnalysis(snapshot: ElectionSnapshot | null) {
  if (!snapshot) return null;
  const denominator = snapshot.progress.validVotes;
  const candidates = snapshot.candidates.filter((c) => c.destination === 'Válido');
  if (
    !denominator ||
    candidates.reduce((sum, c) => sum + c.votes, 0) !== denominator ||
    snapshot.candidates.some((c) => c.votes > 0 && !c.destination)
  )
    return null;
  return {
    validVotes: denominator,
    candidates: candidates
      .map((c) => ({
        id: c.id,
        name: c.ballotName,
        number: c.number,
        votes: c.votes,
        percentage: (c.votes / denominator) * 100,
        color: candidateColor(c),
      }))
      .sort((a, b) => b.votes - a.votes || Number(a.number) - Number(b.number)),
  };
}
export type ValidVoteAnalysis = ReturnType<typeof validVoteAnalysis>;
