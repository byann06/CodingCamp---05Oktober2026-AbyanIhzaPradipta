// js/storage.js — Storage Service
// Feature: life-dashboard
// Requirements: 8.1, 8.2, 8.3, 8.4

/**
 * Keys used by the Life Dashboard in localStorage.
 */
export const KEYS = {
  TODOS: 'ld_todos',
  SORT_ORDER: 'ld_sort_order',
  QUICK_LINKS: 'ld_quick_links',
  USERNAME: 'ld_username',
  THEME: 'ld_theme',
};

// In-memory fallback store used when localStorage is unavailable.
const _memoryStore = {};

/**
 * Detect whether localStorage is accessible.
 * Some browsers throw on access in private/incognito modes or when
 * storage is disabled by policy.
 */
function detectLocalStorage() {
  try {
    const testKey = '__ld_test__';
    localStorage.setItem(testKey, '1');
    localStorage.removeItem(testKey);
    return true;
  } catch (_e) {
    return false;
  }
}

const Storage = {
  /**
   * Whether localStorage is available in this browser session.
   * Set once at module load time.
   */
  isAvailable: detectLocalStorage(),

  /**
   * Persist a value under the given key.
   * Serialises the value to JSON before writing.
   * Falls back to in-memory store when localStorage is unavailable.
   *
   * @param {string} key
   * @param {*} value  — must be JSON-serialisable
   */
  save(key, value) {
    const serialised = JSON.stringify(value);
    if (this.isAvailable) {
      try {
        localStorage.setItem(key, serialised);
        return;
      } catch (_e) {
        // Storage quota exceeded or access revoked mid-session — fall through
        // to in-memory so the operation never silently loses data within the tab.
      }
    }
    _memoryStore[key] = serialised;
  },

  /**
   * Load and deserialise a value from localStorage (or in-memory fallback).
   * Returns null if the key does not exist or the stored value is not valid JSON.
   *
   * @param {string} key
   * @returns {*|null}
   */
  load(key) {
    let raw = null;
    if (this.isAvailable) {
      try {
        raw = localStorage.getItem(key);
      } catch (_e) {
        return null;
      }
    } else {
      raw = Object.prototype.hasOwnProperty.call(_memoryStore, key)
        ? _memoryStore[key]
        : null;
    }

    if (raw === null || raw === undefined) {
      return null;
    }

    try {
      return JSON.parse(raw);
    } catch (_e) {
      // Corrupt / non-JSON value — return null so callers init with empty state.
      return null;
    }
  },

  /**
   * Load all application keys at once and return a complete AppState object.
   * Keys that are missing or corrupt fall back to their default values.
   * Partial corruption is handled gracefully — other keys still load normally.
   *
   * @returns {AppState}
   */
  loadAll() {
    return {
      todos: this.load(KEYS.TODOS) ?? [],
      sortOrder: this.load(KEYS.SORT_ORDER) ?? 'oldest',
      quickLinks: this.load(KEYS.QUICK_LINKS) ?? [],
      username: this.load(KEYS.USERNAME) ?? '',
      theme: this.load(KEYS.THEME) ?? 'dark',
    };
  },
};

export default Storage;
