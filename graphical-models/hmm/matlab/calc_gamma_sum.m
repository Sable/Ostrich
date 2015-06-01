function calc_gamma_sum(gamma_sum,nstates,length,alpha,beta)
for t = 1:length
    for i = 1:nstates
        gamma_sum(i) = gamma_sum(i) + alpha((t-1)*length+i) * beta((t-1)*length+i);
    end
end
end