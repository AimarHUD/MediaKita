const express = require("express");
const { pool } = require("../db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);

// POST /api/transactions
// body: { pharmacyId, items: [{ medicineId, quantity }] }
// "Pembelian obat berdasarkan SKU dan harga, menghasilkan total harga."
router.post("/", async (req, res) => {
  const patientId = req.user.patientId;
  const { pharmacyId, items } = req.body;

  if (!patientId) return res.status(403).json({ error: "Hanya akun pasien yang bisa membeli obat." });
  if (!pharmacyId || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "Apotek dan minimal satu item wajib diisi." });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    let total = 0;
    const lineItems = [];

    for (const item of items) {
      const stockResult = await client.query(
        `SELECT ps.stock_qty, ps.price, m.id AS medicine_id, m.sku
         FROM pharmacy_stock ps
         JOIN medicines m ON m.id = ps.medicine_id
         WHERE ps.pharmacy_id = $1 AND ps.medicine_id = $2
         FOR UPDATE`,
        [pharmacyId, item.medicineId]
      );

      if (stockResult.rows.length === 0) {
        throw Object.assign(new Error("Obat tidak tersedia di apotek ini."), { status: 404 });
      }
      const stock = stockResult.rows[0];
      const qty = Number(item.quantity) || 0;

      if (qty <= 0) {
        throw Object.assign(new Error("Jumlah pembelian harus lebih dari 0."), { status: 400 });
      }
      if (stock.stock_qty < qty) {
        throw Object.assign(
          new Error(`Stok ${stock.sku} tidak cukup (tersisa ${stock.stock_qty}).`),
          { status: 409 }
        );
      }

      const subtotal = Number(stock.price) * qty;
      total += subtotal;
      lineItems.push({ medicineId: stock.medicine_id, sku: stock.sku, price: stock.price, qty });
    }

    const txResult = await client.query(
      `INSERT INTO transactions (patient_id, pharmacy_id, total_price)
       VALUES ($1, $2, $3) RETURNING id, created_at`,
      [patientId, pharmacyId, total]
    );
    const transactionId = txResult.rows[0].id;

    for (const li of lineItems) {
      await client.query(
        `INSERT INTO transaction_items (transaction_id, medicine_id, sku_at_purchase, price_at_purchase, quantity)
         VALUES ($1, $2, $3, $4, $5)`,
        [transactionId, li.medicineId, li.sku, li.price, li.qty]
      );
      await client.query(
        `UPDATE pharmacy_stock SET stock_qty = stock_qty - $3, updated_at = now()
         WHERE pharmacy_id = $1 AND medicine_id = $2`,
        [pharmacyId, li.medicineId, li.qty]
      );
    }

    await client.query("COMMIT");
    res.status(201).json({ id: transactionId, totalPrice: total, createdAt: txResult.rows[0].created_at });
  } catch (err) {
    await client.query("ROLLBACK");
    if (err.status) return res.status(err.status).json({ error: err.message });
    console.error(err);
    res.status(500).json({ error: "Transaksi gagal, coba lagi." });
  } finally {
    client.release();
  }
});

// GET /api/transactions/me — riwayat transaksi pasien beserta rinciannya
router.get("/me", async (req, res) => {
  const patientId = req.user.patientId;
  if (!patientId) return res.status(403).json({ error: "Hanya akun pasien yang punya riwayat transaksi." });

  try {
    const txResult = await pool.query(
      `SELECT t.id, t.total_price, t.created_at, p.name AS pharmacy_name, p.city AS pharmacy_city
       FROM transactions t
       JOIN pharmacies p ON p.id = t.pharmacy_id
       WHERE t.patient_id = $1
       ORDER BY t.created_at DESC`,
      [patientId]
    );

    const transactions = txResult.rows;
    if (transactions.length === 0) return res.json([]);

    const ids = transactions.map((t) => t.id);
    const itemsResult = await pool.query(
      `SELECT ti.transaction_id, ti.sku_at_purchase, ti.price_at_purchase, ti.quantity, ti.subtotal, m.name AS medicine_name
       FROM transaction_items ti
       JOIN medicines m ON m.id = ti.medicine_id
       WHERE ti.transaction_id = ANY($1::bigint[])
       ORDER BY ti.id`,
      [ids]
    );

    const itemsByTx = {};
    for (const item of itemsResult.rows) {
      (itemsByTx[item.transaction_id] ||= []).push(item);
    }

    res.json(transactions.map((t) => ({ ...t, items: itemsByTx[t.id] || [] })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Gagal mengambil riwayat transaksi." });
  }
});

module.exports = router;
