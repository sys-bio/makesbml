# Create a json file containing Biomodels information to speed up search of Biomodels for MakeSBML.
# Need following package:
# pip install biomodels-restful-api-client 
# Ref: https://bitbucket.org/biomodels/biomodels-resftful-api-client/src/main/ 

# 'python getBiomodelsInfo.py'

import json
import re
from biomodels_restful_api_client import services as bmservices

def remove_html_tags(text):
    """Remove html tags from a string"""
    import re
    clean = re.compile('<.*?>')
    return re.sub(clean, '', text)


totalModels = 2000
i = 0
modelIdentifiers = bmservices.get_model_identifiers()
models = modelIdentifiers["models"]
modelResults = {}
for nModel in models:
  if i < totalModels :
    result = bmservices.get_model_info(nModel) 
    if 'publicationId' in result:
      modelNumber = result['publicationId']
      if "BIOMD" in modelNumber:  # Only keep models with BIOMD number (curated model)
        for key in result:
          if key == "description":   
            result[key] = remove_html_tags(result[key]) 
           #print(result[key])
        i+=1
    #modelResults['model_'+ str(i)]= result
        modelResults[modelNumber]= result

#print(modelResults)
with open('biomodelsinfo.json', 'w') as json_file:
  json.dump(modelResults, json_file)