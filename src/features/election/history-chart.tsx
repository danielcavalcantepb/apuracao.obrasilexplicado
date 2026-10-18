'use client';
import { memo, useEffect, useRef, useState } from 'react';
import type { HistoryObservation } from '@/lib/tse/history';
import { time, percent } from '@/lib/format';
type HistoryData = { observations: HistoryObservation[]; durable: boolean; storage: string };
export const HistoryChart = memo(function HistoryChart() {
  const [data, setData] = useState<HistoryData | null>(null);
  const [failed, setFailed] = useState(false);
  const etag = useRef<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    const controller = new AbortController();
    const poll = async () => {
      if (!document.hidden)
        try {
          const r = await fetch('/api/election/president/history', {
            headers: etag.current ? { 'If-None-Match': etag.current } : {},
            signal: AbortSignal.any([controller.signal, AbortSignal.timeout(10000)]),
          });
          if (!r.ok && r.status !== 304) throw new Error();
          if (r.status !== 304) {
            const next = await r.json();
            if (!cancelled) {
              setData(next);
              etag.current = r.headers.get('etag');
            }
          }
          if (!cancelled) setFailed(false);
        } catch {
          if (!cancelled) setFailed(true);
        }
      if (!cancelled) timer = setTimeout(poll, 15000);
    };
    void poll();
    return () => {
      cancelled = true;
      controller.abort();
      clearTimeout(timer);
    };
  }, []);
  const observations = data?.observations ?? [];
  const leaders = observations.at(-1)?.candidates.slice(0, 2) ?? [];
  const [inspected, setInspected] = useState<number | null>(null);
  const current =
    observations[Math.min(inspected ?? observations.length - 1, observations.length - 1)];
  const min = observations[0] ? Date.parse(observations[0].updatedAt) : 0;
  const max = observations.at(-1) ? Date.parse(observations.at(-1)!.updatedAt) : 1;
  const x = (o: HistoryObservation) =>
    120 + ((Date.parse(o.updatedAt) - min) / Math.max(1, max - min)) * 740;
  const values = observations.flatMap((o) =>
    o.candidates.filter((c) => leaders.some((l) => l.id === c.id)).map((c) => c.percentage),
  );
  const low = Math.max(0, Math.floor(Math.min(50, ...values)) - 2);
  const high = Math.min(100, Math.ceil(Math.max(50, ...values)) + 2);
  const ticks = Array.from({ length: 5 }, (_, i) => low + ((high - low) * i) / 4);
  const y = (p: number) => 225 - ((p - low) / Math.max(1, high - low)) * 200;
  return (
    <section className="history-section editorial-section" aria-labelledby="history-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">OBSERVAÇÕES REAIS · BRASIL</p>
          <h2 id="history-title">Evolução da apuração</h2>
        </div>
        <p>{observations.length} observações registradas</p>
      </div>
      <p className="history-note">
        Percentual dos votos válidos em cada atualização observada. O registro começa quando o
        painel recebe dados; não reconstrói o passado nem faz previsões.
      </p>
      {failed && (
        <p role="status">
          Histórico temporariamente indisponível. Últimas observações preservadas.
        </p>
      )}
      {observations.length < 2 ? (
        <div className="history-empty">
          {observations.length === 1
            ? `Primeira observação real registrada às ${time(observations[0].updatedAt)}. O gráfico será exibido após uma nova atualização eleitoral.`
            : 'Aguardando observações oficiais com votos válidos consistentes.'}
        </div>
      ) : (
        <>
          <div className="chart-legend">
            {leaders.map((c) => (
              <span key={c.id}>
                <i style={{ background: c.color }} />
                {c.name}
              </span>
            ))}
          </div>
          <svg
            className="history-svg"
            viewBox="0 0 900 270"
            role="img"
            aria-label="Evolução observada dos percentuais dos votos válidos. Dados acessíveis na tabela abaixo."
          >
            <title>Evolução da apuração nacional</title>
            {ticks.map((p) => (
              <g key={p}>
                <line
                  x1={120}
                  x2={860}
                  y1={y(p)}
                  y2={y(p)}
                  className={p === 50 ? 'chart-majority' : 'chart-grid'}
                />
                <text x={108} y={y(p) + 4} textAnchor="end">
                  {percent(p)}%
                </text>
              </g>
            ))}
            <line x1={120} x2={860} y1={y(50)} y2={y(50)} className="chart-majority" />
            {leaders.map((c) => (
              <path
                key={c.id}
                fill="none"
                stroke={c.color}
                strokeWidth={3}
                vectorEffect="non-scaling-stroke"
                d={observations
                  .map((o, index) => {
                    const candidate = o.candidates.find((n) => n.id === c.id);
                    return candidate
                      ? `${index ? 'L' : 'M'}${x(o)},${y(candidate.percentage)}`
                      : '';
                  })
                  .join(' ')}
              />
            ))}
            <text x={120} y={254}>
              {time(observations[0].updatedAt)}
            </text>
            <text x={860} y={254} textAnchor="end">
              {time(observations.at(-1)?.updatedAt)}
            </text>
          </svg>
          <p className="method-note">
            Escala vertical ampliada: {percent(low)}% a {percent(high)}%. Linha tracejada em 50%;
            variações observadas, sem projeção.
          </p>
          <label className="observation-picker">
            Consultar observação
            <select
              aria-label="Observação do histórico"
              value={inspected ?? observations.length - 1}
              onChange={(e) => setInspected(Number(e.target.value))}
            >
              {observations.map((o, i) => (
                <option key={o.version} value={i}>
                  {time(o.updatedAt)} · {percent(o.countedPercentage)}% totalizado
                </option>
              ))}
            </select>
          </label>
          {current && (
            <div className="observation-detail">
              <b>
                {time(current.updatedAt)} · {percent(current.countedPercentage)}% das seções
              </b>
              {leaders.map((c) => (
                <span key={c.id}>
                  {c.name}:{' '}
                  <strong>
                    {percent(current.candidates.find((n) => n.id === c.id)?.percentage)}%
                  </strong>
                </span>
              ))}
            </div>
          )}
        </>
      )}
      <details className="history-data">
        <summary>Ver observações em tabela e método de registro</summary>
        <p>
          Uma observação é registrada apenas quando votos ou totalização mudam. Horário eleitoral é
          o do arquivo oficial; horário de recebimento corresponde à verificação bem-sucedida da
          aplicação.
        </p>
        <div className="history-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Horário oficial</th>
                <th>Recebido</th>
                <th>Totalizado</th>
                {leaders.map((c) => (
                  <th key={c.id}>{c.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {observations.map((o) => (
                <tr key={o.version}>
                  <td>{time(o.updatedAt)}</td>
                  <td>{time(o.retrievedAt)}</td>
                  <td>{percent(o.countedPercentage)}%</td>
                  {leaders.map((c) => (
                    <td key={c.id}>
                      {percent(o.candidates.find((n) => n.id === c.id)?.percentage)}%
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
      {data && (!data.durable || data.storage === 'temporary-instance') && (
        <p className="method-note">
          Registro disponível nesta instância. A hospedagem atual usa armazenamento temporário: o
          histórico pode recomeçar após reciclagem do servidor.
        </p>
      )}
    </section>
  );
});
