let { log } = console;


let models = [];
const maxRec = 15;
var antCode;
var sbmlCode;
var sbmlResult = "None";
var antResult = "None";

var loadAntimonyString; // libantimony function
var loadString;   // 		"
var loadSBMLString; //		"
var getSBMLString; //		"
var getAntimonyString; //	"
var getCompSBMLString; //	"
var clearPreviousLoads; //	"
var getLastError; //		"
var getWarnings;  //		"
var getSBMLInfoMessages; //	"
var getSBMLWarnings; //		"
var freeAll;      //		"
var jsFree;         // emscripten function
var jsAllocateUTF8; //  		"

const inputFile = document.getElementById("inputfile")

const saveAntimonyBtn = document.getElementById("saveAntimonyBtn");
const copyAntimonyBtn = document.getElementById("copyAntimonyBtn");
const procAntimonyBtn = document.getElementById("procAntimonyBtn");
const procSBMLBtn = document.getElementById("procSBMLBtn");

const xmlDownloadButton = document.querySelector("#xml-download-wrapper button")
const xmlImportButton = document.querySelector("#xml-import-wrapper button")
const xmlRecList1Loader = document.getElementById("loader-list1");
const xmlRecList2Loader = document.getElementById("loader-list2");
const xmlDownloadInput = document.getElementById("xml-id-search-input1");
//const xmlImportInput = document.getElementById("xml-id-input2");
const xmlRecList1 = document.getElementById("xml-1-rec");
const xmlRecList2 = document.getElementById("xml-2-rec");

const saveSBMLBtn = document.getElementById("saveSBMLBtn");
const copySBMLBtn = document.getElementById("copySBMLBtn");

const rec1Wrapper = document.getElementById("rec1-wrapper");
const rec2Wrapper = document.getElementById("rec2-wrapper");

const antTextArea = document.getElementById("antimonycode");
const sbmlTextArea = document.getElementById("sbmlcode");
window.onload = function() {
  initLoad();
  saveAntimonyBtn.addEventListener("click", (_) => saveCode("antimony"));
  copyAntimonyBtn.addEventListener("click", (_) => copyToClipboard("antimony"));
  procAntimonyBtn.addEventListener("click", processAntimony);
  procSBMLBtn.addEventListener("click", processSBML);

  const createRecItem = ({ id, name }, onclickEvent) => {
    const maxNameLength = 50;
    let li = document.createElement("li");
    let a = document.createElement("a");
    a.addEventListener("click", onclickEvent);
    a.innerText = name.slice(0, maxNameLength);
    if (name.length > maxNameLength) a.innerText += "...";
    a.innerText += `: ${id}`;
    li.append(a);
    return li;
  };

  xmlDownloadInput.addEventListener("click", (e) => {
    e.preventDefault();
    xmlRecList1.style.display = "block";
    xmlRecList2.style.display = "none";
    e.stopPropagation();
  });
  xmlDownloadInput.addEventListener("keyup", async (e) => {
    const searchText = e.target.value.trim();

   // if (searchText.length <= 1) {
	if (searchText.length <= 3) { // 3 chars before start search
      xmlRecList1.innerHTML = "";
      return;
    }

    xmlRecList1Loader.classList.add("showLoader")
    let recommends = await getModelIdRecommend(searchText);
    const handleSelection = (e) => {
      e.preventDefault();
      const text = e.target.innerText;
      xmlDownloadInput.value = text.split(": ").slice(-1);
    };
log('recommends length: ', recommends.length);
log('recommends? length: ', recommends?.length);
    if (recommends?.length) {
	   var numb = 0;
      xmlRecList1.innerHTML = "";
      recommends = recommends?.slice(0, maxRec);
      for (const rec of recommends) {
		  // Chk if id starts with 'BIOMD'
        xmlRecList1.append(createRecItem(rec, handleSelection));
		numb+=1;
      }
	  log('Number of models in xmlRecList1');
	  log(numb);
    }
    xmlRecList1Loader.classList.remove("showLoader")

  });

 /* xmlImportInput.addEventListener("keyup", async (e) => {

    const searchText = e.target.value.trim();
    const loader = xmlImportInput
    if (searchText.length <= 1) {
      xmlRecList2.innerHTML = "";
      return;
    }

    xmlRecList2Loader.classList.add("showLoader")

    let recommends = await getModelIdRecommend(searchText);
    const handleSelection = (e) => {
      e.preventDefault();
      const text = e.target.innerText;
      xmlImportInput.value = text.split(": ").slice(-1);
      handleImportModel();
    };

    if (recommends?.length) {
      xmlRecList2.innerHTML = "";

      recommends = recommends?.slice(0, maxRec);
      for (const rec of recommends) {
        xmlRecList2.append(createRecItem(rec, handleSelection));
      }
    }

    xmlRecList2Loader.classList.remove("showLoader")

  }); */

  /*xmlImportInput.addEventListener("click", (e) => {
    e.preventDefault();
    xmlRecList2.style.display = "block";
    xmlRecList1.style.display = "none";
    e.stopPropagation();
  }); */

  saveSBMLBtn.addEventListener("click", (_) => saveCode("sbml"));
  copySBMLBtn.addEventListener("click", (_) => copyToClipboard("sbml"));

  document.body.onclick = (e) => {
    xmlRecList1.style.display = "none";
    xmlRecList2.style.display = "none";
  };

  xmlDownloadButton
    .addEventListener("click", handleDownloadModel);
 // xmlImportButton
 //   .querySelector("#xml-import-wrapper button")
 //   .addEventListener("click", handleImportModel);

  inputFile.addEventListener("change", function() {
    var fr = new FileReader();
    fr.onload = function() {
      var modelString = fr.result;
      processFile(modelString);
    };
    fr.readAsText(this.files[0]);
  });
};
// Load library functions (asynchronous call):
function initLoad() {
  try {
    libantimony().then((libantimony) => {
      //	Format: libantimony.cwrap( function name, return type, input param array of types).
      loadString = libantimony.cwrap("loadString", "number", ["number"]);
      loadAntimonyString = libantimony.cwrap("loadAntimonyString", "number", [
        "number",
      ]);
      loadSBMLString = libantimony.cwrap("loadSBMLString", "number", [
        "number",
      ]);
      getSBMLString = libantimony.cwrap("getSBMLString", "string", ["null"]);
      getAntimonyString = libantimony.cwrap("getAntimonyString", "string", [
        "null",
      ]);
      getCompSBMLString = libantimony.cwrap("getCompSBMLString", "string", [
        "string",
      ]);
      clearPreviousLoads = libantimony.cwrap("clearPreviousLoads", "null", [
        "null",
      ]);
      getLastError = libantimony.cwrap("getLastError", "string", ["null"]);
      getWarnings = libantimony.cwrap("getWarnings", "string", ["null"]);
      getSBMLInfoMessages = libantimony.cwrap("getSBMLInfoMessages", "string", [
        "string",
      ]);
      getSBMLWarnings = libantimony.cwrap("getSBMLWarnings", "string", [
        "string",
      ]);
      freeAll = libantimony.cwrap("freeAll", "null", ["null"]);

      jsFree = (strPtr) => libantimony._free(strPtr);
      jsAllocateUTF8 = (newStr) => libantimony.allocateUTF8(newStr);
    });
  } catch (err) {
    console.log("Load libantimony error: ", err);
  }
}

