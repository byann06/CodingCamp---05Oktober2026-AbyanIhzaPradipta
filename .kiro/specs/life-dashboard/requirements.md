# Requirements Document

## Introduction

Life Dashboard adalah sebuah halaman web mandiri yang berfungsi sebagai dasbor kehidupan sehari-hari. Proyek ini membantu pengguna mengatur aktivitas harian mereka melalui antarmuka yang bersih dan minimal. Dasbor menampilkan waktu dan tanggal saat ini, salam personal, daftar tugas (to-do list) yang dapat dikelola sepenuhnya, timer fokus berbasis teknik Pomodoro, serta tautan cepat ke situs web favorit pengguna. Seluruh data disimpan di sisi klien menggunakan Local Storage browser sehingga tidak memerlukan server backend. Proyek dibangun hanya menggunakan HTML, CSS, dan JavaScript Vanilla.

---

## Glossary

- **Dasbor**: Halaman utama Life Dashboard yang menampilkan semua widget secara terpadu.
- **Widget**: Komponen fungsional mandiri dalam dasbor (misalnya: Jam, Timer Fokus, To-Do List, Quick Links).
- **To-Do List**: Daftar tugas yang dapat ditambah, diedit, ditandai selesai, dan dihapus oleh pengguna.
- **Tugas**: Satu item pekerjaan dalam To-Do List.
- **Timer Fokus**: Widget penghitung mundur 25 menit untuk sesi kerja terfokus (Pomodoro).
- **Quick Links**: Kumpulan tombol tautan cepat yang mengarah ke situs web favorit pengguna.
- **Local Storage**: API penyimpanan bawaan browser yang menyimpan data secara persisten di sisi klien.
- **Salam**: Pesan sambutan dinamis yang disesuaikan dengan waktu hari dan nama pengguna.
- **Mode Tampilan**: Pengaturan tema visual dasbor, yaitu Light Mode (terang) atau Dark Mode (gelap).
- **Pengguna**: Individu yang mengakses dan menggunakan Life Dashboard melalui browser.
- **Validator**: Komponen logika JavaScript yang memvalidasi input sebelum disimpan.
- **Penyimpanan**: Komponen yang bertanggung jawab membaca dan menulis data ke Local Storage.

---

## Requirements

### Requirement 1: Tampilan Waktu dan Tanggal

**User Story:** Sebagai pengguna, saya ingin melihat waktu dan tanggal saat ini secara real-time, sehingga saya selalu tahu konteks waktu tanpa harus membuka aplikasi lain.

#### Acceptance Criteria

1. WHEN detik berganti, THE Dasbor SHALL memperbarui tampilan jam digital dalam format HH:MM:SS dalam waktu ≤100ms setelah perubahan detik terjadi.
2. THE Dasbor SHALL menampilkan tanggal lengkap dalam format nama hari, tanggal bulan tahun tanpa leading zero pada angka tanggal (contoh: Senin, 5 Oktober 2026, bukan Senin, 05 Oktober 2026).
3. WHEN detik berganti, THE Dasbor SHALL memperbarui tampilan waktu tanpa memuat ulang halaman.
4. WHEN halaman dimuat, THE Dasbor SHALL menampilkan waktu berdasarkan zona waktu lokal browser pengguna; IF zona waktu browser tidak tersedia, THEN THE Dasbor SHALL menampilkan waktu berdasarkan UTC sebagai fallback.

---

### Requirement 2: Salam Personal

**User Story:** Sebagai pengguna, saya ingin menerima salam yang disesuaikan dengan waktu hari dan nama saya, sehingga dasbor terasa lebih personal dan ramah.

#### Acceptance Criteria

1. WHEN waktu berada antara pukul 05:00 dan 11:59, THE Dasbor SHALL menampilkan salam "Selamat Pagi".
2. WHEN waktu berada antara pukul 12:00 dan 14:59, THE Dasbor SHALL menampilkan salam "Selamat Siang".
3. WHEN waktu berada antara pukul 15:00 dan 17:59, THE Dasbor SHALL menampilkan salam "Selamat Sore".
4. WHEN waktu berada antara pukul 18:00 dan 04:59, THE Dasbor SHALL menampilkan salam "Selamat Malam".
5. WHERE pengguna telah mengatur nama kustom, THE Dasbor SHALL menyertakan nama tersebut dalam salam (contoh: "Selamat Pagi, Abyan!").
6. WHERE pengguna belum mengatur nama kustom, THE Dasbor SHALL menampilkan salam tanpa nama (contoh: "Selamat Pagi!").
7. WHEN pengguna memasukkan nama kustom, THE Penyimpanan SHALL menyimpan nama tersebut ke Local Storage.
8. WHEN halaman dimuat ulang, THE Dasbor SHALL memuat nama kustom dari Local Storage dan menampilkannya dalam salam.
9. IF pengguna mengirimkan nama kustom yang kosong atau hanya berisi spasi, THEN THE Validator SHALL menolak input tersebut dan menampilkan salam tanpa nama.

