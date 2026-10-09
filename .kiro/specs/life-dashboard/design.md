# Design Document: Life Dashboard

## Overview

Life Dashboard adalah halaman web mandiri berbasis Vanilla HTML, CSS, dan JavaScript yang berfungsi sebagai dasbor kehidupan sehari-hari. Aplikasi ini berjalan sepenuhnya di sisi klien — tidak memerlukan server, build tool, atau koneksi internet — dan dapat dibuka langsung melalui protokol `file://`.

Dasbor terdiri dari lima widget utama yang saling independen:

1. **Clock Widget** — Jam digital real-time dan tampilan tanggal lengkap
2. **Greeting Widget** — Salam personal berbasis waktu dan nama kustom pengguna
3. **Focus Timer Widget** — Timer hitung mundur Pomodoro 25 menit
4. **To-Do List Widget** — Pengelolaan tugas harian secara penuh
5. **Quick Links Widget** — Tautan cepat ke situs web favorit

Semua data pengguna disimpan secara otomatis ke `localStorage` browser. Aplikasi mendukung Light Mode dan Dark Mode, dengan Dark Mode sebagai default.

---

## Architecture

### Prinsip Arsitektur

Karena proyek dibatasi pada Vanilla JS tanpa framework, arsitektur mengikuti pola **Module Pattern** berbasis ES6 Modules. Setiap widget diimplementasikan sebagai modul JavaScript mandiri yang berkomunikasi melalui sebuah **Storage Service** terpusat.

```
┌─────────────────────────────────────────────────────────┐
│                    index.html                           │
│  (Struktur HTML, link ke style.css dan main.js)         │
└────────────────────┬────────────────────────────────────┘
                     │ loads
┌────────────────────▼────────────────────────────────────┐
│                   js/main.js                            │
│  (Entry point: init semua widget, load data awal)       │
└──┬──────────┬──────────┬──────────┬──────────┬──────────┘
   │          │          │          │          │
   ▼          ▼          ▼          ▼          ▼
clock.js  greeting.js  timer.js  todo.js  quicklinks.js
   │          │          │          │          │
   └──────────┴──────────┴──────────┴──────────┘
                         │ semua widget menggunakan
                         ▼
                   js/storage.js
                  (LocalStorage abstraction)
                         │
                         ▼
                   js/validator.js
                  (Input validation logic)
```

### Pola Alur Data

```
User Interaction
      │
      ▼
Widget Module
      │
      ├──► validator.js  ──► (reject jika invalid)
      │
      ├──► update in-memory state
      │
      ├──► re-render DOM
      │
      └──► storage.js  ──► localStorage
```

### Inisialisasi Aplikasi

```
DOMContentLoaded
      │
      ▼
storage.js: loadAll()
      │
      ▼
theme.js: applyTheme(savedTheme || 'dark')   ← ≤100ms sebelum render
      │
      ▼
clock.js: init()       ← mulai setInterval 1 detik
greeting.js: init()    ← tampilkan salam dari state
timer.js: init()       ← render tampilan 25:00
todo.js: init()        ← render daftar dari storage
quicklinks.js: init()  ← render link dari storage
```

---

## Components and Interfaces

### 1. `js/storage.js` — Storage Service

Modul terpusat yang mengabstraksi semua akses `localStorage`. Menyediakan fallback ke in-memory jika `localStorage` tidak tersedia.

```javascript
// Interface
const Storage = {
  // Menyimpan nilai ke localStorage dengan key tertentu
  save(key, value): void,

  // Memuat nilai dari localStorage; null jika tidak ada atau parsing gagal
  load(key): any | null,

  // Memuat semua key yang relevan sekaligus, return objek state awal
  loadAll(): AppState,

  // Flag: apakah localStorage tersedia?
  isAvailable: boolean,
}
```

**Keys yang Digunakan:**

| Key | Tipe Data | Deskripsi |
|-----|-----------|-----------|
| `ld_todos` | `TodoItem[]` (JSON) | Daftar semua tugas |
| `ld_sort_order` | `string` | Preferensi urutan (`oldest`, `newest`, `status`) |
| `ld_quick_links` | `QuickLink[]` (JSON) | Daftar quick links |
| `ld_username` | `string` | Nama kustom pengguna |
| `ld_theme` | `string` | Tema aktif (`dark` atau `light`) |

**Error Handling:**

