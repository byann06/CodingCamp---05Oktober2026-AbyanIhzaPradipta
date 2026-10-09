// tests/unit/storage.test.js — Unit tests for js/storage.js
// Feature: life-dashboard

import { describe, it, expect, beforeEach, vi } from 'vitest';
import Storage, { KEYS } from '../../js/storage.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Reset in-memory state and recreate a fresh localStorage mock. */
function makeLocalStorageMock() {
  let store = {};
  return {
    getItem: vi.fn((key) => (Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null)),
    setItem: vi.fn((key, value) => { store[key] = String(value); }),
    removeItem: vi.fn((key) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
    _store: () => store,
  };
}

// ---------------------------------------------------------------------------
// Setup: inject a controllable localStorage into global scope (jsdom provides
// a real one, but we want full control over throws and contents).
// ---------------------------------------------------------------------------

let lsMock;

beforeEach(() => {
  lsMock = makeLocalStorageMock();
  Object.defineProperty(globalThis, 'localStorage', {
    value: lsMock,
    writable: true,
    configurable: true,
  });
  // Ensure Storage sees it as available for most tests.
  Storage.isAvailable = true;
});

// ---------------------------------------------------------------------------
// save()
// ---------------------------------------------------------------------------

describe('Storage.save()', () => {
  it('serialises and stores a string value', () => {
    Storage.save(KEYS.USERNAME, 'Abyan');
    expect(lsMock.setItem).toHaveBeenCalledWith(KEYS.USERNAME, JSON.stringify('Abyan'));
  });

  it('serialises and stores an array value', () => {
    const todos = [{ id: '1', text: 'test', completed: false, createdAt: 0 }];
    Storage.save(KEYS.TODOS, todos);
    expect(lsMock.setItem).toHaveBeenCalledWith(KEYS.TODOS, JSON.stringify(todos));
  });

  it('serialises and stores a number value', () => {
    Storage.save('ld_test_num', 42);
    expect(lsMock.setItem).toHaveBeenCalledWith('ld_test_num', '42');
  });

  it('falls back to in-memory when isAvailable is false', () => {
    Storage.isAvailable = false;
    Storage.save(KEYS.THEME, 'light');
    // localStorage should NOT have been written
    expect(lsMock.setItem).not.toHaveBeenCalled();
    // But load() should still find the value via in-memory
    const result = Storage.load(KEYS.THEME);
    expect(result).toBe('light');
    // Restore
    Storage.isAvailable = true;
  });
});

// ---------------------------------------------------------------------------
// load()
// ---------------------------------------------------------------------------

describe('Storage.load()', () => {
  it('returns null for a key that does not exist', () => {
    expect(Storage.load('ld_nonexistent')).toBeNull();
  });

  it('returns the parsed value for an existing key', () => {
    lsMock.getItem.mockReturnValueOnce(JSON.stringify({ foo: 'bar' }));
    expect(Storage.load('ld_obj')).toEqual({ foo: 'bar' });
  });

  it('returns null for a key whose value is corrupt JSON', () => {
    lsMock.getItem.mockReturnValueOnce('not valid json {{');
    expect(Storage.load('ld_corrupt')).toBeNull();
  });

  it('returns null when localStorage.getItem throws', () => {
    lsMock.getItem.mockImplementationOnce(() => { throw new Error('SecurityError'); });
    expect(Storage.load('ld_throw')).toBeNull();
  });

  it('round-trips a string value', () => {
    Storage.save(KEYS.USERNAME, 'TestUser');
    // Simulate what localStorage returns after save
    lsMock.getItem.mockReturnValueOnce(JSON.stringify('TestUser'));
    expect(Storage.load(KEYS.USERNAME)).toBe('TestUser');
  });

  it('round-trips an array of TodoItems', () => {
    const todos = [
      { id: 'abc', text: 'Buy milk', completed: false, createdAt: 1000 },
      { id: 'def', text: 'Call mom', completed: true, createdAt: 2000 },
    ];
    Storage.save(KEYS.TODOS, todos);
    lsMock.getItem.mockReturnValueOnce(JSON.stringify(todos));
    expect(Storage.load(KEYS.TODOS)).toEqual(todos);
  });

  it('returns null when isAvailable is false and key not in memory', () => {
    Storage.isAvailable = false;
    expect(Storage.load('ld_unknown_mem')).toBeNull();
    Storage.isAvailable = true;
  });

  it('returns stored value from memory when isAvailable is false', () => {
    Storage.isAvailable = false;
    Storage.save(KEYS.SORT_ORDER, 'newest');
    expect(Storage.load(KEYS.SORT_ORDER)).toBe('newest');
    Storage.isAvailable = true;
  });
});

// ---------------------------------------------------------------------------
// loadAll()
// ---------------------------------------------------------------------------

describe('Storage.loadAll()', () => {
  it('returns default AppState when localStorage is empty', () => {
    const state = Storage.loadAll();
    expect(state.todos).toEqual([]);
    expect(state.sortOrder).toBe('oldest');
    expect(state.quickLinks).toEqual([]);
    expect(state.username).toBe('');
    expect(state.theme).toBe('dark');
  });

  it('returns stored todos when present', () => {
    const todos = [{ id: '1', text: 'x', completed: false, createdAt: 1 }];
    lsMock.getItem.mockImplementation((key) => {
      if (key === KEYS.TODOS) return JSON.stringify(todos);
      return null;
    });
    const state = Storage.loadAll();
    expect(state.todos).toEqual(todos);
  });

  it('returns stored theme when present', () => {
    lsMock.getItem.mockImplementation((key) => {
      if (key === KEYS.THEME) return JSON.stringify('light');
      return null;
    });
    expect(Storage.loadAll().theme).toBe('light');
  });

  it('returns stored sortOrder when present', () => {
    lsMock.getItem.mockImplementation((key) => {
      if (key === KEYS.SORT_ORDER) return JSON.stringify('newest');
      return null;
    });
    expect(Storage.loadAll().sortOrder).toBe('newest');
  });

  it('returns stored username when present', () => {
    lsMock.getItem.mockImplementation((key) => {
      if (key === KEYS.USERNAME) return JSON.stringify('Abyan');
      return null;
    });
    expect(Storage.loadAll().username).toBe('Abyan');
  });

  it('returns stored quickLinks when present', () => {
    const links = [{ id: 'q1', label: 'Google', url: 'https://google.com' }];
    lsMock.getItem.mockImplementation((key) => {
      if (key === KEYS.QUICK_LINKS) return JSON.stringify(links);
      return null;
    });
    expect(Storage.loadAll().quickLinks).toEqual(links);
  });

  it('falls back to defaults for a corrupt key while loading other keys normally', () => {
    // todos is corrupt; theme is valid
    lsMock.getItem.mockImplementation((key) => {
      if (key === KEYS.TODOS) return 'CORRUPT{{{{';
      if (key === KEYS.THEME) return JSON.stringify('light');
      return null;
    });
    const state = Storage.loadAll();
    expect(state.todos).toEqual([]);     // default because corrupt
    expect(state.theme).toBe('light');   // still loaded correctly
  });

  it('all fields have correct defaults when every key is corrupt', () => {
    lsMock.getItem.mockReturnValue('!!!bad json!!!');
    const state = Storage.loadAll();
    expect(state.todos).toEqual([]);
    expect(state.sortOrder).toBe('oldest');
    expect(state.quickLinks).toEqual([]);
    expect(state.username).toBe('');
    expect(state.theme).toBe('dark');
  });
});

// ---------------------------------------------------------------------------
// isAvailable flag
// ---------------------------------------------------------------------------

describe('Storage.isAvailable', () => {
  it('is a boolean', () => {
    expect(typeof Storage.isAvailable).toBe('boolean');
  });
});
