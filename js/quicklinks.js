// js/quicklinks.js — Quick Links Widget
// Feature: life-dashboard
// Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 6.9

import Storage, { KEYS } from './storage.js';
import Validator from './validator.js';

const MAX_LINKS = 20;

/**
 * Generate an ID for a QuickLink.
 * @returns {string}
 */
function generateId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

/** @typedef {{ id: string, label: string, url: string }} QuickLink */

/**
 * Quick Links widget. The links array is kept in memory and persisted after
 * each successful add or delete operation.
 */
const QuickLinksWidget = {
  /** @type {QuickLink[]} */
  links: [],

  /**
   * Initialize the widget with saved links and wire up the form.
   * @param {QuickLink[]} initialLinks
   */
  init(initialLinks = []) {
    this.links = Array.isArray(initialLinks)
      ? initialLinks
          .filter((link) =>
            link &&
            typeof link.id === 'string' &&
            typeof link.label === 'string' &&
            Validator.validateLinkLabel(link.label).valid &&
            _isAllowedUrl(link.url),
          )
          .slice(0, MAX_LINKS)
      : [];

    const form = _el('quicklinks-add-form');
    if (form) {
      // Let our inline validator handle malformed URLs instead of the browser's
      // native form validation preventing the submit event.
      form.noValidate = true;
      form.addEventListener('submit', (event) => {
        event.preventDefault();
        const labelInput = _el('quicklinks-label-input');
        const urlInput = _el('quicklinks-url-input');
        this.addLink(labelInput ? labelInput.value : '', urlInput ? urlInput.value : '');
      });
    }

    const labelInput = _el('quicklinks-label-input');
    if (labelInput) {
      labelInput.addEventListener('input', () => _clearError('quicklinks-label-error'));
    }

    const urlInput = _el('quicklinks-url-input');
    if (urlInput) {
      urlInput.addEventListener('input', () => _clearError('quicklinks-url-error'));
    }

    this.render();
  },

  /**
   * Validate and add a link. Returns true when the link was added.
   * @param {string} label
   * @param {string} url
   * @returns {boolean}
   */
  addLink(label, url) {
    const normalizedLabel = typeof label === 'string' ? label.trim() : label;
    const normalizedUrl = typeof url === 'string' ? url.trim() : url;
    const labelResult = Validator.validateLinkLabel(normalizedLabel);
    const urlResult = Validator.validateLinkUrl(normalizedUrl);

    _setError('quicklinks-label-error', labelResult.valid ? '' : labelResult.errorMessage);
    _setError('quicklinks-url-error', urlResult.valid ? '' : urlResult.errorMessage);

    if (!labelResult.valid || !urlResult.valid) {
      return false;
    }

    if (this.links.length >= MAX_LINKS) {
      this._updateLimitState();
      return false;
    }

    this.links.push({
      id: generateId(),
      label: normalizedLabel,
      url: normalizedUrl,
    });

    const labelInput = _el('quicklinks-label-input');
    const urlInput = _el('quicklinks-url-input');
    if (labelInput) labelInput.value = '';
    if (urlInput) urlInput.value = '';

    this.render();
    Storage.save(KEYS.QUICK_LINKS, this.links);
    return true;
  },

  /**
   * Delete a link by ID, then render and persist the remaining links.
   * @param {string} id
   * @returns {boolean}
   */
  deleteLink(id) {
    const nextLinks = this.links.filter((link) => link.id !== id);
    if (nextLinks.length === this.links.length) {
      return false;
    }

    this.links = nextLinks;
    this.render();
    Storage.save(KEYS.QUICK_LINKS, this.links);
    return true;
  },

  /** Render all links and synchronize the 20-link limit controls. */
  render() {
    const container = _el('quick-links-container');
    if (container) {
      container.replaceChildren();

      if (this.links.length === 0) {
        const emptyMessage = document.createElement('p');
        emptyMessage.className = 'quicklinks-empty';
        emptyMessage.textContent = 'Belum ada tautan.';
        container.appendChild(emptyMessage);
      } else {
        this.links.forEach((link) => {
          const item = document.createElement('div');
          item.className = 'quicklink-item';

          const anchor = document.createElement('a');
          anchor.className = 'quicklink-button';
          anchor.textContent = String(link.label ?? '');
          anchor.href = _isAllowedUrl(link.url) ? link.url.trim() : '#';
          anchor.target = '_blank';
          anchor.rel = 'noopener noreferrer';

          const deleteButton = document.createElement('button');
          deleteButton.type = 'button';
          deleteButton.className = 'quicklink-delete-btn';
          deleteButton.textContent = 'Hapus';
          deleteButton.setAttribute('aria-label', `Hapus tautan: ${String(link.label ?? '')}`);
          deleteButton.addEventListener('click', () => this.deleteLink(link.id));

          item.append(anchor, deleteButton);
          container.appendChild(item);
        });
      }
    }

    this._updateLimitState();
  },

  /** Keep the add button and limit notice in sync with the current list. */
  _updateLimitState() {
    const limitReached = this.links.length >= MAX_LINKS;
    const addButton = _el('quicklinks-add-btn');
    const limitMessage = _el('quicklinks-limit-msg');

    if (addButton) addButton.disabled = limitReached;
    if (limitMessage) limitMessage.hidden = !limitReached;
  },
};

/**
 * Safely look up an element by ID.
 * @param {string} id
 * @returns {HTMLElement|null}
 */
function _el(id) {
  if (typeof document === 'undefined') return null;
  return document.getElementById(id);
}

/** Set or clear an inline validation message. */
function _setError(id, message) {
  const element = _el(id);
  if (element) element.textContent = message ?? '';
}

/** Clear an inline validation message. */
function _clearError(id) {
  _setError(id, '');
}

/** Only allow links with the protocols accepted by the validator. */
function _isAllowedUrl(url) {
  return typeof url === 'string' && Validator.validateLinkUrl(url.trim()).valid;
}

export { QuickLinksWidget, generateId };
export default QuickLinksWidget;
