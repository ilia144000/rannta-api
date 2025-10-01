// netlify/functions/verify.js
const fs = require("fs");
const path = require("path");

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  Vary: "Origin"
};

function findIdsJson() {
  // Try a few safe candidate paths depending on bundling/runtime
  const candidates = [
    path.join(__dirname, "ids.json"),
    path.resolve(process.cwd(), "ids.json"),
    path.resolve(path.dirname(__dirname), "ids.json"),
    path.resolve("/", "var", "task", "ids.json") // some AWS runtimes
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

exports.handler = async (event) => {
  try {
    if (event.httpMethod === "OPTIONS") {
      return { statusCode: 204, headers: CORS, body: "" };
    }
    if (event.httpMethod !== "GET") {
      return { statusCode: 405, headers: CORS, body: JSON.stringify({ ok: false, error: "method not allowed" }) };
    }

    const id = (event.queryStringParameters && event.queryStringParameters.id) || "";
    if (!id) {
      return { statusCode: 400, headers: CORS, body: JSON.stringify({ ok: false, error: "missing id" }) };
    }

    const idsPath = findIdsJson();
    if (!idsPath) {
      return { statusCode: 500, headers: CORS, body: JSON.stringify({ ok: false, error: "ids.json not found" }) };
    }

    const raw = fs.readFileSync(idsPath, "utf8");
    const data = JSON.parse(raw);

    const allowed = Array.isArray(data.allowed) ? data.allowed : [];
    const ok = allowed.includes(id);
    const meta = (data.meta && data.meta[id]) || {};

    return {
      statusCode: ok ? 200 : 404,
      headers: { "Content-Type": "application/json", ...CORS },
      body: JSON.stringify({ ok, id, ...meta })
    };
  } catch (err) {
    // Do not leak internals; return generic error
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ ok: false, error: "internal error" }) };
  }
};
