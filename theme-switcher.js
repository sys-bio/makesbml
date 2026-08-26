// Theme switcher. Populates the #theme-switcher container in the footer.
//
// The palettes themselves live in style.css as [data-theme="..."] blocks,
// which only redefine colour custom properties. The choice is stored in
// localStorage and applied by a small inline script in <head>, so the page
// paints in the right theme instead of flashing the default first.

(function () {
  "use strict";

  var STORAGE_KEY = "makesbml-theme";

  var THEMES = [
    { id: "", name: "Slate", swatch: "#293D56" },
    { id: "ink", name: "Ink", swatch: "#18181b" },
    { id: "dark", name: "Slate Dark", swatch: "#1c2128" },
    { id: "nord-dark", name: "Nord Dark", swatch: "#3b4252" },
  ];

  function applyTheme(id) {
    if (id) {
      document.documentElement.setAttribute("data-theme", id);
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch (e) {
      /* private browsing - switching still works, it just will not persist */
    }
  }

  function storedTheme() {
    try {
      return localStorage.getItem(STORAGE_KEY) || "";
    } catch (e) {
      return "";
    }
  }

  function build() {
    var box = document.getElementById("theme-switcher");
    if (!box) return;

    var current = storedTheme();

    var label = document.createElement("span");
    label.className = "ts-label";
    label.textContent = "Theme";
    box.appendChild(label);

    var row = document.createElement("div");
    row.className = "ts-row";

    var nameEl = document.createElement("span");
    nameEl.className = "ts-name";

    THEMES.forEach(function (theme) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.style.backgroundColor = theme.swatch;
      btn.title = theme.name;
      btn.setAttribute("aria-label", theme.name + " theme");
      btn.setAttribute("aria-pressed", String(theme.id === current));

      btn.addEventListener("click", function () {
        applyTheme(theme.id);
        nameEl.textContent = theme.name;
        row.querySelectorAll("button").forEach(function (b) {
          b.setAttribute("aria-pressed", "false");
        });
        btn.setAttribute("aria-pressed", "true");
      });

      if (theme.id === current) nameEl.textContent = theme.name;
      row.appendChild(btn);
    });

    box.appendChild(row);
    box.appendChild(nameEl);
  }

  document.addEventListener("DOMContentLoaded", build);
})();
