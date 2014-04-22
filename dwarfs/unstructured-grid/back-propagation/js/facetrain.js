//var layer_size = 0;
var ETA = 0.3       //eta value
var MOMENTUM = 0.3  //momentum value

function backprop_face(layer_size) {
	var net;
	var out_err, hid_err;
	var time0,time1;
	net = bpnn_create(layer_size, 16, 1); // (16, 1 can not be changed)
	//entering the training kernel, only one iteration
	time0 = performance.now();
	bpnn_train_kernel(net);
	time1 = performance.now();
	console.log("Output: " + net.output_units[1].toFixed(4) + "\t" + net.output_delta[1].toFixed(4));
	net = null;
	console.log("Computation time: " + (time1-time0)/1000 + "s\n");
}

backprop_face(6553600);
