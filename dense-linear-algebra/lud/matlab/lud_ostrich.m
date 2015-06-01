function Ostrich_Lud(matrix_dim)
% Online test lud
% http://www.bluebit.gr/matrix-calculator/
% 25 5 1
% 64 8 1
% 144 12 1
% MATLAB: [L,U] = lu(A)
global m
if matrix_dim < 2
    error('No input file or valid matrix size specified!\n');
end
%m = rand(matrix_dim);
m = [25 5 1; 64 8 1; 144 12 1];
tic
lud_base(matrix_dim);
%lud_test(matrix_dim);
elapsedTime = toc;
disp(m);
end