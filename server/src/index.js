require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");

const authRoutes = require("./routes/auth");
const doctorRoutes = require("./routes/doctors");
const clinicRoutes = require("./routes/clinics");
const bookingRoutes = require("./routes/bookings");
const medicineRoutes = require("./routes/medicines");
const pharmacyRoutes = require("./routes/pharmacies");
const transactionRoutes = require("./routes/transactions");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/doctors", doctorRoutes);
app.use("/api/clinics", clinicRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/medicines", medicineRoutes);
app.use("/api/pharmacies", pharmacyRoutes);
app.use("/api/transactions", transactionRoutes);

app.get("/api/health", (_req, res) => res.json({ ok: true }));

// Serve the static frontend (public/) so the whole app runs from one port.
const publicDir = path.join(__dirname, "..", "..", "public");
app.use(express.static(publicDir));
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api/")) return next();
  res.sendFile(path.join(publicDir, "index.html"));
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Terjadi kesalahan pada server." });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Eterna Care API berjalan di http://localhost:${PORT}`);
});
