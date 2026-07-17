const jwt = require("jsonwebtoken");

function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: "Silakan login terlebih dahulu." });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload; // { id, patientId, email, role }
    next();
  } catch (err) {
    return res.status(401).json({ error: "Sesi tidak valid atau sudah kedaluwarsa." });
  }
}

function requireAdmin(req, res, next) {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ error: "Hanya admin yang boleh mengakses ini." });
  }
  next();
}

module.exports = { requireAuth, requireAdmin };
