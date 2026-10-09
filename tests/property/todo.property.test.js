// tests/property/todo.property.test.js — Property-based tests for js/todo.js
// Feature: life-dashboard
// Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 5.2, 5.3
// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import fc from 'fast-check';
import TodoWidget from '../../js/todo.js';
import Storage from '../../js/storage.js';

const todoDataArbitrary = fc.record({
  text: fc.string({ minLength: 1, maxLength: 200 }).filter((text) => text.trim().length > 0),
  completed: fc.boolean(),
  createdAt: fc.integer({ min: 0, max: 1_000_000 }),
});

// Give each generated item a unique ID so delete and sort properties can
// distinguish records even when all their other fields happen to be equal.
const todoListArbitrary = fc
  .array(todoDataArbitrary, { maxLength: 30 })
  .map((items) => items.map((item, index) => ({ ...item, id: `generated-${index}` })));

const validTaskTextArbitrary = fc
  .string({ minLength: 1, maxLength: 200 })
  .filter((text) => text.trim().length > 0);

const whitespaceOnlyArbitrary = fc
  .array(fc.constantFrom(' ', '\t', '\n', '\r', '\f', '\v'), {
    minLength: 1,
    maxLength: 50,
  })
  .map((characters) => characters.join(''));

function setupDOM() {
  document.body.innerHTML = `
    <form id="todo-add-form">
      <input id="todo-input" />
      <span id="todo-input-error"></span>
    </form>
    <select id="todo-sort-select">
      <option value="oldest">Terlama</option>
      <option value="newest">Terbaru</option>
      <option value="status">Status</option>
    </select>
    <ul id="todo-list"></ul>
  `;
}

function initWidget(todos = [], sortOrder = 'oldest') {
  setupDOM();
  Storage.save.mockClear();
  TodoWidget.init(todos, sortOrder);
  Storage.save.mockClear();
}

function getSavedTodos() {
  const calls = Storage.save.mock.calls.filter(([key]) => key === 'ld_todos');
  expect(calls.length).toBeGreaterThan(0);
  return calls[calls.length - 1][1];
}

function getRenderedTodos() {
  return Array.from(document.querySelectorAll('#todo-list .todo-item'));
}

