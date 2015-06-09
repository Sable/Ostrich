function [m] = createMatrixFromRandom(matrix_dim,debug)
% This function creates a matrix that is guaranteed to have a
% LUD solution by creating the upper and lower trangular matrices
% and then multiplying them together.
%
% 'matrix_dim' is the dimension of the square matrix to generate
% 'debug'      set 1 to print intermediary generated matrices, 0 otherwise
    if debug
        fprintf(2, 'createMatrixFromRandom(%d,%d)', matrix_dim, debug);
    end
    l = zeros(matrix_dim);
    u = zeros(matrix_dim);

    for lin = 1:matrix_dim
        for col = 1:matrix_dim
            if lin>col
                l(lin,col) = commonRandomJS();
            elseif lin == col
                l(lin,col) = 1;
            else
                l(lin,col) = 0;
            end
        end
    end
    
    % Filling matrix by column to follow C order
    for col = 1:matrix_dim
        for lin = 1:matrix_dim
            if lin>col
                u(lin,col) = 0;
            else
                u(lin,col) = commonRandomJS();
            end
        end
    end

    if debug
        fprintf('l:\n');
        for i = 1:matrix_dim
            for j = 1:matrix_dim
                fprintf(2, '%f ', l(i,j));
            end
            fprintf(2, '\n');
        end
        fprintf('\n');

        fprintf('u:\n');
        for i = 1:matrix_dim
            for j = 1:matrix_dim
                fprintf(2, '%f ', u(i,j));
            end
            fprintf(2, '\n');
        end
        fprintf('\n');
    end

    m = l*(u);
end
