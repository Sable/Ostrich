function srad_ostrich(niter,lambda)

expected_output = 52608;

Nr = 502;
Nc = 458;
fileID = fopen('../data/image.pgm','r');
for i = 1:3
    fgets(fileID); % skip header
end
image  = reshape(fscanf(fileID,'%lf'),Nc,Nr);
image  = image.';
fclose(fileID);

% ROI image size
NeROI = Nr * Nc;

iN = -1 + 1:Nr;
iS =  1 + 1:Nr;
jW = -1 + 1:Nc;
jE =  1 + 1:Nc;

dN = zeros(Nr, Nc);
dS = zeros(Nr, Nc);
dW = zeros(Nr, Nc);
dE = zeros(Nr, Nc);

c  = zeros(Nr, Nc);

% set boundary value
iN(1)  = 1;
iS(Nr) = Nr;
jW(1)  = 1;
jE(Nc) = 1;

% scale image
image = exp(image / 255);

tic
for iter = 1:niter
    tot = sum(sum(image));
    tot2= sumsqr(image);
    meanROI = tot / NeROI;
    varROI  = (tot2 / NeROI) - meanROI * meanROI;
    q0sqr   = varROI / (meanROI * meanROI);
    disp(q0sqr);
    for j = 1:Nc
        for i = 1:Nr
            k = i + Nr * (j - 1);
            Jc = image(k);
            % directional derivates (every element of IMAGE)
            dN(k) = image(iN(i) + Nr * (j-1)) - Jc;
            dS(k) = image(iS(i) + Nr * (j-1)) - Jc;
            dW(k) = image(i + Nr * (jW(j)-1)) - Jc;
            dE(k) = image(i + Nr * (jE(j)-1)) - Jc;
            
            G2 = (dN(k) * dN(k) + dS(k) * dS(k) ...
                + dW(k) * dW(k) + dE(k) * dE(k)) / (Jc * Jc);
            L  = (dN(k) + dS(k) + dW(k) + dE(k)) / Jc;
            num  = (0.5 * G2) - ((1.0 / 16.0) * (L * L)) ;
            den  = 1 + (.25*L);
            qsqr = num / (den * den);
            den  = (qsqr - q0sqr) / (q0sqr * (1 + q0sqr)) ;
            c(k) = 1.0 / (1.0 + den);
            if c(k) < 0
                c(k) = 0;
            elseif c(k) > 1
                c(k) = 1;
            end
        end
    end
    for j = 1:Nc
        for i = 1:Nr
            k = i + Nr * (j - 1);
            cN = c(k);
            cS = c(iS(i) + Nr *(j-1));
            cW = c(k);
            cE = c(i + Nr * (jE(j)-1));
            D = cN * dN(k) + cS * dS(k) + cW * dW(k) + cE * dE(k);
            image(k) = image(k) + 0.25 * lambda * D;
        end
    end
end
elapsedTime = toc;

image = log(image) * 255;
j     = sum(image(1:Nr));

% write_graphics
if and(niter == 500, lambda == 1)
    if j ~= expected_output
        error('expected output of %ld but received %ld instead\n', expected_output, j);
    end
else
    warning('No self-checking step for niter %d and lambda %f\n', niter, lambda);
end

msg = sprintf('{ \"status\": %d, \"options\": \"%d %f\", \"time\": %f }\n', 1, niter, lambda, elapsedTime);
disp(msg);

end