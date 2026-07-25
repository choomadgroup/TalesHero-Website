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

## Dependensi yang sudah diinstall
- `mysql2` — driver MySQL untuk Node.js
- `express` — production server dan auth routes

## Catatan
- Password disimpan sebagai lowercase **MD5 hex** karena itu format yang diminta oleh game server lama.
- Email dan pertanyaan keamanan tetap divalidasi di website, tetapi tidak disimpan karena tabel game tidak memiliki kolom tersebut.
- Field `username` di form login adalah `fdUserID`.
- Akun baru masuk ke `userinfofrompublisher`; game server membuat record `userinfo`, `userinfogame`, dan `userinfologin` saat login game pertama.
