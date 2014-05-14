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

function randCRC(numPages, pageSize){
    var numWords = pageSize/4; 
    var page = new Uint32Array(numPages*numWords); 
  
    Array.prototype.forEach.call(page, function(v, i, a) { 
        a[i] = Math.commonRandom();
    });

    return page; 
}
function webclCRC(numpages, pagesize, numexecs, platformIdx, deviceIdx, numblockSize){
    var programSourceId = "clCRC";
    var int_bytes = 4;    
    var blockSize = 16; 
    var numPages = numpages || 1; 
    var pageSize = pagesize || 100000000;
    var numBlockSize = numblockSize || 1; 
    var num_blocks, num_pages_last_block;
    var numExecs = numexecs || 0;

    var data = randCRC(numPages, pageSize);
    var numParallelCRCs = new Int32Array(numBlockSize);
    numParallelCRCs[0] = 128;    
    var numWords = pageSize / 4; 
    var wg_sizes;
    var ocl_remainders  = new Uint32Array(numPages);

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
        var crcKernel= kernel("crc32_slice8", prgm);

        if(!wg_sizes) {
          num_wg_sizes = 1;
          wg_sizes = new Int32Array(num_wg_sizes);
          wg_sizes[0] = 1;
        }

        // // ============== Setup Kernel Memory ================     
        // memory has to be allocated in terms of bytes 
        for(var h = 0; h < numBlockSize; ++h){
          num_blocks = numPages/numParallelCRCs[h];
          if((numPages % numParallelCRCs[h]) != 0) {
            num_blocks++;
            num_pages_last_block = (numPages % numParallelCRCs[h]);
          } else {
            num_pages_last_block = numParallelCRCs[h];
          }

          var dev_input = [];
          var dev_output = [];

          for(var i = 0; i < num_blocks; ++i){
            dev_input[i] = ctx.createBuffer(WebCL.MEM_READ_ONLY, pageSize*numParallelCRCs[h]);
            dev_output[i] = ctx.createBuffer(WebCL.MEM_READ_WRITE, numParallelCRCs[h]*int_bytes);
          }

          for(var ii=0; ii<numExecs; ii++) {
            for(var i=0; i<num_blocks; i++) {
              if(i == num_blocks - 1) {
                global_size = num_pages_last_block;
                local_size = wg_sizes[0];
                if((global_size % local_size) != 0) {
                  local_size = 1;
                  while((global_size % local_size) == 0) local_size = local_size << 1;
                  local_size = local_size >>> 1;
                }
              } else {
                global_size = numParallelCRCs[h];
                local_size = wg_sizes[0];
              }
              // ============== Set Args and Run Kernels ================ 
              // note that __local kernel arguments have to be set to to UintArrays of length 1
              // and the array element must contain the required size 
              

              var global_work = [global_size];
              var local_work = [local_size];

              queue.enqueueWriteBuffer(dev_input[i], false, 0, pageSize*global_size, data.subarray(i*numParallelCRCs[h]*numWords));
              crcKernel.setArg(0, dev_input[i]);            
              crcKernel.setArg(1, new Uint32Array([pageSize]));                    
              crcKernel.setArg(2, new Uint32Array([numWords]));
              crcKernel.setArg(3, dev_output[i]);            
        
              queue.enqueueNDRangeKernel(crcKernel, 1, null, global_work, local_work);            
              queue.enqueueReadBuffer(dev_output[i], false, 0, global_size*int_bytes,ocl_remainders.subarray(i*numParallelCRCs[h]));
              queue.finish(); 

            }
          }
        }
        // ============== Free Memory ================ 
        for(var i = 0; i < num_blocks; ++i){
          dev_input[i].release(); 
          dev_output[i].release(); 
        }
        crcKernel.release(); 
        queue.release(); 
        prgm.release(); 
        ctx.release();    
    }
    catch(e){
        alert(e);
    }
    var t2 = performance.now();
    console.log("Total time elapsed is "+ (t2-t1)/1000+ " seconds");
}
webclCRC(128, 65536, 150, 0, 0);
