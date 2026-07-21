-- ==========================================
-- USERS
-- ==========================================

INSERT INTO users (email, password_hash, role) VALUES
('bilqis@gmail.com', '123456', 'patient'),
('admin@eternacare.com', 'admin123', 'admin'),
('dr.andi@gmail.com', 'dokter123', 'doctor'),
('dr.sinta@gmail.com', 'dokter456', 'doctor'),
('rizky@gmail.com', 'rizky123', 'patient');

-- ==========================================
-- PATIENTS
-- ==========================================

INSERT INTO patients
(user_id, full_name, date_of_birth, gender, phone, email, address, blood_type)
VALUES
(1,'Bilqis Syifa','2006-12-02','Perempuan','08123456789','bilqis@gmail.com','Jakarta Selatan','O'),
(5,'Rizky Pratama','2000-05-10','Laki-laki','081298765432','rizky@gmail.com','Bogor','A');

-- ==========================================
-- SPECIALIZATIONS
-- ==========================================

INSERT INTO specializations
(specialization_name, description)
VALUES
('Dokter Umum','Melayani pemeriksaan kesehatan umum'),
('Dokter Anak','Menangani kesehatan anak'),
('Dokter Gigi','Menangani kesehatan gigi dan mulut'),
('Dokter Jantung','Menangani penyakit jantung'),
('Dokter Kulit','Menangani penyakit kulit');

-- ==========================================
-- CITIES
-- ==========================================

INSERT INTO cities
(city_name, province, postal_code)
VALUES
('Jakarta Selatan','DKI Jakarta','12520'),
('Jakarta Timur','DKI Jakarta','13410'),
('Bogor','Jawa Barat','16111'),
('Depok','Jawa Barat','16411'),
('Bekasi','Jawa Barat','17121');

==========================================
-- CLINICS
-- ==========================================

INSERT INTO clinics
(city_id, name, address, phone, email, opening_hours)
VALUES
(1,'Klinik Sehat Jakarta','Jl. Raya Pasar Minggu No.10','021888888','jakarta@eternacare.com','08:00-20:00'),
(2,'Klinik Medika Timur','Jl. Pemuda No.25','021777777','timur@eternacare.com','08:00-21:00'),
(3,'Klinik Bogor Sehat','Jl. Pajajaran No.15','0251838383','bogor@eternacare.com','07:00-20:00'),
(4,'Klinik Depok Care','Jl. Margonda No.45','021565656','depok@eternacare.com','08:00-22:00'),
(5,'Klinik Bekasi Medis','Jl. Ahmad Yani No.8','021989898','bekasi@eternacare.com','08:00-20:00');

-- ==========================================
-- DOCTORS
-- ==========================================

INSERT INTO doctors
(user_id, specialization_id, full_name, gender, email, phone, experience, photo)
VALUES
(3,1,'dr. Andi Saputra','Laki-laki','drandi@gmail.com','081212121212',8,'andi.jpg'),
(4,2,'dr. Sinta Maharani','Perempuan','drsinta@gmail.com','081313131313',5,'sinta.jpg');

-- ==========================================
-- DOCTOR_CLINICS
-- ==========================================

INSERT INTO doctor_clinics
(doctor_id, clinic_id)
VALUES
(1,1),
(1,3),
(2,2),
(2,4);

-- ==========================================
-- DOCTOR_SCHEDULES
-- ==========================================

INSERT INTO doctor_schedules
(doctor_id, clinic_id, day_of_week, start_time, end_time, max_patient)
VALUES
(1,1,'Senin','08:00:00','12:00:00',20),
(1,3,'Rabu','09:00:00','13:00:00',15),
(2,2,'Selasa','10:00:00','14:00:00',20),
(2,4,'Jumat','08:00:00','12:00:00',25);

-- ==========================================
-- BOOKINGS
-- ==========================================

INSERT INTO bookings
(patient_id, schedule_id, booking_date, queue_number, status, complaint)
VALUES
(1,1,'2026-07-20',1,'Menunggu','Demam tinggi'),
(2,2,'2026-07-22',2,'Dikonfirmasi','Batuk dan pilek'),
(1,3,'2026-07-24',1,'Selesai','Kontrol kesehatan'),
(2,4,'2026-07-25',3,'Menunggu','Sakit gigi');

-- ====================================…
-- MEDICAL_RECORDS
-- ==========================================

INSERT INTO medical_records
(patient_id, doctor_id, booking_id, diagnosis, prescription, notes, visit_date)
VALUES
(1,1,1,'Demam','Paracetamol 3x1','Perbanyak istirahat','2026-07-20'),
(2,2,2,'Flu','Vitamin C 2x1','Minum air hangat','2026-07-22'),
(1,2,3,'Kontrol Rutin','Vitamin B Complex','Kondisi membaik','2026-07-24');

-- ==========================================
-- MEDICINE_CATEGORIES
-- ==========================================

INSERT INTO medicine_categories
(category_name, description)
VALUES
('Antibiotik','Obat untuk infeksi bakteri'),
('Vitamin','Suplemen kesehatan'),
('Analgesik','Obat pereda nyeri'),
('Obat Demam','Obat penurun panas'),
('Obat Batuk','Obat untuk batuk');

