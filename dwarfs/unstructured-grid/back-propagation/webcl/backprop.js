if (typeof performance === "undefined") {
    performance = Date;
}

function source(id) {
    var programElement = document.getElementById(id);
    var programSource = programElement.text;
    if (programElement.src != "") {
        var mHttpReq = new XMLHttpRequest();
        mHttpReq.open("GET", programElement.src, false);
        mHttpReq.send(null);
        programSource = mHttpReq.responseText;
    }
    return programSource;
}

function program(ctx, src) {
    return ctx.createProgram(src);
}

function build(prgm, device) {
    try {
        prgm.build([device], "");
    } catch (e) {
        alert("Failed to build WebCL program. Error " + prgm.getBuildInfo(device,
            WebCL.PROGRAM_BUILD_STATUS) + ":  " + prgm.getBuildInfo(device,
            WebCL.PROGRAM_BUILD_LOG));
        throw e;
    }
}

function webCLPlatformDevice(platformIdx, deviceIdx) {
    var p = webcl.getPlatforms()[platformIdx];
    var d = p.getDevices(WebCL.DEVICE_TYPE_ALL)[deviceIdx];
    return {
        "platform": p,
        "device": d
    };
}

function webCLContext(device) {
    return webcl.createContext(device);
}

function isWebCL() {
    if (window.webcl == undefined) {
        alert("Unfortunately your system does not support WebCL. " +
            "Make sure that you have both the OpenCL driver " +
            "and the WebCL browser extension installed.");
        return false;
    }
    return true;
}

function kernel(kernel, program) {
    return program.createKernel(kernel);
}

