<p align="center">
  <h1 align="center">📄 HTML to PDF API</h1>
  <p align="center">
    <strong>Enterprise-Grade Document Generation & Conversion Platform</strong>
  </p>
  <p align="center">
    HTML/URL → PDF • Screenshot • QR Code • Barcode • Digital Signatures • Encryption • Thumbnails • Email Delivery
  </p>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/version-7.1.0-blue.svg" alt="Version" />
  <img src="https://img.shields.io/badge/node-%3E%3D18-brightgreen.svg" alt="Node.js" />
  <img src="https://img.shields.io/badge/license-MIT-green.svg" alt="License" />
  <img src="https://img.shields.io/badge/docker-ready-2496ED.svg" alt="Docker" />
  <img src="https://img.shields.io/badge/puppeteer-powered-blueviolet.svg" alt="Puppeteer" />
  <img src="https://img.shields.io/badge/security-helmet%20%7C%20bcrypt-orange.svg" alt="Security" />
</p>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Architecture](#-architecture)
- [Quick Start](#-quick-start)
- [Core Examples](#-core-examples)
- [API Endpoints](#-api-endpoints)
- [Features](#-features)
- [Templates](#-templates)
- [Authentication & Security](#-authentication--security)
- [Configuration](#%EF%B8%8F-configuration)
- [Deployment](#-deployment)
- [Tech Stack](#-tech-stack)
- [Changelog](#-changelog)
- [License](#-license)

---

## 🔍 Overview

A self-hosted, production-ready REST API for generating PDFs, screenshots, QR codes, and barcodes from HTML content or URLs. Built on **Node.js + Puppeteer** and shipped as a single Docker image with zero external dependencies.

### Key Capabilities

| Category | Features |
|---|---|
| **Document Generation** | HTML → PDF, URL → PDF, Template → PDF, Batch generation |
| **Image Capture** | HTML → PNG/JPEG/WebP, URL → Screenshot, PDF → Image |
| **QR & Barcode** | QR Code, Code128, EAN-13, EAN-8, UPC-A, ITF-14 — standalone or embedded in PDFs |
| **Security** | AES-256 PDF encryption, Digital signature stamps, HMAC-SHA256 signed URLs, XSS sanitization, Helmet.js headers, bcrypt auth |
| **PDF Processing** | Merge, Compress (Ghostscript/qpdf), Metadata (title/author/keywords), Thumbnail generation |
| **Delivery** | Webhook callbacks, Email via SMTP, S3-compatible cloud storage upload |
| **Performance** | Browser pool (multi-instance Puppeteer), Async job queue with priority, Rate limiting |
| **Administration** | Web admin panel, API key management, Usage stats & logs, Custom template editor |

---

## 🏗 Architecture

```
┌──────────────────────────────────────────────────────────┐
│                     Express Server                       │
│  Helmet │ CORS │ Rate Limiter │ XSS Sanitizer │ Timeout │
├──────────────────────────────────────────────────────────┤
│                   API Key + JWT Auth                     │
├──────────┬───────────┬───────────┬───────────────────────┤
│ PDF      │ Screenshot│ QR/Barcode│ Security   │ Enhanced │
│ Routes   │ Routes    │ Routes    │ Routes     │ Routes   │
├──────────┴───────────┴───────────┴───────────┴──────────┤
│                    Service Layer                         │
│  Renderer │ Browser Pool │ PDF Utils │ Queue │ Email    │
│  Templates│ QR/Barcode   │ Metadata  │ Cloud │ Thumbnail│
├──────────────────────────────────────────────────────────┤
│  Puppeteer Pool  │  qpdf  │  Ghostscript  │  pdf-lib   │
├──────────────────────────────────────────────────────────┤
│                  Admin Panel (Web UI)                    │
│  Stats │ Logs │ API Keys │ Templates │ Settings         │
└──────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### Docker (Recommended)

```bash
docker run -d \
  --name pdf-api \
  -p 3000:3000 \
  -v pdf_output:/app/output \
  -v pdf_data:/app/data \
  bagose/html-to-pdf-api:7.1.0
```

### Docker Compose

```yaml
services:
  pdf-api:
    image: bagose/html-to-pdf-api:7.1.0
    container_name: html-to-pdf-api
    ports:
      - "3000:3000"
    environment:
      - ADMIN_PASSWORD=your_secure_password
      - JWT_SECRET=your_jwt_secret_min_32_chars
      - SIGNED_URL_SECRET=your_signed_url_secret
      - BROWSER_POOL_SIZE=3
    volumes:
      - pdf_output:/app/output
      - pdf_data:/app/data
    restart: unless-stopped

volumes:
  pdf_output:
  pdf_data:
```

### From Source

```bash
git clone https://github.com/volumeee/html-to-pdf-api.git
cd html-to-pdf-api
npm install
node server.js
```

**Access Points:**
- API: `http://localhost:3000`
- Swagger Docs: `http://localhost:3000/docs`
- Admin Panel: `http://localhost:3000/admin-panel`
- Health Check: `http://localhost:3000/health`

---

## 💡 Core Examples

### 1. Generate PDF from HTML

```bash
curl -X POST http://localhost:3000/cetak_struk_pdf \
  -H "Content-Type: application/json" \
  -d '{
    "html_content": "<h1>Invoice #001</h1><p>Amount: Rp 150.000</p>",
    "page_size": "a4",
    "metadata": {
      "title": "Invoice #001",
      "author": "My Company"
    }
  }'
```

### 2. Generate from Template

```bash
curl -X POST http://localhost:3000/generate \
  -H "Content-Type: application/json" \
  -d '{
    "template": "invoice",
    "data": {
      "invoice_no": "INV-2025-001",
      "company_name": "Acme Corp",
      "items": [
        { "name": "Widget A", "qty": 5, "price": 50000 },
        { "name": "Widget B", "qty": 2, "price": 75000 }
      ]
    }
  }'
```

### 3. Encrypt PDF with Password

```bash
curl -X POST http://localhost:3000/encrypt-pdf \
  -H "Content-Type: application/json" \
  -d '{
    "filename": "invoice_abc123.pdf",
    "password": "s3cur3_p@ss"
  }'
```

### 4. Compress PDF

```bash
curl -X POST http://localhost:3000/compress-pdf \
  -H "Content-Type: application/json" \
  -d '{
    "filename": "report_xyz.pdf",
    "quality": "ebook"
  }'
```

### 5. Generate QR Code

```bash
curl -X POST http://localhost:3000/qr-code \
  -H "Content-Type: application/json" \
  -d '{
    "text": "https://example.com/verify/12345",
    "format": "base64"
  }'
```

---

## 📚 API Endpoints

### 📄 PDF Generation

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/cetak_struk_pdf` | HTML → PDF with optional QR, barcode, watermark, metadata |
| `POST` | `/generate` | Template → PDF with dynamic data |
| `POST` | `/url-to-pdf` | URL → PDF with CSS injection support |

### 📸 Screenshots

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/html-to-image` | HTML → PNG/JPEG/WebP |
| `POST` | `/url-to-image` | URL → PNG/JPEG/WebP |

### 📱 QR Code & Barcode

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/qr-code` | Generate QR code (PNG/base64) |
| `POST` | `/barcode` | Generate barcode (Code128, EAN-13, etc.) |
| `POST` | `/qr-pdf` | QR code embedded in full-page PDF |

### 🔐 Security & Encryption

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/encrypt-pdf` | AES-256 password protection via qpdf |
| `POST` | `/sign-pdf` | Digital signature stamp (image overlay) |
| `POST` | `/secure/generate` | Generate HMAC-SHA256 signed URL |
| `GET` | `/secure/:filename` | Access file via signed URL |

### 📄 PDF Processing

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/compress-pdf` | Compress PDF (Ghostscript/qpdf/pdf-lib) |
| `GET` | `/pdf-metadata` | Read PDF metadata (title, author, etc.) |
| `POST` | `/pdf-metadata` | Set PDF metadata |
| `POST` | `/thumbnail` | Generate thumbnail image from PDF |

### 🔄 Conversion

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/pdf-to-image` | PDF → PNG/JPEG/WebP |
| `POST` | `/to-csv` | Data → CSV export |

### ⚡ Advanced Operations

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/merge` | Merge multiple PDF files |
| `POST` | `/batch` | Batch generate from template + data array |
| `POST` | `/webhook` | Async generate with webhook callback |
| `POST` | `/queue` | Submit async job with priority |
| `GET` | `/jobs/:id` | Check async job status |
| `GET` | `/queue/stats` | Queue statistics |

### 📧 Delivery

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/send-email` | Send file via SMTP email |

### 📂 File Management

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/files` | List generated files |
| `DELETE` | `/files/:filename` | Delete a file |
| `POST` | `/cleanup` | Remove files older than N hours |
| `GET` | `/templates` | List templates & capabilities |
| `GET` | `/templates/:name/preview` | Preview template with sample data |

### 📊 Monitoring

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | System health (CPU, memory, browser pool, storage) |

### 🔑 Admin Panel

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/admin/login` | Authenticate → JWT token |
| `GET` | `/admin/stats` | Usage statistics |
| `GET` | `/admin/logs` | Request logs |
| `GET` | `/admin/system` | System info, email status, queue stats |
| `CRUD` | `/admin/keys` | API key management |
| `CRUD` | `/admin/settings` | Global settings |
| `CRUD` | `/admin/templates/custom` | Custom template editor |
| `CRUD` | `/admin/signatures` | Digital signature stamp management |

---

## 🎯 Features

### PDF Generation Options

Every PDF endpoint supports these options:

| Option | Type | Description |
|---|---|---|
| `page_size` | string | `thermal_58mm`, `thermal_80mm`, `thermal_default`, `a4`, `a5`, `letter`, `legal`, `label`, `sertifikat` |
| `watermark` | object | `{ text, opacity, color, fontSize, rotate }` |
| `qr_code` | object | `{ text, position, width, color, label }` — embedded in PDF |
| `barcode` | object | `{ text, type, position, height, label }` — embedded in PDF |
| `password` | string | AES-256 encrypt the output PDF |
| `metadata` | object | `{ title, author, subject, keywords, creator }` |
| `return_base64` | boolean | Also return base64-encoded PDF in response |
| `inject_css` | string | Custom CSS injected into the page (URL→PDF) |
| `displayHeaderFooter` | boolean | Enable header/footer |
| `headerTemplate` | string | HTML template for page header |
| `footerTemplate` | string | HTML template for page footer |

### QR Code Positions

Supported positions for embedded QR codes: `top-left`, `top-center`, `top-right`, `center`, `bottom-left`, `bottom-center`, `bottom-right`, `inline`.

### Barcode Types

`code128`, `code39`, `ean13`, `ean8`, `upca`, `itf14`, `msi`, `pharmacode`, `codabar`

### PDF Compression

Three-tier compression strategy with automatic fallback:

1. **Ghostscript** — deep compression with quality presets (`screen` 72dpi, `ebook` 150dpi, `printer` 300dpi)
2. **qpdf** — linearize + object streams (lossless)
3. **pdf-lib** — re-save optimization (fallback)

Typical reduction: **30–70%** depending on content.

### Browser Pool

Multiple Puppeteer browser instances for parallel request processing:

- Round-robin allocation across pool instances
- Per-instance health monitoring
- Configurable via `BROWSER_POOL_SIZE` environment variable
- 3–5× throughput improvement under concurrent load

### Job Queue

In-memory async job queue for heavy operations:

- Configurable concurrency via `QUEUE_CONCURRENCY`
- Priority support (higher value = runs first)
- Job status tracking: `pending` → `processing` → `completed` / `failed`
- Auto-cleanup of completed jobs after 30 minutes

### Email Delivery

Send generated files via SMTP:

- Styled HTML email with file attachment
- Support for CC, BCC, custom subject and message
- SMTP connection verification endpoint

### Cloud Storage

Upload files to S3-compatible storage after generation:

- Supports AWS S3, Google Cloud Storage, MinIO, DigitalOcean Spaces
- AWS Signature V4 authentication (no heavy SDK dependency)
- Optional local file retention after upload

### Thumbnail Generation

Auto-generate preview images from PDF files:

- Uses pdf.js + Puppeteer for high-quality rendering
- Configurable dimensions, page selection, and format (PNG/JPEG/WebP)
- Base64 output option

### Digital Signatures

Embed visual signature stamps on PDF documents:

- Position-based placement (corners, center)
- Custom size, opacity, page selection
- Admin panel for signature image management
- Inline base64 or saved signature support

### Signed URLs

Generate time-limited secure file access URLs:

- HMAC-SHA256 signatures
- Configurable expiry (default: 60 minutes)
- No-store cache headers for security

---

## 📝 Templates

Built-in templates with sample data and preview:

| Template | Description | Default Size |
|---|---|---|
| `struk` | Thermal receipt | `thermal_80mm` |
| `invoice` | Professional invoice | `a4` |
| `label` | Shipping label | `label` |
| `surat` | Formal letter | `a4` |
| `sertifikat` | Certificate (landscape) | `sertifikat` |
| `indomaret` | Retail receipt | `thermal_80mm` |

**Preview any template:**
```
GET /templates/invoice/preview
```

**Custom templates** can be created via the Admin Panel or API.

---

## 🔒 Authentication & Security

### Security Stack

| Layer | Technology | Purpose |
|---|---|---|
| HTTP Headers | Helmet.js | HSTS, X-Content-Type, X-Frame-Options, etc. |
| Authentication | JWT (jsonwebtoken) | Admin panel access with 24h token expiry |
| Password Storage | bcryptjs (12 rounds) | Secure admin password hashing |
| Input Sanitization | sanitize-html | Prevent XSS via script/iframe/event removal |
| CORS | Configurable origins | Cross-origin request control |
| Rate Limiting | express-rate-limit | Per-IP request throttling |
| PDF Encryption | qpdf (AES-256) | Password-protected PDF output |
| URL Signing | HMAC-SHA256 | Time-limited secure file access |
| API Keys | UUID-based | Per-key rate limits, quotas, and state control |

### API Key Authentication

Include `x-api-key` header for authenticated requests:

```bash
curl -H "x-api-key: your_api_key" http://localhost:3000/cetak_struk_pdf ...
```

API keys are managed via the Admin Panel or `/admin/keys` endpoint.

---

## ⚙️ Configuration

### Environment Variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3000` | Server port |
| `ADMIN_USERNAME` | `admin` | Admin login username |
| `ADMIN_PASSWORD` | `admin123` | Admin login password (use bcrypt hash in production) |
| `JWT_SECRET` | _(default)_ | JWT signing secret (change in production!) |
| `SIGNED_URL_SECRET` | _(default)_ | Signed URL HMAC secret (change in production!) |
| `SIGNED_URL_EXPIRY_MINUTES` | `60` | Signed URL expiry time |
| `CORS_ORIGINS` | `*` | Allowed origins (comma-separated or `*`) |
| `REQUEST_TIMEOUT_MS` | `120000` | Request timeout in milliseconds |
| `MAX_BODY_SIZE` | `10mb` | Maximum request body size |
| `AUTO_CLEANUP_HOURS` | `24` | File auto-cleanup threshold |
| `BROWSER_POOL_SIZE` | `1` | Number of Puppeteer browser instances |
| `QUEUE_CONCURRENCY` | `3` | Maximum concurrent queue jobs |
| `WEBHOOK_MAX_RETRIES` | `3` | Webhook retry attempts |
| `WEBHOOK_RETRY_DELAY_MS` | `3000` | Webhook retry delay |
| **Email (SMTP)** | | |
| `SMTP_HOST` | _(none)_ | SMTP server hostname |
| `SMTP_PORT` | `587` | SMTP port |
| `SMTP_SECURE` | `false` | Use TLS (true for port 465) |
| `SMTP_USER` | _(none)_ | SMTP username |
| `SMTP_PASS` | _(none)_ | SMTP password |
| `SMTP_FROM` | _(SMTP_USER)_ | Sender address |
| **Cloud Storage** | | |
| `STORAGE_PROVIDER` | `local` | `s3`, `gcs`, `minio`, or `local` |
| `STORAGE_ENDPOINT` | _(none)_ | S3-compatible endpoint URL |
| `STORAGE_BUCKET` | _(none)_ | Bucket name |
| `STORAGE_REGION` | `us-east-1` | Storage region |
| `STORAGE_ACCESS_KEY` | _(none)_ | Access key |
| `STORAGE_SECRET_KEY` | _(none)_ | Secret key |
| `STORAGE_PATH_PREFIX` | _(none)_ | Key prefix for uploaded files |
| `STORAGE_KEEP_LOCAL` | `true` | Keep local copy after upload |

---

## 🐳 Deployment

### Production Docker Compose

```yaml
services:
  pdf-api:
    image: bagose/html-to-pdf-api:7.1.0
    container_name: html-to-pdf-api
    ports:
      - "3000:3000"
    environment:
      - ADMIN_PASSWORD=your_bcrypt_hash_here
      - JWT_SECRET=change_this_to_random_64_char_string
      - SIGNED_URL_SECRET=change_this_to_random_64_char_string
      - CORS_ORIGINS=https://yourdomain.com
      - BROWSER_POOL_SIZE=3
      - QUEUE_CONCURRENCY=5
      # Optional: Email
      - SMTP_HOST=smtp.gmail.com
      - SMTP_PORT=587
      - SMTP_USER=noreply@yourdomain.com
      - SMTP_PASS=your_app_password
      # Optional: S3 Storage
      - STORAGE_PROVIDER=s3
      - STORAGE_ENDPOINT=https://s3.amazonaws.com
      - STORAGE_BUCKET=my-pdf-bucket
      - STORAGE_ACCESS_KEY=AKIA...
      - STORAGE_SECRET_KEY=your_secret
    volumes:
      - pdf_output:/app/output
      - pdf_data:/app/data
    deploy:
      resources:
        limits:
          memory: 1G
          cpus: "2"
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "node", "-e", "require('http').get('http://localhost:3000/health', r => process.exit(r.statusCode === 200 ? 0 : 1))"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  pdf_output:
  pdf_data:
```

### Production Checklist

- [ ] Change `ADMIN_PASSWORD` to a bcrypt hash
- [ ] Set unique `JWT_SECRET` (64+ characters)
- [ ] Set unique `SIGNED_URL_SECRET` (64+ characters)
- [ ] Configure `CORS_ORIGINS` for your domain
- [ ] Set `BROWSER_POOL_SIZE` based on available memory (~180MB per instance)
- [ ] Configure SMTP if email delivery is needed
- [ ] Configure cloud storage if S3 upload is needed
- [ ] Set up log rotation and monitoring
- [ ] Place behind reverse proxy (nginx/traefik) with TLS

### API Response Format

All endpoints return consistent JSON:

```json
// Success
{ "status": "success", "file_url": "...", "filename": "..." }

// Error
{ "status": "error", "error": "Description", "details": "..." }
```

---

## 🛠 Tech Stack

| Component | Technology |
|---|---|
| Runtime | Node.js 18+ |
| Framework | Express.js |
| PDF Engine | Puppeteer (Chromium) |
| PDF Utilities | pdf-lib, qpdf, Ghostscript |
| Security | Helmet.js, bcryptjs, jsonwebtoken, sanitize-html |
| Image Processing | Puppeteer screenshot, bwip-js (barcode), qrcode |
| Email | nodemailer |
| Documentation | Swagger UI (OpenAPI 3.0) |
| Containerization | Docker + Docker Compose |

---

## 📝 Changelog

### v7.1.0 (2025-02-13)
- 🔐 bcrypt password hashing for admin authentication
- 🛡️ XSS prevention via sanitize-html middleware
- 📦 PDF compression (Ghostscript/qpdf/pdf-lib, 30–70% reduction)
- 📄 PDF metadata read/write (title, author, subject, keywords)
- 🖼️ Thumbnail generation from PDF pages
- ⚡ Browser pool with round-robin allocation
- 📋 In-memory job queue with priority and status tracking
- 📧 Email delivery via SMTP (nodemailer)
- ☁️ S3-compatible cloud storage integration
- 8 new API endpoints

### v7.0.0
- 🔒 Helmet.js security headers
- 🔑 Signed URL file access (HMAC-SHA256)
- 🔐 AES-256 PDF encryption via qpdf
- ✍️ Digital signature stamps
- ❤️ Health check endpoint with system metrics
- 📋 Template preview with sample data
- 🔄 Webhook retry with exponential backoff
- ⚙️ Configurable CORS and request timeout

### v6.0.0
- 🎨 Admin panel (web UI)
- 🔑 API key management with quotas
- 📊 Usage statistics and request logging
- ⚙️ Custom template editor
- 🔧 Global settings management

### v5.0.0
- 🔄 PDF-to-Image conversion
- 📊 CSV export
- 📝 Header/footer templates

### v4.0.0
- 📱 QR code and barcode generation
- 🏷️ Embedded QR/barcode in PDFs

### v3.0.0
- 📸 Screenshot support (HTML/URL → PNG/JPEG/WebP)
- 🔀 PDF merge
- 📦 Batch generation

### v2.0.0
- 🎨 Template engine with built-in templates
- 💧 Watermark support

### v1.0.0
- 📄 Basic HTML → PDF conversion
- 🐳 Docker support

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

<p align="center">
  Built with ❤️ using Node.js, Puppeteer & Express
</p>
