function [rtn] = fft2DComplex(x, N)
% rtn -> return value
for i=1:N
    rtn(i,:) = fftSimpleComplex(x(i,:), N);
end

rtn = rtn.'; %or transpose(rtn)
tmp = complex(zeros(N),zeros(N));
for i=1:N
    tmp(i,:) = fftSimpleComplex(rtn(i,:), N);
end
rtn = tmp.';
end
