/**
 * ThemeModuleCard
 * - Renders section cards and property inputs
 * - Handles color pickers with auto-contrast text color
 * - Provides header preview clone
 * - Exposes applyStyle/clearStyle so other modules (logo) can use the dynamic stylesheet
 */

const ThemeModuleCard = (() => {
  // ========== Public renderers ==========
  function renderSectionCards(modalBody, config) {
    (config.modal.sections || []).forEach(section => {
      const uniqueId = `${config.id}-${section.id}-options`;
      const card = document.createElement("div");
      card.classList.add("card", "card-outline", "card-secondary", "card-lapine-blue", "card-lapine");

      const includeHeaderPreview =
        (section.id && String(section.id).toLowerCase() === "header") ||
        (section.title && String(section.title).toLowerCase().includes("header"));

      card.innerHTML = `
        <div class="card-header d-flex align-items-center justify-content-between">
          <h3 class="card-title mb-0"><i class="fa ${section.icon || ""} mr-2"></i>${section.title}</h3>
        </div>
        <div class="card-body">
          <div class="row" id="${uniqueId}"></div>
          ${includeHeaderPreview ? `<div id="theme-header-container" class="position-relative mt-3"></div>` : ""}
        </div>
      `;
      modalBody.appendChild(card);
    });
  }

  function renderProperties(modalBody, config, propertyGroups) {
    (config.selectors || []).forEach(sel => {
      (sel.propertyGroupRefs || []).forEach(ref => {
        const group = propertyGroups && propertyGroups[ref.groupId];
        if (!group) return;

        const sectionId = sel.sectionId || (config.modal.sections && config.modal.sections[0] && config.modal.sections[0].id);
        const container = sectionId ? modalBody.querySelector(`#${config.id}-${sectionId}-options`) : null;
        if (!container) return;

        (ref.include || []).forEach(propName => {
          const prop = (group.properties || []).find(p => p.property === propName);
          if (!prop) return;
          const el = renderPropertyInput(prop, sel.selector);
          container.appendChild(el);
          setupSpecialInputs(el, prop, sel.selector);
        });
      });
    });
  }

  function initHeaderPreview(container) {
    container.innerHTML = "";

    const headerEl = document.querySelector(".admin-header") || document.querySelector("header");
    const brandEl = document.querySelector(".brand-link");

    if (headerEl) container.appendChild(safeClone(headerEl));
    if (brandEl && !container.querySelector(".brand-link")) container.appendChild(safeClone(brandEl));

    // Styling bounds
    container.style.border = "1px dashed #e0e0e0";
    container.style.padding = "8px";
    container.style.borderRadius = "6px";
  }

  // ========== Inputs ==========
  function renderPropertyInput(prop, selector) {
    const col = document.createElement("div");
    col.classList.add("col-md-3");

    let inputHTML = "";
    switch (prop.inputType) {
      case "background-color":
      case "color":
      case "border-color":
        inputHTML = `
          <div class="input-group">
            <div class="input-group-prepend border p-1 mr-3">
              <div class="color-picker" id="${prop.property}-picker"></div>
            </div>
            <input
              type="text"
              class="form-control"
              id="${prop.property}-color"
              data-color-prop="${prop.property}"
              data-color-selector="${selector}"
              placeholder="#rrggbb or color name"
            />
          </div>
        `;
        break;

      case "number":
        inputHTML = `
          <div class="input-group">
            <input type="number" class="form-control" data-number-prop="${prop.property}" data-number-selector="${selector}" data-unit="${prop.unit || ''}">
            <div class="input-group-append"><span class="input-group-text">${prop.unit || ''}</span></div>
          </div>
        `;
        break;

      case "select":
        inputHTML = `
          <select class="form-control" data-select-prop="${prop.property}" data-select-selector="${selector}">
            ${(prop.options || []).map(opt => `<option value="${opt}">${opt}</option>`).join('')}
          </select>
        `;
        break;

      default:
        inputHTML = `<input type="text" class="form-control" data-text-prop="${prop.property}" data-text-selector="${selector}">`;
    }

    col.innerHTML = `
      <div class="form-group">
        <label>${prop.label}</label>
        ${inputHTML}
      </div>
    `;
    return col;
  }

  function setupSpecialInputs(colRoot, prop, selector) {
    switch (prop.inputType) {
      case "background-color":
      case "color":
      case "border-color":
        setupColorControl(colRoot, prop.property, selector);
        break;

      case "number": {
        const numberEl = colRoot.querySelector('input[type="number"][data-number-prop]');
        if (!numberEl) break;
        const raw = getComputedRaw(selector, prop.property);
        const unit = numberEl.dataset.unit || "";
        const parsed = parseNumberFromCSS(raw, unit);
        if (parsed != null) numberEl.value = parsed;

        numberEl.addEventListener("change", () => {
          const val = numberEl.value ? `${numberEl.value}${unit}` : "";
          if (val) applyStyle(selector, prop.property, val);
          else clearStyle(selector, prop.property);
        });
        break;
      }

      case "select": {
        const selectEl = colRoot.querySelector('select[data-select-prop]');
        if (!selectEl) break;
        const raw = getComputedRaw(selector, prop.property);
        if (raw) {
          const match = Array.from(selectEl.options).find(o => eqCSSValue(o.value, raw));
          if (match) selectEl.value = match.value;
        }
        selectEl.addEventListener("change", () => {
          applyStyle(selector, prop.property, selectEl.value);
        });
        break;
      }

      default: {
        const textEl = colRoot.querySelector('input[type="text"][data-text-prop]');
        if (!textEl) break;
        const raw = getComputedRaw(selector, prop.property);
        if (raw) textEl.value = raw ? raw.trim() : "";
        textEl.addEventListener("change", () => {
          if (textEl.value.trim() === "") clearStyle(selector, prop.property);
          else applyStyle(selector, prop.property, textEl.value);
        });
      }
    }
  }

  // ========== Color controls ==========
  const _pickrRegistry = new WeakMap();
  const _manualOverride = new Set();

  function setupColorControl(colRoot, property, selector) {
    const pickerHost = colRoot.querySelector(".color-picker");
    const textInput = colRoot.querySelector(`#${property}-color`);
    if (!pickerHost || !textInput) return;

    textInput.dataset.colorProp = property;
    textInput.dataset.colorSelector = selector;

    if (property === "color") {
      const manualKey = manualKeyFor(selector, "color");
      const markManual = () => _manualOverride.add(manualKey);
      textInput.addEventListener("input", markManual);
      textInput.addEventListener("change", markManual);
      textInput.addEventListener("blur", markManual);
    }

    const attrDefault = textInput.getAttribute("value");
    const computedDefault = getComputedColor(selector, property);
    const initial = (window.ColorUtils && window.ColorUtils.normalizeToHex(textInput.value || attrDefault || computedDefault || "#000000")) || "#000000";

    if (window.Pickr && typeof window.Pickr.create === "function") {
      const pickr = window.Pickr.create({
        el: pickerHost,
        theme: "classic",
        default: initial,
        swatches: [
          "#FFFFFF", "#F8F9FA", "#E9ECEF", "#DEE2E6",
          "#0d6efd", "#6610f2", "#6f42c1", "#7326D9",
          "#198754", "#dc3545", "#fd7e14", "#ffc107",
          "#20c997", "#0dcaf0", "#343a40", "#000000"
        ],
        components: {
          preview: true,
          opacity: false,
          hue: true,
          interaction: { hex: true, rgba: true, input: true, clear: true, save: true }
        }
      });

      _pickrRegistry.set(textInput, pickr);
      textInput.value = initial;

      const onColor = (color) => {
        const hex = toHex(color);
        textInput.value = hex;
        applyStyle(selector, property, hex);
        if (property === "background-color") {
          autoContrastTextColor(hex, selector);
        }
      };
      pickr.on("change", onColor);
      pickr.on("save", onColor);
      pickr.on("clear", () => {
        textInput.value = "";
        clearStyle(selector, property);
      });

      textInput.addEventListener("input", () => {
        const v = textInput.value.trim();
        if (v === "") {
          try { pickr.clear(); } catch (_) {}
          clearStyle(selector, property);
          return;
        }
        const hex = window.ColorUtils ? window.ColorUtils.normalizeToHex(v) : v;
        if (hex) {
          const current = pickr.getColor() && pickr.getColor().toHEXA && pickr.getColor().toHEXA().toString(0).toLowerCase();
          if (current !== hex.toLowerCase()) pickr.setColor(hex, true);
          applyStyle(selector, property, hex);
          if (property === "background-color") {
            autoContrastTextColor(hex, selector);
          }
        }
      });

      textInput.addEventListener("blur", () => {
        const v = textInput.value.trim();
        if (v === "") {
          try { pickr.clear(); } catch (_) {}
          clearStyle(selector, property);
          return;
        }
        const hex = window.ColorUtils ? window.ColorUtils.normalizeToHex(v) : v;
        if (hex) {
          textInput.value = hex;
          pickr.setColor(hex, true);
          applyStyle(selector, property, hex);
          if (property === "background-color") {
            autoContrastTextColor(hex, selector);
          }
        }
      });

    } else {
      // Fallback: native color input
      let colorInput = pickerHost.querySelector('input[type="color"]');
      if (!colorInput) {
        colorInput = document.createElement("input");
        colorInput.type = "color";
        colorInput.className = "form-control-color";
        colorInput.style.width = "2rem";
        colorInput.style.height = "2rem";
        colorInput.style.border = "none";
        colorInput.style.padding = "0";
        pickerHost.appendChild(colorInput);
      }
      colorInput.value = initial;
      textInput.value = initial;

      const apply = () => {
        const hex = window.ColorUtils && window.ColorUtils.normalizeToHex(colorInput.value) || initial;
        textInput.value = hex;
        applyStyle(selector, property, hex);
        if (property === "background-color") {
          autoContrastTextColor(hex, selector);
        }
      };
      colorInput.addEventListener("input", apply);
      colorInput.addEventListener("change", apply);

      textInput.addEventListener("input", () => {
        const v = textInput.value.trim();
        if (v === "") {
          clearStyle(selector, property);
          return;
        }
        const hex = window.ColorUtils && window.ColorUtils.normalizeToHex(v);
        if (hex) {
          colorInput.value = hex;
          applyStyle(selector, property, hex);
          if (property === "background-color") {
            autoContrastTextColor(hex, selector);
          }
        }
      });

      textInput.addEventListener("blur", () => {
        const v = textInput.value.trim();
        if (v === "") {
          clearStyle(selector, property);
          return;
        }
        const hex = window.ColorUtils && window.ColorUtils.normalizeToHex(v) || initial;
        textInput.value = hex;
        colorInput.value = hex;
        applyStyle(selector, property, hex);
        if (property === "background-color") {
          autoContrastTextColor(hex, selector);
        }
      });
    }
  }

  // Always apply ideal text color for same selector, unless user manually changed
  function autoContrastTextColor(bgHex, selector) {
    const ideal = window.ColorUtils ? window.ColorUtils.idealTextColor(bgHex) : "#000000";
    const manualKey = manualKeyFor(selector, "color");
    if (_manualOverride.has(manualKey)) return;

    applyStyle(selector, "color", ideal);

    const input = document.querySelector(`input.form-control[data-color-prop="color"][data-color-selector="${selector}"]`);
    if (input) {
      input.value = ideal;
      const pickr = _pickrRegistry.get(input);
      if (pickr && typeof pickr.setColor === "function") {
        try { pickr.setColor(ideal, true); } catch (_) {}
      }
    }
  }

  function manualKeyFor(selector, property) {
    return `${selector}::${property}`;
  }

  // ========== Style helpers ==========
  function applyStyle(selector, property, value) {
    if (window.ThemeEditor && typeof window.ThemeEditor.updateStyle === "function") {
      try {
        window.ThemeEditor.updateStyle({ selector, property, value });
        return;
      } catch (_) {}
    }
    selectorSplit(selector).forEach(sel => {
      document.querySelectorAll(sel).forEach(el => {
        el.style.setProperty(property, value);
      });
    });
  }

  function clearStyle(selector, property) {
    if (window.ThemeEditor && typeof window.ThemeEditor.clearStyleProperty === "function") {
      try {
        window.ThemeEditor.clearStyleProperty({ selector, property });
        return;
      } catch (_) {}
    }
    selectorSplit(selector).forEach(sel => {
      document.querySelectorAll(sel).forEach(el => {
        el.style.removeProperty(property);
      });
    });
  }

  // ========== Utility helpers ==========
  function selectorSplit(selector) {
    return String(selector).split(",").map(s => s.trim()).filter(Boolean);
  }

  function getComputedRaw(selector, property) {
    const els = selectorSplit(selector)
      .map(s => s.replace(/:(hover|active|focus)$/, ""))
      .map(s => document.querySelector(s))
      .filter(Boolean);
    for (const el of els) {
      const raw = getComputedStyle(el).getPropertyValue(property);
      if (raw && raw.trim()) return raw.trim();
    }
    return null;
  }

  function parseNumberFromCSS(raw, unit) {
    if (!raw) return null;
    const m = String(raw).trim().match(/^(-?\d+(\.\d+)?)/);
    if (!m) return null;
    const num = parseFloat(m[1]);
    return Number.isFinite(num) ? num : null;
  }

  function eqCSSValue(a, b) {
    if (!a || !b) return false;
    return String(a).trim().toLowerCase() === String(b).trim().toLowerCase();
  }

  function toHex(color) {
    if (!color) return "#000000";
    try { return color.toHEXA().toString(0); } catch (_) { return "#000000"; }
  }

  function getComputedColor(selector, property) {
    const els = selectorSplit(selector)
      .map(s => s.replace(/:(hover|active|focus)$/, ""))
      .map(s => document.querySelector(s))
      .filter(Boolean);
    for (const el of els) {
      const raw = getComputedStyle(el).getPropertyValue(property);
      const hex = window.ColorUtils ? window.ColorUtils.normalizeToHex(raw) : null;
      if (hex) return hex;
    }
    return null;
  }

  function safeClone(node) {
    const clone = node.cloneNode(true);
    clone.querySelectorAll("[id]").forEach(el => el.removeAttribute("id"));
    clone.querySelectorAll("script").forEach(s => s.remove());
    return clone;
  }

  // ========== Reset handling ==========
  let _resetAttached = false;
  function attachGlobalResetListener() {
    if (_resetAttached) return;
    _resetAttached = true;
    document.addEventListener("reset", (evt) => {
      const form = evt.target;
      if (!(form instanceof HTMLFormElement)) return;

      // Reset color controls
      const inputs = form.querySelectorAll('input.form-control[id$="-color"][data-color-prop]');
      inputs.forEach(inputEl => {
        const prop = inputEl.dataset.colorProp;
        const selector = inputEl.dataset.colorSelector;
        inputEl.value = "";

        const pickr = _pickrRegistry.get(inputEl);
        if (pickr && typeof pickr.clear === "function") {
          try { pickr.clear(); } catch (_) {}
        } else {
          const colorEl = inputEl.closest(".input-group") ? inputEl.closest(".input-group").querySelector('input[type="color"]') : null;
          if (colorEl) colorEl.setAttribute("value", "");
        }
        clearStyle(selector, prop);

        if (prop === "color") {
          const manualKey = manualKeyFor(selector, "color");
          _manualOverride.delete(manualKey);
        }
      });

      // Reset logos previews within this form
      form.querySelectorAll('input[type="file"][data-logo-selector]').forEach(fileEl => {
        const previewId = fileEl.dataset.logoPreview;
        const img = document.getElementById(previewId);
        if (img) {
          img.removeAttribute("src");
          img.style.display = "none";
          img.style.width = "";
          img.style.height = "";
        }
      });
    }, true);
  }

  // Public API
  return {
    renderSectionCards,
    renderProperties,
    initHeaderPreview,
    attachGlobalResetListener,
    applyStyle,
    clearStyle
  };
})();