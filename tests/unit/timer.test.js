// tests/unit/timer.test.js — Unit tests for js/timer.js
// Feature: life-dashboard
// Requirements: 3.2, 3.4, 3.5, 3.7, 3.8, 3.9
// @vitest-environment jsdom

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import TimerWidget from '../../js/timer.js';

// ---------------------------------------------------------------------------
// DOM Setup Helpers
// ---------------------------------------------------------------------------

/**
 * Create the minimal DOM elements that timer.js manipulates.
 * Returns an object of all created elements for easy access.
 */
function setupDOM() {
  const display = document.createElement('div');
  display.id = 'timer-display';

  const startBtn = document.createElement('button');
  startBtn.id = 'timer-start-btn';

  const stopBtn = document.createElement('button');
  stopBtn.id = 'timer-stop-btn';

  const resetBtn = document.createElement('button');
  resetBtn.id = 'timer-reset-btn';

  const indicator = document.createElement('div');
  indicator.id = 'timer-complete-indicator';

  document.body.appendChild(display);
  document.body.appendChild(startBtn);
  document.body.appendChild(stopBtn);
  document.body.appendChild(resetBtn);
  document.body.appendChild(indicator);

  return { display, startBtn, stopBtn, resetBtn, indicator };
}

function teardownDOM() {
  ['timer-display', 'timer-start-btn', 'timer-stop-btn', 'timer-reset-btn', 'timer-complete-indicator']
    .forEach(id => {
      const el = document.getElementById(id);
      if (el) el.remove();
    });
}

// ---------------------------------------------------------------------------
// Global test setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.useFakeTimers();

  // Stub AudioContext so onComplete() doesn't throw in jsdom
  globalThis.AudioContext = vi.fn(() => ({
    createOscillator: vi.fn(() => ({
      connect: vi.fn(),
      type: 'sine',
      frequency: { setValueAtTime: vi.fn() },
      start: vi.fn(),
      stop: vi.fn(),
      addEventListener: vi.fn(),
    })),
    createGain: vi.fn(() => ({
      connect: vi.fn(),
      gain: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
    })),
    currentTime: 0,
    destination: {},
    close: vi.fn().mockResolvedValue(undefined),
  }));

  setupDOM();
  // Always init to a clean state before each test
  TimerWidget.init();
});

afterEach(() => {
  vi.useRealTimers();
  teardownDOM();
  delete globalThis.AudioContext;
});

// ---------------------------------------------------------------------------
// formatTime()
// ---------------------------------------------------------------------------

describe('TimerWidget.formatTime()', () => {
  it('formats 1500 seconds as "25:00"', () => {
    expect(TimerWidget.formatTime(1500)).toBe('25:00');
  });

  it('formats 0 seconds as "00:00"', () => {
    expect(TimerWidget.formatTime(0)).toBe('00:00');
  });

  it('formats 90 seconds as "01:30"', () => {
    expect(TimerWidget.formatTime(90)).toBe('01:30');
  });

  it('formats 61 seconds as "01:01"', () => {
    expect(TimerWidget.formatTime(61)).toBe('01:01');
  });

  it('pads single-digit minutes and seconds with leading zero', () => {
    expect(TimerWidget.formatTime(9)).toBe('00:09');
  });
});

// ---------------------------------------------------------------------------
// start → stop → resume (Requirement 3.2, 3.4)
// ---------------------------------------------------------------------------

