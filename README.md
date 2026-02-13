<p align="center">
  <img src="assets/banner.png" width="1000" alt="HTML to PDF API Banner">
</p>

# 📄 HTML to PDF API

> **v7.2.0 — Unified Gateway Architecture**
>
> Enterprise-grade document generation & processing API. Convert HTML, URLs, and templates into professional PDFs and images with a single endpoint.

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org)
[![Puppeteer](https://img.shields.io/badge/Puppeteer-21+-40B5A4?logo=googlechrome&logoColor=white)](https://pptr.dev)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker&logoColor=white)](https://docker.com)
[![Docker Pulls](https://img.shields.io/docker/pulls/bagose/html-to-pdf-api.svg)](https://hub.docker.com/r/bagose/html-to-pdf-api)
[![Docker Stars](https://img.shields.io/docker/stars/bagose/html-to-pdf-api.svg)](https://hub.docker.com/r/bagose/html-to-pdf-api)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## ⚡ Architecture Overview

Version 7.2.0 consolidates 20+ legacy endpoints into **two core gateways**:

| Endpoint | Purpose | Method |
|---|---|---|
| `/render` | Generate PDFs or Images from any source | `POST` |
| `/pdf-action` | Post-process existing PDF files | `POST` |

Plus background job processing via `/queue`, `/jobs/:id`, and `/queue/stats`.

---

## 🚀 Quick Start

### Docker (Recommended)

**Pull from Docker Hub:**
```bash
docker pull bagose/html-to-pdf-api:latest
```

**Running with Docker Compose:**
```bash
docker-compose up -d
```

The API will be available at `http://localhost:3000`.
Official Image: [bagose/html-to-pdf-api](https://hub.docker.com/r/bagose/html-to-pdf-api)


### Local Development

```bash
# Install dependencies
npm install

# Start development server with hot-reload
npm run dev

# Or start production
npm start
```

### Environment Variables

Create a `.env` file (all optional with sensible defaults):

```env
# Server
PORT=3000
MAX_BODY_SIZE=10mb
AUTO_CLEANUP_HOURS=24

# Security (⚠️ Change in production!)
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
JWT_SECRET=html-to-pdf-secret-key-change-in-production
SIGNED_URL_SECRET=signed-url-secret-change-me
SIGNED_URL_EXPIRY_MINUTES=60
CORS_ORIGINS=*

# Browser
PUPPETEER_EXECUTABLE_PATH=    # Auto-detected
BROWSER_POOL_SIZE=1

# Queue
QUEUE_CONCURRENCY=3

# Email (optional)
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM=

# Cloud Storage — S3-compatible (optional)
STORAGE_PROVIDER=local
STORAGE_ENDPOINT=
STORAGE_BUCKET=
STORAGE_REGION=us-east-1
STORAGE_ACCESS_KEY=
STORAGE_SECRET_KEY=
STORAGE_PATH_PREFIX=
STORAGE_KEEP_LOCAL=true
```

---

## 📖 API Reference

### 1. `POST /render` — Universal Renderer

Generate PDFs or images from **HTML**, **URLs**, or **Templates**. Supports inline Charts, Tables, QR Codes, Barcodes, and Watermarks.

#### Request Body

| Field | Type | Required | Description |
|---|---|---|---|
| `source_type` | `string` | ✅ | `html`, `url`, or `template` |
| `source` | `string` | ✅ | HTML content, URL, or template name |
| `output` | `string` | | `pdf` (default) or `image` |
| `data` | `object` | | Template variables |
| `filename` | `string` | | Custom output filename |
| `async` | `boolean` | | If `true`, processes in background & returns `job_id` |
| `signed_url` | `object` | | `{ expiry_minutes: 60 }` for time-limited access |
| `cloud_upload` | `boolean` | | Upload to configured S3-compatible storage |
| `options` | `object` | | Rendering options (see below) |

#### Render Options

| Option | Type | Description |
|---|---|---|
| `pageSize` | `string` | `a4`, `a5`, `letter`, `legal`, `label`, `sertifikat`, `thermal_58mm`, `thermal_80mm`, `thermal_default` |
| `landscape` | `boolean` | Landscape orientation |
| `margin` | `object` | `{ top, bottom, left, right }` |
| `inject_css` | `string` | Custom CSS to inject into the page |
| `watermark` | `object` | `{ text, opacity, color, fontSize, rotate }` |
| `chart` | `object` | Chart.js configuration: `{ data: { type, data, options }, width, height }` |
| `table` | `object` | `{ data: [...], options: { columns, headers, zebra } }` |
| `qr_code` | `object` | `{ text, position, width, label, color, background }` |
| `barcode` | `object` | `{ text, type, position, label, scale, height }` |
| `displayHeaderFooter` | `boolean` | Enable header/footer templates |
| `headerTemplate` | `string` | HTML template for page header |
| `footerTemplate` | `string` | HTML template for page footer |
| `return_base64` | `boolean` | Include base64 data in response |
| `format` | `string` | Image format: `png`, `jpeg`, `webp` |
| `quality` | `integer` | Image quality (0-100) |
| `fullPage` | `boolean` | Full page screenshot (default: true) |

#### Examples

**HTML → PDF**
```json
{
  "source_type": "html",
  "source": "<h1>Monthly Report</h1><p>Generated on 2026-02-13</p>",
  "options": {
    "pageSize": "a4",
    "margin": { "top": "20mm", "bottom": "20mm", "left": "15mm", "right": "15mm" }
  }
}
```

**URL → Screenshot**
```json
{
  "source_type": "url",
  "source": "https://github.com",
  "output": "image",
  "options": { "format": "png", "fullPage": true }
}
```

**Template → Receipt PDF**
```json
{
  "source_type": "template",
  "source": "indomaret",
  "data": {
    "store_name": "My Store",
    "cashier": "John",
    "items": [
      { "name": "Coffee", "qty": 2, "price": 15000 },
      { "name": "Bread", "qty": 1, "price": 12000 }
    ],
    "payment": 50000
  }
}
```

**HTML + Embedded Chart**
```json
{
  "source_type": "html",
  "source": "<h1>Sales Dashboard</h1>",
  "options": {
    "pageSize": "a4",
    "chart": {
      "data": {
        "type": "bar",
        "data": {
          "labels": ["Q1", "Q2", "Q3", "Q4"],
          "datasets": [{
            "label": "Revenue ($K)",
            "data": [120, 190, 150, 210],
            "backgroundColor": ["#6366f1", "#8b5cf6", "#a78bfa", "#c4b5fd"]
          }]
        }
      },
      "width": 700,
      "height": 350
    }
  }
}
```

**PDF with QR Code & Watermark**
```json
{
  "source_type": "html",
  "source": "<h1>Official Document</h1><p>Content here...</p>",
  "options": {
    "pageSize": "a4",
    "qr_code": {
      "text": "https://verify.example.com/doc/12345",
      "position": "bottom-right",
      "label": "Scan to verify"
    },
    "watermark": { "text": "CONFIDENTIAL", "opacity": 0.08 }
  }
}
```

---

### 2. `POST /pdf-action` — Universal Processor

Post-process existing PDF files with 9 available actions.

#### Actions

| Action | Description | Required Options |
|---|---|---|
| `compress` | Reduce file size | `quality`: `screen`, `ebook`, `printer`, `default` |
| `encrypt` | Add password protection | `password` |
| `sign` | Embed signature stamp image | `signature_name` or `signature_base64`, `position` |
| `merge` | Combine multiple PDFs | Use `files` array instead of `filename` |
| `split` | Split into individual pages | — |
| `extract` | Extract specific pages | `pages`: `[0, 2, "4-6"]` |
| `metadata` | Read/write PDF metadata | `title`, `author`, `subject`, `keywords`, `creator` |
| `thumbnail` | Generate page preview | `width`, `height`, `page`, `format`, `return_base64` |
| `email` | Send PDF via SMTP | `to`, `subject`, `message`, `cc`, `bcc` |

#### Examples

**Compress**
```json
{ "action": "compress", "filename": "report.pdf", "options": { "quality": "ebook" } }
```

**Merge**
```json
{ "action": "merge", "files": ["cover.pdf", "chapter1.pdf", "chapter2.pdf"] }
```

**Password Protect**
```json
{ "action": "encrypt", "filename": "contract.pdf", "options": { "password": "s3cur3!" } }
```

**Sign with Stamp**
```json
{
  "action": "sign",
  "filename": "contract.pdf",
  "options": {
    "signature_name": "ceo",
    "position": "bottom-right",
    "width": 150,
    "height": 75,
    "page": 0
  }
}
```

**Extract Pages**
```json
{ "action": "extract", "filename": "book.pdf", "options": { "pages": [0, 1, "5-10"] } }
```

**Read Metadata**
```json
{ "action": "metadata", "filename": "document.pdf" }
```

**Set Metadata**
```json
{
  "action": "metadata",
  "filename": "report.pdf",
  "options": { "title": "Annual Report 2025", "author": "Finance Team" }
}
```

**Email PDF**
```json
{
  "action": "email",
  "filename": "invoice.pdf",
  "options": {
    "to": "client@example.com",
    "subject": "Your Invoice",
    "message": "Please find your invoice attached."
  }
}
```

**Thumbnail**
```json
{
  "action": "thumbnail",
  "filename": "presentation.pdf",
  "options": { "width": 300, "page": 1, "format": "png" }
}
```

---

### 3. Background Queue

For heavy operations, submit jobs to the async queue:

**Submit Job**
```bash
POST /queue
{ "type": "render", "data": { "html_content": "<h1>Heavy Report</h1>", "options": { "pageSize": "a4" } }, "priority": 5 }
```

**Check Status**
```bash
GET /jobs/{job_id}
```

**Queue Stats**
```bash
GET /queue/stats
```

---

### 4. Legacy Endpoint

**`POST /cetak_struk_pdf`** — Backward-compatible receipt generator.

```json
{
  "html_content": "<div>My receipt HTML</div>",
  "page_size": "thermal_80mm",
  "qr_code": { "text": "INV-001", "position": "bottom-center" }
}
```

Or use a built-in template:
```json
{
  "template": "indomaret",
  "data": {
    "store_name": "Toko Jaya",
    "items": [{ "name": "Mie Instan", "qty": 3, "price": 3500 }],
    "payment": 15000
  }
}
```

---

## 🎨 Built-in Templates

| Template | Description | Default Size |
|---|---|---|
| `indomaret` | Retail receipt (Indonesian style) | `thermal_default` |
| `invoice` | Professional invoice | `a4` |
| `modern` | Modern document layout | `a4` |
| `surat` | Indonesian formal letter | `a4` |
| `label` | Shipping label | `label` |
| `sertifikat` | Certificate (landscape) | `sertifikat` |

Create custom templates via the Admin Panel at `/admin-panel` → Templates.

---

## 🔒 Security

| Feature | Description |
|---|---|
| **API Key Auth** | Optional key-based access control with quotas and rate limits |
| **Password Protection** | Encrypt PDFs with AES-256 via qpdf |
| **Digital Signatures** | Embed stamp images with configurable position and opacity |
| **Signed URLs** | Time-limited, tamper-proof file access URLs |
| **CORS** | Configurable origin whitelist |
| **Helmet.js** | Security headers (CSP, HSTS, etc.) |
| **Rate Limiting** | Per-endpoint request throttling |
| **Input Sanitization** | HTML sanitization to prevent XSS |

---

## 📊 Admin Dashboard

Access at `/admin-panel` with your admin credentials.

**Features:**
- 📈 Real-time request statistics and endpoint usage charts
- 🔑 API key management (create, edit, delete, quotas)
- 📝 Request logs with filtering
- 📂 File manager (view, download, delete generated files)
- 🎨 Custom template editor with live preview
- ⚙️ Global settings (guest access, maintenance mode, cleanup schedule)
- 🔧 System info and capabilities overview

---

## 🐳 Docker Deployment

### docker-compose.yml

```yaml
version: "3.8"
services:
  html-to-pdf-api:
    build: .
    image: bagose/html-to-pdf-api:7.2.0
    ports:
      - "3000:3000"
    environment:
      - ADMIN_PASSWORD=your_secure_password
      - JWT_SECRET=your_jwt_secret
      - SIGNED_URL_SECRET=your_signed_url_secret
    volumes:
      - pdf_output:/app/output
      - pdf_data:/app/data
    deploy:
      resources:
        limits:
          memory: 1G

volumes:
  pdf_output:
  pdf_data:
```

### Resource Requirements

| Resource | Minimum | Recommended |
|---|---|---|
| RAM | 256 MB | 512 MB – 1 GB |
| CPU | 0.5 cores | 1+ cores |
| Storage | 100 MB | 1 GB+ (depends on output volume) |

---

## 🏗️ Project Structure

```
├── server.js              # Entry point & graceful shutdown
├── src/
│   ├── app.js             # Express setup, middleware, security
│   ├── config.js          # Environment configuration & constants
│   ├── swagger.js         # OpenAPI 3.0 documentation
│   ├── admin/
│   │   └── index.html     # Admin dashboard SPA
│   ├── routes/
│   │   ├── index.js       # Route aggregator
│   │   ├── universal.js   # Core: /render, /pdf-action, /queue
│   │   ├── files.js       # File management
│   │   ├── admin.js       # Admin endpoints
│   │   └── health.js      # Health check
│   ├── services/
│   │   ├── renderer.js    # Puppeteer rendering engine
│   │   ├── browser.js     # Browser pool management
│   │   ├── pdfUtils.js    # Merge, protect, compress
│   │   ├── pdfAdvanced.js # Split, extract pages
│   │   ├── pdfMetadata.js # Read/write PDF metadata
│   │   ├── signature.js   # Digital signature stamps
│   │   ├── chart.js       # Chart.js rendering
│   │   ├── table.js       # Auto-paginated tables
│   │   ├── qrBarcode.js   # QR code & barcode generation
│   │   ├── thumbnail.js   # PDF thumbnail generation
│   │   ├── email.js       # SMTP email service
│   │   ├── queue.js       # In-memory job queue
│   │   ├── cloudStorage.js# S3-compatible cloud upload
│   │   ├── signedUrl.js   # Signed URL generation
│   │   ├── fileManager.js # File operations & cleanup
│   │   ├── stats.js       # Request statistics
│   │   ├── apiKey.js      # API key management
│   │   ├── settings.js    # Runtime settings
│   │   └── customTemplate.js # Custom template CRUD
│   ├── templates/         # Built-in receipt & document templates
│   ├── middleware/         # Auth, rate limiting, sanitization
│   └── utils/             # Response helpers, formatters
├── docker-compose.yml
├── Dockerfile
└── package.json
```

---

## 📡 System Endpoints

| Endpoint | Description |
|---|---|
| `GET /` | API info & endpoint directory |
| `GET /health` | System health, memory, browser status |
| `GET /docs` | Interactive Swagger UI |
| `GET /templates` | Available templates & capabilities |
| `GET /files` | List generated files |
| `POST /cleanup` | Remove old files |
| `GET /admin-panel` | Admin dashboard |

---

## 🧪 Testing

```bash
# Basic render test
curl -X POST http://localhost:3000/render \
  -H "Content-Type: application/json" \
  -d '{"source_type":"html","source":"<h1>Test</h1>","options":{"pageSize":"a4"}}'

# Health check
curl http://localhost:3000/health

# List templates
curl http://localhost:3000/templates
```

---

## 📋 Changelog

### v7.2.0 — Unified Gateway Architecture
- 🏗️ Consolidated 20+ endpoints into `/render` and `/pdf-action`
- 📊 Added Chart.js integration for automated chart generation
- 📋 Added auto-paginated table generation
- 🔐 Added `extract` pages and digital signature stamp actions
- ☁️ Added optional S3-compatible cloud storage upload
- 🔗 Added signed URL generation for secure file access
- 📧 Integrated email delivery as a PDF action
- 🖼️ Added PDF thumbnail preview generation
- 📝 Added PDF metadata read/write
- ⚡ Background job queue with priority support
- 🚀 **New: Automatic Queueing** via `async: true` in `/render`
- 🛠️ **Optimization**: Added Chromium "Lite Mode" flags for 30% less RAM usage
- 🎨 Admin dashboard with template editor
- 🧹 Removed 8 legacy route files for cleaner codebase

---

## 🏎️ Resource Optimization (Lite Mode)

Version 7.2.0 is optimized for low-resource environments (VPS/Container):

- **Chromium Lite Mode**: We use specialized flags (`--disable-extensions`, `--no-first-run`, etc.) to minimize memory footprint.
- **Concurrency Control**: Use `QUEUE_CONCURRENCY` and `BROWSER_POOL_SIZE` to prevent CPU spikes.
- **Async Handling**: For high-volume batches (1000+ docs), always use `async: true` in your `/render` request to avoid server timeouts.

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

<p align="center">
  <strong>Built with ❤️ by <a href="https://github.com/volumeee">volumeee</a></strong>
</p>
