function runner(matrix_dim,input_file_path,output_file_path,debug,version)
% runs the LUD benchmark
%     'matrix_dim' is the size of the square matrix being generated
%     'input_file_path' is the path to the input data
%     'output_file_path' is the path where to save the output
%     'debug'       1 to print additional debugging information, 0 otherwise
%     'version'    is the version of lud to use, possible values are:
%         0:  (base) direct translation from the C version
%         1:  (idiomatic) replaces the innermost loop in C with a 'sum' function call
%         2:  (native) directly calls the native implementation of LUD in Matlab

if nargin < 2
   error('Missing matrix_dim and/or input_file_path argument(s)\n');
end

if nargin < 3
    output_file_path = false;
end

if nargin < 4
    debug = 0;
end

if nargin < 5
    version = 0;
end


if exist(input_file_path)
    m = dlmread(input_file_path,',');
else 
    fprintf(1, 'invalid input file %s', input_file_path)
    exit(1);
end


if version == 1 
    if debug
        fprintf(2, 'computing LUD with vectorized operations\n');
    end 
    tic
    res = lud_base_idiomatic(m,matrix_dim);
elseif version == 2
    if debug
        fprintf(2, 'computing LUD with the MATLAB standard library function\n');
    end
    tic
    res = lu(m);
else
    if debug
        fprintf(2, 'computing LUD with the C implementation literally translated to MATLAB\n');
    end
    tic
    res = lud_base(m,matrix_dim);
end
elapsedTime = toc;

if output_file_path ~= false
    dlmwrite(output_file_path, res, 'precision', '%.21f');
end

fprintf(1, '{ \"status\": %d, \"options\": \"matrix_dim %d\", \"time\": %f }\n', 1, matrix_dim, elapsedTime);
end