---

### Requirement 3: Timer Fokus

**User Story:** Sebagai pengguna, saya ingin menggunakan timer hitung mundur 25 menit, sehingga saya dapat bekerja dalam sesi terfokus menggunakan teknik Pomodoro.

#### Acceptance Criteria

1. THE Timer_Fokus SHALL menampilkan waktu tersisa dalam format MM:SS dengan nilai awal 25:00.
2. WHEN pengguna menekan tombol Mulai sementara timer sedang tidak berjalan, THE Timer_Fokus SHALL memulai hitung mundur dari waktu yang sedang ditampilkan; menekan Mulai setelah Berhenti akan melanjutkan hitungan dari waktu tersisa yang ditampilkan saat itu.
3. WHILE hitung mundur sedang berjalan, THE Timer_Fokus SHALL mengurangi tampilan waktu sebesar satu detik setiap satu detik.
4. WHEN pengguna menekan tombol Berhenti, THE Timer_Fokus SHALL menghentikan hitung mundur pada waktu yang tersisa saat itu.
5. WHEN pengguna menekan tombol Reset, THE Timer_Fokus SHALL menghentikan hitung mundur dan mengembalikan tampilan ke 25:00.
6. WHEN hitung mundur mencapai 00:00, THE Timer_Fokus SHALL berhenti secara otomatis dan memberikan sinyal kepada pengguna berupa indikator visual yang terlihat di layar DAN suara audio berdurasi 1 hingga 3 detik.
7. WHILE hitung mundur sedang berjalan, THE Timer_Fokus SHALL menonaktifkan tombol Mulai.
8. WHILE hitung mundur sedang tidak berjalan, THE Timer_Fokus SHALL menonaktifkan tombol Berhenti.
9. WHEN hitung mundur mencapai 00:00, THE Timer_Fokus SHALL menonaktifkan tombol Berhenti dan mengaktifkan tombol Mulai serta tombol Reset.

---

### Requirement 4: Pengelolaan To-Do List

**User Story:** Sebagai pengguna, saya ingin mengelola daftar tugas harian saya secara penuh, sehingga saya dapat merencanakan, melacak, dan menyelesaikan pekerjaan dengan terorganisir.

#### Acceptance Criteria

1. WHEN pengguna memasukkan teks tugas yang tidak kosong dan tidak melebihi 200 karakter, lalu mengkonfirmasi penambahan, THE To_Do_List SHALL menambahkan tugas baru ke daftar.
2. IF pengguna mencoba menambahkan tugas dengan input kosong, hanya berisi spasi, atau melebihi 200 karakter, THEN THE Validator SHALL menolak input dan tidak menambahkan tugas ke daftar.
3. WHEN pengguna memilih opsi edit pada suatu tugas, THE To_Do_List SHALL menampilkan input yang sudah terisi teks tugas saat ini untuk diubah.
4. WHEN pengguna menyimpan hasil edit dengan teks yang tidak kosong dan tidak melebihi 200 karakter, THE To_Do_List SHALL memperbarui teks tugas dengan teks yang baru.
5. IF pengguna menyimpan hasil edit dengan teks kosong, hanya berisi spasi, atau melebihi 200 karakter, THEN THE Validator SHALL menolak perubahan dan mempertahankan teks tugas sebelumnya.
6. WHEN pengguna mencentang kotak selesai pada suatu tugas, THE To_Do_List SHALL menandai tugas tersebut sebagai selesai dengan tampilan teks dicoret (strikethrough) dan opacity teks dikurangi.
7. WHEN pengguna menghapus centang pada tugas yang sudah selesai, THE To_Do_List SHALL mengembalikan status tugas tersebut menjadi belum selesai.
8. WHEN pengguna memilih opsi hapus pada suatu tugas, THE To_Do_List SHALL menampilkan langkah konfirmasi; WHEN pengguna mengkonfirmasi penghapusan, THE To_Do_List SHALL menghapus tugas tersebut dari daftar secara permanen.
9. WHEN tugas ditambahkan, diubah, ditandai selesai, atau dihapus, THE Penyimpanan SHALL menyimpan seluruh daftar tugas terbaru ke Local Storage.
10. WHEN halaman dimuat ulang, THE To_Do_List SHALL memuat dan menampilkan seluruh tugas yang tersimpan dari Local Storage.
11. IF Local Storage tidak tersedia atau mengalami kerusakan saat operasi penyimpanan tugas, THEN THE To_Do_List SHALL tetap berfungsi menggunakan data in-memory selama sesi berlangsung tanpa memblokir atau menggagalkan operasi pengguna.

