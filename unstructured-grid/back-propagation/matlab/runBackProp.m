function runBackProp(nb)
    backprop(nb);
    fprintf('{ "status": %d, "options": "%d", "time":%f }\n',1,nb,0.1);
end
