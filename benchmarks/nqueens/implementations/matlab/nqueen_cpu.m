function [solutions,unique_solutions] = nqueen_cpu(size)
solutions = 0;

for i = 3:size
    solutions = solutions + nqueen_solver1(size, i);
end

unique_solutions = solutions;
solutions = solutions * 8;

for i = 1:floor(size / 2) - 1
    [a_solutions,u_solutions] = nqueen_solver(size, bitshift(1,size)-1, ...
        bitshift(1,i), bitshift(1,i+1), bitshift(bitshift(1,i),-1));
    solutions        = solutions + a_solutions;
    unique_solutions = unique_solutions + u_solutions;
end

end