---

### Requirement 5: Pengurutan To-Do List

**User Story:** Sebagai pengguna, saya ingin mengurutkan daftar tugas saya, sehingga saya dapat memprioritaskan dan melihat tugas dengan lebih terstruktur.

#### Acceptance Criteria

1. THE To_Do_List SHALL menyediakan opsi pengurutan: berdasarkan urutan penambahan terlama (terlama), berdasarkan urutan penambahan terbaru (terbaru), dan berdasarkan status (belum selesai dahulu).
2. WHEN pengguna memilih opsi pengurutan, THE To_Do_List SHALL menampilkan ulang daftar tugas sesuai kriteria pengurutan yang dipilih.
3. WHEN tugas baru ditambahkan sementara opsi pengurutan aktif, THE To_Do_List SHALL menempatkan tugas baru sesuai aturan berikut: pada mode terlama tugas baru ditempatkan di posisi paling akhir daftar; pada mode terbaru tugas baru ditempatkan di posisi paling awal daftar; pada mode status tugas baru yang belum selesai ditempatkan di atas tugas yang sudah selesai.
4. WHEN pengguna memilih opsi pengurutan, THE Penyimpanan SHALL menyimpan preferensi pengurutan tersebut ke Local Storage.
5. WHEN halaman dimuat ulang, THE To_Do_List SHALL memuat preferensi pengurutan dari Local Storage dan menerapkannya pada daftar tugas; IF Local Storage kosong atau tidak memiliki preferensi pengurutan tersimpan, THEN THE To_Do_List SHALL menggunakan urutan penambahan terlama sebagai default.
6. IF Local Storage tidak tersedia, THEN THE To_Do_List SHALL menggunakan urutan penambahan terlama sebagai pengurutan default tanpa memblokir error atau menggagalkan tampilan daftar.

---

### Requirement 6: Pengelolaan Quick Links

**User Story:** Sebagai pengguna, saya ingin menyimpan dan mengakses tautan ke situs web favorit saya, sehingga saya dapat membuka situs yang sering dikunjungi dengan cepat langsung dari dasbor.

#### Acceptance Criteria

1. THE Quick_Links SHALL menampilkan daftar tombol tautan yang masing-masing memiliki label dan URL tujuan.
2. WHEN pengguna menambahkan quick link baru dengan label yang valid (tidak kosong dan tidak melebihi 50 karakter) dan URL yang valid, sementara jumlah quick link belum mencapai 20, THE Quick_Links SHALL menambahkan tombol tautan baru ke daftar.
3. IF pengguna mencoba menambahkan quick link dengan label kosong, label melebihi 50 karakter, atau URL kosong, THEN THE Validator SHALL menolak input dan tidak menambahkan tautan.
4. IF pengguna memasukkan URL yang tidak diawali dengan `http://` atau `https://`, THEN THE Validator SHALL menolak input dan menampilkan pesan kesalahan format URL.
5. WHEN pengguna mengklik tombol quick link, THE Quick_Links SHALL membuka URL tujuan di tab browser baru.
6. WHEN pengguna memilih opsi hapus pada suatu quick link, THE Quick_Links SHALL menghapus tombol tautan tersebut dari daftar secara langsung tanpa dialog konfirmasi.
7. WHEN quick link ditambahkan atau dihapus, THE Penyimpanan SHALL menyimpan seluruh daftar quick link terbaru ke Local Storage.
8. WHEN halaman dimuat ulang, THE Quick_Links SHALL memuat dan menampilkan seluruh quick link yang tersimpan dari Local Storage.
9. IF Local Storage tidak tersedia saat operasi penyimpanan quick link, THEN THE Quick_Links SHALL tetap berfungsi menggunakan data in-memory selama sesi berlangsung tanpa memblokir operasi pengguna.

---

### Requirement 7: Light / Dark Mode

**User Story:** Sebagai pengguna, saya ingin dapat beralih antara tampilan terang dan gelap, sehingga saya dapat menyesuaikan estetika dasbor dengan preferensi dan kondisi cahaya sekitar saya.

#### Acceptance Criteria

