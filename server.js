const express = require("express");
const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");
const bodyParser = require("body-parser");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;
const AUTO_CLEANUP_HOURS = parseInt(process.env.AUTO_CLEANUP_HOURS) || 24;

app.use(cors());
app.use(bodyParser.json({ limit: "10mb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "10mb" }));
app.use("/output", express.static(path.join(__dirname, "output")));

// Ensure output directory exists
const outputDir = path.join(__dirname, "output");
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// ============================================================
// PAGE SIZE PRESETS
// ============================================================
const PAGE_SIZES = {
  thermal_58mm: { width: "220px", viewport: 220 },
  thermal_80mm: { width: "302px", viewport: 302 },
  thermal_default: { width: "380px", viewport: 380 },
  a4: { width: "210mm", height: "297mm", viewport: 794 },
  a5: { width: "148mm", height: "210mm", viewport: 559 },
  letter: { width: "8.5in", height: "11in", viewport: 816 },
};

// ============================================================
// RECEIPT TEMPLATES
// ============================================================
const TEMPLATES = {
  // --- TEMPLATE: INDOMARET STYLE ---
  indomaret: (data) => {
    const items = data.items || [];
    const itemRows = items
      .map(
        (item) => `
      <tr>
        <td colspan="3" style="padding:2px 0 0;">${item.name}</td>
      </tr>
      <tr>
        <td style="padding:0 0 2px;">${item.qty} x ${formatRp(item.price)}</td>
        <td></td>
        <td class="r">${formatRp(item.qty * item.price)}</td>
      </tr>`,
      )
      .join("");

    const subtotal = items.reduce((s, i) => s + i.qty * i.price, 0);
    const tax = data.tax || 0;
    const discount = data.discount || 0;
    const grandTotal = subtotal + tax - discount;
    const payment = data.payment || grandTotal;
    const change = payment - grandTotal;

    return `<!DOCTYPE html>
<html><head><style>
  @page { size: 380px auto; margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { width: 380px; font-family: 'Courier New', monospace; font-size: 13px; padding: 10px; color: #000; }
  .center { text-align: center; }
  .r { text-align: right; }
  .bold { font-weight: bold; }
  .sep { border-top: 1px dashed #000; margin: 6px 0; }
  .sep-double { border-top: 2px double #000; margin: 6px 0; }
  table { width: 100%; border-collapse: collapse; }
  td { padding: 1px 0; vertical-align: top; }
  .store-name { font-size: 18px; font-weight: bold; letter-spacing: 2px; }
  .footer { font-size: 11px; margin-top: 10px; }
  .barcode { font-family: 'Libre Barcode 39', cursive; font-size: 40px; letter-spacing: 2px; }
  .total-line { font-size: 16px; font-weight: bold; }
</style></head><body>
  <div class="center">
    <div class="store-name">${data.store_name || "TOKO SAYA"}</div>
    <div>${data.store_address || "Jl. Contoh No. 123"}</div>
    <div>${data.store_phone || "021-1234567"}</div>
  </div>
  <div class="sep-double"></div>
  <table>
    <tr><td>No</td><td>: ${data.order_id || "INV-" + Date.now()}</td></tr>
    <tr><td>Tanggal</td><td>: ${data.date || new Date().toLocaleString("id-ID")}</td></tr>
    <tr><td>Kasir</td><td>: ${data.cashier || "ADMIN"}</td></tr>
  </table>
  <div class="sep"></div>
  <table>${itemRows}</table>
  <div class="sep"></div>
  <table>
    <tr><td>Subtotal</td><td class="r">${formatRp(subtotal)}</td></tr>
    ${discount > 0 ? `<tr><td>Diskon</td><td class="r">-${formatRp(discount)}</td></tr>` : ""}
    ${tax > 0 ? `<tr><td>PPN</td><td class="r">${formatRp(tax)}</td></tr>` : ""}
  </table>
  <div class="sep-double"></div>
  <table>
    <tr class="total-line"><td class="bold">TOTAL</td><td class="r bold">${formatRp(grandTotal)}</td></tr>
    <tr><td>${data.payment_method || "TUNAI"}</td><td class="r">${formatRp(payment)}</td></tr>
    <tr class="bold"><td>KEMBALI</td><td class="r">${formatRp(change)}</td></tr>
  </table>
  <div class="sep"></div>
  <div class="center footer">
    <div>${data.footer_message || "Terima kasih atas kunjungan Anda!"}</div>
    <div>Barang yang sudah dibeli</div>
    <div>tidak dapat ditukar/dikembalikan</div>
    <div style="margin-top:8px;" class="barcode">*${data.order_id || Date.now()}*</div>
  </div>
</body></html>`;
  },

  // --- TEMPLATE: MODERN MINIMAL ---
  modern: (data) => {
    const items = data.items || [];
    const itemRows = items
      .map(
        (item) => `
      <tr>
        <td>${item.name}</td>
        <td class="center">${item.qty}</td>
        <td class="r">${formatRp(item.price)}</td>
        <td class="r bold">${formatRp(item.qty * item.price)}</td>
      </tr>`,
      )
      .join("");

    const subtotal = items.reduce((s, i) => s + i.qty * i.price, 0);
    const tax = data.tax || 0;
    const discount = data.discount || 0;
    const grandTotal = subtotal + tax - discount;

    return `<!DOCTYPE html>
<html><head><style>
  @page { size: 380px auto; margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { width: 380px; font-family: 'Segoe UI', Arial, sans-serif; font-size: 12px; padding: 15px; color: #333; }
  .center { text-align: center; }
  .r { text-align: right; }
  .bold { font-weight: bold; }
  .sep { border-top: 1px solid #ddd; margin: 10px 0; }
  table { width: 100%; border-collapse: collapse; }
  td, th { padding: 4px 2px; }
  th { text-align: left; font-size: 11px; color: #888; border-bottom: 2px solid #333; }
  .logo { font-size: 22px; font-weight: 800; color: #1a1a2e; letter-spacing: 1px; }
  .total-box { background: #1a1a2e; color: #fff; padding: 10px; border-radius: 6px; margin: 10px 0; }
  .total-box .amount { font-size: 20px; font-weight: bold; }
  .footer { font-size: 10px; color: #999; margin-top: 15px; }
  .badge { display: inline-block; background: #e8f5e9; color: #2e7d32; padding: 2px 8px; border-radius: 10px; font-size: 10px; }
</style></head><body>
  <div class="center">
    <div class="logo">${data.store_name || "STORE"}</div>
    <div style="color:#888;font-size:11px;">${data.store_address || ""}</div>
  </div>
  <div class="sep"></div>
  <div style="display:flex;justify-content:space-between;font-size:11px;color:#666;">
    <span>#${data.order_id || Date.now()}</span>
    <span>${data.date || new Date().toLocaleString("id-ID")}</span>
  </div>
  <div class="sep"></div>
  <table>
    <thead><tr><th>Item</th><th class="center">Qty</th><th class="r">Harga</th><th class="r">Total</th></tr></thead>
    <tbody>${itemRows}</tbody>
  </table>
  <div class="sep"></div>
  <table>
    <tr><td>Subtotal</td><td class="r">${formatRp(subtotal)}</td></tr>
    ${discount > 0 ? `<tr><td>Diskon</td><td class="r" style="color:#e53935;">-${formatRp(discount)}</td></tr>` : ""}
    ${tax > 0 ? `<tr><td>PPN</td><td class="r">${formatRp(tax)}</td></tr>` : ""}
  </table>
  <div class="total-box center">
    <div style="font-size:11px;">TOTAL PEMBAYARAN</div>
    <div class="amount">${formatRp(grandTotal)}</div>
    <span class="badge" style="background:#fff3;color:#fff;">${data.payment_method || "TUNAI"}</span>
  </div>
  <div class="center footer">
    <div>${data.footer_message || "Terima kasih!"}</div>
  </div>
</body></html>`;
  },

  // --- TEMPLATE: INVOICE A4 ---
  invoice: (data) => {
    const items = data.items || [];
    const itemRows = items
      .map(
        (item, i) => `
      <tr>
        <td class="center">${i + 1}</td>
        <td>${item.name}</td>
        <td class="center">${item.qty}</td>
        <td class="r">${formatRp(item.price)}</td>
        <td class="r bold">${formatRp(item.qty * item.price)}</td>
      </tr>`,
      )
      .join("");

    const subtotal = items.reduce((s, i) => s + i.qty * i.price, 0);
    const tax = data.tax || Math.round(subtotal * 0.11);
    const discount = data.discount || 0;
    const grandTotal = subtotal + tax - discount;

    return `<!DOCTYPE html>
<html><head><style>
  @page { size: A4; margin: 20mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 13px; color: #333; padding: 40px; }
  .r { text-align: right; }
  .center { text-align: center; }
  .bold { font-weight: bold; }
  .header { display: flex; justify-content: space-between; margin-bottom: 30px; }
  .company { font-size: 24px; font-weight: 800; color: #1a1a2e; }
  .invoice-title { font-size: 28px; font-weight: 300; color: #667; letter-spacing: 4px; }
  table { width: 100%; border-collapse: collapse; margin: 15px 0; }
  th { background: #1a1a2e; color: #fff; padding: 10px 8px; text-align: left; font-size: 12px; }
  td { padding: 8px; border-bottom: 1px solid #eee; }
  tr:hover { background: #f9f9f9; }
  .total-section { margin-top: 20px; }
  .total-section td { border: none; padding: 4px 8px; }
  .grand-total { font-size: 18px; font-weight: bold; color: #1a1a2e; border-top: 2px solid #1a1a2e !important; }
  .notes { margin-top: 40px; padding: 15px; background: #f8f9fa; border-radius: 8px; border-left: 4px solid #1a1a2e; }
  .footer { margin-top: 50px; text-align: center; font-size: 11px; color: #999; }
</style></head><body>
  <div class="header">
    <div>
      <div class="company">${data.store_name || "PERUSAHAAN"}</div>
      <div style="color:#666;">${data.store_address || "Alamat Perusahaan"}</div>
      <div style="color:#666;">${data.store_phone || "Telp: 021-xxx"}</div>
    </div>
    <div style="text-align:right;">
      <div class="invoice-title">INVOICE</div>
      <div style="margin-top:10px;">
        <strong>No:</strong> ${data.order_id || "INV-" + Date.now()}<br>
        <strong>Tanggal:</strong> ${data.date || new Date().toLocaleDateString("id-ID")}<br>
        <strong>Jatuh Tempo:</strong> ${data.due_date || "-"}
      </div>
    </div>
  </div>
  <div style="background:#f8f9fa;padding:15px;border-radius:8px;margin-bottom:20px;">
    <strong>Kepada:</strong><br>
    ${data.customer_name || "Pelanggan"}<br>
    <span style="color:#666;">${data.customer_address || ""}</span><br>
    <span style="color:#666;">${data.customer_phone || ""}</span>
  </div>
  <table>
    <thead><tr><th class="center" style="width:40px;">No</th><th>Deskripsi</th><th class="center" style="width:60px;">Qty</th><th class="r" style="width:120px;">Harga</th><th class="r" style="width:130px;">Total</th></tr></thead>
    <tbody>${itemRows}</tbody>
  </table>
  <table class="total-section" style="width:300px;margin-left:auto;">
    <tr><td>Subtotal</td><td class="r">${formatRp(subtotal)}</td></tr>
    ${discount > 0 ? `<tr><td>Diskon</td><td class="r" style="color:#e53935;">-${formatRp(discount)}</td></tr>` : ""}
    <tr><td>PPN (11%)</td><td class="r">${formatRp(tax)}</td></tr>
    <tr class="grand-total"><td class="bold">TOTAL</td><td class="r">${formatRp(grandTotal)}</td></tr>
  </table>
  ${data.notes ? `<div class="notes"><strong>Catatan:</strong><br>${data.notes}</div>` : ""}
  <div class="footer">
    <div>${data.footer_message || "Terima kasih atas kepercayaan Anda."}</div>
  </div>
</body></html>`;
  },
};

// ============================================================
// HELPER: Format Rupiah
// ============================================================
function formatRp(num) {
  return "Rp " + (num || 0).toLocaleString("id-ID");
}

// ============================================================
// HELPER: Launch Browser (Reusable)
// ============================================================
async function launchBrowser() {
  return puppeteer.launch({
    headless: "new",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
    ],
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || null,
  });
}

// ============================================================
// ENDPOINT 1: GENERATE PDF FROM RAW HTML (Original)
// ============================================================
app.post("/cetak_struk_pdf", async (req, res) => {
  const { html_content, filename, page_size, options } = req.body;

  if (!html_content) {
    return res.status(400).json({ error: "html_content is required" });
  }

  const size = PAGE_SIZES[page_size] || PAGE_SIZES.thermal_default;
  const pdfFilename = filename || `struk_${Date.now()}.pdf`;
  const pdfPath = path.join(outputDir, pdfFilename);

  try {
    const browser = await launchBrowser();
    const page = await browser.newPage();

    await page.setViewport({ width: size.viewport, height: 600 });
    await page.setContent(html_content, { waitUntil: "networkidle0" });

    const pdfOptions = {
      path: pdfPath,
      printBackground: true,
      margin: options?.margin || {
        top: "0",
        bottom: "0",
        left: "0",
        right: "0",
      },
    };

    // Set size based on preset
    if (size.height) {
      pdfOptions.width = size.width;
      pdfOptions.height = size.height;
    } else {
      pdfOptions.width = size.width;
    }

    if (options?.landscape) pdfOptions.landscape = true;
    if (options?.format) pdfOptions.format = options.format;

    await page.pdf(pdfOptions);
    await browser.close();

    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const fileUrl = `${baseUrl}/output/${pdfFilename}`;

    res.json({
      status: "success",
      message: "PDF created successfully",
      base_url: baseUrl,
      file_url: fileUrl,
      filename: pdfFilename,
      page_size: page_size || "thermal_default",
    });
  } catch (error) {
    console.error("Error generating PDF:", error);
    res
      .status(500)
      .json({ error: "Failed to generate PDF", detail: error.message });
  }
});

// ============================================================
// ENDPOINT 2: GENERATE FROM TEMPLATE (NEW!)
// ============================================================
app.post("/generate", async (req, res) => {
  const { template, data, filename, page_size } = req.body;

  if (!template || !TEMPLATES[template]) {
    return res.status(400).json({
      error: `Invalid template. Available: ${Object.keys(TEMPLATES).join(", ")}`,
    });
  }

  if (!data) {
    return res.status(400).json({ error: "data is required" });
  }

  // Determine page size based on template
  let defaultSize = "thermal_default";
  if (template === "invoice") defaultSize = "a4";
  const size = PAGE_SIZES[page_size || defaultSize] || PAGE_SIZES[defaultSize];

  const html_content = TEMPLATES[template](data);
  const pdfFilename = filename || `${template}_${Date.now()}.pdf`;
  const pdfPath = path.join(outputDir, pdfFilename);

  try {
    const browser = await launchBrowser();
    const page = await browser.newPage();

    await page.setViewport({ width: size.viewport, height: 600 });
    await page.setContent(html_content, { waitUntil: "networkidle0" });

    const pdfOptions = {
      path: pdfPath,
      printBackground: true,
    };

    if (size.height) {
      pdfOptions.width = size.width;
      pdfOptions.height = size.height;
      pdfOptions.margin = { top: "0", bottom: "0", left: "0", right: "0" };
    } else {
      pdfOptions.width = size.width;
      pdfOptions.margin = { top: "0", bottom: "0", left: "0", right: "0" };
    }

    await page.pdf(pdfOptions);
    await browser.close();

    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const fileUrl = `${baseUrl}/output/${pdfFilename}`;

    res.json({
      status: "success",
      template,
      file_url: fileUrl,
      filename: pdfFilename,
    });
  } catch (error) {
    console.error("Error generating from template:", error);
    res
      .status(500)
      .json({ error: "Failed to generate PDF", detail: error.message });
  }
});

// ============================================================
// ENDPOINT 3: LIST ALL PDFs
// ============================================================
app.get("/files", (req, res) => {
  const files = fs.readdirSync(outputDir).filter((f) => f.endsWith(".pdf"));
  const baseUrl = `${req.protocol}://${req.get("host")}`;

  const fileList = files.map((f) => {
    const stats = fs.statSync(path.join(outputDir, f));
    return {
      filename: f,
      url: `${baseUrl}/output/${f}`,
      size_kb: Math.round(stats.size / 1024),
      created: stats.birthtime,
    };
  });

  res.json({
    total: fileList.length,
    files: fileList.sort((a, b) => new Date(b.created) - new Date(a.created)),
  });
});

// ============================================================
// ENDPOINT 4: DELETE A PDF
// ============================================================
app.delete("/files/:filename", (req, res) => {
  const filePath = path.join(outputDir, req.params.filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "File not found" });
  }

  fs.unlinkSync(filePath);
  res.json({ status: "deleted", filename: req.params.filename });
});