-- ==========================================
-- MEDICINES
-- ==========================================

INSERT INTO medicines
(category_id, sku, medicine_name, description, manufacturer, expiry_date)
VALUES
(4,'OB001','Paracetamol','Obat penurun demam','Kimia Farma','2028-12-31'),
(2,'OB002','Vitamin C','Suplemen Vitamin C','Kalbe Farma','2028-08-10'),
(3,'OB003','Ibuprofen','Pereda nyeri','Sanbe Farma','2029-02-20'),
(5,'OB004','OBH Combi','Obat Batuk','Combiphar','2028-10-15'),
(1,'OB005','Amoxicillin','Antibiotik','Dexa Medica','2028-06-01');

-- ==========================================
-- PHARMACIES
-- ==========================================

INSERT INTO pharmacies
(city_id, pharmacy_name, address, phone, email, opening_hours)
VALUES
(1,'Apotek Kimia Farma','Jl. Pasar Minggu No.20','021111111','kimiafarma@gmail.com','08:00-22:00'),
(2,'Apotek K24','Jl. Pemuda No.18','021222222','k24@gmail.com','24 Jam'),
(3,'Apotek Guardian','Jl. Pajajaran No.9','025133333','guardian@gmail.com','08:00-21:00');

-- ==========================================
-- PHARMACY_STOCK
-- ==========================================

INSERT INTO pharmacy_stock
(pharmacy_id, medicine_id, stock_qty, price)
VALUES
(1,1,100,12000),
(1,2,80,18000),
(1,3,50,25000),
(2,1,120,12500),
(2,4,75,17000),
(3,5,60,22000);

-- ==========================================
-- PRESCRIPTIONS
-- ==========================================

INSERT INTO prescriptions
(medical_record_id, medicine_id, dosage, quantity, instruction)
VALUES
(1,1,'3x1 sehari',10,'Diminum setelah makan'),
(2,2,'2x1 sehari',14,'Diminum pagi dan malam'),
(3,3,'2x1 sehari',8,'Diminum setelah makan');

-- ==========================================
-- TRANSACTIONS
-- ==========================================

INSERT INTO transactions
(patient_id, pharmacy_id, transaction_date, total_price, payment_status)
VALUES
(1,1,'2026-07-20 10:30:00',120000,'Paid'),
(2,2,'2026-07-22 13:45:00',85000,'Paid'),
(1,3,'2026-07-24 09:20:00',44000,'Pending');

-- ==========================================
-- TRANSACTION_ITEMS
-- ==========================================

INSERT INTO transaction_items
(transaction_id, medicine_id, quantity, price, subtotal)
VALUES
(1,1,5,12000,60000),
(1,2,2,30000,60000),
(2,4,5,17000,85000),
(3,5,2,22000,44000);

-- ==========================================
-- PAYMENTS
-- ==========================================

INSERT INTO payments
(transaction_id, payment_method, payment_status, payment_date)
VALUES
(1,'QRIS','Paid','2026-07-20 10:35:00'),
(2,'Transfer','Paid','2026-07-22 13:50:00'),
(3,'E-Wallet','Pending',NULL);

-- ==========================================
-- REVIEWS
-- ==========================================

INSERT INTO reviews
(patient_id, doctor_id, rating, review)
VALUES
(1,1,5,'Dokternya ramah dan penjelasannya mudah dipahami.'),
(2,2,4,'Pelayanan cepat dan memuaskan.');

-- ==========================================
-- NOTIFICATIONS
-- ==========================================

INSERT INTO notifications
(user_id, title, message, is_read)
VALUES
(1,'Booking Berhasil','Booking konsultasi Anda berhasil dibuat.',1),
(1,'Pembayaran Berhasil','Pembayaran obat telah diterima.',1),
(5,'Jadwal Konsultasi','Jangan lupa jadwal konsultasi besok.',0);

-- ==========================================
-- ADDRESSES
-- ==========================================

INSERT INTO addresses
(patient_id, city_id, address, postal_code)
VALUES
(1,1,'Jl. Raya Pasar Minggu No.10','12520'),
(2,3,'Jl. Pajajaran No.25','16111');

-- ==========================================
-- LOGIN_HISTORY
-- ==========================================

INSERT INTO login_history
(user_id, login_time, logout_time, ip_address, device)
VALUES
(1,'2026-07-20 08:00:00','2026-07-20 08:45:00','192.168.1.10','Android'),
(2,'2026-07-20 09:00:00','2026-07-20 17:00:00','192.168.1.20','Windows'),
(3,'2026-07-20 10:00:00','2026-07-20 12:00:00','192.168.1.30','Laptop');

-- ==========================================
-- APPOINTMENTS
-- ==========================================

INSERT INTO appointments
(booking_id, queue_number, check_in_time, status)
VALUES
(1,1,'2026-07-20 07:45:00','Completed'),
(2,2,'2026-07-22 13:20:00','Completed'),
(4,3,NULL,'Waiting');
