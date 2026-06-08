import { logAudit } from "../utils/audit.js";

const ignoredPaths = ["/api/auth/login", "/api/auth/register", "/api/health"];

function getEntityType(path) {
  const parts = path.split("/").filter(Boolean);
  return parts[1] || "system";
}

function sanitizeBody(body = {}) {
  const clone = { ...body };
  delete clone.password;
  delete clone.password_hash;
  delete clone.token;
  return clone;
}

export function auditActivity(req, res, next) {
  const shouldAudit =
    ["POST", "PATCH", "PUT", "DELETE"].includes(req.method) &&
    req.path.startsWith("/api") &&
    !ignoredPaths.includes(req.path);

  if (!shouldAudit) {
    return next();
  }

  res.on("finish", async () => {
    if (res.statusCode >= 400) return;

    await logAudit({
      userId: req.user?.id,
      action: `${req.method} ${req.path}`,
      entityType: getEntityType(req.path),
      metadata: {
        statusCode: res.statusCode,
        body: sanitizeBody(req.body),
        params: req.params,
        query: req.query,
        ip: req.ip,
        userAgent: req.get("user-agent")
      }
    });
  });

  next();
}
