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
  const candidates = [
    path.join(__dirname, "ids.json"),                 // with included_files
    path.resolve(process.cwd(), "ids.json"),          // repo root at build
    path.resolve(path.dirname(__dirname), "ids.json") // fallback
  ];
  for (const p of candidates) if (fs.existsSync(p)) return p;
  return null;
}

exports.handler = async (event) => {
  try {
    if (event.httpMethod === "OPTIONS") {
      return { statusCode: 204, headers: CORS, body: "" };
    }
    if (event.httpMethod !== "GET") {
      return { statusCode: 405, headers: CORS, body: JSON.stringify({ ok:false, error:"method not allowed" }) };
    }

    const id = (event.queryStringParameters && event.queryStringParameters.id) || "";
    const debug = (event.queryStringParameters && event.queryStringParameters.debug) === "1";
    if (!id) {
      return { statusCode: 400, headers: CORS, body: JSON.stringify({ ok:false, error:"missing id" }) };
    }

    const idsPath = findIdsJson();
    if (!idsPath) {
      const msg = "ids.json not found";
      if (debug) return { statusCode: 500, headers: CORS, body: JSON.stringify({ ok:false, error: msg }) };
      return { statusCode: 500, headers: CORS, body: JSON.stringify({ ok:false, error:"internal error" }) };
    }

    let data;
    try {
      const raw = fs.readFileSync(idsPath, "utf8");
      data = JSON.parse(raw);
    } catch (e) {
      const msg = "ids.json read/parse failed";
      if (debug) return { statusCode: 500, headers: CORS, body: JSON.stringify({ ok:false, error: msg }) };
      return { statusCode: 500, headers: CORS, body: JSON.stringify({ ok:false, error:"internal error" }) };
    }

    const allowed = Array.isArray(data.allowed) ? data.allowed : [];
    const ok = allowed.includes(id);
    const meta = (data.meta && data.meta[id]) || {};

    return {
      statusCode: ok ? 200 : 404,
      headers: { "Content-Type": "application/json", ...CORS },
      body: JSON.stringify({ ok, id, ...meta })
    };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ ok:false, error:"internal error" }) };
  }
};
