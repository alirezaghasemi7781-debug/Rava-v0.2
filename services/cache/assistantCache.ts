/**
 * Session + IndexedDB assistant cache with TTL and version invalidation.
 */
import { dbService } from '../dbService';

const MEMORY = new Map<string, { value: unknown; expiresAt: number; version: number }>();

export const ASSISTANT_CACHE_VERSION = 1;
const PREFIX = `assistant_v${ASSISTANT_CACHE_VERSION}_`;

export type CacheNamespace =
  | 'city_info'
  | 'curated_pois'
  | 'categories'
  | 'city_prompts'
  | 'recent_searches'
  | 'city_pack';

function fullKey(ns: CacheNamespace, key: string): string {
  return `${PREFIX}${ns}:${key}`;
}

export interface CacheGetOptions {
  /** Prefer memory only (skip IDB). */
  memoryOnly?: boolean;
}

export const assistantCache = {
  version: ASSISTANT_CACHE_VERSION,

  async get<T = unknown>(
    ns: CacheNamespace,
    key: string,
    opts?: CacheGetOptions,
  ): Promise<T | null> {
    const fk = fullKey(ns, key);
    const mem = MEMORY.get(fk);
    if (mem && mem.expiresAt > Date.now() && mem.version === ASSISTANT_CACHE_VERSION) {
      return mem.value as T;
    }
    if (mem) MEMORY.delete(fk);
    if (opts?.memoryOnly) return null;

    try {
      const row = await dbService.get(fk);
      if (!row || row.version !== ASSISTANT_CACHE_VERSION) return null;
      if (row.expiresAt && row.expiresAt < Date.now()) {
        await dbService.set(fk, null);
        return null;
      }
      MEMORY.set(fk, {
        value: row.value,
        expiresAt: row.expiresAt,
        version: row.version,
      });
      return row.value as T;
    } catch {
      return null;
    }
  },

  async set(
    ns: CacheNamespace,
    key: string,
    value: unknown,
    ttlMs: number,
  ): Promise<void> {
    const fk = fullKey(ns, key);
    const expiresAt = Date.now() + ttlMs;
    MEMORY.set(fk, { value, expiresAt, version: ASSISTANT_CACHE_VERSION });
    try {
      await dbService.set(fk, {
        value,
        expiresAt,
        version: ASSISTANT_CACHE_VERSION,
        updatedAt: Date.now(),
      });
    } catch {
      /* memory still holds it */
    }
  },

  async invalidate(ns?: CacheNamespace, key?: string): Promise<void> {
    if (ns && key) {
      const fk = fullKey(ns, key);
      MEMORY.delete(fk);
      try {
        await dbService.set(fk, null);
      } catch {
        /* noop */
      }
      return;
    }

    if (ns) {
      const prefix = `${PREFIX}${ns}:`;
      for (const k of [...MEMORY.keys()]) {
        if (k.startsWith(prefix)) MEMORY.delete(k);
      }
      // IDB: no key enumeration helper — bump version on next global invalidate
      return;
    }

    MEMORY.clear();
  },

  /** Hard reset all assistant cache keys by bumping conceptually (clears memory). */
  async invalidateAll(): Promise<void> {
    MEMORY.clear();
  },

  async getOrFetch<T>(
    ns: CacheNamespace,
    key: string,
    ttlMs: number,
    fetcher: () => Promise<T>,
  ): Promise<T> {
    const cached = await this.get<T>(ns, key);
    if (cached !== null && cached !== undefined) return cached;
    const value = await fetcher();
    await this.set(ns, key, value, ttlMs);
    return value;
  },
};

/** Common TTLs */
export const CACHE_TTL = {
  cityInfo: 12 * 60 * 60 * 1000,
  curatedPois: 6 * 60 * 60 * 1000,
  categories: 24 * 60 * 60 * 1000,
  cityPrompts: 24 * 60 * 60 * 1000,
  recentSearches: 7 * 24 * 60 * 60 * 1000,
  cityPack: 12 * 60 * 60 * 1000,
};
