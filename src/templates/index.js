/**
 * Template Registry
 * Central place to register and access all templates.
 * Now supports custom templates uploaded via Admin Panel.
 */
const {
  getCustomTemplate,
  listCustomTemplates,
} = require("../services/customTemplate");

const templates = {
  indomaret: {
    fn: require("./indomaret"),
    description: "Struk thermal ala Indomaret/Alfamart",
    defaultPageSize: "thermal_default",
    category: "receipt",
  },
  modern: {
    fn: require("./modern"),
    description: "Struk thermal desain modern & minimalis",
    defaultPageSize: "thermal_default",
    category: "receipt",
  },
  invoice: {
    fn: require("./invoice"),
    description: "Invoice A4 profesional dengan PPN",
    defaultPageSize: "a4",
    category: "document",
  },
  surat: {
    fn: require("./surat"),
    description: "Surat resmi dengan kop surat & tanda tangan",
    defaultPageSize: "a4",
    category: "document",
  },
  sertifikat: {
    fn: require("./sertifikat"),
    description: "Sertifikat/piagam landscape dengan border dekoratif",
    defaultPageSize: "sertifikat",
    category: "document",
  },
  label: {
    fn: require("./label"),
    description: "Label pengiriman paket (100x150mm)",
    defaultPageSize: "label",
    category: "shipping",
  },
};

function getTemplate(name) {
  // Check built-in templates first
  if (templates[name]) return templates[name];

  // Fallback to custom templates
  const custom = getCustomTemplate(name);
  if (custom) return custom;

  return null;
}

function listTemplates() {
  const builtIn = Object.entries(templates).map(([name, t]) => ({
    name,
    description: t.description,
    default_page_size: t.defaultPageSize,
    category: t.category,
    type: "built-in",
  }));

  const custom = listCustomTemplates();

  return [...builtIn, ...custom];
}

module.exports = { getTemplate, listTemplates };