- Jika `localStorage` tidak tersedia (throw pada akses): set `isAvailable = false`, lanjutkan dengan in-memory
- Jika JSON parse gagal untuk key tertentu: kembalikan `null` untuk key tersebut, tampilkan notifikasi data rusak
- Notifikasi data rusak ditampilkan sekali per sesi, tidak memblokir operasi

---

### 2. `js/validator.js` — Validator

Modul murni (pure functions) untuk validasi input. Tidak ada side effects.

```javascript
// Interface
const Validator = {
  // Validasi deskripsi tugas
  // Valid: non-kosong setelah trim, panjang ≤200 karakter
  validateTaskText(text: string): ValidationResult,

  // Validasi label quick link
  // Valid: non-kosong setelah trim, panjang ≤50 karakter
  validateLinkLabel(label: string): ValidationResult,

  // Validasi URL quick link
  // Valid: non-kosong, diawali http:// atau https://
  validateLinkUrl(url: string): ValidationResult,

  // Validasi nama pengguna
  // Valid: boleh kosong (artinya hapus nama); jika tidak kosong, panjang ≤100 karakter
  validateUsername(name: string): ValidationResult,
}

// Return type
type ValidationResult = {
  valid: boolean,
  errorMessage: string | null,
}
```

---

### 3. `js/clock.js` — Clock Widget

```javascript
const ClockWidget = {
  // Inisialisasi: render awal + mulai interval 1 detik
  init(): void,

  // Memperbarui tampilan jam (HH:MM:SS) dan tanggal
  // Dipanggil setiap detik oleh setInterval
  tick(): void,

  // Memformat waktu ke string HH:MM:SS dari Date object
  formatTime(date: Date): string,

  // Memformat tanggal ke "Nama Hari, D Bulan YYYY" (tanpa leading zero)
  formatDate(date: Date): string,
}
```

**Detail Implementasi:**
- Gunakan `new Date()` untuk mendapatkan waktu lokal browser secara otomatis
- Fallback: jika `Intl.DateTimeFormat` tidak tersedia, gunakan UTC via `Date.prototype.getUTC*`
- `setInterval(tick, 1000)` dimulai saat `init()` dipanggil

---

### 4. `js/greeting.js` — Greeting Widget

```javascript
const GreetingWidget = {
  // Inisialisasi: load username dari state, render salam
  init(username: string): void,

  // Menghitung salam berdasarkan jam saat ini
  // Returns: "Selamat Pagi" | "Selamat Siang" | "Selamat Sore" | "Selamat Malam"
  getGreetingText(hour: number): string,

  // Render salam lengkap ke DOM
  // Contoh: "Selamat Pagi, Abyan!" atau "Selamat Pagi!"
  render(greetingText: string, username: string): void,

  // Handler saat pengguna menyimpan nama baru
  // Validasi → simpan ke storage → re-render
  handleUsernameSave(newName: string): void,
}
```

**Batas Waktu Salam:**

| Jam | Salam |
|-----|-------|
| 05:00 – 11:59 | Selamat Pagi |
| 12:00 – 14:59 | Selamat Siang |
| 15:00 – 17:59 | Selamat Sore |
| 18:00 – 04:59 | Selamat Malam |

---

### 5. `js/timer.js` — Focus Timer Widget

```javascript
const TimerWidget = {
  // Inisialisasi: render 25:00, set tombol ke state awal
  init(): void,

  // Memulai atau melanjutkan hitung mundur
  start(): void,

  // Menghentikan (pause) hitung mundur
  stop(): void,

  // Reset ke 25:00 dan hentikan hitung mundur
  reset(): void,

  // Dipanggil setiap detik: kurangi remaining, update DOM
  tick(): void,

  // Memformat detik ke string MM:SS
  formatTime(totalSeconds: number): string,

  // Dipanggil saat countdown mencapai 0
  onComplete(): void,

  // Update status tombol berdasarkan state timer
  updateButtons(isRunning: boolean, isCompleted: boolean): void,
}
```

**State Timer:**
- `remainingSeconds: number` — detik tersisa (0–1500)
- `isRunning: boolean` — apakah timer sedang berjalan
- `intervalId: number | null` — ID dari `setInterval`

**Audio Notifikasi (`onComplete`):**
- Dibuat menggunakan Web Audio API (`AudioContext`) — tidak memerlukan file audio eksternal
- Generate oscillator sederhana (beep 880Hz, durasi 1 detik) — kompatibel dengan `file://`
- Fallback: jika `AudioContext` tidak tersedia, hanya tampilkan indikator visual

