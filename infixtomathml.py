# Created on Mon Dec 19 13:25:22 2022
# author: hsauro

import sys
import re

debugPy = True

def lex(characters, token_exprs):
    pos = 0
    tokens = []
    while pos < len(characters):
        match = None
        for token_expr in token_exprs:
            pattern, tag = token_expr
            regex = re.compile(pattern)
            match = regex.match(characters, pos)
            if match:
                text = match.group(0)
                if tag:
                    token = (text, tag)
                    tokens.append(token)
                break
        if not match:
            sys.stderr.write('Illegal character: %s\n' % characters[pos])
            sys.exit(1)
        else:
            pos = match.end(0)
    return tokens

RESERVED = 'RESERVED'
FLOAT    = 'FLOAT'
ID       = 'ID'

token_exprs = [
    (r'[ \n\t]+',              None),
    (r'#[^\n]*',               None),
    (r'\:=',                   RESERVED),
    (r'\(',                    RESERVED),
    (r'\)',                    RESERVED),
    (r';',                     RESERVED),
    (r'\+',                    RESERVED),
    (r'-',                     RESERVED),
    (r'\*',                    RESERVED),
    (r'/',                     RESERVED),
    (r'<=',                    RESERVED),
    (r'<',                     RESERVED),
    (r'>=',                    RESERVED),
    (r'>',                     RESERVED),
    (r'!=',                    RESERVED),
    (r'=',                     RESERVED),
    (r'\^',                    RESERVED),
    (r'and',                   RESERVED),
    (r'or',                    RESERVED),
    (r'not',                   RESERVED),
    (r'end',                   RESERVED),
    (r'[-+]?(\d+(\.\d*)?|\.\d+)([eE][-+]?\d+)?',  FLOAT),
    #(r'[0-9]+',                INT),
    (r'[A-Za-z][A-Za-z0-9_]*', ID),
]

def lexer(characters):
    return lex(characters, token_exprs)

functionList = ['sin', 'cos']
        

# Binary Tree in Python

INT_TYPE = 0
FLOAT_TYPE = 1
STRING_TYPE = 2
OP_TYPE = 3

class Node:
    def __init__(self, key, nodeType=OP_TYPE, left=None, right=None):
        self.left = left
        self.right = right
        self.val = key
        self.nodeType = nodeType
        self.intValue = '0'
        self.floatValue = '0.0'

    # Traverse preorder
    def traversePreOrder(self):
        mathml = ''
        
        if debugPy:
           print(self.val, end=' ')
        
        if self.val in functionList:
           mathml += '<apply> <' + self.val + '/>'
           mathml += self.left.traversePreOrder()
           mathml += '</apply>'
           return mathml
       
        # if self.nodeType == INT_TYPE:
        #    mathml = '<cn type="integer"> ' + self.val + ' </cn>'
        #    return mathml
        
        if self.nodeType == FLOAT_TYPE:
           mathml = '<cn> ' + self.val + ' </cn>'
           return mathml
       
        if self.val == 'u':
           mathml += '<apply> <minus/>'  
           mathml += self.left.traversePreOrder()
           mathml += '</apply>'          
           return mathml        
                  
        if self.val == '+':
           mathml += '<apply> <plus/>' 
        if self.val == '-':
           mathml += '<apply> <minus/>' 
        if self.val == '*':
           mathml += '<apply> <times/>' 
        if self.val == '/':
           mathml += '<apply> <divide/>' 
        if self.val == '^':
           mathml += '<apply> <power/>' 
       
        if not (self.val in ['+', '-', '*', '/', '^']):
           mathml += '<ci>' + self.val + '</ci>'
                            
        if self.left:
            mathml += self.left.traversePreOrder()
        if self.right:
            mathml += self.right.traversePreOrder()
            
        if self.val in ['+', '-', '*', '/', '^']:
           mathml += '</apply>'
        return mathml

    # Traverse inorder
    def traverseInOrder(self):
        if self.left:
            self.left.traverseInOrder()
        print(self.val, end=' ')
        if self.right:
            self.right.traverseInOrder()

    # Traverse postorder
    def traversePostOrder(self):
        if self.left:
            self.left.traversePostOrder()
        if self.right:
            self.right.traversePostOrder()
        print(self.val, end=' ')

