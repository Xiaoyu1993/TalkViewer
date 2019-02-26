/************************************ D3 Visualization ***********************************/
console.log('Hello from main.js');

// The id for the movie that is currently inspecting
curIndex = 0;

// some margins for our graph (so it fits our SVG viewport nicely)
var margin = {
    top: 20,
    right: 20,
    bottom: 30,
    left: 80
};

// create our SVG canvas and give it the height and width we want
var body = d3.select("body")
/******************************* Force Graph **************************/
nodeList = [{"id": "Myriel", "credit": 6},
{"id": "Napoleon", "credit": 3},
{"id": "Mlle.Baptistine", "credit": 5},
{"id": "Mme.Magloire", "credit": 2},
{"id": "CountessdeLo", "credit": 5}];
linkList = [{"source": "Napoleon", "target": "Myriel", "value": 5},
{"source": "Mlle.Baptistine", "target": "Myriel", "value": 8},
{"source": "Mme.Magloire", "target": "Myriel", "value": 7},
{"source": "Mme.Magloire", "target": "Mlle.Baptistine", "value": 6},
{"source": "CountessdeLo", "target": "Myriel", "value": 5}];
DrawNetwork(nodeList, linkList);

function DrawNetwork(nodeList, linkList){
    console.log("in DrawNetwork()!")
    var n_margin = {top: 20, right: 20, bottom: 30, left: 40},
    n_width = 1200 - margin.left - margin.right,
    n_height = 800 - margin.top - margin.bottom;
  
    element = document.getElementById("network");
    if(element != null){
      element.parentNode.removeChild(element);
    }
  
    d3.select("#left").append("div")	
      .attr("id", "network");
  
    var svg = d3.select("#network").append("svg")
    .attr("width", n_width + n_margin.left + n_margin.right)
    .attr("height", n_height + n_margin.top + n_margin.bottom)
    .append("g")
    .attr("transform", "translate(" + n_margin.left + "," + n_margin.top + ")");
  
  
    var color = d3.scaleOrdinal(d3.schemeCategory20);
  
    var simulation = d3.forceSimulation()
        .force("link", d3.forceLink().id(function(d) { return d.id; })
                                    .distance(function(d) { return 500-d.value*30; })
                                    //.strength(function(d) {return 0.75; })
                                )
        .force("charge", d3.forceManyBody())
        .force("center", d3.forceCenter(n_width / 2, n_height / 2));
  
    var link = svg.append("g")
        .attr("class", "links")
        .attr("fill", "#16C0B0")
        .selectAll("line")
        .data(linkList)
        .enter().append("line")
        .attr("stroke-width", function(d) { return d.value; });
  
    var node = svg.append("g")
        .attr("class", "nodes")
      .selectAll("g")
      .data(nodeList)
      .enter().append("g")
      
    var circles = node.append("circle")
        .attr("r", function(d) { return d.credit*6;})
        .attr("fill", "#16C0B0")
        .call(d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended));
  
    var lables = node.append("text")
        .text(function(d) {
          return d.id;
        })
        .attr('x', 6)
        .attr('y', 3);
  
    node.append("title")
        .text(function(d) { return d.id; });
  
    simulation
        .nodes(nodeList)
        .on("tick", ticked);
  
    simulation.force("link")
        .links(linkList);
  
    function ticked() {
      link
          .attr("x1", function(d) { return d.source.x; })
          .attr("y1", function(d) { return d.source.y; })
          .attr("x2", function(d) { return d.target.x; })
          .attr("y2", function(d) { return d.target.y; });
  
      node
          .attr("transform", function(d) {
            return "translate(" + d.x + "," + d.y + ")";
          })
    }
  
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
  }