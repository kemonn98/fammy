# Fammy

PWA minimalis untuk todo & agenda pasangan. Bahasa Indonesia, offline-first, Google Sheets sebagai database.

**Versi saat ini:** `1.8.0` (badge di header app) — riwayat lengkap di [VERSION_LOG.md](./VERSION_LOG.md).

## Fitur

- **Hari Ini** — todo dengan filter Shared / Personal (badge jumlah per tab) + form tambah tugas
- **Agenda** — kalender event, visibility, pengulangan & pengingat diatur saat buat agenda
- **Semua** — semua task yang boleh kamu lihat, dikelompokkan: **To Do**, Hari ini, Besok, **Agenda**, Selesai
- **Pengaturan** (ikon gear) — push notifikasi, tes notifikasi, reset data, keluar
- Task **Shared** terlihat berdua; task **Personal** hanya terlihat pembuatnya
- Offline-first (IndexedDB + sync queue), swipe selesai/hapus, tap task untuk detail
- Sync tahan resume dari background (mutex, timeout jaringan, recovery IndexedDB)

Navigasi antar tab lewat **bottom nav** + **client shell** — pindah tab instan tanpa server round-trip. UI tanpa judul halaman besar; nama tab cukup di navigasi bawah.

### Agenda berulang

- Kalender menampilkan **titik indikator virtual** di tanggal mendatang sesuai pola repeat (harian / mingguan / bulanan / custom) — preview UI, bukan baris terpisah di database
- Di database, task induk **maju ke tanggal berikutnya** setelah waktu acara lewat (cron hourly)
- Daftar agenda di bawah kalender: task **real** + occurrence mendatang sebagai **Preview** (read-only, belum di database)

### Retensi data

- Todo selesai (>48 jam) dihapus otomatis dari Sheet (shared & personal)
- Agenda/event tetap disimpan meskipun sudah selesai
- **Hapus semua tugas** di Pengaturan → Data — reset permanen seluruh todo & agenda (kamu + pasangan), tidak bisa dipulihkan

## Notifikasi (Web Push)

Butuh iOS 16.4+ dan app di-install ke **Home Screen** (bukan tab Safari). Aktifkan lewat **Pengaturan** → toggle *Push notifikasi*.

| Jenis | Kapan | Siapa dapat |
|-------|-------|-------------|
| Ringkasan harian | Jam `digestHour` (zona `APP_TIMEZONE`) | Semua yang subscribe |
| Pengingat event | `remindBefore` menit sebelum `dueTime` (default 30 menit) | Subscriber yang berhak lihat event |
| Task/event shared baru | Saat pasangan membuat task **Shared** | **Pasangan saja** (bukan pembuat) |
| Task/event shared selesai | Saat pasangan menandai **Shared** selesai | **Pasangan saja** (bukan yang menyelesaikan) |

Saat buat agenda, atur **Pengingat** di *More Details* (butuh jam acara agar push terkirim). Tes notifikasi instan tersedia di Pengaturan. Cek tab `push_subscriptions` di Sheet untuk memastikan device terdaftar.

## Stack

- Next.js 16 + TypeScript + Tailwind
- Auth.js (Google OAuth, email allowlist)
- Google Sheets API (service account)
- Dexie (IndexedDB offline cache)
- Serwist (PWA + push)
- Vercel Pro (cron jobs)

## Setup

### 1. Google Cloud

