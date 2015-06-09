function [beta] = calc_beta(a,b,nstates,beta,obs,scale,length)
offset = (length - 1) * nstates + 1;
% init_beta_dev
beta(offset:offset+nstates-1) = 1 / scale(length);
%
for t = length - (2:length) + 1
    % calc_beta_dev(beta, b, scale(t), nstates, obs(t + 2), t);
    for i = 1:nstates
        beta((t-1) * nstates + i) = beta(t * nstates + i) * b((obs(t + 1) - 1) * nstates + i) / scale(t);
    end
    beta = mat_vec_mul('n', nstates, nstates, a, nstates, beta, t * nstates, beta, t * nstates);
end
end