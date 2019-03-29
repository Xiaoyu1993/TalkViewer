function drawTG(new_nodes,new_links){
	
	var width = screen.availWidth*0.7;
	var height = screen.availHeight-57-50-250;
	var timeline = [];
	var duration = 1000;
    var running = false;
    var timer;
    
    console.log(new_nodes);
    console.log(new_links);
	var timeline_o = [0];
	
	for(let link of new_links){
		for(let i of link.timeline){
			if(link.categ == "EE")
			    timeline_o.push(i);
		}
	}
	
	timeline_o = timeline_o.sort(function(a,b){return a-b;})


	for(let i = 0; i < timeline_o.length; i ++){
	    	if(timeline_o[i] == timeline_o[i-1]) continue;
	    	else timeline.push(timeline_o[i]);
	}
	

// node-link visualization
     svg = d3.select(".main-view")
              .append("div")
              .attr("id","Temporal-Graph-Container")
              .style("margin-left",function(){return 200 + "px"})
               .append("svg")
               .attr("width", width)
               .attr("height", height)
               .attr("id","conceptsvg")
               .append("g")
               .attr("id","conceptg")
 
 //slider bar
   	d3.select(".main-view").append("div")
                       .attr("id","slide-bar")  
                       
   
   sliderbar =  d3.select("#slide-bar")
                   .append("svg")
                   .style("margin-left","30px")
                  .attr("width",width)
                  .attr("height",50)
                  .append("g");
                                    
                  
   d3.json("./data/timeline.json").then(function(data){
   	
	    $("#slide-bar").remove();
	    
	    d3.select(".main-view").append("div")
                       .attr("id","slide-bar")  
	    
	    sliderbar =  d3.select("#slide-bar")
                   .append("svg")
                   .style("margin-left","30px")
                  .attr("width",width)
                  .attr("height",50)
                  .append("g");
	    
   	  let numbar = data.length;
   	    
      var sliderSimple = d3.sliderBottom()
                           .min(0)
                           .max(data.length)
                           .width(width)
                           .ticks(5)
                           .step(1)
                           .default(0)
                           .on('onchange', val => {
                              update();
    	                         // clearInterval(timer);
    	                          //$("#button-click").html("Play");
                           });
                                
   	  
   	  var barscale = d3.scaleLinear()
                      .domain([1,d3.max(data)])
                      .range([1, 40]);
                          
                      
      sliderbar.selectAll(".bar")
               .data(data)
               .enter()
               .append("rect")
               .attr("fill", function(d,i){
               	      if(timeline.indexOf(i) != -1) return "steelblue";
               	      else return "#ddd";
               	      })
               .attr("x",function(d,i){return i*width/numbar;})
               .attr("y",function(d,i){return 50 - barscale(d);})
               .attr("height",function(d){return barscale(d);})
               .attr("width",function(d,i){return width/numbar;})
     
     sliderslider =  d3.select("#slide-bar")
                       .append("svg")
                       .style("margin-left","30px")
                       .attr("width",width)  
                       .attr("height",50)
                       .append("g");
     
     sliderslider.call(sliderSimple);
     $("#slide-bar").append('<button type="button" class="btn btn-primary" id="button-click">Play</button>')
     
      
    $("#button-click").click(function(){
    	    if(running == true){   	  
    	   	 $("#button-click").html("Play");
    	     	   running = false;
    	    	   clearInterval(timer);
    	    }
    	    else if( running == false){  	   
    	    	   $("#button-click").html("Pause");   	    	    
    	    	    let sliderValue = sliderSimple.value();
    	    	    timer = setInterval(function(){
    	    	    	   if(sliderValue < timeline[timeline.length-1]){  	
    	    	    	   	if(timeline.indexOf(sliderValue) == -1){
    	    	    	   		for(i = 0; i < timeline.length; i++){
    	    	    	   			if (timeline[i] >= sliderValue ) {
                          sliderValue = timeline[i];
                          break;
                        }
                    }
    	    	    	   		sliderSimple.value(sliderValue); 
    	    	    	   	}
    	    	    	    else {
    	    	    	    	    sliderValue = timeline[timeline.indexOf(sliderValue)+1];
    	    	    	        sliderSimple.value(sliderValue); 
    	    	    	    }
    	    	    	   }      	    	    	   
    	    	    	    sliderSimple.value(sliderValue);   	    	       
    	    	    	    update();
    	    	    },duration);   	    	    
    	    	    running = true;
    	    }
    });
    //scale for the edge length *unfinished unkown range
  var edgelengthscale = d3.scaleLinear()
                      .domain([1,d3.max(new_links.filter(function(d){return d.categ == "EE"}), function(d) { return parseInt(d.distance); })])
                      .range([50, 100]);

  
  var tip = d3.tip()
               .attr('class', 'd3-tip')
               .offset([-8, 0])
               .html(function(d) {
               	  if(!d.group)  return d.text;
               	  else return d.text +","+ d.group;
                })
               
    //scale for the edge brightness *unfinished unkown range
  var edgebrightscale = d3.scaleLinear()
                      .domain([1,d3.max(new_links.filter(function(d){return d.categ == "EE"}), function(d) { return parseInt(d.frequency); })])
                      .range([0.1, 1]);
  
  
  //scale for the the edge thickness 
  var edgethickscale = d3.scaleLinear()
                      .domain([1,d3.max(new_links.filter(function(d){return d.categ == "EE"}), function(d) { return parseInt(d.frequency); })])
                      .range([1, 5]);
                      
   //scale for the the class radius *unfinished
  var nodesizescale = d3.scaleLinear()
                      .domain([1,d3.max(new_nodes.filter(function(d){return d.type != "speaker"}), function(d) { return parseInt(d.frequency); })])
                      .range([20, 50]);                    
                      
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
            
       
         var simulation = d3.forceSimulation()
                   .force("charge", d3.forceManyBody().strength(-200))             
                    .force("link", d3.forceLink().id(function(d) { return d.text; }).distance(function(d){return edgelengthscale(d.distance)}).strength(0.3))            
                    .force("x", d3.forceX(width / 2))
                    .force("y", d3.forceY(height / 2))         
                    .on("tick", ticked); 

       simulation.nodes(new_nodes);
       simulation.force('link').links(new_links);
       
        svg.call(tip);

         var link = svg.selectAll(".link")
                       .data(new_links)                  
                       .enter()
                       .filter(function(d){return d.categ === "EE"})
                       .append("polyline")
                       .attr("class", "link")
                       .classed("change-opacity", true)
                       .attr("stroke","#999")
                       .attr("fill","None")
                       .style("opacity",0)
                       .attr("stroke-opacity",function(d){return edgebrightscale(d.frequency)})
                       .style("stroke-width", function(d) { return edgethickscale(d.frequency) })
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
                               .classed("change-opacity", true)
                               .style("opacity",0)
                               .attr("width",function(d){return 50})
                               .attr("height",function(d){return 50})
                               .attr("x", function(d){return -25})
                               .attr("y", function(d){return -25})
                               .attr("xlink:href",function(d){return "img/speakers/"+d.text+".png"})
                  
                                                          
          //appeand topics
          var imgtopics = node.filter(function(d){return d.type === "topic"})
                               .append("image")
                               .attr("class","node-img")
                               .classed("change-opacity", true)
                               .style("opacity",0)
                               .attr("width",function(d){return nodesizescale(d.frequency)})
                               .attr("height",function(d){return nodesizescale(d.frequency)})
                               .attr("x", function(d){return nodesizescale(d.frequency)*(-1/2)})
                               .attr("y", function(d){return nodesizescale(d.frequency)*(-1/2)})
                               .attr("xlink:href",function(d){return "img/logos/"+wordclass["Context-Keyword"]+".png"})
                  
          //append entities

          var imgcate = node.filter(function(d){return d.type === "entity"})
                    .append("image")
                    .attr("class","node-img")
                    .classed("change-opacity", true)
                    .style("opacity",0)
                    .attr("width",function(d){return nodesizescale(d.frequency)})
                    .attr("height",function(d){return nodesizescale(d.frequency)})
                    .attr("x", function(d){return nodesizescale(d.frequency)*(-1/2)})
                    .attr("y", function(d){return nodesizescale(d.frequency)*(-1/2)})
                    .attr("xlink:href",function(d){return "img/logos/"+wordclass[d.categ]+".png"})
               
        
           node.append("text")
               .style("font-size","12px")
               .attr("dx",5)
               .style("opacity",0)
               .attr("class","node-img")
               .classed("change-opacity", true)
               .attr("dx", function(d){
               	if(d.type == "speaker") return 30; 
               	else return nodesizescale(d.frequency)/2 + 5;
                 })         
               .attr("dy", ".35em")
                .text(function(d) { return d.text });
  
          node.filter(function(d){return d.type == "entity"})
          	  .append("circle")
          	  .style("opacity",0)
              .attr("class","change-opacity")
              .attr("r", function(d){return nodesizescale(d.frequency)/2-1})
              .attr("fill", "None")
              .attr("stroke","#444");
      
          node.filter(function(d){return d.group;})
              .append("circle") 
              .attr("class","change-opacity")
              .style("opacity",0)
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
	
         update = function(){        	
         	//change the opacity of the nodes
         	d3.selectAll(".change-opacity").transition()
         	                         .duration(200)
         	                         .style("opacity",function(i){    
         	                         	time = sliderSimple.value();
         	                            if(i.timeline.indexOf(time) != -1)
         	                                return 1;        	                              
         	                            else if(parseInt(i.timeline[0]) < time) 
         	                                return 0.5;
         	                            else return 0;       	                         	
         	                         });
         }

   });
   		
}

