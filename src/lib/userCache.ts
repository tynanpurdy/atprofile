export interface CacheEntry {
  data: any;
  timestamp: number;
}

export interface UserCache {
  get(key: string): CacheEntry | undefined;
  set(key: string, value: CacheEntry): void;
  delete(key: string): void;
  clear(): void;
  clean(): void;
}

export class PersistentUserCache implements UserCache {
  private cache: Map<string, CacheEntry>;
  private readonly CACHE_KEY = "bsky_user_cache";
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 1 day

  constructor() {
    this.cache = new Map();
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const stored = localStorage.getItem(this.CACHE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.cache = new Map(Object.entries(parsed));
      }
    } catch (error) {
      console.warn("Failed to load cache from storage:", error);
    }
  }

  private saveToStorage() {
    try {
      const obj = Object.fromEntries(this.cache);
      localStorage.setItem(this.CACHE_KEY, JSON.stringify(obj));
    } catch (error) {
      console.warn("Failed to save cache to storage:", error);
    }
  }

  get(key: string): CacheEntry | undefined {
    return this.cache.get(key);
  }

  set(key: string, value: CacheEntry) {
    this.cache.set(key, value);
    this.saveToStorage();
  }

  delete(key: string) {
    this.cache.delete(key);
    this.saveToStorage();
  }

  clear() {
    this.cache.clear();
    this.saveToStorage();
  }

  clean() {
    const now = Date.now();
    let hasChanges = false;

    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.CACHE_DURATION) {
        this.cache.delete(key);
        hasChanges = true;
      }
    }

    if (hasChanges) {
      this.saveToStorage();
    }
  }
}
