function traversal_time = BFSGraph( no_of_nodes, verbose )
    starting = 1;
    no_of_edges = 2;
    
    dest = 1;
    weight = 2;

    expected_no_of_nodes = 3000000;
    expected_total_cost = 26321966;
    
    [h_graph_nodes, h_graph_mask, h_updating_graph_mask, h_graph_visited, h_cost, h_graph_edges] = InitializeGraph(no_of_nodes);
    
    stop = false;
    
    tic
    while 1
        for tid = 1:no_of_nodes
            if h_graph_mask(tid)
                h_graph_mask(tid) = 0;
                for i = h_graph_nodes(tid, starting) : (h_graph_nodes(tid, no_of_edges) + h_graph_nodes(tid, starting))
                    id = h_graph_edges(i);
                    if h_graph_visited(id) == 0
                        h_cost(id) = h_cost(tid) + 1;
                        h_updating_graph_mask(id) = 1;
                    end
                end
            end
        end
        
        for tid = 1:no_of_nodes
            if h_updating_graph_mask(tid)
                h_graph_mask(tid) = 1;
                h_graph_visited(tid) = 1;
                stop = 1;
                h_updating_graph_mask(tid) = 0;
            end
        end
        
        if stop
            break;
        end
    end
    traversal_time = toc;
end
