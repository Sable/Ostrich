function [xi_sum] = calc_xi_sum(xi_sum,a,b,alpha,beta,obs,nstates,length)
for t = 1:length-1
    % dot_product is transformed in the following two lines
    offset = (t - 1) * nstates;
    sum_ab = sum(alpha(offset+1:offset+nstates) .* beta(offset+1:offset+nstates));
    % calc_xi_sum_dev is presented as the following two for-loops
    for i = 1:nstates
        for j = 1:nstates
            offsetj = (j - 1) * nstates + i;
            xi_sum(offsetj) = xi_sum(offsetj) + alpha(offset + j) * a(offsetj) * b((obs(t+1)-1)*nstates + i) * beta(t * nstates + i) / sum_ab;
        end
    end
end
end