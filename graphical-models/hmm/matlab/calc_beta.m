function calc_beta(a,b,nstates,length,beta,scale)
offset = (length - 1) * nastates + 1;
% init_beta_dev
b(offset:offset+nastates-1) = 1 / scale(length);
%
for t = length - (2:length) + 1
    calc_beta_dev(beta, b, scale(t), nstates, obs(t + 2), t);
    mat_vec_mul('n', nstates, nstates, a, nstates, beta, t * nstates, beta, t * nstates);
end
end