describe('start → stop → resume — remainingSeconds tidak berubah saat stop', () => {
  it('start() sets isRunning to true', () => {
    TimerWidget.start();
    expect(TimerWidget.isRunning).toBe(true);
  });

  it('start() creates an intervalId', () => {
    TimerWidget.start();
    expect(TimerWidget.intervalId).not.toBeNull();
  });

  it('stop() sets isRunning to false (Req 3.4)', () => {
    TimerWidget.start();
    TimerWidget.stop();
    expect(TimerWidget.isRunning).toBe(false);
  });

  it('stop() clears the intervalId (Req 3.4)', () => {
    TimerWidget.start();
    TimerWidget.stop();
    expect(TimerWidget.intervalId).toBeNull();
  });

  it('stop() preserves remainingSeconds — hitung mundur berhenti di waktu tersisa (Req 3.4)', () => {
    TimerWidget.start();
    vi.advanceTimersByTime(3000); // 3 ticks → remainingSeconds = 1497
    const beforeStop = TimerWidget.remainingSeconds;
    expect(beforeStop).toBe(1497);

    TimerWidget.stop();
    // remainingSeconds TIDAK boleh berubah setelah stop
    expect(TimerWidget.remainingSeconds).toBe(beforeStop);
  });

  it('start() setelah stop() melanjutkan dari waktu tersisa — bukan dari 1500 (Req 3.2)', () => {
    TimerWidget.start();
    vi.advanceTimersByTime(5000); // 5 ticks → 1495
    TimerWidget.stop();

    const afterStop = TimerWidget.remainingSeconds; // 1495
    TimerWidget.start(); // lanjutkan
    vi.advanceTimersByTime(2000); // 2 ticks lebih lanjut

    expect(TimerWidget.remainingSeconds).toBe(afterStop - 2); // 1493
  });

  it('start() tidak melakukan apa-apa jika timer sudah berjalan', () => {
    TimerWidget.start();
    const firstInterval = TimerWidget.intervalId;
    TimerWidget.start(); // pemanggilan kedua
    expect(TimerWidget.intervalId).toBe(firstInterval); // interval tidak berubah
  });

  it('stop() tidak melempar error jika dipanggil saat timer tidak berjalan', () => {
    expect(() => TimerWidget.stop()).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// reset() dari berbagai state (Requirement 3.5)
// ---------------------------------------------------------------------------

describe('reset() dari berbagai state (Req 3.5)', () => {
  it('reset() dari state RUNNING: menghentikan dan mengembalikan ke 1500', () => {
    TimerWidget.start();
    vi.advanceTimersByTime(4000); // 4 ticks

    TimerWidget.reset();

    expect(TimerWidget.isRunning).toBe(false);
    expect(TimerWidget.intervalId).toBeNull();
    expect(TimerWidget.remainingSeconds).toBe(1500);
  });

  it('reset() dari state STOPPED (paused): mengembalikan ke 1500', () => {
    TimerWidget.start();
    vi.advanceTimersByTime(3000); // 3 ticks → 1497
    TimerWidget.stop();

    TimerWidget.reset();

    expect(TimerWidget.isRunning).toBe(false);
    expect(TimerWidget.remainingSeconds).toBe(1500);
  });

  it('reset() dari state COMPLETED (00:00): mengembalikan ke 1500', () => {
    // Paksa timer ke state completed
    TimerWidget._setState(1, false, null);
    TimerWidget.start();
    vi.advanceTimersByTime(1000); // 1 tick → hits 0, onComplete dipanggil

    expect(TimerWidget.remainingSeconds).toBe(0);

    TimerWidget.reset();

    expect(TimerWidget.remainingSeconds).toBe(1500);
    expect(TimerWidget.isRunning).toBe(false);
  });

  it('reset() dari state IDLE (belum pernah dimulai): tetap 1500', () => {
    // Sudah di state awal setelah init()
    TimerWidget.reset();
    expect(TimerWidget.remainingSeconds).toBe(1500);
    expect(TimerWidget.isRunning).toBe(false);
  });

  it('reset() memperbarui display ke "25:00"', () => {
    const display = document.getElementById('timer-display');
    TimerWidget.start();
    vi.advanceTimersByTime(5000);
    TimerWidget.reset();
    expect(display.textContent).toBe('25:00');
  });

  it('reset() menyembunyikan complete indicator', () => {
    const indicator = document.getElementById('timer-complete-indicator');
    // Paksa indicator menjadi tampak
    indicator.style.display = 'block';
    TimerWidget.reset();
    expect(indicator.style.display).toBe('none');
  });
});

// ---------------------------------------------------------------------------
// Completion dari remainingSeconds = 1 (Requirement 3.9)
// ---------------------------------------------------------------------------

describe('onComplete() — dipanggil saat remainingSeconds mencapai 0 (Req 3.9)', () => {
  it('timer selesai setelah 1 detik terakhir: remainingSeconds menjadi 0', () => {
    TimerWidget._setState(1, false, null);
    TimerWidget.start();
    vi.advanceTimersByTime(1000); // 1 tick

    expect(TimerWidget.remainingSeconds).toBe(0);
  });

  it('timer selesai: isRunning menjadi false', () => {
    TimerWidget._setState(1, false, null);
    TimerWidget.start();
    vi.advanceTimersByTime(1000);

    expect(TimerWidget.isRunning).toBe(false);
  });

  it('timer selesai: intervalId di-clear (menjadi null)', () => {
    TimerWidget._setState(1, false, null);
    TimerWidget.start();
    vi.advanceTimersByTime(1000);

    expect(TimerWidget.intervalId).toBeNull();
  });

  it('timer selesai: complete indicator ditampilkan', () => {
    const indicator = document.getElementById('timer-complete-indicator');
    TimerWidget._setState(1, false, null);
    TimerWidget.start();
    vi.advanceTimersByTime(1000);

    expect(indicator.style.display).toBe('block');
    expect(indicator.getAttribute('aria-hidden')).toBe('false');
  });

  it('display menampilkan "00:00" setelah completion', () => {
    const display = document.getElementById('timer-display');
    TimerWidget._setState(1, false, null);
    TimerWidget.start();
    vi.advanceTimersByTime(1000);

    expect(display.textContent).toBe('00:00');
  });

  it('start() tidak bisa memulai ulang timer yang sudah selesai (remainingSeconds === 0)', () => {
    TimerWidget._setState(1, false, null);
    TimerWidget.start();
    vi.advanceTimersByTime(1000);

    // Coba start lagi setelah completed
    TimerWidget.start();
    expect(TimerWidget.isRunning).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// updateButtons() — state disabled yang benar (Req 3.7, 3.8, 3.9)
// ---------------------------------------------------------------------------

describe('updateButtons() — disabled state tombol (Req 3.7, 3.8, 3.9)', () => {
  it('saat running=true: Mulai disabled, Berhenti enabled, Reset disabled (Req 3.7)', () => {
    const startBtn = document.getElementById('timer-start-btn');
    const stopBtn = document.getElementById('timer-stop-btn');
    const resetBtn = document.getElementById('timer-reset-btn');

    TimerWidget.updateButtons(true, false);

    expect(startBtn.disabled).toBe(true);
    expect(stopBtn.disabled).toBe(false);
    expect(resetBtn.disabled).toBe(true);
  });

  it('saat running=false, completed=false: Berhenti disabled, Mulai & Reset enabled (Req 3.8)', () => {
    const startBtn = document.getElementById('timer-start-btn');
    const stopBtn = document.getElementById('timer-stop-btn');
    const resetBtn = document.getElementById('timer-reset-btn');

    // Pastikan remainingSeconds > 0 (state awal = 1500)
    TimerWidget.updateButtons(false, false);

    expect(stopBtn.disabled).toBe(true);
    expect(startBtn.disabled).toBe(false);
    expect(resetBtn.disabled).toBe(false);
  });

  it('saat completed=true: Berhenti disabled, Mulai & Reset enabled (Req 3.9)', () => {
    const startBtn = document.getElementById('timer-start-btn');
    const stopBtn = document.getElementById('timer-stop-btn');
    const resetBtn = document.getElementById('timer-reset-btn');

    TimerWidget.updateButtons(false, true);

    expect(startBtn.disabled).toBe(false);
    expect(stopBtn.disabled).toBe(true);
    expect(resetBtn.disabled).toBe(false);
  });

  it('start() memanggil updateButtons dengan running=true → tombol Mulai disabled (Req 3.7)', () => {
    const startBtn = document.getElementById('timer-start-btn');
    TimerWidget.start();
    expect(startBtn.disabled).toBe(true);
  });

  it('stop() memanggil updateButtons dengan running=false → tombol Berhenti disabled (Req 3.8)', () => {
    const stopBtn = document.getElementById('timer-stop-btn');
    TimerWidget.start();
    TimerWidget.stop();
    expect(stopBtn.disabled).toBe(true);
  });

  it('onComplete() memanggil updateButtons dengan completed=true (Req 3.9)', () => {
    const startBtn = document.getElementById('timer-start-btn');
    const stopBtn = document.getElementById('timer-stop-btn');

    TimerWidget._setState(1, false, null);
    TimerWidget.start();
    vi.advanceTimersByTime(1000); // trigger onComplete

    expect(stopBtn.disabled).toBe(true);
    expect(startBtn.disabled).toBe(false);
  });

  it('updateButtons tidak melempar jika DOM element tidak ada', () => {
    teardownDOM(); // hapus semua elemen
    expect(() => TimerWidget.updateButtons(true, false)).not.toThrow();
    setupDOM(); // kembalikan DOM untuk afterEach
    TimerWidget.init();
  });
});
