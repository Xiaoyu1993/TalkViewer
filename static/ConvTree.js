var numbs = [ 4, 7, 8, 2, 3, 1, 23 ]

var jsonData =
{
    "name": "Root Level",
    "children": [{ 
        "name": "Top Level",
        "children": [{ 
            "name": "Level 2: A",
                "children": [
                    { "name": "Child1 of A" },
                    { "name": "Child2 of A",
                        "children": [
                            { "name": "Child1 of Child2" },
                            { "name": "Child2 of Child2" },
                            { "name": "Child3 of Child2" }
                        ]
                    },
                    { "name": "Child3 of A" },
                    { "name": "Child4 of A" },
                    { "name": "Child5 of A" }
                ]
            },
            { 
                "name": "Level 2: B",
                "children": [
                    { "name": "Child1 of B" },
                    { "name": "Child2 of B" },
                    { "name": "Child3 of B" }
                ]
            }
        ]
    }]
};

var localData = 
{
  "name": "GroundRoot",
  "children": [
    {
      "name": "<http://www.w3.org/2002/07/owl#Thing>",
      "children": [
        {
          "name": "<http://dbpedia.org/ontology/Place>",
          "children": [
            {
              "name": "<http://dbpedia.org/resource/Forest>"
            },
            {
              "name": "<http://dbpedia.org/ontology/PopulatedPlace>",
              "children": [
                {
                  "name": "<http://dbpedia.org/ontology/Settlement>",
                  "children": [
                    {
                      "name": "<http://dbpedia.org/resource/Overlook>"
                    }
                  ]
                }
              ]
            }
          ]
        },
        {
          "name": "<http://dbpedia.org/resource/Campus>"
        },
        {
          "name": "<http://dbpedia.org/ontology/Species>",
          "children": [
            {
              "name": "<http://dbpedia.org/ontology/Eukaryote>",
              "children": [
                {
                  "name": "<http://dbpedia.org/ontology/Plant>",
                  "children": [
                    {
                      "name": "<http://dbpedia.org/resource/Tree>"
                    }
                  ]
                }
              ]
            }
          ]
        },
        {
          "name": "<http://dbpedia.org/resource/Volumetric_flow_rate>"
        },
        {
          "name": "<http://dbpedia.org/ontology/ChemicalSubstance>",
          "children": [
            {
              "name": "<http://dbpedia.org/resource/Solution>"
            }
          ]
        },
        {
          "name": "<http://dbpedia.org/resource/Cliff>"
        }
      ]
    }
  ]
};

var initData = 
{
  "name": "GroundRoot",
  "children": [
    {
      "name": "<http://www.w3.org/2002/07/owl#Thing>",
      "children": []
    }
  ]
};

/*d3.json("conv.json", function(error, localData) {
    if (error) throw error;
    console.log(localData);
    buildHeap( localData )
});*/

$(document).ready(function() {
  console.log("try to connect");
  namespace = '/ontoTree';
  var socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port + namespace);

  socket.on('server_response', function(res) {
      console.log("Receive data: ", res);
      updateHeap( res.data );
  });
});

function updateHeap(newData) {
  newData.forEach( entity => {
    //buildHeap(root);
    insertPos = root.insert(entity); // insert the new data and return the root of the subtree
    console.log(insertPos);
    update(insertPos)
  });
}

var margin = {top: 90, right: 90, bottom: 60, left: 90},
    width = window.innerWidth * 0.4 - margin.left - margin.right,
    height = window.innerHeight * 0.9 - margin.top - margin.bottom;
    console.log(width);
    console.log(height);

var index = 0,
    duration = 1750,
    leafRadius = 20,
    nodeRadius = 10,
    root,
    startTime;

var counter = 0;
var treeData = {};
var colorMap = new Map();
var treeColors = d3.scaleOrdinal(d3.schemeSet2);

// just leaving this global so i can mess with it in the console
var nodes;
var root;

var svg = d3.select("#heap")
        .append("svg")
        .attr("width", width + margin.right + margin.left)
        .attr("height", height + margin.top + margin.bottom)

var g = svg.append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// Define the div for the tooltip
var divTip = d3.select("body").append("div")	
            .attr("class", "tooltip")				
            .style("opacity", 0);

buildHeap( initData )


