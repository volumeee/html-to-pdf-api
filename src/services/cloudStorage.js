/**
 * Cloud Storage Service
 *
 * Supports S3-compatible storage (AWS S3, Google Cloud Storage, MinIO, DigitalOcean Spaces).
 * Uses native HTTPS to avoid heavy AWS SDK dependency.
 *
 * When enabled, files are uploaded to cloud after generation.
 * Local files can optionally be kept or removed.
 *
 * Configuration via environment variables:
 *   STORAGE_PROVIDER    = s3 | gcs | minio | local (default: local)
 *   STORAGE_ENDPOINT    = https://s3.amazonaws.com (or custom)
 *   STORAGE_BUCKET      = my-pdf-bucket
 *   STORAGE_REGION      = us-east-1
 *   STORAGE_ACCESS_KEY  = AKIA...
 *   STORAGE_SECRET_KEY  = secret...
 *   STORAGE_PATH_PREFIX = pdfs/ (optional prefix)
 *   STORAGE_KEEP_LOCAL  = true (keep local copy after upload)
 */
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const https = require("https");
const http = require("http");

const config = {
  provider: process.env.STORAGE_PROVIDER || "local",
  endpoint: process.env.STORAGE_ENDPOINT || "",
  bucket: process.env.STORAGE_BUCKET || "",
  region: process.env.STORAGE_REGION || "us-east-1",
  accessKey: process.env.STORAGE_ACCESS_KEY || "",
  secretKey: process.env.STORAGE_SECRET_KEY || "",
  pathPrefix: process.env.STORAGE_PATH_PREFIX || "",
  keepLocal: process.env.STORAGE_KEEP_LOCAL !== "false",
};

/**
 * Check if cloud storage is enabled
 */
function isEnabled() {
  return (
    config.provider !== "local" &&
    config.endpoint &&
    config.bucket &&
    config.accessKey &&
    config.secretKey
  );
}

/**
 * Generate AWS Signature V4 for S3-compatible APIs
 */
function signV4(method, url, headers, payload, service = "s3") {
  const parsedUrl = new URL(url);
  const date = new Date();
  const dateStamp = date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const datestamp = dateStamp.slice(0, 8);

  headers["x-amz-date"] = dateStamp;
  headers["x-amz-content-sha256"] = crypto
    .createHash("sha256")
    .update(payload || "")
    .digest("hex");

  // Canonical request
  const signedHeaders = Object.keys(headers)
    .map((k) => k.toLowerCase())
    .sort()
    .join(";");

  const canonicalHeaders = Object.keys(headers)
    .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()))
    .map((k) => `${k.toLowerCase()}:${headers[k].toString().trim()}`)
    .join("\n");

  const canonicalRequest = [
    method,
    parsedUrl.pathname,
    parsedUrl.search ? parsedUrl.search.slice(1) : "",
    canonicalHeaders + "\n",
    signedHeaders,
    headers["x-amz-content-sha256"],
  ].join("\n");

  // String to sign
  const credentialScope = `${datestamp}/${config.region}/${service}/aws4_request`;
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    dateStamp,
    credentialScope,
    crypto.createHash("sha256").update(canonicalRequest).digest("hex"),
  ].join("\n");

  // Signing key
  const hmac = (key, data) =>
    crypto.createHmac("sha256", key).update(data).digest();
  const kDate = hmac(`AWS4${config.secretKey}`, datestamp);
  const kRegion = hmac(kDate, config.region);
  const kService = hmac(kRegion, service);
  const kSigning = hmac(kService, "aws4_request");

  const signature = crypto
    .createHmac("sha256", kSigning)
    .update(stringToSign)
    .digest("hex");

  headers["Authorization"] =
    `AWS4-HMAC-SHA256 Credential=${config.accessKey}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  return headers;
}

/**
 * Upload a file to S3-compatible storage
 *
 * @param {string} localPath - Absolute path to the local file
 * @param {string} filename - Filename for the remote object
 * @returns {Promise<{ url: string, key: string, bucket: string }>}
 */
async function upload(localPath, filename) {
  if (!isEnabled()) {
    throw new Error(
      "Cloud storage is not configured. Set STORAGE_* environment variables.",
    );
  }

  const fileBuffer = fs.readFileSync(localPath);
  const key = config.pathPrefix ? `${config.pathPrefix}${filename}` : filename;

  const ext = path.extname(filename).toLowerCase();
  const contentTypes = {
    ".pdf": "application/pdf",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
    ".csv": "text/csv",
  };
  const contentType = contentTypes[ext] || "application/octet-stream";

  const url = `${config.endpoint}/${config.bucket}/${key}`;
  const parsedUrl = new URL(url);

  const headers = {
    Host: parsedUrl.host,
    "Content-Type": contentType,
    "Content-Length": fileBuffer.length.toString(),
  };

  signV4("PUT", url, headers, fileBuffer);

  return new Promise((resolve, reject) => {
    const transport = parsedUrl.protocol === "https:" ? https : http;

    const req = transport.request(
      {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port,
        path: parsedUrl.pathname,
        method: "PUT",
        headers,
      },
      (res) => {
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            // Optionally remove local file
            if (!config.keepLocal && fs.existsSync(localPath)) {
              fs.unlinkSync(localPath);
            }

            resolve({
              url,
              key,
              bucket: config.bucket,
              provider: config.provider,
            });
          } else {
            reject(
              new Error(
                `Upload failed (${res.statusCode}): ${body.substring(0, 200)}`,
              ),
            );
          }
        });
      },
    );

    req.on("error", reject);
    req.write(fileBuffer);
    req.end();
  });
}

/**
 * Get storage configuration status
 */
function getStorageInfo() {
  return {
    provider: config.provider,
    enabled: isEnabled(),
    bucket: config.bucket || null,
    region: config.region,
    path_prefix: config.pathPrefix || null,
    keep_local: config.keepLocal,
  };
}

module.exports = { upload, isEnabled, getStorageInfo };
