function [err,new_log_lik] = run_hmm_bwa(a,b,pi,nsymbols,nstates,obs,length,iterations,threshold)
EXIT_ERROR = 1; err = 0;
scale = zeros(1,length);

alpha     = zeros(1, nstates * length);
beta      = zeros(1, nstates * length);
gamma_sum = zeros(1, nstates);
xi_sum    = zeros(1, nstates * nstates);
c         = zeros(1, nstates);
ones_n    = zeros(1, nstates);
ones_s    = ones(1, nsymbols);

for iter = 1:iterations
    [new_log_lik,alpha,scale] = calc_alpha(a,b,pi,nstates,alpha,obs,scale,length);
    if new_log_lik == EXIT_ERROR; err = EXIT_ERROR; return; end
    [beta]      = calc_beta(a,b,nstates,beta,obs,scale,length);
    [gamma_sum] = calc_gamma_sum(gamma_sum,nstates,length,alpha,beta);
    [xi_sum]    = calc_xi_sum(xi_sum,a,b,alpha,beta,obs,nstates,length);
    [a,c]       = estimate_a(a,c,alpha,beta,xi_sum,gamma_sum,ones_n,length,nstates);
    [b,c]       = estimate_b(b,c,alpha,beta,gamma_sum,ones_s,obs,length,nstates,nsymbols);
    pi          = estimate_pi(pi,alpha,beta,nstates);
    
    if and(threshold > 0, iter > 0)
        if(abs(power(10,new_log_lik) - power(10,old_log_lik)) < threshold)
            break;
        end
    end
    
    old_log_lik = new_log_lik;
    % working here.
end
end