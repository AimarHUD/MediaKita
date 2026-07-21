# Eterna Care — Workshop Database Design

Implementasi lengkap tugas take-home Eterna Care: ERD Crow's Foot, skema
PostgreSQL yang sudah dinormalisasi, REST API (Node.js + Express), dan
antarmuka web (vanilla HTML/CSS/JS) untuk booking dokter serta pembelian
obat lintas apotek.

```
eternacare/
├── database/
│   ├── schema.sql        ← DDL PostgreSQL (tabel, FK, constraint, index)
│   ├── seed.sql           ← contoh data (referensi manual)
│   └── ERD.md             ← penjelasan ERD + kode DBML untuk dbdiagram.io
├── docs/
│   ├── ASUMSI.md          ← asumsi desain eksplisit
│   └── AI_REVIEW.md       ← bagian bonus "Apa yang AI salah & perbaikannya"
├── server/                ← REST API (Express + PostgreSQL)
│   └── src/
│       ├── index.js
│       ├── db.js
│       ├── seed.js        ← jalankan schema.sql + isi data contoh
│       ├── middleware/auth.js
│       └── routes/{auth,doctors,clinics,bookings,medicines,pharmacies,transactions}.js
├── public/                ← frontend statis (di-serve oleh server yang sama)
│   ├── index.html
│   ├── styles.css
│   └── app.js
└── docker-compose.yml     ← PostgreSQL lokal untuk development
```

## Menjalankan secara lokal

### 1. Siapkan PostgreSQL

Paling gampang pakai Docker:

```bash
docker compose up -d
```

Ini akan menjalankan PostgreSQL di `localhost:5432` dengan database
`eternacare`, user `eternacare`, password `eternacare` (lihat `docker-compose.yml`).

Tidak pakai Docker? Buat database PostgreSQL/MySQL manual lalu sesuaikan
`DATABASE_URL` di langkah berikut. (Query di `server/` ditulis untuk
PostgreSQL — untuk MySQL, sintaks seperti `ILIKE`, `RETURNING`, dan
`FILTER (WHERE ...)` perlu disesuaikan.)

### 2. Konfigurasi & install backend

```bash
cd server
cp .env.example .env
npm install
```

### 3. Buat skema & isi data contoh

```bash
npm run seed
```

Perintah ini menjalankan `database/schema.sql` lalu mengisi data contoh
(klinik, dokter, jadwal, obat, apotek, dsb).

Akun demo yang dibuat (password semua: `password123`):

| Email | Peran |
|---|---|
| siti.amelia@example.com | pasien |
| budi.santoso@example.com | pasien |
| admin@eternacare.id | admin (bisa kelola katalog obat) |

### 4. Jalankan server

```bash
npm start
```

Buka **http://localhost:4000** — server yang sama meng-serve API (`/api/*`)
dan frontend (`public/`), jadi tidak perlu setup CORS/proxy terpisah.

## Fitur yang diimplementasikan

- **User management** — registrasi & login pasien (JWT + bcrypt).
- **Klinik & dokter** — dokter bisa terdaftar di lebih dari satu klinik
  (many-to-many lewat `doctor_clinics`).
- **Jadwal & booking** — jadwal mingguan per dokter per klinik; pasien
  booking pada tanggal konkret; status `menunggu` / `selesai` /
  `dibatalkan`.
- **Katalog obat** — CRUD obat (khusus admin), kategori, SKU.
- **Stok & harga per apotek** — `pharmacy_stock` menyimpan stok & harga
  yang berbeda di tiap apotek untuk obat yang sama.
- **Transaksi** — pembelian mengunci stok (`FOR UPDATE`), membekukan
  harga saat transaksi, dan mengurangi stok dalam satu database
  transaction.
- **Search & filter** — cari dokter (nama/spesialisasi/kota), cari &
  filter obat (nama/kategori/rentang harga).

## Query utama (lihat kode untuk versi lengkap & ter-parametrize)

- Membuat booking → `POST /api/bookings` (`server/src/routes/bookings.js`)
- Riwayat transaksi pasien beserta rincian → `GET /api/transactions/me`
  (`server/src/routes/transactions.js`)
- Pencarian dokter → `GET /api/doctors?search=&specialization=&city=`
- Pencarian & filter obat → `GET /api/medicines?search=&category=&minPrice=&maxPrice=`

## Tools yang dipakai membangun proyek ini

- **dbdiagram.io** — desain ERD Crow's Foot (kode DBML ada di `database/ERD.md`)
- **Visual Studio Code** + **Kilo Code** (AI extension) — implementasi skema & kode

## Catatan

- Semua kolom uang memakai `NUMERIC(12,2)`, bukan `FLOAT`.
- Semua relasi punya `FOREIGN KEY` eksplisit dengan aksi `ON DELETE` yang
  masuk akal per konteks.
- Lihat `docs/ASUMSI.md` untuk daftar lengkap asumsi desain, dan
  `docs/AI_REVIEW.md` untuk bagian bonus review AI (silakan diisi ulang
  dengan temuan kelompok masing-masing).
