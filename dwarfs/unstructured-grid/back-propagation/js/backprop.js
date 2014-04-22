/*** The squashing function.  Currently, it's a sigmoid. ***/
Math.random = Math.commonRandomJS;

function squash(x) {
	return (1.0 / (1.0 + Math.exp(-x)));
}

function bpnn_internal_create(n_in, n_hidden, n_out) {
	//var newnet = Object.create(BPNN);

	this.input_n = n_in;
	this.hidden_n = n_hidden;
	this.output_n = n_out;
	this.input_units = new Float32Array(n_in+1);
	this.hidden_units = new Float32Array(n_hidden+1);
	this.output_units = new Float32Array(n_out+1);

	this.hidden_delta = new Float32Array(n_hidden+1);
	this.output_delta = new Float32Array(n_out+1);
	this.target = new Float32Array(n_out+1);

	this.input_weights = new Float32Array((n_in+1) * (n_hidden+1));
	this.hidden_weights = new Float32Array((n_hidden+1) * (1+n_out));

	this.input_prev_weights = new Float32Array((n_in+1) * (1+n_hidden));
	this.hidden_prev_weights = new Float32Array((n_hidden+1) * (1+n_out));

	return this;
}

function bpnn_randomize_array(w, m, n) {
	var i=0, l=(m+1)*(n+1);

	for (i = 0; i < l; i++) {
		w[i] = Math.random();
	}
}

function loadInput(w, m, n) {
	var i=1, l=(m+1)*(n+1);

	for (i = 1; i < l; i++) {
		w[i] = Math.random();
	}
}

function bpnn_randomize_row(w, m) {
	for (var i = 0; i <= m; i++) {
		w[i] = 0.1;
	}
}

function bpnn_create(n_in, n_hidden, n_out) {
	var newnet;

	newnet = new bpnn_internal_create(n_in, n_hidden, n_out);

	bpnn_randomize_array(newnet.input_weights, n_in, n_hidden);
	bpnn_randomize_array(newnet.hidden_weights, n_hidden, n_out);
	bpnn_randomize_row(newnet.target, n_out);

	// Load input image with random values
	loadInput(newnet.input_units, n_in, 1);

	return newnet;
}

function bpnn_train_kernel(net) {
	var inp, hid, out;
	var out_err, hid_err;
	
	inp = net.input_n;
	hid = net.hidden_n;
	out = net.output_n;
	
	bpnn_layerforward(net.input_units, net.hidden_units, net.input_weights, inp, hid);
	bpnn_layerforward(net.hidden_units, net.output_units, net.hidden_weights, hid, out);
	out_err = bpnn_output_error(net.output_delta, net.target, net.output_units, out);
	hid_err = bpnn_hidden_error(net.hidden_delta, hid, net.output_delta, out, net.hidden_weights, net.hidden_units);  
	bpnn_adjust_weights(net.output_delta, out, net.hidden_units, hid, net.hidden_weights, net.hidden_prev_weights);
	bpnn_adjust_weights(net.hidden_delta, hid, net.input_units, inp, net.input_weights, net.input_prev_weights);
}

function bpnn_layerforward(l1, l2, conn, n1, n2) {
	var sum;
	var j, k;

	var nc=n2+1, nr=n1+1;

	/*** Set up thresholding unit ***/
	l1[0] = 1.0;
	/*** For each unit in second layer ***/
	for (j = 1; j < nc; j++) {
		/*** Compute weighted sum of its inputs ***/
		sum = 0.0;
		for (k = 0; k < nr; k++) {
			sum += conn[k*nc+j] * l1[k]; 
		}
		l2[j] = squash(sum);
	}
}

//extern "C"
function bpnn_output_error(delta, target, output, nj) {
	var o, t, errsum;
	errsum = 0.0;
	for (var j = 1; j <= nj; j++) {
		o = output[j];
		t = target[j];
		delta[j] = o * (1.0 - o) * (t - o);
		errsum += Math.abs(delta[j]);
	}
	return errsum;
}

function bpnn_hidden_error(delta_h, nh, delta_o, no, who, hidden) {
	var j, k;
	var h, sum, errsum;

	var nr=nh+1,nc=no+1;

	errsum = 0.0;
	for (j = 1; j < nr; j++) {
		h = hidden[j];
		sum = 0.0;
		for (k = 1; k < nc; k++) {
			sum += delta_o[k] * who[j*no+k];
		}
		delta_h[j] = h * (1.0 - h) * sum;
		errsum += Math.abs(delta_h[j]);
	}
	return errsum;
}

function bpnn_adjust_weights(delta, ndelta, ly, nly, w, oldw) {
	var new_dw;
	var k, j;
	var nr=nly+1,nc=ndelta+1;

	ly[0] = 1.0;

	for (j = 1; j < nc; j++) {
		for (k = 0; k < nr; k++) {
			new_dw = ((ETA * delta[j] * ly[k]) + (MOMENTUM * oldw[k*nc+j]));
			w[k*nc+j] += new_dw;
			oldw[k*nc+j] = new_dw;
		}
	}
}
