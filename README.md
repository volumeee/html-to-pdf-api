# HTML to PDF API v5.2.4 🚀

Universal HTML/URL to PDF & Screenshot API dengan Template Engine, Watermark, Merge, Batch, Security, dan Admin Panel.

## 🌟 Fitur Baru & Unggulan v5.2.x

- **Advanced Admin Dashboard**:
  - **Manajemen API Key**: Buat, edit, dan hapus API Key dengan limit kustom.
  - **Global Settings**: Atur mode Maintenance, batasi akses Guest, dan ubah konfigurasi server via UI tanpa restart.
  - **Admin Auth Control**: Ganti `username` dan `password` admin secara langsung dari Dashboard.
  - **Enhanced Monitoring**: Grafik penggunaan per Endpoint dan Top Users (API Key) secara real-time.
- **Security & Reliability**:
  - **API Key Authentication**: Gunakan header `x-api-key` untuk tracking dan kuota per client.
  - **Private Mode**: Opsi untuk mewajibkan API Key bagi semua request (mematikan akses publik/guest).
  - **Rate Limiting & Quota**: Batasi jumlah request per menit dan total kuota harian per user.
- **Advanced Rendering**:
  - **Watermarking**: Tambahkan teks watermark pada PDF/Gambar.
  - **CSS Injection**: Suntikkan gaya custom ke URL sebelum render.
  - **Password PDF**: Lindungi PDF dengan enkripsi password (AES-256).
- **Interactive Documentation**: Swagger UI interaktif di `/docs`.

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Engine**: Puppeteer (Chromium)
- **Framework**: Express.js
- **Security**: JWT & API Keys
- **Docs**: Swagger/OpenAPI 3.0

## 🚀 Persiapan Cepat (Docker)

```bash
# Pull image terbaru
docker pull bagose/html-to-pdf-api:latest

# Jalankan container
docker run -d \
  --name pdf-api \
  -p 3000:3000 \
  -v $(pwd)/data:/app/data \
  -e ADMIN_USERNAME=admin \
  -e ADMIN_PASSWORD=yourpassword \
  -e JWT_SECRET=random_secret_string \
  --restart always \
  bagose/html-to-pdf-api:latest
```

_Catatan: Gunakan volume `-v $(pwd)/data:/app/data` agar pengaturan API Key dan Admin tersimpan permanen saat container diupdate._

## 🔐 Keamanan (Auth)

### 1. Admin Panel (JWT)

Akses dashboard di `/admin-panel` menggunakan username/password dari ENV (saat pertama kali) atau yang sudah diubah di Dashboard.

### 2. API Usage (API Key)

Tambahkan header `x-api-key` pada setiap request API:

```bash
curl -X POST http://localhost:3000/generate \
  -H "x-api-key: hp_your_secret_key" \
  -H "Content-Type: application/json" \
  -d '{ "template": "invoice", "data": { ... } }'
```

## 📖 Endpoints Utama

Buka `http://localhost:3000/docs` untuk dokumentasi lengkap.

- `POST /generate`: Render PDF menggunakan template.
- `POST /cetak_struk_pdf`: Render PDF dari HTML mentah.
- `POST /url-to-pdf`: Render URL menjadi PDF.
- `POST /html-to-image`: Capture HTML menjadi gambar (PNG/JPG/WebP).
- `POST /pdf-to-image`: Convert PDF menjadi gambar.
- `POST /merge`: Gabungkan beberapa PDF menjadi satu.
- `POST /batch`: Generate dokumen masif dari array data.

## 📄 Variabel Lingkungan (ENV)

| Variable         | Deskripsi              | Default    |
| ---------------- | ---------------------- | ---------- |
| `PORT`           | Port aplikasi          | `3000`     |
| `ADMIN_USERNAME` | Username admin panel   | `admin`    |
| `ADMIN_PASSWORD` | Password admin panel   | `admin123` |
| `JWT_SECRET`     | Secret key untuk token | `...`      |

---

Dibuat dengan ❤️ untuk kemudahan integrasi cetak dokumen.
