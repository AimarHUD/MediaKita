const express = require("express");
const { pool } = require("../db");

const router = express.Router();

// GET /api/doctors?search=&specialization=&city=
// Cari dokter: nama, spesialisasi, atau kota (via klinik tempat ia praktik)
router.get("/", async (req, res) => {
  const { search = "", specialization = "", city = "" } = req.query;

  try {
    const result = await pool.query(
      `SELECT
         d.id, d.full_name, d.specialization, d.email, d.phone,
         COALESCE(
           json_agg(
             DISTINCT jsonb_build_object('id', c.id, 'name', c.name, 'city', c.city)
           ) FILTER (WHERE c.id IS NOT NULL), '[]'
         ) AS clinics
       FROM doctors d
       LEFT JOIN doctor_clinics dc ON dc.doctor_id = d.id
       LEFT JOIN clinics c ON c.id = dc.clinic_id
       WHERE
         ($1 = '' OR d.full_name ILIKE '%' || $1 || '%')
         AND ($2 = '' OR d.specialization ILIKE '%' || $2 || '%')
         AND ($3 = '' OR EXISTS (
               SELECT 1 FROM doctor_clinics dc2
               JOIN clinics c2 ON c2.id = dc2.clinic_id
               WHERE dc2.doctor_id = d.id AND c2.city ILIKE '%' || $3 || '%'
             ))
       GROUP BY d.id
       ORDER BY d.full_name`,
      [search, specialization, city]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Gagal mengambil data dokter." });
  }
});

// GET /api/doctors/:id/schedules — jadwal praktik dokter (semua klinik)
router.get("/:id/schedules", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT s.id, s.day_of_week, s.start_time, s.end_time,
              c.id AS clinic_id, c.name AS clinic_name, c.city AS clinic_city
       FROM doctor_schedules s
       JOIN clinics c ON c.id = s.clinic_id
       WHERE s.doctor_id = $1
       ORDER BY s.day_of_week, s.start_time`,
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Gagal mengambil jadwal dokter." });
  }
});

module.exports = router;
