require("dotenv").config();
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const { pool } = require("./db");

async function run() {
  const schemaPath = path.join(__dirname, "..", "..", "database", "schema.sql");
  const schemaSql = fs.readFileSync(schemaPath, "utf8");

  console.log("→ Menjalankan schema.sql ...");
  await pool.query(schemaSql);

  console.log("→ Mengisi data contoh ...");
  const passwordHash = await bcrypt.hash("password123", 10);

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const users = await client.query(
      `INSERT INTO users (email, password_hash, role) VALUES
        ('siti.amelia@example.com', $1, 'patient'),
        ('budi.santoso@example.com', $1, 'patient'),
        ('admin@medikita.id', $1, 'admin')
       RETURNING id`,
      [passwordHash]
    );
    const [siti, budi] = users.rows;

    const patients = await client.query(
      `INSERT INTO patients (user_id, full_name, date_of_birth, phone) VALUES
        ($1, 'Siti Amelia', '1996-04-12', '081234567890'),
        ($2, 'Budi Santoso', '1990-11-02', '081298765432')
       RETURNING id`,
      [siti.id, budi.id]
    );
    const [patSiti, patBudi] = patients.rows;

    const clinics = await client.query(
      `INSERT INTO clinics (name, city, address, phone) VALUES
        ('Klinik Sehat Sentosa', 'Jakarta Selatan', 'Jl. Fatmawati No. 12', '0217654321'),
        ('Klinik Medika Utama', 'Bandung', 'Jl. Dago No. 45', '0224567890'),
        ('Klinik Keluarga Bahagia', 'Surabaya', 'Jl. Darmo No. 88', '0315678123'),
        ('Klinik Sehat Sentosa Cabang BSD', 'Tangerang Selatan', 'Jl. BSD Raya No. 3', '0217001122')
       RETURNING id`
    );
    const [c1, c2, c3, c4] = clinics.rows;

    const doctors = await client.query(
      `INSERT INTO doctors (full_name, specialization, email, phone) VALUES
        ('dr. Ayu Lestari, Sp.PD', 'Penyakit Dalam', 'ayu.lestari@medikita.id', '081111000001'),
        ('dr. Rangga Pratama, Sp.A', 'Anak', 'rangga.pratama@medikita.id', '081111000002'),
        ('dr. Maria Christin, Sp.KK', 'Kulit & Kelamin', 'maria.christin@medikita.id', '081111000003'),
        ('dr. Fajar Nugroho', 'Dokter Umum', 'fajar.nugroho@medikita.id', '081111000004'),
        ('dr. Intan Permatasari, Sp.THT', 'THT', 'intan.permatasari@medikita.id', '081111000005')
       RETURNING id`
    );
    const [d1, d2, d3, d4, d5] = doctors.rows;

    await client.query(
      `INSERT INTO doctor_clinics (doctor_id, clinic_id) VALUES
        ($1,$5), ($1,$8),
        ($2,$5), ($2,$6),
        ($3,$6),
        ($4,$5), ($4,$7), ($4,$8),
        ($9,$7)`,
      [d1.id, d2.id, d3.id, d4.id, d5.id, c1.id, c2.id, c3.id, c4.id]
    );

    const schedules = await client.query(
      `INSERT INTO doctor_schedules (doctor_id, clinic_id, day_of_week, start_time, end_time) VALUES
        ($1, $6, 1, '09:00', '13:00'),
        ($1, $9, 3, '14:00', '18:00'),
        ($2, $6, 2, '10:00', '14:00'),
        ($2, $7, 5, '09:00', '12:00'),
        ($3, $7, 4, '13:00', '17:00'),
        ($4, $6, 1, '08:00', '12:00'),
        ($4, $8, 2, '08:00', '12:00'),
        ($4, $9, 6, '09:00', '13:00'),
        ($5, $8, 5, '10:00', '15:00')
       RETURNING id`,
      [d1.id, d2.id, d3.id, d4.id, d5.id, c1.id, c2.id, c3.id, c4.id]
    );
    const [s1, , s3, , , s6] = schedules.rows;

    await client.query(
      `INSERT INTO bookings (patient_id, schedule_id, booking_date, status, notes) VALUES
        ($1, $3, '2026-07-13', 'menunggu', 'Kontrol rutin gula darah'),
        ($2, $4, '2026-07-14', 'selesai', 'Imunisasi anak'),
        ($1, $5, '2026-07-20', 'dibatalkan', NULL)`,
      [patSiti.id, patBudi.id, s1.id, s3.id, s6.id]
    );

    const categories = await client.query(
      `INSERT INTO medicine_categories (name) VALUES
        ('Obat Bebas'), ('Obat Bebas Terbatas'), ('Vitamin & Suplemen'), ('Obat Resep'), ('Alat Kesehatan')
       RETURNING id`
    );
    const [catBebas, catTerbatas, catVitamin, catResep, catAlkes] = categories.rows;

    const medicines = await client.query(
      `INSERT INTO medicines (sku, name, description, category_id) VALUES
        ('MED-0001', 'Paracetamol 500mg (10 tablet)', 'Meredakan demam dan nyeri ringan.', $1),
        ('MED-0002', 'Vitamin C 1000mg (30 tablet)', 'Suplemen daya tahan tubuh.', $2),
        ('MED-0003', 'Antasida Sirup 150ml', 'Meredakan gejala maag dan asam lambung.', $1),
        ('MED-0004', 'Amoxicillin 500mg (10 kapsul)', 'Antibiotik, wajib resep dokter.', $3),
        ('MED-0005', 'CTM 4mg (10 tablet)', 'Meredakan alergi dan gatal-gatal.', $4),
        ('MED-0006', 'Masker Medis (50 pcs)', 'Masker sekali pakai 3-ply.', $5),
        ('MED-0007', 'Minyak Kayu Putih 60ml', 'Menghangatkan tubuh, meredakan perut kembung.', $1)
       RETURNING id`,
      [catBebas.id, catVitamin.id, catResep.id, catTerbatas.id, catAlkes.id]
    );
    const [m1, m2, m3, m4, m5, m6, m7] = medicines.rows;

    const pharmacies = await client.query(
      `INSERT INTO pharmacies (name, city, address) VALUES
        ('Apotek MediKita Fatmawati', 'Jakarta Selatan', 'Jl. Fatmawati No. 12A'),
        ('Apotek MediKita Dago', 'Bandung', 'Jl. Dago No. 47'),
        ('Apotek MediKita Darmo', 'Surabaya', 'Jl. Darmo No. 90')
       RETURNING id`
    );
    const [ph1, ph2, ph3] = pharmacies.rows;

    await client.query(
      `INSERT INTO pharmacy_stock (pharmacy_id, medicine_id, stock_qty, price) VALUES
        ($1, $4, 120, 12000.00),
        ($1, $5, 80,  45000.00),
        ($1, $6, 40,  28000.00),
        ($1, $7, 15,  35000.00),
        ($1, $9, 200, 25000.00),
        ($2, $4, 60,  12500.00),
        ($2, $5, 50,  47000.00),
        ($2, $8, 90,  9000.00),
        ($2, $10,70,  15000.00),
        ($3, $4, 30,  11800.00),
        ($3, $6, 25,  27500.00),
        ($3, $9, 150, 24000.00),
        ($3, $10,45,  14500.00)`,
      [ph1.id, ph2.id, ph3.id, m1.id, m2.id, m3.id, m4.id, m5.id, m6.id, m7.id]
    );

    const tx = await client.query(
      `INSERT INTO transactions (patient_id, pharmacy_id, total_price) VALUES
        ($1, $3, 57000.00),
        ($2, $4, 18000.00)
       RETURNING id`,
      [patSiti.id, patBudi.id, ph1.id, ph2.id]
    );
    const [tx1, tx2] = tx.rows;

    await client.query(
      `INSERT INTO transaction_items (transaction_id, medicine_id, sku_at_purchase, price_at_purchase, quantity) VALUES
        ($1, $3, 'MED-0001', 12000.00, 1),
        ($1, $4, 'MED-0002', 45000.00, 1),
        ($2, $5, 'MED-0005', 9000.00, 2)`,
      [tx1.id, tx2.id, m1.id, m2.id, m5.id]
    );

    await client.query("COMMIT");
    console.log("✔ Seed selesai. Akun demo (password: password123):");
    console.log("   - siti.amelia@example.com (patient)");
    console.log("   - budi.santoso@example.com (patient)");
    console.log("   - admin@medikita.id (admin)");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch((err) => {
  console.error("✘ Seed gagal:", err);
  process.exit(1);
});
