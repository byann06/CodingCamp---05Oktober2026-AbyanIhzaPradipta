// tests/unit/validator.test.js
import { describe, it, expect } from 'vitest';
import {
  validateTaskText,
  validateLinkLabel,
  validateLinkUrl,
  validateUsername,
} from '../../js/validator.js';

// ---------------------------------------------------------------------------
// validateTaskText
// ---------------------------------------------------------------------------
describe('validateTaskText', () => {
  it('returns valid for a normal string', () => {
    expect(validateTaskText('Belajar JavaScript').valid).toBe(true);
    expect(validateTaskText('Belajar JavaScript').errorMessage).toBeNull();
  });

  it('returns valid for exactly 1 character', () => {
    expect(validateTaskText('A').valid).toBe(true);
  });

  it('returns valid for exactly 200 characters', () => {
    const text = 'a'.repeat(200);
    expect(validateTaskText(text).valid).toBe(true);
  });

  it('returns invalid for empty string', () => {
    const result = validateTaskText('');
    expect(result.valid).toBe(false);
    expect(result.errorMessage).toBeTruthy();
  });

  it('returns invalid for whitespace-only string', () => {
    expect(validateTaskText('   ').valid).toBe(false);
    expect(validateTaskText('\t\n').valid).toBe(false);
  });

  it('returns invalid for 201 characters', () => {
    const result = validateTaskText('a'.repeat(201));
    expect(result.valid).toBe(false);
    expect(result.errorMessage).toBeTruthy();
  });

  it('returns valid for text that is 200 chars after trimming leading/trailing spaces', () => {
    // The spec trims before checking length, so a 200-char core is valid
    const text = '  ' + 'b'.repeat(200) + '  ';
    expect(validateTaskText(text).valid).toBe(true);
  });

  it('returns invalid when trimmed length would be 201', () => {
    const text = '  ' + 'b'.repeat(201) + '  ';
    expect(validateTaskText(text).valid).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// validateLinkLabel
// ---------------------------------------------------------------------------
describe('validateLinkLabel', () => {
  it('returns valid for a normal label', () => {
    expect(validateLinkLabel('GitHub').valid).toBe(true);
    expect(validateLinkLabel('GitHub').errorMessage).toBeNull();
  });

  it('returns valid for exactly 1 character', () => {
    expect(validateLinkLabel('G').valid).toBe(true);
  });

  it('returns valid for exactly 50 characters', () => {
    expect(validateLinkLabel('a'.repeat(50)).valid).toBe(true);
  });

  it('returns invalid for empty string', () => {
    expect(validateLinkLabel('').valid).toBe(false);
  });

  it('returns invalid for whitespace-only string', () => {
    expect(validateLinkLabel('   ').valid).toBe(false);
  });

  it('returns invalid for 51 characters', () => {
    const result = validateLinkLabel('a'.repeat(51));
    expect(result.valid).toBe(false);
    expect(result.errorMessage).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// validateLinkUrl
// ---------------------------------------------------------------------------
describe('validateLinkUrl', () => {
  it('returns valid for http:// URL', () => {
    expect(validateLinkUrl('http://example.com').valid).toBe(true);
    expect(validateLinkUrl('http://example.com').errorMessage).toBeNull();
  });

  it('returns valid for https:// URL', () => {
    expect(validateLinkUrl('https://github.com').valid).toBe(true);
  });

  it('returns invalid for empty string', () => {
    expect(validateLinkUrl('').valid).toBe(false);
  });

  it('returns invalid for URL starting with ftp://', () => {
    expect(validateLinkUrl('ftp://files.example.com').valid).toBe(false);
  });

  it('returns invalid for URL without protocol', () => {
    expect(validateLinkUrl('www.example.com').valid).toBe(false);
  });

  it('returns invalid for URL starting with javascript:', () => {
    expect(validateLinkUrl('javascript:alert(1)').valid).toBe(false);
  });

  it('returns invalid for random string', () => {
    expect(validateLinkUrl('not-a-url').valid).toBe(false);
  });

  it('error message is non-null for invalid URL', () => {
    expect(validateLinkUrl('bad-url').errorMessage).toBeTruthy();
  });

  it('returns valid for "http://" alone (just the protocol prefix)', () => {
    expect(validateLinkUrl('http://').valid).toBe(true);
  });

  it('returns valid for "https://" alone (just the protocol prefix)', () => {
    expect(validateLinkUrl('https://').valid).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// validateUsername
// ---------------------------------------------------------------------------
describe('validateUsername', () => {
  it('returns valid for empty string (removes name)', () => {
    expect(validateUsername('').valid).toBe(true);
    expect(validateUsername('').errorMessage).toBeNull();
  });

  it('returns invalid for whitespace-only string (req 2.9: show greeting without name)', () => {
    expect(validateUsername('   ').valid).toBe(false);
    expect(validateUsername('   ').errorMessage).toBeTruthy();
  });

  it('returns valid for a normal name', () => {
    expect(validateUsername('Abyan').valid).toBe(true);
  });

  it('returns valid for exactly 100 characters', () => {
    expect(validateUsername('a'.repeat(100)).valid).toBe(true);
  });

  it('returns invalid for 101 characters', () => {
    const result = validateUsername('a'.repeat(101));
    expect(result.valid).toBe(false);
    expect(result.errorMessage).toBeTruthy();
  });

  it('returns valid when name is within limit after trimming', () => {
    // 98 core chars + 2 spaces on each side => trimmed length = 98 (valid)
    const name = '  ' + 'a'.repeat(98) + '  ';
    expect(validateUsername(name).valid).toBe(true);
  });
});
