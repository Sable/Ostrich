function [h_graph_nodes, h_graph_mask, h_updating_graph_mask, h_graph_visited, h_cost, h_graph_edges] = InitializeGraph(no_of_nodes)
  MIN_NODES      = 20;
  MAX_NODES      = bitshift(1, 31);
  MIN_EDGES      = 2;
  MAX_INIT_EDGES = 4;
  MIN_WEIGHT     = 1;
  MAX_WEIGHT     = 1;

  DEST = 1;
  WEIGHT = 2;
  STARTING = 1;
  NO_OF_EDGES = 2;

  h_graph_nodes = zeros(no_of_nodes, 2);
  h_graph_mask = zeros(no_of_nodes, 1);
  h_updating_graph_mask = zeros(no_of_nodes, 1);
  h_graph_visited = zeros(no_of_nodes, 1);
  h_cost = -ones(no_of_nodes, 1);

  source = 1;
  graph = {};
  for i = 1:no_of_nodes
    graph{i} = {};
  end

  for i = 1:no_of_nodes
    no_of_edges = abs(mod(commonRandom(), MAX_INIT_EDGES - MIN_EDGES + 1)) + MIN_EDGES;
    for j = 1:no_of_edges
      node_id = abs(mod(commonRandom(), no_of_nodes)) + 1;
      weight = abs(mod(commonRandom(), (MAX_WEIGHT - MIN_WEIGHT + 1))) + MIN_WEIGHT;

      graph{i}{end+1} = edge(node_id, weight);
      graph{node_id}{end+1} = edge(i, weight);
    end
  end

  total_edges = 0;
  for i = 1:no_of_nodes
    no_of_edges = length(graph{i});
    h_graph_nodes(i, STARTING) = total_edges + 1;
    h_graph_nodes(i, NO_OF_EDGES) = no_of_edges;
    h_graph_mask(i) = 0;
    h_updating_graph_mask(i) = 0;
    h_graph_visited(i) = 0;

    total_edges = total_edges + no_of_edges;
  end

  h_graph_mask(source) = 1;
  h_graph_visited(source) = 1;

  h_graph_edges = zeros(total_edges, 1);
  k = 1;
  for i = 1:no_of_nodes
    for j = 1:length(graph{i})
      h_graph_edges(k) = graph{i}{j}(DEST);
      k = k+1;
    end
  end

  h_cost(source) = 0;

  % Save data to disk
  save('h_graph_nodes.mat', 'h_graph_nodes');
  save('h_graph_mask.mat', 'h_graph_mask');
  save('h_updating_graph_mask.mat', 'h_updating_graph_mask');
  save('h_graph_visited.mat', 'h_graph_visited');
  save('h_cost.mat', 'h_cost');
  save('h_graph_edges.mat', 'h_graph_edges');
end
