# Tales Hero — Server Auth (MySQL)

File-file ini adalah backend Node.js/Express untuk sistem daftar & login. Tinggal deploy di server kamu dan hubungkan ke MySQL.

## Struktur

```
server/
├── db.js               ← konfigurasi koneksi MySQL
├── auth/
│   ├── register.js     ← handler POST /auth/register
│   └── login.js        ← handler POST /auth/login
└── README.md

sql/
└── schema.sql          ← skema tabel database
```

## Langkah Setup

### 1. Buat database
Jalankan `sql/schema.sql` di MySQL/MariaDB kamu:
```bash
mysql -u root -p < sql/schema.sql
```

### 2. Isi config MySQL
Buka `server/db.js` dan isi:
```js
host:     'localhost',   // host MySQL
user:     'root',        // username
password: '',            // password
database: 'taleshero',   // nama database
```

### 3. Pasang di Express server kamu
```js
const express  = require('express');
const register = require('./auth/register');
const login    = require('./auth/login');

const app = express();
app.use(express.json());

app.post('/auth/register', register);
app.post('/auth/login',    login);

app.listen(3000);
```

## Dependensi yang sudah diinstall
- `mysql` — driver MySQL untuk Node.js
- `bcryptjs` — hashing password & jawaban keamanan

## Catatan
- Password dan jawaban keamanan di-hash dengan **bcrypt** (salt rounds: 12) — tidak pernah disimpan plain text.
- Field `username` di form login menerima username **atau** email.
- Kolom `is_verified` sudah disiapkan untuk verifikasi email di masa depan (default `0`).