function processAntimony() {
  antCode = document.getElementById("antimonycode").value;
  clearPreviousLoads();
  //console.log("*** Antimony code: ",antCode);
  var ptrAntCode = jsAllocateUTF8(antCode);
  var load_int = loadAntimonyString(ptrAntCode);
  if (load_int > 0) {
    sbmlResult = getSBMLString();
    document.getElementById("sbmlcode").value = sbmlResult;
    document.getElementById("procSBMLBtn").disabled = false;
    document.getElementById("copySBMLBtn").disabled = false;
    document.getElementById("saveSBMLBtn").disabled = false;
  } else {
    var errStr = getLastError();
    window.alert(errStr);
  }
  jsFree(ptrAntCode);
}
function processSBML() {
  sbmlCode = sbmlTextArea.value;
  clearPreviousLoads();
  var ptrSBMLCode = jsAllocateUTF8(sbmlCode);
  var load_int = loadSBMLString(ptrSBMLCode);
  console.log("processSBML: int returned: ", load_int);
  if (load_int > 0) {
    antResult = getAntimonyString();
    antTextArea.value = antResult;
    procAntimonyBtn.disabled = false;
    copyAntimonyBtn.disabled = false;
    saveAntimonyBtn.disabled = false;
  } else {
    var errStr = getLastError();
    window.alert(errStr);
  }
  jsFree(ptrSBMLCode);
}

function processFile(fileStr) {
  try {
    var ptrFileStr = jsAllocateUTF8(fileStr);
    if (loadAntimonyString(ptrFileStr) > 0) {
      antTextArea.value = fileStr;
      procSBMLBtn.disabled = true;
      sbmlTextArea.value = "[SBML code here.]";
      processAntimony();
    } else if (loadSBMLString(ptrFileStr) > 0) {
      sbmlTextArea.value = fileStr;
      procAntimonyBtn.disabled = true;
      antTextArea.value = "[Antimony code here.]";
      processSBML();
    } else {
      var errStr = getLastError();
      window.alert(errStr);
      clearPreviousLoads();
    }
  } catch (err) {
    console.log("processing file error: :", err);
    window.alert(err);
  }
  jsFree(ptrFileStr);
}
function copyToClipboard(copyType) {
  var copyText;
  if (copyType == "antimony") {
    copyText = antTextArea;
  } else {
    copyText = sbmlTextArea;
  }

  // Select the text field
  copyText.select();
  copyText.setSelectionRange(0, 99999); // For mobile devices
  // Copy the text inside the text field
  navigator.clipboard.writeText(copyText.value);
}

