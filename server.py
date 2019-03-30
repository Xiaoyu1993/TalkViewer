from flask import Flask, request, render_template, jsonify
import random as r
import math as m
import json

import csv
import re
import spacy
from spacy import displacy

import urllib
#from owlready2 import *
from rdflib import Graph
from SPARQLWrapper import SPARQLWrapper, JSON

import re
import xml.etree.ElementTree as ET

#from allennlp.common.testing import AllenNlpTestCase
#from allennlp.predictors.predictor import Predictor

# pre-processing
def PreProcess(senSet):
    #remove content between [ ]
    print("Pre-processing...")
    for index in range(len(senSet)):
        while senSet[index].find('[')>=0:
            i_start = senSet[index].find('[')
            i_end = senSet[index].find(']')
            s = senSet[index][i_start:i_end+2]
            senSet[index] = senSet[index].replace(s, "")
            
# stopwords from parsing the whole sentence
def RemoveStopword1(phrase, doc, chunkStart, chunkEnd, stopList):
    result = phrase
    i_stop=0
    #start = chunk.start# to eliminate the condition when the first word of chunk is stop word
    for i_sen in range(chunkStart, chunkEnd):
        while i_stop < len(stopList) and stopList[i_stop] < i_sen-1:
            #print(str(stopList[i_stop]) + ' ' + str(i_sen))
            i_stop = i_stop+1
        # there is no stop word in current chunk
        if i_stop >= len(stopList):
            break
        #print(i_sen)
        # finish going through the chunk
        if stopList[i_stop] > chunkEnd-1:
            break
        # find the stop word and remove it
        if stopList[i_stop] == i_sen-1:
            #print(doc[i_sen-1])
            if i_sen-1 == chunkStart:
                result = result.replace(doc[i_sen-1].text + ' ', '')
                chunkStart = chunkStart+1
            else:
                result = result.replace(' ' + doc[i_sen-1].text, '')
    return result

# stopwords from parsing triple separately
def RemoveStopword2(inputPhrase):
    result = ''
    doc_phrase = nlp(str(inputPhrase))
    for token in doc_phrase:
        #print(token.text, token.lemma_, token.pos_, token.tag_, token.dep_,
        #       token.shape_, token.is_alpha, token.is_stop)
        if not token.is_stop:
            result = result + token.text + ' '
        #else:
        #    print(token.text + ', ', end = '')    
    return result


# extract one triple from given sentence
def ExtractTriple(sen, index=0):
    # initialize the triple and stop word list
    subj = ""
    pred = ""
    obj = ""
    stopList = []
    
    # parse sentence
    doc = nlp(str(sen))
    print('\n' + str(index) + '. Original Sentence:\n' + sen)
    
    ## visualize the semantic tree
    #options = {'compact': True, 'color': 'blue'}
    #displacy.serve(doc, style='dep', options=options)
    #displacy.serve(doc, style='dep')

    print('\nStopwords:')
    for token in doc:
        #print(token.text, token.lemma_, token.pos_, token.tag_, token.dep_,
        #      token.shape_, token.is_alpha, token.is_stop)

        # record the index of stop words
        if token.is_stop:
            print(token.text + ', ', end='')
            stopList.append(token.i)
        if re.match('nsubj', token.dep_):   
            subj = token.text
        if re.match('ROOT', token.dep_): 
            pred = token.lemma_
            pred_orig = token.text
        if re.match('dobj', token.dep_): 
            obj = token.text
            '''#an earlier solution that I find not necessary
            obj = token.lemma_
            # to avoid cases like "-PRON-"
            if obj[0] == '-':
                obj = token.text'''
    print('\n')

    subj_1 = subj
    obj_1 = obj
    # using chunk to update subject and object
    for chunk in doc.noun_chunks:
        if chunk.root.head.text == pred_orig and re.match('nsubj', chunk.root.dep_):
            subj = chunk.text
            # remove stop words
            subj_1 = RemoveStopword1(subj, doc, chunk.start, chunk.end, stopList)

        if chunk.root.head.text == pred_orig and re.match('dobj|attr', chunk.root.dep_):
            obj = chunk.text
            # remove stop words
            obj_1 = RemoveStopword1(obj, doc, chunk.start, chunk.end, stopList)
        #print(chunk.text + ' ' + str(chunk.start))
        #print(chunk.text, chunk.root.text, chunk.root.dep_, chunk.root.head.text)

    #print('Before : ' + subj + ' - ' + pred + ' - ' + obj)
    #print('Method1: ' + subj_1 + ' - ' + pred + ' - ' + obj_1)

    # second method to remove stop words
    subj_2 = RemoveStopword2(subj)
    obj_2 = RemoveStopword2(obj)
    #print('Method2: ' + subj_2 + '- ' + pred + ' - ' + obj_2 + '\n')

    return [subj, pred, obj]

