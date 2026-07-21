CREATE TABLE users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('patient','admin','doctor') NOT NULL DEFAULT 'patient',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB; 


CREATE TABLE patients (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,
    full_name VARCHAR(150) NOT NULL,
    date_of_birth DATE,
    gender ENUM('Laki-laki','Perempuan'),
    phone VARCHAR(20),
    email VARCHAR(255),
    address TEXT,
    blood_type ENUM('A','B','AB','O'),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE
) ENGINE=InnoDB; 

CREATE TABLE specializations (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    specialization_name VARCHAR(100) NOT NULL,
    description TEXT
) ENGINE=InnoDB; 


CREATE TABLE cities (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    city_name VARCHAR(100) NOT NULL,
    province VARCHAR(100) NOT NULL,
    postal_code VARCHAR(10)
) ENGINE=InnoDB; 


CREATE TABLE clinics (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    city_id BIGINT NOT NULL,
    name VARCHAR(150) NOT NULL,
    address TEXT NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(100),
    opening_hours VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (city_id)
    REFERENCES cities(id)
    ON DELETE CASCADE
) ENGINE=InnoDB; 


CREATE TABLE doctors (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNIQUE,
    specialization_id BIGINT NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    gender ENUM('Laki-laki','Perempuan'),
    email VARCHAR(100),
    phone VARCHAR(20),
    experience INT,
    photo VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE,

    FOREIGN KEY (specialization_id)
    REFERENCES specializations(id)
    ON DELETE CASCADE
) ENGINE=InnoDB; 


CREATE TABLE doctor_clinics (
    doctor_id BIGINT NOT NULL,
    clinic_id BIGINT NOT NULL,

    PRIMARY KEY (doctor_id, clinic_id),

    FOREIGN KEY (doctor_id)
    REFERENCES doctors(id)
    ON DELETE CASCADE,

    FOREIGN KEY (clinic_id)
    REFERENCES clinics(id)
    ON DELETE CASCADE
) ENGINE=InnoDB; 


CREATE TABLE doctor_schedules (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    doctor_id BIGINT NOT NULL,
    clinic_id BIGINT NOT NULL,

    day_of_week ENUM(
        'Senin',
        'Selasa',
        'Rabu',
        'Kamis',
        'Jumat',
        'Sabtu',
        'Minggu'
    ) NOT NULL,

    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    max_patient INT DEFAULT 20,

    FOREIGN KEY (doctor_id)
    REFERENCES doctors(id)
    ON DELETE CASCADE,

    FOREIGN KEY (clinic_id)
    REFERENCES clinics(id)
    ON DELETE CASCADE
) ENGINE=InnoDB; 


CREATE TABLE bookings (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    patient_id BIGINT NOT NULL,
    schedule_id BIGINT NOT NULL,
    booking_date DATE NOT NULL,
    queue_number INT,
    status ENUM(
        'Menunggu',
        'Dikonfirmasi',
        'Selesai',
        'Dibatalkan'
    ) DEFAULT 'Menunggu',

    complaint TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (patient_id)
    REFERENCES patients(id)
    ON DELETE CASCADE,

    FOREIGN KEY (schedule_id)
    REFERENCES doctor_schedules(id)
    ON DELETE CASCADE
) ENGINE=InnoDB; 


CREATE TABLE medical_records (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    patient_id BIGINT NOT NULL,
    doctor_id BIGINT NOT NULL,
    booking_id BIGINT NOT NULL,
    diagnosis TEXT NOT NULL,
    prescription TEXT,
    notes TEXT,
    visit_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (patient_id)
    REFERENCES patients(id)
    ON DELETE CASCADE,

    FOREIGN KEY (doctor_id)
    REFERENCES doctors(id)
    ON DELETE CASCADE,

    FOREIGN KEY (booking_id)
    REFERENCES bookings(id)
    ON DELETE CASCADE
) ENGINE=InnoDB; 


CREATE TABLE prescriptions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    medical_record_id BIGINT NOT NULL,
    medicine_id BIGINT NOT NULL,
    dosage VARCHAR(100),
    quantity INT NOT NULL,
    instruction TEXT,

    FOREIGN KEY (medical_record_id)
    REFERENCES medical_records(id)
    ON DELETE CASCADE,

    FOREIGN KEY (medicine_id)
    REFERENCES medicines(id)
    ON DELETE CASCADE
) ENGINE=InnoDB; 


CREATE TABLE medicine_categories (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    category_name VARCHAR(100) NOT NULL,
    description TEXT
) ENGINE=InnoDB; 


