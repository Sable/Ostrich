function [rtn] = FFT_2D(x, N)
% rtn -> return value
for i=1:N
    rtn(i,:) = FFT_simple(x(i,:), N);
end

rtn = rtn.'; %or transpose(rtn)
tmp = complex(zeros(N),zeros(N));
for i=1:N
    tmp(i,:) = FFT_simple(rtn(i,:), N);
end
rtn = tmp.';
end