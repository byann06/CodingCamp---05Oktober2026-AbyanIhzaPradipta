// tests/property/clock.property.test.js — Property-based tests for js/clock.js
// Feature: life-dashboard

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import ClockWidget from '../../js/clock.js';

// ---------------------------------------------------------------------------
// Property 1: Format Waktu Clock (HH:MM:SS)
// For any valid Date, formatTime returns a string matching HH:MM:SS
// Validates: Requirements 1.1
// ---------------------------------------------------------------------------

describe('P1 — ClockWidget.formatTime: output always matches HH:MM:SS', () => {
  it('matches /^\\d{2}:\\d{2}:\\d{2}$/ for any Date', () => {
    // Feature: life-dashboard, Property 1: formatTime clock
    fc.assert(
      fc.property(fc.date(), (date) => {
        const result = ClockWidget.formatTime(date);
        expect(result).toMatch(/^\d{2}:\d{2}:\d{2}$/);
      }),
      { numRuns: 100 }
    );
  });

  it('hours component is always in range [00, 23]', () => {
    fc.assert(
      fc.property(fc.date(), (date) => {
        const result = ClockWidget.formatTime(date);
        const hh = parseInt(result.split(':')[0], 10);
        expect(hh).toBeGreaterThanOrEqual(0);
        expect(hh).toBeLessThanOrEqual(23);
      }),
      { numRuns: 100 }
    );
  });

  it('minutes component is always in range [00, 59]', () => {
    fc.assert(
      fc.property(fc.date(), (date) => {
        const result = ClockWidget.formatTime(date);
        const mm = parseInt(result.split(':')[1], 10);
        expect(mm).toBeGreaterThanOrEqual(0);
        expect(mm).toBeLessThanOrEqual(59);
      }),
      { numRuns: 100 }
    );
  });

  it('seconds component is always in range [00, 59]', () => {
    fc.assert(
      fc.property(fc.date(), (date) => {
        const result = ClockWidget.formatTime(date);
        const ss = parseInt(result.split(':')[2], 10);
        expect(ss).toBeGreaterThanOrEqual(0);
        expect(ss).toBeLessThanOrEqual(59);
      }),
      { numRuns: 100 }
    );
  });

  it('each component is exactly 2 characters wide (leading zero preserved)', () => {
    fc.assert(
      fc.property(fc.date(), (date) => {
        const parts = ClockWidget.formatTime(date).split(':');
        expect(parts).toHaveLength(3);
        parts.forEach((part) => expect(part).toHaveLength(2));
      }),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 2: Format Tanggal Tanpa Leading Zero
// For any valid Date, formatDate day number has no leading zero
// Validates: Requirements 1.2
// ---------------------------------------------------------------------------

describe('P2 — ClockWidget.formatDate: day number has no leading zero', () => {
  it('day number extracted from result equals date.getDate() (no leading zero)', () => {
    // Feature: life-dashboard, Property 2: formatDate no leading zero
    fc.assert(
      fc.property(fc.date(), (date) => {
        const result = ClockWidget.formatDate(date);
        const expectedDay = date.getDate(); // 1–31, never 0-padded

        // The result should contain the plain number (e.g. "5" not "05")
        // Find the day token: second token after splitting by ", " then by " "
        // Format: "NamaHari, D NamaBulan YYYY"
        const afterComma = result.split(', ')[1]; // "D NamaBulan YYYY"
        if (afterComma) {
          const dayToken = afterComma.split(' ')[0];
          expect(dayToken).toBe(String(expectedDay));
        }
      }),
      { numRuns: 100 }
    );
  });

  it('result matches pattern "Word, N Word YYYY" (N has no leading zero)', () => {
    // Constrain to realistic positive-year dates (1970–9999)
    const realisticDate = fc.date({
      min: new Date('1970-01-01T00:00:00.000Z'),
      max: new Date('9999-12-31T23:59:59.999Z'),
    });
    fc.assert(
      fc.property(realisticDate, (date) => {
        const result = ClockWidget.formatDate(date);
        // Pattern: one-or-more word chars, comma-space, 1-2 digit day, space, month word, space, 1+-digit year
        expect(result).toMatch(/^\S+,\s+[1-9]\d{0,1}\s+\S+\s+\d+$/);
      }),
      { numRuns: 100 }
    );
  });

  it('result always contains the 4-digit year', () => {
    fc.assert(
      fc.property(fc.date(), (date) => {
        const result = ClockWidget.formatDate(date);
        const year = date.getFullYear();
        expect(result).toContain(String(year));
      }),
      { numRuns: 100 }
    );
  });
});
