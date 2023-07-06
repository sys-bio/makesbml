# MakeSBML website

Use the following url to try out the makeSBML site:

https://sys-bio.github.io/makesbml/

This repository hosts the website used to convert Antimony models to SBML (Systems Biology Markup Language) models and vice-versa.

Antimony (https://github.com/sys-bio/antimony). Antimony is a modular model definition language used in Systems Biology for modeling chemical networks. Please see https://sbml.org for more information on SBML .  


Project structure
- `docs` directory: documentation (none currently)
- `antimony` directory: contains libantimony.js and libantimony.wasm files.
- `test` directory: Test models and test web page. Currently unused.
- `src` directory: Any files needed to build web site (main files, index and style are at the top level, so src directory),
- others, as needed. 

## Antimony javascript library
This website loads a module consisting of a javascript wrapper of a Web Assembly library (.wasm) that translates Antimoy to SBML and vice-versa. These two files are libantimony.js and libantimony.wasm. 
Please see the libantmonyjs git hub site ( https://github.com/sys-bio/libantimonyjs ) for information on using, building or modifying libantimony.js and libantimony.wasm files for use on this site.
