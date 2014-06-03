Math.commonRandom = (function() {
    var seed = 49734321;
    return function() {
        // Robert Jenkins' 32 bit integer hash function.
        seed = ((seed + 0x7ed55d16) + (seed << 12))  & 0xffffffff;
        seed = ((seed ^ 0xc761c23c) ^ (seed >>> 19)) & 0xffffffff;
        seed = ((seed + 0x165667b1) + (seed << 5))   & 0xffffffff;
        seed = ((seed + 0xd3a2646c) ^ (seed << 9))   & 0xffffffff;
        seed = ((seed + 0xfd7046c5) + (seed << 3))   & 0xffffffff;
        seed = ((seed ^ 0xb55a4f09) ^ (seed >>> 16)) & 0xffffffff;
        return seed;
    };
})();

Math.commonRandomJS = function () {
    return Math.abs(Math.commonRandom() / 0x7fffffff);
}

if (typeof performance === "undefined") {
    performance = Date;
}

function randomMatrix(matrix, max, min) {
    for(var i = 0; i < matrix.length; ++i) {
        //matrix[i] = Math.random()*(max-min) + min;
        matrix[i] = Math.abs(Math.commonRandomJS()) * (max-min) + min;
    }
}

function source(id){
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
function program(ctx, src){ return ctx.createProgram(src);}

function build(prgm, device){
    try {        
      prgm.build ([device], "");
    } catch(e) {
      alert ("Failed to build WebCL program. Error "
             + prgm.getBuildInfo (device, 
                                            WebCL.PROGRAM_BUILD_STATUS)
             + ":  " 
             + prgm.getBuildInfo (device, 
                                            WebCL.PROGRAM_BUILD_LOG));
      throw e;
    }
}

function webCLPlatformDevice(platformIdx, deviceIdx){
    var p = webcl.getPlatforms()[platformIdx];
    var d = p.getDevices(WebCL.DEVICE_TYPE_ALL)[deviceIdx];    
    return {"platform": p, "device": d};
}

function webCLContext(device){
    return webcl.createContext(device);
}

function isWebCL(){
    if (window.webcl == undefined) {
          alert("Unfortunately your system does not support WebCL. " +
                "Make sure that you have both the OpenCL driver " +
                "and the WebCL browser extension installed.");
          return false;
      }
      return true; 
}

function kernel(kernel, program){ return program.createKernel(kernel);}

function printM(a, m, n){
    console.log("Printing Matrix:");    
    for(var i =0; i<m; ++i){
        console.log("[" + 
            Array.prototype.join.call(Array.prototype.slice.call(a, i*m, i*m + n), ",") +
            "]");
    }    
}

function webclLUD(platformIdx, deviceIdx, dim){
    var matrix = new Float32Array(dim*dim);    
    var programSourceId = "clLUD";        
    var blockSize = 16; 
    randomMatrix(matrix, 0, 10000);
    
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
        var ludDiagonal = kernel("lud_diagonal", prgm);
        var ludPerimeter = kernel("lud_perimeter", prgm);
        var ludInternal = kernel("lud_internal", prgm);


        // ============== Setup Kernel Memory ================     
        // memory has to be allocated in terms of bytes 
        var float_bytes = 4; 
        var cl_matrix = ctx.createBuffer(WebCL.MEM_READ_WRITE, dim*dim*float_bytes);
        queue.enqueueWriteBuffer(cl_matrix, false, 0, dim*dim*float_bytes, matrix);

        // ============== Set Args and Run Kernels ================ 
        // note that __local kernel arguments have to be set to to UintArrays of length 1
        // and the array element must contain the required size 
        for(var i=0; i<dim - blockSize; i += blockSize){            
            ludDiagonal.setArg(0, cl_matrix);            
            ludDiagonal.setArg(1, new Uint32Array([blockSize * blockSize*float_bytes]));                    
            ludDiagonal.setArg(2, new Int32Array([dim]));
            ludDiagonal.setArg(3, new Int32Array([i]));            
      
            var global_work1  = [ blockSize, 1];
            var local_work1  = [ blockSize, 1];            

            queue.enqueueNDRangeKernel(ludDiagonal, 2, null, global_work1, local_work1);            

            ludPerimeter.setArg(0, cl_matrix);
            ludPerimeter.setArg(1, new Uint32Array([blockSize * blockSize*float_bytes]));
            ludPerimeter.setArg(2, new Uint32Array([blockSize * blockSize*float_bytes]));
            ludPerimeter.setArg(3, new Uint32Array([blockSize * blockSize*float_bytes]));
            ludPerimeter.setArg(4, new Int32Array([dim]));
            ludPerimeter.setArg(5, new Int32Array([i]));
      
            var global_work2 = [blockSize * 2 * ((dim-i)/blockSize-1), 1];
            var local_work2  = [blockSize * 2, 1];

            queue.enqueueNDRangeKernel(ludPerimeter, 2, null, global_work2, local_work2);  

            ludInternal.setArg(0, cl_matrix);
            ludInternal.setArg(1, new Uint32Array([blockSize * blockSize*float_bytes]));
            ludInternal.setArg(2, new Uint32Array([blockSize * blockSize*float_bytes]));
            ludInternal.setArg(3, new Int32Array([dim]));
            ludInternal.setArg(4, new Int32Array([i]));      
      
            var global_work3 = [blockSize * ((dim-i)/blockSize-1), blockSize * ((dim-i)/blockSize-1)];
            var local_work3 = [blockSize, blockSize];
            queue.enqueueNDRangeKernel(ludPerimeter, 2, null,global_work3, local_work3);                
        }

        

        ludDiagonal.setArg(0, cl_matrix);            
        ludDiagonal.setArg(1, new Uint32Array([blockSize * blockSize*float_bytes]));                    
        ludDiagonal.setArg(2, new Int32Array([dim]));
        ludDiagonal.setArg(3, new Int32Array([i]));            
  
        var global_work1  = [ blockSize, 1];
        var local_work1  = [ blockSize, 1];            

        queue.enqueueNDRangeKernel(ludDiagonal, 2, null, global_work1, local_work1); 

        // ============== Pull Results ================ 
        queue.enqueueReadBuffer(cl_matrix, false, 0, dim*dim*float_bytes, matrix);        

        // ============== Free Memory ================ 
        queue.finish(); 
        cl_matrix.release(); 
        prgm.release(); 
        ludDiagonal.release(); 
        ludPerimeter.release(); 
        ludInternal.release(); 
        queue.release(); 
        ctx.release();    
    }
    catch(e){
        alert(e);
    }
    var t2 = performance.now();

    console.log("Total time elapsed is "+ (t2-t1)/1000+ " seconds");
    return { status: 1,
             options: null,
             time: (t2-t1) / 1000 };
}

