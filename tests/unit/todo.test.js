// tests/unit/todo.test.js — Unit tests for js/todo.js
// Feature: life-dashboard
// Requirements: 4.1, 4.6, 4.7, 4.8, 5.1, 5.2, 5.3
// @vitest-environment jsdom

import { describe, it, expect, beforeEach, vi } from 'vitest';
import TodoWidget, { generateId } from '../../js/todo.js';
import Storage from '../../js/storage.js';

// ---------------------------------------------------------------------------
// Setup: provide minimal DOM and reset widget state before every test
// ---------------------------------------------------------------------------

beforeEach(() => {
  // Minimal DOM structure required by TodoWidget
  document.body.innerHTML = `
    <form id="todo-add-form">
      <input id="todo-input" />
      <span id="todo-input-error"></span>
    </form>
    <select id="todo-sort-select"></select>
    <ul id="todo-list"></ul>
  `;

  // Spy on Storage.save so it doesn't touch localStorage and we can inspect calls
  vi.spyOn(Storage, 'save').mockImplementation(() => {});

  // Reset internal state of the module via init()
  TodoWidget.init([], 'oldest');

  // Clear spy history after init so individual test assertions are clean
  vi.clearAllMocks();
  vi.spyOn(Storage, 'save').mockImplementation(() => {});
});

// ---------------------------------------------------------------------------
// generateId — requirement 4.1
// ---------------------------------------------------------------------------

describe('generateId()', () => {
  it('returns a non-empty string', () => {
    const id = generateId();
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(0);
  });

  it('generates unique IDs across many calls', () => {
    const ids = Array.from({ length: 100 }, () => generateId());
    const unique = new Set(ids);
    expect(unique.size).toBe(100);
  });
});

// ---------------------------------------------------------------------------
// addTask → verifikasi id unik — requirement 4.1
// ---------------------------------------------------------------------------

describe('addTask() → id unik', () => {
  it('dua tugas yang ditambahkan memiliki id berbeda', () => {
    TodoWidget.addTask('Tugas pertama');
    TodoWidget.addTask('Tugas kedua');

    // Capture the todos array from the last save call
    const saveCalls = Storage.save.mock.calls.filter(([key]) => key === 'ld_todos');
    const savedTodos = saveCalls[saveCalls.length - 1][1];

    expect(savedTodos).toHaveLength(2);
    const [t1, t2] = savedTodos;
    expect(t1.id).toBeTruthy();
    expect(t2.id).toBeTruthy();
    expect(t1.id).not.toBe(t2.id);
  });

  it('id tugas baru tidak duplikat dengan id yang sudah ada', () => {
    TodoWidget.addTask('Tugas A');
    TodoWidget.addTask('Tugas B');
    TodoWidget.addTask('Tugas C');

    const saveCalls = Storage.save.mock.calls.filter(([key]) => key === 'ld_todos');
    const savedTodos = saveCalls[saveCalls.length - 1][1];
    const ids = savedTodos.map((t) => t.id);
    const uniqueIds = new Set(ids);

    expect(uniqueIds.size).toBe(ids.length);
  });
});

// ---------------------------------------------------------------------------
// toggleComplete → selesai, toggle kembali → normal — requirement 4.6
// ---------------------------------------------------------------------------

