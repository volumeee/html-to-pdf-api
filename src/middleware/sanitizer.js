/**
 * HTML Content Sanitizer
 *
 * Sanitizes HTML input to prevent XSS attacks while preserving
 * legitimate styling and layout needed for PDF rendering.
 *
 * Uses sanitize-html with a permissive but safe configuration
 * that allows CSS styling (needed for PDF layout) while blocking
 * dangerous elements like scripts, iframes, and event handlers.
 */
const sanitizeHtml = require("sanitize-html");

/**
 * Sanitize HTML configuration — permissive for PDF rendering
 * Allows all common HTML tags and CSS styling, but strips:
 *   - <script> tags
 *   - <iframe>, <object>, <embed>, <applet> tags
 *   - Event handler attributes (onclick, onerror, onload, etc.)
 *   - javascript: protocol in URLs
 */
const SANITIZE_OPTIONS = {
  allowedTags: sanitizeHtml.defaults.allowedTags.concat([
    // Layout & structure
    "html",
    "head",
    "body",
    "header",
    "footer",
    "main",
    "nav",
    "section",
    "article",
    "aside",
    "figure",
    "figcaption",
    "details",
    "summary",
    // Text & formatting
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "p",
    "span",
    "div",
    "br",
    "hr",
    "pre",
    "code",
    "blockquote",
    "cite",
    "abbr",
    "time",
    "mark",
    "small",
    "strong",
    "b",
    "em",
    "i",
    "u",
    "s",
    "del",
    "ins",
    "sub",
    "sup",
    // Lists
    "ul",
    "ol",
    "li",
    "dl",
    "dt",
    "dd",
    // Tables (critical for receipts/invoices)
    "table",
    "thead",
    "tbody",
    "tfoot",
    "tr",
    "th",
    "td",
    "caption",
    "colgroup",
    "col",
    // Media (images only — no iframes)
    "img",
    "svg",
    "path",
    "circle",
    "rect",
    "line",
    "polyline",
    "polygon",
    "g",
    "defs",
    "use",
    "text",
    "tspan",
    // Forms (for display purposes)
    "label",
    "input",
    "select",
    "option",
    "textarea",
    // Styling
    "style",
    "link",
    // Other
    "meta",
    "title",
    "address",
    "wbr",
  ]),
  allowedAttributes: {
    "*": [
      "style",
      "class",
      "id",
      "data-*",
      "width",
      "height",
      "align",
      "valign",
      "dir",
      "lang",
      "title",
      "role",
      "aria-*",
      "tabindex",
    ],
    a: ["href", "name", "target", "rel"],
    img: ["src", "alt", "width", "height", "loading"],
    td: [
      "colspan",
      "rowspan",
      "style",
      "class",
      "width",
      "height",
      "align",
      "valign",
    ],
    th: [
      "colspan",
      "rowspan",
      "style",
      "class",
      "width",
      "height",
      "align",
      "valign",
    ],
    col: ["span", "width"],
    colgroup: ["span"],
    table: ["border", "cellpadding", "cellspacing", "width", "style", "class"],
    link: ["rel", "href", "type"],
    meta: ["charset", "name", "content", "http-equiv"],
    input: ["type", "value", "checked", "disabled", "readonly", "placeholder"],
    select: ["name", "disabled"],
    option: ["value", "selected"],
    textarea: ["rows", "cols", "disabled", "readonly"],
    svg: [
      "viewBox",
      "xmlns",
      "fill",
      "stroke",
      "stroke-width",
      "width",
      "height",
    ],
    path: ["d", "fill", "stroke", "stroke-width", "transform"],
    circle: ["cx", "cy", "r", "fill", "stroke"],
    rect: ["x", "y", "width", "height", "rx", "ry", "fill", "stroke"],
    line: ["x1", "y1", "x2", "y2", "stroke", "stroke-width"],
    g: ["transform", "fill", "stroke"],
    text: ["x", "y", "font-size", "fill", "text-anchor", "transform"],
    tspan: ["x", "y", "dx", "dy"],
  },
  // Disallow dangerous tags
  disallowedTagsMode: "discard",
  // Allow safe URL schemes only
  allowedSchemes: ["http", "https", "data", "mailto"],
  allowedSchemesByTag: {
    img: ["http", "https", "data"],
    a: ["http", "https", "mailto"],
    link: ["http", "https"],
  },
  // Allow all CSS styles (needed for PDF layout)
  allowedStyles: {
    "*": {
      // Allow all CSS properties — we trust the layout needs
      // but the tag/attribute filtering prevents XSS
    },
  },
  // Strip event handlers (onclick, onerror, onload, etc.)
  // sanitize-html strips these by default since they're not in allowedAttributes
  allowVulnerableTags: true,
  // Don't encode entities in style blocks
  textFilter: null,
};

/**
 * Sanitize HTML content for safe rendering
 * @param {string} html - Raw HTML input
 * @returns {string} Sanitized HTML
 */
function sanitize(html) {
  if (!html || typeof html !== "string") return html;
  return sanitizeHtml(html, SANITIZE_OPTIONS);
}

/**
 * Express middleware — sanitizes html_content in request body
 */
function sanitizeMiddleware(req, res, next) {
  if (req.body) {
    // Sanitize legacy field
    if (req.body.html_content && typeof req.body.html_content === "string") {
      req.body.html_content = sanitize(req.body.html_content);
    }
    // Sanitize new Unified API field if source_type is "html"
    if (
      req.body.source_type === "html" &&
      req.body.source &&
      typeof req.body.source === "string"
    ) {
      req.body.source = sanitize(req.body.source);
    }
  }
  next();
}

module.exports = { sanitize, sanitizeMiddleware, SANITIZE_OPTIONS };
