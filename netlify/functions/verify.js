// netlify/functions/verify.js

const ALLOWED_ORIGINS = [
  "https://rannta.com",
  "https://www.rannta.com"
];

const CORS_HEADERS = {
  "access-control-allow-methods": "GET, OPTIONS",
  "access-control-allow-headers": "Content-Type",
  "vary": "Origin"
};

function getCorsHeaders(origin) {
  if (ALLOWED_ORIGINS.includes(origin)) {
    return { "access-control-allow-origin": origin, ...CORS_HEADERS };
  }
  return { "access-control-allow-origin": "*", ...CORS_HEADERS };
}

exports.handler = async (event) => {
  const origin = (event.headers && event.headers.origin) || "*";
  const cors = getCorsHeaders(origin);

  // Handle preflight
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: cors };
  }

  try {
    const params = event.queryStringParameters || {};
    const id = params.id;

    if (!id) {
      return json({ ok: false, error: "missing id" }, 400, cors);
    }

    const registry = require("../../ids.json");
    const list = Array.isArray(registry.allowed) ? registry.allowed : [];
    const ok = list.includes(id);

    return json({ ok, id }, ok ? 200 : 404, cors);
  } catch (err) {
    return json({ ok: false, error: "internal error" }, 500, cors);
  }
};

function json(data, status = 200, cors = {}) {
  return {
    statusCode: status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      ...cors
    },
    body: JSON.stringify(data)
  };
}
