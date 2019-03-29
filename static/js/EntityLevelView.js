function drawELV(){

    var width = 850;
    var height = 133000;
    
    $("#D").hide();

    wordclass = {
        "Person":"person",
        "Geo":"geo",
        "Time":"time",
        "Context-Keyword":"context",
        "Politeness-Indicator":"politeness",
        "Measure":"measure",
        "Unit":"unit",
        "Organization":"organization",
        "Positive":"positive",
        "Negative":"negative"
      }  
    
    //draw the EG view
    function drawEntityLevelView(){
        entityView = d3.select(".main-view").append("div")	
                    .attr("id", "entityview")
                    .attr("class", "row");  
        // finish the layout
        var leftView = entityView.append("div")
                    .attr("style", "float: left; width: 40%; font-size:15px; padding-left: 15px; padding-right: 150px; padding-top: 10px;"); 
        textView = leftView.append("div")	
                    .attr("id", "textview")
                    .attr("style", "overflow: auto;");  

        var middleView = entityView.append("div")	
                        .attr("id","middleview")
                        .attr("style", "float: left; height: 580px; width: 30%; overflow: auto; background: #FFF; border: 1px solid #545B62;  border-radius: 5px; padding-top: 10px;"); 
        var svg = middleView.append("svg")
                .attr("id","middlesvg")
                .attr("width", width)
                .attr("height", height)
                .append("g");
        
        var rightView = entityView.append("div")
                        .attr("id","rightlayout")	
                        .attr("style", "float: left; width: 25%; margin-left: 50px;"); 
        thumbNail = rightView.append("div")
                    .attr("id","rightview")
                    .attr("style", "float: left; width: 90px; height: 200px; padding-right: 10px; overflow: auto; background: #FFF; ")
                    .on("click",function(d){
                        var element = document.getElementById("rightview");
                        var elementMiddle = document.getElementById("middleview");
                        elementMiddle.scrollTop = (elementMiddle.scrollHeight - elementMiddle.clientHeight) * element.scrollTop/(element.scrollHeight - element.clientHeight);
                        //console.log(element.scrollTop/(element.scrollHeight - element.clientHeight))
                    }); 

        //load data
        offset = 0
        htmlList = []
        d3.json('./data/highlight.json').then(function(data, index) {
            //for left view
            speaker = ''
            data.forEach(function(sent) {
                plain_start = 0
                plain_end = 0
                text = sent.text;
                if(sent.speaker != speaker){
                    /*speaker = sent.speaker;
                    speakerdiv = textView.append("div");
                    speakerdiv.append("br")
                    speakerdiv.append("p")	
                            .text(speaker);*/
                    /*svg = middleView.append("svg")
                            .attr("id","middlesvg")
                            .attr("width", width)
                            .attr("height", height)
                            .append("g");*/
                }

                //draw lines in middle view
                svg.append("line")          // attach a line
                    .style("stroke", "black")  // colour the line
                    .attr("x1", 20)     // x position of the first end of the line
                    .attr("y1", (offset * 30) + 20)      // y position of the first end of the line
                    .attr("x2", 20 + width*(sent.text.length/512.0))     // x position of the second end of the line
                    .attr("y2", (offset * 30) + 20);    // y position of the second end of the line
                
                svg.append("line")          // attach a line
                    .style("stroke", "black")  // colour the line
                    .attr("x1", 20)     // x position of the first end of the line
                    .attr("y1", (offset * 30) + 15)      // y position of the first end of the line
                    .attr("x2", 20)     // x position of the second end of the line
                    .attr("y2", (offset * 30) + 25);    // y position of the second end of the line
                
                svg.append("line")          // attach a line
                    .style("stroke", "black")  // colour the line
                    .attr("x1", 20 + width*(sent.text.length/512.0))     // x position of the first end of the line
                    .attr("y1", (offset * 30) + 15)      // y position of the first end of the line
                    .attr("x2", 20 + width*(sent.text.length/512.0))     // x position of the second end of the line
                    .attr("y2", (offset * 30) + 25);    // y position of the second end of the line

                //div = textView.append("div");
                stringHTML = '';
                sent.marks.forEach(function(mark){
                    plain_end = mark.start_char;
                    stringHTML = stringHTML + text.substring(plain_start, plain_end);
                    stringHTML = stringHTML + '<span class="' + mark.categ + '">' + mark.text + '</span>';
                    plain_start = mark.end_char;

                    //logos in middle view
                    //console.log(mark.start_char/sent.text.length)
                    svg.append("image")
                        .attr("x", 15 + width*((mark.start_char+mark.end_char)/1024.0))
                        //.attr("x", 0)
                        .attr("y", (offset * 30) + 10)
                        .attr("width", 20)
                        .attr("height", 20)
                        .attr("xlink:href",function(d){return "img/logos/"+wordclass[mark.categ]+".png"});
                });
                stringHTML = stringHTML + text.substring(plain_start, text.length);
                htmlList.push(stringHTML);

                //for thumb nail
                const smallNode = document.createElement('p');
                smallNode.innerHTML = stringHTML;
                smallNode.style = "margin: 0px; font-size: 1px;"
                document.getElementById('rightview').appendChild(smallNode);

                coverRect = svg.append('rect')
                    .attr("id", "rect" + offset)
                    .attr("x", 15)
                    .attr("y", (offset * 30) + 10)
                    .attr("width", 20+width*(sent.text.length/512.0))
                    .attr("height", 20)
                    .style("fill", "#FFF")
                    .style("opacity", "0.8")
                    .on("mouseover",function(d){
                        //linkhover(d);
                        textNode = document.getElementById('textview');

                        //remove existing text
                        while (textNode.firstChild) {
                            textNode.removeChild(textNode.firstChild);
                        }

                        //add new text
                        const node = document.createElement('p');
                        node.innerHTML = htmlList[parseInt(d3.select(this).attr("id").slice(4))];
                        textNode.appendChild(node);
                        d3.select(this).style("opacity", "0.0");               
                     })
                    .on("mouseout", function(d){ 
                        d3.select(this).style("opacity", "0.8"); 
                     });

                offset += 1
            });
            var b = document.createElement("button");
            b.innerHTML = "Demo";
            b.onclick = function(d){
                index = 1957;

                textNode = document.getElementById('textview');
                //remove existing text
                while (textNode.firstChild) {
                    textNode.removeChild(textNode.firstChild);
                }
                //add new text
                const node = document.createElement('p');
                node.innerHTML = htmlList[index];
                textNode.appendChild(node);
                const node1 = document.createElement('p');
                node1.innerHTML = htmlList[index+1];
                textNode.appendChild(node1);
                const node2 = document.createElement('p');
                node2.innerHTML = htmlList[index+2];
                textNode.appendChild(node2);
                
                var elementMiddle = document.getElementById("middleview");
                elementMiddle.scrollTop = (elementMiddle.scrollHeight - elementMiddle.clientHeight) * index/4427;
                d3.select("#rect" + index).style("opacity", "0.0"); 
                d3.select("#rect"+(index+1)).style("opacity", "0.0"); 
                d3.select("#rect"+(index+2)).style("opacity", "0.0"); 
            };
            document.getElementById("rightlayout").appendChild(b);
        });
   }
    
    drawEntityLevelView();
}
