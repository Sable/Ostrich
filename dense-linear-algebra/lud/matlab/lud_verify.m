function lud_verify(m,lu,matrix_dim)
L = zeros(matrix_dim);
U = zeros(matrix_dim);
for i = 1:matrix_dim
    for j = 1:matrix_dim
        if i == j
            L(i,j) = 1;
            U(i,j) = lu(i,j);
        elseif i > j
            L(i,j) = lu(i,j);
        else
            U(i,j) = lu(i,j);
        end
    end
end

if L * U == m
    disp('Good LUD!\n');
else
    disp('Bad LUD!\n');
end
end