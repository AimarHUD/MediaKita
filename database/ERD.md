# MediKita — Entity Relationship Diagram

Notasi: **Crow's Foot**. Diagram dibuat di [dbdiagram.io](https://dbdiagram.io) —
tempel kode DBML di bawah ini ke sana untuk melihat/mengedit versi visualnya.

## Ringkasan Entitas

| Entitas | Deskripsi |
|---|---|
| `users` | Akun login (pasien / admin) |
| `patients` | Profil pasien, 1:1 dengan `users` |
| `clinics` | Klinik partner beserta kota |
| `doctors` | Data dokter & spesialisasi |
| `doctor_clinics` | **Junction table** — dokter bisa praktik di banyak klinik (M:N) |
| `doctor_schedules` | Jadwal praktik dokter per klinik (hari + jam) |
| `bookings` | Booking pasien pada suatu jadwal & tanggal tertentu |
| `medicine_categories` | Kategori obat |
| `medicines` | Katalog obat (nama, SKU, deskripsi) — global, tidak per apotek |
| `pharmacies` | Apotek partner |
| `pharmacy_stock` | **Junction table** — stok & harga obat, per apotek (M:N + atribut) |
| `transactions` | Header transaksi pembelian obat seorang pasien |
| `transaction_items` | Rincian item per transaksi (SKU, harga saat beli, qty) |

## Relasi kunci

- `users (1) ── (1) patients` — profil pasien memperluas akun login.
- `doctors (M) ── (N) clinics` lewat `doctor_clinics` — satu dokter bisa di banyak klinik.
- `doctors (1) ── (N) doctor_schedules ── (N) clinics` — tiap baris jadwal terikat ke satu klinik.
- `patients (1) ── (N) bookings ── (1) doctor_schedules` — satu pasien bisa banyak booking.
- `medicines (M) ── (N) pharmacies` lewat `pharmacy_stock` — harga & stok **beda-beda per apotek**, bukan atribut global obat.
- `transactions (1) ── (N) transaction_items ── (1) medicines` — riwayat transaksi membekukan harga saat itu (`price_at_purchase`) agar tidak berubah walau harga di apotek berubah kemudian.

## Kode DBML (dbdiagram.io)

```dbml
Table users {
  id bigint [pk, increment]
  email varchar [unique, not null]
  password_hash varchar [not null]
  role varchar [not null, default: 'patient', note: 'patient | admin']
  created_at timestamp [default: `now()`]
}

Table patients {
  id bigint [pk, increment]
  user_id bigint [unique, not null, ref: - users.id]
  full_name varchar [not null]
  date_of_birth date
  phone varchar
  created_at timestamp [default: `now()`]
}

Table clinics {
  id bigint [pk, increment]
  name varchar [not null]
  city varchar [not null]
  address varchar
  phone varchar
}

Table doctors {
  id bigint [pk, increment]
  full_name varchar [not null]
  specialization varchar [not null]
  email varchar [unique]
  phone varchar
}

Table doctor_clinics {
  doctor_id bigint [not null, ref: > doctors.id]
  clinic_id bigint [not null, ref: > clinics.id]
  Indexes { (doctor_id, clinic_id) [pk] }
}

Table doctor_schedules {
  id bigint [pk, increment]
  doctor_id bigint [not null, ref: > doctors.id]
  clinic_id bigint [not null, ref: > clinics.id]
  day_of_week smallint [not null, note: '1=Senin .. 7=Minggu']
  start_time time [not null]
  end_time time [not null]
}

Table bookings {
  id bigint [pk, increment]
  patient_id bigint [not null, ref: > patients.id]
  schedule_id bigint [not null, ref: > doctor_schedules.id]
  booking_date date [not null]
  status varchar [not null, default: 'menunggu', note: 'menunggu | selesai | dibatalkan']
  notes varchar
  created_at timestamp [default: `now()`]
}

Table medicine_categories {
  id bigint [pk, increment]
  name varchar [unique, not null]
}

Table medicines {
  id bigint [pk, increment]
  sku varchar [unique, not null]
  name varchar [not null]
  description text
  category_id bigint [ref: > medicine_categories.id]
}

Table pharmacies {
  id bigint [pk, increment]
  name varchar [not null]
  city varchar [not null]
  address varchar
}

Table pharmacy_stock {
  pharmacy_id bigint [not null, ref: > pharmacies.id]
  medicine_id bigint [not null, ref: > medicines.id]
  stock_qty int [not null, default: 0]
  price decimal(12,2) [not null]
  updated_at timestamp [default: `now()`]
  Indexes { (pharmacy_id, medicine_id) [pk] }
}

Table transactions {
  id bigint [pk, increment]
  patient_id bigint [not null, ref: > patients.id]
  pharmacy_id bigint [not null, ref: > pharmacies.id]
  total_price decimal(12,2) [not null, default: 0]
  created_at timestamp [default: `now()`]
}

Table transaction_items {
  id bigint [pk, increment]
  transaction_id bigint [not null, ref: > transactions.id]
  medicine_id bigint [not null, ref: > medicines.id]
  sku_at_purchase varchar [not null]
  price_at_purchase decimal(12,2) [not null]
  quantity int [not null]
  subtotal decimal(12,2) [note: 'generated: price_at_purchase * quantity']
}
```

## Asumsi desain

Lihat `docs/ASUMSI.md` untuk daftar lengkap asumsi eksplisit yang diambil
karena tidak dirinci di brief (mis. apotek adalah entitas terpisah dari
klinik, jadwal bersifat mingguan berulang, dsb).