---

### 6. `js/todo.js` — To-Do List Widget

```javascript
const TodoWidget = {
  // Inisialisasi: load todos dari state, render daftar
  init(todos: TodoItem[], sortOrder: string): void,

  // Menambah tugas baru (setelah validasi)
  addTask(text: string): void,

  // Memulai mode edit pada tugas (tampilkan input pre-filled)
  editTask(id: string): void,

  // Menyimpan hasil edit (setelah validasi)
  saveEdit(id: string, newText: string): void,

  // Membatalkan mode edit
  cancelEdit(id: string): void,

  // Toggle status selesai/belum selesai
  toggleComplete(id: string): void,

  // Tampilkan konfirmasi hapus
  confirmDelete(id: string): void,

  // Hapus tugas secara permanen
  deleteTask(id: string): void,

  // Menerapkan pengurutan pada array tasks dan re-render
  applySortOrder(order: 'oldest' | 'newest' | 'status'): void,

  // Re-render seluruh daftar ke DOM
  render(): void,
}
```

---

### 7. `js/quicklinks.js` — Quick Links Widget

```javascript
const QuickLinksWidget = {
  // Inisialisasi: load links dari state, render tombol
  init(links: QuickLink[]): void,

  // Menambah quick link baru (setelah validasi label + URL)
  addLink(label: string, url: string): void,

  // Menghapus quick link berdasarkan ID (tanpa konfirmasi)
  deleteLink(id: string): void,

  // Re-render seluruh daftar tombol ke DOM
  render(): void,
}
```

---

### 8. `js/theme.js` — Theme Manager

```javascript
const ThemeManager = {
  // Terapkan tema saat init (dipanggil sebelum widget lain)
  init(savedTheme: string | null): void,

  // Toggle antara 'light' dan 'dark'
  toggle(): void,

  // Terapkan tema ke DOM (tambah/hapus class pada <body>)
  apply(theme: 'light' | 'dark'): void,

  // Update ikon/label pada tombol toggle
  updateToggleButton(theme: 'light' | 'dark'): void,
}
```

**Strategi Anti-Flash:**
- Theme di-apply di `<head>` sebelum `DOMContentLoaded` menggunakan inline script minimal (exception dari aturan no-inline-script: hanya `document.documentElement.className` satu baris)
- Alternatif yang lebih bersih: gunakan CSS `color-scheme` dan baca `localStorage` synchronously di awal `main.js`

---

## Data Models

### `TodoItem`

```javascript
{
  id: string,           // UUID v4 — "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx"
  text: string,         // Teks tugas, 1–200 karakter setelah trim
  completed: boolean,   // true = selesai, false = belum selesai
  createdAt: number,    // Unix timestamp (ms) saat tugas dibuat
}
```

### `QuickLink`

```javascript
{
  id: string,           // UUID v4
  label: string,        // Label tombol, 1–50 karakter setelah trim
  url: string,          // URL tujuan, diawali http:// atau https://
}
```

### `AppState` (in-memory)

```javascript
{
  todos: TodoItem[],           // Daftar semua tugas
  sortOrder: 'oldest' | 'newest' | 'status',  // Preferensi urutan, default 'oldest'
  quickLinks: QuickLink[],     // Daftar quick links, max 20
  username: string,            // Nama kustom, '' jika belum diatur
  theme: 'light' | 'dark',     // Tema aktif, default 'dark'
}
```

### Struktur File

```
project-root/
├── index.html
├── css/
│   └── style.css
└── js/
    ├── main.js          ← entry point
    ├── storage.js
    ├── validator.js
    ├── clock.js
    ├── greeting.js
    ├── timer.js
    ├── todo.js
    ├── quicklinks.js
    └── theme.js
```

### ID Generation (Vanilla JS)

Karena tidak ada library eksternal, UUID v4 diimplementasikan menggunakan `crypto.randomUUID()` (tersedia di semua browser target). Fallback: `Math.random().toString(36)` jika `crypto.randomUUID` tidak tersedia.

