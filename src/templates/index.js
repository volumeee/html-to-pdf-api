/**
 * Template Registry
 * Central place to register and access all templates.
 */
const templates = {
  indomaret: {
    fn: require("./indomaret"),
    description: "Struk thermal ala Indomaret/Alfamart",
    defaultPageSize: "thermal_default",
  },
  modern: {
    fn: require("./modern"),
    description: "Struk thermal desain modern & minimalis",
    defaultPageSize: "thermal_default",
  },
  invoice: {
    fn: require("./invoice"),
    description: "Invoice A4 profesional dengan PPN",
    defaultPageSize: "a4",
  },
};

/**
 * Get a template by name
 * @param {string} name
 * @returns {{ fn: Function, description: string, defaultPageSize: string } | null}
 */
function getTemplate(name) {
  return templates[name] || null;
}

/**
 * List all available template names with descriptions
 * @returns {Array}
 */
function listTemplates() {
  return Object.entries(templates).map(([name, t]) => ({
    name,
    description: t.description,
    default_page_size: t.defaultPageSize,
  }));
}

module.exports = { getTemplate, listTemplates };
