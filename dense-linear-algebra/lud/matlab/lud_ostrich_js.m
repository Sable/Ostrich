function lud_ostrich_js(matrix_dim,do_verify)
if matrix_dim < 2
    disp('No input file or valid matrix size specified!\n');
    return;
end

m = rand(matrix_dim);

tic
lu = lud_base(m,matrix_dim);
elapsedTime = toc;

msg = strcat('{ "status": 1, "options": null, "time": ', num2str(elapsedTime*1000), ' }');
disp(msg);
end