function saveCode(codeType) {
  var fileExt;
  if (codeType == "antimony") {
    fileExt = ".txt";
  } else {
    fileExt = ".xml";
  }
  if ((promptFilename = prompt("Save file as (" + fileExt + ") ", ""))) {
    var textBlob;
    if (codeType == "antimony") {
      textBlob = new Blob([antTextArea.value], {
        type: "text/plain",
      });
    } else
      textBlob = new Blob([sbmlTextArea.value], {
        type: "text/plain",
      });
    var downloadLink = document.createElement("a");
    downloadLink.download = promptFilename + fileExt;
    downloadLink.innerHTML = "Download File";
    downloadLink.href = window.URL.createObjectURL(textBlob);
    downloadLink.click();
    // delete downloadLink;
    // delete textBlob;
  }
}
function isValidUrl(str) {
  const pattern = new RegExp(
    "^([a-zA-Z]+:\\/\\/)?" + // protocol
    "((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|" + // domain name
    "((\\d{1,3}\\.){3}\\d{1,3}))" + // OR IP (v4) address
    "(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*" + // port and path
    "(\\?[;&a-z\\d%_.~+=-]*)?" + // query string
    "(\\#[-a-z\\d_]*)?$", // fragment locator
    "i"
  );
  return pattern.test(str);
}

//async function importXml(modelId, format) {
async function importXml(modelId, fileName) {
  const proxy = " https://api.allorigins.win/raw?url=";
 // const apiUrl = `https://www.ebi.ac.uk/biomodels/${modelId}?format=${format}`;
 const apiUrl = `https://www.ebi.ac.uk/biomodels/model/download/${modelId}?filename=${fileName}`;
//https://www.ebi.ac.uk/biomodels/model/download/BIOMD0000000444?filename=BIOMD0000000444_url.xml
  if (isValidUrl(apiUrl)) {
    await fetch(proxy + apiUrl)
      .then((response) => response.text())
      .then((data) => {
        // console.log(data.description);
        sbmlTextArea.value = data;
      })
      .catch((err) => console.error(err));
  } else {
    alert("Invalid Model ID");
  }
}

async function processJSONModelInfo(modelId,modelInfoJSON) {
//console.log('Loaded JSON str: ', modelInfoJSON);
 try {
  const mainFilesList = modelInfoJSON.main
//console.log(modelList);
  
  var curList = '';
  if( mainFilesList.length >0 ) {
    let modelInfo = mainFilesList[0];
	const modelFileName = modelInfo.name;
    importXml(modelId, modelFileName); 
  }
  else { window.alert('No sbml model found'); }
 }
 catch (err) {
 console.log('processing file error: :', err);
 window.alert(err);
 }
}
//Do not use
async function downloadXml(modelId) {
  const proxy = " https://api.allorigins.win/raw?url=";
  const apiUrl = `https://www.ebi.ac.uk/biomodels/model/files/${modelId}?format=json`;
 // const apiUrl = `https://www.ebi.ac.uk/biomodels/${modelId}?format=json`;
log(apiUrl);
  if (isValidUrl(apiUrl)) {
    await fetch(proxy + apiUrl)
     // .then((response) => response.text())
	  .then((response) => response.json())
      .then((data) => {
		  log(data);
		  processJSONModelInfo(modelId, data);
      //  var file = window.URL.createObjectURL(blob);
      //  window.location.assign(file);
      })
      .catch((err) => console.error(err));
  } else {
    alert("Invalid Model ID");
  }
}



async function getModelIdRecommend(query) {
  const proxy = "https://api.allorigins.win/raw?url=";
  const format = "json";
  const apiUrl = `https://www.ebi.ac.uk/biomodels/search?query=${query}%26numResults=${maxRec}%26format=${format}`;
 // https://www.ebi.ac.uk/biomodels/search?query=calcium%20and%20curationstatus%3A%22Manually%20curated%22&numResults=25&format=json
 // const apiUrl = `https://www.ebi.ac.uk/biomodels/search?query=${query}%20and%20curationstatus%3A%22manually%20curated%22&numResults=25&format=${format}` 
  log(apiUrl);
  log('getModelIdRecommend()');
  log(query)
  let models;
  if (isValidUrl(apiUrl)) {
    log("fetching")
    await fetch(proxy + apiUrl)
      .then((response) => {

         log("request 1 complete")
        return response.json()
      })
      .then((data) => {
        log(data)
        // log("request 2 complete")
        (models = data.models)
      })
      .catch(err => {
        if (err instanceof TypeError) return []
      });
  } else {
    alert("Invalid url");
  }

  return models?.map(({ id, name }) => ({
    id,
    name,
  }));
}
async function handleDownloadModel() {
  if (xmlDownloadInput.value.trim().length > 1) {
    await downloadXml(xmlDownloadInput.value.trim());
  }
}
async function handleImportModel() {
  //if (xmlImportInput.value.trim().length > 1) {
  //  await importXml(xmlImportInput.value.trim(), "json");
 // }
}

