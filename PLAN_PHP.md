# Plan: Convert MediKita to PHP + MySQL (XAMPP)

## Context
The app is currently Express + PostgreSQL, which cannot run on XAMPP (Windows) because XAMPP provides **MySQL/MariaDB + PHP with pdo_mysql** and has **no PostgreSQL**. The user wants everything converted to `.php` so it can be opened at `http://localhost/medikita/`.

## Target structure (under C:\xampp\htdocs\medikita\)
```
medikita/
├── index.php                 (was public/index.html — full SPA shell)
├── app.js                    (frontend logic, adjusted for PHP API + sessions)
├── styles.css                (unchanged)
├── config.php                (DB + session bootstrap; shared include)
├── api/
│   ├── bootstrap.php         (JSON header, session start, db conn, helpers)
│   ├── auth.php              (?action=login|register|me|logout)
│   ├── doctors.php           (GET list + GET schedules)
│   ├── clinics.php
│   ├── bookings.php          (POST create, GET me, PATCH cancel)
│   ├── medicines.php         (GET list, categories, stock; admin CRUD)
│   ├── pharmacies.php
│   └── transactions.php      (POST create, GET me)
├── seed_mysql.sql            (MySQL schema + sample data, mirrors seed.sql)
└── (keep server/, database/ as original reference)
```

## Steps
1. **config.php** — DB connection (pdo_mysql to `medikita` db), `session_start()`, JSON helper, `send_json()`, `require_login()`, `require_admin()`, `get_user()`.
2. **MySQL schema** (`seed_mysql.sql`) — convert PostgreSQL DDL to MySQL:
   - `BIGSERIAL` → `BIGINT AUTO_INCREMENT`, `TIMESTAMPTZ` → `DATETIME`,
   - drop PostgreSQL-only: `FILTER (WHERE ...)`, `jsonb_agg`, `GENERATED ALWAYS AS STORED` (compute subtotal in PHP), `ON CONFLICT` (use INSERT...ON DUPLICATE), `ILIKE` → `LIKE` with `LOWER()`.
   - Keep all tables, FKs, constraints, indexes.
   - Insert same seed data (users w/ bcrypt password `password123`, clinics, doctors, schedules, bookings, medicines, pharmacies, stock, transactions).
3. **API endpoints** (PHP) — faithfully port each Express route:
   - doctors: list with clinic aggregation (use GROUP_CONCAT + JSON in PHP), schedules.
   - medicines: list (min price, total stock via GROUP BY), categories, stock, admin CRUD.
   - auth: register/login (password_hash/verify), me, logout. Session-based.
   - bookings: create (validate day_of_week), me, cancel.
   - transactions: create (lock via SELECT ... FOR UPDATE → in MySQL use transaction + row lock), me with items.
   - clinics, pharmacies (catalog).
4. **index.php** — rename from index.html; same markup; set base path so API calls hit `api/*.php`.
5. **app.js** — change `API` base to relative `api/`, replace JWT bearer auth with session cookies (no Authorization header; rely on session). Adjust auth flows: login/register call `auth.php?action=...`; `state.token` replaced by `state.user` from `auth.php?action=me` on load. Keep seed fallback removed (real DB now). Keep all UI rendering unchanged.
6. **Seed & run** — provide `seed_mysql.sql` to import via phpMyAdmin or mysql CLI; document steps.

## Verification
- Import seed_mysql.sql into MySQL, place files in htdocs/medikita, start Apache.
- Open http://localhost/medikita/ → tab "Cari Dokter" shows 5 doctors from DB.
- Login as siti.amelia@example.com / password123 → booking + history work.
- Run `php -l` on each .php file for syntax check.
