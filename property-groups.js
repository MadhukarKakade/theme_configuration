const propertyGroups = {
  typography: {
    name: "Typography",
    properties: [
      { property: "font-family", label: "Font Family", inputType: "select", options: ["Arial", "Roboto", "Lato"] },
      { property: "font-size", label: "Font Size", inputType: "number", unit: "px" },
      { property: "line-height", label: "Line Height", inputType: "number" },
      { property: "letter-spacing", label: "Letter Spacing", inputType: "number", unit: "px" }
    ]
  },
  colors: {
    name: "Colors",
    properties: [
      { property: "background-color", label: "Background Color", inputType: "color", pseudo: ["", ":hover", ":focus"] },
      { property: "color", label: "Text Color", inputType: "color", pseudo: ["", ":hover"] },
      { property: "border-color", label: "Border Color", inputType: "color", pseudo: ["", ":focus"] }
    ]
  },
  borders: {
    name: "Borders",
    properties: [
      { property: "border-radius", label: "Border Radius", inputType: "number", unit: "px" },
      { property: "border-width", label: "Border Width", inputType: "number", unit: "px" },
      { property: "border-style", label: "Border Style", inputType: "select", options: ["solid", "dashed", "dotted", "none"] }
    ]
  },
  spacing: {
    name: "Spacing",
    properties: [
      { property: "padding", label: "Padding", inputType: "composite", subProps: ["top", "right", "bottom", "left"], unit: "px" },
      { property: "margin", label: "Margin", inputType: "composite", subProps: ["top", "right", "bottom", "left"], unit: "px" }
    ]
  }
};
