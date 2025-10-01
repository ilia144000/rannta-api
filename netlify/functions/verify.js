// netlify/functions/verify.js
const fs = require("fs");
const path = require("path");

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  Vary: "Origin"
};

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

    const idsPath = path.resolve(process.cwd(), "ids.json");
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
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ ok: false, error: "internal error" }) };
  }
};
