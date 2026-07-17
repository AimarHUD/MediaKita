const express = require("express");
const { pool } = require("../db");
const { requireAuth, requireAdmin } = require("../middleware/auth");

const router = express.Router();

// GET /api/medicines?search=&category=&minPrice=&maxPrice=
// Cari & filter obat lintas semua apotek (harga termurah ditampilkan per obat)
router.get("/", async (req, res) => {
  const { search = "", category = "", minPrice = "", maxPrice = "" } = req.query;

  try {
    const result = await pool.query(
      `SELECT
         m.id, m.sku, m.name, m.description,
         cat.name AS category,
         MIN(ps.price) FILTER (WHERE ps.price IS NOT NULL) AS lowest_price,
         COALESCE(SUM(ps.stock_qty) FILTER (WHERE ps.stock_qty IS NOT NULL), 0) AS total_stock
       FROM medicines m
       LEFT JOIN medicine_categories cat ON cat.id = m.category_id
       LEFT JOIN pharmacy_stock ps ON ps.medicine_id = m.id
       WHERE
         ($1 = '' OR m.name ILIKE '%' || $1 || '%')
         AND ($2 = '' OR cat.name ILIKE '%' || $2 || '%')
       GROUP BY m.id, cat.name
       HAVING
         ($3 = '' OR MIN(ps.price) >= $3::numeric)
         AND ($4 = '' OR MIN(ps.price) <= $4::numeric)
       ORDER BY m.name`,
      [search, category, minPrice, maxPrice]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Gagal mengambil katalog obat." });
  }
});

// GET /api/medicines/categories
router.get("/categories", async (_req, res) => {
  try {
    const result = await pool.query("SELECT id, name FROM medicine_categories ORDER BY name");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Gagal mengambil kategori obat." });
  }
});

// GET /api/medicines/:id/stock — stok & harga obat ini di tiap apotek
router.get("/:id/stock", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.id AS pharmacy_id, p.name AS pharmacy_name, p.city, ps.stock_qty, ps.price
       FROM pharmacy_stock ps
       JOIN pharmacies p ON p.id = ps.pharmacy_id
       WHERE ps.medicine_id = $1 AND ps.stock_qty > 0
       ORDER BY ps.price ASC`,
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Gagal mengambil stok obat." });
  }
});

// ---- Admin CRUD: "Tambah, edit, dan hapus produk obat" ----

router.post("/", requireAuth, requireAdmin, async (req, res) => {
  const { sku, name, description, categoryId } = req.body;
  if (!sku || !name) return res.status(400).json({ error: "SKU dan nama obat wajib diisi." });

  try {
    const result = await pool.query(
      `INSERT INTO medicines (sku, name, description, category_id)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [sku, name, description || null, categoryId || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === "23505") return res.status(409).json({ error: "SKU sudah dipakai obat lain." });
    console.error(err);
    res.status(500).json({ error: "Gagal menambah obat." });
  }
});

router.put("/:id", requireAuth, requireAdmin, async (req, res) => {
  const { name, description, categoryId } = req.body;
  try {
    const result = await pool.query(
      `UPDATE medicines SET name = COALESCE($2, name),
              description = COALESCE($3, description),
              category_id = COALESCE($4, category_id)
       WHERE id = $1 RETURNING *`,
      [req.params.id, name, description, categoryId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "Obat tidak ditemukan." });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Gagal mengubah obat." });
  }
});

router.delete("/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query("DELETE FROM medicines WHERE id = $1 RETURNING id", [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: "Obat tidak ditemukan." });
    res.status(204).end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Gagal menghapus obat." });
  }
});

// PUT /api/medicines/:id/stock/:pharmacyId — edit stok & harga di apotek tertentu
router.put("/:id/stock/:pharmacyId", requireAuth, requireAdmin, async (req, res) => {
  const { stockQty, price } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO pharmacy_stock (pharmacy_id, medicine_id, stock_qty, price, updated_at)
       VALUES ($2, $1, $3, $4, now())
       ON CONFLICT (pharmacy_id, medicine_id)
       DO UPDATE SET stock_qty = EXCLUDED.stock_qty, price = EXCLUDED.price, updated_at = now()
       RETURNING *`,
      [req.params.id, req.params.pharmacyId, stockQty, price]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Gagal memperbarui stok/harga." });
  }
});

module.exports = router;
