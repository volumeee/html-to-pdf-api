/**
 * Request Validation Middleware
 *
 * Validates request bodies before they reach route handlers.
 * Returns clear error messages for invalid input.
 */

function validateUrl(value) {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

/**
 * Create a validation middleware from a schema definition
 * @param {object} schema - { field: { required?, type?, validate?, message? } }
 */
function validate(schema) {
  return (req, res, next) => {
    const errors = [];

    for (const [field, rules] of Object.entries(schema)) {
      const value = req.body[field];

      // Required check
      if (
        rules.required &&
        (value === undefined || value === null || value === "")
      ) {
        errors.push(
          `${field} is required${rules.message ? ` (${rules.message})` : ""}`,
        );
        continue;
      }

      // Skip optional missing fields
      if (value === undefined || value === null) continue;

      // Type check
      if (rules.type === "string" && typeof value !== "string") {
        errors.push(`${field} must be a string`);
      }
      if (rules.type === "number" && typeof value !== "number") {
        errors.push(`${field} must be a number`);
      }
      if (rules.type === "array" && !Array.isArray(value)) {
        errors.push(`${field} must be an array`);
      }
      if (
        rules.type === "object" &&
        (typeof value !== "object" || Array.isArray(value))
      ) {
        errors.push(`${field} must be an object`);
      }
      if (rules.type === "boolean" && typeof value !== "boolean") {
        errors.push(`${field} must be a boolean`);
      }
      if (rules.type === "url" && !validateUrl(value)) {
        errors.push(`${field} must be a valid URL`);
      }

      // Enum check
      if (rules.enum && !rules.enum.includes(value)) {
        errors.push(`${field} must be one of: ${rules.enum.join(", ")}`);
      }

      // Min/Max for arrays
      if (
        rules.minLength &&
        Array.isArray(value) &&
        value.length < rules.minLength
      ) {
        errors.push(`${field} must have at least ${rules.minLength} items`);
      }

      // Custom validator
      if (rules.validate && !rules.validate(value)) {
        errors.push(rules.message || `${field} is invalid`);
      }
    }

    if (errors.length > 0) {
      return res
        .status(400)
        .json({ status: "error", error: "Validation failed", details: errors });
    }

    next();
  };
}

// ─── Pre-built Schemas ──────────────────────────────────────

const schemas = {
  htmlToPdf: validate({
    html_content: {
      required: true,
      type: "string",
      message: "HTML string to convert",
    },
  }),

  templateGenerate: validate({
    template: { required: true, type: "string" },
    data: { required: true, type: "object" },
  }),

  urlToPdf: validate({
    url: {
      required: true,
      type: "url",
      message: "Must be a valid URL (https://...)",
    },
  }),

  htmlToImage: validate({
    html_content: { required: true, type: "string" },
  }),

  urlToImage: validate({
    url: { required: true, type: "url" },
  }),

  merge: validate({
    files: {
      required: true,
      type: "array",
      minLength: 2,
      message: "Array of filenames (min 2)",
    },
  }),

  batch: validate({
    template: { required: true, type: "string" },
    batch: {
      required: true,
      type: "array",
      minLength: 1,
      message: "Array of data objects",
    },
  }),

  webhook: validate({
    webhook_url: { required: true, type: "url", message: "Callback URL" },
  }),
};

module.exports = { validate, schemas };
