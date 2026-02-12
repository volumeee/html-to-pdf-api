/**
 * Swagger / OpenAPI Documentation
 */
const swaggerUi = require("swagger-ui-express");
const { PAGE_SIZES, IMAGE_FORMATS } = require("./config");

const spec = {
  openapi: "3.0.0",
  info: {
    title: "HTML to PDF API",
    version: "5.2.5",
    description:
      "Universal HTML/URL to PDF & Screenshot API with template engine, watermark, API Key management, and advanced admin panel.",
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
    { name: "Convert", description: "File format conversion" },
    { name: "Advanced", description: "Merge, batch, webhook" },
    { name: "Files", description: "File management" },
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
        summary: "Async Generate + Webhook",
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
                },
              },
            },
          },
        },
        responses: { 200: { description: "Job accepted" } },
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
        responses: { 200: { description: "Templates and capabilities info" } },
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
  },
};

function setupSwagger(app) {
  app.use(
    "/docs",
    swaggerUi.serve,
    swaggerUi.setup(spec, {
      customCss: ".swagger-ui .topbar { display: none }",
      customSiteTitle: "HTML to PDF API — Documentation",
    }),
  );
}

module.exports = setupSwagger;
