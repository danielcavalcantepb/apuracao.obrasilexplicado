import { mkdir, readFile, appendFile } from 'node:fs/promises';
import path from 'node:path';
import { z } from 'zod';
import type { ElectionSnapshot } from './types';
import { validVoteAnalysis } from './analysis';
const observationSchema = z.object({
  version: z.string(),
  updatedAt: z.iso.datetime({ offset: true }),
  retrievedAt: z.iso.datetime({ offset: true }),
  countedPercentage: z.number().min(0).max(100),
  validVotes: z.number().nonnegative(),
  candidates: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      number: z.string(),
      votes: z.number().nonnegative(),
      percentage: z.number().min(0).max(100),
      color: z.string(),
    }),
  ),
});
export type HistoryObservation = z.infer<typeof observationSchema>;
export class ElectionHistory {
  private observations: HistoryObservation[] = [];
  private loading: Promise<void> | null = null;
  private queue: Promise<void> = Promise.resolve();
  private durable = true;
  constructor(private directory: string) {}
  private async load() {
    this.loading ??= this.restore();
    await this.loading;
  }
  private async restore() {
    try {
      const body = await readFile(path.join(this.directory, 'president-history.jsonl'), 'utf8');
      for (const line of body.split('\n').filter(Boolean)) {
        try {
          const parsed = observationSchema.safeParse(JSON.parse(line));
          if (parsed.success && !this.observations.some((o) => o.version === parsed.data.version))
            this.observations.push(parsed.data);
          if (!parsed.success) this.durable = false;
        } catch {
          this.durable = false;
        }
      }
      this.observations.sort((a, b) => Date.parse(a.updatedAt) - Date.parse(b.updatedAt));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') this.durable = false;
    }
  }
  record(snapshot: ElectionSnapshot, retrievedAt: string | null) {
    const operation = this.queue.then(async () => {
      await this.load();
      if (snapshot.scope.type !== 'country' || snapshot.scope.code !== 'br' || !retrievedAt) return;
      const analysis = validVoteAnalysis(snapshot);
      if (!analysis) return;
      const updatedAt = snapshot.progress.totaledAt ?? snapshot.progress.generatedAt;
      if (this.observations.some((o) => o.version === snapshot.version)) return;
      const last = this.observations.at(-1);
      if (last && Date.parse(updatedAt) < Date.parse(last.updatedAt)) return;
      // A generation or retrieval clock alone does not create an electoral observation.
      if (
        last &&
        JSON.stringify([
          last.countedPercentage,
          last.validVotes,
          last.candidates.map((c) => [c.id, c.votes]),
        ]) ===
          JSON.stringify([
            snapshot.progress.percentageCounted,
            analysis.validVotes,
            analysis.candidates.map((c) => [c.id, c.votes]),
          ])
      )
        return;
      const observation = observationSchema.parse({
        version: snapshot.version,
        updatedAt,
        retrievedAt,
        countedPercentage: snapshot.progress.percentageCounted,
        ...analysis,
      });
      this.observations.push(observation);
      try {
        await mkdir(this.directory, { recursive: true });
        await appendFile(
          path.join(this.directory, 'president-history.jsonl'),
          JSON.stringify(observation) + '\n',
        );
      } catch {
        this.durable = false;
        console.warn('[TSE] history persistence unavailable; observations retained in memory');
      }
    });
    this.queue = operation.catch(() => {
      this.durable = false;
    });
    return this.queue;
  }
  async read() {
    await this.queue;
    await this.load();
    return {
      observations: [...this.observations],
      durable: this.durable,
      storage: process.env.VERCEL ? 'temporary-instance' : 'persistent-file',
    };
  }
}
const runtime = globalThis as typeof globalThis & { tseHistory?: ElectionHistory };
export const history = (runtime.tseHistory ??= new ElectionHistory(
  path.resolve(/* turbopackIgnore: true */ process.env.TSE_CACHE_DIR || '.cache/tse'),
));
