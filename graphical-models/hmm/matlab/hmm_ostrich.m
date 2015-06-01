function hmm(v_model,n,s,t)
N = 60;
T = 1000;
S = 2;
errcode    = 0;
ITERATIONS = 1;

elapsedTime = 0;
if v_model == 'n'
    obs_length = T;
    obs_data   = zeros(1,T);
    if n >= 8000
        return
    end
    hmm_nstates = n;
    hmm_nsymbols= S;
    hmm_a = zeros(n);   hmm_a(:) = 1/n;
    hmm_b = zeros(n,S); hmm_b(:) = 1/S;
    hmm_pi= zeros(1,n); hmm_pi(:)= 1/n;
    tic
    [errcode,log_lik] = run_hmm_bwa(hmm_a,hmm_b,hmm_pi,hmm_nsymbols,hmm_nstates,obs_data,obs_length,ITERATIONS,0);
    elapsedTime = toc;
elseif v_model == 's'
    obs_length = T;
    obs_data   = zeros(1,T);
    if n >= 8000
        return
    end
    hmm_nstates = N;
    hmm_nsymbols= s;
    hmm_a = zeros(N);   hmm_a(:) = 1/N;
    hmm_b = zeros(N,s); hmm_b(:) = 1/s;
    hmm_pi= zeros(1,N); hmm_pi(:)= 1/N;
    tic
    [errcode,log_lik] = run_hmm_bwa(hmm_a,hmm_b,hmm_pi,hmm_nsymbols,hmm_nstates,obs_data,obs_length,ITERATIONS,0);
    elapsedTime = toc;
elseif v_model == 't'
    if t >= 10000
        return
    end
    hmm_nstates = N;
    hmm_nsymbols= S;
    hmm_a = zeros(N);   hmm_a(:) = 1/N;
    hmm_b = zeros(N,S); hmm_b(:) = 1/S;
    hmm_pi= zeros(1,N); hmm_pi(:)= 1/N;
    obs_length = t;
    obs_data   = zeros(1,t);
    tic
    [errcode,log_lik] = run_hmm_bwa(hmm_a,hmm_b,hmm_pi,hmm_nsymbols,hmm_nstates,obs_data,obs_length,ITERATIONS,0);
    elapsedTime = toc;
end

msg = sprintf('Observations\tTime \tLog_likelihood \tErrocode\n%f\t%f\t%d\n',elapsedTime,log_lik,errcode);
disp(msg);
end