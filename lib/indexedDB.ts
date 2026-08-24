// lib/indexedDB.ts
// Robust, lightweight IndexedDB wrapper for NextTube offline data storage

const DB_NAME = 'NextTubeDB';
const DB_VERSION = 1;

export interface AppStateData {
  subscribedChannelIds: string[];
  likedVideoIds: string[];
  dislikedVideoIds: string[];
  watchLaterIds: string[];
  historyVideoIds: string[];
  isDarkMode?: boolean;
}

let dbInstance: IDBDatabase | null = null;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      return reject(new Error('IndexedDB is only available in browser'));
    }

    if (dbInstance) {
      return resolve(dbInstance);
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      // Object store for key-value application state
      if (!db.objectStoreNames.contains('userState')) {
        db.createObjectStore('userState', { keyPath: 'key' });
      }
    };

    request.onsuccess = (event) => {
      dbInstance = (event.target as IDBOpenDBRequest).result;
      resolve(dbInstance);
    };

    request.onerror = (event) => {
      console.warn('IndexedDB open error:', (event.target as IDBOpenDBRequest).error);
      reject((event.target as IDBOpenDBRequest).error);
    };
  });
}

export async function getStoredItem<T>(key: string, defaultValue: T): Promise<T> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction('userState', 'readonly');
      const store = tx.objectStore('userState');
      const req = store.get(key);

      req.onsuccess = () => {
        if (req.result && req.result.value !== undefined) {
          resolve(req.result.value as T);
        } else {
          resolve(defaultValue);
        }
      };

      req.onerror = () => {
        resolve(defaultValue);
      };
    });
  } catch (err) {
    console.warn(`IndexedDB read fallback for "${key}":`, err);
    // Fallback to localStorage if IndexedDB is blocked
    try {
      if (typeof window !== 'undefined') {
        const local = localStorage.getItem(`nexttube_${key}`);
        if (local) return JSON.parse(local) as T;
      }
    } catch {}
    return defaultValue;
  }
}

export async function setStoredItem<T>(key: string, value: T): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('userState', 'readwrite');
      const store = tx.objectStore('userState');
      const req = store.put({ key, value });

      req.onsuccess = () => {
        // Also mirror to localStorage as backup
        try {
          if (typeof window !== 'undefined') {
            localStorage.setItem(`nexttube_${key}`, JSON.stringify(value));
          }
        } catch {}
        resolve();
      };

      req.onerror = () => {
        reject(req.error);
      };
    });
  } catch (err) {
    console.warn(`IndexedDB write fallback for "${key}":`, err);
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(`nexttube_${key}`, JSON.stringify(value));
      }
    } catch {}
  }
}
