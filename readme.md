# makeSBML website

Use the following url to try out the makeSBML site:

https://sys-bio.github.io/makesbml/

This repository hosts the website used to convert Antimony models to SBML (Systems Biology Markup Language) models and vice-versa.

Antimony (https://github.com/sys-bio/antimony). Antimony is a modular model definition language used in Systems Biology for modeling chemical networks. Please see https://sbml.org for more information on SBML .  

To deploy on your own website just copy the project into a subdirectory of your website. index.html is the landing page, example: http://mysite.com/mysubdir/makesbml/index.html 

Project structure
- `root` directory: contains this file, index.html, style.css, main.js, and LICENSE files. main.js contains the main code for processing sbml and antimony model files and the BioModels (https://www.ebi.ac.uk/biomodels/) search and download functions.
- `docs` directory: documentation (none currently)
- `antimony` directory: contains libantimony.js library.
- `buildBiomodelsSearch` directory: Contains python script that generates a json file of BioModels search information (cached_biomodels.json) which is used as a cache to speed up the search of the Biomodels repository. Contains a javascript file to access the BioModels cache in github repository: https://github.com/sys-bio/BiomodelsStore.   

## Antimony javascript library
This website loads a module consisting of a javascript wrapper of a Web Assembly library (.wasm) that translates Antimony to SBML and vice-versa. These two files are merged into the libantimony.js library. 
Please see the libantimonyjs git hub site ( https://github.com/sys-bio/libantimonyjs ) for information on using, building or modifying the libantimony.js file used on this site.

## Cite MakeSBML:
Jardine BE, Smith LP, Sauro HM. MakeSBML: a tool for converting between Antimony and SBML. J Integr Bioinform. 2024 Jun 11;21(1):20240002. doi: 10.1515/jib-2024-0002. PMID: 38860571; PMCID: PMC11294058 (https://www.degruyter.com/document/doi/10.1515/jib-2024-0002/html).

