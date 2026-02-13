/**
 * Swagger / OpenAPI Documentation
 * v7.0.0
 */
const swaggerUi = require("swagger-ui-express");
const { PAGE_SIZES, IMAGE_FORMATS } = require("./config");

const spec = {
  openapi: "3.0.0",
  info: {
    title: "HTML to PDF API",
    version: "7.0.0",
    description:
      "Universal HTML/URL to PDF & Screenshot API with template engine, watermark, QR/Barcode generation, digital signatures, PDF encryption, signed URLs, custom templates, API Key management, and enterprise admin panel.",
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
        description: "Your API key for authentication and tracking.",
      },
      BearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
  },
  security: [{ ApiKeyAuth: [] }],
  tags: [
    { name: "PDF", description: "Generate PDF documents" },
    { name: "Screenshot", description: "Capture screenshots" },
    { name: "QR & Barcode", description: "Generate QR codes and barcodes" },
    {
      name: "Security",
      description: "PDF encryption, digital signatures, signed URLs",
    },
    { name: "Convert", description: "File format conversion" },
    { name: "Advanced", description: "Merge, batch, webhook" },
    { name: "Files", description: "File management" },
    { name: "Monitoring", description: "Health check & system status" },
    { name: "Admin", description: "Admin panel API (requires auth)" },
  ],
  paths: {
    "/cetak_struk_pdf": {
      post: {
        tags: ["PDF"],
        summary: "HTML → PDF",
        description: "Convert raw HTML content to a PDF file.",
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["html_content"],
                properties: {
                  html_content: {
                    type: "string",
                    description: "HTML string to convert",
                  },
                  filename: { type: "string" },
                  page_size: { type: "string", enum: Object.keys(PAGE_SIZES) },
                  watermark: {
                    type: "object",
                    properties: {
                      text: { type: "string" },
                      opacity: { type: "number" },
                    },
                  },
                  qr_code: {
                    type: "object",
                    description: "Embed QR code into the PDF",
                    properties: {
                      text: {
                        type: "string",
                        example: "https://example.com",
                      },
                      position: {
                        type: "string",
                        enum: [
                          "top-left",
                          "top-right",
                          "top-center",
                          "bottom-left",
                          "bottom-right",
                          "bottom-center",
                          "center",
                          "inline",
                        ],
                        example: "bottom-right",
                      },
                      width: { type: "integer", example: 120 },
                      label: { type: "string", example: "Scan me" },
                    },
                  },
                  barcode: {
                    type: "object",
                    description: "Embed barcode into the PDF",
                    properties: {
                      text: { type: "string", example: "1234567890" },
                      type: {
                        type: "string",
                        enum: ["code128", "ean13", "ean8", "upca", "code39"],
                        example: "code128",
                      },
                      position: {
                        type: "string",
                        enum: ["top-center", "bottom-center", "inline"],
                        example: "inline",
                      },
                    },
                  },
                  return_base64: { type: "boolean" },
                  password: { type: "string" },
                },
              },
            },
          },
        },
        responses: { 200: { description: "PDF generated successfully" } },
      },
    },
    "/generate": {
      post: {
        tags: ["PDF"],
        summary: "Template → PDF",
        description:
          "Generate a PDF from a pre-built template with dynamic data.",
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["template", "data"],
                properties: {
                  template: {
                    type: "string",
                    enum: [
                      "indomaret",
                      "modern",
                      "invoice",
                      "surat",
                      "sertifikat",
                      "label",
                    ],
                  },
                  data: { type: "object" },
                  filename: { type: "string" },
                  page_size: { type: "string" },
                  watermark: { type: "object" },
                  qr_code: {
                    type: "object",
                    description: "Embed QR code",
                    properties: {
                      text: { type: "string" },
                      position: { type: "string" },
                      width: { type: "integer" },
                    },
                  },
                  barcode: {
                    type: "object",
                    description: "Embed barcode",
                    properties: {
                      text: { type: "string" },
                      type: { type: "string" },
                    },
                  },
                  return_base64: { type: "boolean" },
                  password: { type: "string" },
                },
              },
            },
          },
        },
        responses: { 200: { description: "PDF generated successfully" } },
      },
    },
    "/url-to-pdf": {
      post: {
        tags: ["PDF"],
        summary: "URL → PDF",
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["url"],
                properties: {
                  url: { type: "string", format: "uri" },
                  filename: { type: "string" },
                  page_size: { type: "string" },
                  inject_css: { type: "string" },
                  watermark: { type: "object" },
                  qr_code: {
                    type: "object",
                    properties: {
                      text: { type: "string" },
                      position: { type: "string" },
                      width: { type: "integer" },
                    },
                  },
                  barcode: {
                    type: "object",
                    properties: {
                      text: { type: "string" },
                      type: { type: "string" },
                    },
                  },
                  return_base64: { type: "boolean" },
                  password: { type: "string" },
                },
              },
            },
          },
        },
        responses: { 200: { description: "URL converted to PDF" } },
      },
    },
    "/html-to-image": {
      post: {
        tags: ["Screenshot"],
        summary: "HTML → Image",
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["html_content"],
                properties: {
                  html_content: { type: "string" },
                  filename: { type: "string" },
                  format: { type: "string", enum: IMAGE_FORMATS },
                  quality: { type: "integer", minimum: 0, maximum: 100 },
                  full_page: { type: "boolean" },
                  watermark: { type: "object" },
                  return_base64: { type: "boolean" },
                },
              },
            },
          },
        },
        responses: { 200: { description: "Screenshot captured" } },
      },
    },
    "/url-to-image": {
      post: {
        tags: ["Screenshot"],
        summary: "URL → Image",
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["url"],
                properties: {
                  url: { type: "string", format: "uri" },
                  filename: { type: "string" },
                  format: { type: "string", enum: IMAGE_FORMATS },
                  inject_css: { type: "string" },
                  watermark: { type: "object" },
                  return_base64: { type: "boolean" },
                },
              },
            },
          },
        },
        responses: { 200: { description: "Screenshot captured" } },
      },
    },
    "/encrypt-pdf": {
      post: {
        tags: ["Security"],
        summary: "Encrypt PDF with password",
        description:
          "Add AES-256 password protection to an existing PDF file. Requires qpdf on server.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["filename", "password"],
                properties: {
                  filename: {
                    type: "string",
                    description: "Name of existing PDF in output folder",
                    example: "invoice_1234567890.pdf",
                  },
                  password: {
                    type: "string",
                    description: "Password to protect the PDF",
                    example: "mySecret123",
                  },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "PDF encrypted successfully" },
          501: { description: "qpdf not available" },
        },
      },
    },
    "/sign-pdf": {
      post: {
        tags: ["Security"],
        summary: "Digital signature stamp",
        description:
          "Embed a signature stamp image onto a specific page of a PDF. Upload stamps via /admin/signatures.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["filename"],
                properties: {
                  filename: {
                    type: "string",
                    description: "Name of PDF in output folder",
                    example: "invoice_1234567890.pdf",
                  },
                  signature_name: {
                    type: "string",
                    description: "Name of a saved signature stamp",
                    example: "ceo_signature",
                  },
                  signature_base64: {
                    type: "string",
                    description:
                      "OR inline base64 image (PNG/JPG). Use data:image/png;base64,... format.",
                  },
                  position: {
                    type: "string",
                    enum: [
                      "bottom-right",
                      "bottom-left",
                      "bottom-center",
                      "top-right",
                      "top-left",
                      "top-center",
                      "center",
                      "custom",
                    ],
                    default: "bottom-right",
                  },
                  page: {
                    type: "integer",
                    description:
                      "Page to sign (0=last page, 1-based). Default: last page.",
                    default: 0,
                  },
                  width: {
                    type: "integer",
                    description: "Signature width in points",
                    default: 120,
                  },
                  height: {
                    type: "integer",
                    description: "Signature height in points",
                    default: 60,
                  },
                  opacity: {
                    type: "number",
                    minimum: 0,
                    maximum: 1,
                    default: 1.0,
                  },
                  x: {
                    type: "number",
                    description: "Custom x position (only if position=custom)",
                  },
                  y: {
                    type: "number",
                    description: "Custom y position (only if position=custom)",
                  },
                },
              },
            },
          },
        },
        responses: { 200: { description: "PDF signed successfully" } },
      },
    },
    "/secure/generate": {
      post: {
        tags: ["Security"],
        summary: "Generate signed URL",
        description:
          "Generate a time-limited, tamper-proof URL for accessing a file.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["filename"],
                properties: {
                  filename: {
                    type: "string",
                    example: "invoice_1234567890.pdf",
                  },
                  expiry_minutes: {
                    type: "integer",
                    description: "URL expiry in minutes (default from config)",
                    example: 60,
                  },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Signed URL generated" },
          404: { description: "File not found" },
        },
      },
    },
    "/secure/{filename}": {
      get: {
        tags: ["Security"],
        summary: "Access file via signed URL",
        description:
          "Serve a file using a signed URL with expiry and HMAC verification.",
        parameters: [
          {
            name: "filename",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
          {
            name: "expires",
            in: "query",
            required: true,
            schema: { type: "string" },
          },
          {
            name: "sig",
            in: "query",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          200: { description: "File served" },
          403: { description: "Invalid or expired signature" },
        },
      },
    },
    "/pdf-to-image": {
      post: {
        tags: ["Convert"],
        summary: "PDF → Image",
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["filename"],
                properties: {
                  filename: { type: "string" },
                  format: { type: "string", enum: IMAGE_FORMATS },
                },
              },
            },
          },
        },
        responses: { 200: { description: "PDF converted to image" } },
      },
    },
    "/to-csv": {
      post: {
        tags: ["Convert"],
        summary: "Data → CSV",
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["data"],
                properties: {
                  data: { type: "array", items: { type: "object" } },
                  columns: { type: "array", items: { type: "string" } },
                  filename: { type: "string" },
                },
              },
            },
          },
        },
        responses: { 200: { description: "CSV generated" } },
      },
    },
    "/merge": {
      post: {
        tags: ["Advanced"],
        summary: "Merge PDFs",
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["files"],
                properties: {
                  files: {
                    type: "array",
                    items: { type: "string" },
                    minItems: 2,
                  },
                  filename: { type: "string" },
                },
              },
            },
          },
        },
        responses: { 200: { description: "PDFs merged" } },
      },
    },
    "/batch": {
      post: {
        tags: ["Advanced"],
        summary: "Batch Generate",
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["template", "batch"],
                properties: {
                  template: { type: "string" },
                  batch: { type: "array", items: { type: "object" } },
                  filename: { type: "string" },
                },
              },
            },
          },
        },
        responses: { 200: { description: "Batch PDF generated" } },
      },
    },
    "/webhook": {
      post: {
        tags: ["Advanced"],
        summary: "Async Generate + Webhook (with retry)",
        description:
          "Generate PDF asynchronously and deliver the result to a webhook URL. Supports configurable retry with exponential backoff.",
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["webhook_url"],
                properties: {
                  webhook_url: { type: "string", format: "uri" },
                  source: {
                    type: "object",
                    properties: {
                      html: { type: "string" },
                      url: { type: "string" },
                    },
                  },
                  template: { type: "string" },
                  data: { type: "object" },
                  options: {
                    type: "object",
                    properties: {
                      max_retries: {
                        type: "integer",
                        description: "Max delivery retries (default 3)",
                      },
                      retry_delay_ms: {
                        type: "integer",
                        description: "Base retry delay in ms (default 3000)",
                      },
                    },
                  },
                },
              },
            },
          },
        },
        responses: { 200: { description: "Job accepted" } },
      },
    },
    "/health": {
      get: {
        tags: ["Monitoring"],
        summary: "System health check",
        description:
          "Returns system status including browser health, memory, disk usage, CPU load.",
        responses: {
          200: { description: "System healthy" },
          503: { description: "System degraded (browser disconnected)" },
        },
      },
    },
    "/templates/{name}/preview": {
      get: {
        tags: ["Files"],
        summary: "Preview template",
        description:
          "Generate a sample PDF from a template using built-in sample data.",
        parameters: [
          {
            name: "name",
            in: "path",
            required: true,
            schema: { type: "string" },
            description: "Template name",
          },
        ],
        responses: {
          200: { description: "Preview PDF generated" },
          404: { description: "Template not found" },
        },
      },
    },
    "/files": {
      get: {
        tags: ["Files"],
        summary: "List all files",
        parameters: [{ name: "type", in: "query", schema: { type: "string" } }],
        responses: { 200: { description: "Files listed" } },
      },
    },
    "/files/{filename}": {
      delete: {
        tags: ["Files"],
        summary: "Delete a file",
        parameters: [
          {
            name: "filename",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: { 200: { description: "File deleted" } },
      },
    },
    "/cleanup": {
      post: {
        tags: ["Files"],
        summary: "Remove old files",
        requestBody: {
          content: {
            "application/json": {
              schema: {
                properties: { max_age_hours: { type: "number" } },
              },
            },
          },
        },
        responses: { 200: { description: "Cleanup completed" } },
      },
    },
    "/templates": {
      get: {
        tags: ["Files"],
        summary: "List templates & capabilities",
        responses: {
          200: { description: "Templates and capabilities info" },
        },
      },
    },
    "/admin/login": {
      post: {
        tags: ["Admin"],
        summary: "Admin login",
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["username", "password"],
                properties: {
                  username: { type: "string" },
                  password: { type: "string" },
                },
              },
            },
          },
        },
        responses: { 200: { description: "JWT token returned" } },
      },
    },
    "/admin/signatures": {
      get: {
        tags: ["Admin"],
        summary: "List all signature stamps",
        security: [{ BearerAuth: [] }],
        responses: { 200: { description: "Signatures listed" } },
      },
      post: {
        tags: ["Admin"],
        summary: "Upload signature stamp",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "image"],
                properties: {
                  name: {
                    type: "string",
                    description: "Signature name identifier",
                    example: "ceo_signature",
                  },
                  image: {
                    type: "string",
                    description:
                      "Base64 encoded image (PNG/JPG). Can include data:image/... header.",
                  },
                },
              },
            },
          },
        },
        responses: { 200: { description: "Signature saved" } },
      },
    },
    "/admin/signatures/{name}": {
      delete: {
        tags: ["Admin"],
        summary: "Delete signature stamp",
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: "name",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: { 200: { description: "Signature deleted" } },
      },
    },
    "/qr-code": {
      post: {
        tags: ["QR & Barcode"],
        summary: "Generate QR Code",
        description: "Generate a QR Code image from text/URL.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["text"],
                properties: {
                  text: { type: "string", example: "https://example.com" },
                  width: { type: "integer", example: 300 },
                  margin: { type: "integer", example: 2 },
                  color: { type: "string", example: "#000000" },
                  background: { type: "string", example: "#ffffff" },
                  format: {
                    type: "string",
                    enum: ["file", "base64"],
                    example: "file",
                  },
                  errorLevel: {
                    type: "string",
                    enum: ["L", "M", "Q", "H"],
                    example: "M",
                  },
                },
              },
            },
          },
        },
        responses: { 200: { description: "QR Code generated" } },
      },
    },
    "/barcode": {
      post: {
        tags: ["QR & Barcode"],
        summary: "Generate Barcode",
        description:
          "Generate a barcode image. Supports: code128, ean13, ean8, upca, upce, itf14, code39, code93, datamatrix, pdf417, qrcode.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["text"],
                properties: {
                  text: { type: "string", example: "1234567890128" },
                  type: {
                    type: "string",
                    enum: [
                      "code128",
                      "ean13",
                      "ean8",
                      "upca",
                      "upce",
                      "itf14",
                      "code39",
                      "code93",
                      "datamatrix",
                      "pdf417",
                      "qrcode",
                    ],
                    example: "code128",
                  },
                  scale: { type: "integer", example: 3 },
                  height: { type: "integer", example: 10 },
                  includetext: { type: "boolean", example: true },
                  color: { type: "string", example: "#000000" },
                  background: { type: "string", example: "#ffffff" },
                  format: {
                    type: "string",
                    enum: ["file", "base64"],
                    example: "file",
                  },
                },
              },
            },
          },
        },
        responses: { 200: { description: "Barcode generated" } },
      },
    },
    "/qr-pdf": {
      post: {
        tags: ["QR & Barcode"],
        summary: "QR Code → PDF",
        description: "Generate a PDF document with an embedded QR Code.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["text"],
                properties: {
                  text: { type: "string", example: "https://example.com" },
                  title: { type: "string", example: "Scan Me" },
                  description: {
                    type: "string",
                    example: "Scan this QR code to visit our website",
                  },
                  width: { type: "integer", example: 400 },
                  color: { type: "string", example: "#000000" },
                  return_base64: { type: "boolean" },
                },
              },
            },
          },
        },
        responses: { 200: { description: "QR PDF generated" } },
      },
    },
  },
};

function setupSwagger(app) {
  app.use(
    "/docs",
    swaggerUi.serve,
    swaggerUi.setup(spec, {
      customCss: ".swagger-ui .topbar { display: none }",
      customSiteTitle: "HTML to PDF API v7.0.0 — Documentation",
    }),
  );
}

module.exports = setupSwagger;
