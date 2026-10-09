// js/todo.js — To-Do List Widget
// Feature: life-dashboard
// Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9, 4.10, 4.11, 5.1, 5.2, 5.3, 5.4, 5.5, 5.6

import Validator from './validator.js';
import Storage from './storage.js';

/**
 * Generate a unique ID using crypto.randomUUID() with a fallback.
 * @returns {string}
 */
function generateId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

/**
 * @typedef {Object} TodoItem
 * @property {string} id
 * @property {string} text
 * @property {boolean} completed
 * @property {number} createdAt
 */

// Internal state
let todos = [];
let sortOrder = 'oldest';

const TodoWidget = {
  /**
   * Initialise the widget with data loaded from storage.
   * Wires up the add-task form and sort dropdown event listeners.
   *
   * @param {TodoItem[]} initialTodos
   * @param {string} initialSortOrder
   */
  init(initialTodos, initialSortOrder) {
    todos = Array.isArray(initialTodos) ? initialTodos : [];
    sortOrder = initialSortOrder || 'oldest';

    // Wire up the add-task form
    const form = _el('todo-add-form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const input = _el('todo-input');
        const text = input ? input.value : '';
        this.addTask(text);
      });
    }

    // Clear inline error when the user types
    const input = _el('todo-input');
    if (input) {
      input.addEventListener('input', () => {
        _clearError('todo-input-error');
      });
    }

    // Wire up the sort dropdown
    const sortSelect = _el('todo-sort-select');
    if (sortSelect) {
      // Set the dropdown to reflect the current saved order
      sortSelect.value = sortOrder;
      sortSelect.addEventListener('change', (e) => {
        this.applySortOrder(e.target.value);
      });
    }

    this.render();
  },

  /**
   * Add a new task after validation.
   * @param {string} text
   */
  addTask(text) {
    const result = Validator.validateTaskText(text);
    if (!result.valid) {
      _showError('todo-input-error', result.errorMessage);
      return;
    }

    const newItem = {
      id: generateId(),
      text: text.trim(),
      completed: false,
      createdAt: Date.now(),
    };

    todos.push(newItem);
    this.applySortOrder(sortOrder);

    // Clear the input field
    const input = _el('todo-input');
    if (input) {
      input.value = '';
    }
    _clearError('todo-input-error');

    Storage.save('ld_todos', todos);
  },

  /**
   * Switch a todo item into edit mode (pre-filled input).
   * @param {string} id
   */
  editTask(id) {
    this.render(id);
  },

  /**
   * Save the edited text for a task.
   * @param {string} id
   * @param {string} newText
   */
  saveEdit(id, newText) {
    const result = Validator.validateTaskText(newText);
    if (!result.valid) {
      _showError(`todo-edit-error-${id}`, result.errorMessage);
      return;
    }

    const item = todos.find((t) => t.id === id);
    if (item) {
      item.text = newText.trim();
    }

    this.render();
    Storage.save('ld_todos', todos);
  },

  /**
   * Cancel editing a task and return it to normal view.
   * @param {string} id
   */
  cancelEdit(id) {
    // Just re-render without editingId — item returns to normal display
    this.render();
  },

  /**
   * Toggle the completed status of a task.
   * @param {string} id
   */
  toggleComplete(id) {
    const item = todos.find((t) => t.id === id);
    if (item) {
      item.completed = !item.completed;
    }

    this.render();
    Storage.save('ld_todos', todos);
  },

  /**
   * Show inline delete confirmation for a task.
   * @param {string} id
   */
  confirmDelete(id) {
    this.render(null, id);
  },

  /**
   * Permanently delete a task.
   * @param {string} id
   */
  deleteTask(id) {
    todos = todos.filter((t) => t.id !== id);
    this.render();
    Storage.save('ld_todos', todos);
  },

  /**
   * Sort the todos array and re-render.
   * @param {'oldest'|'newest'|'status'} order
   */
  applySortOrder(order) {
    sortOrder = order;

    if (order === 'oldest') {
      todos.sort((a, b) => a.createdAt - b.createdAt);
    } else if (order === 'newest') {
      todos.sort((a, b) => b.createdAt - a.createdAt);
    } else if (order === 'status') {
      todos.sort((a, b) => {
        // Incomplete (false = 0) before complete (true = 1)
        if (a.completed === b.completed) return 0;
        return a.completed ? 1 : -1;
      });
    }

    Storage.save('ld_sort_order', sortOrder);
    this.render();
  },

  /**
   * Re-render the full todo list into the #todo-list container.
   * @param {string|null} [editingId] - ID of the item currently in edit mode
   * @param {string|null} [confirmingId] - ID of the item awaiting delete confirmation
   */
  render(editingId = null, confirmingId = null) {
    const list = _el('todo-list');
    if (!list) return;

    // Update the sort dropdown to reflect current state
    const sortSelect = _el('todo-sort-select');
    if (sortSelect && sortSelect.value !== sortOrder) {
      sortSelect.value = sortOrder;
    }

    if (todos.length === 0) {
      list.innerHTML = '<li class="todo-empty">Belum ada tugas. Tambahkan tugas pertamamu!</li>';
      return;
    }

    list.innerHTML = '';

    todos.forEach((item) => {
      const li = document.createElement('li');
      li.className = 'todo-item' + (item.completed ? ' todo-item--completed' : '');
      li.dataset.id = item.id;

      if (item.id === editingId) {
        // ── Edit mode ──────────────────────────────────────────────────
        li.innerHTML = _buildEditMode(item);

        // Wire Save button
        const saveBtn = li.querySelector('.todo-save-btn');
        if (saveBtn) {
          saveBtn.addEventListener('click', () => {
            const editInput = li.querySelector('.todo-edit-input');
            this.saveEdit(item.id, editInput ? editInput.value : '');
          });
        }

        // Wire Cancel button
        const cancelBtn = li.querySelector('.todo-cancel-btn');
        if (cancelBtn) {
          cancelBtn.addEventListener('click', () => {
            this.cancelEdit(item.id);
          });
        }

        // Clear inline edit error on input
        const editInput = li.querySelector('.todo-edit-input');
        if (editInput) {
          editInput.addEventListener('input', () => {
            const errEl = li.querySelector(`#todo-edit-error-${item.id}`);
            if (errEl) errEl.textContent = '';
          });
          // Focus the edit input
          setTimeout(() => editInput.focus(), 0);
        }
      } else if (item.id === confirmingId) {
        // ── Delete-confirm mode ────────────────────────────────────────
        li.innerHTML = _buildConfirmMode(item);

        const confirmYesBtn = li.querySelector('.todo-confirm-yes-btn');
        if (confirmYesBtn) {
          confirmYesBtn.addEventListener('click', () => {
            this.deleteTask(item.id);
          });
        }

        const confirmNoBtn = li.querySelector('.todo-confirm-no-btn');
        if (confirmNoBtn) {
          confirmNoBtn.addEventListener('click', () => {
            this.render(); // Cancel confirmation, back to normal
          });
        }
      } else {
        // ── Normal mode ────────────────────────────────────────────────
        li.innerHTML = _buildNormalMode(item);

        // Wire checkbox
        const checkbox = li.querySelector('.todo-checkbox');
        if (checkbox) {
          checkbox.addEventListener('change', () => {
            this.toggleComplete(item.id);
          });
        }

        // Wire Edit button
        const editBtn = li.querySelector('.todo-edit-btn');
        if (editBtn) {
          editBtn.addEventListener('click', () => {
            this.editTask(item.id);
          });
        }

        // Wire Delete button
        const deleteBtn = li.querySelector('.todo-delete-btn');
        if (deleteBtn) {
          deleteBtn.addEventListener('click', () => {
            this.confirmDelete(item.id);
          });
        }
      }

      list.appendChild(li);
    });
  },
};

