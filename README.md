# CryptoStake Frontend

Website staking statis yang siap digunakan dengan frontend di GitHub dan deploy di Vercel. Backend database menggunakan Supabase.

## Apa yang disertakan

- Halaman login dan registrasi Supabase
- Dashboard pengguna dengan saldo, staking, deposit, dan withdraw
- Logika stake sederhana 200% ROI dalam 60 hari
- Admin panel untuk menyetujui deposit
- Static site siap deploy di Vercel

## Setup Supabase

1. Buat project baru di Supabase.
2. Buka `SQL Editor` dan jalankan script berikut untuk membuat tabel:

```sql
create table users (
  id uuid primary key,
  email text,
  username text,
  balance numeric default 0,
  role text default 'user'
);

create table settings (
  id serial primary key,
  admin_wallet text
);

create table deposits (
  id serial primary key,
  user_id uuid references users(id),
  deposit_amount numeric,
  txid text,
  status text default 'pending',
  created_at timestamp with time zone default timezone('utc', now())
);

create table withdraw (
  id serial primary key,
  user_id uuid references users(id),
  amount numeric,
  wallet text,
  status text default 'pending',
  created_at timestamp with time zone default timezone('utc', now())
);

create table staking (
  id serial primary key,
  user_id uuid references users(id),
  stake_amount numeric,
  start_time timestamp with time zone,
  end_time timestamp with time zone,
  status text default 'active',
  total_reward numeric,
  created_at timestamp with time zone default timezone('utc', now())
);
```

3. Isi data `settings` satu baris dengan alamat wallet TRC20 platform.

## Konfigurasi Frontend

1. Salin `config.example.js` menjadi `config.js` di folder `crypto-stake`.
2. Isi `config.js` dengan nilai Supabase Anda.
   - `window.SUPABASE_URL`
   - `window.SUPABASE_ANON_KEY`
   - `window.SUPABASE_DB_URL` (hanya untuk referensi server-side)
3. Jika ingin membuat akun admin, tambahkan nilai `role = 'admin'` di tabel `users` untuk user tertentu.

## Deploy ke GitHub dan Vercel

1. Buka terminal di folder `crypto-stake`.
2. Inisialisasi Git jika belum ada:

```bash
git init
git add .
git commit -m "Initial CryptoStake frontend"
```

3. Buat repository GitHub baru, lalu tambahkan remote dan push:

```bash
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

4. Buka Vercel, pilih `New Project`, dan sambungkan ke repository GitHub Anda.
   - Pilih repository yang sudah Anda push.
   - Set `Root Directory` ke `.` pada pengaturan project.
   - Pastikan build dan output menggunakan opsi static (default `@vercel/static`).

5. Untuk deployment otomatis dari GitHub, buat secret GitHub berikut di repo Anda:
   - `VERCEL_TOKEN`
   - `VERCEL_ORG_ID`
   - `VERCEL_PROJECT_ID`

6. File workflow GitHub Actions sudah disiapkan di `.github/workflows/vercel-deploy.yml`.
   Setiap push ke cabang `main` akan memicu deploy otomatis ke Vercel.

## Setup Otomatis

Jika Git sudah terpasang, jalankan `setup.ps1` di folder `crypto-stake`:

```powershell
cd C:\Users\TEMP\Documents\crypto-stake
.\setup.ps1
```

Skrip ini akan:
- menginisialisasi Git repository
- membuat commit awal
- bila GitHub CLI tersedia, membuat repo dan melakukan push

> Karena ini adalah static frontend, Vercel akan langsung melayani `index.html`.
## Koneksi Supabase

- Pastikan Anda sudah membuat project di Supabase.
- Salin `config.example.js` menjadi `config.js` dan isi nilai publik berikut:
  - `window.SUPABASE_URL`
  - `window.SUPABASE_ANON_KEY`
- Jangan commit `config.js` ke repo publik karena berisi informasi rahasia.
- `SUPABASE_DB_URL` hanya untuk tool atau server-side, bukan untuk frontend.
- Setelah deploy, Supabase akan melayani autentikasi dan data pengguna.

## Connection string dan akses database

Untuk akses database secara server-side gunakan:

```text
postgresql://postgres:[YOUR-PASSWORD]@db.lbuwtpcopufsdkmrizbn.supabase.co:5432/postgres
```

Catatan:
- `postgresql://...` bukan untuk dipakai di frontend.
- `.env` atau secret service-role harus digunakan untuk akses database server-side.

## Agent Skills Supabase (opsional)

Jika ingin menambah Agent Skills di lokal, jalankan:

```bash
npx skills add supabase/agent-skills
```

Ini berguna untuk environment pengembangan, tetapi tidak wajib untuk deploy situs statis.

## Catatan

- Anon key Supabase adalah public dan digunakan di client-side.
- Pastikan aturan Row Level Security dan permissions di Supabase disesuaikan bila Anda ingin produksi.
- Anda dapat mengembangkan UI lebih lanjut dengan React, Next.js, atau framework lain jika ingin fitur lebih kompleks.
