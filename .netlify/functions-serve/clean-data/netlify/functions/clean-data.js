var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// netlify/functions/clean-data.js
var clean_data_exports = {};
__export(clean_data_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(clean_data_exports);
var headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};
var handler = async (event, context) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers, body: JSON.stringify({ error: "Method Not Allowed" }) };
  }
  try {
    const body = JSON.parse(event.body);
    const { data, action, params } = body;
    if (!Array.isArray(data)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Invalid input: data must be an array" })
      };
    }
    let processedData = [...data];
    let stats = {
      initialRows: data.length,
      finalRows: 0,
      removed: 0
    };
    if (action === "clean") {
      processedData = processedData.filter((row) => {
        const values = Object.values(row);
        const isEmpty = values.every((v) => v === null || v === void 0 || v === "");
        return !isEmpty;
      }).map((row) => {
        const newRow = {};
        Object.keys(row).forEach((key) => {
          const val = row[key];
          if (typeof val === "string") {
            newRow[key] = val.trim().replace(/\s+/g, " ");
          } else {
            newRow[key] = val;
          }
        });
        return newRow;
      });
    } else if (action === "filter") {
      const { deliveryCol, submittedCol, marginDays = 1 } = params || {};
      const margin = parseInt(marginDays);
      processedData = processedData.filter((row) => {
        const delivery = row[deliveryCol] ? new Date(row[deliveryCol]) : null;
        const submitted = row[submittedCol] ? new Date(row[submittedCol]) : null;
        if (!delivery || isNaN(delivery) || !submitted || isNaN(submitted)) return false;
        const diffTime = Math.abs(delivery - submitted);
        const diffDays = Math.ceil(diffTime / (1e3 * 60 * 60 * 24));
        return diffDays <= margin;
      });
    } else if (action === "dedup") {
      const { trackingCol, keep = "last" } = params || {};
      if (!trackingCol) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: "trackingCol required for dedup" }) };
      }
      const groups = /* @__PURE__ */ new Map();
      processedData.forEach((row) => {
        const key = row[trackingCol];
        if (!key) return;
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(row);
      });
      processedData = [];
      groups.forEach((rows) => {
        if (keep === "first") {
          processedData.push(rows[0]);
        } else if (keep === "last") {
          processedData.push(rows[rows.length - 1]);
        } else if (keep === "random") {
          const idx = Math.floor(Math.random() * rows.length);
          processedData.push(rows[idx]);
        } else {
          processedData.push(rows[rows.length - 1]);
        }
      });
    }
    stats.finalRows = processedData.length;
    stats.removed = stats.initialRows - stats.finalRows;
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        results: processedData,
        stats
      })
    };
  } catch (error) {
    console.error("Function error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Internal Server Error", details: error.message })
    };
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
//# sourceMappingURL=clean-data.js.map
