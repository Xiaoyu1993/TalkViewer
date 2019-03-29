function drawEG(){

var width = screen.availWidth;
var height = screen.availHeight-57-50;
var node_freqfilter = 1;

$("#D").hide();

d3.json("./data/node.json").then(function(data){
    drawNodeLink(data);
});

function drawNodeLink(data){
//slide bar for frequency selection

d3.select(".main-view").append("div")
                       .attr("id","slide-bar")
 
d3.select("#slide-bar").append("text").text("frequency filter:   ");
                       
d3.select("#slide-bar").append("input")
				.attr("type", "range")
				.attr("min", function(){return 1;/*return d3.min(data.nodes,function(d){return parseInt(d.frequency)})*/})
				.attr("max", function(){return 60;/*return d3.max(data.nodes,function(d){return parseInt(d.frequency)})*/})
				.attr("step", "2")
				.attr("value","5")
				.attr("id", "frequency")
				.on("input", function input() {
					update();
				});	
d3.select("#slide-bar").append("text").attr("id","frequency-text").text("  5");			
			
var svg = d3.select(".main-view").append("svg")
          .attr("id","schemasvg")
         .attr("width", width)
         .attr("height", height);
   
  
  var tip = d3.tip()
               .attr('class', 'd3-tip')
               .offset([-8, 0])
               .html(function(d) {
               	  if(!d.group)  return d.text;
               	  else return d.text +","+ d.group;
                })
                              
                      
    //class identification
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
         d.fx = null;
         d.fy = null;
       }
  
      return d3.drag()
         .on("start", dragstarted)
         .on("drag", dragged)
         .on("end", dragended);
      }
     
     update();
