// Drag-and-drop file loading for the two model panes.
//
// This file deliberately does not touch main.js. It only fills in a textarea
// and then clicks the existing convert button, so all of the libantimony
// handling stays in one place.

(function () {
  "use strict";

  var PANES = [
    {
      pane: "antimony-code-wrapper",
      textarea: "antimonycode",
      convert: "procAntimonyBtn",
    },
    {
      pane: "sbml-code-wrapper",
      textarea: "sbmlcode",
      convert: "procSBMLBtn",
    },
  ];

  var ANT_PLACEHOLDER = "[Antimony code here.]";
  var SBML_PLACEHOLDER = "[SBML code here.]";

  // An SBML file is XML; an Antimony file is not. Sniff the head of the text
  // so that dropping a model on the "wrong" pane still does the right thing.
  function looksLikeSBML(text) {
    var head = text.slice(0, 4000);
    return /^\s*<\?xml/i.test(head) || /<sbml[\s>]/i.test(head);
  }

  function loadIntoPane(text, isSBML) {
    var antTextArea = document.getElementById("antimonycode");
    var sbmlTextArea = document.getElementById("sbmlcode");
    var convertBtn;

    if (isSBML) {
      sbmlTextArea.value = text;
      antTextArea.value = ANT_PLACEHOLDER;
      convertBtn = document.getElementById("procSBMLBtn");
    } else {
      antTextArea.value = text;
      sbmlTextArea.value = SBML_PLACEHOLDER;
      convertBtn = document.getElementById("procAntimonyBtn");
    }

    // main.js disables a convert button after a conversion; a fresh drop is a
    // new model, so re-enable before clicking.
    convertBtn.disabled = false;
    convertBtn.click();
  }

  function readDroppedFile(file) {
    var reader = new FileReader();
    reader.onload = function () {
      var text = reader.result;
      if (text.length > 1000000) {
        alert("Model file is very large and may take a minute or more to process!");
      }
      try {
        loadIntoPane(text, looksLikeSBML(text));
      } catch (err) {
        console.log("drag and drop error:", err);
        window.alert(err);
      }
    };
    reader.onerror = function () {
      window.alert("Could not read " + file.name);
    };
    reader.readAsText(file);
  }

  function wirePane(config) {
    var pane = document.getElementById(config.pane);
    if (!pane) return;

    var depth = 0; // dragenter/dragleave fire for child elements too

    pane.addEventListener("dragenter", function (e) {
      e.preventDefault();
      depth += 1;
      pane.classList.add("is-drag-over");
    });

    pane.addEventListener("dragover", function (e) {
      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";
    });

    pane.addEventListener("dragleave", function () {
      depth -= 1;
      if (depth <= 0) {
        depth = 0;
        pane.classList.remove("is-drag-over");
      }
    });

    pane.addEventListener("drop", function (e) {
      e.preventDefault();
      e.stopPropagation();
      depth = 0;
      pane.classList.remove("is-drag-over");

      var files = e.dataTransfer && e.dataTransfer.files;
      if (files && files.length > 0) {
        readDroppedFile(files[0]);
      }
    });
  }

  // Without this the browser navigates away and opens the file itself when a
  // drop lands anywhere outside a pane.
  function blockStrayDrops() {
    ["dragover", "drop"].forEach(function (type) {
      window.addEventListener(type, function (e) {
        e.preventDefault();
      });
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    blockStrayDrops();
    PANES.forEach(wirePane);
  });
})();
