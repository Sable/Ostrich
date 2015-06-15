function runBfs(no_of_nodes)
    expected_no_of_nodes = 3000000;
    expected_total_cost = 26321966;

    fprintf(2, 'Initializing graph\n');
    input_nodes_file_path = fullfile(cd, '../data/', strcat('input-data-', num2str(no_of_nodes), '-nodes.csv'));
    input_edges_file_path = fullfile(cd, '../data/', strcat('input-data-', num2str(no_of_nodes), '-edges.csv'));
    if exist(input_nodes_file_path) && exist(input_edges_file_path)
        h_graph_nodes = csvread(input_nodes_file_path);  
        % Adjusting node ids to follow 1-based indexing in MATLAB
        h_graph_nodes(:,1) = h_graph_nodes(:,1) + 1;
        h_graph_mask = zeros(no_of_nodes, 1);
        h_updating_graph_mask = zeros(no_of_nodes, 1);
        h_graph_visited = zeros(no_of_nodes, 1);

        h_graph_edges = csvread(input_edges_file_path);
        % Adjusting node ids to follow 1-based indexing in MATLAB
        h_graph_edges = h_graph_edges + 1;

        h_cost = zeros(no_of_nodes, 1);
        
        % Initialize the first node
        h_graph_mask(1) = 1;
        h_graph_visited(1) = 1;
    else
        [h_graph_nodes, h_graph_mask, h_updating_graph_mask, h_graph_visited, h_cost, h_graph_edges] = InitializeGraph(no_of_nodes);
    end

    fprintf(2, 'Running BFS\n');
    tic();
    h_cost = BFSGraph(h_graph_nodes, h_graph_mask, h_updating_graph_mask, h_graph_visited, h_cost, h_graph_edges);
    traversal_time = toc();

    total_cost = 0;
    for i = 1:no_of_nodes
        total_cost = total_cost + h_cost(i);
    end

    if no_of_nodes == expected_no_of_nodes
        if total_cost ~= expected_total_cost
            fprintf(2, 'Wrong total cost %d expected %d', total_cost, expected_total_cost);
            disp('Error: wrong total cost');
        end
    else 
        output_cost_file_path = fullfile(cd, '../data/', strcat('output-data-', num2str(no_of_nodes), '.csv'));
        expected_costs = csvread(output_cost_file_path);
        if h_cost ~= expected_costs
            fprintf(2, 'Computed costs differ from expected costs\n');
        end
    end

    fprintf(1, '{ "status": 1, "options": null, "time": %f }\n', traversal_time);
end

