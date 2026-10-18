'use client';
import { memo, useMemo, useState } from 'react';
import type { ElectionMapSnapshot, StateMapResult } from '@/lib/tse/map-types';
import { percent, number, time } from '@/lib/format';
const regions = ['Todos', 'Norte', 'Nordeste', 'Centro-Oeste', 'Sudeste', 'Sul'];
export const StateResults = memo(function StateResults({
  snapshot,
  onSelect,
}: {
  snapshot: ElectionMapSnapshot | null;
  onSelect: (uf: string) => void;
}) {
  const [region, setRegion] = useState('Todos');
  const [sort, setSort] = useState('name');
  const [descending, setDescending] = useState(false);
  const states = useMemo(
    () =>
      [...(snapshot?.states ?? [])]
        .filter((s) => region === 'Todos' || s.region === region)
        .sort((a, b) => {
          const value = (s: StateMapResult) =>
            sort === 'counted'
              ? s.countedPercentage
              : sort === 'margin'
                ? s.marginPercentagePoints
                : s.leader?.percentage;
          if (sort === 'name') return a.name.localeCompare(b.name, 'pt-BR') * (descending ? -1 : 1);
          const av = value(a),
            bv = value(b);
          if (av == null) return bv == null ? 0 : 1;
          if (bv == null) return -1;
          return (av - bv) * (descending ? -1 : 1);
        }),
    [snapshot, region, sort, descending],
  );
  return (
    <section className="state-results editorial-section" aria-labelledby="states-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">27 UNIDADES DA FEDERAÇÃO</p>
          <h2 id="states-title">Resultado por estado</h2>
        </div>
        <p>Percentuais publicados pelo TSE</p>
      </div>
      <div className="state-controls">
        <div className="region-filters" aria-label="Filtrar estados por região">
          {regions.map((r) => (
            <button key={r} aria-pressed={region === r} onClick={() => setRegion(r)}>
              {r}
            </button>
          ))}
        </div>
        <label>
          Ordenar por
          <select
            aria-label="Ordenar estados"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            <option value="name">Nome</option>
            <option value="counted">Totalização</option>
            <option value="margin">Diferença</option>
            <option value="leader">Percentual do líder</option>
          </select>
        </label>
        <button
          className="sort-direction"
          onClick={() => setDescending(!descending)}
          aria-label="Inverter ordem"
        >
          {descending ? 'Decrescente' : 'Crescente'}
        </button>
      </div>
      {!snapshot ? (
        <p role="status">Aguardando resultados estaduais oficiais.</p>
      ) : (
        <table className="state-table">
          <caption className="sr-only">
            Resultados presidenciais por UF. Selecione o estado para detalhar.
          </caption>
          <thead>
            <tr>
              {[
                'UF',
                'Estado',
                'Líder',
                '% líder',
                '2º colocado',
                '% 2º',
                'Diferença',
                'Totalizado',
                'Votos válidos',
              ].map((t) => (
                <th key={t} scope="col">
                  {t}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {states.map((s) => (
              <tr key={s.uf}>
                <td className="state-uf">
                  <button onClick={() => onSelect(s.uf)} aria-label={`Detalhar ${s.name}`}>
                    {s.uf.toUpperCase()}
                  </button>
                </td>
                <th scope="row" className="state-name">
                  {s.name}
                  <small>
                    {time(s.updatedAt)}
                    {s.stale ? ' · Último dado válido' : ''}
                  </small>
                </th>
                <td data-label="Líder">
                  {s.leader ? (
                    <>
                      <i style={{ background: s.leader.color }} />
                      {s.leader.name}
                      <strong className="state-inline-value">
                        {percent(s.leader.percentage)}%
                      </strong>
                    </>
                  ) : s.outcome === 'tie' ? (
                    'Empate'
                  ) : s.outcome === 'waiting' ? (
                    'Aguardando votos'
                  ) : (
                    'Sem dados'
                  )}
                </td>
                <td data-label="% líder">
                  {percent(s.leader?.percentage)}
                  {s.leader ? '%' : ''}
                </td>
                <td data-label="2º colocado">
                  {s.runnerUp?.name ?? '—'}
                  {s.runnerUp && (
                    <strong className="state-inline-value">
                      {percent(s.runnerUp.percentage)}%
                    </strong>
                  )}
                </td>
                <td data-label="% 2º">
                  {percent(s.runnerUp?.percentage)}
                  {s.runnerUp ? '%' : ''}
                </td>
                <td data-label="Diferença">
                  {percent(s.marginPercentagePoints)}
                  {s.marginPercentagePoints != null ? ' p.p.' : ''}
                </td>
                <td data-label="Totalizado">
                  {percent(s.countedPercentage)}
                  {s.countedPercentage != null ? '%' : ''}
                </td>
                <td data-label="Votos válidos">{number(s.validVotes)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <p className="method-note">
        Liderança atual por votos computados, sem projeção. Os arquivos estaduais têm horários
        próprios; empate permanece neutro.
      </p>
    </section>
  );
});
