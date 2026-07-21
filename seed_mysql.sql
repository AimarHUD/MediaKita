-- ============================================================================
-- Eterna Care — Database Schema (MySQL / MariaDB)
-- Converted from database/schema.sql (PostgreSQL) for XAMPP (PHP + MySQL).
-- Money columns use DECIMAL(12,2), never FLOAT.
-- ============================================================================

DROP TABLE IF EXISTS transaction_items;
DROP TABLE IF EXISTS transactions;
DROP TABLE IF EXISTS pharmacy_stock;
DROP TABLE IF EXISTS medicines;
DROP TABLE IF EXISTS medicine_categories;
DROP TABLE IF EXISTS pharmacies;
DROP TABLE IF EXISTS bookings;
DROP TABLE IF EXISTS doctor_schedules;
DROP TABLE IF EXISTS doctor_clinics;
DROP TABLE IF EXISTS doctors;
DROP TABLE IF EXISTS clinics;
DROP TABLE IF EXISTS patients;
DROP TABLE IF EXISTS users;

-- ----------------------------------------------------------------------------
-- 1. USER MANAGEMENT
-- ----------------------------------------------------------------------------

CREATE TABLE users (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    email           VARCHAR(255) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    role            VARCHAR(20)  NOT NULL DEFAULT 'patient',
    created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_users_role CHECK (role IN ('patient', 'admin'))
);