def QueryURI(keywords, index=-2):
    localSite = 'http://localhost:1111/api/search/KeywordSearch?'
    onlineSite = 'http://lookup.dbpedia.org/api/search/KeywordSearch?'
    prefix = "{http://lookup.dbpedia.org/}"
    
    keywords = keywords.replace(' ', "%20")
    request = onlineSite + \
    'QueryClass='   + ''  + \
    '&MaxHits='     + '5' + \
    '&QueryString=' + keywords
    response = str(urllib.request.urlopen(request).read(), 'utf-8')

    root = ET.fromstring(response)
    result = root.findall(prefix + "Result")
    
    options = []
    if len(result)>0:
        selected = -1
        count = 0
        for name in result:
            options.append("<" + name.find(prefix + "URI").text + ">")
            print(options[count])
            count += 1
        # for some default input during debugging
        '''if index<-1:
            index = int(input("Which one is closer to what you mean? (type \"-1\" if nothing seems correct) "))
        if index >= 0:
            selected = "<" + result[index].find(prefix + "URI").text + ">"
        else:
            selected = None'''
        return options
    else:
        print("Sorry, we find nothing for this stuff :(\n")
        return None

# transfer a phrase to a URI form
def FormatURI(phrase, isS_O = False):
    #print('Before formatting:  ' + phrase)
    chars = list(phrase)
    
    if len(chars) > 0 and not isS_O:
        chars[0] = chars[0].upper()
    for i in range(len(chars)):
        if chars[i] == ' ' and i+1 < len(chars):
            chars[i+1] = chars[i+1].upper()
    phrase = ''.join(chars)
    phrase = phrase.replace(' ', '')
    phrase = re.sub(r'[^a-zA-Z0-9\s]', '', phrase)
    #print('After formatting:  ' + phrase)
    return phrase

# transfer a phrase to a URI form
def NameURI(url):
    index_slash = 0
    for i in range(len(url)-1, -1, -1):
        if url[i] == '/':
            index_slash = i+1
            break
    return url[index_slash:]

# query the given triple in the ontology with SPARQL
# return true/false as result
def QueryTriple(subj, pred, obj):
    if subj==None or pred==None or obj==None:
        return None
    else:
        prefix = """
        PREFIX rdf:<http://www.w3.org/2000/01/rdf-schema#>
        PREFIX dbpd:<http://dbpedia.org/ontology/>
        """
        #subj = "provinceLink"
        #pred = "range"
        #obj = "Province"
        qSelect = prefix + """
        SELECT ?sub WHERE {
          ?sub rdf:""" + FormatURI(pred) + """ dbpd:""" + FormatURI(obj) + """.
        }"""
        qAsk = prefix + """
        ASK {
            dbpd:""" + FormatURI(subj) + """ rdf:""" + FormatURI(pred) + """ dbpd:""" + FormatURI(obj) + """.
        }"""

        r = list(m_graph.query(qAsk))
        return r