beforeEach(() => {
  setupDOM();
  vi.spyOn(Storage, 'save').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// Property 5: Validasi Input Tugas (sisi addTask)
// A whitespace-only task never changes the number of rendered items.
// Validates: Requirements 4.2, 4.5
// ---------------------------------------------------------------------------

describe('Property 5 — TodoWidget.addTask rejects whitespace-only input', () => {
  it('does not change the task count for any whitespace-only text', () => {
    fc.assert(
      fc.property(todoListArbitrary, whitespaceOnlyArbitrary, (initialTodos, text) => {
        initWidget(initialTodos);
        const initialCount = getRenderedTodos().length;

        TodoWidget.addTask(text);

        expect(getRenderedTodos()).toHaveLength(initialCount);
      }),
      { numRuns: 100 },
    );
  });
});

// ---------------------------------------------------------------------------
// Property 6: Mutasi Daftar Tugas (Tambah dan Hapus)
// Validates: Requirements 4.1, 4.8
// ---------------------------------------------------------------------------

describe('Property 6 — TodoWidget adds and removes tasks', () => {
  it('adds exactly one task with the trimmed text for any valid input', () => {
    fc.assert(
      fc.property(todoListArbitrary, validTaskTextArbitrary, (initialTodos, text) => {
        initWidget(initialTodos);
        const expectedCount = initialTodos.length + 1;

        TodoWidget.addTask(text);

        const savedTodos = getSavedTodos();
        expect(savedTodos).toHaveLength(expectedCount);
        expect(savedTodos.some((item) => item.text === text.trim())).toBe(true);
      }),
      { numRuns: 100 },
    );
  });

  it('deleting any selected task removes its ID and preserves the other tasks', () => {
    fc.assert(
      fc.property(
        fc.array(todoDataArbitrary, { minLength: 1, maxLength: 30 }),
        fc.nat(),
        (todoData, selectedIndex) => {
          const initialTodos = todoData.map((item, index) => ({
            ...item,
            id: `generated-${index}`,
          }));
          const target = initialTodos[selectedIndex % initialTodos.length];
          const expectedRemainingIds = initialTodos
            .filter((item) => item.id !== target.id)
            .map((item) => item.id)
            .sort();

          initWidget(initialTodos);
          TodoWidget.deleteTask(target.id);

          const savedTodos = getSavedTodos();
          expect(savedTodos).toHaveLength(initialTodos.length - 1);
          expect(savedTodos.some((item) => item.id === target.id)).toBe(false);
          expect(savedTodos.map((item) => item.id).sort()).toEqual(expectedRemainingIds);
        },
      ),
      { numRuns: 100 },
    );
  });
});

// ---------------------------------------------------------------------------
// Property 7: Toggle Status Tugas (Round-Trip)
// Two toggles restore the original completed state.
// Validates: Requirements 4.6, 4.7
// ---------------------------------------------------------------------------

describe('Property 7 — TodoWidget.toggleComplete is a round-trip', () => {
  it('double-toggle restores either initial completed state', () => {
    fc.assert(
      fc.property(todoDataArbitrary, (todo) => {
        const initialTodo = { ...todo, id: 'toggle-target' };
        const initialCompleted = initialTodo.completed;
        initWidget([initialTodo]);

        TodoWidget.toggleComplete(initialTodo.id);
        TodoWidget.toggleComplete(initialTodo.id);

        const savedTodo = getSavedTodos().find((item) => item.id === initialTodo.id);
        expect(savedTodo).toBeDefined();
        expect(savedTodo.completed).toBe(initialCompleted);
      }),
      { numRuns: 100 },
    );
  });
});

// ---------------------------------------------------------------------------
// Property 8: Edit Tugas Memperbarui Teks
// Editing changes only the text and preserves identity and task metadata.
// Validates: Requirements 4.3, 4.4
// ---------------------------------------------------------------------------

describe('Property 8 — TodoWidget.saveEdit preserves task identity and metadata', () => {
  it('updates the text while preserving id, completed, and createdAt', () => {
    const distinctEditedTextArbitrary = fc
      .tuple(todoDataArbitrary, validTaskTextArbitrary)
      .filter(([todo, newText]) => todo.text.trim() !== newText.trim());

    fc.assert(
      fc.property(distinctEditedTextArbitrary, ([todo, newText]) => {
        const initialTodo = { ...todo, id: 'edit-target' };
        initWidget([initialTodo]);

        TodoWidget.saveEdit(initialTodo.id, newText);

        const savedTodo = getSavedTodos().find((item) => item.id === initialTodo.id);
        expect(savedTodo).toBeDefined();
        expect(savedTodo.text).toBe(newText.trim());
        expect(savedTodo.id).toBe(initialTodo.id);
        expect(savedTodo.completed).toBe(initialTodo.completed);
        expect(savedTodo.createdAt).toBe(initialTodo.createdAt);
      }),
      { numRuns: 100 },
    );
  });
});

// ---------------------------------------------------------------------------
// Property 9: Urutan Pengurutan Tugas
// Every sort mode keeps all tasks and satisfies its ordering invariant.
// Validates: Requirements 5.2, 5.3
// ---------------------------------------------------------------------------

describe('Property 9 — TodoWidget.applySortOrder preserves tasks and sort invariants', () => {
  it('sorts oldest, newest, and status order without losing or duplicating tasks', () => {
    fc.assert(
      fc.property(
        todoListArbitrary,
        fc.constantFrom('oldest', 'newest', 'status'),
        (initialTodos, order) => {
          initWidget(initialTodos);
          const expectedIds = initialTodos.map((item) => item.id).sort();
          const todoDetailsById = new Map(
            initialTodos.map((item) => [item.id, { createdAt: item.createdAt, completed: item.completed }]),
          );

          TodoWidget.applySortOrder(order);

          const renderedItems = getRenderedTodos();
          const renderedTodos = renderedItems.map((item) => todoDetailsById.get(item.dataset.id));
          expect(renderedItems).toHaveLength(initialTodos.length);
          expect(renderedItems.map((item) => item.dataset.id).sort()).toEqual(expectedIds);

          if (order === 'oldest') {
            for (let index = 1; index < renderedTodos.length; index += 1) {
              expect(renderedTodos[index - 1].createdAt).toBeLessThanOrEqual(
                renderedTodos[index].createdAt,
              );
            }
          } else if (order === 'newest') {
            for (let index = 1; index < renderedTodos.length; index += 1) {
              expect(renderedTodos[index - 1].createdAt).toBeGreaterThanOrEqual(
                renderedTodos[index].createdAt,
              );
            }
          } else {
            let hasCompletedTask = false;
            for (const item of renderedTodos) {
              if (item.completed) {
                hasCompletedTask = true;
              } else {
                expect(hasCompletedTask).toBe(false);
              }
            }
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});
