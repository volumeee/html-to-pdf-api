/**
 * Email Service
 *
 * Send generated PDFs and files via email using nodemailer.
 *
 * Configuration via environment variables:
 *   SMTP_HOST       = smtp.gmail.com
 *   SMTP_PORT       = 587
 *   SMTP_SECURE     = false (true for port 465)
 *   SMTP_USER       = your@email.com
 *   SMTP_PASS       = your_password_or_app_password
 *   SMTP_FROM       = "PDF API <noreply@example.com>"
 */
const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");

const config = {
  host: process.env.SMTP_HOST || "",
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === "true",
  user: process.env.SMTP_USER || "",
  pass: process.env.SMTP_PASS || "",
  from:
    process.env.SMTP_FROM ||
    process.env.SMTP_USER ||
    "PDF API <noreply@pdfapi.local>",
};

let transporter = null;

/**
 * Check if email is configured
 */
function isEnabled() {
  return !!(config.host && config.user && config.pass);
}

/**
 * Get or create the SMTP transporter
 */
function getTransporter() {
  if (!transporter) {
    if (!isEnabled()) {
      throw new Error(
        "Email is not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASS environment variables.",
      );
    }

    transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.user,
        pass: config.pass,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });
  }
  return transporter;
}

/**
 * Send an email with file attachment(s)
 *
 * @param {object} options
 * @param {string|string[]} options.to - Recipient email(s)
 * @param {string} [options.cc] - CC recipient(s)
 * @param {string} [options.bcc] - BCC recipient(s)
 * @param {string} options.subject - Email subject
 * @param {string} [options.text] - Plain text body
 * @param {string} [options.html] - HTML email body
 * @param {string|string[]} [options.attachments] - File path(s) to attach
 * @param {string} [options.from] - Override sender
 * @returns {Promise<object>} Nodemailer send result
 */
async function sendEmail(options) {
  const transport = getTransporter();

  const mailOptions = {
    from: options.from || config.from,
    to: Array.isArray(options.to) ? options.to.join(", ") : options.to,
    subject: options.subject || "Your PDF Document",
    text: options.text || "",
    html: options.html || "",
  };

  if (options.cc) mailOptions.cc = options.cc;
  if (options.bcc) mailOptions.bcc = options.bcc;

  // Handle attachments
  if (options.attachments) {
    const files = Array.isArray(options.attachments)
      ? options.attachments
      : [options.attachments];

    mailOptions.attachments = files
      .filter((f) => fs.existsSync(f))
      .map((filePath) => ({
        filename: path.basename(filePath),
        path: filePath,
      }));
  }

  const result = await transport.sendMail(mailOptions);

  return {
    message_id: result.messageId,
    accepted: result.accepted,
    rejected: result.rejected || [],
  };
}

/**
 * Send a generated PDF via email
 *
 * @param {string} filePath - Absolute path to the PDF
 * @param {object} options
 * @param {string|string[]} options.to - Recipient(s)
 * @param {string} [options.subject] - Subject
 * @param {string} [options.message] - Body text
 * @param {string} [options.cc]
 * @param {string} [options.bcc]
 */
async function sendPdfEmail(filePath, options) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  const filename = path.basename(filePath);

  return sendEmail({
    to: options.to,
    cc: options.cc,
    bcc: options.bcc,
    subject: options.subject || `Your PDF: ${filename}`,
    text:
      options.message ||
      `Hi,\n\nPlease find your generated PDF document attached.\n\nFilename: ${filename}\nGenerated: ${new Date().toISOString()}\n\n— HTML to PDF API`,
    html:
      options.html ||
      `<div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #1a1a2e;">📄 Your PDF Document</h2>
        <p>Your generated PDF is attached to this email.</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr style="background: #f5f5f5;">
            <td style="padding: 8px 12px; font-weight: bold;">Filename</td>
            <td style="padding: 8px 12px;">${filename}</td>
          </tr>
          <tr>
            <td style="padding: 8px 12px; font-weight: bold;">Generated</td>
            <td style="padding: 8px 12px;">${new Date().toLocaleString()}</td>
          </tr>
        </table>
        ${options.message ? `<p>${options.message}</p>` : ""}
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 12px; color: #888;">Sent by HTML to PDF API</p>
      </div>`,
    attachments: [filePath],
  });
}

/**
 * Verify SMTP connection
 */
async function verifyConnection() {
  if (!isEnabled()) {
    return { configured: false, error: "SMTP not configured" };
  }

  try {
    const transport = getTransporter();
    await transport.verify();
    return { configured: true, connected: true, host: config.host };
  } catch (err) {
    return { configured: true, connected: false, error: err.message };
  }
}

/**
 * Get email configuration status
 */
function getEmailInfo() {
  return {
    enabled: isEnabled(),
    host: config.host || null,
    port: config.port,
    secure: config.secure,
    from: config.from,
  };
}

module.exports = {
  sendEmail,
  sendPdfEmail,
  verifyConnection,
  isEnabled,
  getEmailInfo,
};