def ComponentQuery1(subj, pred, obj):
    prefix = """
    PREFIX rdf:<http://www.w3.org/2000/01/rdf-schema#>
    PREFIX dbpd:<http://dbpedia.org/ontology/>
    """
    #subj = "provinceLink"
    #pred = "range"
    #obj = "province"
    
    r = []
    if subj!=None:
        qSelect_P_O = prefix + """
        SELECT ?pred ?obj WHERE {
          """ + subj + """ ?pred ?obj.
        }"""
        #r1 = m_graph.query(qSelect_P_O)
        sparql.setQuery(qSelect_P_O)
        r1 = sparql.query().convert()
        if r1 != None: # may need one more variable to record source
            r.append(r1)
        
    if pred!=None:
        qSelect_S_O = prefix + """
        SELECT ?sub ?obj WHERE {
          ?sub """ + pred + """ ?obj.
        }"""
        #r2 = m_graph.query(qSelect_S_O) 
        sparql.setQuery(qSelect_S_O)
        r2 = sparql.query().convert()
        if r2 != None: # may need one more variable to record source
            r.append(r2)
        
    if obj!=None:
        qSelect_S_P = prefix + """
        SELECT ?sub ?pred WHERE {
          ?sub ?pred """ + obj + """.
        }"""
        #r3 = m_graph.query(qSelect_S_P) 
        sparql.setQuery(qSelect_S_P)
        r3 = sparql.query().convert()
        if r3 != None: # may need one more variable to record source
            r.append(r3)

    #if r!=[]:
    #    print(r)
    PrintQueryResult(r)
    return r

def ComponentQuery2(subj, pred, obj):
    prefix = """
    PREFIX rdf:<http://www.w3.org/2000/01/rdf-schema#>
    PREFIX dbpd:<http://dbpedia.org/ontology/>
    """    
    
    r = []
    if pred!=None and obj!=None:
        qSelect_S = prefix + """
        SELECT ?sub WHERE {
          ?sub """ + pred + """ """ + obj + """.
        }"""
        
        #r1 = m_graph.query(qSelect_S) 
        sparql.setQuery(qSelect_S)
        r1 = sparql.query().convert()
        if r1 != None: # may need one more variable to record source
            r.append(r1)
        
    if subj!=None and obj!=None:
        qSelect_P = prefix + """
        SELECT ?pred WHERE {
          """ + subj + """ ?pred """ + obj + """.
        }"""
        
        #r2 = m_graph.query(qSelect_P)
        sparql.setQuery(qSelect_P)
        r2 = sparql.query().convert()
        if r2 != None: # may need one more variable to record source
            r.append(r2)
            
    if subj!=None and pred!=None:
        qSelect_O = prefix + """
        SELECT ?obj WHERE {
          """ + subj + """ """ + pred + """ ?obj.
        }"""
        
        #r3 = m_graph.query(qSelect_O)
        sparql.setQuery(qSelect_O)
        r3 = sparql.query().convert()
        if r3 != None: # may need one more variable to record source
            r.append(r3)
        
    #if r!=[]:
    #    print(r)
    #PrintQueryResult(r)
    return r

def ComponentQuery3(subj, pred, obj):
    if subj==None or pred==None or obj==None:
        return None
    else:
        prefix = """
        PREFIX rdf:<http://www.w3.org/2000/01/rdf-schema#>
        PREFIX dbpd:<http://dbpedia.org/ontology/>
        """
        #subj = "provinceLink"
        #pred = "range"
        #obj = "province"

        qAsk = prefix + """
        ASK {
            """ + subj + """ """ + pred + """ """ + obj + """.
        }"""
        #r = m_graph.query(qAsk)
        sparql.setQuery(qAsk)
        r = sparql.query().convert()

        #if not r:
        #    print(qAsk)
        #    print(r)
        
        return r["boolean"]

