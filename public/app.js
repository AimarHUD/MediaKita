const API = "./api";
const DAY_NAMES = ["", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];

// ---------------------------------------------------------------------------
<<<<<<< HEAD
// Local seed fallback (mirrors database/seed.sql)
// Used when the REST API is unavailable so the UI still shows real
// database-derived content.
// ---------------------------------------------------------------------------
const SEED_CLINICS = [
  { id: 1, name: "Klinik Sehat Sentosa", city: "Jakarta Selatan" },
  { id: 2, name: "Klinik Medika Utama", city: "Bandung" },
  { id: 3, name: "Klinik Keluarga Bahagia", city: "Surabaya" },
  { id: 4, name: "Klinik Sehat Sentosa Cabang BSD", city: "Tangerang Selatan" },
];

const SEED_DOCTORS = [
  { id: 1, full_name: "dr. Ayu Lestari, Sp.PD", specialization: "Penyakit Dalam", clinic_ids: [1, 4] },
  { id: 2, full_name: "dr. Rangga Pratama, Sp.A", specialization: "Anak", clinic_ids: [1, 2] },
  { id: 3, full_name: "dr. Maria Christin, Sp.KK", specialization: "Kulit & Kelamin", clinic_ids: [2] },
  { id: 4, full_name: "dr. Fajar Nugroho", specialization: "Dokter Umum", clinic_ids: [1, 3, 4] },
  { id: 5, full_name: "dr. Intan Permatasari, Sp.THT", specialization: "THT", clinic_ids: [3] },
];

const SEED_SCHEDULES = [
  { id: 1, doctor_id: 1, clinic_id: 1, day_of_week: 1, start_time: "09:00", end_time: "13:00" },
  { id: 2, doctor_id: 1, clinic_id: 4, day_of_week: 3, start_time: "14:00", end_time: "18:00" },
  { id: 3, doctor_id: 2, clinic_id: 1, day_of_week: 2, start_time: "10:00", end_time: "14:00" },
  { id: 4, doctor_id: 2, clinic_id: 2, day_of_week: 5, start_time: "09:00", end_time: "12:00" },
  { id: 5, doctor_id: 3, clinic_id: 2, day_of_week: 4, start_time: "13:00", end_time: "17:00" },
  { id: 6, doctor_id: 4, clinic_id: 1, day_of_week: 1, start_time: "08:00", end_time: "12:00" },
  { id: 7, doctor_id: 4, clinic_id: 3, day_of_week: 2, start_time: "08:00", end_time: "12:00" },
  { id: 8, doctor_id: 4, clinic_id: 4, day_of_week: 6, start_time: "09:00", end_time: "13:00" },
  { id: 9, doctor_id: 5, clinic_id: 3, day_of_week: 5, start_time: "10:00", end_time: "15:00" },
];

function seedDoctors({ search = "", specialization = "", city = "" } = {}) {
  return SEED_DOCTORS.filter((d) => {
    const matchName = !search || d.full_name.toLowerCase().includes(search.toLowerCase());
    const matchSpec = !specialization || d.specialization.toLowerCase().includes(specialization.toLowerCase());
    const matchCity =
      !city ||
      d.clinic_ids.some((cid) => SEED_CLINICS.find((c) => c.id === cid)?.city.toLowerCase().includes(city.toLowerCase()));
    return matchName && matchSpec && matchCity;
  }).map((d) => ({
    id: d.id,
    full_name: d.full_name,
    specialization: d.specialization,
    clinics: d.clinic_ids
      .map((cid) => SEED_CLINICS.find((c) => c.id === cid))
      .map((c) => ({ id: c.id, name: c.name, city: c.city })),
  }));
}

function seedSchedules(doctorId) {
  return SEED_SCHEDULES.filter((s) => s.doctor_id === Number(doctorId)).map((s) => {
    const clinic = SEED_CLINICS.find((c) => c.id === s.clinic_id);
    return {
      id: s.id,
      day_of_week: s.day_of_week,
      start_time: s.start_time,
      end_time: s.end_time,
      clinic_id: s.clinic_id,
      clinic_name: clinic.name,
      clinic_city: clinic.city,
    };
  });
}

