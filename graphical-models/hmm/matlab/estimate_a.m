function estimate_a(a,c,alpha,beta,xi_sum,gamma_sum,ones_n,length,nstates)
offset = (length - 1) * nstates;
sum_ab = sum(alpha(offset+1:offset*nstates):beta(offset+1:offset*nstates));
% est_a_dev
for i = 1:nstates
    for j = 1:nstates
        offsetj = (j - 1) * nstates + i;
        a(offsetj) = xi_sum(offsetj) / (gamma_sum(j) - alpha(offsetj) * beta(offsetj) / sum_ab);
    end
end
mat_vec_mul('t',nstates,nstates,a,nstates,ones_n,0,c,0);
% scale_a_dev
for i = 1:nstates
    for j = 1:nstates
        offsetk = (j - 1) * nstates + i;
        a(offsetk) = a(offsetk) / c(j);
    end
end
end