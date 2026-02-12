<p align="center">
  <img src="https://img.icons8.com/fluency/96/pdf-2.png" alt="Logo" width="96" height="96">
  <h1 align="center">HTML to PDF API</h1>
  <p align="center">
    <strong>High-fidelity HTML/CSS to PDF converter — optimized for thermal receipts 🧾</strong>
  </p>
  <p align="center">
    <a href="https://hub.docker.com/r/bagose/html-to-pdf-api">
      <img src="https://img.shields.io/docker/pulls/bagose/html-to-pdf-api?style=for-the-badge&logo=docker&logoColor=white&color=2496ED" alt="Docker Pulls">
    </a>
    <a href="https://hub.docker.com/r/bagose/html-to-pdf-api">
      <img src="https://img.shields.io/docker/image-size/bagose/html-to-pdf-api/latest?style=for-the-badge&logo=docker&logoColor=white&color=1D63ED" alt="Docker Image Size">
    </a>
    <a href="https://github.com/volumeee/html-to-pdf-api/blob/main/LICENSE">
      <img src="https://img.shields.io/github/license/volumeee/html-to-pdf-api?style=for-the-badge&color=green" alt="License">
    </a>
  </p>
</p>

---

## ✨ Features

- 🖨️ **Thermal Receipt Optimized** — Preset 380px width, perfect for POS printers
- 🎨 **Full CSS Support** — Inline styles & `<style>` tags rendered accurately
- ⚡ **Fast & Lightweight** — Powered by Puppeteer with new Headless Chrome
- 🐳 **Docker Ready** — One command to deploy anywhere
- 🔗 **Returns Download URL** — Get a direct link to the generated PDF
- 🛡️ **Production Ready** — Auto-restart, CORS enabled, error handling

---

## 🚀 Quick Start

### Using Docker (Recommended)

```bash
docker run -d \
  --name html-to-pdf \
  --restart always \
  -p 3000:3000 \
  bagose/html-to-pdf-api:latest
```

Your API is now running at `http://localhost:3000` 🎉

### Using Node.js

```bash
git clone https://github.com/volumeee/html-to-pdf-api.git
cd html-to-pdf-api
npm install
npm start
```

---

## 📡 API Reference

### `POST /cetak_struk_pdf`

Convert HTML content to a PDF file.

#### Request

| Parameter      | Type     | Required | Description                                        |
| -------------- | -------- | -------- | -------------------------------------------------- |
| `html_content` | `string` | ✅ Yes   | Full HTML string to render                         |
| `filename`     | `string` | ❌ No    | Custom filename (default: `struk_<timestamp>.pdf`) |

#### Example Request

```bash
curl -X POST http://localhost:3000/cetak_struk_pdf \
  -H "Content-Type: application/json" \
  -d '{
    "html_content": "<html><body style=\"width:380px;font-family:Courier New;\"><h2 style=\"text-align:center;\">MY STORE</h2><hr><table style=\"width:100%;\"><tr><td>Coffee x2</td><td style=\"text-align:right;\">Rp 30.000</td></tr><tr><td>Bread x1</td><td style=\"text-align:right;\">Rp 15.000</td></tr></table><hr><p style=\"text-align:right;font-weight:bold;\">TOTAL: Rp 45.000</p><p style=\"text-align:center;font-size:12px;\">Thank you!</p></body></html>",
    "filename": "receipt_001.pdf"
  }'
```

#### Success Response

```json
{
  "status": "success",
  "message": "PDF created successfully",
  "base_url": "http://localhost:3000",
  "file_url": "http://localhost:3000/output/receipt_001.pdf",
  "filename": "receipt_001.pdf"
}
```

#### Error Response

```json
{
  "error": "html_content is required"
}
```

### `GET /`

Health check endpoint.

---

## 🧾 Thermal Receipt Template

Here's an optimized HTML template for thermal receipts:

```html
<!DOCTYPE html>
<html>
  <head>
    <style>
      @page {
        size: 380px auto;
        margin: 0;
      }
      body {
        width: 380px;
        margin: 0;
        padding: 10px;
        font-family: "Courier New", monospace;
        font-size: 14px;
        line-height: 1.3;
      }
      .header {
        text-align: center;
      }
      .separator {
        border-top: 1px dashed #000;
        margin: 8px 0;
      }
      table {
        width: 100%;
        border-collapse: collapse;
      }
      td {
        padding: 3px 0;
      }
      .text-right {
        text-align: right;
      }
      .text-center {
        text-align: center;
      }
      .bold {
        font-weight: bold;
      }
      .total {
        font-size: 16px;
        font-weight: bold;
      }
    </style>
  </head>
  <body>
    <div class="header">
      <div class="bold" style="font-size:18px;">STORE NAME</div>
      <div>Order: #ORD-001</div>
    </div>
    <div class="separator"></div>
    <table>
      <tr>
        <td>Item Name x2</td>
        <td class="text-right">Rp 50.000</td>
      </tr>
    </table>
    <div class="separator"></div>
    <div class="total text-right">TOTAL: Rp 50.000</div>
    <div class="separator"></div>
    <div class="text-center" style="font-size:12px;">--- THANK YOU ---</div>
  </body>
</html>
```

---

## 🔧 Environment Variables

| Variable                    | Default | Description                           |
| --------------------------- | ------- | ------------------------------------- |
| `PORT`                      | `3000`  | Server port                           |
| `PUPPETEER_EXECUTABLE_PATH` | —       | Custom Chromium path (auto in Docker) |

---

## 🐳 Docker Commands

```bash
# Build locally
docker build -t html-to-pdf-api .

# Run with auto-restart
docker run -d --name html-to-pdf --restart always -p 3000:3000 html-to-pdf-api

# View logs
docker logs -f html-to-pdf

# Stop & remove
docker stop html-to-pdf && docker rm html-to-pdf
```

---

## 🏗️ Tech Stack

| Technology    | Purpose                         |
| ------------- | ------------------------------- |
| **Node.js**   | Runtime                         |
| **Express**   | HTTP Server                     |
| **Puppeteer** | HTML rendering & PDF generation |
| **Chromium**  | Headless browser engine         |
| **Docker**    | Containerization                |

---

## 📁 Project Structure

```
html-to-pdf-api/
├── server.js          # Main API server
├── package.json       # Dependencies
├── Dockerfile         # Docker build config
├── .dockerignore      # Docker ignore rules
├── .env               # Environment variables
├── .gitignore         # Git ignore rules
└── output/            # Generated PDF files
```

---

## 🤝 Integration Examples

### n8n Workflow (AI Agent + POS)

This API is designed to work seamlessly with **n8n** automation workflows. Use it as a tool for AI Agents to generate thermal receipts on-the-fly.

```json
{
  "method": "POST",
  "url": "https://your-domain.com/cetak_struk_pdf",
  "body": {
    "html_content": "{{ $json.html_from_ai }}",
    "filename": "{{ $json.order_id }}.pdf"
  }
}
```

### cURL

```bash
curl -s http://localhost:3000/cetak_struk_pdf \
  -H "Content-Type: application/json" \
  -d '{"html_content":"<h1>Hello PDF</h1>"}' | jq .
```

---

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

---

<p align="center">
  Made with ❤️ by <a href="https://github.com/volumeee">volumeee</a>
</p>
