# Apa yang AI Salah & Bagaimana Saya Perbaiki

Bagian ini wajib diisi ulang oleh masing-masing kelompok sesuai proses
kalian sendiri. Draf di bawah adalah **contoh nyata** dari revisi yang
dilakukan saat skema awal (hasil pertama dari AI) dirapikan menjadi skema
final di `database/schema.sql` — silakan pakai sebagai referensi format,
tapi ganti dengan temuan kalian sendiri kalau proses kalian berbeda.

## Temuan 1 — Harga disimpan sebagai `FLOAT`

**Draf awal AI** membuat kolom `price FLOAT` dan `total_price FLOAT` pada
tabel obat & transaksi.

**Kenapa salah:** `FLOAT`/`DOUBLE` adalah representasi biner yang tidak
presisi untuk pecahan desimal — operasi seperti `0.1 + 0.2` bisa
menghasilkan `0.30000000000000004`. Untuk uang, ini berarti total transaksi
bisa meleset beberapa rupiah setelah banyak operasi, dan sulit dilacak.

**Perbaikan:** Diganti ke `NUMERIC(12,2)` di semua kolom uang
(`pharmacy_stock.price`, `transactions.total_price`,
`transaction_items.price_at_purchase`, `.subtotal`). `NUMERIC` menyimpan
nilai desimal secara eksak, cocok untuk kalkulasi finansial.

## Temuan 2 — Relasi M:N dokter–klinik disederhanakan jadi kolom `clinic_id` tunggal di `doctors`

**Draf awal AI** menambahkan kolom `clinic_id` langsung di tabel `doctors`
untuk menunjukkan "dokter praktik di klinik mana".

**Kenapa salah:** Requirement eksplisit menyebut *"Satu dokter bisa praktik
di lebih dari satu klinik"* — ini relasi many-to-many. Kolom `clinic_id`
tunggal hanya bisa menyimpan satu klinik per dokter, jadi begitu dokter
kedua ditambahkan ke klinik lain, data akan tertimpa atau butuh duplikasi
baris dokter (redundansi + risiko update anomaly).

**Perbaikan:** Dibuat junction table `doctor_clinics (doctor_id, clinic_id)`
dengan composite primary key, plus `doctor_schedules` yang juga
mereferensikan `clinic_id` secara terpisah untuk tiap baris jadwal —
sehingga satu dokter bisa punya banyak baris jadwal di klinik berbeda tanpa
duplikasi data dokter itu sendiri.

## Temuan 3 — Stok & harga obat disimpan sebagai atribut langsung di tabel `medicines`

**Draf awal AI** menaruh `stock_qty` dan `price` sebagai kolom di tabel
`medicines`.

**Kenapa salah:** Requirement bilang *"Stok dan harga obat ditentukan per
apotek"* — artinya satu obat (misal Paracetamol) bisa punya stok & harga
**berbeda** di tiap apotek. Menaruhnya di `medicines` berarti hanya ada satu
harga/stok global, yang secara langsung melanggar requirement dan juga
melanggar 3NF (harga bergantung pada kombinasi obat+apotek, bukan hanya
obat).

**Perbaikan:** Dipisah jadi junction table `pharmacy_stock (pharmacy_id,
medicine_id, stock_qty, price)` dengan composite primary key — pola
many-to-many dengan atribut tambahan pada relasinya sendiri.

## Temuan 4 — Tidak ada `FOREIGN KEY` eksplisit pada beberapa relasi

**Draf awal AI** menyimpan `patient_id` dan `doctor_id` sebagai kolom biasa
di `bookings` tanpa constraint `REFERENCES`, hanya mengandalkan penamaan
kolom sebagai konvensi.

**Kenapa salah:** Tanpa `FOREIGN KEY`, database tidak menolak
`INSERT`/`UPDATE` yang merujuk ke `patient_id` atau `schedule_id` yang tidak
ada. Ini membuka celah data yatim (orphan rows) dan booking yang menunjuk ke
pasien/jadwal yang sudah dihapus.

**Perbaikan:** Semua relasi memakai `REFERENCES ... ON DELETE
CASCADE/RESTRICT/SET NULL` sesuai konteksnya — misal booking ikut terhapus
kalau pasien dihapus (`CASCADE`), tapi transaksi tidak boleh kehilangan
referensi ke apotek begitu saja (`RESTRICT`).

---

**Kesimpulan:** pola kesalahan AI di atas konsisten dengan bias umum LLM
saat men-generate skema cepat — cenderung memilih struktur paling
sederhana/flat daripada menormalisasi relasi many-to-many, dan sering lupa
bahwa uang butuh tipe data presisi eksak. Review manual terhadap setiap
relasi many-to-many dan tipe data finansial wajib dilakukan sebelum skema
dipakai produksi.