def PartialQuery(subj, pred, obj, subjURI, predURI, objURI):
    if subj==None and pred==None and obj==None:
        return None
    
    print("\n*********************** In Partial Query *************************")
    doc_subj = nlp(str(subj))
    doc_pred = nlp(str(pred))
    doc_obj = nlp(str(obj))
    r1 = []
    r2 = []
    r3 = False
    
    for token_subj in doc_subj:
        # get the URI for partial subj
        if len(doc_subj)>1:
            print("\nFor partial subject \"" + token_subj.text + "\":")
            part_subj = QueryURI(token_subj.text)
        else:
            part_subj = subjURI
            
        for token_pred in doc_pred:
            # get the URI for partial pred
            if len(doc_pred)>1:
                print("\nFor partial predicate \"" + token_pred.text + "\":")
                part_pred = QueryURI(token_pred.text)
            else:
                part_pred = predURI
                
            for token_obj in doc_obj:
                #print(token_obj.text, token_obj.lemma_, token_obj.pos_, token_obj.tag_, token_obj.dep_,
                #      token_obj.shape_, token_obj.is_alpha, token_obj.is_stop)
                if token_subj.is_stop and token_pred.is_stop and token_obj.is_stop:
                    continue
                    
                # get the URI for partial obj
                if len(doc_obj)>1:
                    print("\nFor partial object \"" + token_obj.text + "\":")
                    part_obj = QueryURI(token_obj.text)
                else:
                    part_obj = objURI

                r1 = ComponentQuery1(part_subj, part_pred, part_obj)
                #print(r1)
                if r1 and len(r1)>0:
                    r2 = ComponentQuery2(part_subj, part_pred, part_obj)
                    if r2 and len(r2)>0:
                        r3 = ComponentQuery3(part_subj, part_pred, part_obj)
                        if r3:
                            print("\nFind triple with 3 components:")
                            print(part_subj + " - " + part_pred + " - " + part_obj)
                            break
                        else:
                            print("\nFind triple with 2 components:")
                            PrintQueryResult(r2)
                            #print(r2)
                    else:
                        print("\nFind triple with 1 components:")
                        PrintQueryResult(r1)
                        '''if part_subj != None:
                            print(part_subj[1:len(part_subj)-1])
                        if part_pred != None:
                            print(part_pred[1:len(part_pred)-1])
                        if part_obj != None:
                            print(part_obj[1:len(part_obj)-1])'''
                        
    return len(r1)>0 or len(r2)>0 or r3

def PrintQueryResult(results):
    # for sparqlWrapper
    for group in results:
        print(group)
        for result in group["results"]["bindings"]:
            print('( ', end='')
            if "sub" in result:
                print(NameURI(result["sub"]["value"]) + ' - ', end='')
            else:
                print('* -', end='')
            if "pred" in result:
                print(NameURI(result["pred"]["value"]) + ' - ', end='')
            else:
                print('* -', end='')
            if "obj" in result:
                print(NameURI(result["obj"]["value"]), end='')
            else:
                print('* )\n', end='')

def GetQueryResult(results):
    # for sparqlWrapper
    return results
    queryResult = ''
    for group in results:
        print(group)
        for result in group["results"]["bindings"]:
            queryResult += '( '
            if "sub" in result:
                queryResult += NameURI(result["sub"]["value"]) + ' - '
            else:
                queryResult += '* -'
            if "pred" in result:
                queryResult += NameURI(result["pred"]["value"]) + ' - '
            else:
                queryResult += '* -'
            if "obj" in result:
                queryResult += NameURI(result["obj"]["value"])
            else:
                queryResult += '* )'
    print(queryResult)
    return queryResult
 
# load Spacy NLP dictionary
nlp = spacy.load('en_core_web_sm')

# load DBPD ontology and construct graph for query
#m_world = World()# Owlready2 stores every triples in a ‘World’ object
#m_onto = m_world.get_ontology("./server_resource/dbpedia.owl").load()
#m_graph = m_world.as_rdflib_graph()
#sparql = SPARQLWrapper("./server_resource/dbpedia.owl")#http://dbpedia.org/sparql
sparql = SPARQLWrapper("http://dbpedia.org/sparql")
sparql.setReturnFormat(JSON)

