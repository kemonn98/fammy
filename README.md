# Fammy

PWA minimalis untuk todo & agenda pasangan. Bahasa Indonesia, offline-first, Google Sheets sebagai database.

## Fitur

- **Hari Ini** — todo hari ini dengan filter Shared / Personal (badge jumlah per tab)
- **Agenda** — kalender event, visibility diatur saat buat agenda
- **Semua** — semua task yang boleh kamu lihat (tanpa filter tab)
- Task **Shared** terlihat berdua; task **Personal** hanya terlihat pembuatnya
- Offline-first (IndexedDB + sync queue), swipe selesai/hapus, tap task untuk detail
- Web Push: ringkasan harian + pengingat event (iOS 16.4+, harus Add to Home Screen)

Navigasi antar tab utama pakai **client shell** — pindah tab instan tanpa menunggu server round-trip.

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
| `APP_TIMEZONE` | Opsional, default `Asia/Jakarta` — zona waktu digest & reminder |

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
4. Tap **Aktifkan notifikasi**

Push tidak jalan di Safari biasa — hanya dari PWA yang sudah di-install. Cek tab `push_subscriptions` di Sheet untuk memastikan device terdaftar.

## Google Sheet

### Tab

| Tab | Isi |
|-----|-----|
| `tasks` | Semua todo & agenda |
| `push_subscriptions` | Device yang subscribe push |
| `settings` | Konfigurasi app (`digestHour`, `digestMinute`, dll.) |

### Manual edit

- Jangan ubah kolom `id`
- Format tanggal: `YYYY-MM-DD`, waktu: `HH:mm`
- `visibility`: `shared` atau `private`
- `type`: `todo` atau `event`
- Hapus lewat app akan **menghapus baris** dari Sheet. Untuk edit manual, lebih aman set `deleted` ke `true` daripada menghapus baris.

### Settings (opsional)

Di tab `settings`, tambah baris:

| key | value | Keterangan |
|-----|-------|------------|
| `digestHour` | `7` | Jam ringkasan harian (zona `APP_TIMEZONE`) |
| `digestMinute` | `0` | Menit ringkasan harian |

## Cron Jobs

Semua jadwal dihitung dalam zona `APP_TIMEZONE` (default WIB).

| Path | Schedule (UTC) | Fungsi |
|------|----------------|--------|
| `/api/cron/digest` | Setiap jam (`0 * * * *`) | Kirim ringkasan saat jam = `digestHour` |
| `/api/cron/reminders` | Setiap menit | Pengingat event (`remindBefore` menit sebelum `dueTime`) |
| `/api/cron/recurring` | 00:00 UTC harian | Generate instance task berulang |

Vercel cron mengirim header `Authorization: Bearer $CRON_SECRET` — diverifikasi di setiap route.

**Catatan:** Cron tiap menit butuh **Vercel Pro**. Log `200` tidak berarti push terkirim — cek response body (`notified`, `skipped`, dll.) dan pastikan ada subscription di Sheet.

## Scripts

```bash
npm run dev            # Development
npm run build          # Production build (+ generate icons)
npm run setup:sheet    # Init tab Google Sheet
npm run generate:vapid # Generate VAPID keys untuk push
```
