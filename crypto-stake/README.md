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

1. Buka `app.js` dan ganti:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`

2. Jika ingin membuat akun admin, tambahkan nilai `role = 'admin'` di tabel `users` untuk user tertentu.

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
- Di `app.js`, atur `SUPABASE_URL` dan `SUPABASE_ANON_KEY` sesuai project Anda.
- Setelah deploy, Supabase akan melayani autentikasi dan data pengguna.
## Catatan

- Anon key Supabase adalah public dan digunakan di client-side.
- Pastikan aturan Row Level Security dan permissions di Supabase disesuaikan bila Anda ingin produksi.
- Anda dapat mengembangkan UI lebih lanjut dengan React, Next.js, atau framework lain jika ingin fitur lebih kompleks.
