function renderConfigButtons() {
  themeJSON.themeConfig.forEach(config => {
    const triggerEl = document.querySelector(config.modal.triggerSelector);
   if (triggerEl) {
        const buttonHTML = `
          <li class="nav-item">
            <div class="bg-light p-1 rounded m-1 ml-2" data-toggle="tooltip" title="Edit ${config.label}">
              <button class="btn btn-primary btn-xs actionBtn" data-config-id="${config.id}">
                <i class="fas fa-pen"></i>
              </button>
            </div>
          </li>
        `;
        triggerEl.insertAdjacentHTML('beforeend', buttonHTML);
        // Add click event listener to button
        const addedButton = triggerEl.querySelector(`[data-config-id="${config.id}"]`);
        addedButton.addEventListener('click', () => openThemeModal(config));
      }
  });
}

// function renderPropertyInput(property) {
//   if (property.inputType === "color") {
//     return `<input type="color" class="form-control" name="${property.property}">`;
//   }
//   if (property.inputType === "number") {
//     return `<input type="number" class="form-control" name="${property.property}"> ${property.unit || ""}`;
//   }
//   if (property.inputType === "select") {
//     return `<select class="form-control" name="${property.property}">${property.options.map(opt => `<option>${opt}</option>`).join("")}</select>`;
//   }
//   return `<input type="text" class="form-control" name="${property.property}">`;
// }

// function renderModalBody(config) {
//   const modalBody = document.querySelector("#themePersonalizationModal .modal-body");
//   modalBody.innerHTML = "";

//   config.modal.sections.forEach(section => {
//     const sectionCard = document.createElement("div");
//     sectionCard.classList.add("card", "card-outline", "card-secondary", "mb-3");
//     sectionCard.innerHTML = `
//       <div class="card-header">
//         <h3 class="card-title"><i class="${section.icon} mr-2"></i>${section.title}</h3>
//       </div>
//       <div class="card-body">
//         ${config.selectors.map(sel => sel.propertyGroupRefs.map(ref =>
//           ref.include.map(propName => {
//             const property = themeJSON.propertyGroups[ref.groupId].properties.find(p => p.property === propName);
//             return `
//               <div class="form-group">
//                 <label>${property.label}</label>
//                 ${renderPropertyInput(property)}
//               </div>
//             `;
//           }).join("")
//         ).join("")).join("")}
//       </div>
//     `;
//     modalBody.appendChild(sectionCard);
//   });
// }

// renderThemeForm(config, themeJSON.propertyGroups)

function openThemeModal(config) {
  $("#themePersonalizationModal").modal("show");

  document.querySelector("#themePersonalizationModal .modal-title #modal-name").innerHTML =
    config.modal.title;

  const modalDialog = document.querySelector("#themePersonalizationModal .modal-dialog");
  modalDialog.className = "modal-dialog " + config.modal.size + " modal-dialog-scrollable";

  document.getElementById("sectionFlag").value = config.id;

  // renderModalBody(config);
  ThemeFormGenerator.renderThemeForm(themeJSON.themeConfig[0], themeJSON.propertyGroups);
}

document.getElementById("theme-customization-form").addEventListener("submit", function(e){
  e.preventDefault();
  const formData = new FormData(this);
  console.log("Submitting section:", formData.get("sectionFlag"));
  formData.forEach((value,key) => console.log(key,value));
  $("#themePersonalizationModal").modal("hide");
});

renderConfigButtons();