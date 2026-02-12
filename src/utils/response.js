/**
 * Standardized API response helpers
 */

function success(res, data, status = 200) {
  return res.status(status).json({ status: "success", ...data });
}

function error(res, message, detail = null, status = 400) {
  const body = { status: "error", error: message };
  if (detail) body.detail = detail;
  return res.status(status).json(body);
}

module.exports = { success, error };
