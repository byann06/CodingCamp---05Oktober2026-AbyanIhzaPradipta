// js/theme.js — Theme Manager
// Feature: life-dashboard
// Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6

import Storage, { KEYS } from './storage.js';

let currentTheme = 'dark';
let boundToggleButton = null;
let toggleHandler = null;

const ThemeManager = {
  /**
   * Apply the saved theme (or dark mode by default) and wire up the toggle.
   * @param {'light'|'dark'|null|undefined} savedTheme
   */
  init(savedTheme) {
    const initialTheme = _normalizeTheme(savedTheme);
    this.apply(initialTheme);
    this.updateToggleButton(initialTheme);

    // Avoid duplicate handlers if the manager is initialized more than once.
    if (boundToggleButton && toggleHandler) {
      boundToggleButton.removeEventListener('click', toggleHandler);
    }

    boundToggleButton = _el('theme-toggle');
    toggleHandler = null;
    if (boundToggleButton) {
      toggleHandler = () => this.toggle();
      boundToggleButton.addEventListener('click', toggleHandler);
    }
  },

  /** Toggle between dark and light mode, then persist the preference. */
  toggle() {
    const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
    this.apply(nextTheme);
    this.updateToggleButton(nextTheme);
    Storage.save(KEYS.THEME, nextTheme);
    return nextTheme;
  },

  /**
   * Apply a theme class to the document root and body.
   * Keeping the root class synchronized supports the existing anti-flash
   * script; the body class is used by widget styles.
   * @param {'light'|'dark'} theme
   * @returns {'light'|'dark'}
   */
  apply(theme) {
    currentTheme = _normalizeTheme(theme);
    const isDark = currentTheme === 'dark';

    if (typeof document !== 'undefined') {
      _applyThemeClasses(document.documentElement, isDark);
      _applyThemeClasses(document.body, isDark);
    }

    return currentTheme;
  },

  /** Update the toggle's icon and accessible label for the active theme. */
  updateToggleButton(theme = currentTheme) {
    const normalizedTheme = _normalizeTheme(theme);
    const button = _el('theme-toggle');
    if (!button) return;

    const isDark = normalizedTheme === 'dark';
    const label = isDark ? 'Beralih ke mode terang' : 'Beralih ke mode gelap';
    button.textContent = isDark ? '🌙' : '☀️';
    button.setAttribute('aria-label', label);
    button.setAttribute('title', label);
    button.setAttribute('aria-pressed', String(isDark));
  },
};

/**
 * Normalize unknown or missing values to the required default theme.
 * @param {unknown} theme
 * @returns {'light'|'dark'}
 */
function _normalizeTheme(theme) {
  return theme === 'light' ? 'light' : 'dark';
}

/** Apply mutually exclusive theme classes to an element if it exists. */
function _applyThemeClasses(element, isDark) {
  if (!element || !element.classList) return;
  element.classList.toggle('dark', isDark);
  element.classList.toggle('light', !isDark);
}

/** Safely look up a document element by ID. */
function _el(id) {
  if (typeof document === 'undefined') return null;
  return document.getElementById(id);
}

export { ThemeManager };
export default ThemeManager;
