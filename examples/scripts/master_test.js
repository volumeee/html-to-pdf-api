/**
 * v7.2.1 MASTER TEST SUITE
 * Comprehensive test for ALL endpoints, ALL templates, and ALL features.
 */
const axios = require("axios");
const fs = require("fs");
const path = require("path");

const API_BASE = process.env.API_BASE || "http://localhost:3000";
const API_KEY = "hp_f3ef360bf88e5a1bdcf4a0aeef667a9e28bef1d064e64551";
const BASE_DIR = path.join(__dirname, "..");

const client = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json",
    "x-api-key": API_KEY,
  },
  timeout: 120000,
});

// Delay between requests to respect rate limits (15 render/min)
const delay = (ms) => new Promise((r) => setTimeout(r, ms));
const RENDER_DELAY = 5000; // 5s between render calls to stay under 12/min

async function logResult(name, request, response) {
  const reqDir = path.join(BASE_DIR, "requests");
  const resDir = path.join(BASE_DIR, "responses");
  if (!fs.existsSync(reqDir)) fs.mkdirSync(reqDir, { recursive: true });
  if (!fs.existsSync(resDir)) fs.mkdirSync(resDir, { recursive: true });

  fs.writeFileSync(
    path.join(reqDir, `${name}.json`),
    JSON.stringify(request || {}, null, 2),
  );
  fs.writeFileSync(
    path.join(resDir, `${name}.json`),
    JSON.stringify(response || {}, null, 2),
  );
  console.log(`✅ ${name}`);
}

