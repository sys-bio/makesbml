# makeSBML website

Use the following url to try out the makeSBML site:

https://sys-bio.github.io/makesbml/

This repository hosts the website used to convert Antimony models to SBML (Systems Biology Markup Language) models and vice-versa.

Antimony (https://github.com/sys-bio/antimony). Antimony is a modular model definition language used in Systems Biology for modeling chemical networks. Please see https://sbml.org for more information on SBML .  


Project structure
- `root` directory: contains this file, index.html, style.css, main.js, and LICENSE files. main.js contains the main code for processing sbml and antimony model files and the Biomodels search and download functions.
- `docs` directory: documentation (none currently)
- `antimony` directory: contains libantimony.js and libantimony.wasm files.
- `buildBiomodelsSearch` directory: Contains python script that generates a json file of BioModels search information (biomodelsinfo.json) which is used as a cache to speed up the search of the Biomodels repository. 

## Antimony javascript library
This website loads a module consisting of a javascript wrapper of a Web Assembly library (.wasm) that translates Antimony to SBML and vice-versa. These two files are libantimony.js and libantimony.wasm. 
Please see the libantimonyjs git hub site ( https://github.com/sys-bio/libantimonyjs ) for information on using, building or modifying libantimony.js and libantimony.wasm files for use on this site.