// ---------------------------------------------------------------------------
=======
>>>>>>> f6c92f1718e33ab8d34e10cc67004b4f3d17bd1b
// State & helpers
// ---------------------------------------------------------------------------
let state = {
  token: localStorage.getItem("medikita_token") || null,
  user: JSON.parse(localStorage.getItem("medikita_user") || "null"),
};

function authHeaders() {
  return state.token ? { Authorization: `Bearer ${state.token}` } : {};
}

async function api(path, options = {}) {
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
      ...(options.headers || {}),
    },
  });
  const isJson = res.headers.get("content-type")?.includes("application/json");
  const data = isJson ? await res.json().catch(() => null) : null;
  if (!res.ok) {
    throw new Error(data?.error || `Terjadi kesalahan (${res.status})`);
  }
  return data;
}

function formatRupiah(value) {
  if (value === null || value === undefined) return "—";
  return "Rp " + Number(value).toLocaleString("id-ID", { maximumFractionDigits: 0 });
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

function toast(message, isError = false) {
  const el = document.getElementById("toast");
  el.textContent = message;
  el.className = "toast" + (isError ? " error" : "");
  el.hidden = false;
  clearTimeout(toast._t);
  toast._t = setTimeout(() => (el.hidden = true), 3200);
}

function escapeHtml(str) {
  return String(str ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

// ---------------------------------------------------------------------------
// Auth state / UI
// ---------------------------------------------------------------------------
function persistAuth(token, user) {
  state.token = token;
  state.user = user;
  localStorage.setItem("medikita_token", token);
  localStorage.setItem("medikita_user", JSON.stringify(user));
  applyAuthUI();
}

function clearAuth() {
  state.token = null;
  state.user = null;
  localStorage.removeItem("medikita_token");
  localStorage.removeItem("medikita_user");
  applyAuthUI();
}

function applyAuthUI() {
  const loggedIn = !!state.token;
  const isAdmin = state.user?.role === "admin";

  document.querySelectorAll(".auth-only").forEach((el) => (el.hidden = !loggedIn));
  document.querySelectorAll(".guest-only").forEach((el) => (el.hidden = loggedIn));
  document.querySelectorAll(".admin-only").forEach((el) => (el.hidden = !isAdmin));

  document.getElementById("whoLabel").textContent = loggedIn
    ? `${state.user.fullName} · ${state.user.role === "admin" ? "admin" : "pasien"}`
    : "";

  // Non-admin patients shouldn't land on the admin tab
  if (!isAdmin && activeTab === "admin") switchTab("beranda");
}

// ---------------------------------------------------------------------------
// Tabs
// ---------------------------------------------------------------------------
let activeTab = "beranda";

function switchTab(tab) {
  activeTab = tab;
  document.querySelectorAll(".tab-btn").forEach((b) => b.classList.toggle("active", b.dataset.tab === tab));
  document.querySelectorAll(".tab-panel").forEach((p) => (p.hidden = p.id !== `panel-${tab}`));

  if (tab === "dokter" && !doctorsLoaded) loadDoctors();
  if (tab === "apotek" && !medicinesLoaded) { loadCategories(); loadMedicines(); }
  if (tab === "riwayat") { loadBookings(); loadTransactions(); }
  if (tab === "admin") { loadCategories("newCategory"); loadAdminMedicines(); }
  window.scrollTo({ top: 0, behavior: "smooth" });
}

document.getElementById("mainTabs").addEventListener("click", (e) => {
  const btn = e.target.closest(".tab-btn");
  if (btn) switchTab(btn.dataset.tab);
});
document.querySelectorAll("[data-goto]").forEach((el) =>
  el.addEventListener("click", () => switchTab(el.dataset.goto))
);

document.querySelectorAll(".subtab-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".subtab-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    document.querySelectorAll(".sub-panel").forEach((p) => (p.hidden = p.id !== `sub-${btn.dataset.sub}`));
  });
});

// ---------------------------------------------------------------------------
// Auth modal
// ---------------------------------------------------------------------------
const authModal = document.getElementById("authModal");
document.getElementById("btnOpenAuth").addEventListener("click", () => (authModal.hidden = false));
document.getElementById("closeAuth").addEventListener("click", () => (authModal.hidden = true));
authModal.addEventListener("click", (e) => { if (e.target === authModal) authModal.hidden = true; });

