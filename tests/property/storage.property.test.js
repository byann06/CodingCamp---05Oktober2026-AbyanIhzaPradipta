// tests/property/storage.property.test.js
// Feature: life-dashboard, Property 12: Storage Round-Trip untuk Semua Tipe Data
// Validates: Requirements 2.7, 4.9, 4.10, 5.4, 6.7, 6.8, 7.3, 8.1, 8.4

import { describe, it, expect, beforeEach, vi } from 'vitest';
import fc from 'fast-check';
import Storage, { KEYS } from '../../js/storage.js';

// ---------------------------------------------------------------------------
// localStorage mock factory
// ---------------------------------------------------------------------------

function makeLocalStorageMock() {
  let store = {};
  return {
    getItem: vi.fn((key) => (Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null)),
    setItem: vi.fn((key, value) => { store[key] = String(value); }),
    removeItem: vi.fn((key) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
  };
}

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

const todoItemArb = fc.record({
  id: fc.uuid(),
  text: fc.string({ minLength: 1, maxLength: 200 }),
  completed: fc.boolean(),
  createdAt: fc.nat(),
});

const quickLinkArb = fc.record({
  id: fc.uuid(),
  label: fc.string({ minLength: 1, maxLength: 50 }),
  url: fc.oneof(
    fc.string({ minLength: 1 }).map((s) => `https://${s}`),
    fc.string({ minLength: 1 }).map((s) => `http://${s}`),
  ),
});

const sortOrderArb = fc.constantFrom('oldest', 'newest', 'status');
const themeArb = fc.constantFrom('light', 'dark');
const usernameArb = fc.string({ maxLength: 100 });

// A serialisable value covering all types the app stores
const appValueArb = fc.oneof(
  fc.array(todoItemArb, { maxLength: 50 }),
  fc.array(quickLinkArb, { maxLength: 20 }),
  sortOrderArb,
  themeArb,
  usernameArb,
);

// Arbitrary keys that the app uses
const knownKeyArb = fc.constantFrom(...Object.values(KEYS));

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  const mock = makeLocalStorageMock();
  Object.defineProperty(globalThis, 'localStorage', {
    value: mock,
    writable: true,
    configurable: true,
  });
  Storage.isAvailable = true;
});

// ---------------------------------------------------------------------------
// Property 12a: save then load round-trips any serialisable value
// ---------------------------------------------------------------------------

describe('Property 12: Storage round-trip', () => {
  it(
    'save(key, v) followed by load(key) returns a value deeply equal to v',
    () => {
      fc.assert(
        fc.property(knownKeyArb, appValueArb, (key, value) => {
          Storage.save(key, value);
          const loaded = Storage.load(key);
          expect(loaded).toEqual(value);
        }),
        { numRuns: 100 },
      );
    },
  );

  // ---------------------------------------------------------------------------
  // Property 12b: corrupt data → load returns null, no exception thrown
  // ---------------------------------------------------------------------------

  it(
    'load(key) returns null for any non-JSON string without throwing',
    () => {
      // Generate strings that are definitely NOT valid JSON
      const notJsonArb = fc
        .string({ minLength: 1 })
        .filter((s) => {
          try { JSON.parse(s); return false; } catch { return true; }
        });

      fc.assert(
        fc.property(knownKeyArb, notJsonArb, (key, corrupt) => {
          // Inject corrupt raw string directly
          globalThis.localStorage.getItem.mockReturnValueOnce(corrupt);
          let result;
          expect(() => { result = Storage.load(key); }).not.toThrow();
          expect(result).toBeNull();
        }),
        { numRuns: 100 },
      );
    },
  );

  // ---------------------------------------------------------------------------
  // Property 12c: in-memory fallback also round-trips correctly
  // ---------------------------------------------------------------------------

  it(
    'round-trip works via in-memory fallback when isAvailable is false',
    () => {
      fc.assert(
        fc.property(knownKeyArb, appValueArb, (key, value) => {
          Storage.isAvailable = false;
          Storage.save(key, value);
          const loaded = Storage.load(key);
          Storage.isAvailable = true;
          expect(loaded).toEqual(value);
        }),
        { numRuns: 100 },
      );
    },
  );

  // ---------------------------------------------------------------------------
  // Property 12d: loadAll() always returns a complete AppState with correct
  // default types for every field
  // ---------------------------------------------------------------------------

  it(
    'loadAll() always returns an object with the correct shape',
    () => {
      fc.assert(
        fc.property(
          fc.record({
            todos: fc.oneof(fc.constant(null), fc.array(todoItemArb, { maxLength: 10 })),
            sortOrder: fc.oneof(fc.constant(null), sortOrderArb),
            quickLinks: fc.oneof(fc.constant(null), fc.array(quickLinkArb, { maxLength: 5 })),
            username: fc.oneof(fc.constant(null), usernameArb),
            theme: fc.oneof(fc.constant(null), themeArb),
          }),
          (seed) => {
            // Populate localStorage mock with seed values (null means "missing")
            globalThis.localStorage.getItem.mockImplementation((key) => {
              const map = {
                [KEYS.TODOS]: seed.todos,
                [KEYS.SORT_ORDER]: seed.sortOrder,
                [KEYS.QUICK_LINKS]: seed.quickLinks,
                [KEYS.USERNAME]: seed.username,
                [KEYS.THEME]: seed.theme,
              };
              const v = map[key];
              return v === null ? null : JSON.stringify(v);
            });

            const state = Storage.loadAll();

            // Shape invariants
            expect(Array.isArray(state.todos)).toBe(true);
            expect(['oldest', 'newest', 'status']).toContain(state.sortOrder);
            expect(Array.isArray(state.quickLinks)).toBe(true);
            expect(typeof state.username).toBe('string');
            expect(['light', 'dark']).toContain(state.theme);

            // Non-null seed values must be loaded as-is
            if (seed.todos !== null) expect(state.todos).toEqual(seed.todos);
            if (seed.sortOrder !== null) expect(state.sortOrder).toBe(seed.sortOrder);
            if (seed.quickLinks !== null) expect(state.quickLinks).toEqual(seed.quickLinks);
            if (seed.username !== null) expect(state.username).toBe(seed.username);
            if (seed.theme !== null) expect(state.theme).toBe(seed.theme);
          },
        ),
        { numRuns: 100 },
      );
    },
  );
});