```javascript
function generateId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property 1: Format Waktu Clock (HH:MM:SS)

*For any* valid `Date` object, `ClockWidget.formatTime(date)` SHALL return a string that strictly matches the pattern `HH:MM:SS` — two-digit hours (00–23), two-digit minutes (00–59), two-digit seconds (00–59), separated by colons, with leading zeros where necessary.

**Validates: Requirements 1.1**

---

### Property 2: Format Tanggal Tanpa Leading Zero

*For any* valid `Date` object, `ClockWidget.formatDate(date)` SHALL return a string in the format `"NamaHari, D NamaBulan YYYY"` where the day number `D` has NO leading zero (e.g., "5" bukan "05").

**Validates: Requirements 1.2**

---

### Property 3: Pemetaan Jam ke Salam

*For any* integer hour `h` in the range [0, 23]:
- If `h` ∈ [5, 11] → `getGreetingText(h)` returns `"Selamat Pagi"`
- If `h` ∈ [12, 14] → `getGreetingText(h)` returns `"Selamat Siang"`
- If `h` ∈ [15, 17] → `getGreetingText(h)` returns `"Selamat Sore"`
- If `h` ∈ [18, 23] ∪ [0, 4] → `getGreetingText(h)` returns `"Selamat Malam"`

Setiap jam dalam [0, 23] HARUS menghasilkan tepat salah satu dari keempat salam tersebut.

**Validates: Requirements 2.1, 2.2, 2.3, 2.4**

---

### Property 4: Salam Menyertakan Nama Pengguna

*For any* non-empty string `username` (after trim), the rendered greeting string SHALL contain `username` as a substring.

*For any* empty string or whitespace-only string as `username`, the rendered greeting string SHALL NOT contain any trailing name fragment.

**Validates: Requirements 2.5, 2.6**

---

### Property 5: Validasi Input Tugas

*For any* string `text`:
- If `text.trim()` is empty (length 0 after trimming) → `Validator.validateTaskText(text)` returns `{ valid: false }`
- If `text.trim().length > 200` → `Validator.validateTaskText(text)` returns `{ valid: false }`
- If `text.trim().length` ∈ [1, 200] → `Validator.validateTaskText(text)` returns `{ valid: true }`

Additionally, *for any* all-whitespace string `text`, calling `addTask(text)` SHALL leave the todo list unchanged.

**Validates: Requirements 4.2, 4.5**

---

### Property 6: Mutasi Daftar Tugas (Tambah dan Hapus)

*For any* todo list and any valid task text, after `addTask(text)`:
- `todos.length` increases by exactly 1
- The new task with that text exists in `todos`

*For any* todo list and any task `t` in that list, after `deleteTask(t.id)`:
- `todos` does NOT contain any item with `id === t.id`

**Validates: Requirements 4.1, 4.8**

---

### Property 7: Toggle Status Tugas (Round-Trip)

*For any* todo item `t`, calling `toggleComplete(t.id)` twice in succession SHALL return `t` to its original `completed` state. Formally: `toggleComplete(toggleComplete(t)).completed === t.completed`.

**Validates: Requirements 4.6, 4.7**

---

### Property 8: Edit Tugas Memperbarui Teks

*For any* todo item `t` and any valid new text `newText` (non-empty after trim, length ≤ 200), after `saveEdit(t.id, newText)`, the task with `id === t.id` in the list SHALL have `text === newText.trim()` and all other fields (id, completed, createdAt) SHALL remain unchanged.

**Validates: Requirements 4.3, 4.4**

---

### Property 9: Urutan Pengurutan Tugas

*For any* array of `TodoItem[]` and any sort order `order` ∈ `{'oldest', 'newest', 'status'}`, `applySortOrder(todos, order)` SHALL return an array where:
- `'oldest'`: items are ordered by `createdAt` ascending (terlama ke terbaru)
- `'newest'`: items are ordered by `createdAt` descending (terbaru ke terlama)
- `'status'`: all items with `completed === false` appear before all items with `completed === true`

The returned array SHALL contain the same items (same count, same ids) as the input.

**Validates: Requirements 5.2, 5.3**

---

### Property 10: Validasi URL dan Label Quick Link

*For any* string `url` that does NOT start with `"http://"` or `"https://"`, `Validator.validateLinkUrl(url)` SHALL return `{ valid: false }`.

*For any* string `url` that starts with `"http://"` or `"https://"` and is non-empty, `Validator.validateLinkUrl(url)` SHALL return `{ valid: true }`.

*For any* string `label` where `label.trim()` is empty or `label.trim().length > 50`, `Validator.validateLinkLabel(label)` SHALL return `{ valid: false }`.

**Validates: Requirements 6.3, 6.4**

---

### Property 11: Toggle Tema (Round-Trip)

*For any* current theme `t` ∈ `{'light', 'dark'}`, calling `ThemeManager.toggle()` SHALL produce the opposite theme. Calling `toggle()` twice SHALL return to the original theme. Formally: `toggle(toggle(t)) === t`.

**Validates: Requirements 7.2**

---

### Property 12: Storage Round-Trip untuk Semua Tipe Data

*For any* serializable value `v` saved via `Storage.save(key, v)`, a subsequent call to `Storage.load(key)` SHALL return a value deeply equal to `v`. This holds for all data types: `TodoItem[]`, `QuickLink[]`, `string` (username, theme), and sort order string.

*For any* string `s` that is not valid JSON (corrupted data), `Storage.load(key)` (when the key contains `s`) SHALL return `null` without throwing an exception.

**Validates: Requirements 2.7, 4.9, 4.10, 5.4, 6.7, 6.8, 7.3, 8.1, 8.4**

---

### Property 13: Format Timer (MM:SS)

*For any* integer `seconds` in the range [0, 1500], `TimerWidget.formatTime(seconds)` SHALL return a string matching the pattern `MM:SS` — two-digit minutes (00–25) and two-digit seconds (00–59) with leading zeros, and the total represented time SHALL equal `seconds`.

**Validates: Requirements 3.1, 3.3**

---

### Property 14: Invariant Tombol Timer

*For any* timer state where `isRunning === true`, the Start button SHALL be disabled (`disabled === true`) and the Stop button SHALL be enabled.

*For any* timer state where `isRunning === false`, the Stop button SHALL be disabled (`disabled === true`) and the Start button SHALL be enabled (unless `remainingSeconds === 0` in which case both start and reset are enabled and stop is disabled).

**Validates: Requirements 3.7, 3.8, 3.9**

---

## Error Handling

### Strategi Umum

- **Gagal diam-diam tidak diperbolehkan**: Setiap error yang memengaruhi pengguna HARUS menghasilkan notifikasi yang terlihat.
- **Graceful degradation**: Kegagalan satu widget tidak boleh memblokir widget lainnya.
- **No unhandled exceptions**: Semua operasi `localStorage` dan parsing JSON dibungkus `try/catch`.

### Skenario Error dan Penanganannya

| Skenario | Penanganan |
|----------|-----------|
| `localStorage` tidak tersedia (throw pada akses) | Set `Storage.isAvailable = false`; lanjutkan dengan in-memory; tampilkan banner peringatan permanen di atas dasbor |
| JSON parse gagal untuk key tertentu | `Storage.load(key)` return `null`; widget bersangkutan inisialisasi dengan state kosong; tampilkan notifikasi "Data sebelumnya tidak dapat dipulihkan" (toast/alert, sekali per sesi) |
| `AudioContext` tidak tersedia | Lewati pembuatan suara; hanya tampilkan indikator visual saat timer selesai |
| `Intl.DateTimeFormat` tidak tersedia | Fallback ke `Date.prototype.get*` untuk format tanggal manual |
| `crypto.randomUUID` tidak tersedia | Fallback ke `Date.now().toString(36) + Math.random()` untuk ID generation |
| Input melebihi batas (teks > 200 char, label > 50 char) | Validator menolak; tampilkan pesan error inline di bawah input field terkait |
| Quick links sudah mencapai 20 item | Nonaktifkan tombol "Tambah Link"; tampilkan keterangan "Batas maksimal 20 tautan tercapai" |

### Notifikasi ke Pengguna

- **Banner permanen** (di atas halaman): untuk `localStorage` tidak tersedia — muncul selama seluruh sesi
- **Toast notification** (muncul 3–5 detik): untuk data rusak dari `localStorage` — muncul sekali saat halaman dimuat
- **Inline error message** (di bawah input): untuk validasi input yang gagal — muncul saat submit, hilang saat input berubah

---

## Testing Strategy

### Pendekatan Pengujian Ganda

Karena proyek ini menggunakan Vanilla JS tanpa framework, testing menggunakan **Vitest** (zero-config, mendukung ES modules, tidak memerlukan build setup untuk unit test) atau alternatifnya **Jest** dengan jsdom.

Untuk property-based testing, digunakan library **fast-check** yang dapat diimport melalui `import` statement dalam test file.

### 1. Unit Tests (Example-Based)

Fokus pada skenario spesifik, edge cases, dan alur error:

- `storage.js`: load dengan key tidak ada (return null), load dengan JSON rusak (return null), save + load round-trip untuk setiap data type, behavior saat localStorage throw
- `validator.js`: setiap boundary condition — string kosong, satu karakter, tepat 200 karakter, 201 karakter, whitespace murni, URL dengan/tanpa http(s)
- `clock.js`: tengah malam (00:00:00), satu menit sebelum tengah malam (23:59:59), format dengan leading zero
- `greeting.js`: setiap boundary jam (04:59, 05:00, 11:59, 12:00, 14:59, 15:00, 17:59, 18:00)
- `timer.js`: start → stop → lanjut, reset dari berbagai state, completion dari `remainingSeconds=1`
- `todo.js`: tambah tugas → verifikasi id unik, toggle selesai, hapus tugas yang tidak ada (no-op)
- `quicklinks.js`: tambah link ke-20 (batas), coba tambah link ke-21 (ditolak)
- `theme.js`: default dark mode, toggle ke light, toggle kembali ke dark

### 2. Property-Based Tests (fast-check)

Setiap property di bawah harus dijalankan minimum **100 iterasi**. Gunakan tag komentar:
`// Feature: life-dashboard, Property N: <deskripsi singkat>`

