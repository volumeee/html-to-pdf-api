/**
 * Custom Template Service
 *
 * Allows admin to create, edit, and delete custom HTML templates
 * stored in data/templates/ directory.
 */
const fs = require("fs");
const path = require("path");

const TEMPLATES_DIR = path.join(__dirname, "../../data/templates");
const META_FILE = path.join(TEMPLATES_DIR, "_meta.json");

// Ensure directories exist
if (!fs.existsSync(TEMPLATES_DIR)) {
  fs.mkdirSync(TEMPLATES_DIR, { recursive: true });
}

/**
 * Load template metadata
 */
function loadMeta() {
  try {
    if (fs.existsSync(META_FILE)) {
      return JSON.parse(fs.readFileSync(META_FILE, "utf-8"));
    }
  } catch (err) {
    console.error("[CustomTemplate] Could not load meta:", err.message);
  }
  return {};
}

/**
 * Save template metadata
 */
function saveMeta(meta) {
  fs.writeFileSync(META_FILE, JSON.stringify(meta, null, 2));
}

/**
 * List all custom templates
 */
function listCustomTemplates() {
  const meta = loadMeta();
  return Object.entries(meta).map(([name, data]) => ({
    name,
    ...data,
    type: "custom",
  }));
}

/**
 * Get custom template HTML
 */
function getCustomTemplate(name) {
  const meta = loadMeta();
  if (!meta[name]) return null;

  const filePath = path.join(TEMPLATES_DIR, `${name}.html`);
  if (!fs.existsSync(filePath)) return null;

  const htmlTemplate = fs.readFileSync(filePath, "utf-8");

  return {
    ...meta[name],
    html: htmlTemplate,
    fn: (data) => {
      // Simple Mustache-like replacement: {{key}} → value
      let result = htmlTemplate;
      if (data && typeof data === "object") {
        Object.entries(data).forEach(([key, value]) => {
          const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, "g");
          result = result.replace(regex, String(value));
        });
      }
      // Remove unreplaced placeholders
      result = result.replace(/\{\{\s*\w+\s*\}\}/g, "");
      return result;
    },
  };
}

/**
 * Create or update a custom template
 */
function saveCustomTemplate(name, data) {
  const meta = loadMeta();
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");

  const filePath = path.join(TEMPLATES_DIR, `${slug}.html`);
  fs.writeFileSync(filePath, data.html || "", "utf-8");

  meta[slug] = {
    description: data.description || `Custom template: ${name}`,
    defaultPageSize: data.page_size || "a4",
    category: data.category || "custom",
    created_at: meta[slug]?.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
    variables: data.variables || [],
  };

  saveMeta(meta);
  return { name: slug, ...meta[slug] };
}

/**
 * Delete a custom template
 */
function deleteCustomTemplate(name) {
  const meta = loadMeta();
  if (!meta[name]) return false;

  const filePath = path.join(TEMPLATES_DIR, `${name}.html`);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

  delete meta[name];
  saveMeta(meta);
  return true;
}

/**
 * Get template HTML source for editing
 */
function getTemplateSource(name) {
  const meta = loadMeta();
  if (!meta[name]) return null;

  const filePath = path.join(TEMPLATES_DIR, `${name}.html`);
  if (!fs.existsSync(filePath)) return null;

  return {
    name,
    html: fs.readFileSync(filePath, "utf-8"),
    ...meta[name],
  };
}

module.exports = {
  listCustomTemplates,
  getCustomTemplate,
  saveCustomTemplate,
  deleteCustomTemplate,
  getTemplateSource,
};
