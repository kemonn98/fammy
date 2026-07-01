# Fammy — Version Log

Riwayat versi berdasarkan commit di [GitHub `kemonn98/fammy`](https://github.com/kemonn98/fammy).

Format: **MAJOR.MINOR.PATCH**

| Segmen | Kapan naik |
|--------|------------|
| **MAJOR** | Perubahan besar / arsitektur / breaking change |
| **MINOR** | Fitur baru |
| **PATCH** | Perbaikan bug, polish UI, penyesuaian kecil |

Versi aktif aplikasi: **`1.9.0`** (`src/lib/version.ts`)

---

## [1.9.0] — 2026-07-01

**MINOR** — [`3ac80f9`](https://github.com/kemonn98/fammy/commit/3ac80f9)

- Translate all user-facing copy from Indonesian to English (nav, forms, dialogs, settings, login, errors, push)
- Switch `date-fns` locale to `enUS`; set `lang="en"` on root HTML
- Add `src/lib/tasks/labels.ts` for English category & repeat labels (sheet slugs unchanged)
- Update `README.md` and `AGENTS.md` for English UI

---

## [1.8.1] — 2026-07-01

**PATCH** — [`5085b76`](https://github.com/kemonn98/fammy/commit/5085b76)

- `AGENTS.md` — cheat sheet arsitektur Fammy (sync, push, recurring, UX, cron)
- Workflow wajib saat prompt `git push`: bump versi → VERSION_LOG → README → commit → push

---

## [1.8.0] — 2026-07-01

**UI cleanup** — [`6b21c93`](https://github.com/kemonn98/fammy/commit/6b21c93)

- Hapus judul halaman Hari Ini, Agenda, dan Semua (navigasi bawah tetap)
- Grup Semua: "Tanpa tanggal" → **To Do**, "Mendatang" → **Agenda**
- Hapus form tambah tugas di halaman Semua
- Tambah version log & badge versi di header

---

## [1.7.2] — 2026-07-01

**PATCH** — [`0a3da1c`](https://github.com/kemonn98/fammy/commit/0a3da1c)

- Penyesuaian teks notifikasi push shared task

---

## [1.7.1] — 2026-07-01

**MINOR** — [`14657a9`](https://github.com/kemonn98/fammy/commit/14657a9)

- Preview task berulang di daftar agenda (tanggal virtual, badge Preview)

---

## [1.7.0] — 2026-07-01

**MINOR** — [`b5aac26`](https://github.com/kemonn98/fammy/commit/b5aac26)

- Sync tahan resume dari background (mutex, timeout fetch, recovery IndexedDB)
- Pengingat agenda (`remindBefore`, default 30 menit)
- Perbaikan agenda berulang + indikator virtual di kalender
- Cron hapus todo selesai >48 jam
- Reset semua tugas di Pengaturan (modal konfirmasi)
- Pembaruan README

---

## [1.6.0] — 2026-06-29 — 2026-06-30

**MINOR**

| Commit | Perubahan |
|--------|-----------|
| [`7e97739`](https://github.com/kemonn98/fammy/commit/7e97739) | Notifikasi ke pasangan saat task shared dibuat |
| [`c033c8e`](https://github.com/kemonn98/fammy/commit/c033c8e) | Sederhanakan teks notifikasi shared task |
| [`6ed1dec`](https://github.com/kemonn98/fammy/commit/6ed1dec) | Notifikasi ke pasangan saat task shared diselesaikan |

---

## [1.5.0] — 2026-06-29

**MINOR**

| Commit | Perubahan |
|--------|-----------|
| [`4eaa0cd`](https://github.com/kemonn98/fammy/commit/4eaa0cd) | Perbaikan push notifications + tes push |
| [`83aa858`](https://github.com/kemonn98/fammy/commit/83aa858) | Halaman Pengaturan: toggle notifikasi, tes, keluar |

---

## [1.4.1] — 2026-06-29

**PATCH**

| Commit | Perubahan |
|--------|-----------|
| [`ddf3e2b`](https://github.com/kemonn98/fammy/commit/ddf3e2b) | Auto-capitalize judul tanpa loncat kursor |
| [`79bc870`](https://github.com/kemonn98/fammy/commit/79bc870) | Capitalize hanya karakter baru |
| [`5204f5b`](https://github.com/kemonn98/fammy/commit/5204f5b) | Capitalize huruf pertama saja, bukan tiap kata |

---

## [1.4.0] — 2026-06-29

**MINOR**

| Commit | Perubahan |
|--------|-----------|
| [`57dfbed`](https://github.com/kemonn98/fammy/commit/57dfbed) | Swipe threshold lebih panjang + fade hapus |
| [`75d064a`](https://github.com/kemonn98/fammy/commit/75d064a) | Client tab shell (navigasi instan) + UX task |
| [`4f3e03f`](https://github.com/kemonn98/fammy/commit/4f3e03f) | Dialog detail task saat tap |

---

## [1.3.2] — 2026-06-28

**PATCH** — [`ef42a93`](https://github.com/kemonn98/fammy/commit/ef42a93)

- Task private hanya terlihat oleh pembuatnya

---

## [1.3.1] — 2026-06-28

**PATCH** — [`6c0d485`](https://github.com/kemonn98/fammy/commit/6c0d485)

- Cron digest & reminder memakai timezone app (`Asia/Jakarta`)

---

## [1.3.0] — 2026-06-28

**MINOR** — [`8034778`](https://github.com/kemonn98/fammy/commit/8034778)

- Halaman Semua menampilkan semua task + gaya tab aktif

---

## [1.2.0] — 2026-06-28

**MINOR**

| Commit | Perubahan |
|--------|-----------|
| [`0ef18fb`](https://github.com/kemonn98/fammy/commit/0ef18fb) | Form tambah task di bottom dock |
| [`4d4b839`](https://github.com/kemonn98/fammy/commit/4d4b839) | Inline add-task, filter Personal/Shared, hard delete |
| [`9bef26f`](https://github.com/kemonn98/fammy/commit/9bef26f) | Perbaikan UX add-task & Google Sheet write |

---

## [1.1.0] — 2026-06-28

**MINOR**

| Commit | Perubahan |
|--------|-----------|
| [`55fc925`](https://github.com/kemonn98/fammy/commit/55fc925) | Major UI/UX updates |
| [`ea887ca`](https://github.com/kemonn98/fammy/commit/ea887ca) | Interaction updates |
| [`eb04daa`](https://github.com/kemonn98/fammy/commit/eb04daa) | Theme update |

---

## [1.0.0] — 2026-06-28

**MAJOR** — [`56a7c05`](https://github.com/kemonn98/fammy/commit/56a7c05)

Rilis awal Fammy PWA:

- Next.js, Auth.js Google OAuth, allowlist email pasangan
- Google Sheets sebagai database
- Offline-first (Dexie + sync queue)
- Tab Hari Ini / Agenda / Semua
- Task shared & personal, swipe, PWA (Serwist)
- Web Push + cron (digest, reminder, recurring)
- Deploy Vercel

---

## Cara update versi

1. Tentukan segmen yang naik (major / minor / patch) sesuai tabel di atas
2. Update `APP_VERSION` di `src/lib/version.ts`
3. Tambah entri baru di bagian atas file ini dengan commit GitHub terkait
4. Commit & push

```bash
git log --oneline -10   # lihat commit terbaru
```