class InfixToMathML:
    def __init__(self, infix):
        self.tokenPtr = 0
        self.token = None
        self.tokens = lexer(infix)
        
    def nextToken(self):
        if self.tokenPtr >= len (self.tokens):
            self.token = [0, 'None']
        else:   
            self.token = self.tokens[self.tokenPtr]
            self.tokenPtr += 1
    
    def factor (self):
        if self.token[1] == 'ID':
            if self.token[0] in functionList:
               fnName = self.token[0]
               self.nextToken()
               if self.token[0] == '(':
                  self.nextToken()
                  fn = self.expression()
                  if self.token[0] != ')':
                    raise Exception ('Expecting right parenthesis for start of function call')
                  #self.nextToken() 
                  n = Node (fnName)
                  n.left = fn
               else:
                   raise Exception ('Expecting left parenthesis for start of function call')
            else:
               n = Node(self.token[0])
            self.nextToken()
            return n
        
        if self.token[0] == '(':
            self.nextToken()
            n = self.expression()
    
            if self.token[0] != ')':
                raise Exception ('Missing right parenthesis')
            self.nextToken()
            return n
        
        # if self.token[1] == INT:
        #    n = Node (self.token[0], INT_TYPE) 
        #    self.nextToken()
        #    return n

        if self.token[1] == FLOAT:
           n = Node (self.token[0], nodeType=FLOAT_TYPE) 
           self.nextToken()
           return n
       
    def power (self):
        asign = 1
        unaryCount = 0
        while (self.token[0] == '-') or (self.token[0] == '+'):
            if self.token[0] == '-':
               asign = -1*asign
               unaryCount = unaryCount + 1
            self.nextToken()
        
        leftNode = self.factor()
        powerNode = None
        if self.token[0] == '^':
           self.nextToken()            
           rightNode = self.power()
           leftNode = Node ('^', left=leftNode, right=rightNode)

        if unaryCount > 0:              
           leftNode = Node ('u', left=leftNode) 
           
        return leftNode          
        
    def term (self):
        n1 = self.power()
        while self.token[0] in ['*', '/']:
            op = self.token[0]
            self.nextToken()
            n2 = self.power()
            n3 = Node (op)   
            n3.left = n1
            n3.right = n2
            n1 = n3
        return n1
                   
    def expression(self):
        n1 = self.term()
        while self.token[0] in ['+', '-']:
            op = self.token[0]
            self.nextToken()
            n2 = self.term()
            n3 = Node (op)   
            n3.left = n1
            n3.right = n2
            n1 = n3     
        if self.token[0] == '(':
            raise Exception('Unrecognised function call')
        return n1
        
    def stmt (self):
        return self.expression()   

    def parse (self):
        self.nextToken()
        return self.stmt ()
    
    def getMathML (self):
        tree = self.parse ()
        mathml = '<math xmlns="http://www.w3.org/1998/Math/MathML">' + '\n'
        m = tree.traversePreOrder()
        mathml += m + '\n' + '</math>'
        return mathml

# p = InfixToMathML('Vm*S1^n/(Km + S1)^n')

# print ('Parsing')
# try:   
#   mathml = p.getMathML ()
# except Exception as e:
#   print (e)  
      
# print()
# print (mathml)

def createSpecies (id, boundary, value):
    return {'id': id, 'boundary': boundary, 'value': value}
    
# Split string into num, word
# If no num present then splits into 1, word
def splitNumWord(s):
    tail = s.lstrip('0123456789')
    tail = tail.strip()
    head = s[:len(s)-len(tail)]
    head = head.strip()
    if head == '':
       return '1', tail
    else:
       return head, tail

