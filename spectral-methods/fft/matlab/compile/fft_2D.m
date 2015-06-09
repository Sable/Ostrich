function [rtn] = fft_2D(x, N)
% rtn -> return value
for i=1:N
    rtn(i,:) = fft_simple(x(i,:), N);
end

rtn = rtn.'; %or transpose(rtn)
tmp = complex(zeros(N),zeros(N));
for i=1:N
    tmp(i,:) = fft_simple(rtn(i,:), N);
end
rtn = tmp.';
end