**Library**: `fast-check` — import sebagai modul dalam test file

```javascript
import fc from 'fast-check';
```

| Property | Arbitrary (Generator) | Assertion |
|----------|----------------------|-----------|
| **P1**: formatTime clock | `fc.date()` | output matches `/^\d{2}:\d{2}:\d{2}$/` |
| **P2**: formatDate no leading zero | `fc.date()` | day number in output has no leading zero |
| **P3**: greeting by hour | `fc.integer({min:0, max:23})` | output is one of four valid greetings, correct for range |
| **P4**: greeting includes username | `fc.string({minLength:1}).filter(s => s.trim().length > 0)` | greeting contains username |
| **P5**: validator rejects invalid task text | `fc.oneof(fc.constant(''), fc.string().map(s => ' '.repeat(s.length+1)), fc.string({minLength:201}))` | validateTaskText returns valid=false |
| **P6**: addTask increases list | `fc.array(fc.record({text:fc.string({minLength:1,maxLength:200})}))` + valid text | length+1, item present |
| **P7**: toggle round-trip | `fc.boolean()` (completed state) | double-toggle restores original |
| **P8**: saveEdit updates text | valid todo + valid new text | text updated, other fields unchanged |
| **P9**: sort order correctness | `fc.array(todoArbitrary)` + `fc.constantFrom('oldest','newest','status')` | sort invariant holds |
| **P10**: URL validation | `fc.string().filter(s => !s.startsWith('http://') && !s.startsWith('https://'))` | validateLinkUrl returns valid=false |
| **P11**: theme toggle round-trip | `fc.constantFrom('light','dark')` | toggle twice returns original |
| **P12**: storage round-trip | `fc.jsonValue()` for each data type | load(save(v)) deep-equals v |
| **P13**: formatTime timer | `fc.integer({min:0, max:1500})` | output matches `MM:SS`, total seconds correct |
| **P14**: timer button state | `fc.boolean()` (isRunning) + `fc.integer({min:0,max:1500})` | button disabled state matches isRunning |

