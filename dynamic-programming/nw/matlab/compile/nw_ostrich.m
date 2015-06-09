function nw_ostrich(size,penalty)
bound_value = [0, 10000];

input_seq_1_size = size;
input_seq_2_size = size;
nb_possible_seq_items = 10;
print_results = 0;
print_intermediary_results = 0;
use_parallelizable_version = 1;

if or(nb_possible_seq_items < 1, nb_possible_seq_items > 24)
    disp('ERROR: The number of different items to generate should be between 1 and 24.');
    return ;
end

max_rows = input_seq_1_size;
max_cols = input_seq_2_size;
reference= zeros(max_rows, max_cols);
input_itemsets = zeros(max_rows, max_cols);
input_seq_1 = zeros(1, max_rows);
input_seq_2 = zeros(1, max_cols);
aligned_seq_size = input_seq_1_size + input_seq_2_size;
aligned_seq_1 = zeros(1, aligned_seq_size) - 1;
aligned_seq_2 = zeros(1, aligned_seq_size) - 1;

for i = 2:max_rows
    input_seq_1(i) = 1 + mod(randi(bound_value), nb_possible_seq_items);
end

for i = 2:max_cols
    input_seq_2(i) = 1 + mod(randi(bound_value), nb_possible_seq_items);
end

% random set
charset = ['a':'z' 'A':'Z' '0':'9'];
charlen = length(charset);

% expected_aligned_seq_1 '%c'
expected_aligned_seq_1 = charset(randi([1 charlen], 1, 8192));
expected_aligned_seq_1_size = length(expected_aligned_seq_1);

expected_aligned_seq_2 = charset(randi([1 charlen], 1, 8192));
expected_aligned_seq_2_size = length(expected_aligned_seq_2);

if print_results
    disp('Computing dynamic programming results');
end

% blosum62, random
blosum62 = randi(bound_value,24,24);
tic
for i = 2:max_rows
    for j = 2:max_cols
        reference(i,j) = blosum62(input_seq_1(i), input_seq_2(j));
    end
end

input_itemsets(2:max_rows, 1) = -1 * (1:max_rows-1) * penalty;
input_itemsets(1, 2:max_rows) = -1 * (1:max_rows-1) * penalty;
if use_parallelizable_version
    for i = 1:max_cols-2
        for idx = 1:i+1
            index = idx * max_cols + i + 2 - idx;
            input_itemsets(index) = max(input_itemsets(index-1-max_cols)+reference(index),...
                max(input_itemsets(index - 1)     - penalty,...
                input_itemsets(index - max_cols)  - penalty));
        end
    end
    for k = (max_rows+1):(2*max_rows-1)
        for u = 1:(2*max_rows-k)
            rowi = max_rows - u + 1;
            colj = k - max_cols + u;
            input_itemsets(rowi, colj) = max(input_itemsets(rowi-1, colj-1)+reference(rowi,colj),...
                max(input_itemsets(rowi, colj-1) - penalty,...
                input_itemsets(rowi-1,colj)      - penalty));
        end
    end
else
    for i = 2:max_rows
        for j = 2:max_cols
            input_itemsets(i, j) = max(input_itemsets(i-1, j-1) + reference(i, j),...
                max(input_itemsets(i, j-1) - penalty, ...
                input_itemsets(i-1, j)     - penalty));
        end
    end
end
elapsedTime = toc;

aligned_index_1 = aligned_seq_size - 1;
aligned_index_2 = aligned_seq_size - 1;
if print_results
    disp('Trace solution back');
end

i = max_rows;
j = max_cols;
while or(i>1, j>1)
    if and(i>1, j>1)
        nw = input_itemsets(i-1, j-1) + reference(i, j);
        w  = input_itemsets(i, j-1) + penalty;
        n  = input_itemsets(i-1, j) + penalty;
        n_limit = 0;
        w_limit = 0;
        traceback = max(nw, max(w, n));
    elseif i == 1
        n_limit = 1;
        w_limit = 0;
    elseif j == 1
        n_limit = 0;
        w_limit = 1;
    else
        disp('ERROR1');
        return;
    end
    if and(n_limit == 0, and(w_limit == 0, traceback == nw))
        aligned_seq_1(aligned_index_1) = input_seq_1(i);
        aligned_seq_2(aligned_index_2) = input_seq_2(j);
        aligned_index_1 = aligned_index_1 - 1; i = i - 1;
        aligned_index_2 = aligned_index_2 - 1; j = j - 1;
    elseif or(n_limit == 1, traceback == w)
        aligned_index_1 = aligned_index_1 - 1;
        aligned_seq_2(aligned_index_2) = input_seq_2(j);
        aligned_index_2 = aligned_index_2 - 1; j = j - 1;
    elseif or(w_limit == 1, traceback == n)
        aligned_index_2 = aligned_index_2 - 1;
        aligned_seq_1(aligned_index_1) = input_seq_1(i);
        aligned_index_1 = aligned_index_1 - 1; i = i - 1;
    else
        disp('ERROR2');
        return;
    end
end

if print_results
    disp('Input Seq 1  :');
    char(input_seq_1(2:max_rows));
    disp('Input Seq 2  :');
    char(input_seq_2(2:max_cols));
    disp('Aligned Seq 1:');
    char(aligned_seq_1);
    disp('Aligned Seq 2:');
    char(aligned_seq_2);
    if print_intermediary_results
        op = ['-', '+'];
        for i = 1:max_rows
            for j = 1:max_cols
                fprintf('%c%.2d ',op(1 + (input_itemsets(i,j) >= 0)), abs(input_itemsets(i,j)));
            end
            fprintf('\n');
        end
    end
end

if and(input_seq_1_size == 4096, and(input_seq_2_size == 4096, and(penalty == 1, nb_possible_seq_items == 10)))
    if or(aligned_seq_size ~= expected_aligned_seq_1_size, 0 < sum(aligned_seq_1 ~= expected_aligned_seq_1))
        disp('ERROR: the aligned sequence 1 is different from the values expected.');
        return ;
    end
    if or(aligned_seq_size ~= expected_aligned_seq_2_size, 0 < sum(aligned_seq_2 ~= expected_aligned_seq_2))
        disp('ERROR: the aligned sequence 2 is different from the values expected.');
        return ;
    end
else
    disp('No self-checking for dimension'); disp(input_seq_1_size);
    disp('penalty'); disp(penalty);
    disp('and number of possible items'); disp(nb_possible_seq_items);
end

disp('{');
disp(' "status": 1,');
disp(' "options": ');
disp('"');
disp(' -n'); disp(input_seq_1_size);
disp(' -g'); disp(penalty);
disp('",');
disp(' "time": ');
disp(elapsedTime);
disp('}');

end