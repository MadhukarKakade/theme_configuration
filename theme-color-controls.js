(function (global) {
  'use strict';

  /**
   * ThemeColorControls
   * - Discovers .color-picker[id$="-picker"] containers
   * - Ensures an <input type="color"> exists inside
   * - Syncs with the matching text input "#{prop}-color"
   * - Handles defaults, form reset, custom events, and programmatic resets
   */
  const ThemeColorControls = {
    init,
    resetProp,
    resetAll
  };

  // Internal registry of controls by property name
  const registry = new Map();

  function init(options = {}) {
    const {
      defaults = {},         // { 'background-color': '#fff', 'color': '#333' }
      scopeSelector = null,  // e.g., '#preview' for computed defaults
      onChange = null,       // callback({ property, value })
      onReset = null         // callback({ property, value })
    } = options;

    // Find all color-picker containers
    const containers = document.querySelectorAll('.color-picker[id$="-picker"]');
    containers.forEach(container => {
      const propName = resolvePropName(container.id);
      if (!propName) return;

      const textInput = document.getElementById(`${propName}-color`);
      if (!textInput) return;

      // Ensure color input exists inside the container
      let colorInput = container.querySelector('input[type="color"]');
      if (!colorInput) {
        colorInput = document.createElement('input');
        colorInput.type = 'color';
        colorInput.className = 'form-control-color';
        colorInput.style.width = '2rem';
        colorInput.style.height = '2rem';
        colorInput.style.border = 'none';
        colorInput.style.padding = '0';
        colorInput.setAttribute('aria-label', `${propName} color picker`);
        container.appendChild(colorInput);
      }

      // Determine default value priority:
      // 1) options.defaults[propName]
      // 2) textInput @value attribute (HTML default)
      // 3) computed style from scopeSelector (if provided)
      // 4) current textInput value
      // 5) fallback '#000000'
      let defaultVal =
        normalizeToHex(defaults[propName]) ||
        normalizeToHex(textInput.getAttribute('value')) ||
        (scopeSelector ? computedProperty(scopeSelector, propName) : null) ||
        normalizeToHex(textInput.value) ||
        '#000000';

      // Normalize both inputs to the same initial value
      const initialHex = normalizeToHex(defaultVal) || '#000000';
      textInput.value = normalizeToHex(textInput.value) || initialHex;
      colorInput.value = normalizeToHex(colorInput.value) || textInput.value;

      // Persist defaults on elements
      textInput.dataset.default = initialHex;
      colorInput.dataset.default = initialHex;

      // Keep registry
      registry.set(propName, {
        propName,
        textInput,
        colorInput,
        defaultValue: initialHex,
        options
      });

      // Wire events
      wireEvents(propName);
    });

    // Listen for native form reset events and restore controls to defaults
    document.addEventListener('reset', (evt) => {
      const form = evt.target;
      if (!(form instanceof HTMLFormElement)) return;

      // Find all registered props that live inside this form and reset them
      registry.forEach((record, propName) => {
        if (form.contains(record.textInput) || form.contains(record.colorInput)) {
          doReset(propName, record);
        }
      });
    });
  }

  function wireEvents(propName) {
    const record = registry.get(propName);
    if (!record) return;

    const { textInput, colorInput, options } = record;

    // When color input changes, reflect to text input and notify
    const onColorInput = () => {
      const hex = normalizeToHex(colorInput.value) || record.defaultValue;
      textInput.value = hex;
      notifyChange(propName, hex, options);
    };
    colorInput.addEventListener('input', onColorInput);
    colorInput.addEventListener('change', onColorInput);

    // When text input changes, validate and reflect to color input and notify
    const onTextInput = debounce(() => {
      const hex = normalizeToHex(textInput.value);
      if (hex) {
        colorInput.value = hex;
        notifyChange(propName, hex, options);
      }
      // if invalid, do not notify; wait for blur to normalize
    }, 120);
    textInput.addEventListener('input', onTextInput);

    textInput.addEventListener('blur', () => {
      const hex = normalizeToHex(textInput.value) || colorInput.value || record.defaultValue;
      textInput.value = hex;
      colorInput.value = hex;
      notifyChange(propName, hex, options);
    });
  }

  function resetProp(propName) {
    const record = registry.get(propName);
    if (!record) return;
    doReset(propName, record);
  }

  function resetAll() {
    registry.forEach((record, propName) => doReset(propName, record));
  }

  function doReset(propName, record) {
    const { textInput, colorInput, defaultValue, options } = record;
    const def = normalizeToHex(textInput.dataset.default || colorInput.dataset.default || defaultValue) || '#000000';
    textInput.value = def;
    colorInput.value = def;

    // Fire reset event + change event so listeners can reapply styles
    notifyReset(propName, def, options);
    notifyChange(propName, def, options);
  }

  function notifyChange(property, value, options) {
    const detail = { property, value };
    try {
      document.dispatchEvent(new CustomEvent('theme:css-change', { detail }));
    } catch (_) { /* noop */ }
    if (typeof options?.onChange === 'function') {
      try { options.onChange(detail); } catch (_) { /* noop */ }
    }
  }

  function notifyReset(property, value, options) {
    const detail = { property, value };
    try {
      document.dispatchEvent(new CustomEvent('theme:css-reset', { detail }));
    } catch (_) { /* noop */ }
    if (typeof options?.onReset === 'function') {
      try { options.onReset(detail); } catch (_) { /* noop */ }
    }
  }

  // Utilities

  function resolvePropName(pickerId) {
    // e.g. "background-color-picker" -> "background-color"
    if (!pickerId) return null;
    return pickerId.replace(/-picker$/, '');
  }

  function computedProperty(scopeSelector, propName) {
    const el = document.querySelector(scopeSelector);
    if (!el) return null;
    const c = getComputedStyle(el).getPropertyValue(propName);
    if (!c) return null;
    return normalizeToHex(c.trim());
  }

  function normalizeToHex(value) {
    if (!value) return null;
    let v = String(value).trim().toLowerCase();

    // Strip quotes if any
    v = v.replace(/^['"]|['"]$/g, '');

    // Handle hex forms
    if (/^#([0-9a-f]{3})$/.test(v)) {
      // Expand #rgb to #rrggbb
      return '#' + v.slice(1).split('').map(ch => ch + ch).join('');
    }
    if (/^#([0-9a-f]{6})$/.test(v)) {
      return v;
    }

    // Handle rgb/rgba or color names by letting the browser parse
    const parsed = parseColorWithBrowser(v);
    if (!parsed) return null;

    const { r, g, b } = parsed; // ignoring alpha; type=color doesn't support alpha
    return rgbToHex(r, g, b);
  }

  function parseColorWithBrowser(input) {
    // Create a temp element to let the browser resolve computed color
    const el = document.createElement('span');
    el.style.display = 'none';
    document.body.appendChild(el);
    el.style.color = '';
    el.style.color = input;

    const cs = getComputedStyle(el).color; // "rgb(r, g, b)" or "rgba(r, g, b, a)"
    document.body.removeChild(el);
    if (!cs) return null;

    const m = cs.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/i);
    if (!m) return null;

    return {
      r: clamp255(parseInt(m[1], 10)),
      g: clamp255(parseInt(m[2], 10)),
      b: clamp255(parseInt(m[3], 10)),
      a: m[4] !== undefined ? Math.max(0, Math.min(1, parseFloat(m[4]))) : 1
    };
  }

  function rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(n => {
      const h = clamp255(n).toString(16);
      return h.length === 1 ? '0' + h : h;
    }).join('');
  }

  function clamp255(n) {
    n = Number.isFinite(n) ? n : 0;
    if (n < 0) return 0;
    if (n > 255) return 255;
    return n;
  }

  function debounce(fn, wait = 100) {
    let t = null;
    return function debounced(...args) {
      window.clearTimeout(t);
      t = window.setTimeout(() => fn.apply(this, args), wait);
    };
  }

  // Expose to window
  global.ThemeColorControls = ThemeColorControls;
})(window);