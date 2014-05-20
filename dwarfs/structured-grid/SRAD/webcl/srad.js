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

function webclsrad(niter,lambda, platformIdx, deviceIdx) {
    var programSourceId = "clsrad";
    var float_bytes = 8, int_bytes = 4;

    var output = 0;
    image = new Float64Array(Ne);
    for(i=0; i<Ne; i++) {
        image[i] = Math.exp(data[i]/255);
    }

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
        var prepare_kernel = kernel("prepare_kernel", prgm);
        var reduce_kernel = kernel("reduce_kernel", prgm);
        var srad_kernel = kernel("srad_kernel", prgm);
        var srad2_kernel = kernel("srad2_kernel", prgm);

        // // ============== Setup Kernel Memory ================     
        // memory has to be allocated in terms of bytes

        var blocks_x;
        var mem_size = float_bytes * Ne;
        var mem_size_i = int_bytes * Nr;
        var mem_size_j = int_bytes * Nc;

        var d_I = ctx.createBuffer(WebCL.MEM_READ_WRITE, mem_size);
        var d_iN = ctx.createBuffer(WebCL.MEM_READ_WRITE, mem_size_i);
        var d_iS = ctx.createBuffer(WebCL.MEM_READ_WRITE, mem_size_i);
        var d_jE = ctx.createBuffer(WebCL.MEM_READ_WRITE, mem_size_j);
        var d_jW = ctx.createBuffer(WebCL.MEM_READ_WRITE, mem_size_j);
        var d_dN = ctx.createBuffer(WebCL.MEM_READ_WRITE, mem_size);
        var d_dS = ctx.createBuffer(WebCL.MEM_READ_WRITE, mem_size);
        var d_dW = ctx.createBuffer(WebCL.MEM_READ_WRITE, mem_size);
        var d_dE = ctx.createBuffer(WebCL.MEM_READ_WRITE, mem_size);
        var d_c = ctx.createBuffer(WebCL.MEM_READ_WRITE, mem_size);
        var d_sums = ctx.createBuffer(WebCL.MEM_READ_WRITE, mem_size);
        var d_sums2 = ctx.createBuffer(WebCL.MEM_READ_WRITE, mem_size);

        queue.enqueueWriteBuffer(d_I, true, 0, mem_size, image);
        queue.enqueueWriteBuffer(d_iN, true, 0, mem_size_i, iN);
        queue.enqueueWriteBuffer(d_iS, true, 0, mem_size_i, iS);
        queue.enqueueWriteBuffer(d_jE, true, 0, mem_size_j, jE);
        queue.enqueueWriteBuffer(d_jW, true, 0, mem_size_j, jW);

        var local_work_size = [NUMBER_THREADS];

        var blocks_work_size;
        blocks_x = (Ne/local_work_size[0])|0;
        if (Ne % local_work_size[0] != 0) {
            blocks_x = blocks_x + 1;
        }
        blocks_work_size = blocks_x;

        var global_work_size = [blocks_work_size * local_work_size[0]];

        var blocks2_x, blocks2_work_size, global_work_size2 = [], no, mul;
        var mem_size_single = float_bytes;
        var total = new Float64Array(1), total2 = new Float64Array(1), meanROI, meanROI2, varROI, q0sqr;

        prepare_kernel.setArg(0, new Float64Array([Ne]));
        prepare_kernel.setArg(1, d_I);
        prepare_kernel.setArg(2, d_sums);
        prepare_kernel.setArg(3, d_sums2);

        reduce_kernel.setArg(0, new Float64Array([Ne]));
        reduce_kernel.setArg(3, d_sums);
        reduce_kernel.setArg(4, d_sums2);

        srad_kernel.setArg(0, new Float64Array([lambda]));
        srad_kernel.setArg(1, new Int32Array([Nr]));
        srad_kernel.setArg(2, new Int32Array([Nc]));
        srad_kernel.setArg(3, new Float64Array([Ne]));
        srad_kernel.setArg(4, d_iN);
        srad_kernel.setArg(5, d_iS);
        srad_kernel.setArg(6, d_jE);
        srad_kernel.setArg(7, d_jW);
        srad_kernel.setArg(8, d_dN);
        srad_kernel.setArg(9, d_dS);
        srad_kernel.setArg(10, d_dW);
        srad_kernel.setArg(11, d_dE);
        srad_kernel.setArg(13, d_c);
        srad_kernel.setArg(14, d_I);

        srad2_kernel.setArg(0, new Float64Array([lambda]));
        srad2_kernel.setArg(1, new Int32Array([Nr]));
        srad2_kernel.setArg(2, new Int32Array([Nc]));
        srad2_kernel.setArg(3, new Float64Array([Ne]));
        srad2_kernel.setArg(4, d_iN);
        srad2_kernel.setArg(5, d_iS);
        srad2_kernel.setArg(6, d_jE);
        srad2_kernel.setArg(7, d_jW);
        srad2_kernel.setArg(8, d_dN);
        srad2_kernel.setArg(9, d_dS);
        srad2_kernel.setArg(10, d_dW);
        srad2_kernel.setArg(11, d_dE);
        srad2_kernel.setArg(12, d_c);
        srad2_kernel.setArg(13, d_I);

        for (iter=0; iter<niter; iter++) {
            queue.enqueueNDRangeKernel(prepare_kernel, 1, null, global_work_size, local_work_size);

            blocks2_work_size = blocks_work_size;
            global_work_size2[0] = global_work_size[0];
            no = Ne; mul = 1;

            while(blocks2_work_size !== 0) {
                // set arguments that were uptaded in this loop

                reduce_kernel.setArg(1, new Float64Array([no]));
                reduce_kernel.setArg(2, new Int32Array([mul]));
                reduce_kernel.setArg(5, new Int32Array([blocks2_work_size]));
                // launch kernel
                queue.enqueueNDRangeKernel(reduce_kernel, 1, null, global_work_size2, local_work_size);

                no = blocks2_work_size;
                if(blocks2_work_size === 1) {
                    blocks2_work_size = 0;
                }
                else {
                    mul = mul * NUMBER_THREADS;
                    blocks_x = (blocks2_work_size/local_work_size[0])|0;

                    if (blocks2_work_size % local_work_size[0] != 0) {
                        blocks_x = blocks_x + 1;
                    }
                    blocks2_work_size = blocks_x;
                    global_work_size2[0] = blocks2_work_size * local_work_size[0];
                }
            }
            queue.enqueueReadBuffer(d_sums, true, 0, mem_size_single, total);
            queue.enqueueReadBuffer(d_sums2, true, 0, mem_size_single, total2);

            var total0 = total[0];
            var total20 = total2[0];

            console.log(total0);
            console.log(total20);

            meanROI = total0 / NeROI;
            meanROI2 = meanROI * meanROI;
            varROI = (total20 / NeROI) - meanROI2;
            q0sqr = varROI / meanROI2;


            srad_kernel.setArg(12, new Float64Array([q0sqr]));
            queue.finish();
            //queue.enqueueNDRangeKernel(srad_kernel, 1, null, global_work_size, local_work_size);
            //queue.enqueueNDRangeKernel(srad2_kernel, 1, null, global_work_size, local_work_size);
        }
        queue.finish();
        queue.enqueueReadBuffer(d_I, true, 0, mem_size, image);

        // ============== Free Memory ================ 
        d_I.release();
        d_iN.release();
        d_iS.release();
        d_jE.release();
        d_jW.release();
        d_dN.release();
        d_dS.release();
        d_dW.release();
        d_dE.release();
        d_c.release();
        d_sums.release();
        d_sums2.release();

        prepare_kernel.release();
        reduce_kernel.release();
        srad_kernel.release();
        srad2_kernel.release();

        queue.release();
        prgm.release();
        ctx.release();
    } catch (e) {
        alert(e);
    }
    var t2 = performance.now();

    writeImage();
    
    for (i=0; i<Nr; i++) {
        output = output + data[i];
    }

    if (niter === 500 & lambda === 1) {
        if (output !== expectedOutput) {
            throw new Error("ERROR: expected output of '"+expectedOutput+"' but received '"+output+"' instead");
        }
    } else {
        console.log("WARNING: No self-checking step for niter '" + niter + "' and lambda '" + lambda + "'");
    }

    console.log("Time: " + ((t2-t1)/1000) + " s");
}


