// tests/unit/main.integration.test.js — Startup smoke test for the dashboard
// Feature: life-dashboard
// Requirements: 8.2, 8.3, 8.4, 9.3
// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Storage, { KEYS } from '../../js/storage.js';

function setupDOM() {
  document.documentElement.className = '';
  document.body.innerHTML = `
    <header><button id="theme-toggle" type="button">🌙</button></header>
    <div id="storage-warning" hidden></div>
    <div id="data-corrupt-toast" hidden></div>
    <div id="clock-time">00:00:00</div>
    <div id="clock-date"></div>
    <p id="greeting-text"></p>
    <form id="username-form">
      <input id="username-input" />
      <button id="username-save-btn" type="submit">Simpan</button>
      <span id="username-error"></span>
    </form>
    <div id="timer-display">25:00</div>
    <div id="timer-complete-indicator" hidden></div>
    <button id="timer-start-btn" type="button">Mulai</button>
    <button id="timer-stop-btn" type="button" disabled>Berhenti</button>
    <button id="timer-reset-btn" type="button">Reset</button>
    <form id="todo-add-form">
      <input id="todo-input" />
      <button id="todo-add-btn" type="submit">Tambah</button>
      <span id="todo-input-error"></span>
    </form>
    <select id="todo-sort-select">
      <option value="oldest">Terlama</option>
      <option value="newest">Terbaru</option>
      <option value="status">Status</option>
    </select>
    <ul id="todo-list"></ul>
    <div id="quick-links-container"></div>
    <p id="quicklinks-limit-msg" hidden></p>
    <form id="quicklinks-add-form">
      <input id="quicklinks-label-input" />
      <span id="quicklinks-label-error"></span>
      <input id="quicklinks-url-input" type="url" />
      <span id="quicklinks-url-error"></span>
      <button id="quicklinks-add-btn" type="submit">Tambah Link</button>
    </form>
  `;
}

function submit(formId) {
  document.getElementById(formId).dispatchEvent(
    new Event('submit', { bubbles: true, cancelable: true }),
  );
}

let previousStorageAvailability;

beforeEach(() => {
  setupDOM();
  previousStorageAvailability = Storage.isAvailable;
  Storage.isAvailable = true;
  localStorage.clear();
  vi.useFakeTimers();
});

afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
  localStorage.clear();
  Storage.isAvailable = previousStorageAvailability;
});

describe('dashboard startup integration', () => {
  it('loads state and wires every widget, normalizing a structurally invalid setting', async () => {
    Storage.save(KEYS.TODOS, [
      { id: 'saved-todo', text: 'Tugas tersimpan', completed: false, createdAt: 10 },
    ]);
    Storage.save(KEYS.SORT_ORDER, 'unsupported-order');
    Storage.save(KEYS.QUICK_LINKS, [
      { id: 'saved-link', label: 'Dokumentasi', url: 'https://example.com/docs' },
    ]);
    Storage.save(KEYS.USERNAME, 'Abyan');
    Storage.save(KEYS.THEME, 'light');

    await import('../../js/main.js');
    document.dispatchEvent(new Event('DOMContentLoaded'));

    expect(document.documentElement.classList.contains('light')).toBe(true);
    expect(document.body.classList.contains('light')).toBe(true);
    expect(document.getElementById('data-corrupt-toast').hidden).toBe(false);
    expect(document.getElementById('storage-warning').hidden).toBe(true);
    expect(document.getElementById('greeting-text').textContent).toContain('Abyan');
    expect(document.getElementById('clock-time').textContent).toMatch(/^\d{2}:\d{2}:\d{2}$/);
    expect(document.getElementById('clock-date').textContent).not.toBe('');
    expect(document.getElementById('timer-display').textContent).toBe('25:00');
    expect(document.querySelector('#todo-list .todo-item').dataset.id).toBe('saved-todo');
    expect(document.getElementById('todo-sort-select').value).toBe('oldest');

    const savedAnchor = document.querySelector('#quick-links-container .quicklink-button');
    expect(savedAnchor.href).toBe('https://example.com/docs');
    expect(savedAnchor.target).toBe('_blank');
    expect(savedAnchor.rel).toBe('noopener noreferrer');

    document.getElementById('theme-toggle').click();
    expect(document.body.classList.contains('dark')).toBe(true);
    expect(Storage.load(KEYS.THEME)).toBe('dark');

    const usernameInput = document.getElementById('username-input');
    usernameInput.value = 'Nadia';
    submit('username-form');
    expect(document.getElementById('greeting-text').textContent).toContain('Nadia');

    document.getElementById('timer-start-btn').click();
    expect(document.getElementById('timer-stop-btn').disabled).toBe(false);
    document.getElementById('timer-stop-btn').click();
    expect(document.getElementById('timer-stop-btn').disabled).toBe(true);

    document.getElementById('todo-input').value = 'Tugas baru';
    submit('todo-add-form');
    expect(document.querySelectorAll('#todo-list .todo-item')).toHaveLength(2);

    document.getElementById('quicklinks-label-input').value = 'RevoU';
    document.getElementById('quicklinks-url-input').value = 'https://revou.co';
    submit('quicklinks-add-form');
    expect(document.querySelectorAll('#quick-links-container .quicklink-item')).toHaveLength(2);
    expect(Storage.load(KEYS.QUICK_LINKS)).toHaveLength(2);
  });
});
