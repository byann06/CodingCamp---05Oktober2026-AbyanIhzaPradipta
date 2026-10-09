# Life Dashboard

Life Dashboard adalah dashboard harian berbasis HTML, CSS, dan JavaScript. Aplikasi ini menyediakan jam dan tanggal, salam personal, timer fokus, daftar tugas, serta tautan cepat. Data disimpan di `localStorage` browser.

## Fitur

- Jam digital dan tanggal dalam Bahasa Indonesia.
- Salam yang menyesuaikan waktu, dengan nama pengguna pilihan.
- Timer fokus 25 menit dengan kontrol mulai, berhenti, reset, dan bunyi selesai jika browser mendukung Web Audio.
- To-Do List dengan tambah, edit, hapus, tandai selesai, serta urutan terlama, terbaru, atau status.
- Quick Links dengan batas 20 tautan dan validasi URL `http://` atau `https://`.
- Tema dark dan light yang mengingat pilihan terakhir.
- Tampilan responsif untuk layar kecil; data tetap dapat digunakan selama sesi jika `localStorage` tidak tersedia.

## Menjalankan aplikasi

Aplikasi tidak memerlukan proses build atau dependensi runtime. Karena JavaScript menggunakan ES Modules, beberapa browser membatasi impor modul ketika halaman dibuka langsung melalui `file://`. Jalankan server statis lokal dari folder proyek agar kompatibilitas browser lebih baik:

```powershell
py -m http.server 8000
```

Lalu buka [http://localhost:8000](http://localhost:8000). Hentikan server dengan `Ctrl+C`.

Jika browser yang digunakan mengizinkan ES Modules dari file lokal, `index.html` juga dapat dibuka langsung.

## Data yang disimpan

Dashboard menyimpan data secara otomatis di browser yang sedang digunakan:

| Kunci | Isi |
| --- | --- |
| `ld_todos` | Daftar tugas |
| `ld_sort_order` | Preferensi urutan tugas |
| `ld_quick_links` | Daftar tautan cepat |
| `ld_username` | Nama personal |
| `ld_theme` | Tema `dark` atau `light` |

Data tidak disinkronkan antar-browser atau perangkat. Jika data penyimpanan rusak, aplikasi mengabaikan data yang tidak valid dan menampilkan notifikasi.

## Menjalankan test

Test menggunakan Vitest, fast-check, dan jsdom. Instal dependensi pengembangan lalu jalankan:

```powershell
npm install
npm test
```

Untuk menjalankan test dalam mode watch:

```powershell
npm run test:watch
```

## Struktur proyek

```text
├── index.html
├── css/
│   └── style.css
├── js/
│   ├── main.js          # Entry point dan inisialisasi widget
│   ├── clock.js         # Jam dan tanggal
│   ├── greeting.js      # Salam personal
│   ├── timer.js         # Timer fokus
│   ├── todo.js          # Daftar tugas
│   ├── quicklinks.js    # Tautan cepat
│   ├── theme.js         # Pengelola tema
│   ├── storage.js       # Abstraksi localStorage
│   └── validator.js     # Validasi input
└── tests/
    ├── unit/
    └── property/
```
