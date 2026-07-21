const API = "api";
const DAY_NAMES = ["", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];
const MEDICINE_ACTIONS = {
  VIEW_STOCK: "med-view-stock",
  BUY: "med-buy"
};

let state = { user: null };
let pharmaciesCache = [];
let medicinesCache = [];

async function api(path, options = {}) {
  const res = await fetch(`${API}/${path}`, {
    credentials: "same-origin",
    ...options,
    headers: {
      "Content-Type": "application/json",
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

function pharmacyBrand(name) {
  return String(name ?? "").replace(/MediKita/g, "Eterna Care");
}

function persistUser(user) {
  state.user = user;
  applyAuthUI();
}

function clearUser() {
  state.user = null;
  applyAuthUI();
}

function applyAuthUI() {
  const loggedIn = !!state.user;
  const isAdmin = state.user?.role === "admin";

  document.querySelectorAll(".auth-only").forEach((el) => (el.hidden = !loggedIn));
  document.querySelectorAll(".guest-only").forEach((el) => (el.hidden = loggedIn));
  document.querySelectorAll(".admin-only").forEach((el) => (el.hidden = !isAdmin));

  document.getElementById("whoLabel").textContent = loggedIn
    ? `${state.user.fullName} · ${state.user.role === "admin" ? "admin" : "pasien"}`
    : "";

  if (!isAdmin && activeTab === "admin") switchTab("beranda");
}

let activeTab = "beranda";
let activeApotekSub = "katalog";

function switchTab(tab) {
  activeTab = tab;
  document.querySelectorAll(".tab-btn").forEach((b) => b.classList.toggle("active", b.dataset.tab === tab));
  document.querySelectorAll(".tab-panel").forEach((p) => (p.hidden = p.id !== `panel-${tab}`));

  if (tab === "dokter" && !doctorsLoaded) loadDoctors();
  if (tab === "apotek" && !medicinesLoaded) { loadCategories(); loadMedicines(); }
  if (tab === "apotek" && !pharmaciesLoaded) loadPharmacies();
  if (tab === "riwayat") loadTransactions();
  if (tab === "admin") { loadCategories("newCategory"); loadAdminMedicines(); }
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function switchApotekSub(sub) {
  activeApotekSub = sub;
  document.querySelectorAll("[data-apotek-sub]").forEach((b) => b.classList.toggle("active", b.dataset.apotekSub === sub));
  document.getElementById("sub-katalog").hidden = sub !== "katalog";
  document.getElementById("sub-apotek-list").hidden = sub !== "apotek-list";
  if (sub === "apotek-list" && !pharmaciesLoaded) loadPharmacies();
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

document.querySelectorAll("[data-apotek-sub]").forEach((btn) => {
  btn.addEventListener("click", () => switchApotekSub(btn.dataset.apotekSub));
});

// ---- Auth ----
const authModal = document.getElementById("authModal");
document.getElementById("btnOpenAuth").addEventListener("click", () => {
  authModal.hidden = false;
});
document.getElementById("closeAuth").addEventListener("click", () => {
  authModal.hidden = true;
});
authModal.addEventListener("click", (e) => {
  if (e.target === authModal) authModal.hidden = true;
});

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
    const { user } = await api("auth.php?action=login", {
      method: "POST",
      body: JSON.stringify({
        email: document.getElementById("loginEmail").value.trim(),
        password: document.getElementById("loginPassword").value,
      }),
    });
    persistUser(user);
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
    const { user } = await api("auth.php?action=register", {
      method: "POST",
      body: JSON.stringify({
        fullName: document.getElementById("regName").value.trim(),
        email: document.getElementById("regEmail").value.trim(),
        dateOfBirth: document.getElementById("regDob").value || null,
        phone: document.getElementById("regPhone").value || null,
        password: document.getElementById("regPassword").value,
      }),
    });
    persistUser(user);
    authModal.hidden = true;
    toast(`Akun dibuat. Selamat datang, ${user.fullName}!`);
  } catch (err) {
    errorEl.textContent = err.message;
  }
});

document.getElementById("btnLogout").addEventListener("click", async () => {
  try { await api("auth.php?action=logout", { method: "POST" }); } catch (_) {}
  clearUser();
  toast("Kamu sudah keluar.");
  switchTab("beranda");
});

function requireLogin() {
  if (!state.user) {
    authModal.hidden = false;
    toast("Masuk dulu untuk melanjutkan.", true);
    return false;
  }
  return true;
}

// ---- Dokter ----
let doctorsLoaded = false;

async function loadDoctors() {
  const search = document.getElementById("docSearch").value.trim();
  const specialization = document.getElementById("docSpecialization").value.trim();
  const city = document.getElementById("docCity").value.trim();
  const params = new URLSearchParams({ search, specialization, city });

  const container = document.getElementById("doctorResults");
  container.innerHTML = `<div class="empty-state">Memuat dokter…</div>`;
  try {
    const doctors = await api(`doctors.php?${params}`);
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
    const fallback = seedDoctors({ search, specialization, city });
    if (fallback.length > 0) {
      doctorsLoaded = true;
      container.innerHTML = fallback.map(doctorCard).join("");
      container.querySelectorAll("[data-book-doctor]").forEach((btn) =>
        btn.addEventListener("click", () => openBookingModal(JSON.parse(btn.dataset.book)))
      );
      return;
    }
    container.innerHTML = `<div class="empty-state">${escapeHtml(err.message)}</div>`;
  }
}

function doctorCard(d) {
  const clinics = d.clinics || [];
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
        </div>
        <span class="mono-pill">${clinics.length} klinik</span>
      </div>
      <div class="chip-row">
         ${clinics.map((c) => `<span class="chip">${escapeHtml(c.name)} · ${escapeHtml(c.city)}</span>`).join("")}
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
    currentSchedules = await api(`doctors.php?id=${doctor.id}&schedules=1`);
    if (currentSchedules.length === 0) {
      select.innerHTML = `<option value="">Belum ada jadwal tersedia</option>`;
      return;
    }
    select.innerHTML = currentSchedules
      .map(
        (s) =>
          `<option value="${s.id}">${DAY_NAMES[s.day_of_week]}, ${String(s.start_time).slice(0, 5)}–${String(s.end_time).slice(0, 5)} · ${escapeHtml(s.clinic_name)} (${escapeHtml(s.clinic_city)})</option>`
      )
      .join("");
    updateBookingDateHint();
  } catch (err) {
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
    await api("bookings.php", {
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

// ---- Apotek / Obat ----
let medicinesLoaded = false;
let pharmaciesLoaded = false;

async function loadCategories(targetId = "medCategory") {
  try {
    const categories = await api("medicines.php?action=categories");
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
    const meds = await api(`medicines.php?${params}`);
    medicinesLoaded = true;
    medicinesCache = meds;
    if (meds.length === 0) {
      container.innerHTML = `<div class="empty-state">Tidak ada obat yang cocok dengan filter ini.</div>`;
      return;
    }
    container.innerHTML = meds.map(medicineCard).join("");
    bindMedicineActions(container);
  } catch (err) {
    container.innerHTML = `<div class="empty-state">${escapeHtml(err.message)}</div>`;
  }
}

function bindMedicineActions(container) {
  container.querySelectorAll("[data-medicine-action=\"view-stock\"]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const id = Number(btn.dataset.medicineId);
      const med = medicinesCache.find((m) => m.id === id);
      if (med) openMedStockModal({ id: med.id, name: med.name, category: med.category });
    });
  });

  container.querySelectorAll("[data-medicine-action=\"buy\"]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const id = Number(btn.dataset.medicineId);
      const med = medicinesCache.find((m) => m.id === id);
      if (med) openCartModal({ id: med.id, name: med.name, category: med.category });
    });
  });
}