describe('toggleComplete()', () => {
  it('menandai tugas sebagai selesai (completed = true)', () => {
    TodoWidget.addTask('Belajar Vitest');
    vi.clearAllMocks();
    vi.spyOn(Storage, 'save').mockImplementation(() => {});

    // Recover the id by re-adding and reading from init state
    // Strategy: init TodoWidget with a known task directly
    const knownId = 'test-toggle-id-1';
    TodoWidget.init([{ id: knownId, text: 'Belajar Vitest', completed: false, createdAt: 1000 }], 'oldest');
    vi.clearAllMocks();
    vi.spyOn(Storage, 'save').mockImplementation(() => {});

    TodoWidget.toggleComplete(knownId);

    const saveCalls = Storage.save.mock.calls.filter(([key]) => key === 'ld_todos');
    const savedTodos = saveCalls[saveCalls.length - 1][1];
    const item = savedTodos.find((t) => t.id === knownId);

    expect(item).toBeDefined();
    expect(item.completed).toBe(true);
  });

  it('toggle kembali → completed kembali false (normal)', () => {
    const knownId = 'test-toggle-id-2';
    TodoWidget.init([{ id: knownId, text: 'Belajar Vitest', completed: false, createdAt: 1000 }], 'oldest');
    vi.clearAllMocks();
    vi.spyOn(Storage, 'save').mockImplementation(() => {});

    // Toggle ON
    TodoWidget.toggleComplete(knownId);
    // Toggle OFF
    TodoWidget.toggleComplete(knownId);

    const saveCalls = Storage.save.mock.calls.filter(([key]) => key === 'ld_todos');
    const savedTodos = saveCalls[saveCalls.length - 1][1];
    const item = savedTodos.find((t) => t.id === knownId);

    expect(item).toBeDefined();
    expect(item.completed).toBe(false);
  });

  it('tampilan tugas selesai mendapat class todo-item--completed', () => {
    const knownId = 'test-toggle-id-3';
    TodoWidget.init([{ id: knownId, text: 'Belajar DOM', completed: false, createdAt: 1000 }], 'oldest');
    vi.spyOn(Storage, 'save').mockImplementation(() => {});

    TodoWidget.toggleComplete(knownId);

    const listItem = document.querySelector(`[data-id="${knownId}"]`);
    expect(listItem).not.toBeNull();
    expect(listItem.classList.contains('todo-item--completed')).toBe(true);
  });

  it('toggle kembali menghapus class todo-item--completed', () => {
    const knownId = 'test-toggle-id-4';
    TodoWidget.init([{ id: knownId, text: 'Belajar DOM', completed: false, createdAt: 1000 }], 'oldest');
    vi.spyOn(Storage, 'save').mockImplementation(() => {});

    TodoWidget.toggleComplete(knownId);
    TodoWidget.toggleComplete(knownId);

    const listItem = document.querySelector(`[data-id="${knownId}"]`);
    expect(listItem).not.toBeNull();
    expect(listItem.classList.contains('todo-item--completed')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// deleteTask dengan id yang tidak ada → no-op — requirement 4.7, 4.8
// ---------------------------------------------------------------------------

describe('deleteTask() → no-op untuk id tidak ada', () => {
  it('tidak melempar error saat id tidak ditemukan', () => {
    const initialTodos = [
      { id: 'id-alpha', text: 'Tugas alpha', completed: false, createdAt: 1000 },
      { id: 'id-beta', text: 'Tugas beta', completed: false, createdAt: 2000 },
    ];
    TodoWidget.init(initialTodos, 'oldest');
    vi.clearAllMocks();
    vi.spyOn(Storage, 'save').mockImplementation(() => {});

    expect(() => {
      TodoWidget.deleteTask('nonexistent-id');
    }).not.toThrow();
  });

  it('jumlah tugas tetap sama setelah deleteTask dengan id tidak ada', () => {
    const initialTodos = [
      { id: 'id-alpha', text: 'Tugas alpha', completed: false, createdAt: 1000 },
      { id: 'id-beta', text: 'Tugas beta', completed: false, createdAt: 2000 },
    ];
    TodoWidget.init(initialTodos, 'oldest');
    vi.clearAllMocks();
    vi.spyOn(Storage, 'save').mockImplementation(() => {});

    TodoWidget.deleteTask('nonexistent-id');

    const saveCalls = Storage.save.mock.calls.filter(([key]) => key === 'ld_todos');
    const savedTodos = saveCalls[saveCalls.length - 1][1];

    expect(savedTodos).toHaveLength(2);
  });

  it('isi tugas tidak berubah setelah deleteTask dengan id tidak ada', () => {
    const initialTodos = [
      { id: 'id-alpha', text: 'Tugas alpha', completed: false, createdAt: 1000 },
      { id: 'id-beta', text: 'Tugas beta', completed: false, createdAt: 2000 },
    ];
    TodoWidget.init(initialTodos, 'oldest');
    vi.clearAllMocks();
    vi.spyOn(Storage, 'save').mockImplementation(() => {});

    TodoWidget.deleteTask('nonexistent-id');

    const saveCalls = Storage.save.mock.calls.filter(([key]) => key === 'ld_todos');
    const savedTodos = saveCalls[saveCalls.length - 1][1];
    const ids = savedTodos.map((t) => t.id);

    expect(ids).toContain('id-alpha');
    expect(ids).toContain('id-beta');
  });
});

// ---------------------------------------------------------------------------
// applySortOrder — requirements 5.1, 5.2, 5.3
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Helper: read the DOM-rendered order of todo items
// Returns an array of data-id strings in rendered order
// ---------------------------------------------------------------------------
function getRenderedIds() {
  return Array.from(document.querySelectorAll('#todo-list .todo-item')).map(
    (li) => li.dataset.id,
  );
}

// Helper: read completed flags from rendered DOM order
function getRenderedCompleted() {
  return Array.from(document.querySelectorAll('#todo-list .todo-item')).map((li) =>
    li.classList.contains('todo-item--completed'),
  );
}

describe("applySortOrder('oldest')", () => {
  it("mengurutkan tugas ascending berdasarkan createdAt", () => {
    const todos = [
      { id: 'c', text: 'Ketiga', completed: false, createdAt: 3000 },
      { id: 'a', text: 'Pertama', completed: false, createdAt: 1000 },
      { id: 'b', text: 'Kedua', completed: false, createdAt: 2000 },
    ];
    TodoWidget.init(todos, 'newest'); // init with different order so applySortOrder actually re-sorts

    TodoWidget.applySortOrder('oldest');

    // DOM renders items in sorted order — verify id sequence matches ascending createdAt
    const renderedIds = getRenderedIds();
    expect(renderedIds).toEqual(['a', 'b', 'c']);
  });

  it("urutan oldest: elemen pertama memiliki createdAt terkecil", () => {
    const todos = [
      { id: 'z', text: 'Z', completed: false, createdAt: 9000 },
      { id: 'x', text: 'X', completed: false, createdAt: 100 },
      { id: 'y', text: 'Y', completed: false, createdAt: 500 },
    ];
    TodoWidget.init(todos, 'newest');

    TodoWidget.applySortOrder('oldest');

    const renderedIds = getRenderedIds();
    // First rendered item should be 'x' (createdAt 100), last should be 'z' (createdAt 9000)
    expect(renderedIds[0]).toBe('x');
    expect(renderedIds[renderedIds.length - 1]).toBe('z');
  });
});

describe("applySortOrder('newest')", () => {
  it("mengurutkan tugas descending berdasarkan createdAt", () => {
    const todos = [
      { id: 'a', text: 'Pertama', completed: false, createdAt: 1000 },
      { id: 'c', text: 'Ketiga', completed: false, createdAt: 3000 },
      { id: 'b', text: 'Kedua', completed: false, createdAt: 2000 },
    ];
    TodoWidget.init(todos, 'oldest');

    TodoWidget.applySortOrder('newest');

    const renderedIds = getRenderedIds();
    expect(renderedIds).toEqual(['c', 'b', 'a']);
  });

  it("urutan newest: elemen pertama memiliki createdAt terbesar", () => {
    const todos = [
      { id: 'z', text: 'Z', completed: false, createdAt: 9000 },
      { id: 'x', text: 'X', completed: false, createdAt: 100 },
      { id: 'y', text: 'Y', completed: false, createdAt: 500 },
    ];
    TodoWidget.init(todos, 'oldest');

    TodoWidget.applySortOrder('newest');

    const renderedIds = getRenderedIds();
    // First rendered item should be 'z' (createdAt 9000), last should be 'x' (createdAt 100)
    expect(renderedIds[0]).toBe('z');
    expect(renderedIds[renderedIds.length - 1]).toBe('x');
  });
});

describe("applySortOrder('status')", () => {
  it("menempatkan tugas belum selesai sebelum tugas selesai", () => {
    const todos = [
      { id: 's1', text: 'Selesai 1', completed: true, createdAt: 1000 },
      { id: 'u1', text: 'Belum 1', completed: false, createdAt: 2000 },
      { id: 's2', text: 'Selesai 2', completed: true, createdAt: 3000 },
      { id: 'u2', text: 'Belum 2', completed: false, createdAt: 4000 },
    ];
    TodoWidget.init(todos, 'oldest');

    TodoWidget.applySortOrder('status');

    const completedFlags = getRenderedCompleted();
    const firstCompletedIndex = completedFlags.indexOf(true);
    const lastIncompleteIndex = completedFlags.lastIndexOf(false);

    // Semua item belum selesai harus ada di depan semua item selesai
    expect(lastIncompleteIndex).toBeLessThan(firstCompletedIndex);
  });

  it("semua tugas belum selesai muncul sebelum tugas selesai (urutan status DOM)", () => {
    const todos = [
      { id: 'done-a', text: 'Sudah selesai A', completed: true, createdAt: 500 },
      { id: 'todo-a', text: 'Belum selesai A', completed: false, createdAt: 1500 },
      { id: 'done-b', text: 'Sudah selesai B', completed: true, createdAt: 2500 },
      { id: 'todo-b', text: 'Belum selesai B', completed: false, createdAt: 3500 },
    ];
    TodoWidget.init(todos, 'oldest');

    TodoWidget.applySortOrder('status');

    const completedFlags = getRenderedCompleted();
    const firstCompleted = completedFlags.indexOf(true);
    const lastIncomplete = completedFlags.lastIndexOf(false);

    expect(lastIncomplete).toBeLessThan(firstCompleted);
  });

  it("menyimpan sortOrder 'status' ke storage", () => {
    TodoWidget.init([], 'oldest');
    vi.clearAllMocks();
    vi.spyOn(Storage, 'save').mockImplementation(() => {});

    TodoWidget.applySortOrder('status');

    const sortOrderSaveCall = Storage.save.mock.calls.find(([key]) => key === 'ld_sort_order');
    expect(sortOrderSaveCall).toBeDefined();
    expect(sortOrderSaveCall[1]).toBe('status');
  });
});
