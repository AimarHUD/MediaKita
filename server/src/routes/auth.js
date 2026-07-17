const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { pool } = require("../db");

const router = express.Router();

function issueToken(user) {
  return jwt.sign(
    {
      id: user.id,
      patientId: user.patient_id,
      email: user.email,
      role: user.role,
      fullName: user.full_name,
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

// POST /api/auth/register — pasien baru mendaftar
router.post("/register", async (req, res) => {
  const { email, password, fullName, dateOfBirth, phone } = req.body;

  if (!email || !password || !fullName) {
    return res.status(400).json({ error: "Email, password, dan nama lengkap wajib diisi." });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: "Password minimal 6 karakter." });
  }

  const client = await pool.connect();
  try {
    const existing = await client.query("SELECT id FROM users WHERE email = $1", [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: "Email sudah terdaftar." });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await client.query("BEGIN");
    const userResult = await client.query(
      `INSERT INTO users (email, password_hash, role) VALUES ($1, $2, 'patient') RETURNING id, email, role`,
      [email, passwordHash]
    );
    const user = userResult.rows[0];

    const patientResult = await client.query(
      `INSERT INTO patients (user_id, full_name, date_of_birth, phone)
       VALUES ($1, $2, $3, $4) RETURNING id, full_name`,
      [user.id, fullName, dateOfBirth || null, phone || null]
    );
    const patient = patientResult.rows[0];
    await client.query("COMMIT");

    const token = issueToken({
      id: user.id,
      email: user.email,
      role: user.role,
      patient_id: patient.id,
      full_name: patient.full_name,
    });

    res.status(201).json({ token, user: { email: user.email, role: user.role, fullName: patient.full_name } });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ error: "Registrasi gagal, coba lagi." });
  } finally {
    client.release();
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email dan password wajib diisi." });
  }

  try {
    const result = await pool.query(
      `SELECT u.id, u.email, u.password_hash, u.role, p.id AS patient_id, p.full_name
       FROM users u
       LEFT JOIN patients p ON p.user_id = u.id
       WHERE u.email = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Email atau password salah." });
    }

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: "Email atau password salah." });
    }

    const token = issueToken(user);
    res.json({
      token,
      user: { email: user.email, role: user.role, fullName: user.full_name || "Admin" },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Login gagal, coba lagi." });
  }
});

module.exports = router;
