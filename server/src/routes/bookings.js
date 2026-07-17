const express = require("express");
const { pool } = require("../db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);

// POST /api/bookings — membuat booking baru pada suatu jadwal & tanggal
router.post("/", async (req, res) => {
  const { scheduleId, bookingDate, notes } = req.body;
  const patientId = req.user.patientId;

  if (!patientId) {
    return res.status(403).json({ error: "Hanya akun pasien yang bisa membuat booking." });
  }
  if (!scheduleId || !bookingDate) {
    return res.status(400).json({ error: "Jadwal dan tanggal booking wajib diisi." });
  }

  try {
    const schedule = await pool.query(
      `SELECT s.id, s.day_of_week, d.full_name AS doctor_name, c.name AS clinic_name
       FROM doctor_schedules s
       JOIN doctors d ON d.id = s.doctor_id
       JOIN clinics c ON c.id = s.clinic_id
       WHERE s.id = $1`,
      [scheduleId]
    );
    if (schedule.rows.length === 0) {
      return res.status(404).json({ error: "Jadwal tidak ditemukan." });
    }

    // pastikan booking_date jatuh pada day_of_week yang benar (1=Senin..7=Minggu)
    const jsDay = new Date(bookingDate + "T00:00:00").getDay(); // 0=Minggu..6=Sabtu
    const isoDay = jsDay === 0 ? 7 : jsDay;
    if (isoDay !== schedule.rows[0].day_of_week) {
      return res.status(400).json({ error: "Tanggal yang dipilih tidak sesuai hari praktik dokter." });
    }

    const result = await pool.query(
      `INSERT INTO bookings (patient_id, schedule_id, booking_date, notes)
       VALUES ($1, $2, $3, $4)
       RETURNING id, status, booking_date`,
      [patientId, scheduleId, bookingDate, notes || null]
    );

    res.status(201).json({
      ...result.rows[0],
      doctor_name: schedule.rows[0].doctor_name,
      clinic_name: schedule.rows[0].clinic_name,
    });
  } catch (err) {
    if (err.code === "23505") {
      return res.status(409).json({ error: "Kamu sudah booking slot ini pada tanggal tersebut." });
    }
    console.error(err);
    res.status(500).json({ error: "Gagal membuat booking." });
  }
});

// GET /api/bookings/me — riwayat booking pasien yang sedang login
router.get("/me", async (req, res) => {
  const patientId = req.user.patientId;
  if (!patientId) return res.status(403).json({ error: "Hanya akun pasien yang punya riwayat booking." });

  try {
    const result = await pool.query(
      `SELECT b.id, b.booking_date, b.status, b.notes,
              d.full_name AS doctor_name, d.specialization,
              c.name AS clinic_name, c.city AS clinic_city,
              s.start_time, s.end_time
       FROM bookings b
       JOIN doctor_schedules s ON s.id = b.schedule_id
       JOIN doctors d ON d.id = s.doctor_id
       JOIN clinics c ON c.id = s.clinic_id
       WHERE b.patient_id = $1
       ORDER BY b.booking_date DESC, s.start_time DESC`,
      [patientId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Gagal mengambil riwayat booking." });
  }
});

// PATCH /api/bookings/:id/cancel
router.patch("/:id/cancel", async (req, res) => {
  const patientId = req.user.patientId;
  try {
    const result = await pool.query(
      `UPDATE bookings SET status = 'dibatalkan'
       WHERE id = $1 AND patient_id = $2 AND status = 'menunggu'
       RETURNING id, status`,
      [req.params.id, patientId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Booking tidak ditemukan atau tidak bisa dibatalkan." });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Gagal membatalkan booking." });
  }
});

module.exports = router;
