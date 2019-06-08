from flask import Flask, request, render_template, jsonify
from flask_socketio import SocketIO
import random as r
import math as m
import json

import os
from threading import Lock
# export SLACK_BOT_TOKEN='blabla'
from slackclient import SlackClient

import csv
import re
import spacy
from spacy import displacy
from spacy.pipeline import EntityRecognizer
import json

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
            
def QueryURI(keywords, cacheDict, confidence, index=-2):
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

    # automaticly select from the options
    confidence = 0
    candiURI = []
    if len(result)>0:
        for name in result:
            candiURI.append("<" + name.find(prefix + "URI").text + ">")
    else:
        print("Sorry, we find nothing for this stuff :(\n")
        
    return candiURI
    
    # let users select from the options
    '''if len(result)>0:
        selected = -1
        count = 0
        for name in result:
            print(str(count) + ": " + name.find(prefix + "Label").text)
            count += 1
        # for some default input during debugging
        if index<-1:
            index = int(input("Which one is closer to what you mean? (type \"-1\" if nothing seems correct) "))
        if index >= 0:
            selected = "<" + result[index].find(prefix + "URI").text + ">"
        else:
            selected = None
        return selected
    else:
        print("Sorry, we find nothing for this stuff :(\n")'''
        
# given a URI, query the ontology iteratively to get its path to root
def QueryHierarchy(URI):
    path = []
    path.insert(0, URI)
    
    sparql = SPARQLWrapper("http://dbpedia.org/sparql")
    curURI = URI
    predicate = "rdf:type"
    endFlag = False # to mark whether a dbo:entity is found in current level
    
    while not endFlag:
        endFlag = True
        
        qSelect = """
            SELECT ?type WHERE 
            {
            """ + curURI + predicate + """ ?type.
            }
        """

        sparql.setQuery(qSelect)
        sparql.setReturnFormat(JSON)
        results = sparql.query().convert()

        for result in results["results"]["bindings"]:
            resultURI = '<' + result["type"]["value"] + '>'
            # begin the class part
            if "owl#Class" in resultURI:
                endFlag = False
                predicate = "rdfs:subClassOf"
                break
            # insert the first found dbo:entity into the path
            elif "http://dbpedia.org/ontology" in resultURI:
                endFlag = False
                curURI = resultURI
                path.insert(0, resultURI)
                break
     
    # insert the common root node to current path
    path.insert(0, '<http://www.w3.org/2002/07/owl#Thing>')
    return path
            
# get ontology hierarchy for every keyword and append the knowledge tree
def AppendTree(URIList, treeDict):
    for URI in URIList:
        hierarchy = QueryHierarchy(URI)
        #print(hierarchy)
        
        curDict = treeDict
        for curKey in hierarchy:
            if curKey in curDict:
                curDict = curDict[curKey]
            else:
                curDict[curKey] = dict()
                curDict = curDict[curKey]

# query information (abstract, thumbnail ...) about current uri
def QueryInfo(URI, entityInfo):
    sparql = SPARQLWrapper("http://dbpedia.org/sparql")
    sparql.setQuery("""
        PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
        SELECT ?abstract ?thumb
        WHERE {""" 
            + URI + """ dbo:abstract ?abstract ."""
            + URI + """ dbo:thumbnail ?thumb .
        FILTER (lang(?abstract) = 'en')
        }
    """)
    sparql.setReturnFormat(JSON)
    results = sparql.query().convert()
    
    for result in results["results"]["bindings"]:
        entityInfo["abstract"] = result["abstract"]["value"]
        entityInfo["thumbnail"] = result["thumb"]["value"]
    
# A recursive helper function to traverse treeDict and format it to json
def PreorderFormat(curDict):
    if len(curDict) == 0:
        return
    
    childList = []
    for key in curDict:
        children = PreorderFormat(curDict[key])
        if children:
            childList.append({
                "name": key,
                "children": children
            })
        else:
            childList.append({
                "name": key
            })
    return childList
    
        
def FormatToJson(treeDict):
    result = PreorderFormat(treeDict)
    finalResult = None
    if result:
        finalResult = {
            "name": "GroundRoot",
            "children": result
        }
    return finalResult
    
