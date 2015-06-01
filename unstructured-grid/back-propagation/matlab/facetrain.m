function facetrain(layer_size)
sum_of_hidden_weights = 0;
expected_sum_of_hidden_weights = 10.855641469359398;
expected_layer_size = 2850000;
input_n = layer_size;
hidden_n= 16;
output_n= 1;
in = input_n + 1;
hid= hidden_n + 1;
out= output_n + 1;

% set rand seed
s = RandStream('mcg16807','Seed',49734321);
RandStream.setDefaultStream(s);

% bpnn_create
n_in     = input_n + 1;
n_hidden = hidden_n + 1;
n_out    = output_n + 1;
input_weights       = rand(in, hid);
hidden_weights      = rand(hid, out);
input_prev_weights  = zeros(in, hid);
hidden_prev_weights = zeros(hid, out);
target              = ones(1,out); %vector
hidden_units = zeros(1,hid);
output_units = zeros(1,out);
hidden_delta = zeros(1,hid);
output_delta = zeros(1,out);

% load(net)
nr = in;
%input_units = rand(1, nr); %C skips [0]
input_units = zeros(1, nr);
for i=2:nr
    input_units(i) = rand();
end

%hidden_weights

tic
% bpnn_train_kernel
bpnn_layerforward(input_units, hidden_units, input_weights, in, hid);
bpnn_layerforward(hidden_units, output_units, hidden_weights, hid, out);
out_err = bpnn_output_error(output_delta, target, output_units, out);
hid_err = bpnn_hidden_error(hidden_delta,hid,output_delta,out,hidden_weights,hidden_units);
bpnn_adjust_weights(output_delta,out,hidden_units,hid,hidden_weights,hidden_prev_weights);
bpnn_adjust_weights(hidden_delta,hid,input_units,in,input_weights,input_prev_weights);
elapsedTime  = toc;

%hidden_weights

if layer_size == expected_layer_size
    for i=1:hidden_n+1
        for j=1:output_n+1
            sum_of_hidden_weights = sum_of_hidden_weights + hidden_weights(i,j);
        end
    end
    if hidden_weights ~= expected_sum_of_hidden_weights
        error('ERROR: expected a sum of hidden weights of %f for an input size of %d but got %f instead\n',...
            expected_sum_of_hidden_weights, expected_layer_size, sum_of_hidden_weights);
    end
else
    warning('WARNING: no self-checking for input size of %d\n', layer_size);
end

msg = sprintf('{ "status": %d, "options": "%d", "time": %f seconds}\n', 1, layer_size, elapsedTime);
disp(msg);
end