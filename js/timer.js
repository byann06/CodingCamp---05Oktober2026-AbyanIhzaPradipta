// js/timer.js — Focus Timer Widget
// Feature: life-dashboard
// Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9

/**
 * TimerWidget — Pomodoro-style 25-minute countdown timer.
 *
 * State:
 *   remainingSeconds  number  0–1500, detik yang tersisa
 *   isRunning         boolean apakah timer sedang berjalan
 *   intervalId        number|null  ID dari setInterval yang aktif
 *
 * DOM IDs yang digunakan:
 *   timer-display            — elemen yang menampilkan MM:SS
 *   timer-start-btn          — tombol Mulai
 *   timer-stop-btn           — tombol Berhenti
 *   timer-reset-btn          — tombol Reset
 *   timer-complete-indicator — indikator visual saat selesai
 */

const TimerWidget = (() => {
  // ─── Internal state ────────────────────────────────────────────────────────
  let remainingSeconds = 1500; // 25 menit = 1500 detik
  let isRunning = false;
  let intervalId = null;

  // ─── Helpers ───────────────────────────────────────────────────────────────

  /**
   * Dapatkan elemen DOM dengan null-safe (aman di lingkungan tanpa DOM).
   * @param {string} id
   * @returns {HTMLElement|null}
   */
  function _el(id) {
    if (typeof document === 'undefined') return null;
    return document.getElementById(id);
  }

  // ─── Public API ────────────────────────────────────────────────────────────

  /**
   * Memformat total detik ke string MM:SS dengan leading zero.
   * Total detik yang direpresentasikan oleh output HARUS sama dengan input.
   *
   * @param {number} totalSeconds — integer non-negatif, max 1500
   * @returns {string} format "MM:SS"
   */
  function formatTime(totalSeconds) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const mm = String(minutes).padStart(2, '0');
    const ss = String(seconds).padStart(2, '0');
    return `${mm}:${ss}`;
  }

  /**
   * Update teks pada elemen timer-display.
   * @private
   */
  function _updateDisplay() {
    const display = _el('timer-display');
    if (display) {
      display.textContent = formatTime(remainingSeconds);
    }
  }

  /**
   * Update atribut `disabled` pada tombol Mulai, Berhenti, dan Reset
   * sesuai dengan state timer saat ini.
   *
   * Aturan (Requirements 3.7, 3.8, 3.9):
   *   isRunning=true  → Mulai: disabled, Berhenti: enabled, Reset: disabled
   *   isRunning=false, remainingSeconds>0 → Mulai: enabled, Berhenti: disabled, Reset: enabled
   *   isCompleted=true (remainingSeconds===0) → Mulai: enabled, Berhenti: disabled, Reset: enabled
   *
   * @param {boolean} running   — apakah timer sedang berjalan
   * @param {boolean} completed — apakah timer baru saja selesai (reached 00:00)
   */
  function updateButtons(running, completed) {
    const startBtn = _el('timer-start-btn');
    const stopBtn = _el('timer-stop-btn');
    const resetBtn = _el('timer-reset-btn');

    if (!startBtn || !stopBtn || !resetBtn) return;

    if (running) {
      // Timer sedang berjalan: nonaktifkan Mulai, aktifkan Berhenti
      startBtn.disabled = true;
      stopBtn.disabled = false;
      resetBtn.disabled = true;
    } else if (completed) {
      // Timer selesai (00:00): nonaktifkan Berhenti, aktifkan Mulai & Reset
      startBtn.disabled = false;
      stopBtn.disabled = true;
      resetBtn.disabled = false;
    } else {
      // Timer pause / belum dimulai: aktifkan Mulai & Reset, nonaktifkan Berhenti
      startBtn.disabled = remainingSeconds === 0;
      stopBtn.disabled = true;
      resetBtn.disabled = false;
    }
  }

  /**
   * Dipanggil setiap detik oleh setInterval.
   * Mengurangi remainingSeconds, update DOM, dan memanggil onComplete() jika 0.
   */
  function tick() {
    remainingSeconds -= 1;
    _updateDisplay();

    if (remainingSeconds === 0) {
      onComplete();
    }
  }

  /**
   * Dipanggil saat countdown mencapai 0.
   * Hentikan interval, set isRunning=false, tampilkan indikator visual,
   * buat suara beep via AudioContext (fallback: visual saja).
   * Requirement 3.6, 3.9
   */
  function onComplete() {
    // Hentikan interval
    if (intervalId !== null) {
      clearInterval(intervalId);
      intervalId = null;
    }
    isRunning = false;

    // Tampilkan indikator visual
    const indicator = _el('timer-complete-indicator');
    if (indicator) {
      indicator.style.display = 'block';
      indicator.hidden = false;
      indicator.setAttribute('aria-hidden', 'false');
    }

    // Audio beep 880 Hz via Web Audio API
    try {
      if (typeof AudioContext !== 'undefined' || typeof window !== 'undefined' && window.AudioContext) {
        const AudioCtx = (typeof AudioContext !== 'undefined')
          ? AudioContext
          : window.AudioContext;
        const ctx = new AudioCtx();
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(880, ctx.currentTime);

        // Fade out agar tidak terdengar tiba-tiba berhenti
        gainNode.gain.setValueAtTime(0.6, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1);

        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 1);

        // Tutup AudioContext setelah selesai untuk membebaskan sumber daya
        oscillator.addEventListener('ended', () => {
          ctx.close().catch(() => {});
        });
      }
    } catch (_e) {
      // AudioContext tidak tersedia atau diblokir: fallback hanya visual
    }

    updateButtons(false, true);
  }

  /**
   * Mulai atau lanjutkan hitung mundur.
   * Hanya berjalan jika !isRunning && remainingSeconds > 0.
   * Requirement 3.2, 3.7
   */
  function start() {
    if (isRunning || remainingSeconds <= 0) return;

    isRunning = true;
    intervalId = setInterval(tick, 1000);
    updateButtons(true, false);
  }

  /**
   * Pause hitung mundur.
   * Requirement 3.4, 3.8
   */
  function stop() {
    if (intervalId !== null) {
      clearInterval(intervalId);
      intervalId = null;
    }
    isRunning = false;
    updateButtons(false, false);
  }

  /**
   * Reset timer ke 25:00 dan hentikan hitung mundur.
   * Requirement 3.5
   */
  function reset() {
    // Hentikan timer terlebih dahulu
    stop();

    // Reset state
    remainingSeconds = 1500;

    // Sembunyikan indikator complete
    const indicator = _el('timer-complete-indicator');
    if (indicator) {
      indicator.style.display = 'none';
      indicator.hidden = true;
      indicator.setAttribute('aria-hidden', 'true');
    }

    // Update tampilan
    _updateDisplay();

    // Tombol kembali ke state awal (pause dengan remainingSeconds > 0)
    updateButtons(false, false);
  }

  /**
   * Inisialisasi widget: render 25:00 dan set tombol ke state awal.
   * Requirement 3.1
   */
  function init() {
    remainingSeconds = 1500;
    isRunning = false;
    intervalId = null;

    // Sembunyikan indikator selesai
    const indicator = _el('timer-complete-indicator');
    if (indicator) {
      indicator.style.display = 'none';
      indicator.hidden = true;
      indicator.setAttribute('aria-hidden', 'true');
    }

    _updateDisplay();
    updateButtons(false, false);

    // Pasang event listeners pada tombol
    const startBtn = _el('timer-start-btn');
    const stopBtn = _el('timer-stop-btn');
    const resetBtn = _el('timer-reset-btn');

    if (startBtn) startBtn.addEventListener('click', start);
    if (stopBtn) stopBtn.addEventListener('click', stop);
    if (resetBtn) resetBtn.addEventListener('click', reset);
  }

  // ─── Expose public interface ───────────────────────────────────────────────
  return {
    init,
    start,
    stop,
    reset,
    tick,
    formatTime,
    onComplete,
    updateButtons,
    // Getter untuk state internal (digunakan oleh test)
    get remainingSeconds() { return remainingSeconds; },
    get isRunning() { return isRunning; },
    get intervalId() { return intervalId; },
    // Setter untuk test setup
    _setState(newRemaining, newRunning, newIntervalId) {
      remainingSeconds = newRemaining;
      isRunning = newRunning;
      intervalId = newIntervalId;
    },
  };
})();

export default TimerWidget;
export { TimerWidget };
