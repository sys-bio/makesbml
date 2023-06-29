let { log } = console;


let models = [];
const maxRec = 15;
const proxy = " https://api.allorigins.win/raw?url="; // A free and open source javascript AnyOrigin alternative, 
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
//const xmlRecList2Loader = document.getElementById("loader-list2");
const xmlDownloadInput = document.getElementById("xml-id-search-input1");
const xmlRecList1 = document.getElementById("xml-1-rec");

const saveSBMLBtn = document.getElementById("saveSBMLBtn");
const copySBMLBtn = document.getElementById("copySBMLBtn");

const rec1Wrapper = document.getElementById("rec1-wrapper");
//const rec2Wrapper = document.getElementById("rec2-wrapper");

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
    e.stopPropagation();
  });
  
  function delay(fn, ms) { // use to delay event from triggering.
   let timer = 0
   return function(...args) {
     clearTimeout(timer)
     timer = setTimeout(fn.bind(this, ...args), ms || 0)
   }
  }

  async function processkeySearch(e) {
    const searchText = e.target.value.trim();
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
    if (recommends?.length) {
	   var numb = 0;
      xmlRecList1.innerHTML = "";
      recommends = recommends?.slice(0, maxRec);
      for (const rec of recommends) {
		  // Chk if id starts with 'BIOMD'
        xmlRecList1.append(createRecItem(rec, handleSelection));
		numb+=1;
      }
	 // log('Number of models in xmlRecList1');
	 // log(numb);
    }
    xmlRecList1Loader.classList.remove("showLoader")

  };

  // Do not start processing user search until at least 1000 ms has elapsed.
  // We want to reduce the number of searches and speed up populating result list.
  xmlDownloadInput.addEventListener("keyup", async (e) => {
     delay(processkeySearch(e), 1000);});  
  
 
  saveSBMLBtn.addEventListener("click", (_) => saveCode("sbml"));
  copySBMLBtn.addEventListener("click", (_) => copyToClipboard("sbml"));

  document.body.onclick = (e) => {
    xmlRecList1.style.display = "none";
  };

  xmlDownloadButton
    .addEventListener("click", handleDownloadModel);

  inputFile.addEventListener("change", function() {
    var fr = new FileReader();
	xmlRecList1Loader.classList.add("showLoader");
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
async function processSBML() {
  sbmlCode = sbmlTextArea.value;
  clearPreviousLoads();
  var ptrSBMLCode = jsAllocateUTF8(sbmlCode);
  var load_int = loadSBMLString(ptrSBMLCode);
  //console.log("processSBML: int returned: ", load_int);
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

async function processFile(fileStr) {
  try {
	//  xmlRecList1Loader.classList.add("showLoader");
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
	  
      await processSBML();
	  xmlRecList1Loader.classList.remove("showLoader");// added in inputFile.addEventListener("change" )
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
  var promptFilename;
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

async function importXml(modelId, fileName) {
  //const proxy = " https://api.allorigins.win/raw?url=";
  const apiUrl = `https://www.ebi.ac.uk/biomodels/model/download/${modelId}?filename=${fileName}`;
// Ex: https://www.ebi.ac.uk/biomodels/model/download/BIOMD0000000444?filename=BIOMD0000000444_url.xml
  if (isValidUrl(apiUrl)) {
	  xmlRecList1Loader.classList.add("showLoader")
    await fetch(proxy + apiUrl)
      .then((response) => response.text())
      .then((data) => {
        // console.log(data.description);
        sbmlTextArea.value = data;
		processSBML(); // generate antimony version
      })
      .catch((err) => console.error(err));
  } else {
    alert("Invalid Model ID");
  }
  xmlRecList1Loader.classList.remove("showLoader")
}

async function processJSONModelInfo(modelId,modelInfoJSON) {
//console.log('Loaded JSON str: ', modelInfoJSON);
 
 try {
  const mainFilesList = modelInfoJSON.main 
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

async function downloadXml(modelId) {
 // const proxy = " https://api.allorigins.win/raw?url=";
  const apiUrl = `https://www.ebi.ac.uk/biomodels/model/files/${modelId}?format=json`;
  //log(apiUrl);
  xmlRecList1Loader.classList.add("showLoader")
  if (isValidUrl(apiUrl)) {
    await fetch(proxy + apiUrl)
	  .then((response) => response.json())
      .then((data) => {
		 // log(data);
		  processJSONModelInfo(modelId, data);
      })
      .catch((err) => console.error(err));
  } else {
    alert("Invalid Model ID");
  }
  xmlRecList1Loader.classList.remove("showLoader")
}

async function processUserQuery(queryStr) {
  let query = queryStr.split(/(\s)/).filter((x) => x.trim().length>0);
  //log('Query: ',query, query.length)
  let searchQuery = '';
  for(let i = 0; i < query.length; i++) {
	if(i == query.length - 1) {
	  searchQuery += query[i];}
    else {
	  searchQuery += query[i] +'%20';}	
  }
  //log(' --> search: ',searchQuery);
  return searchQuery;	
}


async function getModelIdRecommend(query) {
  const biomodelsQuery = await processUserQuery(query); 
  const format = "json";
  xmlRecList1Loader.classList.add("showLoader")
 // const apiUrl = `https://www.ebi.ac.uk/biomodels/search?query=${biomodelsQuery}%26numResults=${maxRec}%26format=${format}`;
  const apiUrl = `https://www.ebi.ac.uk/biomodels/search?query=${biomodelsQuery}%20BIOMD%2A%26numResults=${maxRec}%26format=${format}`;
 // Only want model numbers starting with BIOMD: https://www.ebi.ac.uk/biomodels/search?query=sodium%20BIOMD%2A%26numResults=15%26format=json 
 
  let models;
  if (isValidUrl(apiUrl)) {
    //log("fetching...", apiUrl)
    await fetch(proxy + apiUrl)
      .then((response) => {
        //log("request 1 complete")
        return response.json()
      })
      .then((data) => {
        // log("request 2 complete")
        (models = data.models)
      })
      .catch(err => {
		  //log('Nothing returned from query');
        if (err instanceof TypeError) return []
      });
  } else {
    alert("Invalid url");
  }
  xmlRecList1Loader.classList.remove("showLoader")
  return models?.map(({ id, name }) => ({
    id,
    name,
  }));
}
async function handleDownloadModel() {
  if (xmlDownloadInput.value.trim().length > 1) {
	  xmlRecList1Loader.classList.add("showLoader")
    await downloadXml(xmlDownloadInput.value.trim());
  }
}


