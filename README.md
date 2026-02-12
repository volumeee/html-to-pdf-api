# HTML to PDF API v5.0.0 🚀

Universal HTML/URL to PDF & Screenshot API dengan Template Engine, Watermark, Merge, Batch, Security, dan Admin Panel.

## 🌟 Fitur Unggulan v5.0.0

- **Admin Dashboard**: Panel monitoring penggunaan API, statistik, dan manajemen file berbasis web.
- **Security & Reliability**:
  - **Rate Limiting**: Pembatasan request untuk mencegah abuse.
  - **JWT Authentication**: Akses dashboard admin yang aman.
  - **Request Validation**: Validasi input menggunakan schema yang ketat.
- **Advanced Rendering**:
  - **Watermarking**: Tambahkan teks watermark pada PDF/Gambar.
  - **CSS Injection**: Suntikkan gaya custom ke URL sebelum render.
  - **Password PDF**: Lindungi PDF dengan enkripsi password (AES-256).
- **Format Conversion**:
  - **PDF to Image**: Konversi file PDF yang sudah ada menjadi gambar.
  - **Data to CSV**: Export data batch menjadi file CSV.
- **New Templates**:
  - **Surat Resmi**: Template surat dengan kop, nomor, dan tanda tangan.
  - **Sertifikat**: Desain landscape elegan dengan border dekoratif.
  - **Label Pengiriman**: Label paket dengan info kurir dan resi.
- **Interactive Documentation**: Swagger UI interaktif di `/docs`.

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Engine**: Puppeteer (Chromium)
- **Framework**: Express.js
- **PDF Utils**: pdf-lib & qpdf
- **Auth**: JSON Web Token (JWT)
- **Docs**: Swagger/OpenAPI 3.0

## 🚀 Persiapan Cepat (Docker)

```bash
# Pull image terbaru
docker pull bagose/html-to-pdf-api:latest

# Jalankan container
docker run -d \
  --name pdf-api \
  -p 3000:3000 \
  -e ADMIN_USERNAME=admin \
  -e ADMIN_PASSWORD=yourpassword \
  -e JWT_SECRET=random_secret_string \
  --restart always \
  bagose/html-to-pdf-api:latest
```

## 📖 Dokumentasi API

Buka `http://localhost:3000/docs` untuk melihat dokumentasi interaktif dan mencoba endpoint secara langsung.

### Endpoints Utama:

- `POST /generate`: Render PDF menggunakan template.
- `POST /cetak_struk_pdf`: Render PDF dari HTML mentah.
- `POST /url-to-pdf`: Render URL menjadi PDF.
- `POST /html-to-image`: Capture HTML menjadi gambar (PNG/JPG/WebP).
- `POST /pdf-to-image`: Convert PDF menjadi gambar.
- `POST /to-csv`: Convert data array menjadi CSV.
- `POST /merge`: Gabungkan beberapa PDF menjadi satu.
- `POST /batch`: Generate banyak dokumen (multi-page) dari array data.
- `POST /webhook`: Generate PDF secara asinkron dan kirim hasil ke webhook.

## 🔐 Admin Panel

Akses dashboard di `http://localhost:3000/admin-panel`.

- Monitor jumlah request harian.
- Lihat log setiap request (IP, Endpoint, Waktu).
- Kelola file di folder output (Lihat & Hapus).
- Cek kesehatan sistem (Memori, Uptime).

## 📄 Variabel Lingkungan (ENV)

| Variable             | Deskripsi                | Default    |
| -------------------- | ------------------------ | ---------- |
| `PORT`               | Port aplikasi            | `3000`     |
| `ADMIN_USERNAME`     | Username admin panel     | `admin`    |
| `ADMIN_PASSWORD`     | Password admin panel     | `admin123` |
| `JWT_SECRET`         | Secret key untuk token   | `...`      |
| `AUTO_CLEANUP_HOURS` | Hapus file setelah N jam | `24`       |

---

Dibuat dengan ❤️ untuk kemudahan integrasi cetak dokumen.
