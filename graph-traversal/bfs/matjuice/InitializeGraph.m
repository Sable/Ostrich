function [h_graph_nodes, h_graph_mask, h_updating_graph_mask, h_graph_visited, h_cost, h_graph_edges] = InitializeGraph(no_of_nodes)
  h_graph_nodes = zeros(no_of_nodes, 2);
  h_graph_mask = zeros(no_of_nodes, 1);
  h_updating_graph_mask = zeros(no_of_nodes, 1);
  h_graph_visited = zeros(no_of_nodes, 1);
  h_cost = -ones(no_of_nodes, 1);
  h_graph_edges = zeros(no_of_nodes, 1);
end
