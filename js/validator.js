// js/validator.js — Validator (pure functions, no side effects)
// Semua fungsi mengembalikan { valid: boolean, errorMessage: string | null }

/**
 * @typedef {Object} ValidationResult
 * @property {boolean} valid
 * @property {string|null} errorMessage
 */

/**
 * Validasi teks tugas (to-do item).
 * Valid: panjang setelah trim berada di rentang [1, 200] karakter.
 *
 * @param {string} text
 * @returns {ValidationResult}
 */
export function validateTaskText(text) {
  if (typeof text !== 'string') {
    return { valid: false, errorMessage: 'Teks tugas harus berupa teks.' };
  }

  const trimmed = text.trim();

  if (trimmed.length === 0) {
    return { valid: false, errorMessage: 'Teks tugas tidak boleh kosong.' };
  }

  if (trimmed.length > 200) {
    return {
      valid: false,
      errorMessage: `Teks tugas tidak boleh melebihi 200 karakter (saat ini ${trimmed.length} karakter).`,
    };
  }

  return { valid: true, errorMessage: null };
}

/**
 * Validasi label quick link.
 * Valid: panjang setelah trim berada di rentang [1, 50] karakter.
 *
 * @param {string} label
 * @returns {ValidationResult}
 */
export function validateLinkLabel(label) {
  if (typeof label !== 'string') {
    return { valid: false, errorMessage: 'Label tautan harus berupa teks.' };
  }

  const trimmed = label.trim();

  if (trimmed.length === 0) {
    return { valid: false, errorMessage: 'Label tautan tidak boleh kosong.' };
  }

  if (trimmed.length > 50) {
    return {
      valid: false,
      errorMessage: `Label tautan tidak boleh melebihi 50 karakter (saat ini ${trimmed.length} karakter).`,
    };
  }

  return { valid: true, errorMessage: null };
}

/**
 * Validasi URL quick link.
 * Valid: non-kosong dan diawali dengan "http://" atau "https://".
 *
 * @param {string} url
 * @returns {ValidationResult}
 */
export function validateLinkUrl(url) {
  if (typeof url !== 'string') {
    return { valid: false, errorMessage: 'URL tautan harus berupa teks.' };
  }

  if (url.length === 0) {
    return { valid: false, errorMessage: 'URL tautan tidak boleh kosong.' };
  }

  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return {
      valid: false,
      errorMessage: 'URL tautan harus diawali dengan "http://" atau "https://".',
    };
  }

  return { valid: true, errorMessage: null };
}

/**
 * Validasi nama pengguna.
 * Valid: boleh kosong (berarti hapus nama), atau jika tidak kosong panjang setelah trim ≤ 100 karakter.
 *
 * @param {string} name
 * @returns {ValidationResult}
 */
export function validateUsername(name) {
  if (typeof name !== 'string') {
    return { valid: false, errorMessage: 'Nama pengguna harus berupa teks.' };
  }

  const trimmed = name.trim();

  // String kosong murni (tanpa karakter apapun) dianggap valid — berarti hapus nama
  if (name.length === 0) {
    return { valid: true, errorMessage: null };
  }

  // Hanya spasi/whitespace: tidak valid (req 2.9 — tampilkan salam tanpa nama)
  if (trimmed.length === 0) {
    return { valid: false, errorMessage: 'Nama pengguna tidak boleh hanya berisi spasi.' };
  }

  if (trimmed.length > 100) {
    return {
      valid: false,
      errorMessage: `Nama pengguna tidak boleh melebihi 100 karakter (saat ini ${trimmed.length} karakter).`,
    };
  }

  return { valid: true, errorMessage: null };
}

/**
 * Objek Validator sebagai namespace terpusat.
 * Mengekspos keempat fungsi validasi agar dapat digunakan sebagai
 * `Validator.validateTaskText(...)` oleh modul lain.
 */
const Validator = {
  validateTaskText,
  validateLinkLabel,
  validateLinkUrl,
  validateUsername,
};

export default Validator;
