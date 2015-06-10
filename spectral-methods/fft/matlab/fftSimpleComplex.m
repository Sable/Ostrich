function [rtn] = fftSimpleComplex(x, N)
rtn = complex(zeros(1,N), zeros(1,N));
if N == 1
    rtn(1) = x(1);
else
    half = floor(N/2);
    e = complex(zeros(1,half), zeros(1,half));
    d = complex(zeros(1,half), zeros(1,half));
    for k=1:half
        e(k) = x(2*k - 1);
        d(k) = x(2*k);
    end
    VecE = fftSimpleComplex(e, half);
    VecD = fftSimpleComplex(d, half);
    for k=1:half
        r = 1; rad = -2.0*pi*(k-1)/N;
        c = complex(r*cos(rad),r*sin(rad));
        VecD(k) = VecD(k) * c;
    end
    for k=1:half
        rtn(k) = VecE(k) + VecD(k);
        rtn(k + half) = VecE(k) - VecD(k);
    end
end
end
