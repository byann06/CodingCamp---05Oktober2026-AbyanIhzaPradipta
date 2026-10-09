// tests/unit/greeting.test.js — Unit tests for js/greeting.js
// Feature: life-dashboard
// Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6
// @vitest-environment jsdom

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import GreetingWidget from '../../js/greeting.js';

// ---------------------------------------------------------------------------
// getGreetingText — boundary tests
// ---------------------------------------------------------------------------

describe('GreetingWidget.getGreetingText()', () => {
  // Req 2.1: 05:00–11:59 → "Selamat Pagi"
  describe('Selamat Pagi (Req 2.1)', () => {
    it('returns "Selamat Pagi" at 05:00 (lower boundary)', () => {
      expect(GreetingWidget.getGreetingText(5)).toBe('Selamat Pagi');
    });

    it('returns "Selamat Pagi" at 11:00 (mid-range)', () => {
      expect(GreetingWidget.getGreetingText(11)).toBe('Selamat Pagi');
    });

    it('returns "Selamat Pagi" at 11:59 (upper boundary — hour = 11)', () => {
      // Hour 11 represents 11:00–11:59
      expect(GreetingWidget.getGreetingText(11)).toBe('Selamat Pagi');
    });

    it('does NOT return "Selamat Pagi" at 04:59 (hour = 4, just before range)', () => {
      expect(GreetingWidget.getGreetingText(4)).not.toBe('Selamat Pagi');
    });

    it('does NOT return "Selamat Pagi" at 12:00 (hour = 12, just after range)', () => {
      expect(GreetingWidget.getGreetingText(12)).not.toBe('Selamat Pagi');
    });
  });

  // Req 2.2: 12:00–14:59 → "Selamat Siang"
  describe('Selamat Siang (Req 2.2)', () => {
    it('returns "Selamat Siang" at 12:00 (lower boundary)', () => {
      expect(GreetingWidget.getGreetingText(12)).toBe('Selamat Siang');
    });

    it('returns "Selamat Siang" at 13:00 (mid-range)', () => {
      expect(GreetingWidget.getGreetingText(13)).toBe('Selamat Siang');
    });

    it('returns "Selamat Siang" at 14:59 (upper boundary — hour = 14)', () => {
      expect(GreetingWidget.getGreetingText(14)).toBe('Selamat Siang');
    });

    it('does NOT return "Selamat Siang" at 11:59 (hour = 11, just before range)', () => {
      expect(GreetingWidget.getGreetingText(11)).not.toBe('Selamat Siang');
    });

    it('does NOT return "Selamat Siang" at 15:00 (hour = 15, just after range)', () => {
      expect(GreetingWidget.getGreetingText(15)).not.toBe('Selamat Siang');
    });
  });

  // Req 2.3: 15:00–17:59 → "Selamat Sore"
  describe('Selamat Sore (Req 2.3)', () => {
    it('returns "Selamat Sore" at 15:00 (lower boundary)', () => {
      expect(GreetingWidget.getGreetingText(15)).toBe('Selamat Sore');
    });

    it('returns "Selamat Sore" at 16:00 (mid-range)', () => {
      expect(GreetingWidget.getGreetingText(16)).toBe('Selamat Sore');
    });

    it('returns "Selamat Sore" at 17:59 (upper boundary — hour = 17)', () => {
      expect(GreetingWidget.getGreetingText(17)).toBe('Selamat Sore');
    });

    it('does NOT return "Selamat Sore" at 14:59 (hour = 14, just before range)', () => {
      expect(GreetingWidget.getGreetingText(14)).not.toBe('Selamat Sore');
    });

    it('does NOT return "Selamat Sore" at 18:00 (hour = 18, just after range)', () => {
      expect(GreetingWidget.getGreetingText(18)).not.toBe('Selamat Sore');
    });
  });

  // Req 2.4: 18:00–04:59 → "Selamat Malam"
  describe('Selamat Malam (Req 2.4)', () => {
    it('returns "Selamat Malam" at 18:00 (lower boundary of night)', () => {
      expect(GreetingWidget.getGreetingText(18)).toBe('Selamat Malam');
    });

    it('returns "Selamat Malam" at 23:00 (late night)', () => {
      expect(GreetingWidget.getGreetingText(23)).toBe('Selamat Malam');
    });

    it('returns "Selamat Malam" at 00:00 (midnight)', () => {
      expect(GreetingWidget.getGreetingText(0)).toBe('Selamat Malam');
    });

    it('returns "Selamat Malam" at 04:59 (upper boundary — hour = 4)', () => {
      expect(GreetingWidget.getGreetingText(4)).toBe('Selamat Malam');
    });

    it('does NOT return "Selamat Malam" at 17:59 (hour = 17, just before range)', () => {
      expect(GreetingWidget.getGreetingText(17)).not.toBe('Selamat Malam');
    });

    it('does NOT return "Selamat Malam" at 05:00 (hour = 5, just after range)', () => {
      expect(GreetingWidget.getGreetingText(5)).not.toBe('Selamat Malam');
    });
  });
});

// ---------------------------------------------------------------------------
// render — DOM tests
// ---------------------------------------------------------------------------

describe('GreetingWidget.render()', () => {
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

  // Req 2.5: With username → "${greetingText}, ${username}!"
  describe('with username (Req 2.5)', () => {
    it('renders greeting with name: "Selamat Pagi, Abyan!"', () => {
      GreetingWidget.render('Selamat Pagi', 'Abyan');
      expect(greetingEl.textContent).toBe('Selamat Pagi, Abyan!');
    });

    it('renders greeting with a different name', () => {
      GreetingWidget.render('Selamat Malam', 'Budi');
      expect(greetingEl.textContent).toBe('Selamat Malam, Budi!');
    });

    it('trims whitespace from username before rendering', () => {
      GreetingWidget.render('Selamat Siang', '  Citra  ');
      expect(greetingEl.textContent).toBe('Selamat Siang, Citra!');
    });
  });

  // Req 2.6: Without username → "${greetingText}!"
  describe('without username (Req 2.6)', () => {
    it('renders greeting without name when username is empty string', () => {
      GreetingWidget.render('Selamat Pagi', '');
      expect(greetingEl.textContent).toBe('Selamat Pagi!');
    });

    it('renders greeting without name when username is only whitespace', () => {
      GreetingWidget.render('Selamat Sore', '   ');
      expect(greetingEl.textContent).toBe('Selamat Sore!');
    });

    it('renders greeting without name when username is undefined-like (empty)', () => {
      GreetingWidget.render('Selamat Malam', '');
      expect(greetingEl.textContent).toBe('Selamat Malam!');
    });
  });

  // DOM safety
  describe('DOM safety', () => {
    it('does not throw when #greeting-text element is absent', () => {
      document.body.removeChild(greetingEl);
      expect(() => GreetingWidget.render('Selamat Pagi', 'Abyan')).not.toThrow();
      // Re-add so afterEach cleanup doesn't fail
      document.body.appendChild(greetingEl);
    });
  });
});
