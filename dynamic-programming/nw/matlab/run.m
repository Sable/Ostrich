function time = run(n, penalty, nb_possible_items)
  max_rows = n+1;
  max_cols = n+1;

  reference = zeros(max_rows, max_cols);
  input_itemset = zeros(max_rows, max_cols);
  input_seq_1 = zeros(max_rows, 1);
  input_seq_2 = zeros(max_cols, 1);

  aligned_seq_size = n+n;
  aligned_seq_1 = -ones(aligned_seq_size, 1);
  aligned_seq_2 = -ones(aligned_seq_size, 1);

  for i = 2:max_cols
    input_seq_1(i) = mod(abs(commonRandom()), nb_possible_items);
  end

  for j = 2:max_rows
    input_seq_2(j) = mod(abs(commonRandom()), nb_possible_items);
  end

  tic();
  needle(penalty);
  time = toc();
end
