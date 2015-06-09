function fft_ostrich(two_exp)
n = power(2,two_exp);
if or(two_exp < 0, two_exp > 30)
    disp('ERROR: invalid exponent of ');
    disp(n);
    disp('for input size');
    return ;
end
m = complex(rand(n),rand(n));

tic
fft_2D(m,n);
elapsedTime = toc;


disp('{');
disp(' "status": 1,');
disp(' "options": '); disp(two_exp); disp(',');
disp(' "time": ');
disp(elapsedTime);
disp('}');

end