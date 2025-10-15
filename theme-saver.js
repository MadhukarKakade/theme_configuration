// File: vendor_portal/theme/convert_JSON/theme-saver.js
(function (global) {
  "use strict";

  var DEFAULT_STORAGE_KEY = "vendor_portal:dynamic_theme_css";

  function saveToLocalStorage(storageKey) {
    storageKey = storageKey || DEFAULT_STORAGE_KEY;
    if (!global.DynamicStyleManager) return;
    global.DynamicStyleManager.saveToLocalStorage(storageKey);
  }

  function loadFromLocalStorage(storageKey) {
    storageKey = storageKey || DEFAULT_STORAGE_KEY;
    if (!global.DynamicStyleManager) return;
    global.DynamicStyleManager.loadFromLocalStorage(storageKey);
  }

  function download(filename) {
    filename = filename || "theme.css";
    if (!global.DynamicStyleManager) return;
    var css = global.DynamicStyleManager.getCSS();
    var blob = new Blob([css], { type: "text/css" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.download = filename;
    a.href = url;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 500);
  }

  global.ThemeSaver = {
    saveToLocalStorage: saveToLocalStorage,
    loadFromLocalStorage: loadFromLocalStorage,
    download: download
  };
})(window);