def main_loop(sampleSentence=""): 
    # load data
    file = open("./server_resource/shortdataset.csv", "r")
    #file = open("./server_resource/newdataset_formatted.csv", "r")
    reader = csv.reader(file)
    senSet = []
    for item in reader:
        #format sentences in item as string
        fullP = "".join(item)
        splitP = fullP.split(";", 3)
        splitS = splitP[3][1:len(splitP[3])].split(".")
        #print(splitS)
        for sen in splitS:
            senSet.append(sen)#store the sentence into an array
    file.close()
    print("Total sentences: " + str(len(senSet)))

    # pre-processing
    PreProcess(senSet)

    # parse and query each sentence
    #for index in range(len(senSet)):
    index = 3
    #sampleSentence = "Nurses are females"

    # extract triple from current sentence
    [subj, pred, obj] = ExtractTriple(sampleSentence)
    #[subj, pred, obj] = ExtractTriple(senSet[index], index)
    print('Triple to Query: \n' + subj + ' - ' + pred + ' - ' + obj)

    # parse with AllenNLP
    '''from allennlp.predictors import Predictor
    predictor = Predictor.from_path("srl-model-2018.05.25.tar.gz")
    results = predictor.predict(senSet[index])
    for verb in zip(results["verbs"]):
        print(f"{verb}")
    #for word, verb in zip(results["words"], results["verbs"]):
    #    print(f"{word}\t{verb}")
    '''
    #for word, tag in zip(results["words"], results["tags"]):
    #    print(f"{word}\t{tag}")

    #subj = "province link"
    if pred == "be":
        pred = "type"
    #obj = "person"

    # look up the URI for subj, pred and obj
    options = []
    print("\nFor subject \"" + subj + "\":")
    subjURI = QueryURI(subj)
    if subjURI != None:
        options.append(subjURI)
    else:
        options.append([])

    print("\nFor predicate \"" + pred + "\":")
    predURI = QueryURI(pred)
    if predURI != None:
        options.append(predURI)
    else:
        options.append([])

    print("\nFor object \"" + obj + "\":")
    objURI = QueryURI(obj)
    if objURI != None:
        options.append(objURI)
    else:
        options.append([])

    return options

def main_loop2(subjURI, predURI, objURI): 
    try:
        print("\n")
        print("subject: " + subjURI[0:len(subjURI)])
        print("predicate: " + predURI[0:len(predURI)])
        print("object: " + objURI[0:len(objURI)])
    except:
        print("none")
        
    # query the triple in dbpd with SPARQL
    # queryResult = QueryTriple(subj, pred, obj)
    # print('Triple Query Result: ' + str(queryResult))

    # query the triple with several different methods
    r3 = ComponentQuery3(subjURI, predURI, objURI)
    if r3:
        print("\nFind origin component:")
        result = GetQueryResult(r3)
        #print(subj + ' - ' + pred + ' - ' + obj)
    else:
        r2 = ComponentQuery2(subjURI, predURI, objURI)
        if r2 and len(r2)>0:
            print("\nFind 2 components:")
            result = GetQueryResult(r2)
        else:
            #result = PartialQuery(subj, pred, obj, subjURI, predURI, objURI)
            result = "Find nothing"
            if not result:
                print ("Find nothing")
    return result

# For sever operation
app = Flask(__name__)

#str to json
def strToJson(s):
    stru = {
        "sent": s
    }
    js = json.dumps(stru)
    return js

@app.route('/')
def my_form():
    return render_template('index.html')


@app.route('/request', methods=['POST',"GET"])
def process_data():
    dataType = request.form.get("type")

    if dataType == "sent":
        text = request.form.get("str")
        print("Input sentence: " + text)
        #iterate = int(text)
        #processed_text = Montecarlo(iterate)
        options = main_loop(text)
        print(options)
        return json.dumps(options)
    elif dataType == "select":
        select = json.loads(request.form.get("str"))
        result = main_loop2(select[0], select[1], select[2])
        print(result)
        return json.dumps(result)




if __name__ == '__main__':
    app.run()
