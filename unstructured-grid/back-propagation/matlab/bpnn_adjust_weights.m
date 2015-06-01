function bpnn_adjust_weights(delta,ndelta,ly,nly,w,oldw)
ETA      = 0.3;
MOMENTUM = 0.3;
ly(1)    = 1.0;
for j = 2:ndelta
    for k = 1:nly
        new_dw = ((ETA * delta(j) * ly(k)) + (MOMENTUM * oldw(k,j)));
        w(k,j) = w(k,j) + new_dw;
        oldw(k,j) = new_dw;
    end
end
end