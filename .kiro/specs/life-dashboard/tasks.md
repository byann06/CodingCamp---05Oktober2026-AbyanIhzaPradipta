# Implementation Plan: Life Dashboard

## Overview

Implementasi Life Dashboard sebagai halaman web mandiri berbasis Vanilla HTML, CSS, dan JavaScript. Proyek dibangun secara inkremental: dimulai dari fondasi (struktur file, storage, validator), kemudian masing-masing widget, diakhiri dengan integrasi keseluruhan dan pengujian. Semua kode berjalan di browser melalui `file://` tanpa server atau build tool.

---

## Tasks

- [x] 1. Buat struktur proyek dan konfigurasi testing
  - Buat folder `css/`, `js/`, dan `tests/unit/` dan `tests/property/`
  - Buat `package.json` dengan devDependencies: `vitest`, `fast-check`, `jsdom`
  - Buat `index.html` dengan skeleton: `<head>` (link ke `css/style.css`), `<body>` dengan placeholder section untuk setiap widget, dan `<script type="module" src="js/main.js">`
  - Buat `css/style.css` kosong sebagai placeholder
  - Buat semua file JS kosong: `js/main.js`, `js/storage.js`, `js/validator.js`, `js/clock.js`, `js/greeting.js`, `js/timer.js`, `js/todo.js`, `js/quicklinks.js`, `js/theme.js`
  - _Requirements: 9.4, 10.1, 10.2, 10.3_

- [x] 2. Implementasi Storage Service (`js/storage.js`)
  - [x] 2.1 Implementasi `Storage` module dengan metode `save`, `load`, `loadAll`, dan flag `isAvailable`
    - Deteksi ketersediaan `localStorage` dengan `try/catch` saat modul dimuat
    - `save(key, value)`: JSON.stringify + localStorage.setItem, fallback ke in-memory jika `isAvailable === false`
    - `load(key)`: localStorage.getItem + JSON.parse, return `null` jika key tidak ada atau parsing gagal
    - `loadAll()`: muat semua keys (`ld_todos`, `ld_sort_order`, `ld_quick_links`, `ld_username`, `ld_theme`) dan return objek `AppState`
    - Bungkus semua operasi localStorage dengan `try/catch`
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

  - [x] 2.2 Tulis unit test untuk `storage.js`
    - Test `load` dengan key yang tidak ada → return `null`
    - Test `load` dengan JSON rusak → return `null` tanpa throw
    - Test `save` + `load` round-trip untuk setiap tipe data (`TodoItem[]`, `QuickLink[]`, `string`)
    - Test behavior saat localStorage throw (mock localStorage)
    - _Requirements: 8.3, 8.4_

  - [x] 2.3 Tulis property test untuk `storage.js`
    - **Property 12: Storage Round-Trip untuk Semua Tipe Data**
    - Gunakan `fc.jsonValue()` untuk setiap tipe data; assert `load(save(v))` deeply equals `v`
    - Test bahwa string JSON yang tidak valid mengembalikan `null` tanpa exception
    - **Validates: Requirements 2.7, 4.9, 4.10, 5.4, 6.7, 6.8, 7.3, 8.1, 8.4**

- [x] 3. Implementasi Validator (`js/validator.js`)
  - [x] 3.1 Implementasi `Validator` module dengan keempat fungsi validasi
    - `validateTaskText(text)`: valid jika `text.trim().length` ∈ [1, 200]
    - `validateLinkLabel(label)`: valid jika `label.trim().length` ∈ [1, 50]
    - `validateLinkUrl(url)`: valid jika `url` diawali `http://` atau `https://` dan non-kosong
    - `validateUsername(name)`: valid jika kosong (hapus nama) atau `name.trim().length` ≤ 100
    - Setiap fungsi return `{ valid: boolean, errorMessage: string | null }`
    - _Requirements: 2.9, 4.2, 4.5, 6.3, 6.4_

  - [x] 3.2 Tulis unit test untuk `validator.js`
    - Test setiap boundary condition: string kosong, 1 karakter, tepat batas maksimum, batas+1, whitespace murni
    - Test URL valid dengan `http://` dan `https://`, URL tanpa protokol, URL kosong
    - _Requirements: 2.9, 4.2, 4.5, 6.3, 6.4_

  - [x] 3.3 Tulis property test untuk `validator.js`
    - **Property 5: Validasi Input Tugas**
    - Gunakan generator untuk string kosong, whitespace, dan string >200 karakter; assert `valid === false`
    - **Validates: Requirements 4.2, 4.5**
    - **Property 10: Validasi URL dan Label Quick Link**
    - Gunakan `fc.string().filter(s => !s.startsWith('http://') && !s.startsWith('https://'))` → assert `valid === false`
    - **Validates: Requirements 6.3, 6.4**

