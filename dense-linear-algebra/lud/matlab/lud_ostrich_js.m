function lud_ostrich_js(matrix_dim,do_verify)
if matrix_dim < 2
    disp('No input file or valid matrix size specified!\n');
    return;
end

m = rand(matrix_dim);

tic
lu = lud_base(m,matrix_dim);
elapsedTime = toc;

disp('{');
disp(' "status": 1,');
disp(' "options": null,');
disp(' "time": ');
disp(elapsedTime);
disp('}');

end