CREATE TABLE patients (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id         BIGINT NOT NULL UNIQUE,
    full_name       VARCHAR(150) NOT NULL,
    date_of_birth   DATE,
    phone           VARCHAR(30),
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_patients_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ----------------------------------------------------------------------------
-- 2. KLINIK & DOKTER
-- ----------------------------------------------------------------------------

CREATE TABLE clinics (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(150) NOT NULL,
    city        VARCHAR(100) NOT NULL,
    address     VARCHAR(255),
    phone       VARCHAR(30),
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE doctors (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    full_name       VARCHAR(150) NOT NULL,
    specialization  VARCHAR(100) NOT NULL,
    email           VARCHAR(255) UNIQUE,
    phone           VARCHAR(30),
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE doctor_clinics (
    doctor_id   BIGINT NOT NULL,
    clinic_id   BIGINT NOT NULL,
    PRIMARY KEY (doctor_id, clinic_id),
    CONSTRAINT fk_dc_doctor FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE,
    CONSTRAINT fk_dc_clinic FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE
);

-- ----------------------------------------------------------------------------
-- 3. JADWAL & BOOKING
-- ----------------------------------------------------------------------------

CREATE TABLE doctor_schedules (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    doctor_id   BIGINT NOT NULL,
    clinic_id   BIGINT NOT NULL,
    day_of_week SMALLINT NOT NULL,
    start_time  TIME NOT NULL,
    end_time    TIME NOT NULL,
    CONSTRAINT chk_schedule_dow CHECK (day_of_week BETWEEN 1 AND 7),
    CONSTRAINT chk_schedule_time CHECK (end_time > start_time),
    CONSTRAINT uq_doctor_schedule UNIQUE (doctor_id, clinic_id, day_of_week, start_time),
    CONSTRAINT fk_ds_doctor FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE,
    CONSTRAINT fk_ds_clinic FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE
);

CREATE TABLE bookings (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    patient_id      BIGINT NOT NULL,
    schedule_id     BIGINT NOT NULL,
    booking_date    DATE NOT NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'menunggu',
    notes           VARCHAR(255),
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_booking_status CHECK (status IN ('menunggu', 'selesai', 'dibatalkan')),
    CONSTRAINT uq_booking_slot UNIQUE (schedule_id, booking_date, patient_id),
    CONSTRAINT fk_bookings_patient FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    CONSTRAINT fk_bookings_schedule FOREIGN KEY (schedule_id) REFERENCES doctor_schedules(id) ON DELETE RESTRICT
);

CREATE TABLE medical_records (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    patient_id      BIGINT NOT NULL,
    doctor_id       BIGINT NOT NULL,
    booking_id      BIGINT NOT NULL UNIQUE,
    diagnosis       TEXT NOT NULL,
    prescription    TEXT,
    notes           TEXT,
    visit_date      DATE,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_mr_patient FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    CONSTRAINT fk_mr_doctor  FOREIGN KEY (doctor_id)  REFERENCES doctors(id)  ON DELETE CASCADE,
    CONSTRAINT fk_mr_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
);

CREATE TABLE prescriptions (
    id                  BIGINT AUTO_INCREMENT PRIMARY KEY,
    medical_record_id   BIGINT NOT NULL,
    medicine_id         BIGINT NOT NULL,
    dosage              VARCHAR(100),
    quantity            INT NOT NULL,
    instruction         TEXT,
    CONSTRAINT fk_pr_medical FOREIGN KEY (medical_record_id) REFERENCES medical_records(id) ON DELETE CASCADE,
    CONSTRAINT fk_pr_medicine FOREIGN KEY (medicine_id) REFERENCES medicines(id) ON DELETE RESTRICT
);

-- ----------------------------------------------------------------------------
-- 4. KATALOG OBAT
-- ----------------------------------------------------------------------------

CREATE TABLE medicine_categories (
    id      BIGINT AUTO_INCREMENT PRIMARY KEY,
    name    VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE medicines (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    sku             VARCHAR(40) NOT NULL UNIQUE,
    name            VARCHAR(150) NOT NULL,
    description     TEXT,
    category_id     BIGINT,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_medicines_cat FOREIGN KEY (category_id) REFERENCES medicine_categories(id) ON DELETE SET NULL
);

-- ----------------------------------------------------------------------------
-- 5. STOK & HARGA (per apotek)
-- ----------------------------------------------------------------------------

CREATE TABLE pharmacies (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(150) NOT NULL,
    city        VARCHAR(100) NOT NULL,
    address     VARCHAR(255),
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE pharmacy_stock (
    pharmacy_id BIGINT NOT NULL,
    medicine_id BIGINT NOT NULL,
    stock_qty   INT NOT NULL DEFAULT 0,
    price       DECIMAL(12, 2) NOT NULL,
    updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (pharmacy_id, medicine_id),
    CONSTRAINT chk_stock_qty CHECK (stock_qty >= 0),
    CONSTRAINT chk_stock_price CHECK (price >= 0),
    CONSTRAINT fk_ps_pharmacy FOREIGN KEY (pharmacy_id) REFERENCES pharmacies(id) ON DELETE CASCADE,
    CONSTRAINT fk_ps_medicine FOREIGN KEY (medicine_id) REFERENCES medicines(id) ON DELETE CASCADE
);

-- ----------------------------------------------------------------------------
-- 6. TRANSAKSI
-- ----------------------------------------------------------------------------

CREATE TABLE transactions (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    patient_id      BIGINT NOT NULL,
    pharmacy_id     BIGINT NOT NULL,
    total_price     DECIMAL(12, 2) NOT NULL DEFAULT 0,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_tx_price CHECK (total_price >= 0),
    CONSTRAINT fk_tx_patient FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    CONSTRAINT fk_tx_pharmacy FOREIGN KEY (pharmacy_id) REFERENCES pharmacies(id) ON DELETE RESTRICT
);

CREATE TABLE transaction_items (
    id                  BIGINT AUTO_INCREMENT PRIMARY KEY,
    transaction_id      BIGINT NOT NULL,
    medicine_id         BIGINT NOT NULL,
    sku_at_purchase     VARCHAR(40) NOT NULL,
    price_at_purchase   DECIMAL(12, 2) NOT NULL,
    quantity            INT NOT NULL,
    CONSTRAINT chk_ti_price CHECK (price_at_purchase >= 0),
    CONSTRAINT chk_ti_qty CHECK (quantity > 0),
    CONSTRAINT fk_ti_tx FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE,
    CONSTRAINT fk_ti_medicine FOREIGN KEY (medicine_id) REFERENCES medicines(id) ON DELETE RESTRICT
);

-- ----------------------------------------------------------------------------
-- INDEXES
-- ----------------------------------------------------------------------------

CREATE INDEX idx_doctors_name            ON doctors (full_name);
CREATE INDEX idx_doctors_specialization  ON doctors (specialization);
CREATE INDEX idx_clinics_city            ON clinics (city);
CREATE INDEX idx_medicines_name          ON medicines (name);
CREATE INDEX idx_medicines_category      ON medicines (category_id);
CREATE INDEX idx_pharmacy_stock_price    ON pharmacy_stock (price);
CREATE INDEX idx_bookings_patient        ON bookings (patient_id);
CREATE INDEX idx_transactions_patient    ON transactions (patient_id);

-- ============================================================================
-- SEED DATA
-- Password for every account is: "password123"
-- Hash below is bcrypt of "password123" (same value used by server/src/seed.js).
-- ============================================================================

INSERT INTO users (email, password_hash, role) VALUES
('siti.amelia@example.com', '$2y$10$e4Bkkhh4ABhvczawGvhWSOeFR5wbSY0UTyQueg.lReShjETCX9Kuy', 'patient'),
('budi.santoso@example.com', '$2y$10$e4Bkkhh4ABhvczawGvhWSOeFR5wbSY0UTyQueg.lReShjETCX9Kuy', 'patient'),
('admin@eternacare.id',        '$2y$10$e4Bkkhh4ABhvczawGvhWSOeFR5wbSY0UTyQueg.lReShjETCX9Kuy', 'admin');

INSERT INTO patients (user_id, full_name, date_of_birth, phone) VALUES
(1, 'Siti Amelia', '1996-04-12', '081234567890'),
(2, 'Budi Santoso', '1990-11-02', '081298765432');

INSERT INTO clinics (name, city, address, phone) VALUES
('Klinik Sehat Sentosa', 'Jakarta Selatan', 'Jl. Fatmawati No. 12', '0217654321'),
('Klinik Medika Utama', 'Bandung', 'Jl. Dago No. 45', '0224567890'),
('Klinik Keluarga Bahagia', 'Surabaya', 'Jl. Darmo No. 88', '0315678123'),
('Klinik Sehat Sentosa Cabang BSD', 'Tangerang Selatan', 'Jl. BSD Raya No. 3', '0217001122');

INSERT INTO doctors (full_name, specialization, email, phone) VALUES
('dr. Ayu Lestari, Sp.PD', 'Penyakit Dalam', 'ayu.lestari@eternacare.id', '081111000001'),
('dr. Rangga Pratama, Sp.A', 'Anak', 'rangga.pratama@eternacare.id', '081111000002'),
('dr. Maria Christin, Sp.KK', 'Kulit & Kelamin', 'maria.christin@eternacare.id', '081111000003'),
('dr. Fajar Nugroho', 'Dokter Umum', 'fajar.nugroho@eternacare.id', '081111000004'),
('dr. Intan Permatasari, Sp.THT', 'THT', 'intan.permatasari@eternacare.id', '081111000005');

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

INSERT INTO medical_records (patient_id, doctor_id, booking_id, diagnosis, prescription, notes) VALUES
(1, 1, 1, 'Diabetes mellitus tipe 2', 'Paracetamol 500mg dan Vitamin C 1000mg', 'Kontrol rutin gula darah'),
(2, 2, 2, 'ISPA', 'Amoxicillin 500mg dan CTM 4mg', 'Imunisasi anak'),
(1, 4, 3, 'Gastritis', 'Antasida Sirup 150ml', '-');

INSERT INTO prescriptions (medical_record_id, medicine_id, dosage, quantity, instruction) VALUES
(1, 1, '500mg', 10, 'Minum 3x1 tablet setelah makan'),
(1, 2, '1000mg', 30, 'Minum 1x1 tablet setiap pagi'),
(2, 4, '500mg', 10, 'Minum 3x1 kapsul sebelum makan'),
(2, 5, '4mg', 10, 'Minum 3x1 tablet setelah makan'),
(3, 3, '150ml', 1, 'Minum 3x1 sendok makan sebelum makan');

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
('Apotek Eterna Care Fatmawati', 'Jakarta Selatan', 'Jl. Fatmawati No. 12A'),
('Apotek Eterna Care Dago', 'Bandung', 'Jl. Dago No. 47'),
('Apotek Eterna Care Darmo', 'Surabaya', 'Jl. Darmo No. 90');

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
