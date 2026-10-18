'use client';
import { useEffect, useRef, useState } from 'react';
import type { ElectionResponse } from '@/lib/tse/types';
export const unavailable: ElectionResponse = {
  status: 'unavailable',
  snapshot: null,
  stale: false,
  issue: null,
  checkedAt: null,
  nextPollMs: 3000,
};
/** One polling stream per active scope. Preserve only that scope's last valid result. */
export function useElection(query: string | null, initial = unavailable) {
  const [data, setData] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [networkError, setNetworkError] = useState(false);
  const [telemetry, setTelemetry] = useState({
    checkedAt: initial.checkedAt,
    attemptedAt: initial.attemptedAt ?? null,
  });
  const cache = useRef(new Map<string, ElectionResponse>([['scope=br', initial]]));
  const etags = useRef(new Map<string, string>());
  useEffect(() => {
    if (!query) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    const controller = new AbortController();
    setData(cache.current.get(query) ?? unavailable);
    setLoading(!cache.current.get(query)?.snapshot);
    setNetworkError(false);
    setTelemetry({
      checkedAt: cache.current.get(query)?.checkedAt ?? null,
      attemptedAt: cache.current.get(query)?.attemptedAt ?? null,
    });
    const poll = async () => {
      if (document.hidden) {
        timer = setTimeout(poll, 10000);
        return;
      }
      let delay = 3000;
      try {
        const etag = etags.current.get(query);
        const r = await fetch(`/api/election/president?${query}`, {
          headers: etag ? { 'If-None-Match': etag } : {},
          signal: AbortSignal.any([controller.signal, AbortSignal.timeout(30000)]),
        });
        if (!r.ok && r.status !== 304) throw new Error('Unavailable');
        delay = Math.max(3000, Number(r.headers.get('X-Poll-After')) || 3000);
        if (r.status !== 304) {
          const next: ElectionResponse = await r.json();
          if (!cancelled) {
            const previous = cache.current.get(query);
            const retained =
              !next.snapshot && previous?.snapshot
                ? {
                    ...next,
                    snapshot: previous.snapshot,
                    analysis: previous.analysis,
                    stale: true,
                    issue: next.issue ?? 'Último dado válido preservado.',
                  }
                : next;
            cache.current.set(query, retained);
            setData(retained);
            const tag = r.headers.get('etag');
            if (tag) etags.current.set(query, tag);
            setTelemetry({ checkedAt: next.checkedAt, attemptedAt: next.attemptedAt ?? null });
          }
        }
        if (!cancelled) {
          const checkedAt = r.headers.get('X-TSE-Checked-At');
          const attemptedAt = r.headers.get('X-TSE-Attempted-At');
          if (checkedAt || attemptedAt)
            setTelemetry((previous) => ({
              checkedAt: checkedAt || previous.checkedAt,
              attemptedAt: attemptedAt || previous.attemptedAt,
            }));
          setNetworkError(false);
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setNetworkError(true);
          setLoading(false);
        }
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
  }, [query]);
  return { data, loading, networkError, telemetry };
}
