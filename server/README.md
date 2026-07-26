# Tales Hero — Server Auth (MySQL)

Backend auth ini menyimpan akun website langsung ke database game Tales Runner.

## Struktur

```
server/
├── db.js               ← connection pool MySQL
├── index.js             ← production server untuk Railway
├── auth/
│   ├── register.js     ← handler POST /auth/register
│   └── login.js        ← handler POST /auth/login
└── README.md

sql/
└── schema.sql          ← skema kompatibilitas `userinfofrompublisher`
```

## Langkah Setup

### 1. Gunakan database game
Database harus memiliki `tr_game_db.userinfofrompublisher`. Untuk instalasi baru, jalankan:
```bash
mysql -u root -p < sql/schema.sql
```

### 2. Isi environment variables
Set nilai berikut di Railway atau Replit Secrets:
```text
DB_HOST
DB_PORT=3306
DB_USER
DB_PASSWORD
DB_NAME=tr_game_db
```

### 3. Build dan jalankan server
```bash
pnpm run build
pnpm run start
```

### Sesi login

- `POST /auth/login` memverifikasi password di server dan membuat sesi acak di tabel
  `tales_hero_sessions`.
- Sesi dikirim sebagai cookie `HttpOnly` `taleshero_session`; identitas akun tidak
  lagi dipercaya dari `localStorage` atau field username dari browser.
- `GET /auth/me` mengambil profil dari sesi aktif, sedangkan `POST /auth/logout`
  menghapus sesi server.
- Endpoint profil dan ubah password wajib memiliki sesi aktif. Endpoint daftar,
  login, dan pemulihan akun memang publik agar bisa digunakan sebelum login.

## Dependensi yang sudah diinstall
- `mysql2` — driver MySQL untuk Node.js
- `express` — production server dan auth routes

## Catatan
- Password disimpan sebagai lowercase **MD5 hex** karena itu format yang diminta oleh game server lama.
- Email dan pertanyaan keamanan website disimpan di tabel supplemental; email bersifat unik dan pertanyaan keamanan hanya dikirim kembali melalui email jika pengguna lupa.
- Field `username` di form login adalah `fdUserID`.
- Akun baru masuk ke `userinfofrompublisher`; game server membuat record `userinfo`, `userinfogame`, dan `userinfologin` saat login game pertama.
