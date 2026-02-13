<p align="center">
  <h1 align="center">📄 HTML to PDF API v6.0.0</h1>
  <p align="center">
    <strong>Universal Document Generation & Conversion Platform</strong>
  </p>
  <p align="center">
    HTML/URL → PDF • Screenshot • QR Code • Barcode • Custom Templates • API Key Management
  </p>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/version-6.0.0-blue.svg" alt="Version" />
  <img src="https://img.shields.io/badge/node-%3E%3D18-brightgreen.svg" alt="Node.js" />
  <img src="https://img.shields.io/badge/license-MIT-green.svg" alt="License" />
  <img src="https://img.shields.io/badge/docker-ready-2496ED.svg" alt="Docker" />
  <img src="https://img.shields.io/badge/puppeteer-powered-blueviolet.svg" alt="Puppeteer" />
</p>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Architecture](#-architecture)
- [Quick Start](#-quick-start)
- [API Endpoints](#-api-endpoints)
  - [PDF Generation](#-pdf-generation)
  - [Screenshots](#-screenshots)
  - [QR Code & Barcode](#-qr-code--barcode)
  - [Conversion](#-conversion)
  - [Advanced Operations](#%EF%B8%8F-advanced-operations)
  - [File Management](#-file-management)
  - [Admin Panel](#-admin-panel)
- [Embedded QR Code & Barcode in PDFs](#-embedded-qr-code--barcode-in-pdfs)
- [Header, Footer & Page Numbers](#-header-footer--page-numbers)
- [Custom Templates](#-custom-templates)
- [Authentication & Security](#-authentication--security)
- [Configuration](#%EF%B8%8F-configuration)
- [Deployment](#-deployment)

---

## 🎯 Overview

**HTML to PDF API** is a self-hosted, production-ready API server for document generation and conversion. Built with **Node.js**, **Express**, and **Puppeteer**, it provides a comprehensive suite of tools for:

- 📄 **PDF Generation** — Convert HTML, URLs, or templates to PDF with pixel-perfect rendering
- 📸 **Screenshots** — Capture full-page or viewport screenshots in PNG, JPEG, or WebP
- 📱 **QR Codes & Barcodes** — Generate standalone or embed directly into PDFs/receipts
- 🎨 **Custom Templates** — Upload and manage HTML templates via Admin Panel
- 📑 **Advanced Operations** — Merge PDFs, batch generation, async webhooks
- 🔒 **Enterprise Security** — API keys with quotas, rate limiting, JWT admin auth
- 🖥️ **Admin Dashboard** — Full-featured web panel for monitoring and configuration

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Express Server                       │
├──────┬──────┬──────┬──────┬──────┬──────┬──────────────┤
│ PDF  │Screen│ QR/  │ File │Admin │ Adv  │ Convert      │
│Routes│ shot │Barcd │Mgmt  │Panel │ anced│ Routes       │
├──────┴──────┴──────┴──────┴──────┴──────┴──────────────┤
│              Middleware Layer                            │
│  API Key Auth │ Rate Limiter │ Body Parser │ CORS       │
├─────────────────────────────────────────────────────────┤
│              Service Layer                              │
│  Renderer │ QR/Barcode │ Templates │ File Manager       │
├─────────────────────────────────────────────────────────┤
│  Puppeteer (Chromium) │ qrcode │ bwip-js │ qpdf        │
└─────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### Docker (Recommended)

```bash
docker run -d \
  --name pdf-api \
  -p 3000:3000 \
  -v $(pwd)/data:/app/data \
  -e ADMIN_USERNAME=admin \
  -e ADMIN_PASSWORD=yourpassword \
  -e JWT_SECRET=your_random_secret_key \
  --restart always \
  bagose/html-to-pdf-api:latest
```

### Docker Compose

```yaml
version: "3.8"
services:
  pdf-api:
    image: bagose/html-to-pdf-api:latest
    container_name: pdf-api
    ports:
      - "3000:3000"
    volumes:
      - ./data:/app/data
    environment:
      - ADMIN_USERNAME=admin
      - ADMIN_PASSWORD=yourpassword
      - JWT_SECRET=your_random_secret_key
      - AUTO_CLEANUP_HOURS=24
    restart: always
```

### Manual Installation

```bash
git clone https://github.com/volumeee/html-to-pdf-api.git
cd html-to-pdf-api
npm install
node server.js
```

> **💡 Tip:** Use the `-v $(pwd)/data:/app/data` volume mount to persist API keys, custom templates, and application settings across container restarts.

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
| `page_size` | `string` | `thermal_58mm`, `thermal_80mm`, `thermal_default`, `a4`, `a5`, `letter`, `label`, `sertifikat` |
| `watermark` | `object` | `{ text, opacity, color, fontSize, rotate }` |
| `qr_code` | `object` | Embed QR code (see [QR Code Params](#qr-code-params)) |
| `barcode` | `object` | Embed barcode (see [Barcode Params](#barcode-params)) |
| `options` | `object` | Additional options: `{ displayHeaderFooter, headerTemplate, footerTemplate, margin, landscape }` |
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

### 📸 Screenshots

#### `POST /html-to-image` — HTML → Image

```json
{
  "html_content": "<div style='padding:20px;background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;'><h1>Hello!</h1></div>",
  "format": "png",
  "full_page": true,
  "qr_code": { "text": "https://example.com", "position": "bottom-right" }
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

### 📱 Embedded QR Code & Barcode in PDFs

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
    "html_content": "<div style=\"font-family:monospace;width:300px;padding:20px;\"><h2 style=\"text-align:center;\">TOKO SERBA ADA</h2><hr><p>Item 1 ........... Rp 25.000</p><p>Item 2 ........... Rp 15.000</p><hr><p><strong>TOTAL: Rp 40.000</strong></p><p style=\"font-size:10px;color:#888;\">Terima kasih telah berbelanja!</p></div>",
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

### 📑 Header, Footer & Page Numbers

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

```json
{
  "template": "label",
  "items": [
    { "data": { "name": "Package 1", "address": "Jl. Sudirman 1" } },
    { "data": { "name": "Package 2", "address": "Jl. Thamrin 5" } }
  ]
}
```

#### `POST /webhook` — Async Generation with Webhook

```json
{
  "template": "invoice",
  "data": { "invoice_no": "INV-001" },
  "webhook_url": "https://yourserver.com/callback",
  "webhook_method": "POST"
}
```

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

| Template     | Description                                 | Default Page      |
| ------------ | ------------------------------------------- | ----------------- |
| `indomaret`  | Thermal receipt (Indomaret/Alfamart style)  | `thermal_default` |
| `modern`     | Modern minimalist receipt                   | `thermal_default` |
| `invoice`    | Professional A4 invoice with tax            | `a4`              |
| `surat`      | Official letter with letterhead & signature | `a4`              |
| `sertifikat` | Certificate/award with decorative border    | `sertifikat`      |
| `label`      | Shipping label (100x150mm)                  | `label`           |

---

## 🔒 Authentication & Security

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

### PDF Password Protection

Any PDF endpoint supports password protection (requires `qpdf` installed in container):

```json
{
  "html_content": "<h1>Secret Document</h1>",
  "password": "mysecretpassword"
}
```

---

## ⚙️ Configuration

### Environment Variables

| Variable                    | Default             | Description                          |
| --------------------------- | ------------------- | ------------------------------------ |
| `PORT`                      | `3000`              | Server port                          |
| `ADMIN_USERNAME`            | `admin`             | Admin panel username                 |
| `ADMIN_PASSWORD`            | `admin123`          | Admin panel password                 |
| `JWT_SECRET`                | `auto-generated`    | JWT signing secret                   |
| `AUTO_CLEANUP_HOURS`        | `24`                | Auto-delete files older than N hours |
| `MAX_BODY_SIZE`             | `10mb`              | Maximum request body size            |
| `PUPPETEER_EXECUTABLE_PATH` | `/usr/bin/chromium` | Path to Chromium binary              |

### Page Size Presets

| Preset            | Dimensions    | Use Case                 |
| ----------------- | ------------- | ------------------------ |
| `thermal_58mm`    | 220px width   | Small thermal printer    |
| `thermal_80mm`    | 302px width   | Standard thermal printer |
| `thermal_default` | 380px width   | Wide thermal printer     |
| `a4`              | 210mm × 297mm | Standard document        |
| `a5`              | 148mm × 210mm | Half A4                  |
| `letter`          | 8.5in × 11in  | US Letter                |
| `label`           | 100mm × 150mm | Shipping label           |
| `sertifikat`      | 297mm × 210mm | Landscape certificate    |

---

## 🐳 Deployment

### Docker Hub

```bash
docker pull bagose/html-to-pdf-api:latest
docker pull bagose/html-to-pdf-api:6.0.0
```

### Build from Source

```bash
docker build -t html-to-pdf-api .
docker run -d -p 3000:3000 -v $(pwd)/data:/app/data html-to-pdf-api
```

### Production Checklist

- [ ] Set strong `ADMIN_PASSWORD` and `JWT_SECRET`
- [ ] Mount data volume for persistence: `-v $(pwd)/data:/app/data`
- [ ] Disable guest access in production: `allow_guest_access: false`
- [ ] Create API keys for each integration
- [ ] Configure rate limits per API key
- [ ] Set up reverse proxy (nginx/traefik) with HTTPS

---

## 📊 API Response Format

All responses follow a consistent format:

```json
{
  "status": "success",
  "file_url": "http://localhost:3000/output/document_abc123.pdf",
  "filename": "document_abc123.pdf",
  "message": "PDF created successfully"
}
```

Error responses:

```json
{
  "status": "error",
  "error": "html_content is required"
}
```

---

## 📖 Interactive API Documentation

Full Swagger/OpenAPI documentation is available at:

```
http://localhost:3000/docs
```

---

## 🛠 Tech Stack

| Component    | Technology           |
| ------------ | -------------------- |
| Runtime      | Node.js 18+          |
| Framework    | Express.js           |
| Rendering    | Puppeteer (Chromium) |
| QR Code      | qrcode               |
| Barcode      | bwip-js              |
| PDF Security | qpdf                 |
| Auth         | JWT + API Keys       |
| Docs         | Swagger UI           |
| Container    | Docker (Alpine)      |

---

<p align="center">
  Built with ❤️ for seamless document generation integration.
  <br />
  <a href="https://github.com/volumeee/html-to-pdf-api">GitHub</a> •
  <a href="https://hub.docker.com/r/bagose/html-to-pdf-api">Docker Hub</a>
</p>
