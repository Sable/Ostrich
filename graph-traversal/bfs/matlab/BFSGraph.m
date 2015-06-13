function traversal_time = BFSGraph( no_of_nodes, verbose )
    starting = 1;
    no_of_edges = 2;

    dest = 1;
    weight = 2;

    expected_no_of_nodes = 3000000;
    expected_total_cost = 26321966;

    [h_graph_nodes, h_graph_mask, h_updating_graph_mask, h_graph_visited, h_cost, h_graph_edges] = InitializeGraph(no_of_nodes);

    tic();
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
    traversal_time = toc();

    total_cost = 0;
    for i = 1:no_of_nodes
      total_cost = total_cost + h_cost(i);
    end

    if no_of_nodes == expected_no_of_nodes
      if total_cost ~= expected_total_cost
        disp('Error: wrong total cost');
        disp(total_cost);
        disp(expected_total_cost);
      end
    end
end