function webclbackprop(platformIdx, deviceIdx, layerSize) {
    var programSourceId = "clbackprop";
    var float_bytes = 4;
    var layer_size = layerSize || 2850000;

    var net;
    var out_err, hid_err;
    var inp, hid, out, sourceSize;
    var time0, time1;
    var expected_layer_size = 2850000;
    var expected_sum_of_hidden_weights = 10.855641469359398;
    net = bpnn_create(layer_size, 16, 1);

    inp = net.input_n;
    hid = net.hidden_n;
    out = net.output_n;
    sourcesize = 1024 * 1024;

    var t1 = performance.now();
    try {
        //============ Setup WebCL Program ================
        isWebCL();
        var pd = webCLPlatformDevice(platformIdx, deviceIdx);
        var ctx = webCLContext(pd.device);
        var src = source(programSourceId);
        var prgm = program(ctx, src);
        build(prgm, pd.device);
        var queue = ctx.createCommandQueue(pd.device);

        // ============== Initialize Kernels ================ 
        var Kernel1 = kernel("bpnn_layerforward_ocl", prgm);
        var Kernel2 = kernel("bpnn_adjust_weights_ocl", prgm);

        // // ============== Setup Kernel Memory ================     
        // memory has to be allocated in terms of bytes

        var input_weights_one_dim = net.input_weights;
        var input_weights_prev_one_dim = net.input_prev_weights;
        var num_blocks = inp / BLOCK_SIZE;
        var partial_sum;
        var sum;

        var global_work = [BLOCK_SIZE, BLOCK_SIZE * num_blocks];
        var local_work = [BLOCK_SIZE, BLOCK_SIZE];

        partial_sum = new Float32Array(num_blocks * WIDTH);

        input_ocl = ctx.createBuffer(WebCL.MEM_READ_WRITE, (inp + 1) * float_bytes);
        input_hidden_ocl = ctx.createBuffer(WebCL.MEM_READ_WRITE, (inp + 1) * (hid + 1) * float_bytes);
        output_hidden_ocl = ctx.createBuffer(WebCL.MEM_READ_WRITE, (hid + 1) * float_bytes);
        hidden_partial_sum = ctx.createBuffer(WebCL.MEM_READ_WRITE, num_blocks * WIDTH * float_bytes);
        hidden_delta_ocl = ctx.createBuffer(WebCL.MEM_READ_WRITE, (hid + 1) * float_bytes);
        input_prev_weights_ocl = ctx.createBuffer(WebCL.MEM_READ_WRITE, (inp + 1) * (hid + 1) * float_bytes);

        queue.enqueueWriteBuffer(input_ocl, true, 0, (inp + 1) * float_bytes, net.input_units);
        queue.enqueueWriteBuffer(input_hidden_ocl, true, 0, (inp + 1) * (hid + 1) * float_bytes, input_weights_one_dim);

        Kernel1.setArg(0, input_ocl);
        Kernel1.setArg(1, output_hidden_ocl);
        Kernel1.setArg(2, input_hidden_ocl);
        Kernel1.setArg(3, hidden_partial_sum);
        Kernel1.setArg(4, new Uint32Array([HEIGHT * float_bytes]));
        Kernel1.setArg(5, new Uint32Array([HEIGHT * WIDTH * float_bytes]));
        Kernel1.setArg(6, new Int32Array([inp]));
        Kernel1.setArg(7, new Int32Array([hid]));

        queue.enqueueNDRangeKernel(Kernel1, 2, null, global_work, local_work);
        queue.enqueueReadBuffer(hidden_partial_sum, true, 0, num_blocks * WIDTH * float_bytes, partial_sum);
        queue.finish();

        for (var j = 1; j <= hid; j++) {
            sum = 0.0;
            for (var k = 0; k < num_blocks; k++) {
                sum += partial_sum[k * hid + j - 1];
            }
            sum += net.input_weights[j];
            net.hidden_units[j] = squash(sum);
        }

        bpnn_layerforward(net.hidden_units, net.output_units, net.hidden_weights, hid, out);
        out_err = bpnn_output_error(net.output_delta, net.target, net.output_units, out);
        hid_err = bpnn_hidden_error(net.hidden_delta, hid, net.output_delta, out, net.hidden_weights, net.hidden_units);
        bpnn_adjust_weights(net.output_delta, out, net.hidden_units, hid, net.hidden_weights, net.hidden_prev_weights);


        queue.enqueueWriteBuffer(hidden_delta_ocl, true, 0, (hid + 1) * float_bytes, net.hidden_delta);
        queue.enqueueWriteBuffer(input_prev_weights_ocl, true, 0, (inp + 1) * (hid + 1) * float_bytes, input_weights_prev_one_dim);
        queue.enqueueWriteBuffer(input_hidden_ocl, true, 0, (inp + 1) * (hid + 1) * float_bytes, input_weights_one_dim);

        Kernel2.setArg(0, hidden_delta_ocl);
        Kernel2.setArg(1, new Int32Array([hid]));
        Kernel2.setArg(2, input_ocl);
        Kernel2.setArg(3, new Int32Array([inp]));
        Kernel2.setArg(4, input_hidden_ocl);
        Kernel2.setArg(5, input_prev_weights_ocl);

        queue.enqueueNDRangeKernel(Kernel2, 2, null, global_work, local_work);
        queue.enqueueReadBuffer(input_ocl, true, 0, (inp + 1) * float_bytes, net.input_units);
        queue.enqueueReadBuffer(input_hidden_ocl, true, 0, (inp + 1) * (hid + 1) * float_bytes, input_weights_one_dim);

        // ============== Free Memory ================ 
        input_ocl.release();
        output_hidden_ocl.release();
        input_hidden_ocl.release();
        hidden_partial_sum.release();
        input_prev_weights_ocl.release();

        Kernel1.release();
        Kernel2.release();

        queue.release();
        prgm.release();
        ctx.release();
    } catch (e) {
        alert(e);
    }
    var t2 = performance.now();

    if (layer_size === expected_layer_size) {
        var sum_of_hidden_weights = 0;
        for (var i=1; i<=net.hidden_n; ++i) {
            for (var j=1; j<=net.output_n; ++j) {
                sum_of_hidden_weights += net.hidden_weights[i*(net.output_n + 1) + j];
            }
        }
        if (sum_of_hidden_weights !== expected_sum_of_hidden_weights) {
            throw new Error("ERROR: expected a sum of hidden weights of '" + expected_sum_of_hidden_weights + "'" + 
                            " for an input size of '" + expected_layer_size + "'" + 
                            " but got '" + sum_of_hidden_weights + "' instead");
        } else {
            console.log("Self Checking worked fine!!");
        }
    } else {
        console.log("WARNING: no self-checking for input size of '" + layer_size + "'");
    }

    console.log("Total time elapsed is " + (t2 - t1) / 1000 + " seconds");

    return { status: 1,
             options: null,
             time: (t2-t1) / 1000 };
}