1. Buat project di [Google Cloud Console](https://console.cloud.google.com)
2. Enable **Google Sheets API**
3. Buat **OAuth 2.0 Client ID** (Web) untuk login user
   - Authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
   - Production: `https://your-domain.vercel.app/api/auth/callback/google`
4. Buat **Service Account**, download JSON key
5. Buat Google Sheet kosong, share ke email service account (Editor)

### 2. Environment

```bash
cp .env.example .env.local
```

Isi semua variabel. Generate secrets:

```bash
openssl rand -base64 32   # AUTH_SECRET
openssl rand -hex 32      # CRON_SECRET
npm run generate:vapid
```

| Variabel | Keterangan |
|----------|------------|
| `ALLOWED_EMAILS` | Email pasangan, dipisah koma (maks. 2 akun) |
| `GOOGLE_SHEET_ID` | ID dari URL Google Sheet |
| `VAPID_*` | Web Push keys |
| `CRON_SECRET` | Proteksi endpoint cron |
| `APP_TIMEZONE` | Opsional, default `Asia/Jakarta` — zona waktu digest, reminder & recurring |

### 3. Init Sheet

```bash
npm install
npm run setup:sheet
```

Membuat tab: `tasks`, `push_subscriptions`, `settings`.

### 4. Development

```bash
npm run dev
```

Buka http://localhost:3000

### 5. Deploy Vercel Pro

1. Push ke GitHub, import di Vercel
2. Set semua env vars (termasuk `CRON_SECRET`, `VAPID_*`, `APP_TIMEZONE`)
3. Deploy — cron jobs terdaftar otomatis dari `vercel.json`
4. Update OAuth redirect URI ke domain production

## iOS Push Notifications

1. Buka Fammy di Safari
2. Tap Share → **Tambah ke Layar Utama**
3. Buka app dari icon Home Screen (bukan tab Safari)
4. Tap ikon **gear** → aktifkan **Push notifikasi**
5. Opsional: tap **Kirim** di *Tes notifikasi* untuk verifikasi

Push tidak jalan di Safari biasa — hanya dari PWA yang sudah di-install. Jika notifikasi diblokir, buka iPhone **Settings → Fammy → Notifications**.

## Google Sheet

### Tab

| Tab | Isi |
|-----|-----|
| `tasks` | Semua todo & agenda |
| `push_subscriptions` | Device yang subscribe push |
| `settings` | Konfigurasi app (`digestHour`, `digestMinute`, dll.) |

### Kolom task (penting)

| Kolom | Nilai |
|-------|-------|
| `type` | `todo` atau `event` |
| `visibility` | `shared` atau `private` |
| `repeat` | `none`, `daily`, `weekly`, `monthly`, `custom` |
| `repeatInterval` | Hari (hanya untuk `custom`, mis. 14) |
| `remindBefore` | Menit sebelum `dueTime` (event, default 30) |
| `dueDate` / `dueTime` | `YYYY-MM-DD` / `HH:mm` |

### Manual edit

- Jangan ubah kolom `id`
- Hapus lewat app akan **menghapus baris** dari Sheet. Untuk edit manual, lebih aman set `deleted` ke `true` daripada menghapus baris.

### Settings (opsional)

Di tab `settings`, tambah baris:

| key | value | Keterangan |
|-----|-------|------------|
| `digestHour` | `7` | Jam ringkasan harian (zona `APP_TIMEZONE`) |
| `digestMinute` | `0` | Menit ringkasan harian |

## Cron Jobs

Semua jadwal event/reminder/recurring dihitung dalam zona `APP_TIMEZONE` (default WIB).

| Path | Schedule (UTC) | Fungsi |
|------|----------------|--------|
| `/api/cron/digest` | Setiap jam (`0 * * * *`) | Kirim ringkasan saat jam = `digestHour` |
| `/api/cron/reminders` | Setiap menit | Pengingat event (`remindBefore` menit sebelum `dueTime`) |
| `/api/cron/recurring` | Setiap jam (`0 * * * *`) | Majukan agenda berulang setelah waktu acara lewat |
| `/api/cron/cleanup` | Setiap jam (`0 * * * *`) | Hapus todo selesai (>48 jam) dari Sheet |

Vercel cron mengirim header `Authorization: Bearer $CRON_SECRET` — diverifikasi di setiap route.

**Catatan:** Cron tiap menit butuh **Vercel Pro**. Log `200` tidak berarti push terkirim — cek response body (`notified`, `skipped`, dll.) dan pastikan ada subscription di Sheet. Notifikasi task shared (buat/selesai) dikirim langsung saat sync, bukan lewat cron.

## Versioning

| File | Peran |
|------|--------|
| [`VERSION_LOG.md`](./VERSION_LOG.md) | Changelog per release + link commit GitHub |
| [`src/lib/version.ts`](./src/lib/version.ts) | Nomor versi aktif (`APP_VERSION`) — ditampilkan di header |

Skema **MAJOR.MINOR.PATCH**: major = perubahan besar; minor = fitur baru; patch = bugfix / polish UI.

Setelah rilis baru: update `APP_VERSION`, tambah entri di `VERSION_LOG.md`, commit & push.

## Scripts

```bash
npm run dev            # Development
npm run build          # Production build (+ generate icons)
npm run setup:sheet    # Init tab Google Sheet
npm run generate:vapid # Generate VAPID keys untuk push
```
