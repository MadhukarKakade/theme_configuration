/**
 * ================================
 * Theme Editor - Dynamic CSS Manager
 * ================================
 * Handles runtime theme changes, persists CSS in localStorage,
 * and reapplies on page load. Includes color pickers (Pickr),
 * support for !important rules, and reset/unset logic.
 * ================================
 */

/** Stores all modified styles until saved */
let changedStyle = {};

/** Tracks if any reset/unset occurred */
let resetFlag = false;

/**
 * Utility: check if object is empty
 */
function isEmptyObject(obj) {
  return !obj || typeof obj !== "object" || Object.keys(obj).length === 0;
}

/**
 * Apply CSS text as a blob <link> in <head>
 */
function applyCustomCSS(cssText) {
  $("#dynamic-css").remove();
  const blob = new Blob([cssText], { type: "text/css" });
  const url = URL.createObjectURL(blob);

  const $link = $("<link>", {
    id: "dynamic-css",
    rel: "stylesheet",
    href: url,
  });

  $("head").append($link);
}

/**
 * Reset local changedStyle object
 */
function resetChangedStyle() {
  changedStyle = {};
  resetFlag = false;
}

/**
 * Add or update CSS rules into localStorage + apply them
 * Called only on "Save/Submit"
 */
function addOrUpdateCSSRule(uploadedFile) {
  if (!uploadedFile && isEmptyObject(changedStyle) && !resetFlag) {
    alert("No changes to save!");
    return;
  }

  let cssContent = localStorage.getItem("customCSS") || "";

  for (let selector in changedStyle) {
    if (!changedStyle.hasOwnProperty(selector)) continue;

    const rulesObj = changedStyle[selector];
    const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(${escapedSelector}\\s*{)([^}]*)}`, "g");

    // Clean existing rules
    cssContent = cssContent.replace(regex, "");

    // Collect valid rules
    const validRules = Object.entries(rulesObj).filter(
      ([prop, val]) =>
        val !== null &&
        val !== undefined &&
        val !== "" &&
        !(typeof val === "object" && isEmptyObject(val))
    );

    if (validRules.length) {
      const rulesStr = validRules
        .map(([prop, val]) => `${prop}: ${val};`)
        .join(" ");
      cssContent += `\n${selector} { ${rulesStr} }`;
    }
  }

  // Save updated CSS
  localStorage.setItem("customCSS", cssContent);
  applyCustomCSS(cssContent);
  resetChangedStyle();

  console.log("✅ Final CSS Content:\n", cssContent);
}

/**
 * Apply a style change immediately and record it
 */
function updateStyle({ selector, property, value, styleSelector, important }) {
  if (!selector || !property) return;

  const isUnset =
    typeof value === "string" && value.trim().toLowerCase() === "unset";

  // Init objects
  if (styleSelector){
     changedStyle[styleSelector] = changedStyle[styleSelector] || {};
  }
  
  changedStyle[selector] = changedStyle[selector] || {};

  if (isUnset) {
    // Mark reset flag for submit
    resetFlag = true;

    // Remove live inline style in modal
    suppressDynamicCssInModal(selector, property);

    // Store empty object for property
    changedStyle[selector][property] = {};
    if (styleSelector && styleSelector !== selector) {
      changedStyle[styleSelector][property] = {}; 
    }

    console.log("🔄 Marked rule as unset", { selector, property });
    return;
  }

  // Normal update
  applyStyle(selector, property, value, important);
  if (styleSelector) {
     changedStyle[styleSelector][property] = value;
  }
  changedStyle[selector][property] = value;

  console.log("🎨 Updated Styles:", changedStyle);
}

/**
 * Apply style to DOM immediately
 * Handles pseudo-classes and !important rules
 */
function applyStyle(selector, property, value, important = false) {
  const pseudoClasses = [
    ":hover",
    ":active",
    ":focus",
    ":visited",
    ":link",
    ":checked",
    ":disabled",
    ":enabled",
    ":first-child",
    ":last-child",
    ":nth-child",
    ":nth-of-type",
    ":not",
    ":before",
    ":after",
  ];

  const hasPseudo = pseudoClasses.some((p) => selector.includes(p));

  if (hasPseudo) {
    const styleRule = `${selector} { ${property}: ${value}${
      important ? " !important" : ""
    }; }`;
    let $styleTag = $("#dynamic-style-injector");
    if ($styleTag.length === 0) {
      $styleTag = $("<style>", { id: "dynamic-style-injector" });
      $("head").append($styleTag);
    }
    $styleTag[0].sheet.insertRule(styleRule, $styleTag[0].sheet.cssRules.length);
  } else {
    $(selector).css(property, important ? `${value} !important` : value);
  }
}

/**
 * Suppress property inside modal for unset logic
 */
function suppressDynamicCssInModal( selector, property,modalSelector = "#themePersonalizationModal") {
  const dynamicLink = document.getElementById("dynamic-css");
  if (!dynamicLink) return;

  dynamicLink.disabled = true;

  // Apply computed value from next-level stylesheet only to elements inside modal
  $(modalSelector).find(selector) .each(function () {
      const computedValue = window.getComputedStyle(this)[property];
      // overrides dynamic-css
      this.style[property] = computedValue;
      console.log(`Applied next-level stylesheet value '${property}: ${computedValue}' to`, this);
    });

     // Re-enable dynamic-css
  dynamicLink.disabled = false;
}

/**
 * Multi Pickr initialization
 */
function initMultiplePickrs(configs) {
  configs.forEach((cfg) => {
    const { pickerSelector, inputSelector, selector, styleSelector, property, important } = cfg;

    const elementRGBAColor = colorToHex($(styleSelector).css(property), true);
    const defaultColor = elementRGBAColor || "#FFBF00";
    const $input = $(inputSelector);

    $input.val(defaultColor);

    const pickr = Pickr.create({
      el: pickerSelector,
      theme: "classic",
      default: defaultColor,
      components: {
        preview: true,
        hue: true,
        interaction: {
          hex: true,
          input: true,
          save: true,
        },
      },
    });

    pickr.on("save", (color) => {
      const selected = color.toHEXA().toString();
      $input.val(selected);
      updateStyle({ selector, property, value: selected, styleSelector, important });
      pickr.hide();
    });

    $input.on("input", function () {
      const val = $(this).val().trim();
      if (isValidHexInput(val)) {
        const hex = "#" + val.replace(/^#/, "").toUpperCase();
        pickr.setColor(hex);
        updateStyle({ selector, property, value: hex, styleSelector, important });
      }
      if (val.toLowerCase() === "unset" || val.toLowerCase() === "remove") {
        updateStyle({ selector, property, value: "unset", styleSelector, important });
      }
    });
  });
}

/**
 * Color utils
 */
function colorToHex(color, allowAlpha = false) {
  if (!color) return "#FFBF00";
  color = color.trim();

  if (/^#?([0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/.test(color)) {
    return "#" + color.replace(/^#/, "").toUpperCase();
  }

  const rgbMatch = /^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)$/i.exec(
    color
  );
  if (rgbMatch) {
    const r = parseInt(rgbMatch[1]);
    const g = parseInt(rgbMatch[2]);
    const b = parseInt(rgbMatch[3]);
    let hex =
      ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
    if (allowAlpha && rgbMatch[4] !== undefined) {
      let a = Math.round(parseFloat(rgbMatch[4]) * 255);
      hex += ("0" + a.toString(16)).slice(-2).toUpperCase();
    }
    return "#" + hex;
  }

  return "#FFBF00";
}

function isValidHexInput(input) {
  return /^#?[0-9A-Fa-f]{6}([0-9A-Fa-f]{2})?$/.test(input.trim());
}

/**
 * Expose globally
 */
window.ThemeEditor = {
  applyCustomCSS,
  addOrUpdateCSSRule,
  updateStyle,
  initMultiplePickrs,
};

console.log("✅ theme.js imported");
