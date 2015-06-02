function lud_ostrich(matrix_dim,do_verify)
if matrix_dim < 2
    error('No input file or valid matrix size specified!\n');
end
m = rand(matrix_dim);

tic
lu = lud_base(m,matrix_dim);
elapsedTime = toc;

if do_verify ~= 0
    lud_verify(m, lu, matrix_dim);
end

msg = sprintf('{ \"status\": %d, \"options\": \"-s %d\", \"time\": %f }\n', 1, matrix_dim, elapsedTime);
disp(msg);
end