CREATE TABLE medicines (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    category_id BIGINT NOT NULL,
    sku VARCHAR(50) NOT NULL UNIQUE,
    medicine_name VARCHAR(150) NOT NULL,
    description TEXT,
    manufacturer VARCHAR(100),
    expiry_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (category_id)
    REFERENCES medicine_categories(id)
    ON DELETE CASCADE
) ENGINE=InnoDB; 


 CREATE TABLE pharmacies (
     id BIGINT AUTO_INCREMENT PRIMARY KEY,
     city_id BIGINT NOT NULL,
     pharmacy_name VARCHAR(150) NOT NULL,
     address TEXT NOT NULL,
     phone VARCHAR(20),
     email VARCHAR(100),
     opening_hours VARCHAR(100),
     image_url VARCHAR(255),
     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

     FOREIGN KEY (city_id)
     REFERENCES cities(id)
     ON DELETE CASCADE
 ) ENGINE=InnoDB;


 CREATE TABLE pharmacy_stock (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    pharmacy_id BIGINT NOT NULL,
    medicine_id BIGINT NOT NULL,
    stock_qty INT NOT NULL DEFAULT 0,
    price DECIMAL(12,2) NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (pharmacy_id)
    REFERENCES pharmacies(id)
    ON DELETE CASCADE,

    FOREIGN KEY (medicine_id)
    REFERENCES medicines(id)
    ON DELETE CASCADE
) ENGINE=InnoDB; 


 CREATE TABLE transactions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    patient_id BIGINT NOT NULL,
    pharmacy_id BIGINT NOT NULL,
    transaction_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    total_price DECIMAL(12,2) NOT NULL,
    payment_status ENUM(
        'Pending',
        'Paid',
        'Cancelled'
    ) DEFAULT 'Pending',

    FOREIGN KEY (patient_id)
    REFERENCES patients(id)
    ON DELETE CASCADE,

    FOREIGN KEY (pharmacy_id)
    REFERENCES pharmacies(id)
    ON DELETE CASCADE
) ENGINE=InnoDB; 


 CREATE TABLE transaction_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    transaction_id BIGINT NOT NULL,
    medicine_id BIGINT NOT NULL,
    quantity INT NOT NULL,
    price DECIMAL(12,2) NOT NULL,
    subtotal DECIMAL(12,2) NOT NULL,

    FOREIGN KEY (transaction_id)
    REFERENCES transactions(id)
    ON DELETE CASCADE,

    FOREIGN KEY (medicine_id)
    REFERENCES medicines(id)
    ON DELETE CASCADE
) ENGINE=InnoDB; 

 CREATE TABLE payments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    transaction_id BIGINT NOT NULL,
    payment_method ENUM(
        'Transfer',
        'QRIS',
        'E-Wallet',
        'Cash'
    ) NOT NULL,

    payment_status ENUM(
        'Pending',
        'Paid',
        'Failed'
    ) DEFAULT 'Pending',

    payment_date DATETIME,

    FOREIGN KEY (transaction_id)
    REFERENCES transactions(id)
    ON DELETE CASCADE
) ENGINE=InnoDB; 

 CREATE TABLE reviews (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    patient_id BIGINT NOT NULL,
    doctor_id BIGINT NOT NULL,
    rating INT NOT NULL,
    review TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (patient_id)
    REFERENCES patients(id)
    ON DELETE CASCADE,

    FOREIGN KEY (doctor_id)
    REFERENCES doctors(id)
    ON DELETE CASCADE
) ENGINE=InnoDB; 

 CREATE TABLE notifications (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE
) ENGINE=InnoDB; 

 CREATE TABLE addresses (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    patient_id BIGINT NOT NULL,
    city_id BIGINT NOT NULL,
    address TEXT NOT NULL,
    postal_code VARCHAR(10),

    FOREIGN KEY (patient_id)
    REFERENCES patients(id)
    ON DELETE CASCADE,

    FOREIGN KEY (city_id)
    REFERENCES cities(id)
    ON DELETE CASCADE
) ENGINE=InnoDB; 

 CREATE TABLE login_history (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    login_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    logout_time DATETIME,
    ip_address VARCHAR(50),
    device VARCHAR(100),

    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE
) ENGINE=InnoDB; 

 CREATE TABLE appointments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    booking_id BIGINT NOT NULL,
    queue_number INT NOT NULL,
    check_in_time DATETIME,
    status ENUM(
        'Waiting',
        'Called',
        'Completed',
        'Cancelled'
    ) DEFAULT 'Waiting',

    FOREIGN KEY (booking_id)
    REFERENCES bookings(id)
    ON DELETE CASCADE
) ENGINE=InnoDB; 