function buildHeap(inData){

  var newsource = {name: inData[0], children: getChildren(0, inData) }
//   console.log('dl', newsource)

  //root = d3.hierarchy(newsource, function(d) { return d.children; });
  root = hierarchy(inData);

  console.log(root);

  root.x0 = width/2;
  root.y0 = 0;

  update.treeLayout = d3.tree()
                        .size([width, height]);
  
  start = Date.now();

  update(root)
}

function RetrieveColor(category) {
  if (category) {
    if (!colorMap.has(category))
      // current color scheme is based on d3 default colors
      colorMap.set(category, treeColors(colorMap.size));
    return colorMap.get(category);
  } else {
    return "gray";
  }
}

function update(source){
//  root = d3.hierarchy(newsource, function(d) { return d.children; });
    //if (typeof update.treeLayout == 'undefined')
    //  update.treeLayout = newLayout;
    var treeData = update.treeLayout(root)
    console.log(treeData);
    nodes = treeData.descendants();
    var links = treeData.descendants().slice(1);
    totalLevels = treeData.height;
    //console.log(totalLevels)
    d3.selectAll(".text").remove();

    // ****************** Nodes section ***************************
    // Update the nodes...
    var node = g.selectAll('g.node')
            .data(nodes, function(d) {
                return d.id || (d.id = ++index); 
            });
    console.log(nodes);
    // Enter any new nodes at the parent's previous position.
    var nodeEnter = node.enter().append('g')
                .attr('class', 'node')
                .attr("transform", function(d) {
                    return "translate(" + source.x0 + "," + (height - source.y0) + ")";
                })
                .on('click', click)
                .on("mouseover", function(d) {
                  console.log(d);
                  if(d.abstract)	{	
                    divTip.transition()		
                        .duration(200)		
                        .style("opacity", .9);		
                    divTip.html(d.abstract)	
                        .style("left", (d3.event.pageX + 40) + "px")		
                        .style("top", (d3.event.pageY) + "px");	
                  }
                })
                .on("mouseout", function(d) {
                  if(d.abstract)	{		
                    divTip.transition()		
                        .duration(500)		
                        .style("opacity", 0);	
                  }
                });
    console.log(nodeEnter)

    // Add Circle for the nodes
    nodeEnter.append('circle')
            .attr('class', 'node')
            .attr('r', 1e-6)
            .style("opacity", 1.0)
            .style("fill", "#fff");

    // Add labels for the nodes
    nodeEnter.append('text')
            .attr("dy", ".35em")
            //.attr("x", function(d) {
            //        return d.children || d._children ? -13 : 13;
            //})
            .attr("y", function(d) {
              return d.children ? nodeRadius+10 : leafRadius+10; 
            })
            .attr("text-anchor", function(d) {
                    //return d.children || d._children ? "end" : "start";
                    return d.children || d._children ? "middle" : "middle";
            })
            .text(function(d) { 
                word = d.data.name;
                word = word.substring(word.lastIndexOf("/")+1, word.length-1)
                return d.depth>0? word : null; 
            });

    // UPDATE
    var nodeUpdate = nodeEnter.merge(node);

    // Transition for still existing nodes
    nodeUpdate.transition()
            .duration(duration)
            .attr("transform", function(d) {
                return "translate(" + d.x + "," + (height - d.y) + ")";
            });

    // Update the node attributes and style
    nodeUpdate.select('circle.node')
            .attr('r', function(d) {
              if (d.thumbnail) // leave nodes
                return leafRadius;
              else //intermediate nodes
                return d.depth>0? nodeRadius : 0; // to draw the one on the ground as well
            })
            .style("fill", function(d, i) {
              //show thumbnaill or corresponding color
              if (!d.children && d.thumbnail) {
                var defs = svg.append("defs").attr("id", "imgdefs")

                var catpattern = defs.append("pattern")
                                        .attr("id", "catpattern" + i)
                                        .attr("height", 1)
                                        .attr("width", 1)

                var img_w = 90,
                    img_h = 90; 
                catpattern.append("image")
                        .attr("x", -(img_w/2 -leafRadius))
                        .attr("y", -(img_h/2 -leafRadius))
                        .attr("width", img_w)
                        .attr("height", img_h)
                        .attr("xlink:href", d.thumbnail)

                return "url(#catpattern" + i + ")";
              } else {
                return RetrieveColor(d.category);
              }
            })
            .attr('cursor', 'pointer');


    // Remove nodes that should be removed (move them to source than disappear)
    var nodeExit = node.exit().transition()
            .duration(duration)
            .attr("transform", function(d) {
                    return "translate(" + source.x + "," + (height - source.y) + ")";
                })
            .remove();

            // On exit reduce the node circles size to 0
    nodeExit.select('circle')
            .attr('r', 1e-6);

            // On exit reduce the opacity of text labels
    nodeExit.select('text')
            .style('fill-opacity', 1e-6);

    // ****************** links section ***************************

    // Update the links...
    var link = g.selectAll('path.link')
        .data(links, function(d) { return d.id; })
        .style("stroke-width", 20); 

    var linkEnter = link.enter().insert('path', "g")
        .attr("class", "link")
        .attr('d', function(d){
            var o = {y: source.y0, x: source.x0}
            return diagonal(o, o)
        });

    // UPDATE animation
    var linkUpdate = linkEnter.merge(link);
    g.selectAll("path.link")
        .style("stroke-width", function(d) {
            return (totalLevels - d.depth)*2 + 2; 
            //return 2;
        }); 

    // Transition for still existing links
    linkUpdate.transition()
        .duration(duration)
        .attr('d', function(d){ return diagonal(d, d.parent) });

    // Remove links that should be removed (move them to source than disappear)
    var linkExit = link.exit().transition()
        .duration(duration)
        .attr('d', function(d) {
            var o = {x: source.x, y: source.y}
            return diagonal(o, o)
        })
        .remove();

    // Store the old positions for transition.
    nodes.forEach(function(d, i){
    //   console.log(d)
        d.x0 = d.x;
        d.y0 = d.y;
    });

    //console.log(nodes[0])
    //nodes[0].data.children = nodes[0].data._children;
    //nodes[0].data._children = null;

}

