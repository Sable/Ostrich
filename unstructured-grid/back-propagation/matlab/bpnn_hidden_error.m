function [errsum] = bpnn_hidden_error(delta_h,nh,delta_o,no,who,hidden)
errsum = 0.0;
for j=2:nh
    h = hidden(j);
    sum = 0.0;
    for k = 2:no
        sum = sum + delta_o(k) * who(j,k);
    end
    delta_h(j) = h * (1.0 - h) * sum;
    errsum = errsum + abs(delta_h(j));
end
end