# extract one triple from given sentence
def RunNER(sen):
    # initialize the named entity list
    entityList = []
    
    # parse sentence
    doc = nlp(str(sen))
    print('\nOriginal Sentence:\n' + sen)

    #ents = [(e.text, e.start_char, e.end_char, e.label_) for e in doc.ents]
    chunks = []
    for chunk in doc.noun_chunks:
        if "subj" in chunk.root.dep_ or "obj" in chunk.root.dep_:
            # test whether current chunk is or contains stop words
            result = ''
            doc_phrase = nlp(chunk.text)
            for token in doc_phrase:
                #print(token.text, token.is_stop, token.lemma_)
                if not token.is_stop and token.lemma_ != "-PRON-":
                # exclude stop words and personal pronouns (whose lemma_ is "-PRON-")
                    result = result + token.text + ' '
            
            if result != '':
                chunks.append(result[:-1])
    
    return chunks

# Parses a list of events coming from the Slack RTM API to find bot commands
# If a bot command is found, this function returns a tuple of command and channel.
# If its not found, then this function returns None, None
def parse_bot_commands(slack_events):
    for event in slack_events:
        # we only want message event
        if event["type"] == "message" and not "subtype" in event:
            # Check direct mentions
            #user_id, message = parse_direct_mention(event["text"])
            #if user_id == starterbot_id:
            #    return message, event["channel"]
            return event["text"], event["channel"]
    return None, None

# Finds a direct mention (a mention that is at the beginning) in message text
# return the user ID which was mentioned
# If there is no direct mention, returns None
def parse_direct_mention(message_text):
    matches = re.search(MENTION_REGEX, message_text) # use a regular expression
    return (matches.group(1), matches.group(2).strip()) if matches else (None, None)

# load Spacy NLP dictionary
nlp = spacy.load('en_core_web_sm')

# load DBPD ontology and construct graph for query
#m_world = World()# Owlready2 stores every triples in a ‘World’ object
#m_onto = m_world.get_ontology("dbpedia.owl").load()
#m_graph = m_world.as_rdflib_graph()
#sparql = SPARQLWrapper("dbpedia.owl")#http://dbpedia.org/sparql
sparql = SPARQLWrapper("http://dbpedia.org/sparql")
sparql.setReturnFormat(JSON)

treeDict = dict()
cacheDict = dict()

def ProcessSen(sentence):
# parse and query each sentence
#for index in range(10, 20):
#for index in range(len(senSet)):
    #index = 26
    #sampleSentence = "Do you remember the administrator of this computer?"
    #sampleSentence = "Neverland has the tree house."

    # extract named entities from current sentence
    #entityList = RunNER(sampleSentence)
    nameEntityList = RunNER(sentence)
    print(nameEntityList)

    # look up the URI for the entities
    URIList = []
    entityList = []
    for entity in nameEntityList:
        print("\nFor \"" + entity + "\":")
        confidence = 0
        candiURI = None
        try:
            if entity in cacheDict:
                entityURI = cacheDict[entity]
                if entityURI != None: 
                    print("You mentioned", entity, "before. Do you mean", entityURI, "?")
                else:
                    print("You mentioned", entity, "before, but we can't find anything about it.")

            else:
                candiURI = QueryURI(entity, cacheDict, confidence)
                #entityURI = "<" + candiURI[0].find("{http://lookup.dbpedia.org/}" + "URI").text + ">"
                entityURI = candiURI[0]
                cacheDict[entity] = entityURI
            
            # query further information and wrap them in entityInfo
            if entityURI != None:
                #URIList.append(entityURI)
                print(entityURI)
                entityInfo = {
                    "uri": entityURI,
                    "strPath": "",
                    "sentence": sentence,
                    "abstract": None,
                    "thumbnail": None,
                    "candidate" : candiURI
                }
                print(entityInfo)
                hierarchy = QueryHierarchy(entityURI)
                for curKey in hierarchy:
                    entityInfo["strPath"] = entityInfo["strPath"]  + curKey + "&-&"
                entityInfo["strPath"] = entityInfo["strPath"][:-3]
                QueryInfo(entityURI, entityInfo)
                print(entityInfo)
                entityList.append(entityInfo)
        except:
            print("URI query failed!")

    '''
    # return the whole tree in json form
    if len(URIList)>0:
        AppendTree(URIList, treeDict)

    treeJson = FormatToJson(treeDict)
    return treeJson'''

    '''entityList = []

    if len(URIList)>0:
        for URI in URIList:
            entityInfo = {
                "uri": URI,
                "strPath": "",
                "sentence": sentence,
                "abstract": None,
                "thumbnail": None,
                "candidate" : candiURI
            }
            hierarchy = QueryHierarchy(URI)
            for curKey in hierarchy:
                entityInfo["strPath"] = entityInfo["strPath"]  + curKey + "&-&"
            entityInfo["strPath"] = entityInfo["strPath"][:-3]
            QueryInfo(URI, entityInfo)
            entityList.append(entityInfo)'''

    return entityList

