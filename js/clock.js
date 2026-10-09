// js/clock.js — Clock Widget
// Feature: life-dashboard
// Requirements: 1.1, 1.2, 1.3, 1.4

/**
 * Nama hari dan bulan dalam Bahasa Indonesia — digunakan sebagai fallback
 * jika Intl.DateTimeFormat tidak tersedia di lingkungan ini.
 */
const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const BULAN = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

/** True jika Intl.DateTimeFormat tersedia dan bisa menghasilkan nama lokal. */
function isIntlAvailable() {
  try {
    return (
      typeof Intl !== 'undefined' &&
      typeof Intl.DateTimeFormat === 'function' &&
      typeof Intl.DateTimeFormat.prototype.formatToParts === 'function'
    );
  } catch (_) {
    return false;
  }
}

// ---------------------------------------------------------------------------
// ClockWidget
// ---------------------------------------------------------------------------

const ClockWidget = {
  /**
   * Inisialisasi widget jam.
   * Render tampilan awal lalu mulai interval setiap 1 detik.
   * Guard null check: interval hanya dimulai jika elemen DOM tersedia.
   */
  init() {
    const timeEl = document.getElementById('clock-time');
    const dateEl = document.getElementById('clock-date');

    // Render awal segera
    this.tick();

    // Mulai interval hanya jika elemen DOM ada (aman di environment test jsdom)
    if (timeEl || dateEl) {
      setInterval(() => this.tick(), 1000);
    }
  },

  /**
   * Dipanggil setiap detik. Ambil waktu terkini lalu update elemen DOM.
   * Guard null check agar aman di lingkungan tanpa DOM (test).
   */
  tick() {
    const now = new Date();

    const timeEl = document.getElementById('clock-time');
    const dateEl = document.getElementById('clock-date');

    if (timeEl) {
      timeEl.textContent = this.formatTime(now);
    }
    if (dateEl) {
      dateEl.textContent = this.formatDate(now);
    }
  },

  /**
   * Format waktu ke string HH:MM:SS dengan leading zero.
   * Menggunakan metode lokal browser (getHours/getMinutes/getSeconds).
   *
   * @param {Date} date
   * @returns {string} contoh: "07:05:09"
   */
  formatTime(date) {
    const hh = String(date.getHours()).padStart(2, '0');
    const mm = String(date.getMinutes()).padStart(2, '0');
    const ss = String(date.getSeconds()).padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
  },

  /**
   * Format tanggal ke "NamaHari, D NamaBulan YYYY" dalam Bahasa Indonesia.
   * - Nama hari dan bulan menggunakan Intl.DateTimeFormat jika tersedia.
   * - Fallback ke array hardcoded jika Intl tidak tersedia.
   * - Angka tanggal TANPA leading zero (sesuai Req 1.2).
   *
   * @param {Date} date
   * @returns {string} contoh: "Senin, 5 Oktober 2026"
   */
  formatDate(date) {
    const day = date.getDate();            // 1–31, tanpa leading zero
    const year = date.getFullYear();

    if (isIntlAvailable()) {
      try {
        const namaHari = new Intl.DateTimeFormat('id-ID', { weekday: 'long' }).format(date);
        const namaBulan = new Intl.DateTimeFormat('id-ID', { month: 'long' }).format(date);
        // Pastikan huruf kapital pertama (beberapa implementasi Intl mungkin lowercase)
        const hari = namaHari.charAt(0).toUpperCase() + namaHari.slice(1);
        const bulan = namaBulan.charAt(0).toUpperCase() + namaBulan.slice(1);
        return `${hari}, ${day} ${bulan} ${year}`;
      } catch (_) {
        // Intl tersedia tapi gagal digunakan — lanjut ke fallback
      }
    }

    // Fallback: gunakan getDay() / getMonth() dengan array hardcoded
    const namaHariFallback = HARI[date.getDay()];
    const namaBulanFallback = BULAN[date.getMonth()];
    return `${namaHariFallback}, ${day} ${namaBulanFallback} ${year}`;
  },
};

export default ClockWidget;
