var MIN_NODES      = 20;
var MAX_NODES      = 1<<31;
var MIN_EDGES      = 2;
var MAX_INIT_EDGES = 4;
var MIN_WEIGHT     = 1;
var MAX_WEIGHT     = 1;

Math.commonRandom = (function() {
    var seed = 49734321;
    return function() {
        // Robert Jenkins' 32 bit integer hash function.
        seed = ((seed + 0x7ed55d16) + (seed << 12))  & 0xffffffff;
        seed = ((seed ^ 0xc761c23c) ^ (seed >>> 19)) & 0xffffffff;
        seed = ((seed + 0x165667b1) + (seed << 5))   & 0xffffffff;
        seed = ((seed + 0xd3a2646c) ^ (seed << 9))   & 0xffffffff;
        seed = ((seed + 0xfd7046c5) + (seed << 3))   & 0xffffffff;
        seed = ((seed ^ 0xb55a4f09) ^ (seed >>> 16)) & 0xffffffff;
        return seed;
    };
})();

Math.commonRandomJS = function () {
    return Math.abs(Math.commonRandom() / 0x7fffffff);
}

if (typeof performance === "undefined") {
    performance = Date;
}

function randomMatrix(matrix, max, min) {
    for(var i = 0; i < matrix.length; ++i) {
        //matrix[i] = Math.random()*(max-min) + min;
        matrix[i] = Math.abs(Math.commonRandomJS()) * (max-min) + min;
    }
}

function source(id){
    var programElement = document.getElementById(id);
    var programSource = programElement.text;
    if (programElement.src != "") {
        var mHttpReq = new XMLHttpRequest();
        mHttpReq.open("GET", programElement.src, false);
        mHttpReq.send(null);
        programSource = mHttpReq.responseText;
    } 
    return programSource;
}
function program(ctx, src){ return ctx.createProgram(src);}

function build(prgm, device){
    try {        
      prgm.build ([device], "");
    } catch(e) {
      alert ("Failed to build WebCL program. Error "
             + prgm.getBuildInfo (device, 
                                            WebCL.PROGRAM_BUILD_STATUS)
             + ":  " 
             + prgm.getBuildInfo (device, 
                                            WebCL.PROGRAM_BUILD_LOG));
      throw e;
    }
}

function webCLPlatformDevice(platformIdx, deviceIdx){
    var p = webcl.getPlatforms()[platformIdx];
    var d = p.getDevices(WebCL.DEVICE_TYPE_ALL)[deviceIdx];    
    return {"platform": p, "device": d};
}

function webCLContext(device){
    return webcl.createContext(device);
}

function isWebCL(){
    if (window.webcl == undefined) {
          alert("Unfortunately your system does not support WebCL. " +
                "Make sure that you have both the OpenCL driver " +
                "and the WebCL browser extension installed.");
          return false;
      }
      return true; 
}

function kernel(kernel, program){ return program.createKernel(kernel);}

function node(starting, no_of_edges) {
    return {
        "starting": starting,
        "no_of_edges": no_of_edges
    };
}


function edge(dest, weight) {
    return {
        "dest": dest,
        "weight": weight
    };
}

