// tests/property/theme.property.test.js — Property-based tests for js/theme.js
// Feature: life-dashboard
// Property 11: Toggle Tema (Round-Trip)
// Validates: Requirements 7.2
// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import fc from 'fast-check';
import ThemeManager from '../../js/theme.js';
import Storage from '../../js/storage.js';

function setupDOM() {
  document.documentElement.className = '';
  document.body.className = '';
  document.body.innerHTML = '<button id="theme-toggle" type="button">🌙</button>';
}

beforeEach(() => {
  setupDOM();
  vi.spyOn(Storage, 'save').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('Property 11 — Theme toggle round-trip', () => {
  it('toggle(toggle(theme)) returns to either starting theme', () => {
    fc.assert(
      fc.property(fc.constantFrom('light', 'dark'), (initialTheme) => {
        setupDOM();
        Storage.save.mockClear();
        ThemeManager.init(initialTheme);

        const firstToggle = ThemeManager.toggle();
        const secondToggle = ThemeManager.toggle();

        expect(firstToggle).toBe(initialTheme === 'dark' ? 'light' : 'dark');
        expect(secondToggle).toBe(initialTheme);
        expect(document.documentElement.classList.contains(initialTheme)).toBe(true);
        expect(document.body.classList.contains(initialTheme)).toBe(true);
        expect(document.getElementById('theme-toggle').textContent).toBe(
          initialTheme === 'dark' ? '🌙' : '☀️',
        );
        expect(Storage.save).toHaveBeenLastCalledWith('ld_theme', initialTheme);
      }),
      { numRuns: 100 },
    );
  });
});