function medicineCard(m) {
  const inStock = Number(m.total_stock) > 0;
  const medId = Number(m.id);
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
        <button type="button" class="btn outline small" data-medicine-action="view-stock" data-medicine-id="${medId}">
          Lihat apotek
        </button>
        <button type="button" class="btn primary small" ${inStock ? "" : "disabled"} data-medicine-action="buy" data-medicine-id="${medId}">
          Beli
        </button>
      </div>
    </div>`;
}

document.getElementById("btnSearchMeds").addEventListener("click", loadMedicines);
["medSearch", "medMinPrice", "medMaxPrice"].forEach((id) =>
  document.getElementById(id).addEventListener("keydown", (e) => { if (e.key === "Enter") loadMedicines(); })
);
document.getElementById("medCategory").addEventListener("change", loadMedicines);

// ---- Pharmacy listing & catalog ----
async function loadPharmacies() {
  const search = document.getElementById("pharmSearch").value.trim();
  const city = document.getElementById("pharmCity").value.trim();
  const params = new URLSearchParams({ search, city });

  const container = document.getElementById("pharmacyResults");
  container.innerHTML = `<div class="empty-state">Memuat apotek…</div>`;
  try {
    const pharmacies = await api(`pharmacies.php?${params}`);
    pharmaciesLoaded = true;
    pharmaciesCache = pharmacies;
    if (pharmacies.length === 0) {
      container.innerHTML = `<div class="empty-state">Tidak ada apotek yang cocok.</div>`;
      return;
    }
    container.innerHTML = pharmacies.map((p) => pharmacyCard(p)).join("");
    container.querySelectorAll("[data-pharmacy-id]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = Number(btn.dataset.pharmacyId);
        const pharmacy = pharmaciesCache.find((p) => p.id === id);
        if (pharmacy) openPharmacyCatalog(pharmacy);
      });
    });
  } catch (err) {
    container.innerHTML = `<div class="empty-state">${escapeHtml(err.message)}</div>`;
  }
}

function pharmacyCard(p) {
  return `
    <div class="card">
      ${p.image_url ? `<img class="pharm-img" src="${escapeHtml(p.image_url)}" alt="${escapeHtml(p.name)}" loading="lazy" />` : ""}
      <div class="card-top">
        <div>
          <p class="card-title">${escapeHtml(pharmacyBrand(p.name))}</p>
          <p class="card-sub">${escapeHtml(p.city)}${p.address ? " · " + escapeHtml(p.address) : ""}</p>
        </div>
        <span class="mono-pill">Apotek</span>
      </div>
      <div class="card-actions">
        <button type="button" class="btn primary small" data-pharmacy-id="${p.id}">
          Lihat katalog obat
        </button>
      </div>
    </div>`;
}

document.getElementById("btnSearchPharmacies").addEventListener("click", loadPharmacies);
["pharmSearch", "pharmCity"].forEach((id) =>
  document.getElementById(id).addEventListener("keydown", (e) => { if (e.key === "Enter") loadPharmacies(); })
);

// ---- Pharmacy catalog modal ----
const pharmacyCatalogModal = document.getElementById("pharmacyCatalogModal");
let currentPharmacy = null;

async function openPharmacyCatalog(pharmacy) {
  currentPharmacy = pharmacy;
  document.getElementById("catalogPharmacyName").textContent = pharmacyBrand(pharmacy.name);
  document.getElementById("catalogPharmacyMeta").textContent = `${pharmacy.city}${pharmacy.address ? " · " + pharmacy.address : ""}`;

  const imgEl = document.getElementById("catalogPharmacyImage");
  if (pharmacy.image_url) {
    imgEl.src = pharmacy.image_url;
    imgEl.hidden = false;
  } else {
    imgEl.hidden = true;
  }

  const list = document.getElementById("catalogMedicineList");
  list.innerHTML = `<div class="empty-state">Memuat katalog…</div>`;
  pharmacyCatalogModal.hidden = false;

  try {
    const catalog = await api(`pharmacies.php?id=${pharmacy.id}&action=catalog`);
    if (catalog.length === 0) {
      list.innerHTML = `<div class="empty-state">Belum ada obat di katalog apotek ini.</div>`;
      return;
    }
    list.innerHTML = catalog.map((item) => `
      <div class="list-item">
        <div class="list-item-top">
          <div>
            <p class="list-item-title">${escapeHtml(item.name)} <span class="mono-pill">${escapeHtml(item.sku)}</span></p>
            <p class="list-item-meta">${escapeHtml(item.category || "Tanpa kategori")} · stok ${item.stock_qty}</p>
          </div>
          <span class="price">${formatRupiah(item.price)}</span>
        </div>
      </div>
    `).join("");
  } catch (err) {
    list.innerHTML = `<div class="empty-state">${escapeHtml(err.message)}</div>`;
  }
}

document.getElementById("closePharmacyCatalog").addEventListener("click", () => (pharmacyCatalogModal.hidden = true));
pharmacyCatalogModal.addEventListener("click", (e) => { if (e.target === pharmacyCatalogModal) pharmacyCatalogModal.hidden = true; });

// ---- Medicine stock modal ----
const medStockModal = document.getElementById("medStockModal");
let currentMedStock = null;

async function openMedStockModal(med) {
  currentMedStock = med;
  document.getElementById("medStockMedName").textContent = med.name;
  document.getElementById("medStockMedMeta").textContent = med.category || "";
  const list = document.getElementById("medStockList");
  list.innerHTML = `<div class="empty-state">Memuat stok apotek…</div>`;
  medStockModal.hidden = false;

  try {
    const [stock, prescriptions] = await Promise.all([
      api(`medicines.php?id=${med.id}&action=stock`),
      api(`medicines.php?id=${med.id}&action=prescriptions`).catch(() => []),
    ]);

    let hospitalsHtml = "";
    if (prescriptions.length > 0) {
      const cities = [...new Set(prescriptions.map((p) => p.clinic_city))];
      hospitalsHtml = `
        <div style="margin-bottom: 1rem; padding: 0.9rem; background: rgba(30,111,92,0.06); border: 1px dashed var(--line-strong); border-radius: var(--radius-sm);">
          <p style="margin: 0 0 0.5rem; font-family: var(--font-display); font-size: 1rem; color: var(--pine-deep);">Rumah sakit / klinik yang meresepkan obat ini</p>
          ${prescriptions.map((p) => `
            <div style="display: flex; justify-content: space-between; align-items: baseline; font-size: 0.88rem; margin-top: 0.35rem;">
              <span><strong>${escapeHtml(p.clinic_name)}</strong></span>
              <span class="mono-pill">${escapeHtml(p.clinic_city)}</span>
            </div>
          `).join("")}
          ${cities.length > 0 ? `<p style="margin: 0.6rem 0 0; font-size: 0.82rem; color: var(--ink-soft);">Menampilkan apotek di kota: ${escapeHtml(cities.join(", "))}</p>` : ""}
        </div>
      `;
    }

    const hasPrescriptions = prescriptions.length > 0;

    if (stock.length === 0) {
      list.innerHTML = hospitalsHtml ? hospitalsHtml + `<div class="empty-state">Stok sedang habis di semua apotek.</div>` : `<div class="empty-state">Stok sedang habis di semua apotek.</div>`;
      return;
    }

    const filteredStock = hasPrescriptions
      ? stock.filter((s) => prescriptions.some((p) => p.clinic_city === s.city))
      : stock;

    list.innerHTML = hospitalsHtml + (filteredStock.length > 0
      ? filteredStock.map((s) => {
          const displayStock = hasPrescriptions ? 0 : s.stock_qty;
          return `
            <div class="list-item clickable" data-pharmacy-idx="${s.pharmacy_id}">
              ${s.image_url ? `<img class="pharm-thumb" src="${escapeHtml(s.image_url)}" alt="${escapeHtml(pharmacyBrand(s.pharmacy_name))}" loading="lazy" />` : ""}
              <div class="list-item-top">
                <div>
                  <p class="list-item-title">${escapeHtml(pharmacyBrand(s.pharmacy_name))}</p>
                  <p class="list-item-meta">${escapeHtml(s.city)} · stok ${displayStock}</p>
                </div>
                <span class="price">${formatRupiah(s.price)}</span>
              </div>
            </div>`;
        }).join("")
      : `<div class="empty-state">Tidak ada apotek di kota yang sesuai dengan rumah sakit penyebut obat ini.</div>`);

    list.querySelectorAll("[data-pharmacy-idx]").forEach((el) => {
      el.addEventListener("click", (e) => {
        e.preventDefault();
        const pharmacyId = Number(el.dataset.pharmacyIdx);
        const selected = filteredStock.find((s) => s.pharmacy_id === pharmacyId) || stock.find((s) => s.pharmacy_id === pharmacyId);
        if (selected) openCartModalFromStock(selected, med);
      });
    });
  } catch (err) {
    list.innerHTML = `<div class="empty-state">${escapeHtml(err.message)}</div>`;
  }
}

function openCartModalFromStock(stockItem, med) {
  if (!requireLogin()) return;
  selectedPharmacyStock = stockItem;
  currentMedicine = { id: med.id, name: med.name, category: med.category };

  document.getElementById("cartMedName").textContent = med.name;
  document.getElementById("cartMedMeta").textContent = med.category || "";
  document.getElementById("cartSelectedPharmacy").textContent =
    `${pharmacyBrand(selectedPharmacyStock.pharmacy_name)} — ${formatRupiah(selectedPharmacyStock.price)}/unit`;
  document.getElementById("cartQty").max = selectedPharmacyStock.stock_qty;
  document.getElementById("cartQty").value = 1;
  document.getElementById("cartError").textContent = "";
  document.getElementById("cartForm").hidden = false;
  cartModal.hidden = false;
}

document.getElementById("closeMedStock").addEventListener("click", () => (medStockModal.hidden = true));
medStockModal.addEventListener("click", (e) => { if (e.target === medStockModal) medStockModal.hidden = true; });

// ---- Cart modal ----
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
    const [stock, prescriptions] = await Promise.all([
      api(`medicines.php?id=${med.id}&action=stock`),
      api(`medicines.php?id=${med.id}&action=prescriptions`).catch(() => []),
    ]);

    let hospitalsHtml = "";
    if (prescriptions.length > 0) {
      const cities = [...new Set(prescriptions.map((p) => p.clinic_city))];
      hospitalsHtml = `
        <div style="margin-bottom: 1rem; padding: 0.9rem; background: rgba(30,111,92,0.06); border: 1px dashed var(--line-strong); border-radius: var(--radius-sm);">
          <p style="margin: 0 0 0.5rem; font-family: var(--font-display); font-size: 1rem; color: var(--pine-deep);">Rumah sakit / klinik yang meresepkan obat ini</p>
          ${prescriptions.map((p) => `
            <div style="display: flex; justify-content: space-between; align-items: baseline; font-size: 0.88rem; margin-top: 0.35rem;">
              <span><strong>${escapeHtml(p.clinic_name)}</strong></span>
              <span class="mono-pill">${escapeHtml(p.clinic_city)}</span>
            </div>
          `).join("")}
          ${cities.length > 0 ? `<p style="margin: 0.6rem 0 0; font-size: 0.82rem; color: var(--ink-soft);">Menampilkan apotek di kota: ${escapeHtml(cities.join(", "))}</p>` : ""}
        </div>
      `;
    }

    const hasPrescriptions = prescriptions.length > 0;

    if (stock.length === 0) {
      list.innerHTML = hospitalsHtml ? hospitalsHtml + `<div class="empty-state">Stok sedang habis di semua apotek.</div>` : `<div class="empty-state">Stok sedang habis di semua apotek.</div>`;
      return;
    }

    const filteredStock = hasPrescriptions
      ? stock.filter((s) => prescriptions.some((p) => p.clinic_city === s.city))
      : stock;

    list.innerHTML = hospitalsHtml + (filteredStock.length > 0
      ? filteredStock.map((s, i) => {
          const displayStock = hasPrescriptions ? 0 : s.stock_qty;
          return `
            <div class="list-item clickable" data-pharmacy-idx="${i}">
              ${s.image_url ? `<img class="pharm-thumb" src="${escapeHtml(s.image_url)}" alt="${escapeHtml(pharmacyBrand(s.pharmacy_name))}" loading="lazy" />` : ""}
              <div class="list-item-top">
                <div>
                  <p class="list-item-title">${escapeHtml(pharmacyBrand(s.pharmacy_name))}</p>
                  <p class="list-item-meta">${escapeHtml(s.city)} · stok ${displayStock}</p>
                </div>
                <span class="price">${formatRupiah(s.price)}</span>
              </div>
            </div>`;
        }).join("")
      : `<div class="empty-state">Tidak ada apotek di kota yang sesuai dengan rumah sakit penyebut obat ini.</div>`);

    list.querySelectorAll("[data-pharmacy-idx]").forEach((el) => {
      el.addEventListener("click", (e) => {
        e.preventDefault();
        const idx = Number(el.dataset.pharmacyIdx);
        selectedPharmacyStock = filteredStock[idx] || stock[idx];
        if (!selectedPharmacyStock) return;
        document.getElementById("cartSelectedPharmacy").textContent =
          `${pharmacyBrand(selectedPharmacyStock.pharmacy_name)} — ${formatRupiah(selectedPharmacyStock.price)}/unit`;
        document.getElementById("cartQty").max = selectedPharmacyStock.stock_qty;
        document.getElementById("cartQty").value = 1;
        document.getElementById("cartForm").hidden = false;
      });
    });
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
  if (!selectedPharmacyStock) {
    errorEl.textContent = "Pilih apotek terlebih dahulu.";
    return;
  }

  try {
    const result = await api("transactions.php", {
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

// ---- Riwayat ----
async function loadBookings() {
  if (!state.user) return;
  const container = document.getElementById("bookingList");
  container.innerHTML = `<div class="empty-state">Memuat riwayat booking…</div>`;
  try {
    const bookings = await api("bookings.php?action=me");
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
          <p class="list-item-meta">${escapeHtml(b.clinic_name)}, ${escapeHtml(b.clinic_city)} · ${formatDate(b.booking_date)} · ${String(b.start_time).slice(0,5)}–${String(b.end_time).slice(0,5)}</p>
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
    await api(`bookings.php?id=${id}&action=cancel`, { method: "PATCH" });
    toast("Booking dibatalkan.");
    loadBookings();
  } catch (err) {
    toast(err.message, true);
  }
}

async function loadTransactions() {
  if (!state.user) return;
  const container = document.getElementById("txList");
  container.innerHTML = `<div class="empty-state">Memuat riwayat transaksi…</div>`;
  try {
    const txs = await api("transactions.php?action=me");
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
          <p class="list-item-title">${escapeHtml(pharmacyBrand(t.pharmacy_name))}</p>
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

// ---- Admin ----
async function loadAdminMedicines() {
  const container = document.getElementById("adminMedicineList");
  container.innerHTML = `<div class="empty-state">Memuat…</div>`;
  try {
    const meds = await api("medicines.php");
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
  const catLabel = m.category || "Tanpa kategori";
  return `
    <div class="list-item">
      <div class="list-item-top">
        <div>
          <p class="list-item-title">${escapeHtml(m.name)} <span class="mono-pill">${escapeHtml(m.sku)}</span></p>
          <p class="list-item-meta">${escapeHtml(catLabel)} · ${m.description ? escapeHtml(m.description) : "tanpa deskripsi"}</p>
        </div>
        <button class="btn danger small" data-delete-med="${m.id}">Hapus</button>
      </div>
    </div>`;
}

async function deleteMedicine(id) {
  if (!confirm("Hapus obat ini dari katalog?")) return;
  try {
    await api(`medicines.php?id=${id}`, { method: "DELETE" });
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
    await api("medicines.php", {
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

function seedDoctors({ search = "", specialization = "", city = "" }) {
  const fallback = [
    { id: 1, full_name: "dr. Ayu Lestari, Sp.PD", specialization: "Penyakit Dalam", clinics: [{ name: "Klinik Sehat Sentosa", city: "Jakarta Selatan" }] },
    { id: 2, full_name: "dr. Rangga Pratama, Sp.A", specialization: "Anak", clinics: [{ name: "Klinik Harapan Bunda", city: "Bandung" }] },
    { id: 3, full_name: "dr. Maria Christin, Sp.KK", specialization: "Kulit & Kelamin", clinics: [{ name: "Klinik Dermacare", city: "Surabaya" }] },
    { id: 4, full_name: "dr. Fajar Nugroho", specialization: "Dokter Umum", clinics: [{ name: "Klinik Pratama", city: "Jakarta Selatan" }] },
    { id: 5, full_name: "dr. Intan Permatasari, Sp.THT", specialization: "THT", clinics: [{ name: "Klinik Makara", city: "Bandung" }] },
  ];
  const q = `${search} ${specialization} ${city}`.toLowerCase();
  return fallback.filter((d) =>
    !q ||
    d.full_name.toLowerCase().includes(q) ||
    d.specialization.toLowerCase().includes(q) ||
    d.clinics.some((c) => c.city.toLowerCase().includes(q))
  );
}

function seedSchedules(doctorId) {
  const schedules = {
    1: [{ id: 101, day_of_week: 1, start_time: "08:00", end_time: "12:00", clinic_name: "Klinik Sehat Sentosa", clinic_city: "Jakarta Selatan" }],
    2: [{ id: 201, day_of_week: 2, start_time: "09:00", end_time: "11:00", clinic_name: "Klinik Harapan Bunda", clinic_city: "Bandung" }],
    3: [{ id: 301, day_of_week: 3, start_time: "13:00", end_time: "16:00", clinic_name: "Klinik Dermacare", clinic_city: "Surabaya" }],
    4: [{ id: 401, day_of_week: 4, start_time: "08:00", end_time: "10:00", clinic_name: "Klinik Pratama", clinic_city: "Jakarta Selatan" }],
    5: [{ id: 501, day_of_week: 5, start_time: "10:00", end_time: "12:00", clinic_name: "Klinik Makara", clinic_city: "Bandung" }],
  };
  return schedules[doctorId] || [];
}

// ---- Boot ----
(async function boot() {
  try {
    const { user } = await api("auth.php?action=me");
    if (user) persistUser(user);
  } catch (_) {}
  applyAuthUI();
  switchTab("beranda");
})();
