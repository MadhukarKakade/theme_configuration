/**
 * Global object to store modified CSS rules
 * Example:
 * {
 *   ".class1": { "background-color": "#000", "color": "#FFF" },
 *   ".class2": { "height": "50px" }
 * }
 */
let changedStyle = {};

/**
 * Reset the global changedStyle object
 */
function resetChangedStyle() {
  changedStyle = {};
}

/**
 * Build the final CSS string from changedStyle
 * Merges with existing localStorage CSS and removes only unset rules
 * @param {Object} styles - changedStyle object { selector: { prop: val } }
 * @returns {string} - full updated CSS
 */
function buildCssFromChangedStyle(styles) {
  let savedCSS = localStorage.getItem("customCSS") || "";
  let cssContent = savedCSS;

  for (const selector in styles) {
    if (!styles.hasOwnProperty(selector)) continue;
    const rulesObj = styles[selector];
    if (!rulesObj || typeof rulesObj !== "object") continue;

    // Build string for rules, skipping 'unset'
    const rules = Object.entries(rulesObj)
      .filter(([, v]) => v !== undefined && v !== null && String(v).trim() !== "" && v !== "unset")
      .map(([prop, val]) => `${prop}: ${val};`)
      .join(" ");

    const regex = new RegExp(`${selector}\\s*{[^}]*}`, "g");

    if (rules) {
      // Update existing block or insert new
      if (regex.test(cssContent)) {
        cssContent = cssContent.replace(regex, `${selector} { ${rules} }`);
      } else {
        cssContent += `\n${selector} { ${rules} }`;
      }
    } else {
      // Remove selector block completely if no rules remain
      cssContent = cssContent.replace(regex, "");
    }
  }

  return cssContent.trim();
}

/**
 * Apply CSS string as dynamic stylesheet
 * Saves to localStorage and attaches <link> in <head>
 * @param {string} cssText - Full CSS content
 */
function applyCustomCSS(cssText) {
  $("#dynamic-css").remove();
  const blob = new Blob([cssText], { type: "text/css" });
  const url = URL.createObjectURL(blob);
  $("<link>", {
    id: "dynamic-css",
    rel: "stylesheet",
    href: url
  }).appendTo("head");

  localStorage.setItem("customCSS", cssText || "");
}

/**
 * Save changedStyle into localStorage and apply CSS
 */
function addOrUpdateCSSRule() {
  const cssObject = changedStyle;
  if (!Object.keys(cssObject).length) {
    alert("No changes to save!");
    return;
  }

  const cssContent = buildCssFromChangedStyle(cssObject);
  applyCustomCSS(cssContent);
  resetChangedStyle();

  console.log("Saved CSS:", cssContent);
}

/**
 * Update or remove a style rule
 * @param {Object} params
 * @param {string} params.selector - DOM selector to apply CSS inline
 * @param {string} params.rule - CSS property (e.g. "background-color")
 * @param {string} params.value - CSS value or "unset" to remove
 * @param {string} [params.styleSelector] - Optional selector key for changedStyle grouping
 */
function updateStyle({ selector, rule, value, styleSelector }) {
  if (!selector || !rule) return;

  const isUnset = (typeof value === 'string') && value.trim().toLowerCase() === 'unset';

  // Ensure objects exist
  if (styleSelector) {
    changedStyle[styleSelector] = changedStyle[styleSelector] || {};
  }
  changedStyle[selector] = changedStyle[selector] || {};

  if (isUnset) {
    // Remove inline style from DOM
    $(selector).css(rule, '');

    // Instead of deleting, mark as "unset"
    changedStyle[selector][rule] = 'unset';
    if (styleSelector && styleSelector !== selector) changedStyle[styleSelector][rule] = 'unset';

    // Apply CSS without this property
    applyCustomCSS(buildCssFromChangedStyle(changedStyle));

    console.log('Marked rule as unset', { selector, rule, styleSelector, changedStyle });
    return;
  }

  // Normal update
  $(selector).css(rule, value);
  if (styleSelector) changedStyle[styleSelector][rule] = value;
  changedStyle[selector][rule] = value;

  applyCustomCSS(buildCssFromChangedStyle(changedStyle));
  console.log('Updated Styles:', changedStyle);
}


/**
 * Initialize multiple Pickr color pickers
 * @param {Array} configs - Array of config objects
 * Each config = { pickerSelector, inputSelector, selector, styleSelector, rule }
 */
function initMultiplePickrs(configs) {
  configs.forEach(cfg => {
    const { pickerSelector, inputSelector, selector, styleSelector, rule } = cfg;

    // Get current color from DOM or fallback
    const elementColor = colorToHex($(styleSelector).css(rule), true);
    const defaultColor = elementColor || '#FFBF00';
    const $input = $(inputSelector);
    $input.val(defaultColor);

    // Initialize Pickr
    const pickr = Pickr.create({
      el: pickerSelector,
      theme: 'classic',
      default: defaultColor,
      components: {
        preview: true,
        hue: true,
        interaction: { hex: true, input: true, save: true }
      }
    });

    // Save on Pickr "save"
    pickr.on('save', (color) => {
      const selected = color.toHEXA().toString();
      $input.val(selected);
      updateStyle({ selector, rule, value: selected, styleSelector });
      pickr.hide();
    });

    // Update dynamically when typing in input
    $input.on('input', function () {
      const val = $(this).val().trim();
      if (isValidHexInput(val)) {
        const hex = '#' + val.replace(/^#/, '').toUpperCase();
        pickr.setColor(hex);
        updateStyle({ selector, rule, value: hex, styleSelector });
      } else if (val.toLowerCase() === 'unset') {
        updateStyle({ selector, rule, value: 'unset', styleSelector });
      }
    });
  });
}

/**
 * Convert any valid CSS color → HEX
 * Supports rgb(), rgba(), #RRGGBB, #RRGGBBAA
 * @param {string} color - Input color string
 * @param {boolean} [allowAlpha=false] - Include alpha if rgba present
 * @returns {string} - HEX color (#RRGGBB or #RRGGBBAA) or fallback "#FFBF00"
 */
function colorToHex(color, allowAlpha = false) {
  if (!color) return '#FFBF00';
  color = color.trim();
  if (/^#?([0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/.test(color)) {
    return '#' + color.replace(/^#/, '').toUpperCase();
  }
  const rgbMatch = /^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)$/i.exec(color);
  if (rgbMatch) {
    const r = parseInt(rgbMatch[1]);
    const g = parseInt(rgbMatch[2]);
    const b = parseInt(rgbMatch[3]);
    let hex = ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
    if (allowAlpha && rgbMatch[4] !== undefined) {
      let a = Math.round(parseFloat(rgbMatch[4]) * 255);
      hex += ('0' + a.toString(16)).slice(-2).toUpperCase();
    }
    return '#' + hex;
  }
  return '#FFBF00';
}

/**
 * Validate HEX input (6 or 8 digit, with optional #)
 * @param {string} input - User input
 * @returns {boolean} - True if valid
 */
function isValidHexInput(input) {
  return /^#?[0-9A-Fa-f]{6}([0-9A-Fa-f]{2})?$/.test(input.trim());
}

// Load saved CSS on page ready
const savedCSS = localStorage.getItem("customCSS") || "";
if (savedCSS) applyCustomCSS(savedCSS);

// Expose globally
window.ThemeEditor = {
  applyCustomCSS,
  addOrUpdateCSSRule,
  updateStyle,
  initMultiplePickrs
};

console.log("Theme editor initialized");
