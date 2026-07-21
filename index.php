<?php
// Memanggil file koneksi database
require_once 'config.php'; 
?>
<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>MediKita — Akses kesehatan, dijadwalkan rapi</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;1,9..144,500&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="public/styles.css">
</head>
<body>

<div class="rx-corner" aria-hidden="true"><span>℞</span></div>

<header class="topbar">
  <div class="brand">
    <span class="brand-mark" aria-hidden="true">
      <svg viewBox="0 0 32 32" width="26" height="26">
        <path d="M16 2 C 9 2 4 8 4 16 C4 24 9 30 16 30 C 23 30 28 24 28 16 C 28 8 23 2 16 2 Z" fill="none" stroke="currentColor" stroke-width="2"/>
        <path d="M16 10 V22 M10 16 H22" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>
      </svg>
    </span>
    <span class="brand-name">MediKita</span>
  </div>

  <nav class="tabs" id="mainTabs">
    <button class="tab-btn active" data-tab="beranda">Beranda</button>
    <button class="tab-btn" data-tab="dokter">Cari Dokter</button>
    <button class="tab-btn" data-tab="apotek">Apotek</button>
    <button class="tab-btn auth-only" data-tab="riwayat" hidden>Riwayat Saya</button>
    <button class="tab-btn admin-only" data-tab="admin" hidden>Kelola Obat</button>
  </nav>

  <div class="auth-box">
    <span class="who guest-only" id="guestLabel">Belum masuk</span>
    <span class="who auth-only" id="whoLabel" hidden></span>
    <button class="btn ghost guest-only" id="btnOpenAuth">Masuk / Daftar</button>
    <button class="btn ghost auth-only" id="btnLogout" hidden>Keluar</button>
  </div>
</header>

<main id="app">

  <!-- ============ BERANDA ============ -->
  <section class="tab-panel" id="panel-beranda">
    <section class="hero">
      <div class="hero-copy">
        <p class="eyebrow">Klinik &amp; apotek partner di seluruh Indonesia</p>
        <h1 class="display">Booking dokter.<br>Tebus obat.<br><em>Satu label, satu riwayat.</em></h1>
        <p class="lede">MediKita menyatukan jadwal klinik partner dan stok apotek partner ke satu tempat—supaya kamu tahu persis kapan bisa ketemu dokter, dan di apotek mana obatmu tersedia dengan harga terbaik.</p>
        <div class="hero-cta">
          <button class="btn primary" data-goto="dokter">Cari dokter sekarang</button>
          <button class="btn outline" data-goto="apotek">Cek stok obat</button>
        </div>
      </div>
      <div class="hero-panel" aria-hidden="true">
        <div class="label-card">
          <div class="label-row"><span class="label-eyebrow">Rp / SKU</span><span class="label-eyebrow">MED-0001</span></div>
          <div class="label-title">Paracetamol 500mg</div>
          <div class="label-meta">10 tablet · Obat Bebas</div>
          <div class="label-divider"></div>
          <div class="label-row"><span>Termurah</span><strong>Rp 11.800</strong></div>
          <div class="label-row"><span>Tersedia di</span><strong>3 apotek</strong></div>
        </div>
        <div class="label-card offset">
          <div class="label-row"><span class="label-eyebrow">Jadwal</span><span class="label-eyebrow">Senin</span></div>
          <div class="label-title">dr. Fajar Nugroho</div>
          <div class="label-meta">Dokter Umum · Klinik Sehat Sentosa</div>
          <div class="label-divider"></div>
          <div class="label-row"><span>08.00 – 12.00</span><strong class="status pending">menunggu</strong></div>
        </div>
      </div>
    </section>

    <section class="stat-strip">
      <div class="stat"><span class="stat-n">4</span><span class="stat-l">Klinik partner</span></div>
      <div class="stat"><span class="stat-n">5</span><span class="stat-l">Dokter aktif</span></div>
      <div class="stat"><span class="stat-n">3</span><span class="stat-l">Apotek partner</span></div>
      <div class="stat"><span class="stat-n">7</span><span class="stat-l">Produk obat</span></div>
    </section>

    <section class="how">
      <h2 class="display sm">Cara kerja MediKita</h2>
      <div class="how-grid">
        <div class="how-card">
          <span class="how-mark">Cari &amp; pilih</span>
          <p>Telusuri dokter berdasarkan nama, spesialisasi, atau kota—lihat semua klinik tempat mereka praktik.</p>
        </div>
        <div class="how-card">
          <span class="how-mark">Booking slot</span>
          <p>Pilih jadwal praktik dan tanggal kunjungan. Status booking-mu tercatat: menunggu, selesai, atau dibatalkan.</p>
        </div>
        <div class="how-card">
          <span class="how-mark">Tebus di apotek</span>
          <p>Bandingkan stok dan harga obat antar apotek partner, lalu selesaikan transaksi dan simpan riwayatnya.</p>
        </div>
      </div>
    </section>
  </section>

  <!-- ============ CARI DOKTER ============ -->
  <section class="tab-panel" id="panel-dokter" hidden>
    <div class="panel-head">
      <h2 class="display sm">Cari dokter</h2>
      <p class="panel-sub">Berdasarkan nama, spesialisasi, atau kota tempat klinik berada.</p>
    </div>
    <div class="filter-bar">
      <input type="search" id="docSearch" placeholder="Nama dokter…" />
      <input type="text" id="docSpecialization" placeholder="Spesialisasi…" />
      <input type="text" id="docCity" placeholder="Kota…" />
      <button class="btn primary" id="btnSearchDoctors">Cari</button>
    </div>
    <div class="grid cards" id="doctorResults"></div>
  </section>

  <!-- ============ APOTEK / OBAT ============ -->
  <section class="tab-panel" id="panel-apotek" hidden>
    <div class="panel-head">
      <h2 class="display sm">Katalog obat</h2>
      <p class="panel-sub">Cari &amp; filter obat lintas apotek partner — harga termurah ditampilkan otomatis.</p>
    </div>
    <div class="filter-bar">
      <input type="search" id="medSearch" placeholder="Nama obat…" />
      <select id="medCategory"><option value="">Semua kategori</option></select>
      <input type="number" id="medMinPrice" placeholder="Harga min" min="0" />
      <input type="number" id="medMaxPrice" placeholder="Harga max" min="0" />
      <button class="btn primary" id="btnSearchMeds">Cari</button>
    </div>
    <div class="grid cards" id="medicineResults"></div>
  </section>

  <!-- ============ RIWAYAT ============ -->
  <section class="tab-panel" id="panel-riwayat" hidden>
    <div class="panel-head">
      <h2 class="display sm">Riwayat saya</h2>
      <p class="panel-sub">Semua booking konsultasi dan transaksi pembelian obatmu.</p>
    </div>

    <div class="subtabs">
      <button class="subtab-btn active" data-sub="bookinglist">Booking</button>
      <button class="subtab-btn" data-sub="txlist">Transaksi</button>
    </div>

    <div class="sub-panel" id="sub-bookinglist">
      <div class="list" id="bookingList"></div>
    </div>
    <div class="sub-panel" id="sub-txlist" hidden>
      <div class="list" id="txList"></div>
    </div>
  </section>

  <!-- ============ ADMIN ============ -->
  <section class="tab-panel" id="panel-admin" hidden>
    <div class="panel-head">
      <h2 class="display sm">Kelola katalog obat</h2>
      <p class="panel-sub">Tambah, ubah, atau hapus produk obat, serta atur stok &amp; harga per apotek.</p>
    </div>

    <form class="admin-form" id="addMedicineForm">
      <input type="text" id="newSku" placeholder="SKU (mis. MED-0008)" required />
      <input type="text" id="newName" placeholder="Nama obat" required />
      <select id="newCategory"><option value="">Kategori…</option></select>
      <input type="text" id="newDesc" placeholder="Deskripsi singkat" />
      <button class="btn primary" type="submit">+ Tambah obat</button>
    </form>

    <div class="list" id="adminMedicineList"></div>
  </section>

