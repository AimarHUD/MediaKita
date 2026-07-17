const express = require("express");
const { pool } = require("../db");

const router = express.Router();

// GET /api/pharmacies?city=
router.get("/", async (req, res) => {
  const { city = "" } = req.query;
  try {
    const result = await pool.query(
      `SELECT id, name, city, address FROM pharmacies
       WHERE $1 = '' OR city ILIKE '%' || $1 || '%'
       ORDER BY city, name`,
      [city]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Gagal mengambil data apotek." });
  }
});

// GET /api/pharmacies/:id/catalog — semua obat + stok + harga di apotek ini
router.get("/:id/catalog", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT m.id AS medicine_id, m.sku, m.name, cat.name AS category,
              ps.stock_qty, ps.price
       FROM pharmacy_stock ps
       JOIN medicines m ON m.id = ps.medicine_id
       LEFT JOIN medicine_categories cat ON cat.id = m.category_id
       WHERE ps.pharmacy_id = $1
       ORDER BY m.name`,
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Gagal mengambil katalog apotek." });
  }
});

module.exports = router;