document.querySelectorAll(".modal-tab").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".modal-tab").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById("loginForm").hidden = btn.dataset.modalTab !== "login";
    document.getElementById("registerForm").hidden = btn.dataset.modalTab !== "register";
  });
});

document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const errorEl = document.getElementById("loginError");
  errorEl.textContent = "";
  try {
    const { token, user } = await api("/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: document.getElementById("loginEmail").value.trim(),
        password: document.getElementById("loginPassword").value,
      }),
    });
    persistAuth(token, user);
    authModal.hidden = true;
    toast(`Selamat datang kembali, ${user.fullName}!`);
  } catch (err) {
    errorEl.textContent = err.message;
  }
});

document.getElementById("registerForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const errorEl = document.getElementById("registerError");
  errorEl.textContent = "";
  try {
    const { token, user } = await api("/auth/register", {
      method: "POST",
      body: JSON.stringify({
        fullName: document.getElementById("regName").value.trim(),
        email: document.getElementById("regEmail").value.trim(),
        dateOfBirth: document.getElementById("regDob").value || null,
        phone: document.getElementById("regPhone").value || null,
        password: document.getElementById("regPassword").value,
      }),
    });
    persistAuth(token, user);
    authModal.hidden = true;
    toast(`Akun dibuat. Selamat datang, ${user.fullName}!`);
  } catch (err) {
    errorEl.textContent = err.message;
  }
});

document.getElementById("btnLogout").addEventListener("click", () => {
  clearAuth();
  toast("Kamu sudah keluar.");
  switchTab("beranda");
});

function requireLogin() {
  if (!state.token) {
    authModal.hidden = false;
    toast("Masuk dulu untuk melanjutkan.", true);
    return false;
  }
  return true;
}

// ---------------------------------------------------------------------------
// Dokter
// ---------------------------------------------------------------------------
let doctorsLoaded = false;

async function loadDoctors() {
  const search = document.getElementById("docSearch").value.trim();
  const specialization = document.getElementById("docSpecialization").value.trim();
  const city = document.getElementById("docCity").value.trim();
  const params = new URLSearchParams({ search, specialization, city });

  const container = document.getElementById("doctorResults");
  container.innerHTML = `<div class="empty-state">Memuat dokter…</div>`;
  try {
    const doctors = await api(`/doctors?${params}`);
    doctorsLoaded = true;
    if (doctors.length === 0) {
      container.innerHTML = `<div class="empty-state">Tidak ada dokter yang cocok. Coba kata kunci lain.</div>`;
      return;
    }
    container.innerHTML = doctors.map(doctorCard).join("");
    container.querySelectorAll("[data-book-doctor]").forEach((btn) =>
      btn.addEventListener("click", () => openBookingModal(JSON.parse(btn.dataset.book)))
    );
  } catch (err) {
<<<<<<< HEAD
    // Fallback: tampilkan data seed (database/seed.sql) bila API tak tersedia
    const fallback = seedDoctors({ search, specialization, city });
    if (fallback.length > 0) {
      doctorsLoaded = true;
      container.innerHTML = fallback.map(doctorCard).join("");
      container.querySelectorAll("[data-book-doctor]").forEach((btn) =>
        btn.addEventListener("click", () => openBookingModal(JSON.parse(btn.dataset.book)))
      );
      return;
    }
=======
>>>>>>> f6c92f1718e33ab8d34e10cc67004b4f3d17bd1b
    container.innerHTML = `<div class="empty-state">${escapeHtml(err.message)}</div>`;
  }
}

