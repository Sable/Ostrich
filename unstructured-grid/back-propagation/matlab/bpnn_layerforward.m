function bpnn_layerforward(l1,l2,conn,n1,n2)
l1(1) = 1.0;
for j = 2:n2
    sum = 0;
    for k = 1:n1
        sum = sum + conn(k,j) * l1(k);
    end
    l2(j) = 1.0 / (1.0 + exp(-sum));
end
end