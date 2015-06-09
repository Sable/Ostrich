function [pi] = estimate_pi(pi,alpha,beta,nstates)
sum_ab = sum(alpha(1:nstates) .* beta(1:nstates));
% est_pi_dev
pi = alpha .* beta ./ sum_ab;
end