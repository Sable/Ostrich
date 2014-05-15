var LIMIT = -999;
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
function rand(){
    return Math.abs(Math.commonRandom());
}

var blosum62= [
	[ 4, -1, -2, -2,  0, -1, -1,  0, -2, -1, -1, -1, -1, -2, -1,  1,  0, -3, -2,  0, -2, -1,  0, -4],
	[-1,  5,  0, -2, -3,  1,  0, -2,  0, -3, -2,  2, -1, -3, -2, -1, -1, -3, -2, -3, -1,  0, -1, -4],
	[-2,  0,  6,  1, -3,  0,  0,  0,  1, -3, -3,  0, -2, -3, -2,  1,  0, -4, -2, -3,  3,  0, -1, -4],
	[-2, -2,  1,  6, -3,  0,  2, -1, -1, -3, -4, -1, -3, -3, -1,  0, -1, -4, -3, -3,  4,  1, -1, -4],
	[ 0, -3, -3, -3,  9, -3, -4, -3, -3, -1, -1, -3, -1, -2, -3, -1, -1, -2, -2, -1, -3, -3, -2, -4],
	[-1,  1,  0,  0, -3,  5,  2, -2,  0, -3, -2,  1,  0, -3, -1,  0, -1, -2, -1, -2,  0,  3, -1, -4],
	[-1,  0,  0,  2, -4,  2,  5, -2,  0, -3, -3,  1, -2, -3, -1,  0, -1, -3, -2, -2,  1,  4, -1, -4],
	[ 0, -2,  0, -1, -3, -2, -2,  6, -2, -4, -4, -2, -3, -3, -2,  0, -2, -2, -3, -3, -1, -2, -1, -4],
	[-2,  0,  1, -1, -3,  0,  0, -2,  8, -3, -3, -1, -2, -1, -2, -1, -2, -2,  2, -3,  0,  0, -1, -4],
	[-1, -3, -3, -3, -1, -3, -3, -4, -3,  4,  2, -3,  1,  0, -3, -2, -1, -3, -1,  3, -3, -3, -1, -4],
	[-1, -2, -3, -4, -1, -2, -3, -4, -3,  2,  4, -2,  2,  0, -3, -2, -1, -2, -1,  1, -4, -3, -1, -4],
	[-1,  2,  0, -1, -3,  1,  1, -2, -1, -3, -2,  5, -1, -3, -1,  0, -1, -3, -2, -2,  0,  1, -1, -4],
	[-1, -1, -2, -3, -1,  0, -2, -3, -2,  1,  2, -1,  5,  0, -2, -1, -1, -1, -1,  1, -3, -1, -1, -4],
	[-2, -3, -3, -3, -2, -3, -3, -3, -1,  0,  0, -3,  0,  6, -4, -2, -2,  1,  3, -1, -3, -3, -1, -4],
	[-1, -2, -2, -1, -3, -1, -1, -2, -2, -3, -3, -1, -2, -4,  7, -1, -1, -4, -3, -2, -2, -1, -2, -4],
	[ 1, -1,  1,  0, -1,  0,  0,  0, -1, -2, -2,  0, -1, -2, -1,  4,  1, -3, -2, -2,  0,  0,  0, -4],
	[ 0, -1,  0, -1, -1, -1, -1, -2, -2, -1, -1, -1, -1, -2, -1,  1,  5, -2, -2,  0, -1, -1,  0, -4],
	[-3, -3, -4, -4, -2, -2, -3, -2, -2, -3, -2, -3, -1,  1, -4, -3, -2, 11,  2, -3, -4, -3, -2, -4],
	[-2, -2, -2, -3, -2, -1, -2, -3,  2, -1, -1, -2, -1,  3, -3, -2, -2,  2,  7, -1, -3, -2, -1, -4],
	[ 0, -3, -3, -3, -1, -2, -2, -3, -3,  3,  1, -2,  1, -1, -2, -2,  0, -3, -1,  4, -3, -2, -1, -4],
	[-2, -1,  3,  4, -3,  0,  1, -1,  0, -3, -4,  0, -3, -3, -2,  0, -1, -4, -3, -3,  4,  1, -1, -4],
	[-1,  0,  0,  1, -3,  3,  4, -2,  0, -3, -3,  1, -1, -3, -1,  0, -1, -3, -2, -2,  1,  4, -1, -4],
	[ 0, -1, -1, -1, -2, -1, -1, -1, -1, -1, -1, -1, -1, -1, -2,  0,  0, -2, -1, -1, -1, -1, -1, -4],
	[-4, -4, -4, -4, -4, -4, -4, -4, -4, -4, -4, -4, -4, -4, -4, -4, -4, -4, -4, -4, -4, -4, -4,  1]
];

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

