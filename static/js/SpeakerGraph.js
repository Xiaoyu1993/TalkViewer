function drawSG(){

var width = 1000;
var height = 500;
$("#D").hide();

var node_freqfilter = 1;
d3.json("./data/speakers.json").then(function(data){
  drawSpeakerGraph(data);
});

function drawSpeakerGraph(data){    
  speakerView = d3.select(".main-view").append("div")	
          .attr("id", "entityview")
          .attr("class", "row");  
  // finish the layout
  var leftView = speakerView.append("div")
          .attr("style", "float: left; width: 20%; font-size:15px; padding-left: 15px; padding-top: 10px; ");
  /*textView = leftView.append("div")	
          .attr("id", "textview")
          .attr("style", "overflow: auto;"); */ 

  var rightView = speakerView.append("div")	
              .attr("style", "float: left; width: 80%; padding-top: 10px;"); 

  var svg = rightView.append("svg")
            .attr("id","rightsvg")
            .attr("width", width)
            .attr("height", height)
            .append("g");
         
   //scale for the edge length *unfinished unkown range
  var edgelengthscale = d3.scaleLinear()
                      .domain([1,d3.max(data.links, function(d) { return parseInt(d.utterList.length); })])
                      .range([200, 400]);

  var tipNode = d3.tip()
               .attr('class', 'd3-tip')
               .offset([-8, 0])
               .html(function(d) {
               	  return d.name + " has mentioned " + d.utterList.length + " pairs";
                })
  var tipLink = d3.tip()
              .attr('class', 'd3-tip')
              .offset([-18, -50])
              .html(function(d) {
                  return d.source.name + " and " + d.target.name + " have " + d.utterList.length + " pairs in common";
              })             
   //scale for the edge brightness *unfinished unkown range
  var edgebrightscale = d3.scaleLinear()
                      .domain([1,d3.max(data.links, function(d) { return parseInt(d.utterList.length); })])
                      .range([0.1, 1]);
  
  
  //scale for the the edge thickness 
  var edgethickscale = d3.scaleLinear()
                      .domain([1,d3.max(data.links, function(d) { return parseInt(d.utterList.length); })])
                      .range([1, 5]);
                      
   //scale for the the class radius *unfinished
  var nodesizescale = d3.scaleLinear()
                      .domain([1,d3.max(data.nodes, function(d) { return parseInt(d.utterList.length); })])
                      .range([20, 50]);                    
               
    //class identification
  drag = simulation => { 
    function dragstarted(d) {
      if (!d3.event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(d) {
      d.fx = d3.event.x;
      d.fy = d3.event.y;
    }

    function dragended(d) {
      if (!d3.event.active) simulation.alphaTarget(0);
    //  d.fx = null;
     // d.fy = null;
    }

    return d3.drag()
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended);
    }
     
    update();
 
    //draw the SG view
    function update(){
      //force graph
      var simulation = d3.forceSimulation()
                        .force("charge", d3.forceManyBody().strength(-200))       
                        .force("link", d3.forceLink().id(function(d) { return d.name; }).distance(function(d){return edgelengthscale(d.utterList.length)}).strength(0.3))
                        .force("x", d3.forceX(width / 2))
                        .force("y", d3.forceY(height / 2))         
                        .on("tick", ticked); 
      simulation.nodes(data.nodes);
      simulation.force('link').links(data.links);

      svg.call(tipNode);
      svg.call(tipLink);
      
      var new_nodes = [];
      var new_links = [];
      for(let node of data.nodes){
        //if(node.frequency > node_freqfilter){
        var number_link = 0;
        for(let link of data.links){		
          if(link.target.text == node.text || link.source.text == node.text) 
            number_link ++;  				
          new_nodes.push(node);
        }
      }
      
      for(let link of data.links){
        //if(link.source.frequency > node_freqfilter && link.target.frequency > node_freqfilter)
            new_links.push(link);
      }

      d3.selectAll(".link").remove();
      d3.selectAll(".node").remove();
        
      var link = svg.selectAll(".link")
                    .data(new_links)
                    .enter()
                    .append("polyline")
                    .attr("class", "link")
                    .attr("stroke","#999")
                    .attr("fill","None")
                    .attr("stroke-opacity",function(d){return edgebrightscale(d.utterList.length)})
                    .style("stroke-width", function(d) { return 3*edgethickscale(d.utterList.length) })
                    .on("mouseover",function(d){
                      linkhover(d);
                      tipLink.show(d);
                      d3.select(this).style('stroke-opacity', 0.9);               
                      })
                    .on("mouseout", function(d){ 
                      tipLink.hide(d);
                      d3.select(this).style('stroke-opacity', 0.3); 
                    });
                    //.attr("marker-mid", function(d) { return "url(#link)"; });

        
      var node = svg.selectAll(".node")
                    .data(new_nodes)
                    .enter()
                    .append("g")
                    .attr("class","node");
      
      //append class picture to the node
      var imgcate = node.append("image")
                        .attr("width",function(d){return 1.6*nodesizescale(d.utterList.length)})
                        .attr("height",function(d){return 1.6*nodesizescale(d.utterList.length)})
                        .attr("x", function(d){return nodesizescale(d.utterList.length)*(-0.8)})
                        .attr("y", function(d){return nodesizescale(d.utterList.length)*(-0.8)})
                        .attr("xlink:href",function(d){return "img/speakers/"+d.name+".png"})//change here!
                        .call(drag(simulation))
                        .on("click",function(d){nodehover(d);})
                        .on("mouseover",function(d){
                          nodehover(d);
                          tipNode.show(d);
                          link.style('stroke', function(l) {      	                           	   
                              if (d.name === l.source.name || d.name === l.target.name) return "#000";
                              else return "#999";
                            });   	                 
                          })
                        .on("mouseout", function(d){ 
                          tipNode.hide(d);
                          if(!d["click"]) {
                            link.style('stroke', function(l) {
                              return "#999"
                            });
                          }
                        });

      node.append("text")
          .style("font-size","12px")
          .attr("dx", "-1.5em")
          .attr("dy", function(d){return nodesizescale(d.utterList.length)*0.8 + 10})
          .text(function(d) { return d.name});
      
      /*node.append("circle")
          .attr("r", function(d){return nodesizescale(d.utterList.length)/2-1})
          .attr("fill", "None")
          .attr("stroke","#444");*/
          
      node.filter(function(d){return d.group;})
          .append("circle")
          .attr("r", function(d){return nodesizescale(d.utterList.length)/2+2})
          .attr("fill", "None")
          .attr("stroke","#444")
          .attr("stroke-width",1.5);


      function ticked() {
        link.attr("points", function(d) { 
          return d.source.x + "," + d.source.y + " " + 
                (d.source.x + d.target.x)/2 + "," + (d.source.y + d.target.y)/2 + " " +
                d.target.x + "," + d.target.y; 
          
        });      
          node.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
        }
    
      //Zoom functions 
      function zoom_actions(){ d3.select("#rightsvg").attr("transform", d3.event.transform) }
      
      //add zoom capabilities 
      var zoom_handler = d3.zoom().on("zoom", zoom_actions);

      zoom_handler(d3.select("#schemasvg")); 
        
      function nodehover(d){
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

        d3.selectAll('#leftlist').remove();
        d3.selectAll('#leftinfo').remove();

        var leftInfo = leftView.append("div")
                        .attr("id", "leftinfo")
                        .attr("style", "overflow: auto;");
        leftInfo.append("text").text(d.name);
        leftInfo.append("br");
        leftInfo.append("text").text("has used the following pairs frequently")
                                .attr("style", "font-size:12px; height: 500px");

        var leftList = leftView.append("div")
                        .attr("id", "leftlist")
                        .attr("style", "height: 350px; overflow: auto;");
        var leftSvg = leftList.append("svg")
            .attr("id", "leftsvg")
            .attr("width", 250)
            .attr("height", 20+20*d.utterList.length)
            .append("g");

        var legend = leftSvg.selectAll(".legend")
        //legend = svg.selectAll(".legend")
                      .data(d.utterList)
                      .enter().append('g')
                      .attr("class", "legends")
                      .attr("transform", function (d, i) {
                      pos_y = (i * 20) + 20; 
                      return "translate(0," + pos_y + ")"
                      })

        legend.append("image")
        .attr("x", 0)
        .attr("y", -3)
        .attr("width", 15)
        .attr("height", 15)
        .attr("xlink:href",function(d){return "img/logos/"+wordclass[d.sourceCateg]+".png"});

        legend.append('text')
        .attr("x", 20)
        .attr("y", 10)
        //.attr("dy", ".35em")
        .text(function (d, i) {
        return d.source 
        })
        .attr("class", "textselected")
        .style("text-anchor", "start")
        .style("font-size", 15)

        legend.append("image")
        .attr("x", function (d, i) {
          return 40 + d.source.length*7
        })
        .attr("y", -3)
        .attr("width", 15)
        .attr("height", 15)
        .attr("xlink:href",function(d){return "img/logos/"+wordclass[d.targetCateg]+".png"});

        legend.append('text')
        .attr("x", function (d, i) {
          return 60 + d.source.length*7
        })
        .attr("y", 10)
        //.attr("dy", ".35em")
        .text(function (d, i) {
        return d.target 
        })
        .attr("class", "textselected")
        .style("text-anchor", "start")
        .style("font-size", 15)

        var linkedByIndex = {};
        //console.log(link);
        new_links.forEach(function(d) {
              linkedByIndex[d.source.index + "," + d.target.index] = 1;
              linkedByIndex[d.target.index + "," + d.source.index] = 1;
        });
              
        if(!d["click"]){
          d["click"] = true;
          imgcate.style("opacity",function(i){
              if(d.name == i.name) return 1;
              //else return 0.5;
              else return neighboring(d, i) ? 1 : 0.5;
          })
          link.style('stroke-opacity', function(l) {
            if (d.name === l.source.name || d.name === l.target.name) return edgebrightscale(l.utterList.length);
              else return edgebrightscale(l.utterList.length)/2;
          });
        }
        else{
          d["click"] = false;
          imgcate.style("opacity",function(i){return 1;})    		
          link.style('stroke-opacity',function(l){return edgebrightscale(l.utterList.length);});
            
        }
        function neighboring(a, b) { 
          return linkedByIndex[a.index + "," + b.index]; 
        }
      } 	

      function linkhover(d){
        colorclass = {
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

        d3.selectAll('#leftlist').remove();
        d3.selectAll('#leftinfo').remove();

        var leftInfo = leftView.append("div")
                        .attr("id", "leftinfo");
        leftInfo.append("text").text(d.source.name);
        leftInfo.append("br");
        leftInfo.append("text").text("and")
                                .attr("style", "font-size:12px;");
        leftInfo.append("br");
        leftInfo.append("text").text(d.target.name);
        leftInfo.append("br");                       
        leftInfo.append("text").text("have used following entity pairs in common")
                                .attr("style", "font-size:12px;");

        var leftList = leftView.append("div")
                              .attr("id", "leftlist")
                              .attr("style", "height: 350px; overflow: auto;");
        
        var leftSvg = leftList.append("svg")
            .attr("id", "leftsvg")
            .attr("width", 250)
            .attr("height", 20+20*d.utterList.length)
            .append("g")

        var legend = leftSvg.selectAll(".legend")
        //legend = svg.selectAll(".legend")
                      .data(d.utterList)
                      .enter().append('g')
                      .attr("class", "legends")
                      .attr("transform", function (d, i) {
                      pos_y = (i * 20) + 20; 
                      return "translate(0," + pos_y + ")"
                      })

        /*legend.append("image")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", 15)
        .attr("height", 10)
        .attr("xlink:href",function(d){return "img/logos/"+wordclass[d.source.categ]+".png"});*/

        legend.append("image")
        .attr("x", 0)
        .attr("y", -3)
        .attr("width", 15)
        .attr("height", 15)
        .attr("xlink:href",function(d){return "img/logos/"+wordclass[d.sourceCateg]+".png"});

        legend.append('text')
        .attr("x", 20)
        .attr("y", 10)
        //.attr("dy", ".35em")
        .text(function (d, i) {
        return d.source 
        })
        .attr("class", "textselected")
        .style("text-anchor", "start")
        .style("font-size", 15)

        legend.append("image")
        .attr("x", function (d, i) {
          return 40 + d.source.length*7
        })
        .attr("y", -3)
        .attr("width", 15)
        .attr("height", 15)
        .attr("xlink:href",function(d){return "img/logos/"+wordclass[d.targetCateg]+".png"});

        legend.append('text')
        .attr("x", function (d, i) {
          return 60 + d.source.length*7
        })
        .attr("y", 10)
        //.attr("dy", ".35em")
        .text(function (d, i) {
        return d.target 
        })
        .attr("class", "textselected")
        .style("text-anchor", "start")
        .style("font-size", 15)

        /*var linkedByIndex = {};
        //console.log(link);
        new_links.forEach(function(d) {
              linkedByIndex[d.source.index + "," + d.target.index] = 1;
              linkedByIndex[d.target.index + "," + d.source.index] = 1;
        });
              
        if(!d["click"]){
          d["click"] = true;
          imgcate.style("opacity",function(i){
              if(d.name == i.name) return 1;
              //else return 0.5;
              else return neighboring(d, i) ? 1 : 0.5;
          })
          link.style('stroke-opacity', function(l) {
            if (d.name === l.source.name || d.name === l.target.name) return edgebrightscale(l.utterList.length);
              else return edgebrightscale(l.utterList.length)/2;
          });
        }
        else{
          d["click"] = false;
          imgcate.style("opacity",function(i){return 1;})    		
          link.style('stroke-opacity',function(l){return edgebrightscale(l.utterList.length);});
            
        }
        function neighboring(a, b) { 
          return linkedByIndex[a.index + "," + b.index]; 
        }*/
      } 
    }	
  }
}
  