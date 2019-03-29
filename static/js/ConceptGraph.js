function drawCG(){
	
	var width = 800;
	var height = 500;
	var new_nodes = [];
    var new_links = [];
	var select_topics = [];
	
	d3.json("./data/node.json").then(function(data){
       
	//teporal graph button 
	$("#D").show();
	
	$("#D").click(function(){
		$(".main-view").empty();
		drawTG(new_nodes,new_links);
	});

	
	//Topics selection bar
	Topics = ["right","people","country","law","security","nuclear","president","woman","job","war"];
	
	selectbar = d3.select(".main-view").append("div").attr("id","select-topic")	                
	
	$("#select-topic").append("<div><p>Select Topics</p></div>");
	
	for(var i = 0; i < 10; i ++){		
		 $("#select-topic").append( "<div class='checkbox'><label><input type='checkbox' value='" + i.toString() + "' />   "+Topics[i] +"</label></div>" );
	}
	
	$("#select-topic").append('<button type="button" class="btn btn-primary" id="btn-update">Update</button>')
     
    
	$("#btn-update").click(function(){
		 select_topics = [];
            $.each($('input:checkbox:checked'),function(){
                select_topics.push(Topics[$(this).val()]);               
            });
             update(select_topics);
        });
        
    d3.select(".main-view")
      .append("div")
      .attr("id","Concept-Graph-Container")
     
    d3.select("#Concept-Graph-Container").append("div")
                       .attr("id","slide-bar")
 
    d3.select("#slide-bar").append("text").text("frequency filter:   ");
                       
    d3.select("#slide-bar").append("input")
				.attr("type", "range")
				.attr("min", function(){return 1;/*return d3.min(data.nodes,function(d){return parseInt(d.frequency)})*/})
				.attr("max", function(){return 60;/*return d3.max(data.nodes,function(d){return parseInt(d.frequency)})*/})
				.attr("step", "1")
				.attr("value","1")
				.attr("id", "frequency")
				.on("input", function input() {
					update(select_topics);
				});	
				
  d3.select("#slide-bar").append("text").attr("id","frequency-text").text("  1");	

// node-link visualization
     svg = d3.select("#Concept-Graph-Container")
               .append("svg")
               .attr("width", width)
               .attr("height", height)
               .attr("id","conceptsvg")
               .append("g")
               .attr("id","conceptg")
      
  
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
        /* if(d.type != "speaker"){
            d.fx = null; 
            d.fy = null;
         }*/
      } 
      return d3.drag().on("start", dragstarted).on("drag", dragged).on("end", dragended);
      }
      
	function update(topics){
		
	    d3.selectAll(".link").remove();
        d3.selectAll(".node").remove();
        
        node_freqfilter = document.getElementById("frequency").value;
        
        $("#frequency-text").text("  "+node_freqfilter)
  
       new_nodes = [];
       new_links = [];
       let entity = new Set();
       
       //filter the node and links
       //leave the nodes of people,selected topics and entities linked to the topic
       //leave the links connected people and topics, topics and entities   
       for(let topic of topics){
       	   entity.add(topic);
       }
       
        for(let link of data.links){
  	      if(topics.indexOf(link.target) != -1) entity.add(link.source);
  	      else if(topics.indexOf(link.target.text) != -1) entity.add(link.source.text);
  	      
  	      if(topics.indexOf(link.source) != -1)  entity.add(link.target);
  	      else if(topics.indexOf(link.source.text) != -1) entity.add(link.target.text);
       }
       
       for(let node of data.nodes){
  	      if(entity.has(node.text)){
  	      	if(node.type == "entity"){  //frequency filter
  	      		if(node.frequency >= node_freqfilter) new_nodes.push(node);
  	      		else entity.delete(node.text)
  	      	}
  	        else if(node.type == "topic"){   // delete linked other topics
  	        	   if(topics.indexOf(node.text) == -1){
  	        	   	 entity.delete(node.text);
  	        	   }
  	        	   else new_nodes.push(node);
  	        }
  	        else new_nodes.push(node);
  	      }
        }
                  
       for(let link of data.links){
  	       if(entity.has(link.target) && entity.has(link.source))
  	         new_links.push(link);
  	        else if(entity.has(link.target.text) && entity.has(link.source.text))
  	          new_links.push(link);
        }
       
       
       
       var linkscale = new_links.filter(function(d){return d.categ == "EE"});

           //scale for the edge length *unfinished unkown range
        var edgelengthscale = d3.scaleLinear()
                      .domain([1,d3.max(new_links.filter(function(d){return d.categ == "EE"}), function(d) { return parseInt(d.distance); })])
                      .range([100, 150]);
                      
               
         //scale for the edge brightness *unfinished unkown range
         var edgebrightscale = d3.scaleLinear()
                      .domain([1,d3.max(new_links.filter(function(d){return d.categ == "EE"}), function(d) { return parseInt(d.frequency); })])
                      .range([0.5, 1]);
  
  
        //scale for the the edge thickness 
       var edgethickscale = d3.scaleLinear()
                      .domain([1,d3.max(new_links.filter(function(d){return d.categ == "EE"}), function(d) { return parseInt(d.frequency); })])
                      .range([1, 5]);
                      
        //scale for the the class radius *unfinished
        var nodesizescale = d3.scaleLinear()
                      .domain([1,d3.max(new_nodes.filter(function(d){return d.type != "speaker"}), function(d) { return parseInt(d.frequency); })])
                      .range([20, 50]);     
       
         var simulation = d3.forceSimulation()
                   .force("charge", d3.forceManyBody().strength(-200))             
                    .force("link", d3.forceLink().id(function(d) { return d.text; }) 
                                                 .distance(function(d){
                                                 	 if(d.categ == "EE")
                    	                                   return edgelengthscale(d.distance);    	                   
                                                     else return 200;
                                                     })
                                                 .strength(0.3))
                    .force("x", d3.forceX(width / 2))
                    .force("y", d3.forceY(height / 2))         
                    .on("tick", ticked); 

       simulation.nodes(new_nodes);
       simulation.force('link').links(new_links);
       
        svg.call(tip);
    
         var link = svg.selectAll(".link")
                       .data(new_links)
                       .enter()
                       //.append("polyline")
                       .append('polyline')
                       .attr("class", "link")
                       .attr("class",function(d){
                       	  if(d.categ == "SE")
                              return 'dashed';
                          else
                               return 'solid';
                       })
                       .classed("link", true)
                       .attr("stroke","#999")
                       .attr("fill","None")
                       .attr("stroke-opacity",function(d){
                       	if(d.categ == "EE") return edgebrightscale(d.frequency);
                       	else return 0.5;
                       	})
                       .style("stroke-width", function(d) {
                       	if(d.categ == "EE") return edgethickscale(d.frequency);
                       	else return 2;
                       })
                       //.attr("marker-mid", function(d) { return "url(#link)"; });

     
          var node = svg.selectAll(".node")
                        .data(new_nodes)
                        .enter()
                        .append("g")
                        .attr("class","node");
  
          //append speaker to the graph
          var imgspeaker = node.filter(function(d){return d.type === "speaker"})
                               .append("image")
                               .attr("class","node-img")
                               .attr("width",function(d){return 50})
                               .attr("height",function(d){return 50})
                               .attr("x", function(d){return -25})
                               .attr("y", function(d){return -25})
                               .attr("xlink:href",function(d){return "img/speakers/"+d.text+".png"})
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
                                                          
          //appeand topics
          var imgtopics = node.filter(function(d){return d.type === "topic"})
                               .append("image")
                               .attr("class","node-img")
                               .attr("width",function(d){return nodesizescale(d.frequency)})
                               .attr("height",function(d){return nodesizescale(d.frequency)})
                               .attr("x", function(d){return nodesizescale(d.frequency)*(-1/2)})
                               .attr("y", function(d){return nodesizescale(d.frequency)*(-1/2)})
                               .attr("xlink:href",function(d){return "img/logos/"+wordclass["Context-Keyword"]+".png"})
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
          
          //append entities

          var imgcate = node.filter(function(d){return d.type === "entity"})
                    .append("image")
                    .attr("class","node-img")
                    .attr("width",function(d){return nodesizescale(d.frequency)})
                    .attr("height",function(d){return nodesizescale(d.frequency)})
                    .attr("x", function(d){return nodesizescale(d.frequency)*(-1/2)})
                    .attr("y", function(d){return nodesizescale(d.frequency)*(-1/2)})
                    .attr("xlink:href",function(d){return "img/logos/"+wordclass[d.categ]+".png"})
                    .call(drag(simulation))
                    .on("mouseover",function(d){
       	                           tip.show(d);
       	                             link.style('stroke', function(l) {      	                           	   
                                         if (d.text === l.source.text || d.text === l.target.text) return "#000";
                                         else return "#999";
                                       });   	                 
                                  })
                    .on("mouseout", function(d){ tip.hide(d);
                                     if(!d["click"]) link.style('stroke', function(l) {return "#999"});})

                    .on("click",function(d){nodeclick(d);});
        
           node.append("text")
               .style("font-size","12px")
               .attr("dx",5)
               .attr("dx", function(d){
               	if(d.type == "speaker") return 30; 
               	else return nodesizescale(d.frequency)/2 + 5;
                  })
               .attr("dy", ".35em")
                .text(function(d) { return d.text });
  
          node.filter(function(d){return d.type == "entity"})
              .append("circle")
              .attr("r", function(d){return nodesizescale(d.frequency)/2-1})
              .attr("fill", "None")
              .attr("stroke","#444");
      
          node.filter(function(d){return d.group;})
              .append("circle") 
              .attr("r", function(d){return nodesizescale(d.frequency)/2+2})
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
            function zoom_actions(){ d3.select("#conceptg").attr("transform", d3.event.transform) }
     
           //add zoom capabilities 
            var zoom_handler = d3.zoom().on("zoom", zoom_actions);

            zoom_handler(d3.select("#conceptsvg")); 
       
   
         function nodeclick(d){
      	
      	    var linkedByIndex = {};
            new_links.forEach(function(d) {
                linkedByIndex[d.source.index + "," + d.target.index] = 1;
                linkedByIndex[d.target.index + "," + d.source.index] = 1;
            });
              
      	   if(!d["click"]){
      	      d["click"] = true;
      	      d3.selectAll(".node-img").style("opacity",function(i){
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
      		 d3.selectAll(".node-img").style("opacity",function(i){return 1;})    		
      		link.style('stroke-opacity',function(l){return edgebrightscale(l.frequency);});
      			
      	}
      	function neighboring(a, b) { 
           return linkedByIndex[a.index + "," + b.index];
         
        }
       }
		
	}
	});
}
