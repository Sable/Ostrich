function runPageRank(n, iter, thresh, divisor)
    fprintf(2, 'runPageRank\n');
    % random_pages
    if divisor < 1
        error('ERROR: Invalid divisor %d for random initialization, divisor should be greater or equal to 1\n', divisor);
    end

    filename = strcat('input-data-', num2str(n), '-', num2str(divisor), '.csv');
    filepath = fullfile(cd, '../data/', filename);
    if exist(filepath)
        fprintf(2, 'Loading cached random page matrix from %s\n', filepath);
        pages = csvread(filepath);
        noutlinks = sum(pages,2);
    else 
        fprintf(2, 'Creating random page matrix\n');
        [pages,noutlinks] = createRandomPageMatrices(n, divisor);
    end
    pageRanks = zeros(n,1);

    % Initialize pages weight uniformly at the beginning
    pageRanks(:) = 1/n;

    tic;
    [pageRanks,t,maxDiff] = pagerank(iter,thresh,pages,noutlinks,pageRanks,n);
    elapsedTime = toc;
    fprintf(2,'Threshold reached %d with max diff %f\n', t, maxDiff);

    validation_data_filename = strcat('output-data-',num2str(n),'-',num2str(iter), '-',num2str(thresh),'-',num2str(divisor), '.csv'); 
    validation_data_path = fullfile(cd, '../data/', validation_data_filename);
    if exist(validation_data_path) 
        expected_page_ranks = csvread(validation_data_path);        
        if sum(expected_page_ranks ~= pageRanks) ~= 0
            error('ERROR: pageRanks differs from the expected value');
            exit(1);
        end
    else
        warning('WARNING: No validation data found at %s, no self-checking for n = %d, iter = %d, thresh = %f, and divisor = %d\n', validation_data_path, n, iter, 10, thresh, divisor);
    end

    fprintf(1, '{ \"status\": %d, \"options\": \"-n %d -i %d -t %f\", \"time\": %f }\n', 1, n, iter, thresh, elapsedTime);
end
