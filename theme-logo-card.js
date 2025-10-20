/**
 * ThemeLogoCard
 * - Renders logo inputs (file + width/height) into the logo section container.
 * - On change: updates preview, persists base64 to localStorage keyed by selector,
 *   and updates all matching elements in the document (real header and modal clone).
 * - Preloads preview from existing live header or persisted base64, and hydrates dimensions.
 *
 * Dependencies:
 * - ThemeModuleCard.applyStyle / ThemeModuleCard.clearStyle (for width/height).
 */

const ThemeLogoCard = (() => {
  function renderLogos(modalBody, config) {
    if (!config || !Array.isArray(config.logos) || !config.logos.length) return;

    const logoSection = (config.modal.sections || []).find(s => s.id === "logoSections");
    if (!logoSection) return;

    const containerId = `${config.id}-${logoSection.id}-options`;
    const container = modalBody.querySelector(`#${containerId}`);
    if (!container) return;

    config.logos.forEach((logo, index) => {
      const el = renderLogoInput(logo, index);
      container.appendChild(el);
      wireLogoInput(el, logo);
      preloadLogoPreview(el, logo);
    });
  }

  function renderLogoInput(logo, index) {
    const col = document.createElement("div");
    col.classList.add("col-md-6");
    const previewId = `${String(logo.title || "Logo").replace(/\s+/g, "-")}-preview-${index}`;

    col.innerHTML = `
      <div class="row">
        <div class="col-md-6">
          <div class="form-group required">
            <label>${logo.title || "Logo"}</label>
            <input type="file" class="form-control-file" accept="image/*"
                   data-logo-selector="${logo.originalImageSelector}" data-logo-preview="${previewId}">
          </div>
        </div>
        <div class="col-md-3">
          <div class="form-group required">
            <label>Width</label>
            <div class="input-group">
              <input type="number" class="form-control" min="${logo.minWidth || 0}" max="${logo.maxWidth || 9999}"
                     data-dim-prop="width" data-dim-selector="${logo.originalImageSelector}" data-dim-preview="${previewId}">
              <div class="input-group-append"><span class="input-group-text">px</span></div>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="form-group required">
            <label>Height</label>
            <div class="input-group">
              <input type="number" class="form-control" min="${logo.minHeight || 0}" max="${logo.maxHeight || 9999}"
                     data-dim-prop="height" data-dim-selector="${logo.originalImageSelector}" data-dim-preview="${previewId}">
              <div class="input-group-append"><span class="input-group-text">px</span></div>
            </div>
          </div>
        </div>
      </div>
      <h5 class="mb-3">${logo.title || "Logo"} Preview</h5>
      <div class="upload-img-box">
        <img id="${previewId}" class="brand-image" src="#" alt="${logo.title || "Logo"} Preview" style="display:none;">
      </div>
    `;
    return col;
  }

  function wireLogoInput(colRoot, logo) {
    const fileEl = colRoot.querySelector('input[type="file"][data-logo-selector]');
    const previewId = fileEl ? fileEl.dataset.logoPreview : null;
    const selector = fileEl ? fileEl.dataset.logoSelector : null;

    if (fileEl && previewId && selector) {
      fileEl.addEventListener("change", function (e) {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function (ev) {
          const base64 = ev.target && ev.target.result;
          if (!base64) return;
          // Persist
          try { localStorage.setItem(selector, base64); } catch (_) {}

          // 1) Update preview
          const img = document.getElementById(previewId);
          if (img) {
            img.src = base64;
            img.style.display = "block";
          }

          // 2) Update all matching elements (real header and modal clone)
          updateLogoEverywhere(selector, base64);
        };
        reader.readAsDataURL(file);
      });
    }

    // Width/Height -> apply dynamic style + reflect in preview
    colRoot.querySelectorAll('input[type="number"][data-dim-prop]').forEach(function (dimEl) {
      dimEl.addEventListener("change", function () {
        const prop = dimEl.dataset.dimProp;
        const sel = dimEl.dataset.dimSelector;
        const pvId = dimEl.dataset.dimPreview;
        const val = dimEl.value ? `${dimEl.value}px` : "";

        if (val) ThemeModuleCard.applyStyle(sel, prop, val);
        else ThemeModuleCard.clearStyle(sel, prop);

        if (pvId) {
          const preview = document.getElementById(pvId);
          if (preview) {
            if (prop === "width") preview.style.width = val || "";
            if (prop === "height") preview.style.height = val || "";
            if (preview.style.display === "none" && preview.getAttribute("src")) {
              preview.style.display = "block";
            }
          }
        }
      });
    });
  }

  function preloadLogoPreview(colRoot, logo) {
    const fileEl = colRoot.querySelector('input[type="file"][data-logo-selector]');
    if (!fileEl) return;
    const previewId = fileEl.dataset.logoPreview;

    const previewImg = document.getElementById(previewId);
    const persisted = getPersistedLogo(logo.originalImageSelector);

    if (persisted) {
      if (previewImg) {
        previewImg.src = persisted;
        previewImg.style.display = "block";
      }
      // Apply persisted to real header and any clones too
      updateLogoEverywhere(logo.originalImageSelector, persisted);
    } else {
      const liveImg = document.querySelector(logo.originalImageSelector);
      if (liveImg && previewImg) {
        const src = liveImg.getAttribute("src");
        if (src) {
          previewImg.src = src;
          previewImg.style.display = "block";
        }
      }
    }

    // Hydrate dimensions from live element if present
    const live = document.querySelector(logo.originalImageSelector);
    if (live && previewImg) {
      const cs = getComputedStyle(live);
      const w = parseInt(cs.width, 10);
      const h = parseInt(cs.height, 10);
      const widthInput = colRoot.querySelector('input[type="number"][data-dim-prop="width"]');
      const heightInput = colRoot.querySelector('input[type="number"][data-dim-prop="height"]');

      if (widthInput && Number.isFinite(w)) {
        widthInput.value = w;
        previewImg.style.width = `${w}px`;
      }
      if (heightInput && Number.isFinite(h)) {
        heightInput.value = h;
        previewImg.style.height = `${h}px`;
      }
    }
  }

  function getPersistedLogo(selector) {
    try { return localStorage.getItem(selector) || ""; } catch (_) { return ""; }
  }

  function updateLogoEverywhere(selector, base64) {
    if (!selector || !base64) return;
    try {
      // Apply to any IMG matching selector; if non-img, update its descendant images
      document.querySelectorAll(selector).forEach(el => {
        if (el.tagName === "IMG") {
          el.src = base64;
        } else {
          el.querySelectorAll("img").forEach(img => { img.src = base64; });
        }
      });
    } catch (_) {
      // Invalid selector should not break anything
    }
  }

  // Public API
  return {
    renderLogos,
    updateLogoEverywhere
  };
})();