/**
 * Program Source - Data Generation
 */

NUMBER_THREADS = 512;

Nr = 502;
Nc = 458;
Ne = Nr*Nc;

r1     = 0;
r2     = Nr - 1;
c1     = 0;
c2     = Nc - 1;

// ROI image size    
NeROI = (r2-r1+1)*(c2-c1+1);

// allocate variables for surrounding pixels
iN = new Int32Array(Nr);
iS = new Int32Array(Nr);
jW = new Int32Array(Nc);
jE = new Int32Array(Nc);

// allocate variables for directional derivatives
dN = new Float64Array(Ne);
dS = new Float64Array(Ne);
dW = new Float64Array(Ne);
dE = new Float64Array(Ne);

// allocate variable for diffusion coefficient
c  = new Float64Array(Ne);

for (i=0; i<Nr; i++) {
    iN[i] = i-1;
    iS[i] = i+1;
}
for (j=0; j<Nc; j++) {
    jW[j] = j-1;
    jE[j] = j+1;
}

iN[0]    = 0;
iS[Nr-1] = Nr-1;
jW[0]    = 0;
jE[Nc-1] = Nc-1;

var image;
var data;

var expectedOutput = 52608;

function writeImage() {
    for(i=0; i<Ne; i++) {
        data[i] = /*Math.round*/(Math.log(image[i])*255)|0;
    }
    /*ctx.clearRect(0, 0, Nc, Nr);
    ctx.putImageData(imageData, 0, 0);*/
}

//webclsrad(5, 1, 0, 0);
