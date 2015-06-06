function lud_ostrich(matrix_dim,do_verify)
if matrix_dim < 2
    error('No input file or valid matrix size specified!\n');
end
m = rand(matrix_dim);

tic
lu = lud_base(m,matrix_dim);
elapsedTime = toc;

if matrix_dim == 1024
    fp_row = fopen('indices_row.data','r');
    expected_row_indices = fscanf(fp_row, '%d').';
    fclose(fp_row);

    fp_col = fopen('indices_col.data','r');
    expected_col_indices = fscanf(fp_col, '%d').';
    fclose(fp_col);

    fp_val = fopen('expect_value.data','r');
    expected_values = fscanf(fp_val, '%lf').';
    fclose(fp_val);
    for i = 1:100
        if m(expected_row_indices(i),expected_col_indices(i)) ~= expected_values(i)
            error('value at index (%d,%d) = %.*f is different from the expected value %.*f\n',...
                expected_row_indices(i),expected_col_indices(i),...
                21,m(expected_row_indices(i),expected_col_indices(i)),...
                21,expected_values(i));
            disp('Received values:\n');
            for j = 1:100
                disp(sprintf('%.*f, ',21,m(expected_row_indices(i),expected_col_indices(i))));
            end
            return ;
        end
    end
else
    warning('No self-checking step for dimension %d\n',matrix_dim);
end

if do_verify ~= 0
    lud_verify(m, lu, matrix_dim);
end

msg = sprintf('{ \"status\": %d, \"options\": \"-s %d\", \"time\": %f }\n', 1, matrix_dim, elapsedTime);
disp(msg);
end