/**
 * Swagger / OpenAPI Documentation
 * v7.2.1 — Unified API Architecture (Complete)
 */
const swaggerUi = require("swagger-ui-express");
const { PAGE_SIZES, IMAGE_FORMATS } = require("./config");

const spec = {
  openapi: "3.0.0",
  info: {
    title: "HTML to PDF API",
    version: "7.2.1",
    description:
      "Enterprise-Grade Document Generation & Processing API.\n\n" +
      "## Architecture\n" +
      "Two unified endpoints replace 20+ legacy routes:\n" +
      "- **POST /render** — Generate PDFs or Images from HTML, URLs, or Templates\n" +
      "- **POST /pdf-action** — Post-process PDFs (compress, merge, sign, etc.)\n\n" +
      "### Render Features\n" +
      "Charts (Chart.js), Tables (auto-paginated), QR Codes, Barcodes, Watermarks, CSS Injection, Cloud Upload, Signed URLs\n\n" +
      "### PDF Actions\n" +
      "compress, encrypt, sign, merge, split, extract, metadata, thumbnail, email",
    contact: {
      name: "volumeee",
      url: "https://github.com/volumeee/html-to-pdf-api",
    },
    license: { name: "MIT" },
  },
  servers: [{ url: "/", description: "Current Server" }],
  components: {
    securitySchemes: {
      ApiKeyAuth: {
        type: "apiKey",
        in: "header",
        name: "x-api-key",
        description:
          "Optional API key for authentication. Guest access may be enabled.",
      },
    },
  },
  security: [{ ApiKeyAuth: [] }],
  tags: [
    { name: "Core", description: "Unified rendering and processing endpoints" },
    { name: "Queue", description: "Background job processing" },
    { name: "Legacy", description: "Backward-compatible endpoints" },
    { name: "System", description: "Health checks and discovery" },
  ],
  paths: {
    // ─── Render ───────────────────────────────────────────────
    "/render": {
      post: {
        tags: ["Core"],
        summary: "Universal Renderer",
        description:
          "Generate PDFs or Images from HTML, URLs, or Templates.\n\n" +
          "**Supports:** Chart.js injection, auto-paginated tables, QR codes, barcodes, watermarks, CSS injection, header/footer templates, base64 output, cloud upload, signed URLs.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["source_type", "source"],
                properties: {
                  source_type: {
                    type: "string",
                    enum: ["html", "url", "template"],
                    description: "Input source type",
                  },
                  source: {
                    type: "string",
                    description: "HTML string, URL, or template name",
                  },
                  output: {
                    type: "string",
                    enum: ["pdf", "image"],
                    default: "pdf",
                    description: "Output format",
                  },
                  data: {
                    type: "object",
                    description:
                      "Template variables (only for source_type: template)",
                  },
                  filename: {
                    type: "string",
                    description: "Custom output filename",
                  },
                  signed_url: {
                    type: "object",
                    properties: {
                      expiry_minutes: { type: "integer", default: 60 },
                    },
                    description:
                      "Generate a time-limited signed URL for the output",
                  },
                  cloud_upload: {
                    type: "boolean",
                    description:
                      "Upload to configured S3-compatible cloud storage",
                  },
                  async: {
                    type: "boolean",
                    description:
                      "Process in background (queue) and return job_id immediately",
                    default: false,
                  },
                  options: {
                    type: "object",
                    properties: {
                      pageSize: {
                        type: "string",
                        enum: Object.keys(PAGE_SIZES),
                        description: "Page size preset or custom dimensions",
                      },
                      landscape: { type: "boolean" },
                      margin: {
                        type: "object",
                        properties: {
                          top: { type: "string" },
                          bottom: { type: "string" },
                          left: { type: "string" },
                          right: { type: "string" },
                        },
                      },
                      format: {
                        type: "string",
                        enum: IMAGE_FORMATS,
                        description: "Image format (for output: image)",
                      },
                      quality: { type: "integer", minimum: 0, maximum: 100 },
                      fullPage: { type: "boolean", default: true },
                      inject_css: {
                        type: "string",
                        description: "Custom CSS to inject",
                      },
                      watermark: {
                        type: "object",
                        properties: {
                          text: { type: "string" },
                          opacity: { type: "number" },
                          color: { type: "string" },
                          fontSize: { type: "integer" },
                          rotate: { type: "integer" },
                          repeat: {
                            type: "boolean",
                            description:
                              "Tile watermark text across entire page (default: false for single centered text)",
                          },
                        },
                        description:
                          "Overlay watermark. Use repeat: true to tile text diagonally across entire page (ideal for receipts)",
                      },
                      chart: {
                        type: "object",
                        description:
                          "Chart.js configuration object with data, width, height",
                      },
                      table: {
                        type: "object",
                        description:
                          "Table config: { data: [...], options: { columns, headers, zebra } }",
                      },
                      qr_code: {
                        type: "object",
                        properties: {
                          text: { type: "string" },
                          position: {
                            type: "string",
                            enum: [
                              "top-left",
                              "top-center",
                              "top-right",
                              "center",
                              "bottom-left",
                              "bottom-center",
                              "bottom-right",
                            ],
                          },
                          width: { type: "integer" },
                          label: { type: "string" },
                        },
                      },
                      barcode: {
                        type: "object",
                        properties: {
                          text: { type: "string" },
                          type: { type: "string", default: "code128" },
                          position: { type: "string" },
                          label: { type: "string" },
                        },
                      },
                      displayHeaderFooter: { type: "boolean" },
                      headerTemplate: { type: "string" },
                      footerTemplate: { type: "string" },
                      return_base64: { type: "boolean" },
                    },
                  },
                },
              },
              examples: {
                html_to_pdf: {
                  summary: "HTML to PDF",
                  value: {
                    source_type: "html",
                    source: "<h1>Hello World</h1><p>Generated at {{date}}</p>",
                    options: { pageSize: "a4" },
                  },
                },
                url_to_image: {
                  summary: "URL Screenshot",
                  value: {
                    source_type: "url",
                    source: "https://example.com",
                    output: "image",
                    options: { format: "png", fullPage: true },
                  },
                },
                template_receipt: {
                  summary: "Template Receipt",
                  value: {
                    source_type: "template",
                    source: "indomaret",
                    data: {
                      store_name: "My Store",
                      items: [{ name: "Product", qty: 2, price: 10000 }],
                      payment: 25000,
                    },
                  },
                },
                with_chart: {
                  summary: "PDF with Chart",
                  value: {
                    source_type: "html",
                    source: "<h1>Sales Report</h1>",
                    options: {
                      pageSize: "a4",
                      chart: {
                        data: {
                          type: "bar",
                          data: {
                            labels: ["Jan", "Feb", "Mar"],
                            datasets: [
                              { label: "Revenue", data: [100, 200, 150] },
                            ],
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Document rendered successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string", example: "success" },
                    data: {
                      type: "object",
                      properties: {
                        message: { type: "string" },
                        file_url: { type: "string" },
                        filename: { type: "string" },
                        signed_url: { type: "string" },
                        cloud_url: { type: "string" },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },

    // ─── PDF Action ──────────────────────────────────────────
    "/pdf-action": {
      post: {
        tags: ["Core"],
        summary: "Universal PDF Processor",
        description:
          "Apply post-processing actions to existing PDF files.\n\n" +
          "**Available actions:**\n" +
          "- `compress` — Reduce file size (Ghostscript/qpdf/pdf-lib)\n" +
          "- `encrypt` — Add password protection (requires qpdf)\n" +
          "- `sign` — Embed digital signature stamp image\n" +
          "- `merge` — Combine multiple PDFs into one\n" +
          "- `split` — Split PDF into individual pages\n" +
          "- `extract` — Extract specific pages\n" +
          "- `metadata` — Read/write PDF metadata\n" +
          "- `thumbnail` — Generate preview image of a page\n" +
          "- `email` — Send PDF as email attachment via SMTP",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["action"],
                properties: {
                  action: {
                    type: "string",
                    enum: [
                      "compress",
                      "encrypt",
                      "sign",
                      "merge",
                      "split",
                      "extract",
                      "metadata",
                      "thumbnail",
                      "email",
                    ],
                  },
                  filename: {
                    type: "string",
                    description:
                      "Target PDF filename (in /output). Not needed for merge.",
                  },
                  files: {
                    type: "array",
                    items: { type: "string" },
                    description: "List of filenames for merge action",
                  },
                  options: {
                    type: "object",
                    description: "Action-specific options",
                    properties: {
                      password: {
                        type: "string",
                        description: "For encrypt action",
                      },
                      quality: {
                        type: "string",
                        enum: ["screen", "ebook", "printer", "default"],
                        description: "For compress action",
                      },
                      signature_name: {
                        type: "string",
                        description: "For sign action (saved signature)",
                      },
                      signature_base64: {
                        type: "string",
                        description: "For sign action (inline image)",
                      },
                      position: {
                        type: "string",
                        description: "For sign action",
                      },
                      pages: {
                        type: "array",
                        description: 'For extract action: [0, 1, "2-4"]',
                      },
                      title: {
                        type: "string",
                        description: "For metadata action",
                      },
                      author: {
                        type: "string",
                        description: "For metadata action",
                      },
                      to: { type: "string", description: "For email action" },
                      subject: {
                        type: "string",
                        description: "For email action",
                      },
                      format: {
                        type: "string",
                        description: "For thumbnail action",
                      },
                      width: {
                        type: "integer",
                        description: "For thumbnail/sign action",
                      },
                      height: {
                        type: "integer",
                        description: "For thumbnail/sign action",
                      },
                      return_base64: {
                        type: "boolean",
                        description: "For thumbnail action",
                      },
                    },
                  },
                },
              },
              examples: {
                compress: {
                  summary: "Compress PDF",
                  value: {
                    action: "compress",
                    filename: "document.pdf",
                    options: { quality: "ebook" },
                  },
                },
                merge: {
                  summary: "Merge PDFs",
                  value: {
                    action: "merge",
                    files: ["doc1.pdf", "doc2.pdf", "doc3.pdf"],
                  },
                },
                encrypt: {
                  summary: "Password Protect",
                  value: {
                    action: "encrypt",
                    filename: "document.pdf",
                    options: { password: "secret123" },
                  },
                },
                extract: {
                  summary: "Extract Pages",
                  value: {
                    action: "extract",
                    filename: "document.pdf",
                    options: { pages: [0, 2, "4-6"] },
                  },
                },
                metadata: {
                  summary: "Set Metadata",
                  value: {
                    action: "metadata",
                    filename: "document.pdf",
                    options: { title: "Annual Report", author: "Finance Team" },
                  },
                },
                email: {
                  summary: "Email PDF",
                  value: {
                    action: "email",
                    filename: "report.pdf",
                    options: { to: "user@example.com", subject: "Your Report" },
                  },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Action completed successfully" },
        },
      },
    },

    // ─── Queue ───────────────────────────────────────────────
    "/queue": {
      post: {
        tags: ["Queue"],
        summary: "Submit Background Job",
        description:
          "Queue a rendering job for async processing. Useful for heavy operations.",
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["type", "data"],
                properties: {
                  type: {
                    type: "string",
                    enum: ["render", "pdf"],
                    description: "Job type",
                  },
                  data: {
                    type: "object",
                    description:
                      "Job input data (html_content, url, template, etc.)",
                  },
                  priority: {
                    type: "integer",
                    default: 0,
                    description: "Higher = processed first",
                  },
                },
              },
            },
          },
        },
        responses: {
          202: { description: "Job accepted and queued" },
        },
      },
    },
    "/jobs/{id}": {
      get: {
        tags: ["Queue"],
        summary: "Get Job Status",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          200: {
            description: "Job details including status, result, and timing",
          },
          404: { description: "Job not found" },
        },
      },
    },
    "/queue/stats": {
      get: {
        tags: ["Queue"],
        summary: "Queue Statistics",
        responses: {
          200: {
            description:
              "Current queue status (pending, processing, completed counts)",
          },
        },
      },
    },

    // ─── Legacy ──────────────────────────────────────────────
    "/cetak_struk_pdf": {
      post: {
        tags: ["Legacy"],
        summary: "Receipt PDF Generator",
        description:
          "Generate thermal receipt PDFs. Supports both raw HTML and built-in templates.\n\n" +
          "**Tip:** Use `POST /render` with `source_type: template` for the same result with more features.",
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  html_content: {
                    type: "string",
                    description: "Raw HTML content",
                  },
                  template: {
                    type: "string",
                    description: "Template name (e.g., indomaret, invoice)",
                  },
                  data: { type: "object", description: "Template variables" },
                  page_size: { type: "string", default: "thermal_default" },
                  qr_code: { type: "object" },
                  barcode: { type: "object" },
                  watermark: {
                    type: "object",
                    properties: {
                      text: { type: "string" },
                      opacity: { type: "number" },
                      color: { type: "string" },
                      fontSize: { type: "integer" },
                      rotate: { type: "integer" },
                      repeat: { type: "boolean" },
                    },
                  },
                },
              },
            },
          },
        },
        responses: { 200: { description: "Receipt PDF generated" } },
      },
    },

    // ─── System ──────────────────────────────────────────────
    "/health": {
      get: {
        tags: ["System"],
        summary: "Health Check",
        description:
          "Returns system health, memory usage, browser status, storage info, and uptime.",
        responses: {
          200: { description: "System healthy" },
          503: { description: "System degraded" },
        },
      },
    },
    "/templates": {
      get: {
        tags: ["System"],
        summary: "List Templates & Capabilities",
        description:
          "Discover available templates, page sizes, image formats, and barcode types.",
        responses: {
          200: { description: "Available templates and system capabilities" },
        },
      },
    },
    "/files": {
      get: {
        tags: ["System"],
        summary: "List Generated Files",
        parameters: [
          {
            name: "type",
            in: "query",
            schema: { type: "string" },
            description: "Filter by extension (pdf, png, etc.)",
          },
        ],
        responses: {
          200: { description: "List of generated files with URLs" },
        },
      },
    },
  },
};

module.exports = {
  serve: swaggerUi.serve,
  setup: swaggerUi.setup(spec, {
    customCss: ".swagger-ui .topbar { display: none }",
    customSiteTitle: "HTML to PDF API — Documentation",
  }),
};
