'use client';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { dateTime, number, percent, time } from '@/lib/format';
import type { ElectionMapResponse, ElectionMapSnapshot, StateMapResult } from '@/lib/tse/map-types';
import geometry from './geometry.json';
import './map.css';
const NEUTRAL = '#dce3dd';
const TIE = '#a9aca7';
type Shape = (typeof geometry.states)[number];
// Keep the DF polygon and its callout above the surrounding Goiás polygon.
const paintOrder = [...geometry.states].sort(
  (a, b) => Number(a.uf === 'df') - Number(b.uf === 'df'),
);
function stateLabel(state: StateMapResult | undefined, shape: Shape) {
  if (!state || state.outcome === 'missing') return `${shape.name}. Aguardando dados oficiais.`;
  const result =
    state.outcome === 'tie'
      ? 'Empate no momento.'
      : state.leader
        ? `${state.leader.name} tem mais votos contabilizados, com ${percent(state.leader.percentage)} por cento.`
        : 'Aguardando início da totalização.';
  return `${shape.name}. ${result} ${percent(state.countedPercentage)} por cento das seções totalizadas.${state.stale ? ' Último snapshot disponível.' : ''}`;
}
const StateShape = memo(
  function StateShape({
    shape,
    state,
    onInspect,
    onSelect,
    active,
  }: {
    shape: Shape;
    state: StateMapResult | undefined;
    onInspect: (uf: string) => void;
    onSelect: (uf: string) => void;
    active: boolean;
  }) {
    const fill = state?.leader?.color ?? (state?.outcome === 'tie' ? TIE : NEUTRAL);
    const label = shape.callout ?? shape.label;
    return (
      <g
        role="button"
        tabIndex={0}
        aria-label={stateLabel(state, shape)}
        aria-pressed={active}
        className={`map-state ${active ? 'is-active' : ''}`}
        data-uf={shape.uf}
        data-leader={state?.leader?.id ?? ''}
        onPointerEnter={() => onInspect(shape.uf)}
        onFocus={() => onInspect(shape.uf)}
        onClick={() => onSelect(shape.uf)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onSelect(shape.uf);
          }
        }}
      >
        <title>{stateLabel(state, shape)}</title>
        <path d={shape.path} fill={fill} fillRule="evenodd" vectorEffect="non-scaling-stroke" />
        {shape.callout && (
          <>
            <line
              x1={shape.label[0]}
              y1={shape.label[1]}
              x2={label[0]}
              y2={label[1]}
              className="map-callout-line"
            />
            <rect
              x={label[0] - 25}
              y={label[1] - 15}
              width={50}
              height={30}
              rx={5}
              className="map-callout"
              fill={fill}
            />
          </>
        )}
        <text
          x={label[0]}
          y={label[1] + 5}
          textAnchor="middle"
          className={shape.callout ? 'map-abbreviation external' : 'map-abbreviation'}
        >
          {shape.uf.toUpperCase()}
        </text>
      </g>
    );
  },
  (a, b) =>
    a.shape === b.shape &&
    a.active === b.active &&
    a.onInspect === b.onInspect &&
    a.onSelect === b.onSelect &&
    JSON.stringify(a.state) === JSON.stringify(b.state),
);
function StateDetails({
  state,
  onOpen,
}: {
  state: StateMapResult | undefined;
  onOpen: (uf: string) => void;
}) {
  if (!state)
    return (
      <div className="map-detail map-detail-empty">
        <h3>Explore o Brasil, estado por estado.</h3>
        <p>Passe o cursor, use o teclado ou toque em uma UF para consultar os números oficiais.</p>
      </div>
    );
  const candidates =
    state.outcome === 'tie' ? state.tied : [state.leader, state.runnerUp].filter((c) => c !== null);
  return (
    <div className="map-detail" aria-live="polite" aria-atomic="true">
      <div className="map-detail-heading">
        <h3>{state.name}</h3>
        <span>{state.uf.toUpperCase()}</span>
      </div>
      <p className="map-detail-progress">
        {state.countedPercentage === null
          ? 'Seções ainda não informadas'
          : `${percent(state.countedPercentage)}% das seções totalizadas`}
      </p>
      {state.outcome === 'missing' ? (
        <p className="map-detail-status">Aguardando dados oficiais</p>
      ) : state.outcome === 'waiting' ? (
        <p className="map-detail-status">Aguardando início da totalização</p>
      ) : (
        <>
          <p className="map-detail-status">
            {state.outcome === 'tie'
              ? 'Empate no momento'
              : state.status === 'finished'
                ? 'Maior número de votos contabilizados'
                : 'Lidera neste momento'}
          </p>
          <ol>
            {candidates.map((c) => (
              <li key={c.id}>
                <span className="candidate-swatch" style={{ background: c.color }} />
                <div>
                  <b>{c.name}</b>
                  <small>
                    Nº {c.number} · {number(c.votes)} votos
                  </small>
                </div>
                <strong>{percent(c.percentage)}%</strong>
              </li>
            ))}
          </ol>
          {state.marginVotes !== null && (
            <dl className="map-margin">
              <div>
                <dt>Diferença em votos</dt>
                <dd>{number(state.marginVotes)}</dd>
              </div>
              <div>
                <dt>Diferença percentual</dt>
                <dd>{percent(state.marginPercentagePoints)} p.p.</dd>
              </div>
            </dl>
          )}
        </>
      )}
      {state.stale && (
        <p className="map-state-warning">
          {state.issue ?? 'Dados sem atualização recente.'} Exibindo o último snapshot disponível.
        </p>
      )}
      <p className="map-detail-time">
        Atualizado às {time(state.updatedAt)}
        <span>{dateTime(state.updatedAt)}</span>
      </p>
      <button className="map-open-result" onClick={() => onOpen(state.uf)}>
        Ver resultado estadual
      </button>
    </div>
  );
}
function RegionalResults({ snapshot }: { snapshot: ElectionMapSnapshot | null }) {
  return (
    <section className="regional-results" aria-labelledby="regions-title">
      <div className="regional-heading">
        <h3 id="regions-title">Resultado por região</h3>
        <p>Votos válidos somados a partir das UFs</p>
      </div>
      <div className="region-grid">
        {(
          snapshot?.regions ??
          ['Norte', 'Nordeste', 'Centro-Oeste', 'Sudeste', 'Sul'].map((name) => ({
            name,
            availableStates: 0,
            totalStates: 0,
            reliable: false,
            validVotes: null,
            countedPercentage: null,
            stale: false,
            candidates: [],
            issue: null,
            electorateWeight: null,
            eligibleVoters: null,
          }))
        ).map((region) => (
          <div className="region-result" key={region.name}>
            <div className="region-title">
              <h4>{region.name}</h4>
              <span>
                {percent(region.countedPercentage)}
                {region.countedPercentage !== null ? '% totalizado' : ''}
              </span>
            </div>
            <div className="regional-bar" aria-hidden="true">
              {region.reliable && region.validVotes
                ? region.candidates.map((c) => (
                    <span
                      key={c.id}
                      style={{ background: c.color, width: `${c.percentage ?? 0}%` }}
                    />
                  ))
                : null}
            </div>
            <div className="region-electorate">
              <span title="Eleitores aptos das UFs desta região divididos pelos eleitores aptos nacionais, incluindo exterior. Não representa votos apurados.">
                Peso no eleitorado nacional
              </span>
              <b>
                {percent(region.electorateWeight)}
                {region.electorateWeight != null ? '%' : ''}
              </b>
              <small>{number(region.eligibleVoters)} eleitores aptos</small>
            </div>
            {!region.reliable ? (
              <p className="region-waiting">
                {region.issue ?? 'Aguardando dados oficiais'}
                {region.totalStates > 0 && (
                  <span>
                    {region.availableStates} de {region.totalStates} UFs disponíveis
                  </span>
                )}
              </p>
            ) : !region.validVotes ? (
              <p className="region-waiting">Aguardando votos válidos</p>
            ) : (
              <>
                <p className="region-votes">{number(region.validVotes)} votos válidos</p>
                <ol className="regional-ranking">
                  {region.candidates.slice(0, 2).map((c) => (
                    <li key={c.id}>
                      <span>{c.name}</span>
                      <b>{percent(c.percentage)}%</b>
                      <div aria-hidden="true">
                        <i style={{ width: `${c.percentage ?? 0}%`, background: c.color }} />
                      </div>
                    </li>
                  ))}
                </ol>
                <details>
                  <summary>Todos os candidatos</summary>
                  <ol>
                    {region.candidates.map((c) => (
                      <li key={c.id}>
                        <span className="candidate-swatch" style={{ background: c.color }} />
                        <span>
                          {c.name} <small>· {c.number}</small>
                        </span>
                        <b>{percent(c.percentage)}%</b>
                      </li>
                    ))}
                  </ol>
                </details>
              </>
            )}
            {region.stale && <p className="region-stale">Últimos dados disponíveis.</p>}
          </div>
        ))}
      </div>
      <p className="map-method">
        Agregação deste painel: soma dos votos válidos absolutos das UFs, dividida pelo total de
        votos válidos da região. Sem média de percentuais estaduais. O exterior não integra as cinco
        regiões. Peso eleitoral: eleitores aptos da região ÷ eleitores aptos nacionais, incluindo
        exterior. Não é percentual dos votos apurados; por isso os cinco pesos podem somar menos de
        100%.
      </p>
    </section>
  );
}
export const ElectionMap = memo(function ElectionMap({
  onSelectState,
  selectedState,
  onSnapshot,
}: {
  onSelectState: (uf: string) => void;
  selectedState: string;
  onSnapshot?: (snapshot: ElectionMapSnapshot) => void;
}) {
  const [data, setData] = useState<ElectionMapResponse | null>(null);
  const [error, setError] = useState(false);
  const [inspected, setInspected] = useState<string | null>(null);
  const [now, setNow] = useState<number | null>(null);
  const etag = useRef<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    const controller = new AbortController();
    const poll = async () => {
      let delay = 3000;
      if (document.hidden) {
        timer = setTimeout(poll, 10000);
        return;
      }
      try {
        const response = await fetch('/api/election/president/map', {
          headers: etag.current ? { 'If-None-Match': etag.current } : {},
          signal: AbortSignal.any([controller.signal, AbortSignal.timeout(30000)]),
        });
        if (!response.ok && response.status !== 304) throw new Error('Map unavailable');
        delay = Math.max(3000, Number(response.headers.get('X-Poll-After')) || 3000);
        if (response.status !== 304) {
          const next: ElectionMapResponse = await response.json();
          if (!cancelled) {
            setData(next);
            onSnapshot?.(next.snapshot);
            etag.current = response.headers.get('etag');
          }
        }
        if (!cancelled) setError(false);
      } catch {
        if (!cancelled) setError(true);
        delay = 15000;
      }
      if (!cancelled) timer = setTimeout(poll, delay);
    };
    void poll();
    return () => {
      cancelled = true;
      controller.abort();
      clearTimeout(timer);
    };
  }, [onSnapshot]);
  useEffect(() => {
    const update = () => setNow(Date.now());
    update();
    const id = setInterval(update, 15000);
    return () => clearInterval(id);
  }, []);
  const inspect = useCallback((uf: string) => setInspected(uf), []);
  const select = useCallback(
    (uf: string) => {
      setInspected(uf);
      onSelectState(uf);
    },
    [onSelectState],
  );
  const open = useCallback(
    (uf: string) => {
      onSelectState(uf);
      requestAnimationFrame(() =>
        document.getElementById('resultados')?.scrollIntoView({
          behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
            ? 'instant'
            : 'smooth',
        }),
      );
    },
    [onSelectState],
  );
  const snapshot = data?.snapshot ?? null;
  const outOfDate =
    !!snapshot &&
    snapshot.status === 'counting' &&
    !!snapshot.oldestUpdatedAt &&
    now !== null &&
    now - Date.parse(snapshot.oldestUpdatedAt) > (data?.staleAfterMs ?? 120000);
  const stale = error || !!snapshot?.stale || outOfDate;
  const status = stale
    ? 'ATUALIZAÇÃO INDISPONÍVEL'
    : snapshot?.status === 'counting'
      ? 'AO VIVO'
      : snapshot?.status === 'finished'
        ? 'TOTALIZAÇÃO CONCLUÍDA'
        : 'AGUARDANDO TOTALIZAÇÃO';
  const current = snapshot?.states.find((s) => s.uf === (inspected ?? selectedState));
  return (
    <section className="election-map" aria-labelledby="map-title" aria-busy={!data && !error}>
      <div className="map-section-heading">
        <div>
          <p className="eyebrow">O BRASIL, ESTADO POR ESTADO</p>
          <h2 id="map-title">Mapa da apuração</h2>
          <p>Quem lidera em cada estado neste momento</p>
        </div>
        <div className="map-updates">
          <span className={`map-status ${status === 'AO VIVO' ? 'is-live' : ''}`}>
            <i />
            {status}
          </span>
          <span>
            Atualizado às <b>{time(snapshot?.updatedAt)}</b>
          </span>
        </div>
      </div>
      {stale && (
        <p className="map-notice" role="status">
          {snapshot?.issue ?? 'A atualização do mapa está temporariamente indisponível.'}{' '}
          {snapshot
            ? 'Exibindo os últimos snapshots recebidos.'
            : 'Tentaremos novamente automaticamente.'}
        </p>
      )}
      {!data && !error && (
        <p className="map-loading" role="status">
          Consultando os resultados oficiais das 27 UFs…
        </p>
      )}
      <div className="map-composition">
        <div className="map-territory">
          <svg
            className="brazil-map"
            viewBox={geometry.viewBox}
            role="group"
            aria-label="Mapa interativo das 27 unidades da Federação"
            preserveAspectRatio="xMidYMid meet"
          >
            <desc>
              Use Tab para navegar entre as UFs e Enter para selecionar o resultado estadual. As
              cores identificam quem tem mais votos contabilizados.
            </desc>
            {paintOrder.map((shape) => (
              <StateShape
                key={shape.uf}
                shape={shape}
                state={snapshot?.states.find((s) => s.uf === shape.uf)}
                onInspect={inspect}
                onSelect={select}
                active={shape.uf === (inspected ?? selectedState)}
              />
            ))}
          </svg>
          <div className="map-small-states" aria-label="Acesso às UFs de menor área no mapa">
            {geometry.states
              .filter((shape) => shape.callout)
              .map((shape) => (
                <button
                  key={shape.uf}
                  onClick={() => select(shape.uf)}
                  aria-label={`Consultar ${shape.name} no mapa`}
                >
                  {shape.uf.toUpperCase()}
                </button>
              ))}
          </div>
          <p className="map-cartography">
            Malha geográfica:{' '}
            <a
              href="https://servicodados.ibge.gov.br/api/docs/malhas?versao=3"
              target="_blank"
              rel="noreferrer"
            >
              IBGE
            </a>{' '}
            · Selecione uma UF para consultar o resultado.
          </p>
        </div>
        <aside className="map-sidebar" aria-label="Legenda e informações estaduais">
          <div className="map-legend">
            <div className="map-legend-title">
              <h3>Mais votos em cada UF</h3>
              <span>27 unidades</span>
            </div>
            <ol>
              {snapshot?.legend.map((c) => (
                <li key={c.id}>
                  <span className="candidate-swatch" style={{ background: c.color }} />
                  <div>
                    <b>{c.name}</b>
                    <small>Nº {c.number}</small>
                  </div>
                  <strong>
                    {c.stateCount}
                    <span> {c.stateCount === 1 ? 'UF' : 'UFs'}</span>
                  </strong>
                </li>
              ))}
            </ol>
            <dl className="map-neutral-legend">
              <div>
                <dt>
                  <span className="candidate-swatch" style={{ background: NEUTRAL }} />
                  Aguardando totalização / dados
                </dt>
                <dd>{snapshot ? snapshot.waitingStates + snapshot.missingStates : 27} UFs</dd>
              </div>
              <div>
                <dt>
                  <span className="candidate-swatch" style={{ background: TIE }} />
                  Empate no momento
                </dt>
                <dd>{snapshot?.tiedStates ?? 0} UFs</dd>
              </div>
            </dl>
          </div>
          <label className="map-uf-select">
            Consultar UF
            <select
              aria-label="UF no mapa"
              value={inspected ?? selectedState}
              onChange={(event) => select(event.target.value)}
            >
              <option value="">Selecione uma UF</option>
              {geometry.states.map((s) => (
                <option key={s.uf} value={s.uf}>
                  {s.name} ({s.uf.toUpperCase()})
                </option>
              ))}
            </select>
          </label>
          <StateDetails state={current} onOpen={open} />
        </aside>
      </div>
      <p className="map-explanation">
        As cores representam o candidato com mais votos contabilizados em cada estado neste momento.
        Essa indicação não é projeção de vitória. Em empate ou sem votos, o preenchimento é neutro.
      </p>
      {snapshot?.oldestUpdatedAt && (
        <p className="map-timestamps">
          Arquivos estaduais: {dateTime(snapshot.oldestUpdatedAt)} a {dateTime(snapshot.updatedAt)}.
          Nacional: {dateTime(snapshot.nationalUpdatedAt)}. Cada UF conserva seu próprio horário
          oficial.
        </p>
      )}
      <RegionalResults snapshot={snapshot} />
    </section>
  );
});
