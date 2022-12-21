

import sys
import re

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
INT      = 'INT'
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
    (r'and',                   RESERVED),
    (r'or',                    RESERVED),
    (r'not',                   RESERVED),
    (r'if',                    RESERVED),
    (r'then',                  RESERVED),
    (r'else',                  RESERVED),
    (r'while',                 RESERVED),
    (r'do',                    RESERVED),
    (r'end',                   RESERVED),
    (r'[0-9]+',                INT),
    (r'[A-Za-z][A-Za-z0-9_]*', ID),
]

def call_lexer(characters):
    return lex(characters, token_exprs)


# Binary Tree in Python

class Node:
    def __init__(self, key):
        self.left = None
        self.right = None
        self.val = key
        #self.mathml = ''

    # Traverse preorder
    def traversePreOrder(self):
        mathml = ''
        if self.val == '+':
           mathml += '<apply> <plus/>' 
        if self.val == '-':
           mathml += '<apply> <minus/>' 
        if self.val == '*':
           mathml += '<apply> <times/>' 
        if self.val == '/':
           mathml += '<apply> <divide/>' 
           
        if not (self.val in ['+', '-', '*', '/']):
           mathml = mathml + '<ci>' + self.val + '</ci>'
            
        print(self.val, end=' ')
        
        if self.left:
            mathml += self.left.traversePreOrder()
        if self.right:
            mathml += self.right.traversePreOrder()
        if self.val in ['+', '-', '*', '/']:
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
        self.tokens = call_lexer(infix)
        
    def nextToken(self):
        if self.tokenPtr >= len (self.tokens):
            self.token = [0, 'None']
        else:   
            self.token = self.tokens[self.tokenPtr]
            self.tokenPtr += 1
    
    def factor (self):
        if self.token[1] == 'ID':
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

    def term (self):
        n1 = self.factor()
        while self.token[0] in ['*', '/']:
            op = self.token[0]
            self.nextToken()
            n2 = self.factor()
            n3 = Node (op)   
            n3.left = n1
            n3.right = n2
            n1 = n3
        return n1
                   
    def expression(self):
        n1 = self.term()
        #print ('n1 = ', n1.val)
        while self.token[0] in ['+', '-']:
            op = self.token[0]
            self.nextToken()
            n2 = self.term()
            n3 = Node (op)   
            n3.left = n1
            n3.right = n2
            n1 = n3      
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
        self.parameterList = []
        
    def addToSpeciesList(self, id):
        if not (id in self.speciesList):
           self.speciesList.append (id)
        
    def my_split(self, s, seps):
        res = [s]
        for sep in seps:
            s, res = res, []
            for seq in s:
                res += seq.split(sep)
        return res
        
    def makeSpecies (self, id):
        astr = ''
        astr = astr + '<species compartment="comp" '
        astr = astr + "id=\"" + id + '\" '
        astr += ' initialConcentration="1"'
        astr += ' hasOnlySubstanceUnits="false" substanceUnits="mole"'
        astr += ' constant="false" boundaryCondition="false"'
        astr = astr + '/>' + '\n'
        return astr

    def getSBML(self):
        lines = self.antStr.split('\n')
        #print (lines)
        for indx3, line in enumerate(lines):
            line = line.strip()
            # Separate reaction from kinetic law
            P1 = line.split (';')
            #print ('P1 =', P1)
            if ':' in P1[0]:
                rn = line.split(':')
                #print ('rn = ', rn)
                reactionId = rn[0].strip()
                P1[0] = rn[1]
            else:
                reactionId = '_J' + str (indx3)
                
            P2 = P1[0].split ('->')
            reactants = P2[0].split ('+')
            products = P2[1].split ('+')
    
            expression = P1[1].strip()
        
            for idx, r in enumerate(reactants):
                reactants[idx] = r.strip ()
            for idx, r in enumerate(reactants):
                if r[0].isdigit():
                   reactants[idx] = r.split (' ')
                else:
                   reactants[idx] = [1, reactants[idx]]
                self.addToSpeciesList (reactants[idx][1])
           
            for idx, r in enumerate(products):
                products[idx] = r.strip ()
            for idx, r in enumerate(products):
                if r[0].isdigit():
                   products[idx] = r.split (' ')
                else:
                   products[idx] = [1, products[idx]]
                self.addToSpeciesList (products[idx][1])
               
            # Get the parameter list
            terms = self.my_split(expression, '+/-*()')
            for s in terms:
                if not (s in self.speciesList):
                    self.parameterList.append (s)
    
            #print (reactants)
            #print (products)
            #print (expression)
            
            self.reactions.append ({'reactionId': reactionId, 
                                    'reactants' : reactants, 
                                    'products' : products, 
                                    'expression': expression})
    
        self.sbmlStr += '<listOfSpecies>' + '\n'
        astr = ''
        for id in self.speciesList:
            astr = astr + self.makeSpecies(id)
            
        self.sbmlStr += astr
        self.sbmlStr += '</listOfSpecies>' + '\n'
            
        self.sbmlStr += '<listOfParameters>' + '\n'
        for p in self.parameterList:
            self.sbmlStr += '<parameter id="' + p + '" value = "0.0" units="dimensionless" constant="true"/>' + '\n'
             
        self.sbmlStr += '</listOfParameters>' + '\n'
            
        self.sbmlStr += '<listOfReactions>' + '\n'
            
        astr = ''
        for idx1, r in enumerate (self.reactions):
            print ('r = ', r)
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
            
            astr += '<kineticLaw>' + '\n'
            p = InfixToMathML(r['expression'])
            astr += p.getMathML () + '\n'
            astr += '</kineticLaw>' + '\n'
            astr += '</reaction>' + '\n'
            
        self.sbmlStr += astr + '</listOfReactions>' + '\n'
    
        self.sbmlStr = self.sbmlStr + self.trailer
        return self.sbmlStr


