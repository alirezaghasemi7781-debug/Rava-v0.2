/**
 * IndexedDB Wrapper v2.1 - Atomic Outbox Pattern
 * DB renamed rahnam_resilience_v3 → rava_resilience_v3 with one-time migration.
 */
class IndexedDBService {
  private dbName = 'rava_resilience_v3';
  private oldDbName = 'rahnam_resilience_v3';
  private version = 3;
  private stores = {
    places: 'places',
    outbox: 'outbox'
  };
  private migrationPromise: Promise<void> | null = null;

  private openDb(name: string): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(name, this.version);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(this.stores.places)) {
          db.createObjectStore(this.stores.places);
        }
        if (!db.objectStoreNames.contains(this.stores.outbox)) {
          db.createObjectStore(this.stores.outbox, { keyPath: 'id' });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  private async ensureMigrated(): Promise<void> {
    if (!this.migrationPromise) {
      this.migrationPromise = this.migrateFromLegacyDb();
    }
    await this.migrationPromise;
  }

  private async legacyDbExists(): Promise<boolean> {
    if (typeof indexedDB.databases === 'function') {
      const dbs = await indexedDB.databases();
      return dbs.some((d) => d.name === this.oldDbName);
    }

    // Fallback when databases() is unavailable: open and detect fresh creation.
    return new Promise((resolve) => {
      let created = false;
      const req = indexedDB.open(this.oldDbName, this.version);
      req.onupgradeneeded = () => {
        created = true;
        const db = req.result;
        if (!db.objectStoreNames.contains(this.stores.places)) {
          db.createObjectStore(this.stores.places);
        }
        if (!db.objectStoreNames.contains(this.stores.outbox)) {
          db.createObjectStore(this.stores.outbox, { keyPath: 'id' });
        }
      };
      req.onsuccess = () => {
        const db = req.result;
        db.close();
        if (created) {
          indexedDB.deleteDatabase(this.oldDbName);
          resolve(false);
          return;
        }
        resolve(true);
      };
      req.onerror = () => resolve(false);
    });
  }

  private async migrateFromLegacyDb(): Promise<void> {
    try {
      const legacyExists = await this.legacyDbExists();
      if (!legacyExists) return;

      const oldDb = await this.openDb(this.oldDbName);
      const newDb = await this.openDb(this.dbName);

      const copyStore = async (storeName: string, useKeyPath: boolean) => {
        if (!oldDb.objectStoreNames.contains(storeName)) return;
        if (!newDb.objectStoreNames.contains(storeName)) return;

        const items: { key?: IDBValidKey; value: unknown }[] = await new Promise((resolve) => {
          const tx = oldDb.transaction(storeName, 'readonly');
          const store = tx.objectStore(storeName);
          if (useKeyPath) {
            const req = store.getAll();
            req.onsuccess = () => resolve((req.result || []).map((value) => ({ value })));
            req.onerror = () => resolve([]);
          } else {
            const req = store.openCursor();
            const rows: { key: IDBValidKey; value: unknown }[] = [];
            req.onsuccess = () => {
              const cursor = req.result;
              if (cursor) {
                rows.push({ key: cursor.key, value: cursor.value });
                cursor.continue();
              } else {
                resolve(rows);
              }
            };
            req.onerror = () => resolve([]);
          }
        });

        if (items.length === 0) return;

        await new Promise<void>((resolve) => {
          const tx = newDb.transaction(storeName, 'readwrite');
          const store = tx.objectStore(storeName);
          for (const item of items) {
            if (useKeyPath) {
              store.put(item.value);
            } else if (item.key !== undefined) {
              store.put(item.value, item.key);
            }
          }
          tx.oncomplete = () => resolve();
          tx.onerror = () => resolve();
        });
      };

      await copyStore(this.stores.places, false);
      await copyStore(this.stores.outbox, true);

      oldDb.close();
      newDb.close();

      await new Promise<void>((resolve) => {
        const del = indexedDB.deleteDatabase(this.oldDbName);
        del.onsuccess = () => resolve();
        del.onerror = () => resolve();
        del.onblocked = () => resolve();
      });
    } catch {
      // Migration is best-effort; app continues with the new DB name.
    }
  }

  private async getDB(): Promise<IDBDatabase> {
    await this.ensureMigrated();
    return this.openDb(this.dbName);
  }

  async set(key: string, value: any): Promise<void> {
    const db = await this.getDB();
    const tx = db.transaction(this.stores.places, 'readwrite');
    tx.objectStore(this.stores.places).put(value, key);
  }

  async get(key: string): Promise<any> {
    const db = await this.getDB();
    return new Promise((resolve) => {
      const tx = db.transaction(this.stores.places, 'readonly');
      const request = tx.objectStore(this.stores.places).get(key);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
    });
  }

  // مدیریت صف آفلاین اتمیک
  async pushToOutbox(action: { type: string; payload: any }): Promise<void> {
    const db = await this.getDB();
    const tx = db.transaction(this.stores.outbox, 'readwrite');
    const item = {
      id: crypto.randomUUID(),
      ...action,
      timestamp: Date.now()
    };
    tx.objectStore(this.stores.outbox).add(item);
  }

  async getAllOutboxItems(): Promise<any[]> {
    const db = await this.getDB();
    return new Promise((resolve) => {
      const tx = db.transaction(this.stores.outbox, 'readonly');
      const request = tx.objectStore(this.stores.outbox).getAll();
      request.onsuccess = () => {
        // مرتب‌سازی بر اساس زمان برای حفظ ترتیب وقایع سفر
        const items = request.result.sort((a, b) => a.timestamp - b.timestamp);
        resolve(items);
      };
    });
  }

  async removeFromOutbox(id: string): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve) => {
      const tx = db.transaction(this.stores.outbox, 'readwrite');
      const request = tx.objectStore(this.stores.outbox).delete(id);
      request.onsuccess = () => resolve();
    });
  }
}

export const dbService = new IndexedDBService();
