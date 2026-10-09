// tests/unit/theme.test.js — Unit tests for js/theme.js
// Feature: life-dashboard
// Requirements: 7.1, 7.2, 7.3, 7.5
// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ThemeManager from '../../js/theme.js';
import Storage from '../../js/storage.js';

function setupDOM() {
  document.documentElement.className = '';
  document.body.className = '';
  document.body.innerHTML = `
    <button
      id="theme-toggle"
      type="button"
      aria-label="Ganti mode tampilan"
      title="Ganti mode tampilan"
    >🌙</button>
  `;
}

beforeEach(() => {
  setupDOM();
  vi.spyOn(Storage, 'save').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('ThemeManager.init()', () => {
  it('uses Dark Mode when there is no saved theme', () => {
    ThemeManager.init(null);

    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.body.classList.contains('dark')).toBe(true);
    expect(document.documentElement.classList.contains('light')).toBe(false);
    expect(document.body.classList.contains('light')).toBe(false);

    const toggleButton = document.getElementById('theme-toggle');
    expect(toggleButton.textContent).toBe('🌙');
    expect(toggleButton.getAttribute('aria-label')).toBe('Beralih ke mode terang');
  });
});

describe('ThemeManager.toggle()', () => {
  it('toggles dark → light → dark and persists each selected theme', () => {
    ThemeManager.init(null);
    const toggleButton = document.getElementById('theme-toggle');

    toggleButton.click();

    expect(document.documentElement.classList.contains('light')).toBe(true);
    expect(document.body.classList.contains('light')).toBe(true);
    expect(toggleButton.textContent).toBe('☀️');
    expect(Storage.save).toHaveBeenLastCalledWith('ld_theme', 'light');

    toggleButton.click();

    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.body.classList.contains('dark')).toBe(true);
    expect(toggleButton.textContent).toBe('🌙');
    expect(Storage.save).toHaveBeenLastCalledWith('ld_theme', 'dark');
  });
});
