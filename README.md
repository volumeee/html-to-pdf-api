<p align="center">
  <h1 align="center">📄 HTML to PDF API</h1>
  <p align="center">
    <strong>Enterprise-Grade Document Generation & Conversion Platform</strong>
  </p>
  <p align="center">
    HTML/URL → PDF • Screenshot • QR Code • Barcode • Digital Signatures • PDF Encryption • Signed URLs
  </p>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/version-7.0.0-blue.svg" alt="Version" />
  <img src="https://img.shields.io/badge/node-%3E%3D18-brightgreen.svg" alt="Node.js" />
  <img src="https://img.shields.io/badge/license-MIT-green.svg" alt="License" />
  <img src="https://img.shields.io/badge/docker-ready-2496ED.svg" alt="Docker" />
  <img src="https://img.shields.io/badge/puppeteer-powered-blueviolet.svg" alt="Puppeteer" />
  <img src="https://img.shields.io/badge/security-helmet-orange.svg" alt="Security" />
</p>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [What's New in v7.0.0](#-whats-new-in-v700)
- [Architecture](#-architecture)
- [Quick Start](#-quick-start)
- [API Endpoints](#-api-endpoints)
  - [PDF Generation](#-pdf-generation)
  - [Screenshots](#-screenshots)
  - [QR Code & Barcode](#-qr-code--barcode)
  - [Security & Encryption](#-security--encryption)
  - [Conversion](#-conversion)
  - [Advanced Operations](#️-advanced-operations)
  - [Monitoring](#-monitoring)
  - [File Management](#-file-management)
  - [Admin Panel](#-admin-panel)
- [Embedded QR Code & Barcode in PDFs](#-embedded-qr-code--barcode-in-pdfs)
- [Header, Footer & Page Numbers](#-header-footer--page-numbers)
- [Custom Templates](#-custom-templates)
- [Authentication & Security](#-authentication--security)
- [Configuration](#️-configuration)
- [Deployment](#-deployment)
- [API Response Format](#-api-response-format)
- [Tech Stack](#-tech-stack)
- [Changelog](#-changelog)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🎯 Overview

**HTML to PDF API** is a self-hosted, production-ready API server for document generation and conversion. Built with **Node.js**, **Express**, and **Puppeteer**, it provides a comprehensive suite of tools for:

- 📄 **PDF Generation** — Convert HTML, URLs, or templates to PDF with pixel-perfect rendering
- 📸 **Screenshots** — Capture full-page or viewport screenshots in PNG, JPEG, or WebP
- 📱 **QR Codes & Barcodes** — Generate standalone or embed directly into PDFs/receipts
- 🔐 **PDF Encryption** — AES-256 password protection via qpdf
- ✍️ **Digital Signatures** — Embed signature stamp images onto PDF documents
- 🔗 **Signed URLs** — Time-limited, tamper-proof file access with HMAC-SHA256
- 🎨 **Custom Templates** — Upload and manage HTML templates via Admin Panel
- 📑 **Advanced Operations** — Merge PDFs, batch generation, async webhooks with retry
- 🛡️ **Enterprise Security** — Helmet.js headers, CORS, API keys with quotas, rate limiting, JWT
- ❤️ **Health Monitoring** — Real-time system metrics, browser status, disk usage
- 🖥️ **Admin Dashboard** — Full-featured web panel for monitoring and configuration

---

## 🆕 What's New in v7.0.0

> **v7.0.0** is a major release focused on **enterprise security** and new document features.

### 🔐 Security Enhancements

| Feature                    | Description                                                                 |
| -------------------------- | --------------------------------------------------------------------------- |
| **Helmet.js**              | HTTP security headers (HSTS, X-Content-Type-Options, X-Frame-Options, etc.) |
| **Configurable CORS**      | Restrict origins via `CORS_ORIGINS` env var                                 |
| **Request Timeout**        | Per-request timeout (120s default) prevents hanging                         |
| **Environment Validation** | Startup warnings for default/insecure secrets                               |
| **Graceful Shutdown**      | Connection draining, stats persistence on SIGTERM/SIGINT                    |

### ✨ New Features

| Feature                  | Endpoint                       | Description                                |
| ------------------------ | ------------------------------ | ------------------------------------------ |
| **PDF Encryption**       | `POST /encrypt-pdf`            | AES-256 password protection                |
| **Digital Signatures**   | `POST /sign-pdf`               | Stamp image overlay with position control  |
| **Signed URLs**          | `POST /secure/generate`        | HMAC-SHA256 time-limited file access       |
| **Template Preview**     | `GET /templates/:name/preview` | Generate sample PDF with built-in data     |
| **Health Check**         | `GET /health`                  | System metrics, browser status, disk usage |
| **Webhook Retry**        | `POST /webhook`                | Exponential backoff (configurable retries) |
| **Signature Management** | `/admin/signatures`            | CRUD for stamp images via admin panel      |

### 🐳 DevOps

- **Docker Compose** with health check, resource limits, log rotation
- **Dockerfile HEALTHCHECK** instruction
- **Legal page size** preset (8.5" × 14")

---

## 🏗 Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                      Express Server                           │
├──────┬──────┬──────┬──────┬──────┬──────┬──────┬────────────┤
│ PDF  │Screen│ QR/  │Secur-│Health│ Adv  │ File │ Admin      │
│Routes│ shot │Barcd │ ity  │Check │ anced│ Mgmt │ Panel      │
├──────┴──────┴──────┴──────┴──────┴──────┴──────┴────────────┤
│                   Middleware Layer                             │
│  Helmet │ CORS │ Timeout │ API Key Auth │ Rate Limiter │ JWT │
├──────────────────────────────────────────────────────────────┤
│                    Service Layer                              │
│  Renderer │ QR/Barcode │ Signature │ SignedUrl │ Templates   │
├──────────────────────────────────────────────────────────────┤
│  Puppeteer (Chromium) │ pdf-lib │ qrcode │ bwip-js │ qpdf   │
└──────────────────────────────────────────────────────────────┘
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
  -e ADMIN_PASSWORD=your_strong_password \
  -e JWT_SECRET=your_random_secret_key \
  -e SIGNED_URL_SECRET=your_signed_url_secret \
  --restart unless-stopped \
  bagose/html-to-pdf-api:7.0.0
```

### Docker Compose

```yaml
version: "3.8"
services:
  pdf-api:
    image: bagose/html-to-pdf-api:7.0.0
    container_name: pdf-api
    ports:
      - "3000:3000"
    environment:
      - ADMIN_PASSWORD=your_strong_password
      - JWT_SECRET=your_random_secret_key
      - SIGNED_URL_SECRET=your_signed_url_secret
      - CORS_ORIGINS=https://yourdomain.com
      - AUTO_CLEANUP_HOURS=24
    volumes:
      - pdf_output:/app/output
      - pdf_data:/app/data
    restart: unless-stopped
    deploy:
      resources:
        limits:
          memory: 1G

volumes:
  pdf_output:
  pdf_data:
```

### Manual Installation

```bash
git clone https://github.com/volumeee/html-to-pdf-api.git
cd html-to-pdf-api
npm install
node server.js
```

> **💡 Tip:** On first startup, the API validates your configuration and warns about insecure defaults. Always set `ADMIN_PASSWORD`, `JWT_SECRET`, and `SIGNED_URL_SECRET` in production!

Once running, access:

- **📖 API Docs:** [http://localhost:3000/docs](http://localhost:3000/docs)
- **🔐 Admin Panel:** [http://localhost:3000/admin-panel](http://localhost:3000/admin-panel)
- **❤️ Health Check:** [http://localhost:3000/health](http://localhost:3000/health)

---

## 📡 API Endpoints

### 📄 PDF Generation

#### `POST /cetak_struk_pdf` — HTML → PDF

Convert raw HTML content into a PDF document.

```bash
curl -X POST http://localhost:3000/cetak_struk_pdf \
  -H "Content-Type: application/json" \
  -d '{
    "html_content": "<h1>Hello World</h1><p>This is a PDF document.</p>",
    "page_size": "a4",
    "watermark": { "text": "CONFIDENTIAL", "opacity": 0.1 },
    "qr_code": {
      "text": "https://example.com/verify/12345",
      "position": "bottom-right",
      "width": 100,
      "label": "Verify Document"
    },
    "password": "secret123"
  }'
```

**Parameters:**
| Parameter | Type | Description |
|---|---|---|
| `html_content` | `string` | **Required.** HTML string to convert |
| `filename` | `string` | Custom output filename |
| `page_size` | `string` | `thermal_58mm`, `thermal_80mm`, `thermal_default`, `a4`, `a5`, `letter`, `legal`, `label`, `sertifikat` |
| `watermark` | `object` | `{ text, opacity, color, fontSize, rotate }` |
| `qr_code` | `object` | Embed QR code (see [QR Code Params](#qr-code-params)) |
| `barcode` | `object` | Embed barcode (see [Barcode Params](#barcode-params)) |
| `options` | `object` | `{ displayHeaderFooter, headerTemplate, footerTemplate, margin, landscape }` |
| `password` | `string` | PDF password protection (requires qpdf) |
| `return_base64` | `boolean` | Also return base64 encoded PDF |

---

#### `POST /generate` — Template → PDF

Generate PDF from built-in or custom templates with dynamic data.

```bash
curl -X POST http://localhost:3000/generate \
  -H "Content-Type: application/json" \
  -d '{
    "template": "invoice",
    "data": {
      "invoice_no": "INV-2026-001",
      "company_name": "PT Contoh Indonesia",
      "items": [
        { "name": "Product A", "qty": 2, "price": 150000 },
        { "name": "Service B", "qty": 1, "price": 500000 }
      ]
    },
    "qr_code": {
      "text": "INV-2026-001",
      "position": "top-right",
      "width": 80
    }
  }'
```

**Parameters:**
| Parameter | Type | Description |
|---|---|---|
| `template` | `string` | **Required.** Template name (built-in or custom) |
| `data` | `object` | **Required.** Dynamic data for the template |
| `qr_code` | `object` | Embed QR code into the generated PDF |
| `barcode` | `object` | Embed barcode into the generated PDF |
| `watermark` | `object` | Watermark overlay |
| `page_size` | `string` | Override template's default page size |
| `password` | `string` | PDF password protection |

---

#### `POST /url-to-pdf` — URL → PDF

Convert any web page URL to PDF.

```bash
curl -X POST http://localhost:3000/url-to-pdf \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com",
    "page_size": "a4",
    "inject_css": "body { font-size: 14px; }",
    "qr_code": {
      "text": "https://example.com",
      "position": "bottom-center",
      "label": "Source URL"
    }
  }'
```

---

#### `GET /templates/:name/preview` — Template Preview 🆕

Generate a sample PDF from any built-in template using pre-configured data. Perfect for exploring templates before integrating.

```bash
curl http://localhost:3000/templates/invoice/preview
```

---

### 📸 Screenshots

#### `POST /html-to-image` — HTML → Image

```json
{
  "html_content": "<div style='padding:20px;background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;'><h1>Hello!</h1></div>",
  "format": "png",
  "full_page": true,
  "watermark": { "text": "DRAFT" }
}
```

#### `POST /url-to-image` — URL → Image

```json
{
  "url": "https://example.com",
  "format": "webp",
  "quality": 85,
  "page_size": "a4"
}
```

**Supported formats:** `png`, `jpeg`, `webp`

---

### 📱 QR Code & Barcode

#### `POST /qr-code` — Standalone QR Code

Generate QR code as image file or base64.

```bash
curl -X POST http://localhost:3000/qr-code \
  -H "Content-Type: application/json" \
  -d '{
    "text": "https://example.com",
    "width": 400,
    "color": "#1a1a2e",
    "background": "#ffffff",
    "errorLevel": "H",
    "format": "base64"
  }'
```

| Parameter    | Type      | Default   | Description                          |
| ------------ | --------- | --------- | ------------------------------------ |
| `text`       | `string`  | —         | **Required.** Content to encode      |
| `width`      | `integer` | `300`     | Image width in pixels                |
| `margin`     | `integer` | `2`       | Quiet zone margin                    |
| `color`      | `string`  | `#000000` | QR code color                        |
| `background` | `string`  | `#ffffff` | Background color                     |
| `errorLevel` | `string`  | `M`       | Error correction: `L`, `M`, `Q`, `H` |
| `format`     | `string`  | `file`    | `file` (PNG download) or `base64`    |

---

#### `POST /barcode` — Standalone Barcode

Generate barcode in 11+ formats.

```bash
curl -X POST http://localhost:3000/barcode \
  -H "Content-Type: application/json" \
  -d '{
    "text": "8901234567890",
    "type": "ean13",
    "height": 15,
    "includetext": true,
    "format": "base64"
  }'
```

**Supported Barcode Types:**

| Type         | Description             | Example Input     |
| ------------ | ----------------------- | ----------------- |
| `code128`    | Universal (default)     | Any text/numbers  |
| `ean13`      | European Article Number | 13 digits         |
| `ean8`       | Short EAN               | 8 digits          |
| `upca`       | US Product Code         | 12 digits         |
| `upce`       | Short UPC               | 8 digits          |
| `itf14`      | Shipping containers     | 14 digits         |
| `code39`     | Alphanumeric            | A-Z, 0-9, special |
| `code93`     | Extended Code 39        | A-Z, 0-9, special |
| `datamatrix` | 2D Matrix               | Any text          |
| `pdf417`     | 2D Stacked              | Any text          |
| `qrcode`     | QR (via bwip-js)        | Any text          |

---

#### `POST /qr-pdf` — QR Code Embedded in PDF

Generate a styled PDF document with an embedded QR code.

```json
{
  "text": "https://example.com/verify/doc-123",
  "title": "Document Verification",
  "description": "Scan this QR code to verify the authenticity of this document.",
  "width": 400,
  "color": "#1a1a2e"
}
```

---

### 🔐 Security & Encryption

#### `POST /encrypt-pdf` — PDF Password Protection 🆕

Add AES-256 encryption to an existing PDF file.

```bash
curl -X POST http://localhost:3000/encrypt-pdf \
  -H "Content-Type: application/json" \
  -d '{
    "filename": "invoice_1234567890.pdf",
    "password": "mySecret123"
  }'
```

**Response:**

```json
{
  "status": "success",
  "message": "PDF encrypted with password protection",
  "source": "invoice_1234567890.pdf",
  "file_url": "http://localhost:3000/output/encrypted_1234567890.pdf",
  "filename": "encrypted_1234567890.pdf",
  "encryption": "AES-256"
}
```

---

#### `POST /sign-pdf` — Digital Signature Stamp 🆕

Embed a signature stamp image onto a specific page of a PDF.

```bash
curl -X POST http://localhost:3000/sign-pdf \
  -H "Content-Type: application/json" \
  -d '{
    "filename": "contract.pdf",
    "signature_name": "ceo_signature",
    "position": "bottom-right",
    "page": 0,
    "width": 120,
    "height": 60,
    "opacity": 0.9
  }'
```

| Parameter          | Type      | Default        | Description                                                                                               |
| ------------------ | --------- | -------------- | --------------------------------------------------------------------------------------------------------- |
| `filename`         | `string`  | —              | **Required.** PDF in output folder                                                                        |
| `signature_name`   | `string`  | —              | Name of saved signature stamp                                                                             |
| `signature_base64` | `string`  | —              | OR inline base64 image (PNG/JPG)                                                                          |
| `position`         | `string`  | `bottom-right` | `bottom-right`, `bottom-left`, `bottom-center`, `top-right`, `top-left`, `top-center`, `center`, `custom` |
| `page`             | `integer` | `0` (last)     | Page to sign (1-based, 0 = last page)                                                                     |
| `width`            | `integer` | `120`          | Signature width in points                                                                                 |
| `height`           | `integer` | `60`           | Signature height in points                                                                                |
| `opacity`          | `number`  | `1.0`          | Opacity (0.0 – 1.0)                                                                                       |
| `x`, `y`           | `number`  | —              | Custom coordinates (if `position: "custom"`)                                                              |

---

#### `POST /secure/generate` — Generate Signed URL 🆕

Create a time-limited, tamper-proof URL for file access.

```bash
curl -X POST http://localhost:3000/secure/generate \
  -H "Content-Type: application/json" \
  -d '{
    "filename": "invoice_1234567890.pdf",
    "expiry_minutes": 30
  }'
```

**Response:**

```json
{
  "status": "success",
  "signed_url": "http://localhost:3000/secure/invoice_123.pdf?expires=1770981166331&sig=fec796a0...",
  "expires_at": "2026-02-13T11:12:46.331Z",
  "expires_in_minutes": 30
}
```

#### `GET /secure/:filename` — Access File via Signed URL

Access a file using a valid signed URL. Returns `403` if the signature is invalid or expired.

```bash
# Use the signed_url from the generate response
curl "http://localhost:3000/secure/invoice_123.pdf?expires=1770981166331&sig=fec796a0..."
```

---

### 🔄 Conversion

#### `POST /pdf-to-image` — PDF → Image

```json
{
  "filename": "document_abc123.pdf",
  "format": "png",
  "quality": 90,
  "page_size": "a4"
}
```

#### `POST /to-csv` — Data → CSV

```json
{
  "columns": ["Name", "Email", "Role"],
  "rows": [
    ["John", "john@example.com", "Admin"],
    ["Jane", "jane@example.com", "User"]
  ],
  "filename": "users.csv"
}
```

---

### ⚡️ Advanced Operations

#### `POST /merge` — Merge Multiple PDFs

```json
{
  "files": ["invoice_001.pdf", "invoice_002.pdf", "invoice_003.pdf"],
  "filename": "merged_invoices.pdf"
}
```

#### `POST /batch` — Batch Template Generation

Generate multiple documents from a template and merge into one PDF.

```json
{
  "template": "label",
  "batch": [
    { "name": "Package 1", "address": "Jl. Sudirman 1" },
    { "name": "Package 2", "address": "Jl. Thamrin 5" }
  ]
}
```

#### `POST /webhook` — Async Generation with Webhook & Retry 🆕

Generate a PDF asynchronously and deliver the result to your webhook URL with configurable retry and exponential backoff.

```json
{
  "source": { "html": "<h1>Invoice</h1>" },
  "webhook_url": "https://yourserver.com/callback",
  "options": {
    "page_size": "a4",
    "watermark": { "text": "PREVIEW" },
    "qr_code": { "text": "INV-001", "position": "top-right" },
    "max_retries": 5,
    "retry_delay_ms": 2000
  }
}
```

| Parameter                | Type      | Default | Description                                               |
| ------------------------ | --------- | ------- | --------------------------------------------------------- |
| `webhook_url`            | `string`  | —       | **Required.** URL to receive the result                   |
| `source.html`            | `string`  | —       | HTML content (or use `source.url` or `template` + `data`) |
| `source.url`             | `string`  | —       | URL to capture                                            |
| `template`               | `string`  | —       | Template name                                             |
| `data`                   | `object`  | —       | Template data                                             |
| `options.max_retries`    | `integer` | `3`     | Max delivery retry attempts                               |
| `options.retry_delay_ms` | `integer` | `3000`  | Base delay between retries (exponential backoff)          |

---

### ❤️ Monitoring

#### `GET /health` — System Health Check 🆕

Returns real-time system status, browser health, and resource usage. No authentication required.

```bash
curl http://localhost:3000/health
```

**Response:**

```json
{
  "status": "healthy",
  "version": "7.0.0",
  "uptime_seconds": 3600,
  "system": {
    "platform": "linux",
    "cpus": 8,
    "load_avg": [1.5, 1.2, 1.0],
    "total_memory_mb": 32029,
    "free_memory_mb": 15783
  },
  "process": {
    "pid": 1,
    "rss_mb": 82,
    "heap_used_mb": 22
  },
  "browser": {
    "connected": true,
    "pages": 0,
    "launch_count": 1,
    "version": "Chrome/131.0.6778.204"
  },
  "storage": {
    "output_files": 12,
    "total_size_mb": 4.5
  }
}
```

Returns `200` when healthy, `503` when degraded (browser disconnected).

---

### 📂 File Management

| Method   | Endpoint            | Description                       |
| -------- | ------------------- | --------------------------------- |
| `GET`    | `/files`            | List all generated files          |
| `DELETE` | `/files/:filename`  | Delete a specific file            |
| `POST`   | `/cleanup`          | Remove old files                  |
| `GET`    | `/output/:filename` | Direct file download              |
| `GET`    | `/templates`        | List all templates & capabilities |

---

### 🔐 Admin Panel

Access the web-based admin panel at `/admin-panel`.

| Method  | Endpoint          | Description                    |
| ------- | ----------------- | ------------------------------ |
| `POST`  | `/admin/login`    | Authenticate and get JWT token |
| `GET`   | `/admin/stats`    | Usage statistics & charts      |
| `GET`   | `/admin/logs`     | Request history                |
| `GET`   | `/admin/system`   | System info & capabilities     |
| `PATCH` | `/admin/settings` | Update global settings         |
| `POST`  | `/admin/reset`    | Reset all statistics           |

**API Key Management:**
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/admin/keys` | List all API keys |
| `POST` | `/admin/keys` | Create new API key |
| `PATCH` | `/admin/keys/:id` | Update API key |
| `DELETE` | `/admin/keys/:id` | Delete API key |

**Custom Template Management:**
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/admin/templates/custom` | List custom templates |
| `GET` | `/admin/templates/custom/:name` | Get template source |
| `POST` | `/admin/templates/custom` | Create/update template |
| `DELETE` | `/admin/templates/custom/:name` | Delete template |

**Digital Signature Management:** 🆕
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/admin/signatures` | List all signature stamps |
| `POST` | `/admin/signatures` | Upload signature stamp (base64 image) |
| `DELETE` | `/admin/signatures/:name` | Delete signature stamp |

---

## 📱 Embedded QR Code & Barcode in PDFs

**This is the key feature** — you can embed QR codes and barcodes directly into **any** PDF or image generation endpoint by adding the `qr_code` or `barcode` parameter.

#### QR Code Params

```json
{
  "qr_code": {
    "text": "https://example.com/receipt/TRX-001",
    "position": "bottom-right",
    "width": 120,
    "color": "#000000",
    "background": "#ffffff",
    "margin": 1,
    "label": "Scan to verify"
  }
}
```

| Position Options | Description                            |
| ---------------- | -------------------------------------- |
| `top-left`       | Fixed at top-left corner               |
| `top-right`      | Fixed at top-right corner              |
| `top-center`     | Fixed at top-center                    |
| `bottom-left`    | Fixed at bottom-left corner            |
| `bottom-right`   | Fixed at bottom-right corner (default) |
| `bottom-center`  | Fixed at bottom-center                 |
| `center`         | Fixed at center of page                |
| `inline`         | Appended at the end of content         |

#### Barcode Params

```json
{
  "barcode": {
    "text": "TRX-2026-0001",
    "type": "code128",
    "position": "inline",
    "height": 8,
    "scale": 2,
    "includetext": true,
    "label": "Transaction ID"
  }
}
```

#### 💡 Example: Receipt with QR Code + Barcode

```bash
curl -X POST http://localhost:3000/cetak_struk_pdf \
  -H "Content-Type: application/json" \
  -d '{
    "html_content": "<div style=\"font-family:monospace;width:300px;padding:20px;\"><h2 style=\"text-align:center;\">TOKO SERBA ADA</h2><hr><p>Item 1 ........... Rp 25.000</p><p>Item 2 ........... Rp 15.000</p><hr><p><strong>TOTAL: Rp 40.000</strong></p></div>",
    "page_size": "thermal_80mm",
    "qr_code": {
      "text": "https://toko.com/verify/TRX-001",
      "position": "inline",
      "width": 100,
      "label": "Scan untuk verifikasi"
    },
    "barcode": {
      "text": "TRX-2026-0001",
      "type": "code128",
      "position": "inline"
    }
  }'
```

#### 💡 Example: Invoice Template with QR Code

```bash
curl -X POST http://localhost:3000/generate \
  -H "Content-Type: application/json" \
  -d '{
    "template": "invoice",
    "data": {
      "invoice_no": "INV-2026-042",
      "company_name": "PT Maju Jaya",
      "items": [{"name": "Konsultasi IT", "qty": 1, "price": 5000000}]
    },
    "qr_code": {
      "text": "https://payment.com/pay/INV-2026-042",
      "position": "top-right",
      "width": 80,
      "label": "Scan to Pay"
    }
  }'
```

---

## 📑 Header, Footer & Page Numbers

Add custom headers and footers with automatic page numbering to any PDF endpoint.

```json
{
  "html_content": "<h1>My Report</h1><p>Long content here...</p>",
  "page_size": "a4",
  "options": {
    "displayHeaderFooter": true,
    "headerTemplate": "<div style='font-size:10px; text-align:center; width:100%; border-bottom:1px solid #ddd; padding:5px 0;'>PT Company Name — Confidential</div>",
    "footerTemplate": "<div style='font-size:9px; width:100%; display:flex; justify-content:space-between; padding:5px 20px;'><span>Printed: <span class='date'></span></span><span>Page <span class='pageNumber'></span> of <span class='totalPages'></span></span></div>",
    "margin": {
      "top": "60px",
      "bottom": "60px",
      "left": "20px",
      "right": "20px"
    }
  }
}
```

**Available Variables in Header/Footer:**

| Variable                           | Description           |
| ---------------------------------- | --------------------- |
| `<span class="date"></span>`       | Current date          |
| `<span class="title"></span>`      | Page title            |
| `<span class="url"></span>`        | Page URL              |
| `<span class="pageNumber"></span>` | Current page number   |
| `<span class="totalPages"></span>` | Total number of pages |

> **⚠️ Important:** Header and footer templates must use inline styles. External CSS and `<link>` tags are not supported. Font size must be explicitly set (Chromium defaults to very small text).

---

## 🎨 Custom Templates

### Creating via Admin Panel

1. Login to Admin Panel at `/admin-panel`
2. Navigate to **Templates** section
3. Click **+ New Template**
4. Write your HTML template using `{{variable}}` syntax for dynamic data
5. Set page size, category, and define variables
6. Preview and save

### Using Custom Templates

Once saved, use them exactly like built-in templates:

```bash
curl -X POST http://localhost:3000/generate \
  -H "Content-Type: application/json" \
  -d '{
    "template": "my_custom_receipt",
    "data": {
      "store_name": "Toko ABC",
      "total": "Rp 150.000",
      "date": "2026-02-13"
    }
  }'
```

### Template HTML Example

```html
<!DOCTYPE html>
<html>
  <head>
    <style>
      body {
        font-family: "Segoe UI", sans-serif;
        padding: 30px;
      }
      .header {
        text-align: center;
        border-bottom: 2px solid #333;
        padding-bottom: 10px;
      }
      .amount {
        font-size: 24px;
        font-weight: bold;
        color: #2563eb;
      }
    </style>
  </head>
  <body>
    <div class="header">
      <h1>{{store_name}}</h1>
      <p>{{date}}</p>
    </div>
    <div class="amount">Total: {{total}}</div>
  </body>
</html>
```

### Built-in Templates

| Template     | Description                                 | Default Page      | Preview |
| ------------ | ------------------------------------------- | ----------------- | ------- |
| `indomaret`  | Thermal receipt (Indomaret/Alfamart style)  | `thermal_default` | ✅      |
| `modern`     | Modern minimalist receipt                   | `thermal_default` | ✅      |
| `invoice`    | Professional A4 invoice with tax            | `a4`              | ✅      |
| `surat`      | Official letter with letterhead & signature | `a4`              | ✅      |
| `sertifikat` | Certificate/award with decorative border    | `sertifikat`      | ✅      |
| `label`      | Shipping label (100×150mm)                  | `label`           | ✅      |

> **💡 New:** All built-in templates now support `GET /templates/:name/preview` for instant sample PDF generation!

---

## 🔒 Authentication & Security

### Security Headers (Helmet.js) 🆕

All responses include enterprise-grade security headers:

```
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-Frame-Options: SAMEORIGIN
X-XSS-Protection: 0
X-DNS-Prefetch-Control: off
X-Download-Options: noopen
X-Permitted-Cross-Domain-Policies: none
```

### API Key Authentication

All endpoints support API key authentication via the `x-api-key` header.

```bash
curl -H "x-api-key: hp_your_secret_key" http://localhost:3000/files
```

**API Key Features:**

- 🎯 Per-key **quota limits** (total requests allowed, -1 for unlimited)
- ⏱️ Per-key **rate limiting** (requests per minute)
- 🔄 **Active/Inactive** state management
- 📊 **Usage tracking** per key

### Admin Authentication (JWT)

```bash
# Get JWT token
curl -X POST http://localhost:3000/admin/login \
  -H "Content-Type: application/json" \
  -d '{ "username": "admin", "password": "yourpassword" }'

# Use JWT for admin endpoints
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:3000/admin/stats
```

### Guest Access Mode

Configure via Admin Panel or settings:

- **Public Mode** (`allow_guest_access: true`) — No API key required
- **Private Mode** (`allow_guest_access: false`) — API key required for all requests

### Signed URLs 🆕

Generate time-limited, tamper-proof URLs for secure file distribution:

```bash
# Generate a signed URL valid for 30 minutes
curl -X POST http://localhost:3000/secure/generate \
  -H "Content-Type: application/json" \
  -d '{ "filename": "invoice.pdf", "expiry_minutes": 30 }'
```

The signed URL uses HMAC-SHA256 to ensure the URL cannot be tampered with. Once expired, the URL returns `403 Forbidden`.

### PDF Password Protection

Any PDF endpoint supports inline password protection (requires `qpdf`):

```json
{
  "html_content": "<h1>Secret Document</h1>",
  "password": "mysecretpassword"
}
```

Or encrypt an existing PDF:

```json
POST /encrypt-pdf
{ "filename": "existing.pdf", "password": "secret" }
```

---

## ⚙️ Configuration

### Environment Variables

| Variable                    | Default                                | Description                           |
| --------------------------- | -------------------------------------- | ------------------------------------- |
| `PORT`                      | `3000`                                 | Server port                           |
| `ADMIN_USERNAME`            | `admin`                                | Admin panel username                  |
| `ADMIN_PASSWORD`            | `admin123`                             | Admin panel password ⚠️               |
| `JWT_SECRET`                | `html-to-pdf-secret-key-change-in-...` | JWT signing secret ⚠️                 |
| `AUTO_CLEANUP_HOURS`        | `24`                                   | Auto-delete files older than N hours  |
| `MAX_BODY_SIZE`             | `10mb`                                 | Maximum request body size             |
| `CORS_ORIGINS`              | `*`                                    | Comma-separated allowed origins 🆕    |
| `REQUEST_TIMEOUT_MS`        | `120000`                               | Per-request timeout in ms 🆕          |
| `SIGNED_URL_SECRET`         | `signed-url-secret-change-me`          | HMAC-SHA256 secret for signed URLs 🆕 |
| `SIGNED_URL_EXPIRY_MINUTES` | `60`                                   | Default signed URL expiry 🆕          |
| `WEBHOOK_MAX_RETRIES`       | `3`                                    | Max webhook delivery retries 🆕       |
| `WEBHOOK_RETRY_DELAY_MS`    | `3000`                                 | Base webhook retry delay 🆕           |
| `BROWSER_POOL_SIZE`         | `1`                                    | Number of browser instances           |
| `PUPPETEER_EXECUTABLE_PATH` | `/usr/bin/chromium`                    | Path to Chromium binary               |

> **⚠️ Security Warning:** The API will display warnings at startup if `ADMIN_PASSWORD`, `JWT_SECRET`, or `SIGNED_URL_SECRET` are using default values. Always change these in production!

### Page Size Presets

| Preset            | Dimensions    | Use Case                 |
| ----------------- | ------------- | ------------------------ |
| `thermal_58mm`    | 220px width   | Small thermal printer    |
| `thermal_80mm`    | 302px width   | Standard thermal printer |
| `thermal_default` | 380px width   | Wide thermal printer     |
| `a4`              | 210mm × 297mm | Standard document        |
| `a5`              | 148mm × 210mm | Half A4                  |
| `letter`          | 8.5in × 11in  | US Letter                |
| `legal`           | 8.5in × 14in  | US Legal 🆕              |
| `label`           | 100mm × 150mm | Shipping label           |
| `sertifikat`      | 297mm × 210mm | Landscape certificate    |

---

## 🐳 Deployment

### Docker Hub

```bash
docker pull bagose/html-to-pdf-api:latest
docker pull bagose/html-to-pdf-api:7.0.0
```

### Build from Source

```bash
git clone https://github.com/volumeee/html-to-pdf-api.git
cd html-to-pdf-api
docker build -t html-to-pdf-api .
docker run -d -p 3000:3000 \
  -v pdf_output:/app/output \
  -v pdf_data:/app/data \
  html-to-pdf-api
```

### Docker Compose (Production)

A ready-to-use `docker-compose.yml` is included in the repository with:

- ✅ Health check (every 30s)
- ✅ Resource limits (1GB RAM, 1 CPU)
- ✅ Named volumes for persistence
- ✅ Log rotation (10MB, 3 files)
- ✅ Auto-restart on failure

```bash
docker compose up -d
```

### Production Checklist

- [ ] Set strong `ADMIN_PASSWORD`, `JWT_SECRET`, and `SIGNED_URL_SECRET`
- [ ] Mount volumes for data persistence
- [ ] Set `CORS_ORIGINS` to specific domains (not `*`)
- [ ] Disable guest access in production: `allow_guest_access: false`
- [ ] Create API keys for each integration
- [ ] Configure rate limits per API key
- [ ] Set up reverse proxy (nginx/traefik) with HTTPS
- [ ] Monitor `/health` endpoint
- [ ] Configure log rotation and monitoring

---

## 📊 API Response Format

All responses follow a consistent JSON format:

**Success:**

```json
{
  "status": "success",
  "file_url": "http://localhost:3000/output/document_abc123.pdf",
  "filename": "document_abc123.pdf",
  "message": "PDF created successfully"
}
```

**Error:**

```json
{
  "status": "error",
  "error": "html_content is required"
}
```

**Timeout:**

```json
{
  "status": "error",
  "error": "Request timeout",
  "message": "Request exceeded 120s limit"
}
```

---

## 📖 Interactive API Documentation

Full Swagger/OpenAPI documentation is available at:

```
http://localhost:3000/docs
```

All v7.0.0 endpoints are documented including the new Security, Monitoring, and Signature management endpoints.

---

## 🛠 Tech Stack

| Component        | Technology            |
| ---------------- | --------------------- |
| Runtime          | Node.js 20+           |
| Framework        | Express.js            |
| Rendering        | Puppeteer (Chromium)  |
| PDF Manipulation | pdf-lib               |
| QR Code          | qrcode                |
| Barcode          | bwip-js               |
| PDF Encryption   | qpdf (AES-256)        |
| Security         | Helmet.js, bcryptjs   |
| Auth             | JWT + API Keys        |
| Docs             | Swagger UI            |
| Container        | Docker (Node 20 Slim) |
| Orchestration    | Docker Compose        |

---

## 📝 Changelog

### v7.0.0 (2026-02-13)

- 🔐 **Security:** Helmet.js headers, configurable CORS, request timeout, environment validation
- ✨ **New:** PDF encryption (AES-256), digital signature stamps, signed URLs
- ✨ **New:** Health check endpoint with system metrics
- ✨ **New:** Template preview with sample data
- ✨ **New:** Webhook retry with exponential backoff
- ✨ **New:** Admin signature management (upload/list/delete)
- 🐳 **DevOps:** Docker Compose, Dockerfile health check
- ⚡ **Performance:** Top-level imports in renderer
- 📐 **Size:** Legal page size preset added
- 🛡️ **Stability:** Graceful shutdown with connection draining

### v6.0.0

- 📱 QR Code & Barcode embedding in PDFs
- 🎨 Custom template upload via Admin Panel
- 📊 Enhanced admin dashboard with charts
- 🔒 PDF password protection inline
- 📑 Batch generation & PDF merge

### v5.0.0

- 🖥️ Admin Panel web dashboard
- 🔑 API Key management with quotas
- 📈 Usage statistics and request logging

### v4.0.0

- 📸 Screenshot endpoints (HTML/URL → Image)
- 🔄 PDF to Image conversion
- 📝 CSV export

### v3.0.0

- 🎨 Built-in templates (invoice, receipt, certificate, letter, label)
- 💧 Watermark support

### v2.0.0

- 🌐 URL to PDF conversion
- 📄 Header/Footer with page numbers

### v1.0.0

- 📄 Basic HTML to PDF conversion

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<p align="center">
  Built with ❤️ for seamless document generation integration.
  <br />
  <a href="https://github.com/volumeee/html-to-pdf-api">GitHub</a> •
  <a href="https://hub.docker.com/r/bagose/html-to-pdf-api">Docker Hub</a> •
  <a href="http://localhost:3000/docs">API Docs</a>
</p>
