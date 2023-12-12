let { log } = console;


let models = [];
const maxRec = 15;
const proxy = " https://api.allorigins.win/raw?url="; // A free and open source javascript AnyOrigin alternative, 
const biomodelsInfoURL = "/makesbml/buildBiomodelsSearch/biomodelsinfo.json";
const makeSBMLinfo = "MakeSBML version 1.0.\nCopyright 2023, Bartholomew Jardine and Herbert M. Sauro,\nUniversity of Washington, USA.\nSpecial thanks to University of Washington student Tracy Chan for her assistance with this software.\n\nThis project was funded by NIH/NIGMS (R01GM123032 and P41EB023912).";

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
	const name = itr.next().value;
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
	if (searchText.length < 3) { // 2 chars before start search
      xmlRecList1.innerHTML = "";
      return;
    }
	log("processkeySearch(): ", e );
    let recommends = await getModelIdRecommendNew(searchText);
    const handleSelection = (e) => {
      e.preventDefault();
      const text = e.target.innerText;
      xmlDownloadInput.value = text.split(": ").slice(-1);
	  document.getElementById("sbmlcode").value = '[SBML code here.]'; // Clear out old model 
	  handleDownloadModel(); // view biomodel that user selected.
    };

	if (recommends?.entries()) {
	   var numb = 0;
      xmlRecList1.innerHTML = "";
     // recommends = recommends?.slice(0, maxRec); // grab the first maxRec entries
      for (const rec of recommends) {
		  // Chk if id starts with 'BIOMD'
        xmlRecList1.append(createRecItem(rec, handleSelection)); // rec -> one Map entry (id, name)
		numb+=1;
      }
    }

  };

  // Do not start processing user search until at least 1000 ms has elapsed.
  // We want to reduce the number of searches and speed up populating result list.
  xmlDownloadInput.addEventListener("keyup", async (e) => {
     delay(processkeySearch(e), 1000);});  
 
  saveSBMLBtn.addEventListener("click", (_) => saveCode("sbml"));
  copySBMLBtn.addEventListener("click", (_) => copyToClipboard("sbml"));
  aboutBtn.addEventListener("click", (_) => showAbout());  
  
  document.body.onclick = (e) => {
    xmlRecList1.style.display = "none";
  };

  //xmlDownloadButton
  //  .addEventListener("click", handleDownloadModel);

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

async function processAntimony() {
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
	  xmlRecList1Loader.classList.remove("showLoader");// added in inputFile.addEventListener("change" )
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
	if( promptFilename.includes(fileExt) ) {
	  downloadLink.download = promptFilename; }
	else { downloadLink.download = promptFilename + fileExt; }
   
    downloadLink.innerHTML = "Download File";
    downloadLink.href = window.URL.createObjectURL(textBlob);
    downloadLink.click();
    
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

function checkIfInString(searchStr, queryAr, resultAr) {
  for( let i=0; i < queryAr.length; i++) {
	if(searchStr.toLowerCase().includes(queryAr[i].toLowerCase())) {
	  resultAr[i] = true; }
  }	  
  return resultAr;	
}

async function getModelList(newQuery, jsonData) {
  let queries;
  if(newQuery != null) {
    queries = newQuery.split(" "); }
  else { newQuery = ''; queries = ''; }
  let found = []; // keep track if queries are found.
  
  const results = new Map();
  for (var model in jsonData) {
	for(let i =0; i < queries.length; i++) {
	  found[i] = false; }
    for ( var key in jsonData[model]) {
     // console.log(key)
	  if (key == 'name') {
	   // console.log(jsonData[model][key]);
		found = checkIfInString(jsonData[model][key], queries, found);
	  }
	  else if (key == 'description') {
		found = checkIfInString(jsonData[model][key], queries, found);
	  }
	  else if (key == 'publication') {
		for (var key2 in jsonData[model][key]) {
		  if(key2 == 'authors') {
			for(var author in jsonData[model][key][key2]) {
			 // console.log(jsonData[model][key][key2][author]['name']);
			  found = checkIfInString(jsonData[model][key][key2][author]['name'], queries, found);
			}				
		  }
		}			
	  }
	}
	let save = 0;
	for( let i =0; i < found.length ; i++) {
	  if(found[i]) { save +=1; }	
	} 
	if (save == found.length){ results.set( model, jsonData[model]['name'] );}
  }
  return results;
}

async function getBiomodelsInfo(query) {
	console.log('In getBiomodelsInfo()');
	let models;
	//const apiUrl = '/makesbml/buildBiomodelsSearch/biomodelsinfo.json'
	await fetch(biomodelsInfoURL)
     .then((response) => response.json())
     .then((json) => {
	//console.log(json);
	 xmlRecList1Loader.classList.remove("showLoader")
	 models = getModelList(query, json)
	  });	
	return models;
}

async function importXml(modelId, fileName) {
  clearPreviousLoads;
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
		xmlRecList1Loader.classList.remove("showLoader")
      })
      .catch((err) => console.error(err));
  } else {
    alert("Invalid Model ID");
  }
  
}

async function processJSONModelInfo(modelId,modelInfoJSON) { 
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
  const apiUrl = `https://www.ebi.ac.uk/biomodels/model/files/${modelId}?format=json`;
  const modelFileName = modelId + '_url.xml';
  importXml(modelId, modelFileName)
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

async function getModelIdRecommendNew(query) {
  const biomodelsQuery = await processUserQuery(query); 
  const format = "json";
  xmlRecList1Loader.classList.add("showLoader")
 
  return getBiomodelsInfo(query);
}

/*
async function getModelIdRecommend(query) {
  const biomodelsQuery = await processUserQuery(query); 
  const format = "json";
  xmlRecList1Loader.classList.add("showLoader")
  const apiUrl = `https://www.ebi.ac.uk/biomodels/search?query=${biomodelsQuery}%20BIOMD%2A%26numResults=${maxRec}%26format=${format}`;
 // Only want model numbers starting with BIOMD: https://www.ebi.ac.uk/biomodels/search?query=sodium%20BIOMD%2A%26numResults=15%26format=json 
 // Should be something like this:`https://www.ebi.ac.uk/biomodels/search?query=${biomodelsQuery}%26curationstatus%3A%22Manually%20curated%22%26domain=biomodels%26numResults=${maxRec}%26format=${format}`
 
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
		xmlRecList1Loader.classList.remove("showLoader")
        (models = data.models)
      })
      .catch(err => {
		  //log('Nothing returned from query');
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
*/
async function handleDownloadModel() {
  if (xmlDownloadInput.value.trim().length > 1) {
	  xmlRecList1Loader.classList.add("showLoader")
	await downloadXml(xmlDownloadInput.value.trim());
  }
}

async function showAbout() {
	
	window.alert(makeSBMLinfo);
}


