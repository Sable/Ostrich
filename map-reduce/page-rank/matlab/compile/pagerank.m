function pagerank(n,iter,thresh,divisor)
max_diff   = 99;
d_factor   = 0.85;

page_ranks = zeros(1,n);
maps       = zeros(n);
noutlinks  = zeros(1,n);
pages      = zeros(n);

% read data
% fileID = fopen('pagerank.data','r');
% formatSpec = '%lf';
% expected_page_ranks = fscanf(fileID,formatSpec).'; %transpose to 1xn

% random_pages
if divisor <= 0
    disp('ERROR: Invalid divisor');
    disp(divisor);
    disp('for random initialization, divisor should be greater or equal to 1');
    return ;
end
for i = 1:n
    rand_mod    = mod(randi(10000,1,n),divisor) == 0;
    rand_mod(i) = 0;
    pages(i,:)  = rand_mod;
    noutlinks(i)= sum(rand_mod);
    if noutlinks(i) == 0
        k = i;
        while(k==i)
            k = mod(randi(10000),n) + 1;
        end
        pages(i,k) = 1;
        noutlinks(i) = 1;
    end
end
% init_array
page_ranks(:) = 1/n;

tic
for t = 1:iter
    if max_diff < thresh; break; end
    % map_page_rank
    for i = 1:n
       outbound_rank = page_ranks(i)/noutlinks(i);
       maps(i,:) = pages(i,:) .* outbound_rank;
    end
    % reduce_page_rank
    dif = 0;
    for j = 1:n
        old_rank = page_ranks(j);
        new_rank = sum(maps(:,j));
        new_rank = ((1-d_factor)/n)+(d_factor*new_rank);
        new_dif  = abs(new_rank - old_rank);
        if new_dif > dif
            dif = new_dif;
        end
        page_ranks(j) = new_rank;
    end
    max_diff = dif;
end
elapsedTime = toc;

% if and(n == 5000, and(iter == 10, and(thresh == 0.00000001, and(divisor, 100000))))
%     if sum(expected_page_ranks ~= page_ranks) ~= 0
%         error('ERROR: page_ranks differs from the expected value');
%     end
% else
%     warning('WARNING: No self-checking for n = %d, iter = %d, thresh = %lf, and divisor = %d\n', n, iter, thresh, divisor);
% end

disp('T reached'); disp(t);
disp('at max dif'); disp(max_diff);

disp('{');
disp(' "status": 1,');
disp(' "options": ');
disp('"');
disp(' -n'); disp(n);
disp(' -i'); disp(iter);
disp(' -t'); disp(thresh);
disp('",');
disp(' "time": ');
disp(elapsedTime);
disp('}');

end