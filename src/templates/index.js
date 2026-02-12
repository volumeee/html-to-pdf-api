/**
 * Template Registry
 * Central place to register and access all templates.
 */
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
  return templates[name] || null;
}

function listTemplates() {
  return Object.entries(templates).map(([name, t]) => ({
    name,
    description: t.description,
    default_page_size: t.defaultPageSize,
    category: t.category,
  }));
}

module.exports = { getTemplate, listTemplates };
