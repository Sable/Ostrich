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

tmp = L*U;
good = 1;
for i=1:matrix_dim
    for j=1:matrix_dim
        diff = abs(m(i,j) - tmp(i,j)) / abs(m(i,j));
        if diff > 0.0000000001
            if good == 1
                fprintf(2, 'dismatch at (%d,%d): (o)%.*f (n)%.*f\n', i,j, 21, m(i,j), 21, tmp(i,j));
            end
            good = 0;
        end
    end
end
if good == 1 
    fprintf(2,'Good LUD!\n');
else
    fprintf(2,'Bad LUD!\n');
    max_diff = max(max(abs(tmp - m)));
    fprintf(2, 'max_diff %.*f\n', 21, max_diff);
    %disp(L);
    %disp(U);
    %disp(L*U);
    %disp(L * U == m);
    %disp(m);
end
end