// ============================================================
// ENDPOINT 5: CLEANUP OLD FILES
// ============================================================
app.post("/cleanup", (req, res) => {
  const maxAgeHours = req.body.max_age_hours || AUTO_CLEANUP_HOURS;
  const now = Date.now();
  const files = fs.readdirSync(outputDir).filter((f) => f.endsWith(".pdf"));
  let deleted = 0;

  files.forEach((f) => {
    const filePath = path.join(outputDir, f);
    const stats = fs.statSync(filePath);
    const ageHours = (now - stats.mtimeMs) / (1000 * 60 * 60);

    if (ageHours > maxAgeHours) {
      fs.unlinkSync(filePath);
      deleted++;
    }
  });

  res.json({
    status: "cleanup_done",
    deleted,
    remaining: files.length - deleted,
  });
});

// ============================================================
// ENDPOINT 6: GET AVAILABLE TEMPLATES & PAGE SIZES
// ============================================================
app.get("/templates", (req, res) => {
  res.json({
    templates: Object.keys(TEMPLATES).map((t) => ({
      name: t,
      description:
        t === "indomaret"
          ? "Struk thermal seperti Indomaret/Alfamart"
          : t === "modern"
            ? "Struk thermal desain modern & minimalis"
            : t === "invoice"
              ? "Invoice A4 profesional"
              : t,
    })),
    page_sizes: Object.keys(PAGE_SIZES).map((s) => ({
      name: s,
      ...PAGE_SIZES[s],
    })),
  });
});

