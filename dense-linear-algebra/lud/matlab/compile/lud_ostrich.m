function time = lud_ostrich(matrix_dim,do_verify)
  if matrix_dim < 2
    disp('No input file or valid matrix size specified!\n');
    return;
  end

  m = createMatrixFromRandom(matrix_dim);

  tic();
  lu = lud_base(m,matrix_dim);
  time = toc();
end