### 3. Integration / Smoke Tests

- Buka `index.html` via `file://` di setiap browser target → semua widget muncul
- Verifikasi `localStorage` round-trip setelah reload halaman nyata
- Verifikasi timer completion (audio + visual) pada browser dengan dan tanpa AudioContext
- Verifikasi tidak ada CORS error atau network request saat dibuka via `file://`

### Struktur File Test

```
project-root/
├── tests/
│   ├── unit/
│   │   ├── storage.test.js
│   │   ├── validator.test.js
│   │   ├── clock.test.js
│   │   ├── greeting.test.js
│   │   ├── timer.test.js
│   │   ├── todo.test.js
│   │   ├── quicklinks.test.js
│   │   └── theme.test.js
│   └── property/
│       ├── clock.property.test.js
│       ├── greeting.property.test.js
│       ├── timer.property.test.js
│       ├── todo.property.test.js
│       ├── quicklinks.property.test.js
│       ├── theme.property.test.js
│       └── storage.property.test.js
└── package.json  (devDependencies: vitest, fast-check, jsdom)
```

> **Catatan**: File test dan `package.json` adalah untuk keperluan development/testing saja dan tidak memengaruhi produksi. File HTML/CSS/JS utama tetap berjalan tanpa dependensi apapun via `file://`.
