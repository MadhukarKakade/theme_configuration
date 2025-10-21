// themeConfig.js
const themeJSON = {
  "themeConfig": [
    {
      "id": "header",
      "label": "Header",
      "modal": {
        "title": "Configure Header",
        "size": "largeModal",
        "triggerSelector": "#navbar .navbar-nav.ml-auto",
        "buttonName": "list",
        "sections": [
          { "id": "logoSections", "title": "Logo", "icon": "fa-image" },
          { "id": "headerSection", "title": "Header", "icon": "fa-heading" },
        ]
      },
      "selectors": [
        {
          "selector": ".admin-header",
          "sectionId": "headerSection",
          "propertyGroupRefs": [
            { "groupId": "colors", "include": ["background-color","color"] },
            { "groupId": "typography", "include": ["font-size"] }
          ]
        }
      ],
      "logos": [
        {
          "title": "Main Logo",
          "originalImageSelector": ".brand-link .brand-image",
          "minWidth": 20,
          "maxWidth": 500,
          "minHeight": 20,
          "maxHeight": 500
        },
        {
          "title": "Fev Logo",
          "originalImageSelector": ".brand-link .brand-image-fev",
          "minWidth": 20,
          "maxWidth": 50,
          "minHeight": 20,
          "maxHeight": 50
        }
      ]
    },
    {
      "id": "footer",
      "label": "Footer",
      "modal": {
        "title": "Configure Footer",
        "size": "sm",
        "triggerSelector": ".footer-main",
        "sections": [
          { "id": "footerSection", "title": "Footer", "icon": "fas fa-football-ball" }
        ]
      },
      "selectors": [
        {
          "selector": ".footer-main, .footer-secondary",
          "propertyGroupRefs": [
            { "groupId": "colors", "include": ["background-color"] },
            { "groupId": "typography", "include": ["font-size","font-family"] }
          ]
        }
      ]
    }
  ],
  "propertyGroups": {
    "colors": {
      "name": "Colors",
      "properties": [
        { "property": "background-color", "label": "Background Color", "inputType": "color" },
        { "property": "color", "label": "Text Color", "inputType": "color" }
      ]
    },
    "typography": {
      "name": "Typography",
      "properties": [
        { "property": "font-size", "label": "Font Size", "inputType": "number", "unit": "px" },
        { "property": "font-family", "label": "Font Family", "inputType": "select", "options": ["Arial", "Roboto", "Lato"] }
      ]
    }
  }
};

window.themeConfig = window.themeConfig || (typeof window.themeJSON !== 'undefined' ? window.themeJSON : window.themeConfig);
window.propertyGroups = window.propertyGroups || (typeof window.themePropertyGroups !== 'undefined' ? window.themePropertyGroups : window.propertyGroups);
// Expose config and groups to the page (and keep backward-compat) 
window.themeJSON = window.themeJSON || themeJSON; window.themeConfig = window.themeConfig || themeJSON.themeConfig; // Array of modules: header, footer, ... 
window.propertyGroups = window.propertyGroups || themeJSON.propertyGroups; // Groups catalog