function InitializeGraph(no_of_nodes) {
    var h_graph_nodes = new Array(no_of_nodes);
    var h_graph_mask = new Uint32Array(no_of_nodes);
    var h_updating_graph_mask = new Uint32Array(no_of_nodes);
    var h_graph_visited = new Uint32Array(no_of_nodes);
    var h_cost = new Uint32Array(no_of_nodes);

    var source = 0;
    var graph = new Array(no_of_nodes);
    for (var i = 0; i < no_of_nodes; ++i) {
        graph[i] = [];
    }

    for (var i = 0; i < no_of_nodes; ++i) {
        var no_of_edges = Math.abs(Math.commonRandom() % ( MAX_INIT_EDGES - MIN_EDGES + 1 )) + MIN_EDGES;
        for (var j = 0; j < no_of_edges; ++j) {
            var node_id = Math.abs(Math.commonRandom() % no_of_nodes);
            var weight = Math.abs(Math.commonRandom() % ( MAX_WEIGHT - MIN_WEIGHT + 1 )) + MIN_WEIGHT;

            graph[i].push(edge(node_id, weight));
            graph[node_id].push(edge(i, weight));
        }
    }

    var total_edges = 0;
    for (var i = 0; i < no_of_nodes; ++i) {
        var no_of_edges = graph[i].length;
        h_graph_nodes[i] = node(total_edges, no_of_edges);
        h_graph_mask[i] = false;
        h_updating_graph_mask[i] = false;
        h_graph_visited[i] = false;

        total_edges += no_of_edges;
    }

    h_graph_mask[source] = true;
    h_graph_visited[source] = true;

    var h_graph_edges = new Int32Array(total_edges);

    var k = 0;
    for (var i = 0; i < no_of_nodes; ++i) {
        for (var j = 0; j < graph[i].length; ++j) {
            h_graph_edges[k] = graph[i][j].dest;
            ++k;
        }
    }

    for (var i = 0; i < no_of_nodes; ++i) {
        h_cost[i] = -1;
    }
    h_cost[source] = 0;

    return {
        h_graph_nodes: h_graph_nodes,
        h_graph_mask: h_graph_mask,
        h_updating_graph_mask: h_updating_graph_mask,
        h_graph_visited: h_graph_visited,
        h_cost: h_cost,
        h_graph_edges: h_graph_edges,
        edge_list_size: total_edges
    }
}
function BFSGraph(no_of_nodes, verbose) {
    if (verbose === undefined) {
        verbose = false;
    }
    var expected_no_of_nodes = 3000000;
    var expected_total_cost = 26321966; 
    var t1 = performance.now();
    var inits = InitializeGraph(no_of_nodes);
    var h_graph_nodes = inits.h_graph_nodes;
    var h_graph_mask = inits.h_graph_mask;
    var h_updating_graph_mask = inits.h_updating_graph_mask;
    var h_graph_visited = inits.h_graph_visited;
    var h_cost = inits.h_cost;
    var h_graph_edges = inits.h_graph_edges;
    var t2 = performance.now();
    var init_time = t2 - t1;

    var k = 0;
    var stop;

    t1 = performance.now();
    do {
        stop = false;

        for(var tid = 0; tid < no_of_nodes; ++tid) {
            if (h_graph_mask[tid]) {
                h_graph_mask[tid] = false;
                for ( var i = h_graph_nodes[tid].starting
                      ; i < (h_graph_nodes[tid].no_of_edges + h_graph_nodes[tid].starting)
                      ; ++i) {
                    var id = h_graph_edges[i];
                    if (!h_graph_visited[id]) {
                        h_cost[id] = h_cost[tid] + 1;
                        h_updating_graph_mask[id] = true;
                    }
                }
            }
        }

        for (var tid = 0; tid < no_of_nodes; ++tid) {
            if (h_updating_graph_mask[tid]) {
                h_graph_mask[tid] = true;
                h_graph_visited[tid] = true;
                stop = true;
                h_updating_graph_mask[tid] = false;
            }
        }
        ++k;
    }
    while(stop);
    t2 = performance.now();
    var traversal_time = t2 - t1;

    var total_cost = 0;
    for (var i=0; i<no_of_nodes; ++i) {
        total_cost += h_cost[i];
    }
    if (no_of_nodes == expected_no_of_nodes) {
        if (total_cost != expected_total_cost) {
            throw new Error("ERROR: the total cost obtained for '" + no_of_nodes + "' nodes is '" + total_cost + "' while the expected cost is '" + expected_total_cost + "'");
        }
    } else {
        console.log("WARNING: no self-checking step for '" + no_of_nodes + "' nodes, only valid for '" + expected_no_of_nodes + "' nodes");
    }

    console.log("Init time     : " + (init_time/1000) + " s");
    console.log("Traversal time: " + (traversal_time/1000) + " s");

    if (verbose) {
        for (var i = 0; i < no_of_nodes; ++i) {
            console.log(i + ") cost: " + h_cost[i]);
        }
    }
}

function printM(a, m, n){
    console.log("Printing Matrix:");    
    for(var i =0; i<m; ++i){
        console.log("[" + 
            Array.prototype.join.call(Array.prototype.slice.call(a, i*m, i*m + n), ",") +
            "]");
    }    
}