- [x] 4. Checkpoint — Pastikan semua test untuk storage dan validator lulus
  - Pastikan semua test lulus, tanyakan kepada pengguna jika ada pertanyaan.

- [x] 5. Implementasi Clock Widget (`js/clock.js`)
  - [x] 5.1 Implementasi `ClockWidget` module dengan `init`, `tick`, `formatTime`, `formatDate`
    - `formatTime(date)`: return string `HH:MM:SS` dengan leading zero menggunakan `String.padStart(2, '0')`
    - `formatDate(date)`: return `"NamaHari, D NamaBulan YYYY"` dengan nama hari dan bulan dalam Bahasa Indonesia, angka tanggal tanpa leading zero
    - Gunakan `Intl.DateTimeFormat` untuk nama hari/bulan; fallback ke array hardcoded jika `Intl` tidak tersedia
    - `init()`: render tampilan awal lalu mulai `setInterval(tick, 1000)`
    - `tick()`: panggil `new Date()`, update elemen DOM jam dan tanggal
    - Perbarui DOM dalam ≤100ms sejak detik berganti
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

  - [x] 5.2 Tulis unit test untuk `clock.js`
    - Test `formatTime` pada tengah malam `00:00:00`, satu menit sebelum tengah malam `23:59:59`, dan format dengan leading zero
    - Test `formatDate` menghasilkan nama hari/bulan Bahasa Indonesia yang benar
    - _Requirements: 1.1, 1.2_

  - [x] 5.3 Tulis property test untuk `clock.js`
    - **Property 1: Format Waktu Clock (HH:MM:SS)**
    - Gunakan `fc.date()`; assert output matches `/^\d{2}:\d{2}:\d{2}$/`
    - **Validates: Requirements 1.1**
    - **Property 2: Format Tanggal Tanpa Leading Zero**
    - Gunakan `fc.date()`; assert angka hari dalam output tidak memiliki leading zero
    - **Validates: Requirements 1.2**

- [x] 6. Implementasi Greeting Widget (`js/greeting.js`)
  - [x] 6.1 Implementasi `GreetingWidget` module dengan `init`, `getGreetingText`, `render`, `handleUsernameSave`
    - `getGreetingText(hour)`: return salam sesuai rentang jam (05–11 → Pagi, 12–14 → Siang, 15–17 → Sore, 18–04 → Malam)
    - `render(greetingText, username)`: render `"${greetingText}, ${username}!"` jika ada nama, atau `"${greetingText}!"` jika tidak ada
    - `handleUsernameSave(newName)`: validasi via `Validator.validateUsername` → simpan ke `Storage.save('ld_username', ...)` → re-render
    - Tampilkan inline error jika validasi gagal; hapus error saat input berubah
    - `init(username)`: ambil jam saat ini dari `new Date()`, tampilkan salam
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9_

  - [x] 6.2 Tulis unit test untuk `greeting.js`
    - Test setiap boundary jam (04:59, 05:00, 11:59, 12:00, 14:59, 15:00, 17:59, 18:00)
    - Test render dengan nama dan tanpa nama
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

  - [x] 6.3 Tulis property test untuk `greeting.js`
    - **Property 3: Pemetaan Jam ke Salam**
    - Gunakan `fc.integer({min:0, max:23})`; assert output adalah salah satu dari empat salam yang valid dan sesuai rentang
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.4**
    - **Property 4: Salam Menyertakan Nama Pengguna**
    - Gunakan `fc.string({minLength:1}).filter(s => s.trim().length > 0)`; assert nama terkandung dalam output render
    - Test dengan nama kosong/whitespace; assert tidak ada nama dalam output
    - **Validates: Requirements 2.5, 2.6**

