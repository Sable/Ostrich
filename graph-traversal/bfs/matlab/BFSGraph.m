function [h_cost] = BFSGraph(h_graph_nodes, h_graph_mask, h_updating_graph_mask, h_graph_visited, h_cost, h_graph_edges)
    h_graph_nodes_size = size(h_graph_nodes);
    no_of_nodes = h_graph_nodes_size(1);
    
    starting = 1;
    no_of_edges = 2;

    while 1
        running = 0;
        for tid = 1:no_of_nodes
            if h_graph_mask(tid) == 1
                h_graph_mask(tid) = 0;
                for i = h_graph_nodes(tid, starting) : (h_graph_nodes(tid, no_of_edges) + h_graph_nodes(tid, starting) - 1)
                    id = h_graph_edges(i);
                    if h_graph_visited(id) == 0
                        h_cost(id) = h_cost(tid) + 1;
                        h_updating_graph_mask(id) = 1;
                    end
                end
            end
        end

        for tid = 1:no_of_nodes
            if h_updating_graph_mask(tid) == 1
                h_graph_mask(tid) = 1;
                h_graph_visited(tid) = 1;
                running = 1;
                h_updating_graph_mask(tid) = 0;
            end
        end

        if running ~= 1
            break;
        end
    end
end
