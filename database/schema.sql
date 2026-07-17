-- ============================================================================
-- MediKita — Database Schema (PostgreSQL)
-- Workshop: Database Design — Crow's Foot ERD implementation
--
-- Design notes / assumptions (see docs/ASUMSI.md for full list):
--   * Money columns use NUMERIC(12,2), never FLOAT (avoids rounding errors).
--   * Every relationship is enforced with a real FOREIGN KEY.
--   * Many-to-many relationships (dokter<->klinik) use a junction table.
--   * Stock & price are per-pharmacy (apotek), not global to the medicine —
--     modeled as a junction table `pharmacy_stock` with its own attributes.
--   * transaction_items freezes price_at_purchase so historical transactions
--     stay accurate even if the pharmacy later changes its price.
-- ============================================================================

DROP TABLE IF EXISTS transaction_items CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS pharmacy_stock CASCADE;
DROP TABLE IF EXISTS medicines CASCADE;
DROP TABLE IF EXISTS medicine_categories CASCADE;
DROP TABLE IF EXISTS pharmacies CASCADE;
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS doctor_schedules CASCADE;
DROP TABLE IF EXISTS doctor_clinics CASCADE;
DROP TABLE IF EXISTS doctors CASCADE;
DROP TABLE IF EXISTS clinics CASCADE;
DROP TABLE IF EXISTS patients CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ----------------------------------------------------------------------------
-- 1. USER MANAGEMENT
-- ----------------------------------------------------------------------------

CREATE TABLE users (
    id              BIGSERIAL PRIMARY KEY,
    email           VARCHAR(255) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    role            VARCHAR(20)  NOT NULL DEFAULT 'patient'
                        CHECK (role IN ('patient', 'admin')),
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- 1:1 extension of `users` — kept separate so `users` stays a lean auth
-- table and patient-only fields don't pollute admin accounts.
CREATE TABLE patients (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    full_name       VARCHAR(150) NOT NULL,
    date_of_birth   DATE,
    phone           VARCHAR(30),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 2. KLINIK & DOKTER
-- ----------------------------------------------------------------------------

CREATE TABLE clinics (
    id          BIGSERIAL PRIMARY KEY,
    name        VARCHAR(150) NOT NULL,
    city        VARCHAR(100) NOT NULL,
    address     VARCHAR(255),
    phone       VARCHAR(30),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE doctors (
    id              BIGSERIAL PRIMARY KEY,
    full_name       VARCHAR(150) NOT NULL,
    specialization  VARCHAR(100) NOT NULL,
    email           VARCHAR(255) UNIQUE,
    phone           VARCHAR(30),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Junction table: "Satu dokter bisa praktik di lebih dari satu klinik" (M:N)
CREATE TABLE doctor_clinics (
    doctor_id   BIGINT NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    clinic_id   BIGINT NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    PRIMARY KEY (doctor_id, clinic_id)
);

-- ----------------------------------------------------------------------------
-- 3. JADWAL & BOOKING
-- ----------------------------------------------------------------------------

-- A recurring weekly practice slot for a doctor at a specific clinic.
CREATE TABLE doctor_schedules (
    id          BIGSERIAL PRIMARY KEY,
    doctor_id   BIGINT NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    clinic_id   BIGINT NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 1 AND 7), -- 1=Senin .. 7=Minggu
    start_time  TIME NOT NULL,
    end_time    TIME NOT NULL,
    CONSTRAINT chk_schedule_time CHECK (end_time > start_time),
    -- doctor must actually practice at that clinic (defense in depth,
    -- enforced at application layer against doctor_clinics too)
    CONSTRAINT uq_doctor_schedule UNIQUE (doctor_id, clinic_id, day_of_week, start_time)
);

CREATE TABLE bookings (
    id              BIGSERIAL PRIMARY KEY,
    patient_id      BIGINT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    schedule_id     BIGINT NOT NULL REFERENCES doctor_schedules(id) ON DELETE RESTRICT,
    booking_date    DATE NOT NULL,          -- the concrete calendar date chosen for that weekly slot
    status          VARCHAR(20) NOT NULL DEFAULT 'menunggu'
                        CHECK (status IN ('menunggu', 'selesai', 'dibatalkan')),
    notes           VARCHAR(255),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    -- a patient cannot double-book the exact same slot on the same date
    CONSTRAINT uq_booking_slot UNIQUE (schedule_id, booking_date, patient_id)
);

-- ----------------------------------------------------------------------------
-- 4. KATALOG OBAT
-- ----------------------------------------------------------------------------

CREATE TABLE medicine_categories (
    id      BIGSERIAL PRIMARY KEY,
    name    VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE medicines (
    id              BIGSERIAL PRIMARY KEY,
    sku             VARCHAR(40) NOT NULL UNIQUE,
    name            VARCHAR(150) NOT NULL,
    description     TEXT,
    category_id     BIGINT REFERENCES medicine_categories(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 5. STOK & HARGA (per apotek)
-- ----------------------------------------------------------------------------

CREATE TABLE pharmacies (
    id          BIGSERIAL PRIMARY KEY,
    name        VARCHAR(150) NOT NULL,
    city        VARCHAR(100) NOT NULL,
    address     VARCHAR(255),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Junction table with attributes: stock & price are defined PER apotek,
-- never on the medicine itself.
CREATE TABLE pharmacy_stock (
    pharmacy_id BIGINT NOT NULL REFERENCES pharmacies(id) ON DELETE CASCADE,
    medicine_id BIGINT NOT NULL REFERENCES medicines(id) ON DELETE CASCADE,
    stock_qty   INTEGER NOT NULL DEFAULT 0 CHECK (stock_qty >= 0),
    price       NUMERIC(12, 2) NOT NULL CHECK (price >= 0),  -- NOT FLOAT — exact money math
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (pharmacy_id, medicine_id)
);

-- ----------------------------------------------------------------------------
-- 6. TRANSAKSI
-- ----------------------------------------------------------------------------

CREATE TABLE transactions (
    id              BIGSERIAL PRIMARY KEY,
    patient_id      BIGINT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    pharmacy_id     BIGINT NOT NULL REFERENCES pharmacies(id) ON DELETE RESTRICT,
    total_price     NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (total_price >= 0),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE transaction_items (
    id                  BIGSERIAL PRIMARY KEY,
    transaction_id      BIGINT NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
    medicine_id         BIGINT NOT NULL REFERENCES medicines(id) ON DELETE RESTRICT,
    sku_at_purchase     VARCHAR(40) NOT NULL,
    price_at_purchase   NUMERIC(12, 2) NOT NULL CHECK (price_at_purchase >= 0),
    quantity            INTEGER NOT NULL CHECK (quantity > 0),
    subtotal            NUMERIC(12, 2) GENERATED ALWAYS AS (price_at_purchase * quantity) STORED
);

-- ----------------------------------------------------------------------------
-- INDEXES for the required search/filter features
-- ----------------------------------------------------------------------------

CREATE INDEX idx_doctors_name            ON doctors (full_name);
CREATE INDEX idx_doctors_specialization  ON doctors (specialization);
CREATE INDEX idx_clinics_city            ON clinics (city);
CREATE INDEX idx_medicines_name          ON medicines (name);
CREATE INDEX idx_medicines_category      ON medicines (category_id);
CREATE INDEX idx_pharmacy_stock_price    ON pharmacy_stock (price);
CREATE INDEX idx_bookings_patient        ON bookings (patient_id);
CREATE INDEX idx_transactions_patient    ON transactions (patient_id);