- [x] 7.1 Implementasi Focus Timer Widget (`js/timer.js`)
  - [x] 7.1 Implementasi `TimerWidget` module dengan `init`, `start`, `stop`, `reset`, `tick`, `formatTime`, `onComplete`, `updateButtons`
    - State internal: `remainingSeconds = 1500`, `isRunning = false`, `intervalId = null`
    - `formatTime(totalSeconds)`: return `MM:SS` dengan leading zero, total detik yang direpresentasikan harus sama dengan input
    - `start()`: hanya jika `!isRunning && remainingSeconds > 0`; set `isRunning = true`; mulai `setInterval(tick, 1000)`; panggil `updateButtons(true, false)`
    - `stop()`: clear interval; set `isRunning = false`; panggil `updateButtons(false, false)`
    - `reset()`: stop timer; set `remainingSeconds = 1500`; re-render tampilan; panggil `updateButtons(false, false)`
    - `tick()`: kurangi `remainingSeconds`; update DOM; jika `remainingSeconds === 0`, panggil `onComplete()`
    - `onComplete()`: clear interval; set `isRunning = false`; buat audio beep 880Hz via `AudioContext` (fallback: hanya visual); panggil `updateButtons(false, true)`
    - `updateButtons(isRunning, isCompleted)`: atur `disabled` attribute pada tombol Mulai, Berhenti, Reset sesuai state
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9_

  - [x] 7.2 Tulis unit test untuk `timer.js`
    - Test start → stop → lanjut (remaining tidak berubah saat stop)
    - Test reset dari berbagai state (running, stopped, completed)
    - Test completion dari `remainingSeconds = 1`
    - Test `updateButtons` menghasilkan state disabled yang benar
    - _Requirements: 3.2, 3.4, 3.5, 3.7, 3.8, 3.9_

  - [x] 7.3 Tulis property test untuk `timer.js`
    - **Property 13: Format Timer (MM:SS)**
    - Gunakan `fc.integer({min:0, max:1500})`; assert output matches `MM:SS` dan total detik yang direpresentasikan benar
    - **Validates: Requirements 3.1, 3.3**
    - **Property 14: Invariant Tombol Timer**
    - Gunakan `fc.boolean()` (isRunning) + `fc.integer({min:0,max:1500})`; assert state disabled tombol sesuai
    - **Validates: Requirements 3.7, 3.8, 3.9**

- [x] 8. Implementasi To-Do List Widget (`js/todo.js`)
  - [x] 8.1 Implementasi `TodoWidget` module dengan `init`, `addTask`, `editTask`, `saveEdit`, `cancelEdit`, `toggleComplete`, `confirmDelete`, `deleteTask`, `applySortOrder`, `render`
    - State internal: `todos: TodoItem[]`, `sortOrder: string`
    - `addTask(text)`: validasi via `Validator.validateTaskText` → buat `TodoItem` baru dengan `generateId()`, `createdAt: Date.now()`, `completed: false` → tambahkan ke array → `applySortOrder` → render → `Storage.save('ld_todos', todos)`
    - `editTask(id)`: tampilkan input pre-filled dengan teks tugas saat ini
    - `saveEdit(id, newText)`: validasi → update `text` pada item, pertahankan `id`, `completed`, `createdAt` → render → simpan
    - `cancelEdit(id)`: kembalikan tampilan tugas ke mode normal tanpa perubahan
    - `toggleComplete(id)`: flip `completed` → render → simpan
    - `confirmDelete(id)`: tampilkan konfirmasi inline; `deleteTask(id)` hanya jika dikonfirmasi
    - `deleteTask(id)`: filter tugas dari array → render → simpan
    - `applySortOrder(order)`: urutkan array sesuai `'oldest'` (ascending `createdAt`), `'newest'` (descending), atau `'status'` (belum selesai dulu) — pertahankan semua item
    - Implementasi `generateId()` menggunakan `crypto.randomUUID()` dengan fallback
    - Tampilkan inline error di bawah input jika validasi gagal; hapus error saat input berubah
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9, 4.10, 4.11, 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

  - [x] 8.2 Tulis unit test untuk `todo.js`
    - Test tambah tugas → verifikasi id unik
    - Test toggle completed → strikethrough, toggle kembali → normal
    - Test hapus tugas yang tidak ada (no-op)
    - Test `applySortOrder` dengan ketiga mode
    - _Requirements: 4.1, 4.6, 4.7, 4.8, 5.1, 5.2, 5.3_

  - [x] 8.3 Tulis property test untuk `todo.js`
    - **Property 5: Validasi Input Tugas (sisi addTask)**
    - Assert bahwa `addTask` dengan whitespace-only tidak mengubah panjang array
    - **Validates: Requirements 4.2, 4.5**
    - **Property 6: Mutasi Daftar Tugas (Tambah dan Hapus)**
    - Assert `addTask(validText)` menambah length tepat 1 dan item baru ada di array
    - Assert `deleteTask(t.id)` menghilangkan item dengan `id === t.id`
    - **Validates: Requirements 4.1, 4.8**
    - **Property 7: Toggle Status Tugas (Round-Trip)**
    - Gunakan `fc.boolean()` sebagai completed state; assert double-toggle mengembalikan state asal
    - **Validates: Requirements 4.6, 4.7**
    - **Property 8: Edit Tugas Memperbarui Teks**
    - Assert setelah `saveEdit`, teks berubah tetapi `id`, `completed`, `createdAt` tidak berubah
    - **Validates: Requirements 4.3, 4.4**
    - **Property 9: Urutan Pengurutan Tugas**
    - Gunakan `fc.array(todoArbitrary)` + `fc.constantFrom('oldest','newest','status')`; assert sort invariant dan jumlah item sama
    - **Validates: Requirements 5.2, 5.3**

