// tests/property/greeting.property.test.js — Property-based tests for js/greeting.js
// Feature: life-dashboard
// @vitest-environment jsdom

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fc from 'fast-check';
import GreetingWidget from '../../js/greeting.js';

// ---------------------------------------------------------------------------
// Property 3: Pemetaan Jam ke Salam
// Feature: life-dashboard, Property 3: Pemetaan Jam ke Salam
// For any integer hour in [0, 23], getGreetingText returns exactly one of
// the four valid greetings and the correct one for that hour's range.
// Validates: Requirements 2.1, 2.2, 2.3, 2.4
// ---------------------------------------------------------------------------

const VALID_GREETINGS = ['Selamat Pagi', 'Selamat Siang', 'Selamat Sore', 'Selamat Malam'];

describe('P3 — GreetingWidget.getGreetingText: pemetaan jam ke salam', () => {
  it('always returns one of the four valid greetings for any hour in [0, 23]', () => {
    // Feature: life-dashboard, Property 3: Pemetaan Jam ke Salam
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 23 }), (hour) => {
        const result = GreetingWidget.getGreetingText(hour);
        expect(VALID_GREETINGS).toContain(result);
      }),
      { numRuns: 100 }
    );
  });

  it('returns "Selamat Pagi" for all hours in [5, 11] (Req 2.1)', () => {
    fc.assert(
      fc.property(fc.integer({ min: 5, max: 11 }), (hour) => {
        expect(GreetingWidget.getGreetingText(hour)).toBe('Selamat Pagi');
      }),
      { numRuns: 100 }
    );
  });

  it('returns "Selamat Siang" for all hours in [12, 14] (Req 2.2)', () => {
    fc.assert(
      fc.property(fc.integer({ min: 12, max: 14 }), (hour) => {
        expect(GreetingWidget.getGreetingText(hour)).toBe('Selamat Siang');
      }),
      { numRuns: 100 }
    );
  });

  it('returns "Selamat Sore" for all hours in [15, 17] (Req 2.3)', () => {
    fc.assert(
      fc.property(fc.integer({ min: 15, max: 17 }), (hour) => {
        expect(GreetingWidget.getGreetingText(hour)).toBe('Selamat Sore');
      }),
      { numRuns: 100 }
    );
  });

  it('returns "Selamat Malam" for all hours in [18, 23] ∪ [0, 4] (Req 2.4)', () => {
    // Build an arbitrary that picks from the two "Malam" sub-ranges
    const malamHour = fc.oneof(
      fc.integer({ min: 18, max: 23 }),
      fc.integer({ min: 0, max: 4 })
    );
    fc.assert(
      fc.property(malamHour, (hour) => {
        expect(GreetingWidget.getGreetingText(hour)).toBe('Selamat Malam');
      }),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 4: Salam Menyertakan Nama Pengguna
// Feature: life-dashboard, Property 4: Salam Menyertakan Nama Pengguna
// For any non-empty/non-whitespace username, render writes a textContent that
// contains the trimmed username.
// For empty/whitespace usernames, render writes a textContent that ends with
// "!" and does NOT contain a comma (no name fragment).
// Validates: Requirements 2.5, 2.6
// ---------------------------------------------------------------------------

describe('P4 — GreetingWidget.render: salam menyertakan nama pengguna', () => {
  let greetingEl;

  beforeEach(() => {
    greetingEl = document.createElement('div');
    greetingEl.id = 'greeting-text';
    document.body.appendChild(greetingEl);
  });

  afterEach(() => {
    if (greetingEl.parentNode) {
      document.body.removeChild(greetingEl);
    }
  });

  it('rendered text contains the trimmed username when username is non-empty (Req 2.5)', () => {
    // Feature: life-dashboard, Property 4: Salam Menyertakan Nama Pengguna
    const nonEmptyUsername = fc
      .string({ minLength: 1 })
      .filter((s) => s.trim().length > 0);

    fc.assert(
      fc.property(fc.constantFrom(...VALID_GREETINGS), nonEmptyUsername, (greetingText, username) => {
        GreetingWidget.render(greetingText, username);
        const content = greetingEl.textContent;
        // Must contain the trimmed name
        expect(content).toContain(username.trim());
        // Must follow pattern "${greetingText}, ${trimmedName}!"
        expect(content).toBe(`${greetingText}, ${username.trim()}!`);
      }),
      { numRuns: 100 }
    );
  });

  it('rendered text does NOT contain a name when username is empty string (Req 2.6)', () => {
    fc.assert(
      fc.property(fc.constantFrom(...VALID_GREETINGS), (greetingText) => {
        GreetingWidget.render(greetingText, '');
        const content = greetingEl.textContent;
        // Must follow pattern "${greetingText}!" with no comma
        expect(content).toBe(`${greetingText}!`);
        expect(content).not.toContain(',');
      }),
      { numRuns: 100 }
    );
  });

  it('rendered text does NOT contain a name when username is whitespace-only (Req 2.6)', () => {
    // Generate strings that are non-empty but all whitespace
    const whitespaceOnly = fc
      .string({ minLength: 1 })
      .filter((s) => s.length > 0 && s.trim().length === 0);

    fc.assert(
      fc.property(fc.constantFrom(...VALID_GREETINGS), whitespaceOnly, (greetingText, username) => {
        GreetingWidget.render(greetingText, username);
        const content = greetingEl.textContent;
        // Must follow pattern "${greetingText}!" with no comma
        expect(content).toBe(`${greetingText}!`);
        expect(content).not.toContain(',');
      }),
      { numRuns: 100 }
    );
  });
});
