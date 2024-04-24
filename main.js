
import {searchModels, getModel} from "./buildBiomodelsSearch/getBiomodels.js";
let { log } = console;

let models = [];
//const maxRec = 15; currently Not used
const biomodelsInfoURL = "./buildBiomodelsSearch/cached_biomodels.json";
const makeSBMLversion = "MakeSBML version 1.5. ";
const makeSBMLinfo = makeSBMLversion + "\nCopyright 2023-24, Bartholomew Jardine and Herbert M. Sauro,\nUniversity of Washington, USA.\nSpecial thanks to University of Washington student Tracy Chan for her assistance with this software.\n\nThis project was funded by NIH/NIGMS (R01GM123032 and P41EB023912).";

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
const aboutBtn = document.getElementById("aboutBtn");

//const xmlDownloadButton = document.querySelector("#xml-download-wrapper button")
const xmlImportButton = document.querySelector("#xml-import-wrapper button")
const xmlRecList1Loader = document.getElementById("loader-list1");
const xmlDownloadInput = document.getElementById("xml-id-search-input1");
const xmlRecList1 = document.getElementById("xml-1-rec");

const saveSBMLBtn = document.getElementById("saveSBMLBtn");
const copySBMLBtn = document.getElementById("copySBMLBtn");

const rec1Wrapper = document.getElementById("rec1-wrapper");

const antTextArea = document.getElementById("antimonycode");
const sbmlTextArea = document.getElementById("sbmlcode");

window.onload = function() {
  initLoad();
  saveAntimonyBtn.addEventListener("click", (_) => saveCode("antimony"));
  copyAntimonyBtn.addEventListener("click", (_) => copyToClipboard("antimony"));
  procAntimonyBtn.addEventListener("click", processAntimony);
  procSBMLBtn.addEventListener("click", processSBML);

	const createRecItem = (id_nameMap, onclickEvent) => {    
	const itr = id_nameMap.values();
	const id = itr.next().value;
	const name = itr.next().value.name;
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
    xmlRecList1.style.display = "block"; // allow list of models to be displayed below input box. 
    e.stopPropagation();
  });
  
  xmlDownloadInput.addEventListener("mousedown", (event) => {
	  xmlRecList1.style.display = "block";
  });
  
  /*xmlDownloadInput.addEventListener("mouseup", (event) => {
	  xmlRecList1Loader.classList.remove("showLoader");
  }); */
    
  function delay(fn, ms) { // use to delay event from triggering.
    let timer = 0
    return function(...args) {
     clearTimeout(timer)
     timer = setTimeout(fn.bind(this, ...args), ms || 0)
    }
  }

  async function processkeySearch(e) {
    const searchText = e.target.value.trim();
	if (searchText.length < 3) { // 2 chars before start search
      xmlRecList1.innerHTML = "";
      return;
    }
	xmlRecList1Loader.classList.add("showLoader");
	let recommends = await getBiomodelsInfo(searchText);
    const handleSelection = (e) => {
      e.preventDefault();
      const text = e.target.innerText;
      xmlDownloadInput.value = text.split(": ").slice(-1);
	  document.getElementById("sbmlcode").value = '[SBML code here.]'; // Clear out old model 
	  handleDownloadModel(); // view biomodel that user selected.
    };
	let recommendMap = recommends.models;
	if (recommendMap?.entries()) {
	   var numb = 0;
      xmlRecList1.innerHTML = "";
     // recommendMap = recommendMap?.slice(0, maxRec); // grab the first maxRec entries
      for (const rec of recommendMap) {
		// Chk if id starts with 'BIOMD' : implies model has been curated
		const itr = rec.values();
	    const id = itr.next().value;
		if(id.includes('BIOMD')) {
          xmlRecList1.append(createRecItem(rec, handleSelection)); // rec -> one Map entry (id, name)
		  numb+=1;
		}
      }
    }

  };

  // Do not start processing user search until at least 500 ms has elapsed.
  // We want to reduce the number of searches and speed up populating result list.
  xmlDownloadInput.addEventListener("keyup", async (e) => {  
	delay(processkeySearch(e), 500);});
  saveSBMLBtn.addEventListener("click", (_) => saveCode("sbml"));
  copySBMLBtn.addEventListener("click", (_) => copyToClipboard("sbml"));
  aboutBtn.addEventListener("click", (_) => showAbout());  
  
  //document.body.onclick = (e) => {
    //xmlRecList1.style.display = "none"; // deletes/clears next dropdown list if using mouse
  //};


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

async function processAntimony() { // Generate SBML version.
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
async function processSBML() { // Generate Antimony version
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
  if(fileStr.length > 1000000){
    alert('Model file is very large and may take a minute or more to process!');
  }
  try {
	clearPreviousLoads;
    var ptrFileStr = jsAllocateUTF8(fileStr);
    if (loadAntimonyString(ptrFileStr) > 0) {
      antTextArea.value = fileStr;
      procSBMLBtn.disabled = true;
      sbmlTextArea.value = "[SBML code here.]";
      await processAntimony();
	  xmlRecList1Loader.classList.remove("showLoader");// Remove drop-down list of biomodels
													   // added in inputFile.addEventListener("change" )
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
	if( promptFilename.includes(fileExt) || promptFilename.includes(".sbml") ) {
	  downloadLink.download = promptFilename; }
	else { downloadLink.download = promptFilename + fileExt; }
   
    downloadLink.innerHTML = "Download File";
    downloadLink.href = window.URL.createObjectURL(textBlob);
    downloadLink.click();
    
  }
}


	// loads biomodels cache and returns models that match query
async function getBiomodelsInfo(query) {  
	let models;
	xmlRecList1Loader.classList.remove("showLoader"); // Remove drop-down list of biomodels ??
	return searchModels(query) //fetch(biomodelsInfoURL)
}

// Get URL of biomodel and then get model, calls getBiomodel.js ->getModel()
async function getModelFile(modelId) {
  clearPreviousLoads;
   await getModel(modelId)
      .then((response) => {
		const filename = response[0];
		const sbmlStr = response[1];
		sbmlTextArea.value = response[1];
		processSBML(); // generate antimony version
		xmlRecList1Loader.classList.remove("showLoader") // Remove drop-down list of biomodels 
		xmlRecList1.style.display = "none"; // Clear drop-down list of biomodels 
      })
	.catch((err) => console.error(err));
  }

async function getModelIdRecommendNew(query) {
  xmlRecList1Loader.classList.add("showLoader") // Show drop-down list of biomodels
  return getBiomodelsInfo(query);
}

async function handleDownloadModel() {
  if (xmlDownloadInput.value.trim().length > 1) {
	xmlRecList1Loader.classList.add("showLoader") // Show drop-down list of biomodels 
	try{
	  await getModelFile(xmlDownloadInput.value.trim()); // Download SBML and display.
	 }
	catch(err) {
	  console.log('handleDownloadModel():', err);
	  const errorStr = modelId + ': NOT found!';
	  window.alert(errorStr);		
	 }
		
  }
}

async function showAbout() {
	
	window.alert(makeSBMLinfo);
}


