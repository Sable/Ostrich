
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


function mj_InitializeGraph(no_of_nodes) {

    var MIN_NODES      = 20;
    var MAX_NODES      = 1<<31;
    var MIN_EDGES      = 2;
    var MAX_INIT_EDGES = 4;
    var MIN_WEIGHT     = 1;
    var MAX_WEIGHT     = 1;


    var h_graph_nodes = mc_zeros(no_of_nodes, 2);
    var h_graph_mask = mc_zeros(no_of_nodes, 1);
    var h_updating_graph_mask = mc_zeros(no_of_nodes, 1);
    var h_graph_visited = mc_zeros(no_of_nodes, 1);
    var h_cost = mc_uminus_M(mc_ones(no_of_nodes, 1));


    var source = 1;
    var graph = new Array(no_of_nodes);
    for (var i = 0; i < no_of_nodes; ++i) {
        graph[i] = [];
    }

    console.log("building graph");
    for (var i = 1; i <= no_of_nodes; ++i) {
        var no_of_edges = Math.abs(Math.commonRandom() % ( MAX_INIT_EDGES - MIN_EDGES + 1 )) + MIN_EDGES;
        for (var j = 0; j < no_of_edges; ++j) {
            var node_id = Math.abs(Math.commonRandom() % no_of_nodes) + 1;
            var weight = Math.abs(Math.commonRandom() % ( MAX_WEIGHT - MIN_WEIGHT + 1 )) + MIN_WEIGHT;

            graph[i-1].push(edge(node_id, weight));
            graph[node_id-1].push(edge(i, weight));
        }
    }

    console.log("processing nodes");
    var total_edges = 0;
    for (var i = 1; i <= no_of_nodes; ++i) {
        var no_of_edges = graph[i-1].length;
        mc_array_set(h_graph_nodes, [i, 1], total_edges + 1);
        mc_array_set(h_graph_nodes, [i, 2], no_of_edges);
        mc_array_set(h_graph_mask, [i], 0);
        mc_array_set(h_updating_graph_mask, [i], 0);
        mc_array_set(h_graph_visited, [i], 0);

        total_edges += no_of_edges;
    }

    mc_array_set(h_graph_mask, [source], 1);
    mc_array_set(h_graph_visited, [source], 1);

    var h_graph_edges = mc_zeros(total_edges, 1);

    console.log("creating edges");
    var k = 1;
    for (var i = 0; i < no_of_nodes; ++i) {
        for (var j = 0; j < graph[i].length; ++j) {
            mc_array_set(h_graph_edges, [k], graph[i][j].dest);
            ++k;
        }
    }

    mc_array_set(h_cost, [source], 0);

    console.log("done");
    return [
        h_graph_nodes,
        h_graph_mask,
        h_updating_graph_mask,
        h_graph_visited,
        h_cost,
        h_graph_edges
    ];
}

function runBfs(no_nodes) {
    expected_no_nodes = 3000000;
    expected_total_cost = 26321966;

    console.log("Initializing Graph");
    graph = mj_InitializeGraph(no_nodes);

    h_graph_nodes = graph[0];
    h_graph_mask = graph[1];
    h_updating_graph_mask = graph[2];
    h_graph_visited = graph[3];
    h_cost = graph[4];
    h_graph_edges = graph[5];
    
    var t1 = performance.now();
    h_cost = BFSGraph(h_graph_nodes, h_graph_mask, h_updating_graph_mask, h_graph_visited, h_cost, h_graph_edges);
    var t2 = performance.now();

    var total_cost = 0;
    for (var i = 0; i < h_cost.length; ++i) {
        total_cost += h_cost[i];
    }

    if (no_nodes === expected_no_nodes) {
        if (expected_total_cost !== total_cost) {
            throw new Error("Invalid total_cost " + total_cost + ", expected " + expected_total_cost);
        }
    } else {
        console.log("WARNING: No self-checking for graph of size " + no_nodes);
    }

    return { status: 1,
             options: "runLud(" + no_nodes + ")",
             time: (t2-t1) / 1000 };
}