// Takes an index and an array and finds all the children.
// returns an array which can be added to children of the root node to
// make a json thing which can be used to make a d3.hierarchy();
function getChildren(i, arr) {
  var childs = [];

  if( arr[i+1+ i] ){
    childs[0] = {name: arr[i*2+1], children: []}
    if( arr[i+i+2] ){
    //  console.log(arr[i+1+ i], arr[i+i+2])
      childs[1] = {name: arr[i * 2 + 2], children:[]}  ;
  }
  }

  var nextin = i * 2 + 1;
  if(arr[nextin*2+1]){
    //  console.log('more children')
      childs[0].children = getChildren(nextin, arr)
      childs[0]._children = null;

      if( arr[nextin*2 + 2 ]){
          childs[1].children = getChildren(nextin+1, arr);
          childs[1]._children = null;
      }
  }
  return childs;
}


// not called but kind of what I might use to annimate the swap thing while
// balancing binary heaps
function expandChildren(index, chi){
    setTimeout(function () {
        //buildHeap([ 4, 3, 2, 9, 14, 29] );
        console.log('hooho', nodes)
        if(nodes[index].children === null){
            nodes[0].children = [nodes[0]._children[chi]]
        }
        else{
            //console.log( typeof nodes[0]. children)
            nodes[index].children.push(nodes[index]._children[1])
        }
        // .h(nodes[0]._children[0]);
        //nodes[0]._children ;

        // console.log(nodes[index])
        update(nodes[index])
        if(chi < 1){
            expandChildren(0, 1)
        }
    }, 3000);
}

//expandChildren(0, 0);


// Creates a curved (diagonal) path from parent to the child nodes
// switched around all the x's and y's from orig so it's verticle
function diagonal(s, d) {
  //console.log('in diag and s = ', s);
  //console.log('d = ', d)


  //draw curve
  /*path = `M ${s.x} ${height-s.y}
          C ${(s.x + d.x) / 2} ${height-s.y},
            ${(s.x + d.x) / 2} ${height-d.y},
            ${d.x} ${height-d.y}`*/

  /*  M = moveto (start point)
      L = lineto (end point)
      C = curveto
  */
  //draw straight line
    path = `M ${s.x} ${height-s.y}
            L ${d.x} ${height-d.y}`
  //}

  //console.log(path);

  return path;

}


