# Asumsi Desain

Brief bersifat open-ended, jadi berikut asumsi eksplisit yang kami ambil saat
hal tersebut tidak dirinci:

1. **Apotek (`pharmacies`) adalah entitas terpisah dari klinik (`clinics`).**
   Brief menyebut "stok apotek" tanpa menyamakannya dengan klinik, dan di
   dunia nyata satu grup bisa punya klinik & apotek di lokasi berbeda. Obat
   yang dibeli pasien tidak diasumsikan terkait langsung dengan hasil
   konsultasi/booking.

2. **Katalog obat bersifat global, stok & harga per apotek.** `medicines`
   menyimpan info yang sama di semua apotek (nama, SKU, deskripsi).
   `pharmacy_stock` (junction table) menyimpan stok & harga yang berbeda di
   tiap apotek, sesuai requirement "Stok dan harga obat ditentukan per
   apotek".

3. **Jadwal dokter bersifat mingguan & berulang** (`day_of_week` + jam),
   bukan tanggal spesifik. Saat pasien booking, mereka memilih
   `booking_date` konkret yang jatuh pada hari tersebut. Ini menghindari
   duplikasi ratusan baris jadwal untuk tiap minggu.

4. **Satu akun `users` hanya boleh berperan sebagai `patient` ATAU `admin`**,
   bukan dokter — dokter dikelola sebagai data operasional (`doctors`) oleh
   admin, bukan sebagai user yang login sendiri. Ini sesuai cakupan brief
   yang hanya minta "registrasi dan login" untuk pasien.

5. **Harga di `transaction_items` dibekukan (`price_at_purchase`)** agar
   riwayat transaksi tetap akurat walau admin apotek mengubah harga di
   `pharmacy_stock` setelahnya. `sku_at_purchase` juga dibekukan untuk alasan
   yang sama.

6. **Status booking dibatasi 3 nilai** (`menunggu`, `selesai`, `dibatalkan`)
   sesuai requirement, diimplementasikan dengan `CHECK` constraint —
   bukan tabel referensi terpisah karena nilainya tetap dan kecil.

7. **Validasi "dokter hanya bisa dijadwalkan di klinik tempat ia terdaftar"**
   ditegakkan di application layer (route booking), karena constraint lintas
   tabel semacam ini tidak bisa dinyatakan murni dengan `CHECK` di PostgreSQL
   tanpa trigger.

8. **Pembelian obat tidak mengurangi stok otomatis lewat trigger DB** — proses
   dilakukan dalam satu transaction (BEGIN/COMMIT) di application layer,
   supaya alur bisnisnya (retry, validasi stok, dsb.) tetap terlihat jelas
   di kode Node.js untuk keperluan workshop ini.
