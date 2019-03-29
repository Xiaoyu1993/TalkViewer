
//import js 
document.write("<script type='text/javascript' src='./js/TextLevelView.js'></script>"); 
document.write("<script type='text/javascript' src='./js/EntityGraph.js'></script>");
document.write("<script type='text/javascript' src='./js/ConceptGraph.js'></script>"); 
document.write("<script type='text/javascript' src='./js/TemporalGraph.js'></script>");
document.write("<script type='text/javascript' src='./js/SpeakerGraph.js'></script>");
document.write("<script type='text/javascript' src='./js/EntityLevelView.js'></script>");
/*
button click function
clear the screen, run another function
*/
$("document").ready(function() {
  	
  	d3.select(".main-view")
  	  .style("height",function(){return screen.availHeight-57-50 +"px";})
  	  
  	var view = $('input[name="viewchange"]:checked').val(); 
  	drawTLV();
    
  	 $('.btn').click(function(){
  	   if(this.id != view){
  	   	  $(".main-view").empty();
  	   	  view = this.id;
  	      switch(this.id){
  	   	    case "TLV":
  	   	        drawTLV();
  	   		    break;
  	   	    case "ELV":
  	   	        drawELV();
  	   	        break;
  	        	case "EG":
  	        	    drawEG();
  	   	        break;
  	   	    case "SG":
  	   	        drawSG();
  	   	        break;    
  	   	    case "CC":
  	   	        drawCG();
  	   	        break; 
  	   	    }
  	     }

       });
       
            var width = 700;
            height = 62;
            legendNode = d3.select("body").append("div")
                           .attr("id", "legend")
                           .style("background","#F8F7F9")
                           .style("bottom",0)
                           .style("position","fixed")
                           .attr("class", "row");
            var basicLegend = legendNode.append("div")
                                .attr("class", "leftcolumn");
            basicLegend.append("p")	
                .attr("id", "tagleft")
                .text("Named entity categories");
            var splitBasicLegend = basicLegend.append("div")	
                                .attr("class", "row");
            var basicLeft = splitBasicLegend.append("div")	
                                .attr("class", "leftsubcolumn");
            var basicRight = splitBasicLegend.append("div")	
                                .attr("class", "rightsubcolumn");
            var abstractLegend = legendNode.append("div")	
                                    .attr("class", "rightcolumn"); 
            abstractLegend.append("p")	
                .attr("id", "tagright")
                .text("Additional categories");

            //add svgs in the layout
            //left column
            var svg = basicLeft.append("svg")
            .attr("id","leftsvg")
            .attr("width", width)
            .attr("height", height); 
            var color = ["#D48B43", "#CE5391", "#70C692"];//d3.scaleOrdinal(d3.schemeCategory10);
            var legendVals = d3.scaleOrdinal()
            .domain(["Person", "Measure", "Geo-Location"]);

            var legend = svg.selectAll('.legend')
            .data(legendVals.domain())
            .enter().append('g')
            .attr("class", "legends")
            .attr("transform", function (d, i) {
            pos_y = (i * 15) + 1; 
            return "translate(20," + pos_y + ")"
            })

            legend.append('rect')
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", 15)
            .attr("height", 10)
            .style("fill", function (d, i) {
            return color[i]
            })

            legend.append('text')
            .attr("x", 20)
            .attr("y", 10)
            //.attr("dy", ".35em")
            .text(function (d, i) {
            return d
            })
            .attr("class", "textselected")
            .style("text-anchor", "start")
            .style("font-size", 15)

            //middle column
            var svg = basicRight.append("svg")
            .attr("id","middlesvg")
            .attr("width", width)
            .attr("height", height); 
            var color = ["#F8D655", "#AAACA3", "#7FD2DF"];//d3.scaleOrdinal(d3.schemeCategory10);
            var legendVals = d3.scaleOrdinal()
            .domain(["Measuring-Unit", "Date/Time", "Organization"]);

            var legend = svg.selectAll('.legend')
            .data(legendVals.domain())
            .enter().append('g')
            .attr("class", "legends")
            .attr("transform", function (d, i) {
            pos_y = (i * 15) + 1; 
            return "translate(20," + pos_y + ")"
            })

            legend.append('rect')
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", 15)
            .attr("height", 10)
            .style("fill", function (d, i) {
            return color[i]
            })

            legend.append('text')
            .attr("x", 20)
            .attr("y", 10)
            //.attr("dy", ".35em")
            .text(function (d, i) {
            return d
            })
            .attr("class", "textselected")
            .style("text-anchor", "start")
            .style("font-size", 15)

            //right column
            var svg = abstractLegend.append("svg")
            .attr("id","rightsvg")
            .attr("width", width)
            .attr("height", height); 
            var color = ["#808CD5", "#A1B04C", "#DF7A72", "#AC8E77"];//d3.scaleOrdinal(d3.schemeCategory10);
            var legendVals = d3.scaleOrdinal()
            .domain(["Context-Keyword", "Positive-Emotion-Indicator", "Negative-Emotion-Indicator", "Politeness-Indicator"]);

            var legend = svg.selectAll('.legend')
            .data(legendVals.domain())
            .enter().append('g')
            .attr("class", "legends")
            .attr("transform", function (d, i) {
            pos_y = (i * 15) + 2; 
            return "translate(20," + pos_y + ")"
            })

            legend.append('rect')
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", 15)
            .attr("height", 10)
            .style("fill", function (d, i) {
            return color[i]
            })

            legend.append('text')
            .attr("x", 20)
            .attr("y", 10)
            //.attr("dy", ".35em")
            .text(function (d, i) {
            return d
            })
            .attr("class", "textselected")
            .style("text-anchor", "start")
            .style("font-size", 15)


});
