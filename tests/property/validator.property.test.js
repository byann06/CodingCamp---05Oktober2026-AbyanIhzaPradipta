// tests/property/validator.property.test.js
// Feature: life-dashboard, Property 5: Validasi Input Tugas
// Feature: life-dashboard, Property 10: Validasi URL dan Label Quick Link

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  validateTaskText,
  validateLinkLabel,
  validateLinkUrl,
} from '../../js/validator.js';

// ---------------------------------------------------------------------------
// Property 5: Validasi Input Tugas
// Validates: Requirements 4.2, 4.5
// ---------------------------------------------------------------------------

describe('Property 5: Validasi Input Tugas', () => {
  // 5a: String kosong selalu invalid
  it(
    'validateTaskText("") selalu mengembalikan valid === false',
    () => {
      fc.assert(
        fc.property(fc.constant(''), (text) => {
          expect(validateTaskText(text).valid).toBe(false);
        }),
        { numRuns: 100 },
      );
    },
  );

  // 5b: String yang hanya berisi whitespace selalu invalid
  it(
    'validateTaskText dengan string whitespace-only selalu mengembalikan valid === false',
    () => {
      // Generator: satu atau lebih karakter whitespace ( , \t, \n, \r)
      const whitespaceOnlyArb = fc
        .stringOf(fc.constantFrom(' ', '\t', '\n', '\r'), { minLength: 1, maxLength: 50 });

      fc.assert(
        fc.property(whitespaceOnlyArb, (text) => {
          expect(validateTaskText(text).valid).toBe(false);
        }),
        { numRuns: 100 },
      );
    },
  );

  // 5c: String dengan panjang trimmed > 200 selalu invalid
  it(
    'validateTaskText dengan trimmed length > 200 selalu mengembalikan valid === false',
    () => {
      // Generator: string dengan konten ≥ 201 karakter non-whitespace
      const tooLongArb = fc
        .string({ minLength: 201, maxLength: 400 })
        .map((s) => {
          // Pastikan tidak ada leading/trailing whitespace sehingga trim tidak memotong panjangnya
          const core = s.replace(/^\s+|\s+$/g, '').padEnd(201, 'a');
          return core;
        })
        .filter((s) => s.trim().length > 200);

      fc.assert(
        fc.property(tooLongArb, (text) => {
          expect(validateTaskText(text).valid).toBe(false);
        }),
        { numRuns: 100 },
      );
    },
  );

  // 5d: String dengan trimmed length ∈ [1, 200] selalu valid
  it(
    'validateTaskText dengan trimmed length antara 1 dan 200 selalu mengembalikan valid === true',
    () => {
      const validTextArb = fc
        .string({ minLength: 1, maxLength: 200 })
        .filter((s) => s.trim().length >= 1 && s.trim().length <= 200);

      fc.assert(
        fc.property(validTextArb, (text) => {
          expect(validateTaskText(text).valid).toBe(true);
        }),
        { numRuns: 100 },
      );
    },
  );
});

// ---------------------------------------------------------------------------
// Property 10: Validasi URL dan Label Quick Link
// Validates: Requirements 6.3, 6.4
// ---------------------------------------------------------------------------

describe('Property 10: Validasi URL dan Label Quick Link', () => {
  // 10a: URL yang TIDAK diawali http:// atau https:// selalu invalid
  it(
    'validateLinkUrl untuk URL tanpa prefix http:// atau https:// selalu mengembalikan valid === false',
    () => {
      const invalidUrlArb = fc
        .string()
        .filter((s) => !s.startsWith('http://') && !s.startsWith('https://'));

      fc.assert(
        fc.property(invalidUrlArb, (url) => {
          expect(validateLinkUrl(url).valid).toBe(false);
        }),
        { numRuns: 100 },
      );
    },
  );

  // 10b: URL yang diawali http:// atau https:// selalu valid
  it(
    'validateLinkUrl untuk URL dengan prefix http:// atau https:// selalu mengembalikan valid === true',
    () => {
      const validUrlArb = fc.oneof(
        fc.string().map((s) => `http://${s}`),
        fc.string().map((s) => `https://${s}`),
      );

      fc.assert(
        fc.property(validUrlArb, (url) => {
          expect(validateLinkUrl(url).valid).toBe(true);
        }),
        { numRuns: 100 },
      );
    },
  );

  // 10c: Label dengan trimmed length 0 (kosong atau whitespace-only) selalu invalid
  it(
    'validateLinkLabel dengan string kosong atau whitespace-only selalu mengembalikan valid === false',
    () => {
      const emptyOrWhitespaceArb = fc.oneof(
        fc.constant(''),
        fc.stringOf(fc.constantFrom(' ', '\t', '\n', '\r'), { minLength: 1, maxLength: 50 }),
      );

      fc.assert(
        fc.property(emptyOrWhitespaceArb, (label) => {
          expect(validateLinkLabel(label).valid).toBe(false);
        }),
        { numRuns: 100 },
      );
    },
  );

  // 10d: Label dengan trimmed length > 50 selalu invalid
  it(
    'validateLinkLabel dengan trimmed length > 50 selalu mengembalikan valid === false',
    () => {
      const tooLongLabelArb = fc
        .string({ minLength: 51, maxLength: 200 })
        .map((s) => {
          const core = s.replace(/^\s+|\s+$/g, '').padEnd(51, 'a');
          return core;
        })
        .filter((s) => s.trim().length > 50);

      fc.assert(
        fc.property(tooLongLabelArb, (label) => {
          expect(validateLinkLabel(label).valid).toBe(false);
        }),
        { numRuns: 100 },
      );
    },
  );

  // 10e: Label dengan trimmed length ∈ [1, 50] selalu valid
  it(
    'validateLinkLabel dengan trimmed length antara 1 dan 50 selalu mengembalikan valid === true',
    () => {
      const validLabelArb = fc
        .string({ minLength: 1, maxLength: 50 })
        .filter((s) => s.trim().length >= 1 && s.trim().length <= 50);

      fc.assert(
        fc.property(validLabelArb, (label) => {
          expect(validateLinkLabel(label).valid).toBe(true);
        }),
        { numRuns: 100 },
      );
    },
  );
});