//draw the EG view
function update(){
	
  d3.selectAll("#schemag").remove();
  
  let g = svg.append("g")
             .attr("id","schemag");
  
  node_freqfilter = document.getElementById("frequency").value;
  
  $("#frequency-text").text("  "+node_freqfilter)
  
  let new_nodes = [];
  let new_links = [];
  let nodes_list = [];
  
  for(let node of data.nodes){
  	if(node.frequency > node_freqfilter && node.type == "entity"){
  		new_nodes.push(node);
  		nodes_list.push(node.text);
  	}
  }
  
  for(let link of data.links){
  	 if(nodes_list.indexOf(link.source) != -1 && nodes_list.indexOf(link.target) != -1){
  	    new_links.push(link);
  	  }
  	 else if(nodes_list.indexOf(link.source.text) != -1 && nodes_list.indexOf(link.target.text) != -1){
  	 	new_links.push(link);
  	 }
  }
  
  var map = {};
  for(let node of new_nodes){
  	node.linknum = 0;
  	node.father = "";
  	node.children = [];
  	map[node.text] = node;
  }
  
  for(let link of new_links){
  	let source = link.source.text? link.source.text :link.source;
  	let target = link.target.text? link.target.text:link.target;
  	map[source].linknum ++;
  	map[source].father = target;
  	map[target].linknum ++;
  	map[target].father = source;
  }

  for(let node of new_nodes){
  	if(map[node.text].linknum == 1){ //node with only one link
  		var partner = map[node.text].father;
  		if(map[partner].linknum >= 2 || map[partner].frequency < map[node.text].frequency){ //group node to the other node
  			   map[partner].children.push(node.text);
  			   map[partner].expand = false;
  			   map[node.text].expandchildren = false;
  		}
  		else delete map[node.text].father;
  	}
  	else delete map[node.text].father;
  }
  
  
   //scale for the edge brightness *unfinished unkown range
  var edgebrightscale = d3.scaleLinear()
                      .domain([1,d3.max(new_links, function(d) { return parseInt(d.frequency); })])
                      .range([0.5, 1]);
  
  
  //scale for the the edge thickness 
  var edgethickscale = d3.scaleLinear()
                      .domain([1,d3.max(new_links, function(d) { return parseInt(d.frequency); })])
                      .range([2, 5]);
                      
   //scale for the the class radius *unfinished
  var nodesizescale = d3.scaleLinear()
                      .domain([1,d3.max(new_nodes, function(d) { return parseInt(d.frequency); })])
                      .range([20, 50]);                    
                
    //scale for the edge length *unfinished unkown range
  var edgelengthscale = d3.scaleLinear()
                      .domain([1,d3.max(new_links, function(d) { return parseInt(d.distance); })])
                      .range([100, 200]);  
                      
 //force graph
   let simulation = d3.forceSimulation()
                   .force("charge", d3.forceManyBody().strength(-200))       
                    .force("link", d3.forceLink().id(function(d) { return d.text; }).distance(function(d){return edgelengthscale(d.distance)}).strength(0.3))
                    .force("x", d3.forceX(width / 2))
                    .force("y", d3.forceY(height / 2))         
                    .on("tick", ticked); 

  simulation.nodes(new_nodes);
  simulation.force('link').links(new_links);

  g.call(tip);                     
 
  g.append("svg:defs").selectAll("marker")
      .data(["link"])
      .enter().append("svg:marker")
      .attr("id", String)
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 5)
      .attr("markerWidth", 3)
      .attr("markerHeight", 3)
      .attr("orient", "auto")
      .attr("fill","#999")
      .append("svg:path")
      .attr("d", "M0,-5L10,0L0,5");
    
    
  var link = g.selectAll(".link")
                .data(new_links)
                .enter()
                .append("polyline")
                .attr("class", "link")
                .attr("stroke","#999")
                .attr("fill","None")
                .style("opacity",function(d){return d.source.father||d.target.father? 0:1})
                .attr("stroke-opacity",function(d){return edgebrightscale(d.frequency)})
                .style("stroke-width", function(d) { return edgethickscale(d.frequency) })
                .attr("marker-mid", function(d) { return "url(#link)"; });

     
  var node = g.selectAll(".node")
                .data(new_nodes)
                .enter()
                .append("g")
                .attr("class","node");
  
  //append class picture to the node
  var imgcate = node.append("image")
                    .attr("width",function(d){return nodesizescale(d.frequency)})
                    .attr("height",function(d){return nodesizescale(d.frequency)})
                    .style("opacity",function(d){return d.father? 0:1})
                    .attr("class","node-bundle")
                    .attr("x", function(d){return nodesizescale(d.frequency)*(-1/2)})
                    .attr("y", function(d){return nodesizescale(d.frequency)*(-1/2)})
                    .attr("xlink:href",function(d){return "img/logos/"+wordclass[d.categ]+".png"})
                    .call(drag(simulation))
                    .on("click",function(d){nodeclick(d);})
                    .on("mouseover",function(d){
       	                           tip.show(d);
       	                             link.style('stroke', function(l) {      	                           	   
                                         if (d.text === l.source.text || d.text === l.target.text) return "#000";
                                         else return "#999";
                                       });   	                 
                                  })
       .on("mouseout", function(d){ tip.hide(d);
                                     if(!d["click"]) link.style('stroke', function(l) {return "#999"});});

  node.append("text")
      .style("font-size","12px")
      .attr("class","node-bundle")
      .style("opacity",function(d){return d.father? 0:1})
      .attr("dx", function(d){return nodesizescale(d.frequency)/2 + 5})
      .attr("dy", ".35em")
      .text(function(d) { return d.text });
  
   node.append("circle")
      .attr("r", function(d){return nodesizescale(d.frequency)/2-1})
      .style("opacity",function(d){return d.father? 0:1})
      .attr("class","node-bundle")
      .attr("fill", "None")
      .attr("stroke","#444");
      
  node.filter(function(d){return d.group;})
      .append("circle")
      .attr("class","node-bundle")
      .style("opacity",function(d){return d.father? 0:1})
      .attr("r", function(d){return nodesizescale(d.frequency)/2+4})
      .attr("fill", "None")
      .attr("stroke","#444")
      .attr("stroke-width",2);
      
   //for relation grouping
  
   node.filter(function(d){return d.children.length > 0;})
       .selectAll(".relaline")
       .data(function(d){
       	     var lines = [];
       	     for(let i = 0; i < d.children.length; i++){
       	     	lines.push([i,d.children.length,d.frequency]);
       	     }
       	     return lines;
          })
       .enter()
       .append("line")
       .attr("class","relaline")
       .attr("x1",function(d){return 0})
       .attr('y1',function(d){return nodesizescale(d[2])/2;})
       .attr("x2",function(d){return 0})
	   .attr('y2',function(d){return nodesizescale(d[2])/2 + 10;})
       .attr('transform',function(d){
            return 'rotate(' + d[0]*330/d[1]+180 + ')';
 	   })
 	   .attr("stroke","#444")
       .attr("stroke-width",2);


	function ticked() {
    link.attr("points", function(d) { 
      return d.source.x + "," + d.source.y + " " + 
             (d.source.x + d.target.x)/2 + "," + (d.source.y + d.target.y)/2 + " " +
             d.target.x + "," + d.target.y; 
      
     });      
      node.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
    }
	
	//Zoom functions 
     function zoom_actions(){ d3.select("#schemag").attr("transform", d3.event.transform) }
     
     //add zoom capabilities 
      var zoom_handler = d3.zoom().on("zoom", zoom_actions);

       zoom_handler(d3.select("#schemasvg")); 
       
   
      function nodeclick(d){
      	if(d.children.length > 0){
      		link.style("opacity",function(l){
      			if(l.source.text == d.text){
      				if(d.children.indexOf(l.target.text) != -1) {
      					return d.expand? 0:1;
      				}
      			}
      			else if(l.target.text == d.text){
      				if(d.children.indexOf(l.source.text) != -1) {
      					return d.expand? 0:1;
      				}
      			}
      			else if(l.target.expandchildren == false || l.source.expandchildren == false)
      			    return 0;
      			else return 1;
      		});
      		
      		d3.selectAll(".node-bundle")
      		  .style("opacity",function(l){
      		  	if(d.children.indexOf(l.text) != -1) {
      		  		l.expandchildren = !l.expandchildren;
      		  		return d.expand? 0:1;
      		  	}
      		  	else if(l.father && l.expandchildren == false) return 0;
      		  	else return 1;
      		  })
      		d.expand = !d.expand; 
      	}
    
      	
      	//highlight links
      	var linkedByIndex = {};

        new_links.forEach(function(d) {
              linkedByIndex[d.source.index + "," + d.target.index] = 1;
              linkedByIndex[d.target.index + "," + d.source.index] = 1;
        });
              
      	if(!d["click"]){
      	  d["click"] = true;
      	  imgcate.filter(function(d){return !d.father || d.expandchildren})
      	     .style("opacity",function(i){
      	  	 if(d.text == i.text) return 1;
      	  	 //else return 0.5;
      	  	 else return neighboring(d, i) ? 1 : 0.5;
      	  })
      	  link.style('stroke-opacity', function(l) {
      	 	 if (d.text === l.source.text || d.text === l.target.text) return edgebrightscale(l.frequency);
             else return edgebrightscale(l.frequency)/2;
          });
       }
      	else{
      		d["click"] = false;
      		imgcate.filter(function(d){return !d.father})
      		       .style("opacity",function(i){return 1;})
      		link.style('stroke-opacity',function(l){return edgebrightscale(l.frequency);});
      			
      	}
      	function neighboring(a, b) { 
           return linkedByIndex[a.index + "," + b.index];
         
        }
       }
      	
}	
}
}
  