// js/greeting.js — Greeting Widget
// Feature: life-dashboard
// Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9

import Storage from './storage.js';
import Validator from './validator.js';

/**
 * Simpan username saat ini dalam memori untuk keperluan re-render.
 * @type {string}
 */
let _currentUsername = '';

const GreetingWidget = {
  /**
   * Menghitung teks salam berdasarkan jam saat ini.
   *
   * @param {number} hour - Jam dalam rentang [0, 23]
   * @returns {"Selamat Pagi" | "Selamat Siang" | "Selamat Sore" | "Selamat Malam"}
   */
  getGreetingText(hour) {
    if (hour >= 5 && hour <= 11) {
      return 'Selamat Pagi';
    } else if (hour >= 12 && hour <= 14) {
      return 'Selamat Siang';
    } else if (hour >= 15 && hour <= 17) {
      return 'Selamat Sore';
    } else {
      // hour ∈ [18, 23] ∪ [0, 4]
      return 'Selamat Malam';
    }
  },

  /**
   * Render teks salam ke elemen DOM #greeting-text.
   * Jika ada username (non-empty setelah trim), tampilkan "${greetingText}, ${username}!",
   * jika tidak, tampilkan "${greetingText}!".
   *
   * @param {string} greetingText - Teks salam yang sudah dihitung
   * @param {string} username - Nama pengguna; boleh kosong
   */
  render(greetingText, username) {
    const el = document.getElementById('greeting-text');
    if (!el) return;

    const trimmed = typeof username === 'string' ? username.trim() : '';
    if (trimmed.length > 0) {
      el.textContent = `${greetingText}, ${trimmed}!`;
    } else {
      el.textContent = `${greetingText}!`;
    }
  },

  /**
   * Handler untuk menyimpan nama pengguna baru.
   * Validasi → simpan ke Storage → re-render.
   * Tampilkan inline error jika validasi gagal.
   *
   * @param {string} newName - Nama baru yang ingin disimpan
   */
  handleUsernameSave(newName) {
    const errorEl =
      document.getElementById('username-error') || document.getElementById('greeting-error');
    const result = Validator.validateUsername(newName);

    if (!result.valid) {
      if (errorEl) {
        errorEl.textContent = result.errorMessage;
        errorEl.hidden = false;
      }
      return;
    }

    // Bersihkan error jika validasi berhasil
    if (errorEl) {
      errorEl.textContent = '';
      errorEl.hidden = true;
    }

    const trimmedName = typeof newName === 'string' ? newName.trim() : '';
    Storage.save('ld_username', trimmedName);
    _currentUsername = trimmedName;

    const hour = new Date().getHours();
    const greetingText = this.getGreetingText(hour);
    this.render(greetingText, _currentUsername);
  },

  /**
   * Inisialisasi Greeting Widget.
   * Ambil jam saat ini, tampilkan salam, daftarkan event listener.
   *
   * @param {string} username - Nama pengguna dari storage (boleh kosong)
   */
  init(username) {
    _currentUsername = typeof username === 'string' ? username : '';

    const hour = new Date().getHours();
    const greetingText = this.getGreetingText(hour);
    this.render(greetingText, _currentUsername);

    // Daftarkan event listener pada tombol simpan nama
    const usernameForm = document.getElementById('username-form');
    const saveBtn =
      document.getElementById('username-save-btn') || document.getElementById('save-username-btn');
    const handleSave = () => {
      const inputEl = document.getElementById('username-input');
      const newName = inputEl ? inputEl.value : '';
      this.handleUsernameSave(newName);
    };

    if (usernameForm) {
      usernameForm.addEventListener('submit', (event) => {
        event.preventDefault();
        handleSave();
      });
    } else if (saveBtn) {
      saveBtn.addEventListener('click', handleSave);
    }

    // Hapus inline error saat input berubah
    const inputEl = document.getElementById('username-input');
    if (inputEl) {
      inputEl.addEventListener('input', () => {
        const errorEl =
          document.getElementById('username-error') || document.getElementById('greeting-error');
        if (errorEl) {
          errorEl.textContent = '';
          errorEl.hidden = true;
        }
      });
    }
  },
};

export default GreetingWidget;