function webclNeedle(dim, penalty, platformIdx, deviceIdx){
    var programSourceId = "clNeedle";        
    var blockSize = 16; 
    var maxRows = dim + 1; 
    var maxCols = dim + 1;
    var intBytes = 4;
    var referrence = new Int32Array(maxRows*maxCols);
    var inputItemsets = new Int32Array(maxRows*maxCols);
    var outputItemsets = new Int32Array(maxRows*maxCols);
    var size;
    var doTraceBack = false;


    //Used for input itemsets, then after the referrence matrix is constructed it is used/rewritten to store scores.
    for(var i=1; i< maxRows ; i++){    //please define your own sequence. 
      inputItemsets[i*maxCols] = rand() % 10 + 1;
    }

    for(var j=1; j< maxCols ; j++){    //please define your own sequence.
      inputItemsets[j] = rand() % 10 + 1;
    }

    for (var i = 1 ; i < maxCols; i++){
      for (var j = 1 ; j < maxRows; j++){
        referrence[i*maxCols+j] = blosum62[inputItemsets[i*maxCols]][inputItemsets[j]];
      }
    }

    //Fill first row and first column with initial scores -10, -20, -30, ... (upper left corner is set to zero).
    for(var i = 1; i< maxRows ; i++)
      inputItemsets[i*maxCols] = -i * penalty;
    for(j = 1; j< maxCols ; j++)
      inputItemsets[j] = -j * penalty;


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
        var needle1 = kernel("needle_opencl_shared_1", prgm);
        var needle2 = kernel("needle_opencl_shared_2", prgm);

        // ============== Setup Kernel Memory ================     
        // memory has to be allocated in terms of bytes 
        
        size = maxCols * maxRows;
        var clReferrence= ctx.createBuffer(WebCL.MEM_READ_ONLY, size*intBytes);
        var clMatrix = ctx.createBuffer(WebCL.MEM_READ_WRITE , size*intBytes);

        queue.enqueueWriteBuffer(clReferrence, true , 0, size*intBytes, referrence);
        queue.finish();
        queue.enqueueWriteBuffer(clMatrix, true , 0, size*intBytes, inputItemsets);
        queue.finish();

        // ============== Set Args and Run Kernels ================ 

        var localWorkSize = [ blockSize, 1];
        var globalWorkSize = [0, 0];            
        var blockWidth = Math.floor((maxCols - 1) / blockSize);

        for(var i=1; i<=blockWidth; ++i){            
          globalWorkSize[0] = i*localWorkSize[0];
          globalWorkSize[1] = localWorkSize[1];

          needle1.setArg(0, clReferrence);            
          needle1.setArg(1, clMatrix);                    
          needle1.setArg(2, new Int32Array([maxCols]));
          needle1.setArg(3, new Int32Array([penalty]));            
          needle1.setArg(4, new Int32Array([i]));            
          needle1.setArg(5, new Int32Array([blockWidth]));            

          queue.enqueueNDRangeKernel(needle1, 2, null, globalWorkSize, localWorkSize);
          queue.finish();
        }

        for(var i=blockWidth -1; i>=1; i--){
          globalWorkSize[0] = i*localWorkSize[0];
          globalWorkSize[1] = localWorkSize[1];

          needle2.setArg(0, clReferrence);            
          needle2.setArg(1, clMatrix);                    
          needle2.setArg(2, new Int32Array([maxCols]));
          needle2.setArg(3, new Int32Array([penalty]));            
          needle2.setArg(4, new Int32Array([i]));            
          needle2.setArg(5, new Int32Array([blockWidth]));            

          queue.enqueueNDRangeKernel(needle2, 2, null, globalWorkSize, localWorkSize);
          queue.finish();
        }

        queue.enqueueReadBuffer(clMatrix, true, 0, size*intBytes, outputItemsets);
        queue.finish();

        queue.finish(); 
        clReferrence.release();
        clMatrix.release(); 
        prgm.release(); 
        needle1.release(); 
        needle2.release(); 
        queue.release(); 
        ctx.release();    
    }
    catch(e){
        alert(e);
    }
    var t2 = performance.now();

    console.log("Total time elapsed is "+ (t2-t1)/1000+ " seconds");
    
    if(doTraceBack){
      for (i = maxRows - 2,  j = maxRows - 2; i>=0, j>=0;){

        var nw, n, w, traceback;

        if ( i == maxRows - 2 && j == maxRows - 2 )
          console.log(outputItemsets[ i * maxCols + j]); //print the first element


        if ( i == 0 && j == 0 )
          break;


        if ( i > 0 && j > 0 ){
          nw = outputItemsets[(i - 1) * maxCols + j - 1];
          w  = outputItemsets[ i * maxCols + j - 1 ];
          n  = outputItemsets[(i - 1) * maxCols + j];
        }
        else if ( i == 0 ){
          nw = n = LIMIT;
          w  = outputItemsets[ i * maxCols + j - 1 ];
        }
        else if ( j == 0 ){
          nw = w = LIMIT;
          n  = outputItemsets[(i - 1) * maxCols + j];
        }
        else{
        }

        traceback = Math.max(nw, w, n);

        console.log(traceback);

        if(traceback === nw )
        {i--; j--; continue;}

        else if(traceback == w )
        {j--; continue;}

        else if(traceback == n )
        {i--; continue;}

        else
          ;
      }
      console.log("\n");
    }

}
