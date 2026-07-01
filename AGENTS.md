<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Fammy — Agent Cheat Sheet

PWA todo & agenda untuk **dua orang** (pasangan). UI **Bahasa Indonesia**. Offline-first; **Google Sheets** = database production. Baca `README.md` untuk setup/deploy; baca `VERSION_LOG.md` untuk changelog.

**Versi aktif:** `src/lib/version.ts` → `APP_VERSION` (tampil di header sebagai capsule).

---

## Non-negotiables

- Jangan tambah database lain (Postgres, Firebase, dll.) — Sheets + Dexie offline cache saja.
- Jangan ubah model auth: Google OAuth + `ALLOWED_EMAILS` allowlist (maks. 2 email).
- Task mutations untuk client: **selalu** lewat `src/lib/sync/engine.ts` (`createTaskLocal`, `updateTaskLocal`, dll.), bukan fetch langsung ke API dari UI kecuali ada alasan kuat.
- UI copy untuk pengguna: **Bahasa Indonesia**.
- Minimize scope — ikuti pola file yang sudah ada; jangan over-engineer.

---

## Stack

| Layer | Teknologi |
|-------|-----------|
| App | Next.js 16, TypeScript, Tailwind, Radix/shadcn-style UI |
| Auth | Auth.js (Google) |
| Server DB | Google Sheets (service account) |
| Offline | Dexie (IndexedDB) + mutation queue |
| PWA / Push | Serwist + Web Push (VAPID) |
| Cron | Vercel Pro (`vercel.json`) |
| TZ | `APP_TIMEZONE` default `Asia/Jakarta` — digest, reminder, recurring |

---

## Struktur penting

```
src/
  app/(app)/          # Tab: today, agenda, all, settings (+ layout header Fammy + versi)
  components/
    app-shell.tsx     # Client tab shell — pushState, tanpa round-trip server
    pages/            # today-page, agenda-page, all-page, settings-page
    sync-provider.tsx # sync on mount, visibility, interval
  lib/
    sync/engine.ts    # enqueueMutation, syncAll (mutex), pull/push, clearLocalTaskData
    sync/fetch.ts     # fetchWithTimeout
    sync/db-timeout.ts# IndexedDB timeout + recoverDb
    sheets/client.ts  # getAllTasks, upsertTasks, deleteTasks, resetAllTasks
    tasks/filters.ts  # canViewTask, groupTasksByDate (To Do, Hari ini, Besok, Agenda, Selesai)
    recurring.ts      # advance parent, virtual calendar, buildAgendaDayTasks
    push/             # send, client, notify-shared-task
    version.ts        # APP_VERSION
  sw.ts               # Service worker + push handler
```

---

## Task & visibility

```ts
type: "todo" | "event"
visibility: "shared" | "private"   // shared = both see; private = createdBy only
assignee: "both" | userEmail      // shared → "both"; private → creator email
```

- **`canViewTask(task, userEmail)`** di `lib/tasks/filters.ts` — wajib dipakai server & client.
- Private task: `assignee = userEmail` on create; jangan expose ke pasangan.
- Shared push: notifikasi ke **pasangan saja**, bukan pembuat/completer (`lib/push/notify-shared-task.ts`), dipicu saat sync sukses.

---

## Offline sync

1. UI → `createTaskLocal` / `updateTaskLocal` → Dexie + `pendingMutations` → `syncAll()`.
2. `POST /api/sync` menerapkan mutations ke Sheet; response merge ke IndexedDB.
3. **`syncAll` punya mutex** — jangan spawn banyak sync paralel tanpa alasan.
4. **`resumeSync()`** on visibility/focus — abort sync stale, sync fresh.
5. IndexedDB macet (iOS background): `withDbRetry` + `recoverDb()` di `lib/db/index.ts`.
6. Jangan hapus task pending dari merge kecuali aturan `mergeServerTasks` — lindungi `pendingMutations`.

---

## Halaman & UX

| Tab | Perilaku |
|-----|----------|
| **Hari Ini** | Todo hari ini; filter Shared/Personal + badge; form tambah todo |
| **Agenda** | Kalender + list per hari; form tambah event; repeat & remindBefore di More Details |
| **Semua** | Semua task; grup **To Do** (tanpa tanggal), Hari ini, Besok, **Agenda** (mendatang), Selesai — **tanpa** form tambah |
| **Pengaturan** | Push toggle, tes push, reset semua tugas (modal), keluar di bawah |

- **Tidak ada** judul halaman besar (Hari Ini / Agenda / Semua) — hanya bottom nav + header `Fammy` + versi.
- Navigasi tab: `AppShell` + `history.pushState` — jangan full page navigation untuk ganti tab.
- Task: swipe complete/delete, tap → `TaskDetailDialog`.
- Capitalize judul: `useCapitalizedInput` — hanya huruf pertama, jangan rusak caret.

---

## Agenda berulang

