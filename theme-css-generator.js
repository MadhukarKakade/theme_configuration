function generateCSS(themeConfig, groupCatalog, formValues) {
  let css = "";

  themeConfig.forEach(section => {
    section.selectors.forEach(selObj => {
      let rules = "";

      selObj.propertyGroupRefs.forEach(ref => {
        const group = groupCatalog[ref.groupId];
        if (!group) return;

        ref.include.forEach(propName => {
          const propDef = group.properties.find(p => p.property === propName);
          if (!propDef) return;

          // Pull value from formValues
          const value = formValues[selObj.selector]?.[propName];
          if (!value) return;

          if (propDef.inputType === "composite") {
            // build padding/margin shorthand
            rules += `${propName}: ${value.top}${propDef.unit} ${value.right}${propDef.unit} ${value.bottom}${propDef.unit} ${value.left}${propDef.unit};\n`;
          } else {
            const unit = propDef.unit || "";
            rules += `${propName}: ${value}${unit};\n`;
          }
        });
      });

      if (rules) {
        css += `${selObj.selector} {\n${rules}${selObj.important ? " !important" : ""}}\n\n`;
      }
    });
  });

  return css;
}
