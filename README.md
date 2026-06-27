# Fammy

PWA minimalis untuk todo & agenda pasangan. Bahasa Indonesia, offline-first, Google Sheets sebagai database.

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
npx tsx scripts/generate-vapid.ts
```

### 3. Init Sheet

```bash
npm install
npx tsx scripts/setup-sheet.ts
node scripts/generate-icons.mjs
```

### 4. Development

```bash
npm run dev
```

Buka http://localhost:3000

### 5. Deploy Vercel Pro

1. Push ke GitHub, import di Vercel
2. Set semua env vars dari `.env.example`
3. Deploy — cron jobs terdaftar otomatis dari `vercel.json`
4. Update OAuth redirect URI ke domain production

## iOS Push Notifications

1. Buka Fammy di Safari
2. Tap Share → **Tambah ke Layar Utama**
3. Buka app dari icon Home Screen
4. Tap **Aktifkan notifikasi**

## Google Sheet Manual Edit

Jangan hapus baris — set kolom `deleted` ke `true` untuk soft delete. Jangan ubah kolom `id`. Format tanggal: `YYYY-MM-DD`, waktu: `HH:mm`.

## Cron Jobs

| Path | Schedule | Fungsi |
|------|----------|--------|
| `/api/cron/digest` | 07:00 daily | Ringkasan todo & agenda |
| `/api/cron/reminders` | Every minute | Reminder event tepat waktu |
| `/api/cron/recurring` | 00:00 daily | Generate recurring tasks |

Vercel cron mengirim header `Authorization: Bearer $CRON_SECRET` — sudah diverifikasi di setiap route.
