function [log_lik,alpha,scale] = calc_alpha(a,b,pi,nstates,alpha,obs,scale,length)
% init alpha
ones_n = ones(1, nstates);
for i= 1:nstates
    alpha(i) = pi(i) * b(obs(1) * nstates + i);
end

% dot_product
scale(1) = sum(alpha(1:nstates) .* ones_n(1:nstates));
% scale_alpha_values
alpha(1:nstates) = alpha(1:nstates) / scale(1);
% init log likelihood
log_lik = log10(scale(1));

for t = 2:length
    offset_prev = (t - 2) * nstates;
    offset_cur = (t - 1) * nstates;
    alpha = mat_vec_mul('n', nstates, nstates, a, nstates, alpha, offset_prev, alpha, offset_cur);
    % calc_alpha_dev
    alpha_seg = offset_cur + nstates;
    obs_seg0  = (obs(t) - 1) * nstates + 1;
    obs_seg1  = obs_seg0 + nstates - 1;
    alpha(offset_cur + 1:alpha_seg) = alpha(offset_cur + 1:alpha_seg) .* b(obs_seg0:obs_seg1);
    % scale[t] = dot_product(nstates, alpha, offset_cur, ones_n, 0);
    scale(t) = sum(alpha(offset_cur + 1:offset_cur + nstates) .* ones_n(1:nstates));
    % scale_alpha_values
    alpha(offset_cur + 1:alpha_seg) = alpha(offset_cur + 1:alpha_seg) / scale(t);
    log_lik = log_lik + log10(scale(t));
end

end