/**
 * Program Source - Data Generation
 */

var THREADS = 256
var WIDTH = 16 // shared memory width  
var HEIGHT = 16 // shared memory height
var BLOCK_SIZE = 16

var ETA = 0.3 //eta value
var MOMENTUM = 0.3 //momentum value
var NUM_THREAD = 4

Math.random = Math.commonRandomJS;

function squash(x) {
    return (1.0 / (1.0 + Math.exp(-x)));
}

function bpnn_internal_create(n_in, n_hidden, n_out) {
    //var newnet = Object.create(BPNN);

    this.input_n = n_in;
    this.hidden_n = n_hidden;
    this.output_n = n_out;
    this.input_units = new Float32Array(n_in + 1);
    this.hidden_units = new Float32Array(n_hidden + 1);
    this.output_units = new Float32Array(n_out + 1);

    this.hidden_delta = new Float32Array(n_hidden + 1);
    this.output_delta = new Float32Array(n_out + 1);
    this.target = new Float32Array(n_out + 1);

    this.input_weights = new Float32Array((n_in + 1) * (n_hidden + 1));
    this.hidden_weights = new Float32Array((n_hidden + 1) * (1 + n_out));

    this.input_prev_weights = new Float32Array((n_in + 1) * (1 + n_hidden));
    this.hidden_prev_weights = new Float32Array((n_hidden + 1) * (1 + n_out));

    return this;
}

function bpnn_randomize_array(w, m, n) {
    var i = 0,
        l = (m + 1) * (n + 1);

    for (i = 0; i < l; i++) {
        w[i] = Math.random();
    }
}

function loadInput(w, m, n) {
    var i = 1,
        l = (m + 1) * (n + 1);

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

function bpnn_layerforward(l1, l2, conn, n1, n2) {
    var sum;
    var j, k;

    var nc = n2 + 1,
        nr = n1 + 1;

    /*** Set up thresholding unit ***/
    l1[0] = 1.0;
    /*** For each unit in second layer ***/
    for (j = 1; j < nc; j++) {
        /*** Compute weighted sum of its inputs ***/
        sum = 0.0;
        for (k = 0; k < nr; k++) {
            sum += conn[k * nc + j] * l1[k];
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

    var nr = nh + 1,
        nc = no + 1;

    errsum = 0.0;
    for (j = 1; j < nr; j++) {
        h = hidden[j];
        sum = 0.0;
        for (k = 1; k < nc; k++) {
            sum += delta_o[k] * who[j * no + k];
        }
        delta_h[j] = h * (1.0 - h) * sum;
        errsum += Math.abs(delta_h[j]);
    }
    return errsum;
}

function bpnn_adjust_weights(delta, ndelta, ly, nly, w, oldw) {
    var new_dw;
    var k, j;
    var nr = nly + 1,
        nc = ndelta + 1;

    ly[0] = 1.0;

    for (j = 1; j < nc; j++) {
        for (k = 0; k < nr; k++) {
            new_dw = ((ETA * delta[j] * ly[k]) + (MOMENTUM * oldw[k * nc + j]));
            w[k * nc + j] += new_dw;
            oldw[k * nc + j] = new_dw;
        }
    }
}
