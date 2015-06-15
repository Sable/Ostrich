function answer = needle(penalty, max_rows, max_cols, input_seq_1, input_seq_2, reference, input_itemsets, blosum62)

for i = 2:max_cols
    for j = 2:max_rows
        reference(i,j) = blosum62(input_seq_2(j), input_seq_1(i));
    end
end

for i = 2:max_rows
    input_itemsets(i, 1) = -i*penalty - 1;
end
for j = 2:max_cols
    input_itemsets(1, j) = -j*penalty - 1;
end

for i = 2:max_rows
    for j = 2:max_cols
        input_itemsets(i, j) = max3(input_itemsets(i-1, j-1) + reference(i, j), input_itemsets(i, j-1) - penalty, input_itemsets(i-1, j) - penalty);
    end
end

answer = input_itemsets;
end
