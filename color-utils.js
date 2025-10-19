// File: vendor_portal/theme/convert_JSON/color-utils.js
(function (global) {
  "use strict";

  function clamp255(n) {
    n = Number.isFinite(n) ? n : 0;
    if (n < 0) return 0;
    if (n > 255) return 255;
    return n;
  }

  function rgbToHex(r, g, b) {
    return "#" + [r, g, b].map(function (n) {
      var h = clamp255(n).toString(16);
      return h.length === 1 ? "0" + h : h;
    }).join("");
  }

  function parseColorWithBrowser(input) {
    var tmp = document.createElement("span");
    tmp.style.display = "none";
    document.body.appendChild(tmp);
    tmp.style.color = "";
    tmp.style.color = input;
    var cs = getComputedStyle(tmp).color;
    document.body.removeChild(tmp);
    if (!cs) return null;
    var m = cs.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/i);
    if (!m) return null;
    return {
      r: clamp255(parseInt(m[1], 10)),
      g: clamp255(parseInt(m[2], 10)),
      b: clamp255(parseInt(m[3], 10)),
      a: m[4] !== undefined ? Math.max(0, Math.min(1, parseFloat(m[4]))) : 1
    };
  }

  function normalizeToHex(value) {
    if (!value) return null;
    var v = String(value).trim().toLowerCase();
    v = v.replace(/^['"]|['"]$/g, "");

    var m3 = v.match(/^#([0-9a-f]{3})$/i);
    if (m3) return "#" + m3[1].split("").map(function (ch) { return ch + ch; }).join("").toLowerCase();

    if (/^#([0-9a-f]{6})$/i.test(v)) return v.toLowerCase();

    var parsed = parseColorWithBrowser(v);
    if (!parsed) return null;
    return rgbToHex(parsed.r, parsed.g, parsed.b);
  }

  function hexToRgb(hex) {
    var v = normalizeToHex(hex) || "#000000";
    var m = v.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
    if (!m) return { r: 0, g: 0, b: 0 };
    return { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) };
  }

  function idealTextColor(hex) {
    var rgb = hexToRgb(hex);
    var r = rgb.r, g = rgb.g, b = rgb.b;
    var R = (r / 255 <= 0.03928) ? (r / 255) / 12.92 : Math.pow((r / 255 + 0.055) / 1.055, 2.4);
    var G = (g / 255 <= 0.03928) ? (g / 255) / 12.92 : Math.pow((g / 255 + 0.055) / 1.055, 2.4);
    var B = (b / 255 <= 0.03928) ? (b / 255) / 12.92 : Math.pow((b / 255 + 0.055) / 1.055, 2.4);
    var luminance = 0.2126 * R + 0.7152 * G + 0.0722 * B;

    var contrastWhite = 1.05 / (luminance + 0.05);
    var contrastBlack = (luminance + 0.05) / 0.05;

    return contrastWhite >= contrastBlack ? "#ffffff" : "#000000";
  }

  global.ColorUtils = {
    normalizeToHex: normalizeToHex,
    hexToRgb: hexToRgb,
    idealTextColor: idealTextColor
  };
})(window);