function doctorCard(d) {
  const clinics = d.clinics || [];
<<<<<<< HEAD
  const name = escapeHtml(d.full_name);
  const spec = escapeHtml(d.specialization);
  return `
    <div class="card doctor-card">
      <div class="doc-header">
        <div class="doc-avatar" aria-hidden="true">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 5v14M5 12h14"/>
            <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.4"/>
          </svg>
        </div>
        <div class="doc-info">
          <h3 class="doc-name">${name}</h3>
          <span class="doc-specialization">${spec}</span>
=======
  return `
    <div class="card">
      <div class="card-top">
        <div>
          <p class="card-title">${escapeHtml(d.full_name)}</p>
          <p class="card-sub">${escapeHtml(d.specialization)}</p>
>>>>>>> f6c92f1718e33ab8d34e10cc67004b4f3d17bd1b
        </div>
        <span class="mono-pill">${clinics.length} klinik</span>
      </div>
      <div class="chip-row">
<<<<<<< HEAD
        ${clinics.map((c) => `<span class="chip">${escapeHtml(c.name)} Â· ${escapeHtml(c.city)}</span>`).join("")}
=======
        ${clinics.map((c) => `<span class="chip">${escapeHtml(c.name)} · ${escapeHtml(c.city)}</span>`).join("")}
>>>>>>> f6c92f1718e33ab8d34e10cc67004b4f3d17bd1b
      </div>
      <div class="card-actions">
        <button class="btn primary small" data-book-doctor
          data-book='${escapeHtml(JSON.stringify({ id: d.id, full_name: d.full_name, specialization: d.specialization })).replace(/'/g, "&#39;")}'>
          Lihat jadwal &amp; booking
        </button>
      </div>
    </div>`;
}

document.getElementById("btnSearchDoctors").addEventListener("click", loadDoctors);
["docSearch", "docSpecialization", "docCity"].forEach((id) =>
  document.getElementById(id).addEventListener("keydown", (e) => { if (e.key === "Enter") loadDoctors(); })
);

// ---- Booking modal ----
const bookingModal = document.getElementById("bookingModal");
let currentDoctor = null;
let currentSchedules = [];

async function openBookingModal(doctor) {
  if (!requireLogin()) return;
  currentDoctor = doctor;
  document.getElementById("bookingDoctorName").textContent = doctor.full_name;
  document.getElementById("bookingDoctorMeta").textContent = doctor.specialization;
  document.getElementById("bookingError").textContent = "";
  const select = document.getElementById("bookingScheduleSelect");
  select.innerHTML = `<option>Memuat jadwal…</option>`;
  bookingModal.hidden = false;

  try {
    currentSchedules = await api(`/doctors/${doctor.id}/schedules`);
    if (currentSchedules.length === 0) {
      select.innerHTML = `<option value="">Belum ada jadwal tersedia</option>`;
      return;
    }
    select.innerHTML = currentSchedules
      .map(
        (s) =>
          `<option value="${s.id}">${DAY_NAMES[s.day_of_week]}, ${s.start_time.slice(0, 5)}–${s.end_time.slice(0, 5)} · ${escapeHtml(s.clinic_name)} (${escapeHtml(s.clinic_city)})</option>`
      )
      .join("");
    updateBookingDateHint();
  } catch (err) {
<<<<<<< HEAD
    // Fallback: jadwal dari seed bila API tak tersedia
    currentSchedules = seedSchedules(doctor.id);
    if (currentSchedules.length > 0) {
      select.innerHTML = currentSchedules
        .map(
          (s) =>
            `<option value="${s.id}">${DAY_NAMES[s.day_of_week]}, ${s.start_time.slice(0, 5)}–${s.end_time.slice(0, 5)} · ${escapeHtml(s.clinic_name)} (${escapeHtml(s.clinic_city)})</option>`
        )
        .join("");
      updateBookingDateHint();
      return;
    }
=======
>>>>>>> f6c92f1718e33ab8d34e10cc67004b4f3d17bd1b
    select.innerHTML = `<option value="">${escapeHtml(err.message)}</option>`;
  }
}

document.getElementById("bookingScheduleSelect").addEventListener("change", updateBookingDateHint);
function updateBookingDateHint() {
  const scheduleId = Number(document.getElementById("bookingScheduleSelect").value);
  const schedule = currentSchedules.find((s) => s.id === scheduleId);
  const dateInput = document.getElementById("bookingDate");
  if (schedule) dateInput.min = new Date().toISOString().slice(0, 10);
}

document.getElementById("closeBooking").addEventListener("click", () => (bookingModal.hidden = true));
bookingModal.addEventListener("click", (e) => { if (e.target === bookingModal) bookingModal.hidden = true; });

document.getElementById("bookingForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const errorEl = document.getElementById("bookingError");
  errorEl.textContent = "";
  const scheduleId = Number(document.getElementById("bookingScheduleSelect").value);
  const bookingDate = document.getElementById("bookingDate").value;
  const notes = document.getElementById("bookingNotes").value.trim();

  const schedule = currentSchedules.find((s) => s.id === scheduleId);
  if (schedule && bookingDate) {
    const isoDay = (new Date(bookingDate + "T00:00:00").getDay() + 6) % 7 + 1;
    if (isoDay !== schedule.day_of_week) {
      errorEl.textContent = `Tanggal itu bukan hari ${DAY_NAMES[schedule.day_of_week]}. Pilih tanggal yang sesuai.`;
      return;
    }
  }

  try {
    await api("/bookings", {
      method: "POST",
      body: JSON.stringify({ scheduleId, bookingDate, notes }),
    });
    bookingModal.hidden = true;
    document.getElementById("bookingForm").reset();
    toast("Booking berhasil dibuat!");
    if (activeTab === "riwayat") loadBookings();
  } catch (err) {
    errorEl.textContent = err.message;
  }
});

// ---------------------------------------------------------------------------
// Apotek / Obat
// ---------------------------------------------------------------------------
let medicinesLoaded = false;

async function loadCategories(targetId = "medCategory") {
  try {
    const categories = await api("/medicines/categories");
    const select = document.getElementById(targetId);
    const placeholder = select.querySelector("option");
    select.innerHTML = "";
    if (placeholder) select.appendChild(placeholder);
    categories.forEach((c) => {
      const opt = document.createElement("option");
      opt.value = c.name;
      opt.textContent = c.name;
      opt.dataset.id = c.id;
      select.appendChild(opt);
    });
  } catch (err) {
    console.error(err);
  }
}

async function loadMedicines() {
  const search = document.getElementById("medSearch").value.trim();
  const category = document.getElementById("medCategory").value;
  const minPrice = document.getElementById("medMinPrice").value;
  const maxPrice = document.getElementById("medMaxPrice").value;
  const params = new URLSearchParams({ search, category, minPrice, maxPrice });

  const container = document.getElementById("medicineResults");
  container.innerHTML = `<div class="empty-state">Memuat katalog obat…</div>`;
  try {
    const meds = await api(`/medicines?${params}`);
    medicinesLoaded = true;
    if (meds.length === 0) {
      container.innerHTML = `<div class="empty-state">Tidak ada obat yang cocok dengan filter ini.</div>`;
      return;
    }
    container.innerHTML = meds.map(medicineCard).join("");
    container.querySelectorAll("[data-buy-med]").forEach((btn) =>
      btn.addEventListener("click", () => openCartModal(JSON.parse(btn.dataset.buy)))
    );
  } catch (err) {
    container.innerHTML = `<div class="empty-state">${escapeHtml(err.message)}</div>`;
  }
}

function medicineCard(m) {
  const inStock = Number(m.total_stock) > 0;
  return `
    <div class="card">
      <div class="card-top">
        <div>
          <p class="card-title">${escapeHtml(m.name)}</p>
          <p class="card-sub">${escapeHtml(m.category || "Tanpa kategori")}</p>
        </div>
        <span class="mono-pill">${escapeHtml(m.sku)}</span>
      </div>
      ${m.description ? `<p class="card-sub">${escapeHtml(m.description)}</p>` : ""}
      <div class="price-row">
        <span class="price">${m.lowest_price ? formatRupiah(m.lowest_price) : "Stok habis"}</span>
        <span class="stock-note">${inStock ? `${m.total_stock} unit total` : "tidak tersedia"}</span>
      </div>
      <div class="card-actions">
        <button class="btn primary small" ${inStock ? "" : "disabled"} data-buy-med
          data-buy='${escapeHtml(JSON.stringify({ id: m.id, name: m.name, category: m.category })).replace(/'/g, "&#39;")}'>
          Lihat apotek &amp; beli
        </button>
      </div>
    </div>`;
}

document.getElementById("btnSearchMeds").addEventListener("click", loadMedicines);
["medSearch", "medMinPrice", "medMaxPrice"].forEach((id) =>
  document.getElementById(id).addEventListener("keydown", (e) => { if (e.key === "Enter") loadMedicines(); })
);
document.getElementById("medCategory").addEventListener("change", loadMedicines);

// ---- Cart / purchase modal ----
const cartModal = document.getElementById("cartModal");
let currentMedicine = null;
let selectedPharmacyStock = null;

async function openCartModal(med) {
  if (!requireLogin()) return;
  currentMedicine = med;
  selectedPharmacyStock = null;
  document.getElementById("cartMedName").textContent = med.name;
  document.getElementById("cartMedMeta").textContent = med.category || "";
  document.getElementById("cartError").textContent = "";
  document.getElementById("cartForm").hidden = true;
  const list = document.getElementById("cartPharmacyList");
  list.innerHTML = `<div class="empty-state">Memuat stok apotek…</div>`;
  cartModal.hidden = false;

  try {
    const stock = await api(`/medicines/${med.id}/stock`);
    if (stock.length === 0) {
      list.innerHTML = `<div class="empty-state">Stok sedang habis di semua apotek.</div>`;
      return;
    }
    list.innerHTML = stock
      .map(
        (s, i) => `
      <div class="list-item" style="cursor:pointer" data-pharmacy-idx="${i}">
        <div class="list-item-top">
          <div>
            <p class="list-item-title">${escapeHtml(s.pharmacy_name)}</p>
            <p class="list-item-meta">${escapeHtml(s.city)} · stok ${s.stock_qty}</p>
          </div>
          <span class="price">${formatRupiah(s.price)}</span>
        </div>
      </div>`
      )
      .join("");
    list.querySelectorAll("[data-pharmacy-idx]").forEach((el) =>
      el.addEventListener("click", () => {
        selectedPharmacyStock = stock[Number(el.dataset.pharmacyIdx)];
        document.getElementById("cartSelectedPharmacy").textContent =
          `${selectedPharmacyStock.pharmacy_name} — ${formatRupiah(selectedPharmacyStock.price)}/unit`;
        document.getElementById("cartQty").max = selectedPharmacyStock.stock_qty;
        document.getElementById("cartForm").hidden = false;
      })
    );
  } catch (err) {
    list.innerHTML = `<div class="empty-state">${escapeHtml(err.message)}</div>`;
  }
}

document.getElementById("closeCart").addEventListener("click", () => (cartModal.hidden = true));
cartModal.addEventListener("click", (e) => { if (e.target === cartModal) cartModal.hidden = true; });

document.getElementById("cartForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const errorEl = document.getElementById("cartError");
  errorEl.textContent = "";
  const qty = Number(document.getElementById("cartQty").value);

  try {
    const result = await api("/transactions", {
      method: "POST",
      body: JSON.stringify({
        pharmacyId: selectedPharmacyStock.pharmacy_id,
        items: [{ medicineId: currentMedicine.id, quantity: qty }],
      }),
    });
    cartModal.hidden = true;
    document.getElementById("cartForm").reset();
    toast(`Pembelian berhasil — total ${formatRupiah(result.totalPrice)}`);
    medicinesLoaded = false;
    if (activeTab === "apotek") loadMedicines();
  } catch (err) {
    errorEl.textContent = err.message;
  }
});

// ---------------------------------------------------------------------------
// Riwayat
// ---------------------------------------------------------------------------
async function loadBookings() {
  if (!state.token) return;
  const container = document.getElementById("bookingList");
  container.innerHTML = `<div class="empty-state">Memuat riwayat booking…</div>`;
  try {
    const bookings = await api("/bookings/me");
    if (bookings.length === 0) {
      container.innerHTML = `<div class="empty-state">Belum ada booking. Cari dokter untuk mulai.</div>`;
      return;
    }
    container.innerHTML = bookings.map(bookingItem).join("");
    container.querySelectorAll("[data-cancel-booking]").forEach((btn) =>
      btn.addEventListener("click", () => cancelBooking(btn.dataset.cancelBooking))
    );
  } catch (err) {
    container.innerHTML = `<div class="empty-state">${escapeHtml(err.message)}</div>`;
  }
}

function bookingItem(b) {
  return `
    <div class="list-item">
      <div class="list-item-top">
        <div>
          <p class="list-item-title">${escapeHtml(b.doctor_name)} <span class="card-sub">· ${escapeHtml(b.specialization)}</span></p>
          <p class="list-item-meta">${escapeHtml(b.clinic_name)}, ${escapeHtml(b.clinic_city)} · ${formatDate(b.booking_date)} · ${b.start_time.slice(0,5)}–${b.end_time.slice(0,5)}</p>
          ${b.notes ? `<p class="list-item-meta">Catatan: ${escapeHtml(b.notes)}</p>` : ""}
        </div>
        <div style="display:flex; align-items:center; gap:0.6rem;">
          <span class="status ${b.status}">${b.status}</span>
          ${b.status === "menunggu" ? `<button class="btn danger small" data-cancel-booking="${b.id}">Batalkan</button>` : ""}
        </div>
      </div>
    </div>`;
}

async function cancelBooking(id) {
  try {
    await api(`/bookings/${id}/cancel`, { method: "PATCH" });
    toast("Booking dibatalkan.");
    loadBookings();
  } catch (err) {
    toast(err.message, true);
  }
}

async function loadTransactions() {
  if (!state.token) return;
  const container = document.getElementById("txList");
  container.innerHTML = `<div class="empty-state">Memuat riwayat transaksi…</div>`;
  try {
    const txs = await api("/transactions/me");
    if (txs.length === 0) {
      container.innerHTML = `<div class="empty-state">Belum ada transaksi. Beli obat di tab Apotek.</div>`;
      return;
    }
    container.innerHTML = txs.map(transactionItem).join("");
  } catch (err) {
    container.innerHTML = `<div class="empty-state">${escapeHtml(err.message)}</div>`;
  }
}

function transactionItem(t) {
  return `
    <div class="list-item">
      <div class="list-item-top">
        <div>
          <p class="list-item-title">${escapeHtml(t.pharmacy_name)}</p>
          <p class="list-item-meta">${escapeHtml(t.pharmacy_city)} · ${formatDate(t.created_at)}</p>
        </div>
        <span class="price">${formatRupiah(t.total_price)}</span>
      </div>
      ${t.items.map((it) => `
        <div class="item-line">
          <span>${escapeHtml(it.medicine_name)} <span class="mono-pill">${escapeHtml(it.sku_at_purchase)}</span> × ${it.quantity}</span>
          <span>${formatRupiah(it.subtotal)}</span>
        </div>`).join("")}
    </div>`;
}

// ---------------------------------------------------------------------------
// Admin — kelola obat
// ---------------------------------------------------------------------------
async function loadAdminMedicines() {
  const container = document.getElementById("adminMedicineList");
  container.innerHTML = `<div class="empty-state">Memuat…</div>`;
  try {
    const meds = await api("/medicines");
    if (meds.length === 0) {
      container.innerHTML = `<div class="empty-state">Belum ada obat. Tambahkan lewat form di atas.</div>`;
      return;
    }
    container.innerHTML = meds.map(adminMedicineItem).join("");
    container.querySelectorAll("[data-delete-med]").forEach((btn) =>
      btn.addEventListener("click", () => deleteMedicine(btn.dataset.deleteMed))
    );
  } catch (err) {
    container.innerHTML = `<div class="empty-state">${escapeHtml(err.message)}</div>`;
  }
}

function adminMedicineItem(m) {
  return `
    <div class="list-item">
      <div class="list-item-top">
        <div>
          <p class="list-item-title">${escapeHtml(m.name)} <span class="mono-pill">${escapeHtml(m.sku)}</span></p>
          <p class="list-item-meta">${escapeHtml(m.category || "Tanpa kategori")} · ${m.description ? escapeHtml(m.description) : "tanpa deskripsi"}</p>
        </div>
        <button class="btn danger small" data-delete-med="${m.id}">Hapus</button>
      </div>
    </div>`;
}

async function deleteMedicine(id) {
  if (!confirm("Hapus obat ini dari katalog?")) return;
  try {
    await api(`/medicines/${id}`, { method: "DELETE" });
    toast("Obat dihapus.");
    loadAdminMedicines();
  } catch (err) {
    toast(err.message, true);
  }
}

document.getElementById("addMedicineForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const categorySelect = document.getElementById("newCategory");
  const categoryId = categorySelect.selectedOptions[0]?.dataset.id || null;
  try {
    await api("/medicines", {
      method: "POST",
      body: JSON.stringify({
        sku: document.getElementById("newSku").value.trim(),
        name: document.getElementById("newName").value.trim(),
        description: document.getElementById("newDesc").value.trim(),
        categoryId,
      }),
    });
    document.getElementById("addMedicineForm").reset();
    toast("Obat baru ditambahkan.");
    loadAdminMedicines();
  } catch (err) {
    toast(err.message, true);
  }
});

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------
applyAuthUI();
switchTab("beranda");