1. THE Dasbor SHALL menerapkan Dark Mode sebagai mode tampilan default saat pertama kali diakses.
2. WHEN pengguna mengklik tombol pengalih mode tampilan, THE Dasbor SHALL beralih antara Light Mode dan Dark Mode.
3. WHEN mode tampilan berubah, THE Penyimpanan SHALL menyimpan preferensi mode tampilan tersebut ke Local Storage.
4. WHEN halaman dimuat ulang, THE Dasbor SHALL memuat preferensi mode tampilan dari Local Storage dan menerapkannya dalam waktu ≤100ms setelah halaman selesai dimuat sehingga tidak terjadi kedipan yang terlihat oleh pengguna.
5. WHEN mode tampilan aktif, THE Dasbor SHALL menampilkan ikon atau label pada tombol pengalih yang berubah secara visual dan dapat dibedakan secara kasat mata antara state Light Mode dan state Dark Mode.
6. IF Local Storage tidak tersedia, THEN THE Dasbor SHALL menggunakan Dark Mode sebagai mode tampilan default tanpa memblokir error atau menggagalkan pemuatan halaman.

---

### Requirement 8: Persistensi Data dan Integritas Penyimpanan

**User Story:** Sebagai pengguna, saya ingin semua data saya tersimpan secara otomatis dan tetap ada saat saya menutup dan membuka kembali browser, sehingga saya tidak perlu memasukkan ulang informasi setiap saat.

#### Acceptance Criteria

1. WHEN pengguna menambahkan, mengubah, menghapus tugas, menambahkan atau menghapus quick link, mengubah nama kustom, mengubah preferensi pengurutan, atau mengubah preferensi mode tampilan, THE Penyimpanan SHALL menyimpan data terbaru ke Local Storage secara otomatis tanpa intervensi manual pengguna.
2. WHEN halaman dimuat, THE Penyimpanan SHALL memuat semua data yang tersimpan dari Local Storage sebelum merender widget apa pun.
3. IF Local Storage tidak tersedia di browser pengguna, THEN THE Dasbor SHALL tetap berfungsi selama sesi berlangsung menggunakan data in-memory dengan operasi penambahan tugas, pengelolaan quick link, pengaturan nama, pengurutan, dan pergantian mode tampilan tetap dapat digunakan, serta menampilkan peringatan permanen yang terlihat sepanjang sesi bahwa data tidak akan tersimpan.
4. IF data yang dibaca dari Local Storage rusak, tidak dapat di-parse, atau tidak valid secara struktural, THEN THE Penyimpanan SHALL mengabaikan data yang bermasalah tersebut, menginisialisasi widget yang bersangkutan dengan data kosong, dan menampilkan notifikasi kepada pengguna bahwa data sebelumnya tidak dapat dipulihkan.

---

### Requirement 9: Kompatibilitas dan Performa

**User Story:** Sebagai pengguna, saya ingin dasbor bekerja dengan baik di berbagai browser modern dan merespons setiap interaksi dengan cepat, sehingga pengalaman penggunaan terasa mulus.

#### Acceptance Criteria

1. THE Dasbor SHALL dapat diakses dan berfungsi penuh pada browser Chrome, Firefox, Edge, dan Safari yang versinya dirilis dalam 24 bulan terakhir.
2. THE Dasbor SHALL menyelesaikan pemuatan awal halaman dalam waktu kurang dari 3 detik pada koneksi internet dengan bandwidth minimal 10 Mbps.
3. WHEN pengguna melakukan interaksi berupa klik tombol, toggle checkbox, atau input teks pada widget mana pun, THE Dasbor SHALL merespons dan memperbarui tampilan dalam waktu kurang dari 100 milidetik.
4. THE Dasbor SHALL dapat dijalankan sebagai halaman web mandiri dengan cara membuka file HTML langsung di browser melalui protokol `file://` tanpa memerlukan koneksi internet atau server backend.

---

### Requirement 10: Struktur Kode dan Organisasi File

**User Story:** Sebagai pengembang, saya ingin kode proyek terstruktur dengan rapi dan mudah dibaca, sehingga mudah dipahami, dipelihara, dan dikembangkan lebih lanjut.

#### Acceptance Criteria

1. THE Dasbor SHALL diimplementasikan menggunakan tepat satu file HTML, tepat satu file CSS di dalam folder `css/`, dan tepat satu file JavaScript di dalam folder `js/`, tanpa blok inline `<style>` maupun blok inline `<script>` di dalam file HTML.
2. THE Dasbor SHALL dibangun hanya menggunakan HTML, CSS, dan JavaScript Vanilla tanpa menggunakan framework, library eksternal, atau library yang dimuat melalui CDN apa pun.
3. THE Dasbor SHALL tidak memerlukan proses build, instalasi dependensi, atau konfigurasi server untuk dapat dijalankan; dijalankan didefinisikan sebagai membuka file HTML secara langsung di browser melalui protokol `file://` tanpa koneksi internet.