// ============================================================
// HEALTH CHECK
// ============================================================
app.get("/", (req, res) => {
  res.json({
    name: "HTML to PDF API",
    version: "2.0.0",
    status: "running",
    endpoints: [
      "POST /cetak_struk_pdf - Generate PDF from raw HTML",
      "POST /generate - Generate PDF from template",
      "GET  /templates - List available templates & page sizes",
      "GET  /files - List all generated PDFs",
      "DELETE /files/:filename - Delete a PDF",
      "POST /cleanup - Remove old PDFs",
    ],
  });
});

// ============================================================
// AUTO CLEANUP (runs every 6 hours)
// ============================================================
setInterval(
  () => {
    const now = Date.now();
    const files = fs.readdirSync(outputDir).filter((f) => f.endsWith(".pdf"));

    files.forEach((f) => {
      const filePath = path.join(outputDir, f);
      const stats = fs.statSync(filePath);
      const ageHours = (now - stats.mtimeMs) / (1000 * 60 * 60);

      if (ageHours > AUTO_CLEANUP_HOURS) {
        fs.unlinkSync(filePath);
        console.log(`[CLEANUP] Deleted: ${f}`);
      }
    });
  },
  6 * 60 * 60 * 1000,
);

// ============================================================
// START SERVER
// ============================================================
app.listen(PORT, () => {
  console.log(`🚀 HTML to PDF API v2.0.0 running on port ${PORT}`);
  console.log(`📄 Templates: ${Object.keys(TEMPLATES).join(", ")}`);
  console.log(`🗑️  Auto-cleanup: every ${AUTO_CLEANUP_HOURS}h`);
});
