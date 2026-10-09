// tests/unit/quicklinks.test.js — Unit tests for js/quicklinks.js
// Feature: life-dashboard
// Requirements: 6.2, 6.3, 6.4
// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import QuickLinksWidget from '../../js/quicklinks.js';
import Storage from '../../js/storage.js';

function setupDOM() {
  document.body.innerHTML = `
    <section id="quicklinks-widget">
      <div id="quick-links-container"></div>
      <p id="quicklinks-limit-msg" hidden>Batas maksimal 20 tautan tercapai.</p>
      <form id="quicklinks-add-form">
        <input id="quicklinks-label-input" type="text" />
        <span id="quicklinks-label-error"></span>
        <input id="quicklinks-url-input" type="url" />
        <span id="quicklinks-url-error"></span>
        <button type="submit" id="quicklinks-add-btn">Tambah Link</button>
      </form>
    </section>
  `;
}

function makeLinks(count) {
  return Array.from({ length: count }, (_, index) => ({
    id: `saved-link-${index + 1}`,
    label: `Link ${index + 1}`,
    url: `https://example.com/${index + 1}`,
  }));
}

function getRenderedLinkCount() {
  return document.querySelectorAll('#quick-links-container .quicklink-item').length;
}

beforeEach(() => {
  setupDOM();
  vi.spyOn(Storage, 'save').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('QuickLinksWidget link limit', () => {
  it('allows the 20th link to be added', () => {
    QuickLinksWidget.init(makeLinks(19));

    const added = QuickLinksWidget.addLink('Link 20', 'https://example.com/20');

    expect(added).toBe(true);
    expect(QuickLinksWidget.links).toHaveLength(20);
    expect(getRenderedLinkCount()).toBe(20);

    const saveCall = Storage.save.mock.calls.find(([key]) => key === 'ld_quick_links');
    expect(saveCall).toBeDefined();
    expect(saveCall[1]).toHaveLength(20);
  });

  it('rejects the 21st link without changing or saving the list', () => {
    const initialLinks = makeLinks(20);
    QuickLinksWidget.init(initialLinks);
    Storage.save.mockClear();

    const added = QuickLinksWidget.addLink('Link 21', 'https://example.com/21');

    expect(added).toBe(false);
    expect(QuickLinksWidget.links.map((link) => link.id)).toEqual(
      initialLinks.map((link) => link.id),
    );
    expect(getRenderedLinkCount()).toBe(20);
    expect(Storage.save).not.toHaveBeenCalled();
  });

  it('disables the add button and shows the limit message when there are 20 links', () => {
    QuickLinksWidget.init(makeLinks(20));

    expect(document.getElementById('quicklinks-add-btn').disabled).toBe(true);
    expect(document.getElementById('quicklinks-limit-msg').hidden).toBe(false);
  });
});
