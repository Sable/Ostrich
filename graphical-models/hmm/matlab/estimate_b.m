function [b,c] = estimate_b(b,c,alpha,beta,gamma_sum,ones_s,obs,length,nstates,nsymbols)
for t = 1:length
    offset = (t - 1) * nstates;
    sum_ab = sum(alpha(offset+1:offset+nstates) .* beta(offset+1:offset+nstates));
    % acc_b_dev 
    % may error in line:
    %   acc_b_dev(b, alpha, beta, sum_ab, nstates, nsymbols, *(obs + t+1), t);
    % length of obs + t + 1 is greather than the length of obs
    for i = 1:nstates
        for j = 1:nsymbols
            if j == obs(t) %% <--
                offsetj = (j - 1) * nstates + i;
                offsetk = offset + i;
                b(offsetj) = b(offsetj) + (alpha(offsetk) * beta(offsetk) / sum_ab);
            end
        end
    end
    % est_b_dev
    for i = 1:nstates
        for j = 1:nsymbols
            offsetj = (j - 1) * nstates + i;
            b(offsetj) = b(offsetj) / gamma_sum(i);
        end
    end
    c = zeros(1,nstates);
    c = mat_vec_mul('n',nstates,nsymbols,b,nstates,ones_s,0,c,0);
    % scale_b_dev, Normalize B matrix, ?? normc matrix
    for i = 1:nstates
        for j = 1:nsymbols
            offsetk = (i - 1) * nsymbols + j;
            if abs(b(offsetk)) < 0.000001
                b(offsetk) = 1e-10;
            else
                b(offsetk) = b(offsetk) / c(i);
            end
        end
    end
end
end