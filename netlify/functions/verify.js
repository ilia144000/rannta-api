exports.handler = async (event) => {
  try {
    const params = event.queryStringParameters || {};
    const id = params.id;

    if (!id) {
      return json({ ok: false, error: "missing id" }, 400);
    }

    const registry = require("../../ids.json");
    const list = Array.isArray(registry.allowed) ? registry.allowed : [];
    const ok = list.includes(id);

    return json({ ok, id }, ok ? 200 : 404);
  } catch (err) {
    return json({ ok: false, error: "internal error" }, 500);
  }
};

function json(data, status = 200) {
  return {
    statusCode: status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store"
    },
    body: JSON.stringify(data)
  };
}
