function runNQueens(size)
tic
[solutions,us] = nqueen_cpu(size);
elapsedTime = toc;

status = 1;
if size == 16
    if or(solutions ~= 14772512, us ~= 1846955)
        status = 0;
    end
end

disp('The number of solution is');
disp(solutions);
disp('the number of unique solutions is');
disp(us);
disp('and the total time it took is');
disp(elapsedTime);

disp('{ "status": ');     disp(status);
disp('  "options": -s '); disp(size);
disp('  "time"');         disp(elapsedTime);

end