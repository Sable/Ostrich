function [gamma_sum] = calc_gamma_sum(gamma_sum,nstates,length,alpha,beta)
for t = 1:length
    for i = 1:nstates
        gamma_sum(i) = gamma_sum(i) + alpha((t-1) * nstates + i) * beta((t-1) * nstates + i);
    end
end
end