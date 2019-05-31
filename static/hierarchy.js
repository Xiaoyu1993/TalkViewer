function node_count() {
  return this.eachAfter(count);
}

function node_each(callback) {
  var node = this, current, next = [node], children, i, n;
  do {
    current = next.reverse(), next = [];
    while (node = current.pop()) {
      callback(node), children = node.children;
      if (children) for (i = 0, n = children.length; i < n; ++i) {
        next.push(children[i]);
      }
    }
  } while (next.length);
  return this;
}

function node_eachBefore(callback) {
  var node = this, nodes = [node], children, i;
  while (node = nodes.pop()) {
    callback(node), children = node.children;
    if (children) for (i = children.length - 1; i >= 0; --i) {
      nodes.push(children[i]);
    }
  }
  return this;
}

function node_eachAfter(callback) {
  var node = this, nodes = [node], next = [], children, i, n;
  while (node = nodes.pop()) {
    next.push(node), children = node.children;
    if (children) for (i = 0, n = children.length; i < n; ++i) {
      nodes.push(children[i]);
    }
  }
  while (node = next.pop()) {
    callback(node);
  }
  return this;
}

function node_sum(value) {
  return this.eachAfter(function(node) {
    var sum = +value(node.data) || 0,
        children = node.children,
        i = children && children.length;
    while (--i >= 0) sum += children[i].value;
    node.value = sum;
  });
}

function node_sort(compare) {
  return this.eachBefore(function(node) {
    if (node.children) {
      node.children.sort(compare);
    }
  });
}

function node_path(end) {
  var start = this,
      ancestor = leastCommonAncestor(start, end),
      nodes = [start];
  while (start !== ancestor) {
    start = start.parent;
    nodes.push(start);
  }
  var k = nodes.length;
  while (end !== ancestor) {
    nodes.splice(k, 0, end);
    end = end.parent;
  }
  return nodes;
}

function leastCommonAncestor(a, b) {
  if (a === b) return a;
  var aNodes = a.ancestors(),
      bNodes = b.ancestors(),
      c = null;
  a = aNodes.pop();
  b = bNodes.pop();
  while (a === b) {
    c = a;
    a = aNodes.pop();
    b = bNodes.pop();
  }
  return c;
}

function node_ancestors() {
  var node = this, nodes = [node];
  while (node = node.parent) {
    nodes.push(node);
  }
  return nodes;
}

function node_descendants() {
  var nodes = [];
  this.each(function(node) {
    nodes.push(node);
  });
  return nodes;
}

function node_leaves() {
  var leaves = [];
  this.eachBefore(function(node) {
    if (!node.children) {
      leaves.push(node);
    }
  });
  return leaves;
}

function node_links() {
  var root = this, links = [];
  root.each(function(node) {
    if (node !== root) { // Don’t include the root’s parent, if any.
      links.push({source: node.parent, target: node});
    }
  });
  return links;
}

function hierarchy(data, children) {
  var root = new Node(data),
      valued = +data.value && (root.value = data.value),
      node,
      nodes = [root],
      child,
      childs,
      i,
      n;

  if (children == null) children = defaultChildren;

  while (node = nodes.pop()) {
    if (valued) node.value = +node.data.value;
    if ((childs = children(node.data)) && (n = childs.length)) {
      node.children = new Array(n);
      for (i = n - 1; i >= 0; --i) {
        nodes.push(child = node.children[i] = new Node(childs[i]));
        child.parent = node;
        child.depth = node.depth + 1;
      }
    }
  }

  return root.eachBefore(computeHeight);
}

function node_copy() {
  return hierarchy(this).eachBefore(copyData);
}

function defaultChildren(d) {
  return d.children;
}

function copyData(node) {
  node.data = node.data.data;
}

function computeHeight(node) {
  var height = 0;
  do node.height = height;
  while ((node = node.parent) && (node.height < ++height));
}

function node_insert(entity) {
  if (!entity.strPath){
    console.log("ERROR: Invalid input for insert!");
    return;
  }

  pathName = entity.strPath.split('&-&');
  if (pathName[0] != "<http://www.w3.org/2002/07/owl#Thing>"){
    console.log("ERROR: Invalid input for insert!");
    return;
  }

  console.log(this);
  var node = this; // make nodeData points to root
  var nodes = [node];
  var insertPos = null;

  pathName.forEach(name => {
    var contains = false;

    // check if current name already exists
    if (node.children) {
      for (i = 0; i < node.children.length; i++) {
        if (node.children[i].data.name == name){
          contains = true;
          insertPos = node.children[i]; // update insertion place
          break;
        }
      }
    } else {
      node.children = new Array(0);
    }

    // insert new node
    if (!contains){
      // create a new node
      var newNode = new Node({name:name, children:[]});
      newNode.parent = node;
      newNode.depth = node.depth + 1;
      newNode.height = 0;
      newNode.abstract = entity.abstract;
      newNode.thumbnail = entity.thumbnail;
      newNode.candidate = entity.candidate;
      newNode.sentence = entity.sentence;
      // push the new node into node.children
      node.children.push(newNode);
    }

    // update node
    for (i = 0; i < node.children.length; i++) {
      if (node.children[i].data.name == name){
        node = node.children[i];
        nodes.push(node);
        break;
      }
    }
  });

  // trace back to update the .data domain of related nodes
  newData = {
    name: nodes.pop().data.name
  }
  h = 0;
  while (node = nodes.pop()) {
    // update height (refer to the definition of height)
    h++;
    if(h > node.height)
        node.height = h;
    // update data
    if (node.depth < insertPos.depth){
      node.data.children.forEach(child => {
        if (child.name == newData.name)
          child = newData;
      });
    }
    else
      node.data.children.push(newData);
    newData = node.data;
  }

  console.log(this);
  return insertPos;
}

function Node(data) {
  this.data = data;
  this.depth =
  this.height = 0;
  this.parent = null;
  this.abstract = null;
  this.thumbnail = null;
  this.candidate = null;
  this.sentence = null;
}

Node.prototype = hierarchy.prototype = {
  constructor: Node,
  count: node_count,
  each: node_each,
  eachAfter: node_eachAfter,
  eachBefore: node_eachBefore,
  sum: node_sum,
  sort: node_sort,
  path: node_path,
  ancestors: node_ancestors,
  descendants: node_descendants,
  leaves: node_leaves,
  links: node_links,
  copy: node_copy,
  insert: node_insert
};