// Toggle children on click.
// d is the treeNode with layout, dataNode is the hierachy node
function click(d) {
// use the following to superficially change the text of the node.
//  this.getElementsByTagName('text')[0].textContent = "clicked all over"
  
    // remove all sunburst
    //d3.selectAll(".sunburst").remove();

    if (d.children) {
        d._children = d.children;
        d.children = null;
        //if d is not a children, show sunburst
        /*if(!d._children){
            setTimeout(function () {
                d3.json("flare.json", function(error, root_s) {
                    if (error) throw error;
                    
                    root_s = d3.hierarchy(root_s);
                    root_s.sum(function(d) { return d.size; });

                    var g_s = svg.append("g")
                                .attr('class', 'sunburst')
                                .attr("transform", "translate(" + (margin.left+d.x) + "," + (height+margin.top-d.y) + ")");

                    g_s.selectAll("path")
                        .data(partition(root_s).descendants())
                        .enter().append("path")
                        .attr("d", arc)
                        .style("fill", function(d) { return color((d.children ? d : d.parent).data.name); })
                        .style("opacity", 0.6)
                        .on("click", click_s)
                        .append("title")
                        .text(function(d) { return d.data.name + "\n" + formatNumber(d.value); });
                });
            }, 30);
        }*/
    } else {
      for (i = 0; i < 5; i++){
        candiText = "";
        if(i < d.candidate.length)
          candiText = i.toString() + ": " + d.candidate[i].slice(29,-1);
        if(d.data.name == d.candidate[i])
          candiText += " (Selected)"
        $("#label" + i.toString()).text(candiText);
      }

      $('#right').BootSideMenu.toggle();
  
      $('input[name="options"]').click( function() {
        //console.log(d.candidate);
        i_selected = $(this).val();
        if (i_selected >= 0 && i_selected < d.candidate.length) { // to make sure it is a valid selection
          var data = {};
          data['uri'] = d.candidate[i_selected];
          // Flask style post
          $.post("/customizeEntity", data, function(result,status){
              //alert('flask post');
              console.log(result)
              if(result.length > 0) {
                // fill out missing information
                result[0].candidate = d.candidate;
                result[0].sentence = d.sentence;
  
                //remove old branch
                /*singleParent = d;
                while (singleParent.parent.children.length == 1) {
                  singleParent = singleParent.parent;
                } 
                placeToRemove = singleParent.parent;
                //console.log($inArray(singleParent, placeToRemove.children));
                //singleParent._children = singleParent.children;
                placeToRemove.children = placeToRemove.children.filter(function(child){
                  return child.id != singleParent.id;
                });*/


                updateHeap(root.remove(d));
                
  
                //add new branch
                updateHeap(result);
              }
          },"json");
        }
      });

      d.children = d._children;
      d._children = null;
    }

  update(d);

}

// will make all the children null and store the real vals in _children
function collapse(d) {
  if(d.children) {
    d._children = d.children
    d.children = null;
    d._children.forEach(collapse)
  }
}



/*************************Sunburst Diagram************************** */
var width_s = 150,
    height_s = 150,
    radius = (Math.min(width_s, height_s) / 2) ;

var formatNumber = d3.format(",d");

var x = d3.scaleLinear()
    .range([0, 2 * Math.PI]);

var y = d3.scaleSqrt()
    .range([0, radius]);

var color = d3.scaleOrdinal(d3.schemeCategory10);

var partition = d3.partition();

var arc = d3.arc()
    .startAngle(function(d) { return Math.max(0, Math.min(2 * Math.PI, x(d.x0))); })
    .endAngle(function(d) { return Math.max(0, Math.min(2 * Math.PI, x(d.x1))); })
    .innerRadius(function(d) { return Math.max(0, y(d.y0)); })
    .outerRadius(function(d) { return Math.max(0, y(d.y1)); });


/*var svg_s = d3.select("body").append("svg")
    .attr("width", width_s)
    .attr("height", height_s)
  .append("g")
    .attr("transform", "translate(" + width_s / 2 + "," + (height_s / 2) + ")");*/



function click_s(d) {
  /*svg_s.transition()
      .duration(750)
      .tween("scale", function() {
        var xd = d3.interpolate(x.domain(), [d.x0, d.x1]),
            yd = d3.interpolate(y.domain(), [d.y0, 1]),
            yr = d3.interpolate(y.range(), [d.y0 ? 20 : 0, radius]);
        return function(t) { x.domain(xd(t)); y.domain(yd(t)).range(yr(t)); };
      })
    .selectAll("path")
    .attrTween("d", function(d) { return function() { return arc(d); }; });*/
    d3.selectAll(".sunburst").remove();
}

d3.select(self.frameElement).style("height", height_s + "px");

