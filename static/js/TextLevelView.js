function drawTLV(){

    var width = 700;
    var height = 57;
    $("#D").hide();
    
    //draw the EG view
    function drawTextLevelView(data){
        textView = d3.select(".main-view").append("div")	
                    .attr("id", "textview")
                    .attr("style", "overflow: auto;");  
        d3.json('./data/highlight.json').then(function(data) {
            speaker = ''
            data.forEach(function(sent) {
                plain_start = 0
                plain_end = 0
                text = sent.text;
                if(sent.speaker != speaker){
                    speaker = sent.speaker;
                    speakerdiv = textView.append("div");
                    speakerdiv.append("br")
                    speakerdiv.append("p")	
                            .text(speaker);
                }
                //div = textView.append("div");
                const node = document.createElement('p');
                node.innerHTML = '';
                sent.marks.forEach(function(mark){
                    plain_end = mark.start_char;
                    node.innerHTML = node.innerHTML + text.substring(plain_start, plain_end);
                    node.innerHTML = node.innerHTML + '<span class="' + mark.categ + '">' + mark.text + '</span>';
                    plain_start = mark.end_char;
                });
                node.innerHTML = node.innerHTML + text.substring(plain_start, text.length);
                document.getElementById('textview').appendChild(node);
            });
        }); 
   }

    const data = {
    "nodes":[
            {"id":"node1","frequency":"30","class":"Context-Keyword"},
            {"id":"node2","frequency":"20","class":"Negative-Emotion-Indicator"},
            {"id":"node3","frequency":"10","class":"Geo-Location"},
            {"id":"node4","frequency":"49","class":"Measure"},
        {"id":"node5","frequency":"20","class":"Organization"},
        {"id":"node6","frequency":"40","class":"Measureing-Unit"}
        ],
        "links":[
            {"source":"node1","target":"node2","distance":"1","frequency":"26"},
        {"source":"node2","target":"node3","distance":"3","frequency":"45"},
        {"source":"node3","target":"node4","distance":"1","frequency":"78"},
        {"source":"node4","target":"node5","distance":"1","frequency":"5"},
        {"source":"node4","target":"node6","distance":"1","frequency":"50"}
        ]
    }
    
    drawTextLevelView(data);
}
