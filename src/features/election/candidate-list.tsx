'use client';
import { memo, useState } from 'react';
import Image from 'next/image';
import type { CandidateResult } from '@/lib/tse/types';
import { candidateColor } from '@/lib/tse/candidate-colors';
import { number, percent } from '@/lib/format';
const Candidate = memo(function Candidate({
  candidate,
  index,
  emphasis,
}: {
  candidate: CandidateResult;
  index: number;
  emphasis: boolean;
}) {
  const [failed, setFailed] = useState(false);
  return (
    <li className={`candidate ${emphasis && index < 2 ? 'candidate-leading' : ''}`}>
      <div className="portrait">
        {failed ? (
          <span aria-label="Foto indisponível">{candidate.number}</span>
        ) : (
          <Image
            src={`/api/election/photo/${candidate.id}`}
            alt={`Foto de ${candidate.ballotName}`}
            width={76}
            height={86}
            unoptimized
            onError={() => setFailed(true)}
          />
        )}
      </div>
      <div className="candidate-info">
        <h3>{candidate.ballotName}</h3>
        <p>
          <strong>{candidate.party}</strong> · {candidate.number}
          {candidate.status && <span className="candidate-status">{candidate.status}</span>}
        </p>
        <details>
          <summary>Informações da candidatura</summary>
          <p>{candidate.name}</p>
          {candidate.coalition && <p>{candidate.coalition}</p>}
          {candidate.federation && <p>{candidate.federation}</p>}
          {candidate.destination && <p>Destinação dos votos: {candidate.destination}</p>}
        </details>
      </div>
      <div className="candidate-numbers">
        <strong>
          {percent(candidate.percentage)}
          <span>%</span>
        </strong>
        <p>
          {number(candidate.votes)} <span>votos</span>
        </p>
      </div>
      <div className="candidate-bar" aria-hidden="true">
        <span
          style={{ width: `${candidate.percentage}%`, backgroundColor: candidateColor(candidate) }}
        />
      </div>
    </li>
  );
});
export const CandidateList = memo(function CandidateList({
  candidates,
  emphasis = false,
}: {
  candidates: CandidateResult[];
  emphasis?: boolean;
}) {
  return (
    <ol className={`candidate-list ${emphasis ? 'national-candidates' : ''}`}>
      {candidates.map((c, index) => (
        <Candidate key={c.id} candidate={c} index={index} emphasis={emphasis} />
      ))}
    </ol>
  );
});
