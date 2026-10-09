// js/main.js — Entry point Life Dashboard
// Feature: life-dashboard
// Requirements: 8.2, 8.3, 8.4, 9.3

import Storage, { KEYS } from './storage.js';
import Validator from './validator.js';
import ThemeManager from './theme.js';
import ClockWidget from './clock.js';
import GreetingWidget from './greeting.js';
import TimerWidget from './timer.js';
import TodoWidget from './todo.js';
import QuickLinksWidget from './quicklinks.js';

const SORT_ORDERS = new Set(['oldest', 'newest', 'status']);
let initialized = false;
let corruptToastShown = false;

// Apply the saved theme before DOMContentLoaded to avoid a light/dark flash.
// Storage.save serializes values as JSON, so decode the theme string here.
_applyEarlyTheme();

function _applyEarlyTheme() {
  if (typeof document === 'undefined') return;

  let theme = 'dark';
  try {
    const rawTheme = window.localStorage.getItem(KEYS.THEME);
    const savedTheme = rawTheme === null ? null : JSON.parse(rawTheme);
    if (savedTheme === 'light') theme = 'light';
  } catch (_error) {
    // Storage is unavailable or corrupt; dark mode is the required default.
  }

  _setThemeClasses(document.documentElement, theme);
}

function _setThemeClasses(element, theme) {
  if (!element || !element.classList) return;
  const isDark = theme !== 'light';
  element.classList.toggle('dark', isDark);
  element.classList.toggle('light', !isDark);
}

function _initializeApp() {
  if (initialized) return;
  initialized = true;

  // Load persisted values before any widget renders.
  const loadedState = Storage.loadAll();
  const rawDataCorrupt = _hasCorruptStoredData();
  const { state, hasStructuralCorruption } = _normalizeAppState(loadedState);

  if (!Storage.isAvailable) {
    const warning = document.getElementById('storage-warning');
    if (warning) warning.hidden = false;
  }

  ThemeManager.init(state.theme);
  ClockWidget.init();
  GreetingWidget.init(state.username);
  TimerWidget.init();
  TodoWidget.init(state.todos, state.sortOrder);
  QuickLinksWidget.init(state.quickLinks);

  if ((rawDataCorrupt || hasStructuralCorruption) && !corruptToastShown) {
    const toast = document.getElementById('data-corrupt-toast');
    if (toast) {
      toast.hidden = false;
      corruptToastShown = true;
    }
  }
}

/**
 * Check raw persisted entries so Storage.load()'s null fallback does not hide
 * the difference between a missing value and corrupt JSON or invalid shape.
 */
function _hasCorruptStoredData() {
  if (!Storage.isAvailable) return false;

  let localStore;
  try {
    localStore = window.localStorage;
  } catch (_error) {
    Storage.isAvailable = false;
    return false;
  }

  for (const key of Object.values(KEYS)) {
    let rawValue;
    try {
      rawValue = localStore.getItem(key);
    } catch (_error) {
      Storage.isAvailable = false;
      return false;
    }

    if (rawValue === null) continue;

    let parsedValue;
    try {
      parsedValue = JSON.parse(rawValue);
    } catch (_error) {
      return true;
    }

    if (!_isStoredValueValid(key, parsedValue)) return true;
  }

  return false;
}

function _isStoredValueValid(key, value) {
  switch (key) {
    case KEYS.TODOS:
      return _isValidTodos(value);
    case KEYS.SORT_ORDER:
      return SORT_ORDERS.has(value);
    case KEYS.QUICK_LINKS:
      return _isValidQuickLinks(value);
    case KEYS.USERNAME:
      return typeof value === 'string' && Validator.validateUsername(value).valid;
    case KEYS.THEME:
      return value === 'dark' || value === 'light';
    default:
      return true;
  }
}

function _isValidTodos(value) {
  if (!Array.isArray(value)) return false;
  const ids = new Set();

  return value.every((item) => {
    if (
      !item ||
      typeof item !== 'object' ||
      typeof item.id !== 'string' ||
      item.id.trim().length === 0 ||
      ids.has(item.id) ||
      !Validator.validateTaskText(item.text).valid ||
      typeof item.completed !== 'boolean' ||
      !Number.isFinite(item.createdAt)
    ) {
      return false;
    }

    ids.add(item.id);
    return true;
  });
}

function _isValidQuickLinks(value) {
  if (!Array.isArray(value) || value.length > 20) return false;
  const ids = new Set();

  return value.every((link) => {
    if (
      !link ||
      typeof link !== 'object' ||
      typeof link.id !== 'string' ||
      link.id.trim().length === 0 ||
      ids.has(link.id) ||
      !Validator.validateLinkLabel(link.label).valid ||
      typeof link.url !== 'string' ||
      !Validator.validateLinkUrl(link.url.trim()).valid
    ) {
      return false;
    }

    ids.add(link.id);
    return true;
  });
}

function _normalizeAppState(loadedState) {
  const todosValid = _isValidTodos(loadedState.todos);
  const sortOrderValid = SORT_ORDERS.has(loadedState.sortOrder);
  const quickLinksValid = _isValidQuickLinks(loadedState.quickLinks);
  const usernameValid =
    typeof loadedState.username === 'string' && Validator.validateUsername(loadedState.username).valid;
  const themeValid = loadedState.theme === 'dark' || loadedState.theme === 'light';

  return {
    state: {
      todos: todosValid ? loadedState.todos : [],
      sortOrder: sortOrderValid ? loadedState.sortOrder : 'oldest',
      quickLinks: quickLinksValid ? loadedState.quickLinks : [],
      username: usernameValid ? loadedState.username : '',
      theme: themeValid ? loadedState.theme : 'dark',
    },
    hasStructuralCorruption:
      !todosValid || !sortOrderValid || !quickLinksValid || !usernameValid || !themeValid,
  };
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _initializeApp, { once: true });
  } else {
    _initializeApp();
  }
}
