// tests/property/timer.property.test.js — Property-based tests for js/timer.js
// Feature: life-dashboard
// @vitest-environment jsdom

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fc from 'fast-check';
import { TimerWidget } from '../../js/timer.js';

// ---------------------------------------------------------------------------
// DOM Setup Helpers
// ---------------------------------------------------------------------------

function setupDOM() {
  const startBtn = document.createElement('button');
  startBtn.id = 'timer-start-btn';

  const stopBtn = document.createElement('button');
  stopBtn.id = 'timer-stop-btn';

  const resetBtn = document.createElement('button');
  resetBtn.id = 'timer-reset-btn';

  const display = document.createElement('div');
  display.id = 'timer-display';

  const indicator = document.createElement('div');
  indicator.id = 'timer-complete-indicator';

  document.body.appendChild(startBtn);
  document.body.appendChild(stopBtn);
  document.body.appendChild(resetBtn);
  document.body.appendChild(display);
  document.body.appendChild(indicator);
}

function teardownDOM() {
  ['timer-start-btn', 'timer-stop-btn', 'timer-reset-btn', 'timer-display', 'timer-complete-indicator']
    .forEach(id => {
      const el = document.getElementById(id);
      if (el) el.remove();
    });
}

beforeEach(() => {
  setupDOM();
});

afterEach(() => {
  teardownDOM();
});

// ---------------------------------------------------------------------------
// Property 13: Format Timer (MM:SS)
// For any integer seconds in [0, 1500], formatTime(seconds) returns MM:SS
// and the represented total seconds equals the input.
// Validates: Requirements 3.1, 3.3
// ---------------------------------------------------------------------------

describe('P13 — TimerWidget.formatTime: output always matches MM:SS pattern', () => {
  // Feature: life-dashboard, Property 13: format timer MM:SS pattern
  it('result always matches /^\\d{2}:\\d{2}$/ for any seconds in [0, 1500]', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 1500 }), (seconds) => {
        const result = TimerWidget.formatTime(seconds);
        expect(result).toMatch(/^\d{2}:\d{2}$/);
      }),
      { numRuns: 200 }
    );
  });

  // Feature: life-dashboard, Property 13: format timer — minutes component range
  it('minutes component (MM) is always in range [00, 25]', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 1500 }), (seconds) => {
        const result = TimerWidget.formatTime(seconds);
        const mm = parseInt(result.split(':')[0], 10);
        expect(mm).toBeGreaterThanOrEqual(0);
        expect(mm).toBeLessThanOrEqual(25);
      }),
      { numRuns: 200 }
    );
  });

  // Feature: life-dashboard, Property 13: format timer — seconds component range
  it('seconds component (SS) is always in range [00, 59]', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 1500 }), (seconds) => {
        const result = TimerWidget.formatTime(seconds);
        const ss = parseInt(result.split(':')[1], 10);
        expect(ss).toBeGreaterThanOrEqual(0);
        expect(ss).toBeLessThanOrEqual(59);
      }),
      { numRuns: 200 }
    );
  });

  // Feature: life-dashboard, Property 13: format timer — round-trip total seconds
  it('round-trip: (MM * 60 + SS) equals the original seconds input', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 1500 }), (seconds) => {
        const result = TimerWidget.formatTime(seconds);
        const parts = result.split(':');
        const mm = parseInt(parts[0], 10);
        const ss = parseInt(parts[1], 10);
        const roundTrip = mm * 60 + ss;
        expect(roundTrip).toBe(seconds);
      }),
      { numRuns: 200 }
    );
  });

  // Feature: life-dashboard, Property 13: format timer — each component exactly 2 chars
  it('each component is exactly 2 characters wide (leading zeros preserved)', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 1500 }), (seconds) => {
        const parts = TimerWidget.formatTime(seconds).split(':');
        expect(parts).toHaveLength(2);
        parts.forEach((part) => expect(part).toHaveLength(2));
      }),
      { numRuns: 200 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 14: Invariant Tombol Timer
// For any isRunning boolean + remainingSeconds in [0, 1500],
// updateButtons sets disabled states on buttons correctly.
// Validates: Requirements 3.7, 3.8, 3.9
// ---------------------------------------------------------------------------

describe('P14 — TimerWidget.updateButtons: button disabled state invariant', () => {
  // Feature: life-dashboard, Property 14: timer button invariant — running state
  it('when isRunning=true: Start disabled, Stop enabled (Req 3.7)', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 1500 }), (remainingSeconds) => {
        // Set up internal state so updateButtons can reflect it
        TimerWidget._setState(remainingSeconds, true, null);
        TimerWidget.updateButtons(true, false);

        const startBtn = document.getElementById('timer-start-btn');
        const stopBtn = document.getElementById('timer-stop-btn');

        expect(startBtn.disabled).toBe(true);
        expect(stopBtn.disabled).toBe(false);
      }),
      { numRuns: 200 }
    );
  });

  // Feature: life-dashboard, Property 14: timer button invariant — stopped state
  it('when isRunning=false and not completed: Stop disabled (Req 3.8)', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 1500 }), (remainingSeconds) => {
        TimerWidget._setState(remainingSeconds, false, null);
        TimerWidget.updateButtons(false, false);

        const startBtn = document.getElementById('timer-start-btn');
        const stopBtn = document.getElementById('timer-stop-btn');

        expect(stopBtn.disabled).toBe(true);
        expect(startBtn.disabled).toBe(false);
      }),
      { numRuns: 200 }
    );
  });

  // Feature: life-dashboard, Property 14: timer button invariant — completed state
  it('when isRunning=false and completed=true: Stop disabled, Start and Reset enabled (Req 3.9)', () => {
    fc.assert(
      fc.property(fc.boolean(), (isRunning) => {
        // completed overrides running: always treat as completed (isRunning=false)
        TimerWidget._setState(0, false, null);
        TimerWidget.updateButtons(false, true);

        const startBtn = document.getElementById('timer-start-btn');
        const stopBtn = document.getElementById('timer-stop-btn');
        const resetBtn = document.getElementById('timer-reset-btn');

        expect(stopBtn.disabled).toBe(true);
        expect(startBtn.disabled).toBe(false);
        expect(resetBtn.disabled).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  // Feature: life-dashboard, Property 14: timer button invariant — isRunning / not-running combined
  it('Stop is ALWAYS disabled when isRunning=false (regardless of seconds remaining)', () => {
    fc.assert(
      fc.property(
        fc.boolean(), // completed flag
        fc.integer({ min: 0, max: 1500 }), // remainingSeconds
        (completed, remainingSeconds) => {
          TimerWidget._setState(remainingSeconds, false, null);
          TimerWidget.updateButtons(false, completed);

          const stopBtn = document.getElementById('timer-stop-btn');
          expect(stopBtn.disabled).toBe(true);
        }
      ),
      { numRuns: 200 }
    );
  });

  // Feature: life-dashboard, Property 14: timer button invariant — Start is ALWAYS disabled when running
  it('Start is ALWAYS disabled when isRunning=true (regardless of seconds remaining)', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 1500 }), (remainingSeconds) => {
        TimerWidget._setState(remainingSeconds, true, null);
        TimerWidget.updateButtons(true, false);

        const startBtn = document.getElementById('timer-start-btn');
        expect(startBtn.disabled).toBe(true);
      }),
      { numRuns: 200 }
    );
  });
});
