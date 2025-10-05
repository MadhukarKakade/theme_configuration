const ThemeFormGenerator = (() => {

  function renderThemeForm(config, propertyGroups) {
    const modalBody = document.querySelector("#themePersonalizationModal .modal-body");
    modalBody.innerHTML = "";

    // ===== 1️⃣ Create cards for each modal section =====
    config.modal.sections.forEach(section => {
      const uniqueId = `${config.id}-${section.id}-options`;
      const sectionCard = document.createElement("div");
      sectionCard.classList.add("card", "card-outline", "card-secondary", "card-lapine-blue", "card-lapine");

      sectionCard.innerHTML = `
        <div class="card-header">
          <h3 class="card-title"><i class="fa ${section.icon} mr-2"></i>${section.title}</h3>
        </div>
        <div class="card-body">
          <div class="row" id="${uniqueId}"></div>
        </div>
      `;
      modalBody.appendChild(sectionCard);
    });

    // ===== 2️⃣ Render property inputs (colors, typography, etc.) =====
    config.selectors.forEach(sel => {
      sel.propertyGroupRefs.forEach(ref => {
        const group = propertyGroups[ref.groupId];
        if (!group) return;

        // Use sel.sectionId if defined; fallback to first section
        const sectionId = sel.sectionId || config.modal.sections[0].id;
        const uniqueContainerId = `${config.id}-${sectionId}-options`;
        const container = modalBody.querySelector(`#${uniqueContainerId}`);

        if (!container) {
          console.warn(`Container not found for selector: ${sel.selector}, section: ${uniqueContainerId}`);
          return;
        }

        ref.include.forEach(propName => {
          const prop = group.properties.find(p => p.property === propName);
          if (!prop) return;
          container.appendChild(renderPropertyInput(prop, sel.selector));
        });
      });
    });

    // ===== 3️⃣ Render logo upload sections (auto maps to logoSections) =====
    if (config.logos && config.logos.length > 0) {
      const logoSection = config.modal.sections.find(s => s.id === "logoSections");
      if (logoSection) {
        const container = modalBody.querySelector(`#${config.id}-${logoSection.id}-options`);
        if (!container) return;

        config.logos.forEach((logo, index) => {
          container.appendChild(renderLogoInput(logo, index));
        });
      }
    }
  }

  // ========== Helper: Render property input ==============
  function renderPropertyInput(prop, selector) {
    const col = document.createElement("div");
    col.classList.add("col-md-3");

    let inputHTML = "";
    switch (prop.inputType) {
      // case "color":
      //   inputHTML = `
      //     <input type="color" class="form-control"
      //            onchange="ThemeEditor.updateStyle({selector:'${selector}', property:'${prop.property}', value:this.value})">
      //   `;
      //   break;
       case 'background-color':
      case 'color':
      case 'border-color':
        // Generate color picker + input
        inputHTML = `
          <div class="input-group">
            <div class="input-group-prepend border p-1 mr-3">
              <div class="color-picker" id="${prop.property}-picker"></div>
            </div>
            <input type="text" class="form-control" id="${prop.property}-color" />
          </div>
        `;
        break;

      case "number":
        inputHTML = `
          <div class="input-group">
            <input type="number" class="form-control"
                   onchange="ThemeEditor.updateStyle({selector:'${selector}', property:'${prop.property}', value:this.value + '${prop.unit || ''}'})">
            <div class="input-group-append"><span class="input-group-text">${prop.unit || ''}</span></div>
          </div>
        `;
        break;

      case "select":
        inputHTML = `
          <select class="form-control"
                  onchange="ThemeEditor.updateStyle({selector:'${selector}', property:'${prop.property}', value:this.value})">
            ${prop.options.map(opt => `<option value="${opt}">${opt}</option>`).join('')}
          </select>
        `;
        break;

      default:
        inputHTML = `
          <input type="text" class="form-control"
                 onchange="ThemeEditor.updateStyle({selector:'${selector}', property:'${prop.property}', value:this.value})">
        `;
    }

    col.innerHTML = `
      <div class="form-group">
        <label>${prop.label}</label>
        ${inputHTML}
      </div>
    `;
    return col;
  }

  // ========== Helper: Render logo input ==============
  function renderLogoInput(logo, index) {
    const col = document.createElement("div");
    col.classList.add("col-md-6");
    const previewId = `${logo.title.replace(/\s+/g, '-')}-preview-${index}`;

    col.innerHTML = `
      <div class="row">
        <div class="col-md-6">
          <div class="form-group required">
            <label>${logo.title}</label>
            <input type="file" class="form-control-file" accept="image/*"
                   onchange="ThemeEditor.previewLogo(this, '${previewId}', '${logo.originalImageSelector}')">
          </div>
        </div>
        <div class="col-md-3">
          <div class="form-group required">
            <label>Width</label>
            <div class="input-group">
              <input type="number" class="form-control" min="${logo.minWidth}" max="${logo.maxWidth}"
                     onchange="ThemeEditor.updateStyle({selector:'${logo.originalImageSelector}', property:'width', value:this.value+'px'})">
              <div class="input-group-append"><span class="input-group-text">px</span></div>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="form-group required">
            <label>Height</label>
            <div class="input-group">
              <input type="number" class="form-control" min="${logo.minHeight}" max="${logo.maxHeight}"
                     onchange="ThemeEditor.updateStyle({selector:'${logo.originalImageSelector}', property:'height', value:this.value+'px'})">
              <div class="input-group-append"><span class="input-group-text">px</span></div>
            </div>
          </div>
        </div>
      </div>
      <h5 class="mb-3">${logo.title} Preview</h5>
      <div class="upload-img-box">
        <img id="${previewId}" class="brand-image" src="#" alt="${logo.title} Preview">
      </div>
    `;
    return col;
  }

  return { renderThemeForm };
})();