// ── Private helpers ──────────────────────────────────────────────────────────

/**
 * Safely get an element by ID (returns null in non-browser environments).
 * @param {string} id
 * @returns {HTMLElement|null}
 */
function _el(id) {
  if (typeof document === 'undefined') return null;
  return document.getElementById(id);
}

/**
 * Show an inline error message in the element with the given ID.
 * @param {string} errorElId
 * @param {string} message
 */
function _showError(errorElId, message) {
  const el = _el(errorElId);
  if (el) el.textContent = message;
}

/**
 * Clear an inline error message.
 * @param {string} errorElId
 */
function _clearError(errorElId) {
  const el = _el(errorElId);
  if (el) el.textContent = '';
}

/**
 * Build the HTML string for a todo item in normal (view) mode.
 * @param {TodoItem} item
 * @returns {string}
 */
function _buildNormalMode(item) {
  const escapedText = _escapeHtml(item.text);
  const checkedAttr = item.completed ? ' checked' : '';
  const textStyle = item.completed
    ? ' style="text-decoration: line-through; opacity: 0.5;"'
    : '';
  const completedLabel = item.completed ? 'Tandai belum selesai' : 'Tandai selesai';

  return `
    <label class="todo-checkbox-label">
      <input
        type="checkbox"
        class="todo-checkbox"
        ${checkedAttr}
        aria-label="${completedLabel}: ${escapedText}"
      />
    </label>
    <span class="todo-text"${textStyle}>${escapedText}</span>
    <div class="todo-actions">
      <button type="button" class="todo-edit-btn" aria-label="Edit tugas: ${escapedText}">Edit</button>
      <button type="button" class="todo-delete-btn" aria-label="Hapus tugas: ${escapedText}">Hapus</button>
    </div>
  `.trim();
}

/**
 * Build the HTML string for a todo item in edit mode.
 * @param {TodoItem} item
 * @returns {string}
 */
function _buildEditMode(item) {
  const escapedText = _escapeHtml(item.text);
  return `
    <input
      type="text"
      class="todo-edit-input"
      value="${escapedText}"
      maxlength="200"
      aria-label="Edit teks tugas"
      autocomplete="off"
    />
    <div class="todo-edit-actions">
      <button type="button" class="todo-save-btn" aria-label="Simpan perubahan">Simpan</button>
      <button type="button" class="todo-cancel-btn" aria-label="Batalkan edit">Batal</button>
    </div>
    <span
      id="todo-edit-error-${item.id}"
      class="todo-edit-error"
      role="alert"
      aria-live="assertive"
    ></span>
  `.trim();
}

/**
 * Build the HTML string for a todo item in delete-confirmation mode.
 * @param {TodoItem} item
 * @returns {string}
 */
function _buildConfirmMode(item) {
  const escapedText = _escapeHtml(item.text);
  return `
    <span class="todo-confirm-msg">Hapus "<strong>${escapedText}</strong>"?</span>
    <div class="todo-confirm-actions">
      <button type="button" class="todo-confirm-yes-btn" aria-label="Konfirmasi hapus tugas">Ya, Hapus</button>
      <button type="button" class="todo-confirm-no-btn" aria-label="Batalkan hapus tugas">Batal</button>
    </div>
  `.trim();
}

/**
 * Escape HTML special characters to prevent XSS.
 * @param {string} text
 * @returns {string}
 */
function _escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export { TodoWidget, generateId };
export default TodoWidget;