- [x] 9. Implementasi Quick Links Widget (`js/quicklinks.js`)
  - [x] 9.1 Implementasi `QuickLinksWidget` module dengan `init`, `addLink`, `deleteLink`, `render`
    - State internal: `links: QuickLink[]`
    - `addLink(label, url)`: validasi label via `Validator.validateLinkLabel` DAN url via `Validator.validateLinkUrl` → cek `links.length < 20` → buat `QuickLink` baru dengan `generateId()` → tambahkan → render → simpan
    - Jika `links.length === 20`: nonaktifkan tombol tambah, tampilkan teks "Batas maksimal 20 tautan tercapai"
    - `deleteLink(id)`: filter dari array → render → simpan (tanpa dialog konfirmasi)
    - Setiap tombol link membuka URL di tab baru (`target="_blank"`, `rel="noopener noreferrer"`)
    - Tampilkan inline error jika validasi gagal
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 6.9_

  - [x] 9.2 Tulis unit test untuk `quicklinks.js`
    - Test tambah link ke-20 (harus berhasil)
    - Test coba tambah link ke-21 (harus ditolak, array tidak berubah)
    - Test tombol tambah dinonaktifkan saat jumlah = 20
    - _Requirements: 6.2, 6.3, 6.4_

  - [x] 9.3 Tulis property test untuk `quicklinks.js`
    - **Property 10: Validasi URL dan Label Quick Link (sisi addLink)**
    - Assert bahwa `addLink` dengan URL tanpa `http://`/`https://` tidak mengubah array
    - **Validates: Requirements 6.3, 6.4**

- [x] 10. Implementasi Theme Manager (`js/theme.js`)
  - [x] 10.1 Implementasi `ThemeManager` module dengan `init`, `toggle`, `apply`, `updateToggleButton`
    - `apply(theme)`: tambah/hapus class `dark` pada `<body>`; update CSS variables jika diperlukan
    - `updateToggleButton(theme)`: perbarui ikon/label tombol toggle (misalnya 🌙 untuk dark, ☀️ untuk light) agar dapat dibedakan secara visual
    - `toggle()`: jika `currentTheme === 'dark'` → apply `'light'`, simpan, update tombol; sebaliknya → apply `'dark'`
    - `init(savedTheme)`: apply `savedTheme || 'dark'`; daftarkan event listener pada tombol toggle
    - Strategi anti-flash: baca `localStorage` synchronously di awal `main.js` sebelum `DOMContentLoaded`, terapkan class tema pada `<html>` element
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

  - [x] 10.2 Tulis unit test untuk `theme.js`
    - Test default Dark Mode saat `savedTheme = null`
    - Test toggle dari `dark` → `light` → `dark`
    - _Requirements: 7.1, 7.2_

  - [x] 10.3 Tulis property test untuk `theme.js`
    - **Property 11: Toggle Tema (Round-Trip)**
    - Gunakan `fc.constantFrom('light','dark')`; assert `toggle(toggle(t)) === t`
    - **Validates: Requirements 7.2**

- [x] 11. Checkpoint — Pastikan semua unit test dan property test lulus
  - Pastikan semua test lulus, tanyakan kepada pengguna jika ada pertanyaan.

- [x] 12. Buat `css/style.css` — Layout dan tema visual dasbor
  - Definisikan CSS custom properties untuk semua warna (Light Mode dan Dark Mode) pada `:root` dan `body.dark`
  - Implementasi layout grid/flexbox untuk lima widget di dasbor
  - Styling untuk Clock Widget (jam besar, tanggal di bawah)
  - Styling untuk Greeting Widget (teks salam besar, input nama)
  - Styling untuk Timer Widget (tampilan MM:SS, tiga tombol, indikator visual selesai)
  - Styling untuk To-Do List Widget (input tambah, daftar item dengan checkbox, tombol edit/hapus, dropdown sort, state strikethrough + opacity untuk tugas selesai)
  - Styling untuk Quick Links Widget (grid tombol link, form tambah link, pesan batas maksimum)
  - Styling tombol toggle Light/Dark Mode di header
  - Styling banner peringatan (localStorage tidak tersedia) dan toast notification (data rusak)
  - Styling inline error messages di bawah input
  - Responsif: layout menyesuaikan pada layar kecil (min-width 320px)
  - _Requirements: 4.6, 7.1, 7.2, 7.4, 7.5, 8.3, 8.4, 9.1, 9.3_

