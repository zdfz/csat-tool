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

// netlify/functions/merge-data.js
var merge_data_exports = {};
__export(merge_data_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(merge_data_exports);
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
    const { mainData, secondaryData, mainMobileCol, secondaryMobileCol } = body;
    if (!Array.isArray(mainData) || !Array.isArray(secondaryData)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Invalid input: mainData and secondaryData must be arrays" })
      };
    }
    const findMobileCol = (row) => {
      const aliases = ["mobile", "consignee phone", "phone", "contact number", "tel", "consignee_phone"];
      const keys = Object.keys(row);
      return keys.find((k) => aliases.includes(k.toLowerCase())) || keys.find((k) => k.toLowerCase().includes("mobile"));
    };
    const effectiveMainCol = mainMobileCol || findMobileCol(mainData[0] || {});
    const effectiveSecCol = secondaryMobileCol || findMobileCol(secondaryData[0] || {});
    if (!effectiveMainCol) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: "Could not detect mobile column in main file" }) };
    }
    const normalizeMobile = (val) => {
      if (!val) return "";
      let s = String(val).toLowerCase().trim();
      if (s.endsWith(".0")) s = s.slice(0, -2);
      s = s.replace(/\D/g, "");
      if (s.startsWith("05") && s.length === 10) {
        return "966" + s.substring(1);
      }
      if (s.startsWith("5") && s.length === 9) {
        return "966" + s;
      }
      return s;
    };
    const getValue = (row, colName) => {
      if (row[colName] !== void 0) return row[colName];
      const key = Object.keys(row).find((k) => k.toLowerCase() === colName.toLowerCase());
      return key ? row[key] : void 0;
    };
    const secondaryMap = /* @__PURE__ */ new Map();
    secondaryData.forEach((row) => {
      const rawVal = getValue(row, effectiveSecCol);
      if (!rawVal) return;
      const key = normalizeMobile(rawVal);
      if (!secondaryMap.has(key)) {
        secondaryMap.set(key, []);
      }
      secondaryMap.get(key).push(row);
    });
    const results = [];
    let actualMatchCount = 0;
    const debugInfo = {
      sampleMainKeys: [],
      sampleSecKeys: Array.from(secondaryMap.keys()).slice(0, 5),
      secMapSize: secondaryMap.size,
      unmatchedSamples: []
    };
    mainData.forEach((mainRow, idx) => {
      const rawVal = getValue(mainRow, effectiveMainCol);
      const key = normalizeMobile(rawVal);
      if (idx < 5) debugInfo.sampleMainKeys.push({ raw: rawVal, normalized: key });
      const matches = secondaryMap.get(key);
      if (matches && matches.length > 0) {
        actualMatchCount += matches.length;
        matches.forEach((match) => {
          const merged = { ...mainRow };
          Object.keys(match).forEach((k) => {
            if (k === effectiveSecCol) return;
            if (k in merged) {
              merged[`${k}_secondary`] = match[k];
            } else {
              merged[k] = match[k];
            }
          });
          results.push(merged);
        });
      } else {
        if (debugInfo.unmatchedSamples.length < 5) debugInfo.unmatchedSamples.push(key);
        results.push(mainRow);
      }
    });
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        results,
        meta: {
          mainRows: mainData.length,
          secondaryRows: secondaryData.length,
          mergedRows: results.length,
          matchCount: actualMatchCount,
          debug: debugInfo
        }
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
//# sourceMappingURL=merge-data.js.map
