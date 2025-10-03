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
        "sections": [
          { "id": "headerSection", "title": "Header", "icon": "fas fa-heading" }
        ]
      },
      "selectors": [
        {
          "selector": ".admin-header",
          "propertyGroupRefs": [
            { "groupId": "colors", "include": ["background-color","color"] },
            { "groupId": "typography", "include": ["font-size"] }
          ]
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
