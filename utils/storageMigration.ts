/**
 * One-time localStorage key migration (rahnam-* → rava-*).
 * Reads the old key, writes the new key, then removes the old key.
 */
export function migrateLocalStorageKey(oldKey: string, newKey: string): void {
  try {
    if (typeof localStorage === 'undefined') return;

    const existingNew = localStorage.getItem(newKey);
    if (existingNew !== null) {
      localStorage.removeItem(oldKey);
      return;
    }

    const oldValue = localStorage.getItem(oldKey);
    if (oldValue !== null) {
      localStorage.setItem(newKey, oldValue);
      localStorage.removeItem(oldKey);
    }
  } catch {
    // Storage may be unavailable (private mode / quota); ignore.
  }
}