</main>

<!-- ============ AUTH MODAL ============ -->
<div class="modal-backdrop" id="authModal" hidden>
  <div class="modal">
    <button class="modal-close" id="closeAuth" aria-label="Tutup">×</button>
    <div class="modal-tabs">
      <button class="modal-tab active" data-modal-tab="login">Masuk</button>
      <button class="modal-tab" data-modal-tab="register">Daftar</button>
    </div>

    <form id="loginForm" class="modal-form">
      <label>Email<input type="email" id="loginEmail" required /></label>
      <label>Password<input type="password" id="loginPassword" required /></label>
      <p class="hint">Akun demo: siti.amelia@example.com / password123</p>
      <p class="form-error" id="loginError"></p>
      <button class="btn primary full" type="submit">Masuk</button>
    </form>

    <form id="registerForm" class="modal-form" hidden>
      <label>Nama lengkap<input type="text" id="regName" required /></label>
      <label>Email<input type="email" id="regEmail" required /></label>
      <label>Tanggal lahir<input type="date" id="regDob" /></label>
      <label>No. HP<input type="tel" id="regPhone" /></label>
      <label>Password<input type="password" id="regPassword" required minlength="6" /></label>
      <p class="form-error" id="registerError"></p>
      <button class="btn primary full" type="submit">Buat akun</button>
    </form>
  </div>
</div>

<!-- ============ BOOKING MODAL ============ -->
<div class="modal-backdrop" id="bookingModal" hidden>
  <div class="modal">
    <button class="modal-close" id="closeBooking" aria-label="Tutup">×</button>
    <h3 class="display sm" id="bookingDoctorName"></h3>
    <p class="panel-sub" id="bookingDoctorMeta"></p>
    <form class="modal-form" id="bookingForm">
      <label>Pilih jadwal
        <select id="bookingScheduleSelect" required></select>
      </label>
      <label>Tanggal kunjungan
        <input type="date" id="bookingDate" required />
      </label>
      <label>Catatan (opsional)
        <input type="text" id="bookingNotes" placeholder="Keluhan singkat…" />
      </label>
      <p class="form-error" id="bookingError"></p>
      <button class="btn primary full" type="submit">Konfirmasi booking</button>
    </form>
  </div>
</div>

<!-- ============ CART / PURCHASE MODAL ============ -->
<div class="modal-backdrop" id="cartModal" hidden>
  <div class="modal">
    <button class="modal-close" id="closeCart" aria-label="Tutup">×</button>
    <h3 class="display sm" id="cartMedName"></h3>
    <p class="panel-sub" id="cartMedMeta"></p>
    <div class="list" id="cartPharmacyList"></div>
    <form class="modal-form" id="cartForm" hidden>
      <label>Apotek terpilih<span id="cartSelectedPharmacy" class="mono-pill"></span></label>
      <label>Jumlah
        <input type="number" id="cartQty" min="1" value="1" required />
      </label>
      <p class="form-error" id="cartError"></p>
      <button class="btn primary full" type="submit">Beli sekarang</button>
    </form>
  </div>
</div>

<div class="toast" id="toast" hidden></div>

<script src="public/app.js"></script>
</body>
</html>
