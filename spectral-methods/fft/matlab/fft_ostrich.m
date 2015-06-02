function fft_ostrich(two_exp)
n = power(2,two_exp);
if or(two_exp < 0, two_exp > 30)
    error('ERROR: invalid exponent of %d for input size\n',n);
end
m = complex(rand(n),rand(n));

tic
fft_2D(m,n);
elapsedTime = toc;

msg = sprintf('{ \"status\": %d, \"options\": \"%d\", \"time\": %f seconds}\n', 1, two_exp, elapsedTime);
disp(msg);
end