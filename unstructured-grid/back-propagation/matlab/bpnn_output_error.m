function [errsum] = bpnn_output_error(delta,target,output,nj)
errsum = 0.0;
for j = 2:nj
    o = output(j);
    t = target(j);
    delta(j) = o * (1.0 - o) * (t - o);
    errsum = errsum + abs(delta(j));
end
end