class antToSbml:
    def __init__(self, antStr):
        self.antStr = antStr
    
        self.reactions = []

        self.header = '<?xml version="1.0" encoding="UTF-8"?>' + '\n' 
        self.header += '<sbml xmlns="http://www.sbml.org/sbml/level3/version1/core" level="3" version="1">' + '\n'
        self.header += '<model extentUnits="mole" timeUnits="second">' + '\n'
        
        self.trailer = '</model>' + '\n'
        self.trailer += '</sbml>'

        self.header += '<listOfUnitDefinitions>' + '\n'
        self.header += '<unitDefinition id="per_second">' + '\n'
        self.header += '<listOfUnits>' + '\n'
        self.header += '<unit kind="second" exponent="-1" scale="0" multiplier="1"/>' + '\n'
        self.header += '</listOfUnits>' + '\n'
        self.header += '</unitDefinition>' + '\n'
        self.header += '<unitDefinition id="litre_per_mole_second">' + '\n'
        self.header += '<listOfUnits>' + '\n'
        self.header += '<unit kind="mole" exponent="-1" scale="0" multiplier="1"/>' + '\n'
        self.header += '<unit kind="litre" exponent="1" scale="0" multiplier="1"/>' + '\n'
        self.header += '<unit kind="second" exponent="-1" scale="0" multiplier="1"/>' + '\n'
        self.header += '</listOfUnits>' + '\n'
        self.header += '</unitDefinition>' + '\n'
        self.header += '</listOfUnitDefinitions>' + '\n'

        self.compartment = '<listOfCompartments>' + '\n'
        self.compartment += '<compartment id="comp" size="1" spatialDimensions="3" units="litre" constant="true"/>' + '\n'
        self.compartment += '</listOfCompartments>' + '\n'

        self.sbmlStr = self.header + self.compartment

        self.speciesList = []
        
    def addToSpeciesList(self, species):
        if not (species[1] in self.speciesList):
            self.speciesList.append (createSpecies(species[1], species[2], 0.0))
        
    def my_split(self, s, seps):
        res = [s]
        for sep in seps:
            s, res = res, []
            for seq in s:
                res += seq.split(sep)
        return res
        
    def makeSpecies (self, species):
        astr = ''
        astr = astr + '<species compartment="comp" '
        astr = astr + "id=\"" + species['id'] + '\" '
        astr += ' initialConcentration="' + str (species['value']) + '"'
        astr += ' hasOnlySubstanceUnits="false" substanceUnits="mole"'
        astr += ' constant="false" boundaryCondition="' + str (species['boundary']).lower() + '"'
        astr = astr + '/>' + '\n'
        return astr

    def getSBML(self):
        lines = self.antStr.split('\n')
        if debugPy:
           print ('lines =', lines)
        parameterList = []     
        for indx3, line in enumerate(lines):
            line = line.strip()
            if debugPy:
               print ('line =', line) 
            if line != '':
                # Separate reaction from kinetic law
                P1 = line.split (';')
                if debugPy:
                   print ('P1 =', P1)
                if ':' in P1[0]:
                    rn = line.split(':')
                    reactionId = rn[0].strip()
                    P1[0] = rn[1]
                else:
                    reactionId = '_J' + str (indx3)
                    
                P2 = P1[0].split ('->')
                reactants = P2[0].split ('+')
                products = P2[1].split ('+')
                
                if debugPy:
                    print ('reactants =', reactants)
                    print ('products =', products)
        
                expression = P1[1].strip()
                expression = P1[1].replace (' ', '')
            
                # Strip any spaces from reactants list
                for idx, r in enumerate(reactants):
                    reactants[idx] = r.strip ()
                    
                # reactants = [stoich, id, boudarycondition]
                for idx, r in enumerate(reactants):
                    nw = splitNumWord (r)
                    reactants[idx] = [nw[0], nw[1], False]
                    # Check for boundary condition
                    if reactants[idx][1][0] == '$':
                        reactants[idx][2] = True
                        # Remove the $
                        reactants[idx][1] = reactants[idx][1][1:]
                    self.addToSpeciesList (reactants[idx])
               
                # Strip any spaces from products list
                for idx, r in enumerate(products):
                    products[idx] = r.strip ()
                    
                for idx, r in enumerate(products):
                    nw = splitNumWord (r)
                    products[idx] = [nw[0], nw[1], False]
                    # Check for boundary condition
                    if products[idx][1][0] == '$':
                        products[idx][2] = True
                        # Remove the $
                        products[idx][1] = products[idx][1][1:]                       
                    self.addToSpeciesList (products[idx])
                   
                # Construct the parameter list
                terms = self.my_split(expression, '+/-*()^')
                # Stip out species, blanks and numbers and duplicates
                # Pull out the species names for convenience
                spIds = []
                for s in self.speciesList:
                    spIds.append (s['id'])
                for s in terms:
                    if not (s in spIds):
                        if s != '':
                           if not s[0].isdigit():  
                              if not (s in parameterList):
                                 if not (s in functionList):
                                    parameterList.append (s)
                                                                           
                if debugPy:
                   print (reactants)
                   print (products)
                   print (expression)
                
                self.reactions.append ({'reactionId': reactionId, 
                                        'reactants' : reactants, 
                                        'products' : products, 
                                        'expression': expression,
                                        'parameterList': parameterList})
    
        if debugPy:
           print ('sp list = ', self.speciesList)
           print ('parameter list = ', parameterList)
           
        self.sbmlStr += '<listOfSpecies>' + '\n'
        astr = ''
        for species in self.speciesList:
            astr = astr + self.makeSpecies(species)
            
        self.sbmlStr += astr
        self.sbmlStr += '</listOfSpecies>' + '\n'
            
        self.sbmlStr += '<listOfParameters>' + '\n'
        for p in parameterList:
            self.sbmlStr += '<parameter id="' + p + '" value = "0.0" units="dimensionless" constant="true"/>' + '\n'
             
        self.sbmlStr += '</listOfParameters>' + '\n'
            
        self.sbmlStr += '<listOfReactions>' + '\n'
        astr = ''
        for idx1, r in enumerate (self.reactions):
            rid = 'J' + str (idx1)
            astr = astr + '<reaction id="' + r['reactionId'] + '"'
            astr = astr + ' reversible="true" fast="false">' + '\n'
            astr = astr + '<listOfReactants>' + '\n'
            for idx2, rt in enumerate (r['reactants']):
                astr = astr + '<speciesReference species="'
                astr = astr + rt[1] + '" stoichiometry="'
                astr += str (rt[0]) + '" constant="true"/>' + '\n'   
            astr = astr + '</listOfReactants>' + '\n' 
                
            astr = astr + '<listOfProducts>' + '\n'
            for idx2, rt in enumerate (r['products']):
                astr = astr + '<speciesReference species="'
                astr = astr + rt[1] + '" stoichiometry="'
                astr += str (rt[0]) + '" constant="true"/>' + '\n'   
            astr = astr + '</listOfProducts>' + '\n'  
            
            # Figure out modifiers
            # construct two lists:
            # 1. List of reactants in products in current reaction
            # 2. List of species in the kinetic law
            # Any symbols in list 2 not found in list 1 are modifiers
            localSpecies = []
            for rt in r['reactants']:
                localSpecies.append (rt[1])
            for rt in r['products']:
                localSpecies.append (rt[1]) 
            
            localSymbols = []
            symbols = self.my_split(r['expression'], '+/-*()^')
            # List of species only found in kinetic law
            for s in symbols:
                if s != '':
                   if not s[0].isdigit():
                      if not (s in parameterList):
                         if not (s in functionList):
                            localSymbols.append (s)
         
            # Check if there are modifiers
            modifiers = False
            for ls in localSymbols:
                if not (ls in localSpecies):
                    modifiers = True
                    
            if modifiers:
               astr += '<listOfModifiers>' + '\n'
               for ls in localSymbols:
                   if not (ls in localSpecies):
                      astr += '<modifierSpeciesReference species="'
                      astr += ls
                      astr += '"/>' + '\n'
               astr += '</listOfModifiers>' + '\n'           
           
            astr += '<kineticLaw>' + '\n'
            p = InfixToMathML(r['expression'])
            astr += p.getMathML () + '\n'
            astr += '</kineticLaw>' + '\n'
            astr += '</reaction>' + '\n'
            
        self.sbmlStr += astr + '</listOfReactions>' + '\n'
    
        self.sbmlStr = self.sbmlStr + self.trailer
        return self.sbmlStr
