function runFFT(twoExp, version, verify, debug)
% 'twoExp' is the exponent of two that determines the size of the array
% 'version' is the version of the algorith to use
%        0  is the base version that does not use complex number support in MATLAB 
%        1  is the idiomatic version that uses complex number support in MATLAB
%        2  is the native version that directly calls the fft function from the standard library of MATLAB
% 'verify' checks the output of the algorithm to ensure it is correct
% 'debug'  prints extra information for debugging purposes

if nargin < 2
    version = 0;
end
if nargin < 3
    verify = 0;
end
if nargin < 4
    debug = 0;
end

n = power(2,twoExp);
if or(twoExp < 0, twoExp > 30)
    error('ERROR: invalid exponent of %d for input size\n',n);
    exit(1);
end

if version == 0
    mR = createMatrixFromRandom(n);
    mI = createMatrixFromRandom(n);
    if debug
        fprintf('Input: \n');
        disp(mR);
        disp(mI);
    end
    tic;
    [resR,resI] = fft2D(mR,mI,n);
elseif version == 1
    m = complex(createMatrixFromRandom(n),createMatrixFromRandom(n));
    tic;
    res = fft2DComplex(m,n);
else
    m = complex(createMatrixFromRandom(n),createMatrixFromRandom(n));
    tic;
    res = fft2(m);
end
elapsedTime = toc;

if debug
    fprintf('Result: \n');
    if version == 0
        disp(resR);
        disp(resI);
    else 
        disp(res)
    end
end

fprintf('{ \"status\": %d, \"options\": \"%d\", \"time\": %f }', 1, twoExp, elapsedTime);
end
