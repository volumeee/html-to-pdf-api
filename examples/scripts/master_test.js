/**
 * v7.2.0 MASTER TEST SUITE
 * One script to test ALL endpoints and features.
 */
const axios = require("axios");
const fs = require("fs");
const path = require("path");

const API_BASE = "http://localhost:3000";
const API_KEY = "hp_f3ef360bf88e5a1bdcf4a0aeef667a9e28bef1d064e64551";
const BASE_DIR = path.join(__dirname, "..");

const client = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json",
    "x-api-key": API_KEY,
  },
  timeout: 60000,
});

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
  console.log("🧪 UNIFIED API v7.2.0 MASTER TEST START\n");
  let lastFile = "";

  try {
    // --- 1. RENDER ENDPOINT (/render) ---
    console.log("--- Testing /render Features ---");

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
              labels: ["A", "B", "C"],
              datasets: [{ label: "Sales", data: [100, 200, 150] }],
            },
          },
        },
        table: {
          data: [
            ["Item", "Price"],
            ["Laptop", "1500"],
            ["Mouse", "25"],
          ],
          options: { zebra: true },
        },
      },
    };
    const res1 = await client.post("/render", r1);
    await logResult("render_rich_html", r1, res1.data);
    lastFile = res1.data.filename;

    // URL to Screenshot
    const r2 = {
      source_type: "url",
      source: "http://localhost:3000/health",
      output: "image",
      options: { format: "png" },
    };
    const res2 = await client.post("/render", r2);
    await logResult("render_url_image", r2, res2.data);

    // Template Indomaret + QR
    const r3 = {
      source_type: "template",
      source: "indomaret",
      data: {
        store_name: "TEST SHOP",
        items: [{ name: "Test", qty: 1, price: 500 }],
        payment: 1000,
      },
      options: { qr_code: { text: "ORDER-001", position: "bottom-center" } },
    };
    const res3 = await client.post("/render", r3);
    await logResult("render_template_qr", r3, res3.data);

    // --- 2. PDF ACTION ENDPOINT (/pdf-action) ---
    console.log("\n--- Testing /pdf-action Actions ---");

    // Metadata
    const a1 = {
      action: "metadata",
      filename: lastFile,
      options: { title: "Master Test PDF", author: "AI Agent" },
    };
    const ra1 = await client.post("/pdf-action", a1);
    await logResult("action_metadata", a1, ra1.data);

    // Thumbnail
    const a2 = {
      action: "thumbnail",
      filename: lastFile,
      options: { width: 400, format: "jpeg" },
    };
    const ra2 = await client.post("/pdf-action", a2);
    await logResult("action_thumbnail", a2, ra2.data);

    // Compress
    const a3 = {
      action: "compress",
      filename: lastFile,
      options: { quality: "ebook" },
    };
    const ra3 = await client.post("/pdf-action", a3);
    await logResult("action_compress", a3, ra3.data);

    // Extract
    const a4 = {
      action: "extract",
      filename: lastFile,
      options: { pages: [0] },
    };
    const ra4 = await client.post("/pdf-action", a4);
    await logResult("action_extract", a4, ra4.data);

    // --- 3. QUEUE ENDPOINTS ---
    console.log("\n--- Testing Queue Features ---");

    const q1 = {
      type: "render",
      data: { source_type: "html", source: "<h1>Queue Test</h1>" },
    };
    const rq1 = await client.post("/queue", q1);
    await logResult("queue_submit", q1, rq1.data);
    const jobId = rq1.data.id;

    await new Promise((r) => setTimeout(r, 2000));
    const rq2 = await client.get(`/jobs/${jobId}`);
    await logResult("queue_status", { id: jobId }, rq2.data);

    const rq3 = await client.get("/queue/stats");
    await logResult("queue_stats", {}, rq3.data);

    // --- 4. ADVANCED RENDER FEATURES ---
    console.log("\n--- Testing Advanced Render Features ---");
    const r4 = {
      source_type: "html",
      source: '<div class="test">Styled Content</div>',
      options: {
        inject_css: ".test { color: red; font-size: 50px; }",
        displayHeaderFooter: true,
        headerTemplate:
          '<div style="font-size:10px;margin-left:20px;">Header v7.2.0</div>',
        footerTemplate:
          '<div style="font-size:10px;margin-left:20px;">Page <span class="pageNumber"></span></div>',
      },
    };
    const res4 = await client.post("/render", r4);
    await logResult("render_adv_features", r4, res4.data);

    // --- 5. LEGACY ENDPOINT (/cetak_struk_pdf) ---
    console.log("\n--- Testing Legacy Features (Comprehensive) ---");

    // Testing legacy with full thermal features: barcode, qr, watermark
    const l1 = {
      html_content:
        '<div style="text-align:center"><h1>LEGACY FULL TEST</h1><p>Thermal printing mockup</p></div>',
      page_size: "thermal_80mm",
      qr_code: { text: "LEGACY-QR", position: "bottom-center" },
      barcode: { text: "12345678", type: "code128", position: "bottom-right" },
      watermark: { text: "LEGACY", opacity: 0.1 },
    };
    const rl1 = await client.post("/cetak_struk_pdf", l1);
    await logResult("legacy_test_full", l1, rl1.data);

    // Testing legacy with a built-in template
    const l2 = {
      template: "indomaret",
      data: {
        store_name: "LEGACY STORE",
        items: [{ name: "Item A", qty: 1, price: 1000 }],
        payment: 2000,
      },
      page_size: "thermal_default",
    };
    const rl2 = await client.post("/cetak_struk_pdf", l2);
    await logResult("legacy_test_template", l2, rl2.data);

    // --- 6. MANAGEMENT ---
    console.log("\n--- Testing Management ---");
    const m1 = await client.get("/files");
    await logResult("mgmt_files", {}, m1.data);
    const m2 = await client.get("/templates");
    await logResult("mgmt_templates", {}, m2.data);
    const m3 = await client.get("/health");
    await logResult("mgmt_health", {}, m3.data);
    const m4 = await client.get("/");
    await logResult("mgmt_root", {}, m4.data);

    console.log("\n🌟 ALL TESTS COMPLETED SUCCESSFULLY!");
  } catch (err) {
    console.error("\n❌ MASTER TEST FAILED");
    if (err.response) console.error(JSON.stringify(err.response.data, null, 2));
    else console.error(err.message);
  }
}

runMasterTest();
