// tests/property/quicklinks.property.test.js — Property-based tests for js/quicklinks.js
// Feature: life-dashboard
// Property 10: Validasi URL dan Label Quick Link (sisi addLink)
// Validates: Requirements 6.3, 6.4
// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import fc from 'fast-check';
import QuickLinksWidget from '../../js/quicklinks.js';
import Storage from '../../js/storage.js';

const validLabelArbitrary = fc
  .string({ minLength: 1, maxLength: 50 })
  .filter((label) => label.trim().length > 0);

const linkDataArbitrary = fc.record({
  label: validLabelArbitrary,
  url: fc.constantFrom('https://example.com', 'http://example.org'),
});

const initialLinksArbitrary = fc
  .array(linkDataArbitrary, { maxLength: 19 })
  .map((links) => links.map((link, index) => ({ ...link, id: `saved-${index}` })));

const invalidUrlArbitrary = fc
  .string()
  .filter((url) => {
    const trimmedUrl = url.trim();
    return !trimmedUrl.startsWith('http://') && !trimmedUrl.startsWith('https://');
  });

const whitespaceOnlyArbitrary = fc
  .array(fc.constantFrom(' ', '\t', '\n', '\r', '\f', '\v'), {
    minLength: 1,
    maxLength: 50,
  })
  .map((characters) => characters.join(''));

const invalidLabelArbitrary = fc.oneof(
  fc.constant(''),
  whitespaceOnlyArbitrary,
  fc.integer({ min: 51, max: 120 }).map((length) => 'L'.repeat(length)),
);

function setupDOM() {
  document.body.innerHTML = `
    <div id="quick-links-container"></div>
    <p id="quicklinks-limit-msg" hidden></p>
    <form id="quicklinks-add-form">
      <input id="quicklinks-label-input" type="text" />
      <span id="quicklinks-label-error"></span>
      <input id="quicklinks-url-input" type="url" />
      <span id="quicklinks-url-error"></span>
      <button type="submit" id="quicklinks-add-btn">Tambah Link</button>
    </form>
  `;
}

function initWidget(links) {
  setupDOM();
  Storage.save.mockClear();
  QuickLinksWidget.init(links);
  Storage.save.mockClear();
}

function snapshotLinks() {
  return QuickLinksWidget.links.map((link) => ({ ...link }));
}

beforeEach(() => {
  setupDOM();
  vi.spyOn(Storage, 'save').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('Property 10 — QuickLinksWidget.addLink validates input', () => {
  it('does not change or save the list for any URL without http:// or https://', () => {
    fc.assert(
      fc.property(
        initialLinksArbitrary,
        validLabelArbitrary,
        invalidUrlArbitrary,
        (initialLinks, label, invalidUrl) => {
          initWidget(initialLinks);
          const before = snapshotLinks();

          const added = QuickLinksWidget.addLink(label, invalidUrl);

          expect(added).toBe(false);
          expect(QuickLinksWidget.links).toEqual(before);
          expect(Storage.save).not.toHaveBeenCalled();
        },
      ),
      { numRuns: 100 },
    );
  });

  it('does not change or save the list for any empty, whitespace-only, or overlong label', () => {
    fc.assert(
      fc.property(
        initialLinksArbitrary,
        invalidLabelArbitrary,
        (initialLinks, invalidLabel) => {
          initWidget(initialLinks);
          const before = snapshotLinks();

          const added = QuickLinksWidget.addLink(invalidLabel, 'https://example.com');

          expect(added).toBe(false);
          expect(QuickLinksWidget.links).toEqual(before);
          expect(Storage.save).not.toHaveBeenCalled();
        },
      ),
      { numRuns: 100 },
    );
  });
});