async function runMasterTest() {
  console.log("🧪 UNIFIED API v7.2.1 MASTER TEST START");
  console.log(`📡 API: ${API_BASE}\n`);
  let lastFile = "";

  try {
    // ============================================================
    // 1. RENDER ENDPOINT (/render) - Core Features
    // ============================================================
    console.log("--- 1. Testing /render Core Features ---");

    // HTML + Charts + Watermark + Table
    const r1 = {
      source_type: "html",
      source: '<h1>Feature Test</h1><div id="table-placeholder"></div>',
      options: {
        pageSize: "a4",
        watermark: { text: "INTERNAL USE", opacity: 0.1 },
        chart: {
          data: {
            type: "line",
            data: {
              labels: ["Jan", "Feb", "Mar", "Apr"],
              datasets: [{ label: "Revenue", data: [100, 250, 180, 350] }],
            },
          },
        },
        table: {
          data: [
            ["Item", "Qty", "Price"],
            ["Laptop Pro", "5", "Rp 15.000.000"],
            ["Mouse Wireless", "20", "Rp 250.000"],
            ["Keyboard Mech", "10", "Rp 750.000"],
          ],
          options: { zebra: true },
        },
      },
    };
    await delay(RENDER_DELAY);
    const res1 = await client.post("/render", r1);
    await logResult("render_rich_html", r1, res1.data);
    lastFile = res1.data.filename;

    // URL to Screenshot
    const r2 = {
      source_type: "url",
      source: `${API_BASE}/health`,
      output: "image",
      options: { format: "png" },
    };
    await delay(RENDER_DELAY);
    const res2 = await client.post("/render", r2);
    await logResult("render_url_image", r2, res2.data);

    // ============================================================
    // 2. RENDER ALL TEMPLATES with QR + Features
    // ============================================================
    console.log("\n--- 2. Testing ALL Templates ---");

    // 2a. Template: Indomaret (thermal receipt, basic)
    const tmpl_indomaret = {
      source_type: "template",
      source: "indomaret",
      data: {
        store_name: "INDOMARET EXPRESS",
        store_address: "Jl. Sudirman No. 123, Jakarta",
        cashier: "Kasir-07",
        items: [
          { name: "Indomie Goreng", qty: 3, price: 3500 },
          { name: "Aqua 600ml", qty: 2, price: 4000 },
          { name: "Pocari Sweat", qty: 1, price: 7500 },
        ],
        payment: 30000,
      },
      options: {
        qr_code: {
          text: "IDM-RECEIPT-001",
          position: "bottom-center",
          label: "Scan QR",
        },
      },
    };
    await delay(RENDER_DELAY);
    const res_indo = await client.post("/render", tmpl_indomaret);
    await logResult("template_indomaret", tmpl_indomaret, res_indo.data);

    // 2b. Template: Modern (thermal receipt, modern design)
    const tmpl_modern = {
      source_type: "template",
      source: "modern",
      data: {
        store_name: "KOPI KENANGAN",
        store_address: "Mall Grand Indonesia, Lt. 3",
        cashier: "Barista Elite",
        items: [
          { name: "Cappuccino Grande", qty: 2, price: 35000 },
          { name: "Matcha Latte", qty: 1, price: 42000 },
          { name: "Croissant Butter", qty: 2, price: 28000 },
          { name: "Tiramisu Slice", qty: 1, price: 45000 },
        ],
        payment: 250000,
        payment_method: "QRIS",
      },
      options: {
        qr_code: {
          text: "KOPI-TRX-12345",
          position: "bottom-center",
          label: "Rate Us!",
        },
        watermark: { text: "PAID", opacity: 0.08 },
      },
    };
    await delay(RENDER_DELAY);
    const res_modern = await client.post("/render", tmpl_modern);
    await logResult("template_modern", tmpl_modern, res_modern.data);

    // 2c. Template: Invoice (A4, professional)
    const tmpl_invoice = {
      source_type: "template",
      source: "invoice",
      data: {
        store_name: "PT TEKNOLOGI MAJU",
        store_address: "Jl. Gatot Subroto No. 88, Jakarta 12950",
        store_phone: "021-5551234",
        customer_name: "PT SOLUSI DIGITAL",
        customer_address: "Jl. TB Simatupang No. 55, Jakarta Selatan",
        customer_phone: "021-7784321",
        order_id: "INV-2026-00158",
        due_date: "28 Februari 2026",
        items: [
          { name: "Jasa Konsultasi IT (per jam)", qty: 40, price: 500000 },
          { name: "Lisensi Software ERP 1 Tahun", qty: 1, price: 25000000 },
          { name: "Training Staff (per sesi)", qty: 5, price: 2000000 },
          { name: "Server Maintenance Bulanan", qty: 3, price: 3500000 },
          { name: "Cloud Hosting (per bulan)", qty: 12, price: 1500000 },
        ],
        discount: 5000000,
        notes:
          "Pembayaran melalui transfer ke BCA 1234567890 a.n. PT TEKNOLOGI MAJU. Jatuh tempo 30 hari. Denda keterlambatan 2% per bulan.",
      },
      options: {
        qr_code: {
          text: "INV-2026-00158",
          position: "bottom-center",
          label: "Scan to Pay",
        },
      },
    };
    await delay(RENDER_DELAY);
    const res_invoice = await client.post("/render", tmpl_invoice);
    await logResult("template_invoice", tmpl_invoice, res_invoice.data);

    // 2d. Template: Surat (A4, official letter)
    const tmpl_surat = {
      source_type: "template",
      source: "surat",
      data: {
        instansi: "PT TEKNOLOGI MAJU",
        sub_instansi: "Divisi Research & Development",
        alamat_instansi: "Jl. Gatot Subroto No. 88, Jakarta 12950",
        kontak_instansi:
          "Telp: (021) 555-1234 | Email: info@teknologimaju.co.id",
        nomor_surat: "088/TM-RND/II/2026",
        perihal: "Penawaran Kerjasama Pengembangan Sistem",
        tujuan_nama: "Bapak Direktur IT",
        tujuan_alamat:
          "PT Solusi Digital, Jl. TB Simatupang No. 55, Jakarta Selatan",
        isi: [
          "Dengan hormat, bersama surat ini kami bermaksud menawarkan kerjasama dalam pengembangan sistem informasi terpadu untuk perusahaan Bapak/Ibu.",
          "Kami memiliki pengalaman lebih dari 10 tahun dalam bidang pengembangan solusi enterprise, dengan portofolio klien dari berbagai sektor industri.",
          "Sebagai langkah awal, kami mengusulkan pertemuan teknis untuk membahas kebutuhan dan lingkup proyek secara detail.",
        ],
        nama_ttd: "Dr. Ahmad Fauzi, M.T.",
        jabatan_ttd: "Direktur R&D",
        nip: "198506152010011023",
        tembusan: ["Direktur Utama", "Kepala Divisi Keuangan"],
      },
      options: {
        qr_code: {
          text: "SURAT-088-TM-2026",
          position: "bottom-center",
          label: "Verifikasi Digital",
        },
      },
    };
    await delay(RENDER_DELAY);
    const res_surat = await client.post("/render", tmpl_surat);
    await logResult("template_surat", tmpl_surat, res_surat.data);

    // 2e. Template: Sertifikat (landscape, certificate)
    const tmpl_sertifikat = {
      source_type: "template",
      source: "sertifikat",
      data: {
        judul: "SERTIFIKAT",
        sub_judul: "Certificate of Professional Excellence",
        nama_penerima: "Muhammad Bagus Eko Prabowo",
        keterangan_atas: "Dengan bangga diberikan kepada:",
        deskripsi:
          "Atas dedikasi dan kontribusi luar biasa dalam pengembangan platform HTML to PDF API yang telah melayani ribuan pengguna enterprise di seluruh Indonesia.",
        tempat: "Jakarta",
        nomor: "CERT/2026/PRO-001",
        penandatangan: [
          { nama: "Dr. Siti Aminah, M.T.", jabatan: "Direktur Akademik" },
          { nama: "Prof. Budi Santoso", jabatan: "Ketua Dewan Penguji" },
        ],
      },
      options: {
        qr_code: {
          text: "CERT-PRO-001-2026",
          position: "bottom-center",
          label: "Verify Certificate",
        },
      },
    };
    await delay(RENDER_DELAY);
    const res_sertifikat = await client.post("/render", tmpl_sertifikat);
    await logResult(
      "template_sertifikat",
      tmpl_sertifikat,
      res_sertifikat.data,
    );

    // 2f. Template: Label (shipping label)
    const tmpl_label = {
      source_type: "template",
      source: "label",
      data: {
        kurir: "JNE REGULER",
        pengirim_nama: "Toko Elektronik ABC",
        pengirim_alamat: "Jl. Mangga Dua Raya No. 45, Jakarta Utara",
        pengirim_telp: "081234567890",
        penerima_nama: "Budi Santoso",
        penerima_alamat:
          "Jl. Merdeka No. 123, RT 05/RW 02, Kel. Sukajaya, Kec. Coblong, Bandung 40134",
        penerima_telp: "089876543210",
        berat: "2.5",
        layanan: "REG",
        cod: 350000,
        koli: 1,
        total_koli: 1,
        resi: "JNE-2026021300123",
        catatan: "FRAGILE - Handle with care! Barang elektronik.",
      },
      options: {
        qr_code: {
          text: "JNE-2026021300123",
          position: "bottom-center",
          label: "Track Shipment",
        },
      },
    };
    await delay(RENDER_DELAY);
    const res_label = await client.post("/render", tmpl_label);
    await logResult("template_label", tmpl_label, res_label.data);

    // ============================================================
    // 3. PDF ACTIONS (/pdf-action)
    // ============================================================
    console.log("\n--- 3. Testing /pdf-action Actions ---");

    const a1 = {
      action: "metadata",
      filename: lastFile,
      options: { title: "Master Test PDF v7.2.1", author: "AI Agent" },
    };
    const ra1 = await client.post("/pdf-action", a1);
    await logResult("action_metadata", a1, ra1.data);

    const a2 = {
      action: "thumbnail",
      filename: lastFile,
      options: { width: 400, format: "jpeg" },
    };
    const ra2 = await client.post("/pdf-action", a2);
    await logResult("action_thumbnail", a2, ra2.data);

    const a3 = {
      action: "compress",
      filename: lastFile,
      options: { quality: "ebook" },
    };
    const ra3 = await client.post("/pdf-action", a3);
    await logResult("action_compress", a3, ra3.data);

    const a4 = {
      action: "extract",
      filename: lastFile,
      options: { pages: [0] },
    };
    const ra4 = await client.post("/pdf-action", a4);
    await logResult("action_extract", a4, ra4.data);

    // ============================================================
    // 4. QUEUE ENDPOINTS
    // ============================================================
    console.log("\n--- 4. Testing Queue Features ---");

    const q1 = {
      type: "render",
      data: { source_type: "html", source: "<h1>Queue Test v7.2.1</h1>" },
    };
    const rq1 = await client.post("/queue", q1);
    await logResult("queue_submit", q1, rq1.data);
    const jobId = rq1.data.id;

    await new Promise((r) => setTimeout(r, 2000));
    const rq2 = await client.get(`/jobs/${jobId}`);
    await logResult("queue_status", { id: jobId }, rq2.data);

    const rq3 = await client.get("/queue/stats");
    await logResult("queue_stats", {}, rq3.data);

    // ============================================================
    // 5. ADVANCED RENDER FEATURES
    // ============================================================
    console.log("\n--- 5. Testing Advanced Render Features ---");
    const r4 = {
      source_type: "html",
      source: '<div class="test">Styled Content with Custom CSS</div>',
      options: {
        inject_css:
          ".test { color: red; font-size: 50px; text-align: center; padding: 40px; }",
        displayHeaderFooter: true,
        headerTemplate:
          '<div style="font-size:10px;margin-left:20px;">Header v7.2.1</div>',
        footerTemplate:
          '<div style="font-size:10px;margin-left:20px;">Page <span class="pageNumber"></span></div>',
      },
    };
    await delay(RENDER_DELAY);
    const res4 = await client.post("/render", r4);
    await logResult("render_adv_features", r4, res4.data);

    // ============================================================
    // 6. LEGACY ENDPOINT (/cetak_struk_pdf) - COMPREHENSIVE
    // ============================================================
    console.log("\n--- 6. Testing Legacy Cetak Struk PDF ---");
    console.log("   ⏳ Cooling down for rate limiter...");
    await delay(15000); // Wait for rate limit window to reset

    // 6a. Legacy with full thermal features
    const l1 = {
      html_content:
        '<div style="text-align:center"><h1>LEGACY FULL TEST</h1><p>Thermal printing mockup</p></div>',
      page_size: "thermal_80mm",
      qr_code: {
        text: "LEGACY-QR-2026",
        position: "bottom-center",
        label: "QR Center Test",
      },
      barcode: { text: "12345678", type: "code128", position: "bottom-center" },
      watermark: { text: "LEGACY", opacity: 0.1 },
    };
    await delay(RENDER_DELAY);
    const rl1 = await client.post("/cetak_struk_pdf", l1);
    await logResult("legacy_test_full", l1, rl1.data);

    // 6b. Legacy template basic
    const l2 = {
      template: "indomaret",
      data: {
        store_name: "LEGACY STORE",
        items: [{ name: "Item A", qty: 1, price: 1000 }],
        payment: 2000,
      },
      page_size: "thermal_default",
    };
    await delay(RENDER_DELAY);
    const rl2 = await client.post("/cetak_struk_pdf", l2);
    await logResult("legacy_test_template", l2, rl2.data);

    // 6c. ⭐ MEGA STRUK: 25 items, QR, Watermark, Indomaret template
    const l3 = {
      template: "indomaret",
      data: {
        store_name: "ENTERPRISE MART V7",
        store_address: "Jl. Sudirman No. 999, Jakarta Pusat",
        store_phone: "021-9999888",
        cashier: "Super-AI",
        order_id: "INV-2026021399001",
        items: [
          { name: 'Monitor LG 27" 4K IPS', qty: 2, price: 4500000 },
          { name: "Mechanical Keyboard RGB", qty: 1, price: 1250000 },
          { name: "Gaming Mouse Logitech G502", qty: 1, price: 850000 },
          { name: "Mousepad XL 900x400mm", qty: 2, price: 175000 },
          { name: "HDMI Cable 2M Gold Plated", qty: 5, price: 75000 },
          { name: "USB-C Hub 7-in-1", qty: 3, price: 350000 },
          { name: "Webcam Logitech C920 HD", qty: 2, price: 1200000 },
          { name: "Headset Gaming HyperX", qty: 1, price: 950000 },
          { name: "SSD NVMe 1TB Samsung", qty: 2, price: 1350000 },
          { name: "RAM DDR5 16GB Kit", qty: 2, price: 1100000 },
          { name: "PSU 750W Modular Gold", qty: 1, price: 1450000 },
          { name: "Casing ATX Tempered Glass", qty: 1, price: 850000 },
          { name: "CPU Cooler AIO 240mm", qty: 1, price: 1200000 },
          { name: "Thermal Paste MX-5", qty: 3, price: 95000 },
          { name: "Cable Management Kit", qty: 2, price: 125000 },
          { name: "Monitor Arm Dual", qty: 1, price: 650000 },
          { name: "Desk Mat Leather 80x40", qty: 1, price: 250000 },
          { name: "USB Flash Drive 64GB", qty: 10, price: 85000 },
          { name: "Ethernet Cable Cat6 3M", qty: 5, price: 45000 },
          { name: "Screen Cleaner Kit", qty: 3, price: 55000 },
          { name: "Laptop Stand Aluminum", qty: 2, price: 450000 },
          { name: "Wireless Charger 15W", qty: 3, price: 175000 },
          { name: "Power Strip 6 Socket", qty: 2, price: 195000 },
          { name: "LED Desk Lamp Dimmable", qty: 2, price: 285000 },
          { name: "Webcam Privacy Cover 3pcs", qty: 5, price: 25000 },
        ],
        payment: 80000000,
        payment_method: "TRANSFER BCA",
      },
      page_size: "thermal_80mm",
      qr_code: {
        text: "https://enterprise-mart.co.id/receipt/INV-2026021399001",
        position: "bottom-center",
        label: "Scan for Digital Receipt",
        width: 140,
      },
      watermark: { text: "PAID / LUNAS", opacity: 0.12, color: "#ff0000" },
    };
    await delay(RENDER_DELAY);
    const rl3 = await client.post("/cetak_struk_pdf", l3);
    await logResult("legacy_test_complex_struk", l3, rl3.data);

    // 6d. Legacy with Modern template + QR + Watermark
    const l4 = {
      template: "modern",
      data: {
        store_name: "DIGITAL COFFEE",
        store_address: "Jl. Senopati No. 77, Jakarta",
        cashier: "Machine-01",
        order_id: "DC-20260213-001",
        items: [
          { name: "Espresso Single Origin", qty: 2, price: 38000 },
          { name: "Caramel Macchiato Ice", qty: 1, price: 52000 },
          { name: "Green Tea Frappe", qty: 1, price: 48000 },
          { name: "Belgian Waffle", qty: 2, price: 35000 },
          { name: "Chicken Sandwich", qty: 1, price: 42000 },
          { name: "Caesar Salad", qty: 1, price: 55000 },
          { name: "Mineral Water 500ml", qty: 3, price: 8000 },
        ],
        payment: 500000,
        payment_method: "GOPAY",
        discount: 25000,
      },
      page_size: "thermal_80mm",
      qr_code: {
        text: "RATE-DC-20260213-001",
        position: "bottom-center",
        label: "Rate your experience!",
      },
      watermark: { text: "THANK YOU", opacity: 0.08 },
    };
    await delay(RENDER_DELAY);
    const rl4 = await client.post("/cetak_struk_pdf", l4);
    await logResult("legacy_test_modern_template", l4, rl4.data);

    // ============================================================
    // 7. MANAGEMENT ENDPOINTS
    // ============================================================
    console.log("\n--- 7. Testing Management ---");
    const m1 = await client.get("/files");
    await logResult("mgmt_files", {}, m1.data);
    const m2 = await client.get("/templates");
    await logResult("mgmt_templates", {}, m2.data);
    const m3 = await client.get("/health");
    await logResult("mgmt_health", {}, m3.data);
    const m4 = await client.get("/");
    await logResult("mgmt_root", {}, m4.data);

    // ============================================================
    // 8. AUTOMATIC QUEUEING via /render
    // ============================================================
    console.log("\n--- 8. Testing Automatic Queueing via /render ---");
    const qv1 = {
      source_type: "html",
      source: "<h1>Async Auto Test v7.2.1</h1>",
      async: true,
    };
    const rqv1 = await client.post("/render", qv1);
    await logResult("render_async_auto", qv1, rqv1.data);

    // ============================================================
    // FINAL SUMMARY
    // ============================================================
    console.log("\n" + "═".repeat(50));
    console.log("🌟 ALL TESTS COMPLETED SUCCESSFULLY!");
    console.log("═".repeat(50));
    console.log(`\n📊 Tests Summary:`);
    console.log(
      `   Templates tested: indomaret, modern, invoice, surat, sertifikat, label`,
    );
    console.log(`   Legacy struk items: 25 diverse products`);
    console.log(`   QR Code centering: tested on all templates`);
    console.log(`   Watermark: tested on receipt templates`);
    console.log(`   PDF Actions: metadata, thumbnail, compress, extract`);
    console.log(`   Queue: submit, status, stats`);
    console.log(`   Advanced: CSS injection, header/footer`);
  } catch (err) {
    console.error("\n❌ MASTER TEST FAILED");
    if (err.response) console.error(JSON.stringify(err.response.data, null, 2));
    else console.error(err.message);
  }
}

runMasterTest();