var hh;
function webclBFS(platformIdx, deviceIdx, noOfNodes){
    var programSourceId = "clBFS";
    var intBytes = 4;
    var blockSize = 16;
    var num_blocks, num_pages_last_block;

    var expected_no_of_nodes = 3000000;
    var expected_total_cost = 26321966;
    var inits = InitializeGraph(noOfNodes);
    var hGraphNodes = inits.h_graph_nodes;
    var hGraphMask = inits.h_graph_mask;
    var hUpdatingGraphMask = inits.h_updating_graph_mask;
    var hGraphVisited = inits.h_graph_visited;
    var hCost = inits.h_cost;
    var hGraphEdges = inits.h_graph_edges;
    var edgeListSize = inits.edge_list_size;
    var noOfNodesA = new Uint32Array([noOfNodes]);
    var hGraphNodesStarting = new Int32Array(noOfNodes);
    var hGraphNodesNoOfEdges = new Int32Array(noOfNodes);

    hGraphNodes.forEach(function (v, i){ 
      hGraphNodesStarting[i] = v.starting;
      hGraphNodesNoOfEdges[i] = v.no_of_edges;
    });

    var k = 0;
    var stop;

    var t1 = performance.now();
    try {      
        //============ Setup WebCL Program ================
        isWebCL();         
        var pd = webCLPlatformDevice(platformIdx, deviceIdx);        
        var ctx = webCLContext(pd.device);           
        var src = source(programSourceId);
        var prgm = program(ctx, src);
        build(prgm, pd.device);            
        var queue = ctx.createCommandQueue(pd.device);

        // ============== Initialize Kernels ================ 
        var bfsKernel1= kernel("kernel1", prgm);
        var bfsKernel2= kernel("kernel2", prgm);

        // // ============== Setup Kernel Memory ================     
        // memory has to be allocated in terms of bytes 

        var dGraphNodesStarting = ctx.createBuffer(WebCL.MEM_READ_ONLY, intBytes*noOfNodes);
        var dGraphNodesNoOfEdges = ctx.createBuffer(WebCL.MEM_READ_ONLY, intBytes*noOfNodes);
        var dGraphEdges = ctx.createBuffer(WebCL.MEM_READ_ONLY, intBytes*edgeListSize);
        var dGraphMask = ctx.createBuffer(WebCL.MEM_READ_WRITE, intBytes*noOfNodes);
        var dUpdatingGraphMask = ctx.createBuffer(WebCL.MEM_READ_WRITE, intBytes*noOfNodes);
        var dGraphVisited = ctx.createBuffer(WebCL.MEM_READ_WRITE, intBytes*noOfNodes);
        var dCost = ctx.createBuffer(WebCL.MEM_READ_WRITE,intBytes*noOfNodes); 
        var dOver = ctx.createBuffer(WebCL.MEM_WRITE_ONLY, intBytes);

        queue.enqueueWriteBuffer(dGraphNodesStarting, true, 0, intBytes*noOfNodes, hGraphNodesStarting); 
        queue.enqueueWriteBuffer(dGraphNodesNoOfEdges, true, 0, intBytes*noOfNodes, hGraphNodesNoOfEdges);
        queue.enqueueWriteBuffer(dGraphEdges, true, 0, intBytes*edgeListSize, hGraphEdges);
        queue.enqueueWriteBuffer(dGraphMask, true, 0, intBytes*noOfNodes, hGraphMask);
        queue.enqueueWriteBuffer(dUpdatingGraphMask, true, 0, intBytes*noOfNodes, hUpdatingGraphMask);
        queue.enqueueWriteBuffer(dGraphVisited, true, 0, intBytes*noOfNodes, hGraphVisited);
        queue.enqueueWriteBuffer(dCost, true, 0, intBytes*noOfNodes, hCost);
        queue.finish();

        // ============== Setup Kernel Args and Run================     
        bfsKernel1.setArg(0, dGraphNodesStarting);
        bfsKernel1.setArg(1, dGraphNodesNoOfEdges);
        bfsKernel1.setArg(2, dGraphEdges);
        bfsKernel1.setArg(3, dGraphMask);
        bfsKernel1.setArg(4, dUpdatingGraphMask);
        bfsKernel1.setArg(5, dGraphVisited);
        bfsKernel1.setArg(6, dCost);
        bfsKernel1.setArg(7, noOfNodesA);

        bfsKernel2.setArg(0, dGraphMask);
        bfsKernel2.setArg(1, dUpdatingGraphMask);
        bfsKernel2.setArg(2, dGraphVisited);
        bfsKernel2.setArg(3, dOver);
        bfsKernel2.setArg(4, noOfNodesA);

        var k =0;
        var stop = new Int32Array([0]);

       var maxThreads = pd.device.getInfo(WebCL.DEVICE_MAX_WORK_ITEM_SIZES); 
       maxThreads[0] = noOfNodes < maxThreads[0] ? noOfNodes : maxThreads[0];

       var workSize = [Math.floor(noOfNodes/maxThreads[0])*maxThreads[0] + ((noOfNodes%maxThreads[0]) == 0? 0 : maxThreads[0])];
       var localWorkSize = [maxThreads[0]];

       do{
         stop[0] = 0; 
         queue.enqueueWriteBuffer(dOver, true, 0, intBytes, stop);
         queue.finish();

         queue.enqueueNDRangeKernel(bfsKernel1, 1, null, workSize, localWorkSize);
         queue.finish();

         queue.enqueueNDRangeKernel(bfsKernel2, 1, null, workSize, localWorkSize);
         queue.finish(); 

         queue.enqueueReadBuffer(dOver, true, 0, intBytes, stop);
         queue.finish();
         ++k;
       }while (stop[0] == 1);

       queue.enqueueReadBuffer(dCost, true, 0, intBytes*noOfNodes, hCost);
       queue.finish();
      
       // ============== Free Memory ================ 
       dGraphNodesStarting.release();  
       dGraphNodesNoOfEdges.release(); 
       dGraphEdges.release(); 
       dGraphMask.release(); 
       dUpdatingGraphMask.release();
       dGraphVisited.release(); 
       dCost.release();
       dOver.release();
       bfsKernel1.release(); 
       bfsKernel2.release();
       queue.release(); 
       prgm.release(); 
       ctx.release();    
    }
    catch(e){
        alert(e);
    }
    var t2 = performance.now();
    console.log("Total time elapsed is " + (t2-t1)/1000 + " seconds");
    console.log(Array.prototype.join.call(hCost, ","));

    return { status: 1,
             options: null,
             time: (t2-t1) / 1000 };
}