- [x] 13. Buat `index.html` — Struktur HTML lengkap semua widget
  - Buat markup HTML untuk Clock Widget: elemen untuk jam (`id="clock-time"`) dan tanggal (`id="clock-date"`)
  - Buat markup HTML untuk Greeting Widget: elemen untuk salam (`id="greeting-text"`), input nama dengan tombol simpan, dan area inline error
  - Buat markup HTML untuk Timer Widget: elemen untuk tampilan waktu (`id="timer-display"`), tiga tombol (Mulai, Berhenti, Reset), dan area indikator visual selesai
  - Buat markup HTML untuk To-Do List Widget: input tambah tugas, tombol submit, area inline error, dropdown sort order, dan container daftar tugas (`id="todo-list"`)
  - Buat markup HTML untuk Quick Links Widget: container tombol link (`id="quick-links-container"`), form tambah link (label + URL + tombol), area inline error, dan area pesan batas maksimum
  - Buat markup HTML untuk tombol toggle tema di header dengan ikon yang dapat dibedakan
  - Buat elemen untuk banner peringatan localStorage (`id="storage-warning"`, hidden secara default)
  - Buat elemen untuk toast notification data rusak (`id="data-corrupt-toast"`, hidden secara default)
  - Pastikan tidak ada inline `<style>` atau inline `<script>` di body; tambahkan satu inline script minimal di `<head>` untuk anti-flash (baca tema dari localStorage, set class pada `<html>`)
  - Pastikan semua elemen interaktif memiliki label yang aksesibel (aria-label atau label teks visible)
  - _Requirements: 9.4, 10.1, 10.2_

- [x] 14. Tulis `js/main.js` — Entry point dan wiring semua modul
  - Import semua modul: `Storage`, `ThemeManager`, `ClockWidget`, `GreetingWidget`, `TimerWidget`, `TodoWidget`, `QuickLinksWidget`
  - Di awal file (sebelum `DOMContentLoaded`): baca tema dari `localStorage` secara synchronous, terapkan class tema ke `<html>` untuk anti-flash
  - Di event `DOMContentLoaded`:
    1. Panggil `Storage.loadAll()` → dapatkan `AppState`
    2. Jika `Storage.isAvailable === false`: tampilkan banner peringatan permanen
    3. Panggil `ThemeManager.init(appState.theme)`
    4. Panggil `ClockWidget.init()`
    5. Panggil `GreetingWidget.init(appState.username)`
    6. Panggil `TimerWidget.init()`
    7. Panggil `TodoWidget.init(appState.todos, appState.sortOrder)`
    8. Panggil `QuickLinksWidget.init(appState.quickLinks)`
    9. Jika ada data rusak: tampilkan toast notification sekali
  - _Requirements: 8.2, 8.3, 8.4, 9.3_

- [x] 15. Checkpoint Akhir — Verifikasi integrasi dan semua test
  - Pastikan semua test lulus, tanyakan kepada pengguna jika ada pertanyaan.

---

## Notes

- Task bertanda `*` bersifat opsional dan dapat dilewati untuk MVP yang lebih cepat
- Setiap task mereferensikan requirements spesifik untuk keterlacakan
- Checkpoint memastikan validasi inkremental di setiap tahap
- Property tests memvalidasi correctness properties universal dari design document
- Unit tests memvalidasi skenario spesifik dan edge cases
- File test dan `package.json` hanya untuk keperluan development; file produksi (HTML/CSS/JS) tetap berjalan tanpa dependensi melalui `file://`
- Urutan implementasi: Storage → Validator → Clock → Greeting → Timer → Todo → QuickLinks → Theme → CSS → HTML → main.js (wiring)

---

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["2.1"] },
    { "id": 1, "tasks": ["3.1", "2.2", "2.3"] },
    { "id": 2, "tasks": ["3.2", "3.3", "5.1", "6.1", "7.1", "8.1", "9.1", "10.1"] },
    { "id": 3, "tasks": ["5.2", "5.3", "6.2", "6.3", "7.2", "7.3", "8.2", "8.3", "9.2", "9.3", "10.2", "10.3"] },
    { "id": 4, "tasks": ["12", "13"] },
    { "id": 5, "tasks": ["14"] }
  ]
}
```