#with open('../IdeaTest/Tree/conv-test.json', 'w') as outfile:  
#    json.dump(treeJson, outfile, indent = 2)

#str to json
def strToJson(s):
    stru = {
        "sent": s
    }
    js = json.dumps(stru)
    return js

# For sever operation
app = Flask(__name__)
app.config['SECRET_KEY'] = 'VIDI_ONTOLOGY'
socketio = SocketIO(app, engineio_logger=True)
thread = None
thread_lock = Lock()

# instantiate Slack client
slack_client = SlackClient(os.environ.get('SLACK_BOT_TOKEN'))
# starterbot's user ID in Slack: value is assigned after the bot starts up
starterbot_id = None

# constants
RTM_READ_DELAY = 3 #delay (second) between reading from RTM
EXAMPLE_COMMAND = "do"


# Executes bot command if the command is known
def handle_command(command, channel):
    # Default response is help text for the user
    # default_response = "Not sure what you mean. Try *{}*.".format(EXAMPLE_COMMAND)
    default_response = None

    # Finds and executes the given command, filling in response
    response = ProcessSen(command)
    # This is where you start to implement more commands!
    if command.startswith(EXAMPLE_COMMAND):
        response = "Sure...write some more code then I can do that!"

    # Sends the response back to slack
    slack_client.api_call(
        "chat.postMessage",
        channel=channel,
        text=command
    )

    # send updated data to visualization
    socketio.emit('server_response',
                {'data': response},
                namespace='/ontoTree')

def background_thread():
    # for reading in Slack conversation
    while True:
        command, channel = parse_bot_commands(slack_client.rtm_read())
        if command: 
            handle_command(command, channel)
            print(channel)

        socketio.sleep(RTM_READ_DELAY)

    # for autotest
    # load data
    '''command, channel = None, None
    while True:
        command, channel = parse_bot_commands(slack_client.rtm_read())
        if command:
            break
    filename = os.path.join(app.static_folder, 'data', 'shortdataset.csv')
    #filename = os.path.join(app.static_folder, 'data', 'newdataset_formatted.csv')
    file = open(filename, "r")
    #file = open("newdataset_formatted.csv", "r")
    reader = csv.reader(file)
    senSet = []
    for item in reader:
        # format sentences in item as string
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
    entityList = []
    for index in range(len(senSet)):
        handle_command(senSet[index], channel)
        socketio.sleep(RTM_READ_DELAY)'''


@socketio.on('connect', namespace='/ontoTree')
def test_connect():
    global thread
    with thread_lock:
        if thread is None:
            thread = socketio.start_background_task(target=background_thread)

@app.route('/')
def my_form():
    #return render_template('index.html')
    return render_template('index.html', async_mode=socketio.async_mode)


@app.route('/request', methods=['POST',"GET"])
def process_data():
    dataType = request.form.get("type")

    '''if dataType == "sent":
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
        return json.dumps(result)'''

@app.route('/customizeEntity', methods=['POST',"GET"])
def updateWithCustommerRequest():
    entityURI = request.form.get("uri")
    print(entityURI)
    entityInfo = {
        "uri": entityURI,
        "strPath": "",
        "sentence": None,
        "abstract": None,
        "thumbnail": None,
        "candidate" : None,
    }
    print(entityInfo)
    hierarchy = QueryHierarchy(entityURI)
    for curKey in hierarchy:
        entityInfo["strPath"] = entityInfo["strPath"]  + curKey + "&-&"
    entityInfo["strPath"] = entityInfo["strPath"][:-3]
    QueryInfo(entityURI, entityInfo)
    print(entityInfo)
    result = [entityInfo]

     # send updated data to visualization
    socketio.emit('server_response',
                {'data': result},
                namespace='/ontoTree')
    return json.dumps(result)


if __name__ == '__main__':
    # connect to slack
    if slack_client.rtm_connect(with_team_state=False):
        # communication with frontend
        print("Starter Bot connected and running!")
        # Read bot's user ID by calling Web API method `auth.test`
        starterbot_id = slack_client.api_call("auth.test")["user_id"]

        # multiprocessing
        #p = Process(target=Slack_loop, args=('test',fn))
        #p.start() 
    else:
        print("Connection failed. Exception traceback printed above.")
    
    # run Flask server
    # app.run()
    socketio.run(app)
    # export SLACK_BOT_TOKEN='blabla'