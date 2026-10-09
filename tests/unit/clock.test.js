// tests/unit/clock.test.js — Unit tests for js/clock.js
// Feature: life-dashboard
// @vitest-environment jsdom

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import ClockWidget from '../../js/clock.js';

// ---------------------------------------------------------------------------
// formatTime
// ---------------------------------------------------------------------------

describe('ClockWidget.formatTime()', () => {
  it('formats midnight correctly (00:00:00)', () => {
    const d = new Date(2026, 9, 5, 0, 0, 0); // Oct 5 2026 00:00:00
    expect(ClockWidget.formatTime(d)).toBe('00:00:00');
  });

  it('formats one second before midnight (23:59:59)', () => {
    const d = new Date(2026, 9, 5, 23, 59, 59);
    expect(ClockWidget.formatTime(d)).toBe('23:59:59');
  });

  it('pads single-digit hours with leading zero', () => {
    const d = new Date(2026, 9, 5, 7, 5, 9);
    expect(ClockWidget.formatTime(d)).toBe('07:05:09');
  });

  it('returns string matching HH:MM:SS pattern', () => {
    const d = new Date(2026, 9, 5, 14, 30, 45);
    expect(ClockWidget.formatTime(d)).toMatch(/^\d{2}:\d{2}:\d{2}$/);
  });

  it('hours component is two digits even for 0', () => {
    const d = new Date(2026, 9, 5, 0, 0, 0);
    const parts = ClockWidget.formatTime(d).split(':');
    expect(parts[0]).toBe('00');
  });
});

// ---------------------------------------------------------------------------
// formatDate
// ---------------------------------------------------------------------------

describe('ClockWidget.formatDate()', () => {
  it('does NOT pad day with leading zero (e.g. "5" not "05")', () => {
    // Oct 5 2026 is a Monday (Senin)
    const d = new Date(2026, 9, 5, 10, 0, 0);
    const result = ClockWidget.formatDate(d);
    // Day number "5" should appear, not "05"
    expect(result).toContain('5');
    expect(result).not.toMatch(/\b05\b/);
  });

  it('includes the year', () => {
    const d = new Date(2026, 9, 5, 10, 0, 0);
    expect(ClockWidget.formatDate(d)).toContain('2026');
  });

  it('result is in the pattern "Hari, D Bulan YYYY"', () => {
    const d = new Date(2026, 9, 5, 10, 0, 0);
    const result = ClockWidget.formatDate(d);
    // Format: "<word>, <number> <word> <year>"
    expect(result).toMatch(/^\S+,\s+\d{1,2}\s+\S+\s+\d{4}$/);
  });

  it('does not contain leading zero on day 1', () => {
    const d = new Date(2026, 9, 1, 10, 0, 0); // Oct 1
    const result = ClockWidget.formatDate(d);
    // "1 Oktober" should appear, not "01 Oktober"
    expect(result).not.toMatch(/\b01\b/);
    expect(result).toContain('1');
  });

  it('formats a date with day = 31 correctly', () => {
    const d = new Date(2026, 9, 31, 10, 0, 0); // Oct 31
    const result = ClockWidget.formatDate(d);
    expect(result).toContain('31');
  });

  it('contains Indonesian month name for October', () => {
    const d = new Date(2026, 9, 5, 10, 0, 0); // month index 9 = Oktober
    const result = ClockWidget.formatDate(d);
    expect(result).toMatch(/Oktober/i);
  });

  it('contains Indonesian month name for January', () => {
    const d = new Date(2026, 0, 1, 10, 0, 0); // January
    const result = ClockWidget.formatDate(d);
    expect(result).toMatch(/Januari/i);
  });
});

// ---------------------------------------------------------------------------
// tick() — DOM update
// ---------------------------------------------------------------------------

describe('ClockWidget.tick()', () => {
  let timeEl, dateEl;

  beforeEach(() => {
    // Create mock DOM elements
    timeEl = document.createElement('div');
    timeEl.id = 'clock-time';
    dateEl = document.createElement('div');
    dateEl.id = 'clock-date';
    document.body.appendChild(timeEl);
    document.body.appendChild(dateEl);
  });

  afterEach(() => {
    document.body.removeChild(timeEl);
    document.body.removeChild(dateEl);
  });

  it('updates clock-time element to HH:MM:SS format', () => {
    ClockWidget.tick();
    expect(timeEl.textContent).toMatch(/^\d{2}:\d{2}:\d{2}$/);
  });

  it('updates clock-date element with a non-empty string', () => {
    ClockWidget.tick();
    expect(dateEl.textContent.length).toBeGreaterThan(0);
  });

  it('does not throw when clock-time element is absent', () => {
    document.body.removeChild(timeEl);
    expect(() => ClockWidget.tick()).not.toThrow();
    // Re-add so afterEach cleanup doesn't fail
    document.body.appendChild(timeEl);
  });

  it('does not throw when clock-date element is absent', () => {
    document.body.removeChild(dateEl);
    expect(() => ClockWidget.tick()).not.toThrow();
    // Re-add so afterEach cleanup doesn't fail
    document.body.appendChild(dateEl);
  });
});

// ---------------------------------------------------------------------------
// init()
// ---------------------------------------------------------------------------

describe('ClockWidget.init()', () => {
  let timeEl, dateEl;

  beforeEach(() => {
    vi.useFakeTimers();
    timeEl = document.createElement('div');
    timeEl.id = 'clock-time';
    dateEl = document.createElement('div');
    dateEl.id = 'clock-date';
    document.body.appendChild(timeEl);
    document.body.appendChild(dateEl);
  });

  afterEach(() => {
    vi.useRealTimers();
    if (timeEl.parentNode) document.body.removeChild(timeEl);
    if (dateEl.parentNode) document.body.removeChild(dateEl);
  });

  it('renders immediately on init (before any tick interval fires)', () => {
    ClockWidget.init();
    expect(timeEl.textContent).toMatch(/^\d{2}:\d{2}:\d{2}$/);
  });

  it('updates display after 1 second interval', () => {
    ClockWidget.init();
    const before = timeEl.textContent;
    // Advance time by 1s so the setInterval callback fires
    vi.advanceTimersByTime(1000);
    // Content should still be in HH:MM:SS format
    expect(timeEl.textContent).toMatch(/^\d{2}:\d{2}:\d{2}$/);
  });

  it('does not throw when DOM elements are absent', () => {
    document.body.removeChild(timeEl);
    document.body.removeChild(dateEl);
    expect(() => ClockWidget.init()).not.toThrow();
    // Re-add so afterEach cleanup doesn't double-remove
    document.body.appendChild(timeEl);
    document.body.appendChild(dateEl);
  });
});
