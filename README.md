# Tales Hero Indonesia

Website resmi **Tales Hero Indonesia**, game online action-adventure. Project ini menyediakan landing page game, registrasi hero, login akun, pemulihan akun, informasi akun pemain, berita, panduan item, redeem code, dan beberapa tool administrasi.

## Daftar Isi

- [Fitur Utama](#fitur-utama)
- [Teknologi](#teknologi)
- [Persyaratan](#persyaratan)
- [Menjalankan Project](#menjalankan-project)
- [Environment Variables](#environment-variables)
- [Struktur Project](#struktur-project)
- [Alur Registrasi](#alur-registrasi)
- [Endpoint Utama](#endpoint-utama)
- [Build dan Production](#build-dan-production)
- [Deploy ke Cloudflare Pages](#deploy-ke-cloudflare-pages)
- [Catatan Keamanan](#catatan-keamanan)
- [Troubleshooting](#troubleshooting)

## Fitur Utama

### Untuk pemain

- Landing page dengan hero banner, pengenalan game, karakter, berita, download, dan support.
- Registrasi akun Tales Hero dengan validasi form, email verification, dan Cloudflare Turnstile.
- Login menggunakan akun game.
- Session login berbasis cookie `HttpOnly`.
- Melihat informasi akun dan profil pemain.
- Mengubah password dan nickname.
- Pemulihan akun melalui email:
  - Reset password dengan link.
  - Mengirim informasi akun ke email yang terdaftar.
  - Mengirim security question melalui email.
- Daftar pemain online, statistik, leaderboard, dan katalog item.
- Redeem code.
- Halaman panduan game dan item.

### Untuk admin

- Login admin terpisah.
- Kelola berita/news.
- Kelola file download.
- Kelola redeem code.
- Kelola pengaturan career dan posisi yang tersedia.
- Melihat log perubahan nickname.

## Teknologi

- **Runtime:** Node.js 20+
- **Package manager:** pnpm 10
- **Frontend:** React 19, TypeScript, Vite 7
- **Routing:** wouter
- **Styling:** Sass/SCSS dan CSS
- **Backend:** Express untuk production, Vite middleware saat development
- **Database game:** MySQL melalui `mysql2`
- **Database berita/admin:** MongoDB melalui Mongoose
- **Email:** Resend
- **Proteksi bot:** Cloudflare Turnstile
- **Deploy:** Railway atau Cloudflare Pages, tergantung kebutuhan endpoint

## Persyaratan

Pastikan sudah terpasang:

- Node.js versi 20 atau lebih baru
- pnpm versi 10
- Akses ke database MySQL game untuk fitur akun
- MongoDB untuk persistence berita/admin
- Akun Resend untuk email verifikasi dan pemulihan akun
- Site key dan secret key Cloudflare Turnstile untuk registrasi

## Menjalankan Project

### 1. Install dependency

```bash
pnpm install
```

### 2. Atur environment variables

Isi secret yang diperlukan sesuai bagian [Environment Variables](#environment-variables). Jangan commit nilai secret ke repository.

### 3. Jalankan development server

```bash
pnpm run dev
```

Server berjalan pada port dari environment variable `PORT`. Di Replit, workflow yang digunakan adalah:

```bash
PORT=5000 BASE_PATH=/ pnpm --include-workspace-root --filter @workspace/taleshero run dev
```

### 4. Pemeriksaan TypeScript

```bash
pnpm run typecheck
```

## Environment Variables

### Wajib untuk koneksi database game

| Variable | Keterangan |
| --- | --- |
| `DB_HOST` | Host MySQL database game |
| `DB_PORT` | Port MySQL, biasanya `3306` |
| `DB_USER` | Username MySQL |
| `DB_PASSWORD` | Password MySQL |
| `DB_NAME` | Nama database, biasanya `tr_game_db` |

Database game harus menyediakan tabel utama `userinfofrompublisher`. Tabel `userinfo`, `userinfogame`, dan `userinfologin` dibuat atau dilengkapi oleh game server sesuai alur login game.

### Wajib untuk fitur email dan registrasi

| Variable | Keterangan |
| --- | --- |
| `RESEND_API_KEY` | API key Resend untuk mengirim email |
| `TURNSTILE_SITE_KEY` | Site key Cloudflare Turnstile yang digunakan frontend |
| `TURNSTILE_SECRET_KEY` | Secret key Turnstile untuk verifikasi server-side |

### Wajib untuk session production

| Variable | Keterangan |
| --- | --- |
| `SESSION_SECRET` | Secret acak untuk menandatangani atau mengamankan session |

### Opsional

| Variable | Keterangan |
| --- | --- |
| `MONGODB_URI` | Connection string MongoDB untuk berita dan data admin |
| `APP_BASE_URL` | Domain yang digunakan dalam link email; default `https://taleshero.web.id` |
| `PORT` | Port server; default mengikuti environment Replit/workflow |
| `BASE_PATH` | Prefix dasar aplikasi; biasanya `/` |
| `CORS_ORIGINS` | Daftar origin yang diizinkan jika membutuhkan konfigurasi CORS |
| `NODE_ENV` | Environment aplikasi, misalnya `development` atau `production` |

Email hanya diinisialisasi saat benar-benar digunakan, sehingga project tetap dapat start untuk development ketika `RESEND_API_KEY` belum tersedia. Fitur yang membutuhkan email tetap tidak dapat digunakan sebelum secret tersebut diisi.

## Struktur Project

```text
.
├── client/
│   └── src/
│       ├── Components/       # Komponen UI reusable
│       ├── Context/          # Context React, termasuk auth
│       ├── Hooks/            # Custom hooks
│       ├── Pages/            # Halaman dan route frontend
│       └── Style/            # Style SCSS/CSS
├── public/                   # Asset statis, gambar, suara, robots.txt
├── server/
│   ├── auth/                 # Register, login, session, recovery, profile
│   ├── models/               # Model MongoDB
│   ├── db.js                # Koneksi MySQL
│   ├── mongodb.js           # Koneksi MongoDB
│   └── index.js             # Express server production
├── sql/
│   └── schema.sql            # Schema pendukung akun dan session
├── functions/                # Cloudflare Pages Functions yang tersedia
├── vite.config.ts            # Vite config dan middleware API development
├── package.json              # Script dan dependency root
├── pnpm-workspace.yaml       # Konfigurasi pnpm workspace
└── wrangler.toml             # Konfigurasi Cloudflare
```

> `client/` adalah folder sumber frontend, bukan package pnpm terpisah. `package.json`, `vite.config.ts`, dan konfigurasi utama tetap berada di root.

## Alur Registrasi

1. Pemain mengisi form pada `/daftar`.
2. Server memvalidasi input, rate limit, dan token Cloudflare Turnstile.
3. Data disimpan sementara di tabel `tales_hero_pending_registrations`.
4. Email verification dikirim melalui Resend.
5. Pemain membuka link verification.
6. Token diverifikasi satu kali dan berlaku selama 30 menit.
7. Setelah berhasil diverifikasi, akun dipindahkan ke `userinfofrompublisher`.

Akun game tidak dibuat sebelum email verification berhasil. Link verification yang sudah digunakan atau melewati masa berlaku harus dibuat ulang dengan melakukan registrasi kembali.

## Endpoint Utama

Semua endpoint menggunakan relative URL agar tetap kompatibel dengan Replit preview dan base path aplikasi.

### Auth dan akun

| Method | Endpoint | Keterangan |
| --- | --- | --- |
| `POST` | `/auth/register` | Membuat pending registration |
| `GET` | `/auth/verify-registration` | Memverifikasi token email |
| `POST` | `/auth/login` | Login akun game |
| `GET` | `/auth/me` | Mengambil session/profile aktif |
| `POST` | `/auth/logout` | Menghapus session |
| `POST` | `/auth/change-password` | Mengubah password |
| `POST` | `/auth/change-nickname` | Mengubah nickname |
| `GET` | `/auth/nickname-logs` | Melihat riwayat nickname |
| `POST` | `/auth/update-profile` | Memperbarui profil |
| `POST` | `/auth/forgot-password` | Memulai pemulihan password |
| `POST` | `/auth/email-reset-password` | Mengatur password dari link email |
| `POST` | `/auth/forgot-security-question` | Mengirim security question melalui email |
| `POST` | `/auth/account-info` | Mengirim informasi akun ke email terdaftar |

### Data game dan konten

| Method | Endpoint | Keterangan |
| --- | --- | --- |
| `GET` | `/api/leaderboard` | Mengambil data leaderboard |
| `GET` | `/api/stats` | Mengambil statistik game |
| `GET` | `/api/stats/online-players` | Mengambil daftar pemain online |
| `GET` | `/api/items` | Mencari katalog item |
| `POST` | `/auth/redeem` | Menukarkan redeem code |
| `GET` | `/api/news` | Mengambil berita |
| `GET` | `/api/downloads` | Mengambil daftar file download |

### Admin

Endpoint admin membutuhkan session admin yang valid:

```text
/api/admin/login
/api/admin/logout
/api/admin/me
/api/admin/news
/api/admin/downloads
/api/admin/redeem
/api/admin/career
```

Detail handler tersedia di `vite.config.ts`, `server/news.js`, `server/admin-redeem.js`, `server/downloads.js`, dan file terkait di `server/`.

## Build dan Production

### Build frontend

```bash
pnpm run build
```

Hasil build berada di:

```text
dist/public
```

### Menjalankan production server

Gunakan ini jika endpoint backend/auth harus aktif:

```bash
pnpm run build
pnpm run start
```

`pnpm run start` menjalankan `server/index.js`, yang melayani asset frontend sekaligus API production.

### Static preview

Untuk melihat hasil build secara lokal:

```bash
pnpm run serve
```

## Deploy ke Cloudflare Pages

Cloudflare Pages cocok untuk asset frontend dan Pages Functions yang tersedia di project.

Pengaturan Pages:

| Setting | Nilai |
| --- | --- |
| Build command | `pnpm run build` |
| Output directory | `dist/public` |
| Root directory | kosongkan / root project |

Untuk deploy manual:

```bash
pnpm run deploy:cloudflare
```

Jangan gunakan `npx wrangler deploy` karena command tersebut ditujukan untuk Cloudflare Workers. Project ini menggunakan Cloudflare Pages:

```bash
npx wrangler pages deploy dist/public --project-name tales-hero
```

Jika auth dan API Express lengkap harus tetap aktif di production, gunakan deployment yang menjalankan server Node, seperti Railway, dengan:

```bash
pnpm run build
pnpm run start
```

## Catatan Keamanan

- Simpan semua secret di Replit Secrets, Railway Variables, atau secret manager lain.
- Jangan menaruh password database, API key, session secret, atau connection string di source code.
- Password akun game mengikuti format legacy yang dibutuhkan game server, yaitu lowercase MD5 hex.
- Session login disimpan melalui cookie `HttpOnly`; frontend tidak boleh mengandalkan username dari `localStorage` sebagai identitas yang dipercaya server.
- Registrasi dilindungi rate limit berdasarkan IP, email, dan username.
- Token verification email disimpan dalam bentuk hash dan hanya dapat digunakan satu kali.
- Endpoint profil dan perubahan akun harus menggunakan session aktif.

## Troubleshooting

### `vite: not found`

Dependency belum terpasang atau `node_modules` belum tersedia:

```bash
pnpm install
pnpm run dev
```

### Server hidup, tetapi fitur akun gagal

Periksa apakah semua variable MySQL sudah diisi dan database dapat diakses:

```text
DB_HOST
DB_PORT
DB_USER
DB_PASSWORD
DB_NAME
```

### Email verification tidak terkirim

Periksa `RESEND_API_KEY` dan `APP_BASE_URL`. Pastikan domain pengirim sudah dikonfigurasi pada Resend dan alamat tujuan tidak ditolak oleh provider email.

### Registrasi ditolak oleh Turnstile

Pastikan pasangan `TURNSTILE_SITE_KEY` dan `TURNSTILE_SECRET_KEY` berasal dari site yang sama dan domain aplikasi sudah diizinkan pada konfigurasi Cloudflare Turnstile.

### Berita kembali kosong setelah restart

Fitur berita admin membutuhkan `MONGODB_URI`. Tanpa URI tersebut, aplikasi dapat tetap menyala tetapi persistence MongoDB tidak aktif.

## Lisensi dan Konten

Project ini berisi website dan asset untuk Tales Hero Indonesia. Pastikan penggunaan logo, gambar, audio, data game, dan asset pihak ketiga mengikuti hak penggunaan serta kebijakan pemiliknya.