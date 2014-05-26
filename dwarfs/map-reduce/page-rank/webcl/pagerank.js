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
var d_factor = 0.85; //damping factor
var floatBytes = 4; 
var intBytes = 4; 
var uintBytes = 4; 

// generates an array of random pages and their links
function random_pages(n, noutlinks, divisor){
    var i, j, k;
    var pages = new Int32Array(n*n);  // matrix cell i,j means link from j->i

    for(i=0; i<n; ++i){
        noutlinks[i] = 0;
        for(j=0; j<n; ++j){
            if(i!=j && (Math.commonRandom()%divisor === 0)){
                pages[i*n+j] = 1;
                noutlinks[i] += 1;
            }
        }

        // the case with no outlinks is afunctioned
        if(noutlinks[i] == 0){
            do { k = Math.commonRandom() % n; } while ( k == i);
            pages[i*n + k] = 1;
            noutlinks[i] = 1;
        }
    }
    return pages;
}

function init_array(a, n, val){
    var i;
    for(i=0; i<n; ++i){
        a[i] = val;
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

function webclPR(platformIdx, deviceIdx, n, iter, thresh, divisor){
    var n = n !== undefined ? n : 1000;
    var iter = iter !== undefined ? iter : 1000;
    var thresh = thresh !== undefined ? thresh : 0.00001;
    var divisor = divisor !== undefined ? divisor : 2;
    var pages;
    var maps;
    var page_ranks;
    var noutlinks;
    var t;
    var max_diff=Infinity;
    var difs;

    var programSourceId = "clPR";        
    
    page_ranks = new Float32Array(n);
    maps = new Float32Array(n*n);
    noutlinks = new Int32Array(n);
    difs = new Float32Array(n);

    pages = random_pages(n,noutlinks, divisor);
    init_array(page_ranks, n, 1.0 / n);

    var nzeros = new Float32Array(n);

    var nb_links = 0;
    for (var i=0; i<n; ++i) {
        for (var j=0; j<n; ++j) {
            nb_links += pages[i*n+j];
        }
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
        var mapKernel = kernel("map_page_rank", prgm);
        var reduceKernel = kernel("reduce_page_rank", prgm);

        // ============== Setup Kernel Memory ================     
        // memory has to be allocated in terms of bytes 
        var pages_d = ctx.createBuffer(WebCL.MEM_READ_ONLY, intBytes*n*n);
        var page_ranks_d = ctx.createBuffer(WebCL.MEM_READ_WRITE, floatBytes*n);
        var maps_d = ctx.createBuffer(WebCL.MEM_READ_ONLY, floatBytes*n*n);
        var noutlinks_d = ctx.createBuffer(WebCL.MEM_READ_WRITE, intBytes*n);
        var dif_d = ctx.createBuffer(WebCL.MEM_READ_WRITE, floatBytes*n);

        queue.enqueueWriteBuffer(pages_d, true, 0, intBytes*n*n, pages);
        queue.enqueueWriteBuffer(page_ranks_d, true, 0, floatBytes*n, page_ranks);
        queue.enqueueWriteBuffer(maps_d, true, 0, floatBytes*n*n, maps);
        queue.enqueueWriteBuffer(noutlinks_d, true, 0, intBytes*n, noutlinks);
        queue.enqueueWriteBuffer(dif_d, true, 0, floatBytes*n, difs);

        var maxWorkItems = pd.device.getInfo(WebCL.DEVICE_MAX_WORK_ITEM_SIZES);
        var localSize = [ n < maxWorkItems[0] ? n : maxWorkItems[0] ];
        var globalSize = [ n % localSize[0] === 0 ? n : ((n/localSize[0])+1)*local_size[0]];

        // ============== Set Args and Run Kernels ================ 
        mapKernel.setArg(0, pages_d);
        mapKernel.setArg(1, page_ranks_d);
        mapKernel.setArg(2, maps_d);
        mapKernel.setArg(3, noutlinks_d);
        mapKernel.setArg(4, new Int32Array([n]));

        reduceKernel.setArg(0, page_ranks_d);
        reduceKernel.setArg(1, maps_d); 
        reduceKernel.setArg(2, new Int32Array([n]));
        reduceKernel.setArg(3, dif_d);

        for(t=1; t <= iter && max_diff >= thresh; ++t){
          queue.enqueueNDRangeKernel(mapKernel, 1, null, globalSize, localSize);
          queue.finish();

          queue.enqueueNDRangeKernel(reduceKernel, 1, null, globalSize, localSize);
          queue.finish();

          queue.enqueueReadBuffer(dif_d, true, 0, floatBytes*n, difs);
          queue.finish(); 
          max_diff =  Array.prototype.reduce.call(difs, function(p, c){ return p > c ? p : c}, 0);
          queue.enqueueWriteBuffer(dif_d, true, 0, floatBytes*n, nzeros);
          queue.finish();
        }

        // ============== Pull Results ================ 
        queue.enqueueReadBuffer(maps_d, false, 0, floatBytes*n*n, maps);        
        queue.enqueueReadBuffer(page_ranks_d, false, 0, floatBytes*n, page_ranks);
        queue.finish();

        // ============== Free Memory ================ 
        pages_d.release(); 
        maps_d.release(); 
        page_ranks_d.release();
        noutlinks_d.release();
        dif_d.release();
        prgm.release(); 
        mapKernel.release(); 
        reduceKernel.release(); 
        queue.release(); 
        ctx.release();    
    }
    catch(e){
        alert(e);
    }
    var t2 = performance.now();

    console.log("T reached "+ t+ " at max dif " + max_diff + "\n");
    console.log("The total time taken for a random web of" + n + "pages is " +(t2-t1)/1000 + " seconds\n");
}
webclPR(0, 0);
