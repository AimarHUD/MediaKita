const express = require("express");
const { pool } = require("../db");

const router = express.Router();

// GET /api/clinics?city=
router.get("/", async (req, res) => {
  const { city = "" } = req.query;
  try {
    const result = await pool.query(
      `SELECT id, name, city, address, phone
       FROM clinics
       WHERE $1 = '' OR city ILIKE '%' || $1 || '%'
       ORDER BY city, name`,
      [city]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Gagal mengambil data klinik." });
  }
});

module.exports = router;
