// Depends on sbml model files in a github repository

import { Octokit, App } from "https://esm.sh/octokit"; //Imported in index.html

const github_owner = "sys-bio";
const github_repo = "BiomodelsStore";
const github_repo_cache = "BiomodelsCache";
const biomodels_json_db_path = "src/cached_biomodels.json"


// The cache of model information retrieved from a JSON file, used to search for user requested model.
var cachedData;

// URL for the chosen model to download.
let url;

/**
 * Function to search for models using the cached data (json format) located in a GitHub repo. 
 * @param {searchStr} search - The search terms, string with terms separated by a space.
 * @returns {Promise<Models>} - A promise containing the models returned by the search
 */
export async function searchModels(searchStr) {
    try {
        // Get the search query
        const queryText = searchStr.trim();
        const models = {models:new Map()};
		
		// Fetch the json model DB from the GitHub repository using the GitHub API
        const octokit = new Octokit();
        const response = await octokit.request("GET /repos/{owner}/{repo}/contents/{path}", {
          owner: github_owner,
          repo: github_repo_cache,
          path: biomodels_json_db_path ,
          headers: {
            "Accept": "application/vnd.github+json"
          }
        });
        
		if ("download_url" in response.data) {
			  const fileURL = response.data.download_url;
			  await fetch(fileURL)
				.then((response2) => response2.json())
				.then((json) => {
				cachedData = json;
				});
		
        } else {
          throwError("Unable to fetch model DB from GitHub repository: "+ github_owner+" - " + github_repo_cache);
          return ["", "Unable to fetch model DB from "+ github_owner+" - " + github_repo_cache + " repository."];
        }
		
		// ****************************
          for (const id in cachedData) {
          // if the query has multiple words, split them and check if all words are in a model
            const modelData = cachedData[id];
            if (queryText.includes(" ")) {
              const queryWords = queryText.split(" ");
              // the model should contain all the words in the query standalone, not as part of a word
              if (queryWords.every(word => Object.values(modelData).some(value => 
                typeof value === "string" && (value).toLowerCase().includes(word.toLowerCase())))) {
                models.models.set(id, {
                  name: modelData.name,
                  url: modelData.url,
                  id: modelData.model_id,
                  title: modelData.title,
                  authors: modelData.authors,
                  citation: modelData.citation,
                  date: modelData.date,
                  journal: modelData.journal
                });
              }
            }
          // if the query has only one word, check if the word is in a model
          else if (Object.values(modelData).some(value => 
            typeof value === "string" && value.toLowerCase().includes(queryText.toLowerCase()))) {
            models.models.set(id, {
              name: modelData.name,
              url: modelData.url,
              id: modelData.model_id,
              title: modelData.title,
              authors: modelData.authors,
              citation: modelData.citation,
              date: modelData.date,
              journal: modelData.journal
            });
           }
          }
		// });
        return models;
    } catch (error) {
        // If there is an error, throw it
        throwError("Unable to fetch models from " + github_owner+" - " + github_repo + " repository cache.");
    }
}

/**
 * Function to get a model from a GitHub repository
 * @param {string} modelId - The ID of the model to get
 * @returns {Promise<string>} - A promise containing the model
 */
export async function getModel(modelId) {
    try {
        // Fetch the model from the GitHub repository using the model ID and the GitHub API
        const octokit = new Octokit();
        const response = await octokit.request("GET /repos/{owner}/{repo}/contents/{path}", {
          owner: github_owner,
          repo: github_repo,
          path: "biomodels/" + modelId,
          headers: {
            "Accept": "application/vnd.github+json"
          }
        });
        
        // If the model is found, decode the content and return it
        if (Array.isArray(response.data)) {
          const fileResponse = await octokit.request("GET /repos/{owner}/{repo}/contents/{path}", {
            owner: "sys-bio",
            repo: "BiomodelsStore",
            path: "biomodels/" + modelId + "/" + response.data[0].name,
            headers: {
              "Accept": "application/vnd.github+json"
            }
          });
          if ("content" in fileResponse.data) {
			  const decodedSBMLStr = decodeURIComponent(Array.prototype.map.call(atob(fileResponse.data.content), (cStr) => {
              return "%" + ("00" + cStr.charCodeAt(0).toString(16)).slice(-2)}).join(""));
			return [modelId, decodedSBMLStr];  
          } else {
            throwError("Unable to fetch model from GitHub repository.");
            return ["", "Unable to fetch model."];
          }
        } else {
          throwError("Unable to fetch model from GitHub repository.");
          return ["", "Unable to fetch model."];
        }
    } catch (error) {
        throwError("Model not found, please choose another model.");
        return ["", "Model not found."];
    }
}



/**
 * Function to display an error message
 * @param {String} error - The error message to display
 * @returns {void}
 */
async function throwError(error) {
  const popup = document.createElement("div");
  popup.innerHTML = error.toString();
  popup.style.position = "fixed";
  popup.style.top = "50%";
  popup.style.left = "50%";
  popup.style.transform = "translate(-50%, -50%)";
  popup.style.backgroundColor = "white";
  popup.style.padding = "20px";
  popup.style.border = "1px solid black";
  popup.style.borderRadius = "10px";
  popup.style.zIndex = "100";
  document.body.appendChild(popup);
  setTimeout(() => {
    document.body.removeChild(popup);
  }, 2500);
}

// if module is defined, export the AntimonyWrapper class
if (typeof module !== 'undefined') {
  module.exports = {getModel, searchModels};
}