- **Satu task induk** per series (`repeat !== "none"`, tanpa `recurrenceParentId`).
- **DB:** `processRecurringTasks` (cron hourly) majukan `dueDate` setelah waktu acara lewat — **jangan** buat instance harian baru di Sheet.
- **UI kalender:** `buildAgendaEventsByDate` — titik virtual di bulan yang ditampilkan.
- **UI list hari:** `buildAgendaDayTasks` — real + **Preview** (`isVirtualPreview` di `TaskItem`, read-only).
- `getNextDueDate` — daily/weekly/monthly/custom (`repeatInterval` hari untuk custom).
- Child lama (`recurrenceParentId`) — jangan tampilkan di agenda; parent saja.

---

## Push & cron

| Trigger | Route / lokasi |
|---------|----------------|
| Digest harian | `/api/cron/digest` — jam `digestHour` di Sheet settings |
| Event reminder | `/api/cron/reminders` — tiap menit, `remindBefore` + `dueTime` hari ini |
| Recurring advance | `/api/cron/recurring` — hourly |
| Todo cleanup >48h | `/api/cron/cleanup` — hourly, hanya `type: todo` + `done` |
| Shared create/complete | `notify-shared-task.ts` on sync |

- Cron butuh `Authorization: Bearer $CRON_SECRET`.
- iOS push: hanya PWA Home Screen; dokumentasikan di settings jika relevan.
- Cron `200` ≠ push terkirim — cek body response.

---

## Retensi & reset

- Todo done >48h: dihapus dari Sheet (bukan soft delete).
- Event/agenda: tetap disimpan meski done.
- Reset semua: `POST /api/tasks/reset` + `clearLocalTaskData()` — hapus seluruh tab tasks (kedua user).

---

## Versi & rilis

Skema **MAJOR.MINOR.PATCH**:

| Segmen | Naik ketika |
|--------|-------------|
| **MAJOR** | Breaking change / arsitektur besar |
| **MINOR** | Fitur baru |
| **PATCH** | Bugfix, polish UI, penyesuaian kecil |

File versi:

| File | Isi |
|------|-----|
| `src/lib/version.ts` | `APP_VERSION` — badge di header |
| `VERSION_LOG.md` | Changelog + link commit GitHub |
| `README.md` | Baris versi aktif di bagian atas |

Jangan commit/push kecuali user minta.

---

## Prompt: `git push` (WAJIB ikuti urutan ini)

Jika user mengetik **`git push`** atau **`git push main`**, anggap itu perintah **rilis + push**, bukan hanya `git push` kosong. Jalankan **semua langkah** berikut secara berurutan:

### 1. Audit perubahan

```bash
git status
git diff
git diff --cached
git log --oneline -10
```

Pahami semua perubahan yang belum di-commit / belum di-push sejak versi di `APP_VERSION`.

### 2. Tentukan versi baru

- Naikkan `APP_VERSION` di `src/lib/version.ts` sesuai tabel semver di atas.
- Jika **tidak ada** perubahan kode/docs untuk di-commit, jangan bump versi — cukup push jika branch sudah ahead.

### 3. Update `VERSION_LOG.md`

- Tambah entri **baru di paling atas** (format `[x.y.z] — YYYY-MM-DD`).
- Ringkas perubahan dalam bahasa Indonesia atau Inggris konsisten dengan entri lama.
- Sebut file/area utama yang berubah.
- Setelah commit dibuat, tambahkan link commit: `https://github.com/kemonn98/fammy/commit/<hash>` (hash dari commit rilis itu).
- Update baris `Versi aktif aplikasi` di VERSION_LOG agar cocok dengan `APP_VERSION`.

### 4. Update `README.md`

- Baris **Versi saat ini** di bagian atas → nomor baru.
- Sesuaikan bagian **Fitur** / **Versioning** hanya jika ada perubahan produk yang perlu didokumentasikan.

### 5. Commit

- Stage semua perubahan termasuk `version.ts`, `VERSION_LOG.md`, `README.md`.
- Commit message ringkas (fokus *why*), contoh: `release: v1.8.1 …` atau `feat: …` jika belum ada bump versi terpisah.
- Ikuti user git safety rules (no amend kecuali aturan user mengizinkan).

### 6. Push

```bash
git push origin main
```

- Konfirmasi sukses ke user: commit hash, versi baru, URL repo jika relevan.

### Yang TIDAK boleh dilakukan pada prompt `git push`

- Langsung `git push` tanpa cek `VERSION_LOG` / `README` / `version.ts`.
- Bump versi tanpa entri changelog.
- Push tanpa commit perubahan yang masih unstaged (kecuali user explicitly hanya minta push branch yang sudah bersih).

---

## Saat menambah fitur

1. Baca kode sekitar target — match naming, imports, pola client/server.
2. Server mutations → Sheets via `lib/sheets/client.ts`; cek auth + `canViewTask`.
3. Client list → `useTasks()` + Dexie live query; jangan bypass sync engine.
4. Notifikasi baru → pertimbangkan: siapa penerima? pasangan saja atau semua?
5. Jangan edit `AGENTS.md` / `README.md` kecuali diminta — **kecuali** user mengetik `git push` (lihat workflow di atas).

---

## Referensi cepat

- Env: `.env.example`, `README.md` setup
- Sheet tabs: `tasks`, `push_subscriptions`, `settings`
- Tanggal: `YYYY-MM-DD`, waktu: `HH:mm`
- Partner email: `getPartnerEmail()` dari `ALLOWED_EMAILS`