/*function m_tree() {
    var separation = defaultSeparation,
        dx = 1,
        dy = 1,
        nodeSize = null;
  
    function tree(root) {
      var t = treeRoot(root);
  
      // Compute the layout using Buchheim et al.’s algorithm.
      t.eachAfter(firstWalk), t.parent.m = -t.z;
      t.eachBefore(secondWalk);
  
      // If a fixed node size is specified, scale x and y.
      if (nodeSize) root.eachBefore(sizeNode);
  
      // If a fixed tree size is specified, scale x and y based on the extent.
      // Compute the left-most, right-most, and depth-most nodes for extents.
      else {
        var left = root,
            right = root,
            bottom = root;
        root.eachBefore(function(node) {
          if (node.x < left.x) left = node;
          if (node.x > right.x) right = node;
          if (node.depth > bottom.depth) bottom = node;
        });
        var s = left === right ? 1 : separation(left, right) / 2,
            tx = s - left.x,
            kx = dx / (right.x + s + tx),
            ky = dy / (bottom.depth || 1);
        root.eachBefore(function(node) {
          node.x = (node.x + tx) * kx;
          node.y = node.depth * ky;
        });
      }
  
      return root;
    }
  
    // Computes a preliminary x-coordinate for v. Before that, FIRST WALK is
    // applied recursively to the children of v, as well as the function
    // APPORTION. After spacing out the children by calling EXECUTE SHIFTS, the
    // node v is placed to the midpoint of its outermost children.
    function firstWalk(v) {
      var children = v.children,
          siblings = v.parent.children,
          w = v.i ? siblings[v.i - 1] : null;
      if (children) {
        executeShifts(v);
        var midpoint = (children[0].z + children[children.length - 1].z) / 2;
        if (w) {
          v.z = w.z + separation(v._, w._);
          v.m = v.z - midpoint;
        } else {
          v.z = midpoint;
        }
      } else if (w) {
        v.z = w.z + separation(v._, w._);
      }
      v.parent.A = apportion(v, w, v.parent.A || siblings[0]);
    }
  
    // Computes all real x-coordinates by summing up the modifiers recursively.
    function secondWalk(v) {
      v._.x = v.z + v.parent.m;
      v.m += v.parent.m;
    }
  
    // The core of the algorithm. Here, a new subtree is combined with the
    // previous subtrees. Threads are used to traverse the inside and outside
    // contours of the left and right subtree up to the highest common level. The
    // vertices used for the traversals are vi+, vi-, vo-, and vo+, where the
    // superscript o means outside and i means inside, the subscript - means left
    // subtree and + means right subtree. For summing up the modifiers along the
    // contour, we use respective variables si+, si-, so-, and so+. Whenever two
    // nodes of the inside contours conflict, we compute the left one of the
    // greatest uncommon ancestors using the function ANCESTOR and call MOVE
    // SUBTREE to shift the subtree and prepare the shifts of smaller subtrees.
    // Finally, we add a new thread (if necessary).
    function apportion(v, w, ancestor) {
      if (w) {
        var vip = v,
            vop = v,
            vim = w,
            vom = vip.parent.children[0],
            sip = vip.m,
            sop = vop.m,
            sim = vim.m,
            som = vom.m,
            shift;
        while (vim = nextRight(vim), vip = nextLeft(vip), vim && vip) {
          vom = nextLeft(vom);
          vop = nextRight(vop);
          vop.a = v;
          shift = vim.z + sim - vip.z - sip + separation(vim._, vip._);
          if (shift > 0) {
            moveSubtree(nextAncestor(vim, v, ancestor), v, shift);
            sip += shift;
            sop += shift;
          }
          sim += vim.m;
          sip += vip.m;
          som += vom.m;
          sop += vop.m;
        }
        if (vim && !nextRight(vop)) {
          vop.t = vim;
          vop.m += sim - sop;
        }
        if (vip && !nextLeft(vom)) {
          vom.t = vip;
          vom.m += sip - som;
          ancestor = v;
        }
      }
      return ancestor;
    }
  
    function sizeNode(node) {
      node.x *= dx;
      node.y = node.depth * dy;
    }
  
    tree.separation = function(x) {
      return arguments.length ? (separation = x, tree) : separation;
    };
  
    tree.size = function(x) {
      return arguments.length ? (nodeSize = false, dx = +x[0], dy = +x[1], tree) : (nodeSize ? null : [dx, dy]);
    };
  
    tree.nodeSize = function(x) {
      return arguments.length ? (nodeSize = true, dx = +x[0], dy = +x[1], tree) : (nodeSize ? [dx, dy] : null);
    };
  
    return tree;
  }*/