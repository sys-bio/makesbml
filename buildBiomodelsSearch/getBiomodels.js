// Depends on sbml model files in a github repository

import { Octokit, App } from "https://esm.sh/octokit"; //IMported in index.html

const github_owner = "sys-bio";
const github_repo = "BiomodelsStore";

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
