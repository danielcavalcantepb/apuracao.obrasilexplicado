import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
export type CacheEntry = {
  body: string;
  etag: string | null;
  modified: string | null;
  checkedAt: number;
};
export interface SnapshotCache {
  get(key: string): Promise<CacheEntry | undefined>;
  set(key: string, value: CacheEntry): Promise<void>;
}
export class MemoryCache implements SnapshotCache {
  private entries = new Map<string, CacheEntry>();
  async get(key: string) {
    return this.entries.get(key);
  }
  async set(key: string, value: CacheEntry) {
    this.entries.set(key, value);
  }
}
/** Durable last-valid raw responses; revalidated through the adapter after restart. */
export class FileBackedCache extends MemoryCache {
  constructor(private root: string) {
    super();
  }
  private file(key: string) {
    return path.join(this.root, createHash('sha256').update(key).digest('hex') + '.json');
  }
  async get(key: string) {
    const memory = await super.get(key);
    if (memory) return memory;
    try {
      const value: unknown = JSON.parse(await readFile(this.file(key), 'utf8'));
      if (
        !value ||
        typeof value !== 'object' ||
        !('body' in value) ||
        typeof value.body !== 'string' ||
        !('checkedAt' in value) ||
        typeof value.checkedAt !== 'number'
      )
        return undefined;
      const entry = value as CacheEntry;
      await super.set(key, entry);
      return entry;
    } catch {
      return undefined;
    }
  }
  async set(key: string, value: CacheEntry) {
    await super.set(key, value);
    try {
      await mkdir(this.root, { recursive: true });
      const file = this.file(key),
        temporary = `${file}.${process.pid}.tmp`;
      await writeFile(temporary, JSON.stringify(value));
      await rename(temporary, file);
    } catch {
      console.warn('[TSE] durable cache unavailable; memory retained');
    }
  }
}
