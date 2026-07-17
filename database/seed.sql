-- ============================================================================
-- MediKita — Seed data
-- Password for every seeded account is: "password123"
-- (bcrypt hash below is generated once at seed time by scripts/seed.js;
--  this .sql file is kept for reference / manual psql runs and uses a
--  pre-computed bcrypt hash of "password123")
-- ============================================================================

INSERT INTO users (email, password_hash, role) VALUES
('siti.amelia@example.com', '$2b$10$CwTycUXWue0Thq9StjUM0uJ8kZfPqrE0lz1XwYb9x2Rw8OZmvE3S6', 'patient'),
('budi.santoso@example.com', '$2b$10$CwTycUXWue0Thq9StjUM0uJ8kZfPqrE0lz1XwYb9x2Rw8OZmvE3S6', 'patient'),
('admin@medikita.id',        '$2b$10$CwTycUXWue0Thq9StjUM0uJ8kZfPqrE0lz1XwYb9x2Rw8OZmvE3S6', 'admin');

INSERT INTO patients (user_id, full_name, date_of_birth, phone) VALUES
(1, 'Siti Amelia', '1996-04-12', '081234567890'),
(2, 'Budi Santoso', '1990-11-02', '081298765432');

INSERT INTO clinics (name, city, address, phone) VALUES
('Klinik Sehat Sentosa', 'Jakarta Selatan', 'Jl. Fatmawati No. 12', '0217654321'),
('Klinik Medika Utama', 'Bandung', 'Jl. Dago No. 45', '0224567890'),
('Klinik Keluarga Bahagia', 'Surabaya', 'Jl. Darmo No. 88', '0315678123'),
('Klinik Sehat Sentosa Cabang BSD', 'Tangerang Selatan', 'Jl. BSD Raya No. 3', '0217001122');

INSERT INTO doctors (full_name, specialization, email, phone) VALUES
('dr. Ayu Lestari, Sp.PD', 'Penyakit Dalam', 'ayu.lestari@medikita.id', '081111000001'),
('dr. Rangga Pratama, Sp.A', 'Anak', 'rangga.pratama@medikita.id', '081111000002'),
('dr. Maria Christin, Sp.KK', 'Kulit & Kelamin', 'maria.christin@medikita.id', '081111000003'),
('dr. Fajar Nugroho', 'Dokter Umum', 'fajar.nugroho@medikita.id', '081111000004'),
('dr. Intan Permatasari, Sp.THT', 'THT', 'intan.permatasari@medikita.id', '081111000005');

-- Many-to-many: dokter yang praktik di lebih dari satu klinik
INSERT INTO doctor_clinics (doctor_id, clinic_id) VALUES
(1, 1), (1, 4),
(2, 1), (2, 2),
(3, 2),
(4, 1), (4, 3), (4, 4),
(5, 3);

INSERT INTO doctor_schedules (doctor_id, clinic_id, day_of_week, start_time, end_time) VALUES
(1, 1, 1, '09:00', '13:00'),
(1, 4, 3, '14:00', '18:00'),
(2, 1, 2, '10:00', '14:00'),
(2, 2, 5, '09:00', '12:00'),
(3, 2, 4, '13:00', '17:00'),
(4, 1, 1, '08:00', '12:00'),
(4, 3, 2, '08:00', '12:00'),
(4, 4, 6, '09:00', '13:00'),
(5, 3, 5, '10:00', '15:00');

INSERT INTO bookings (patient_id, schedule_id, booking_date, status, notes) VALUES
(1, 1, '2026-07-13', 'menunggu', 'Kontrol rutin gula darah'),
(2, 4, '2026-07-14', 'selesai', 'Imunisasi anak'),
(1, 6, '2026-07-20', 'dibatalkan', NULL);

INSERT INTO medicine_categories (name) VALUES
('Obat Bebas'), ('Obat Bebas Terbatas'), ('Vitamin & Suplemen'), ('Obat Resep'), ('Alat Kesehatan');

INSERT INTO medicines (sku, name, description, category_id) VALUES
('MED-0001', 'Paracetamol 500mg (10 tablet)', 'Meredakan demam dan nyeri ringan.', 1),
('MED-0002', 'Vitamin C 1000mg (30 tablet)', 'Suplemen daya tahan tubuh.', 3),
('MED-0003', 'Antasida Sirup 150ml', 'Meredakan gejala maag dan asam lambung.', 1),
('MED-0004', 'Amoxicillin 500mg (10 kapsul)', 'Antibiotik, wajib resep dokter.', 4),
('MED-0005', 'CTM 4mg (10 tablet)', 'Meredakan alergi dan gatal-gatal.', 2),
('MED-0006', 'Masker Medis (50 pcs)', 'Masker sekali pakai 3-ply.', 5),
('MED-0007', 'Minyak Kayu Putih 60ml', 'Menghangatkan tubuh, meredakan perut kembung.', 1);

INSERT INTO pharmacies (name, city, address) VALUES
('Apotek MediKita Fatmawati', 'Jakarta Selatan', 'Jl. Fatmawati No. 12A'),
('Apotek MediKita Dago', 'Bandung', 'Jl. Dago No. 47'),
('Apotek MediKita Darmo', 'Surabaya', 'Jl. Darmo No. 90');

INSERT INTO pharmacy_stock (pharmacy_id, medicine_id, stock_qty, price) VALUES
(1, 1, 120, 12000.00),
(1, 2, 80,  45000.00),
(1, 3, 40,  28000.00),
(1, 4, 15,  35000.00),
(1, 6, 200, 25000.00),
(2, 1, 60,  12500.00),
(2, 2, 50,  47000.00),
(2, 5, 90,  9000.00),
(2, 7, 70,  15000.00),
(3, 1, 30,  11800.00),
(3, 3, 25,  27500.00),
(3, 6, 150, 24000.00),
(3, 7, 45,  14500.00);

INSERT INTO transactions (patient_id, pharmacy_id, total_price) VALUES
(1, 1, 57000.00),
(2, 2, 18000.00);

INSERT INTO transaction_items (transaction_id, medicine_id, sku_at_purchase, price_at_purchase, quantity) VALUES
(1, 1, 'MED-0001', 12000.00, 1),
(1, 2, 'MED-0002', 45000.00, 1),
(2, 5, 'MED-0005', 9000.00, 2);
