var maxThreadsPerBlock = 256; 
var sDotBlockSize = 128; 
var sDotBlockNum = 80;
var mvMulBlockSize = 128; 
var mvMulBlockNum = 64; 
var blockDim= 16; 

var T =  1000;        /* Number of static observations */
var S = 2;           /* Number of static symbols */
var N = 60;          /* Number of static states */
var ITERATIONS = 1;           /* Number of iterations */
var EXIT_ERROR= 1;

var pd;
var ctx; 
var src; 
var prgm;
var queue; 

var nstates;
var nsymbols;
var obs; 
var length;
var scale;
var a_d;
var b_d; 
var pi_d; 
var alpha_d; 
var beta_d; 
var gamma_sum_d; 
var xi_sum_d; 
var c_d; 
var ones_n_d; 
var ones_s_d;

var intBytes = 4; 
var floatBytes = 4; 

var kernelInitOnesDev;
var kernelInitAlphaDev;
var kernelCalcAlphaDev;
var kernelScaleAlphaDev;
var kernelInitBetaDev;
var kernelCalcBetaDev;
var kernelCalcGammaDev;
var kernelCalcXiDev;
var kernelEstADev;
var kernelScaleADev;
var kernelAccBDev;
var kernelEstBDev;
var kernelScaleBDev;
var kernelEstPiDev;
var kernelSDotKernelNaive;
var kernelSgemvtKernelNaive;
var kernelSgemvnKernelNaive;

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

Math.log10 = function(n) {
  return Math.log(n)/Math.LN10;
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

function dotProduct(n, x, offsetx, y,  offsety){
    var result = 0.0;
    var i = 0;

    var blocks, threads; 
    if(n < sDotBlockNum){
      blocks = n; 
    } else {
      blocks = sDotBlockNum; 
    }

    threads = sDotBlockSize; 

    if(n <= 0){
      return result;
    }

    var partialSum = new Float32Array(n);
    var partial_sum_d = ctx.createBuffer(WebCL.MEM_READ_WRITE, floatBytes*n);

    queue.enqueueWriteBuffer(partial_sum_d, true, 0, floatBytes*n, partialSum);
    queue.finish(); 

    kernelSDotKernelNaive.setArg(0, new Int32Array([n]));
    kernelSDotKernelNaive.setArg(1, x); 
    kernelSDotKernelNaive.setArg(2, new Int32Array([offsetx]));
    kernelSDotKernelNaive.setArg(3, y);
    kernelSDotKernelNaive.setArg(4, new Int32Array([offsety]));
    kernelSDotKernelNaive.setArg(5, partial_sum_d);

    var globalWorkSize = [ blocks*threads ]; 
    var localWorkSize = [ threads ]; 

    queue.enqueueNDRangeKernel(kernelSDotKernelNaive, 1, null, globalWorkSize, localWorkSize);
    queue.finish();

    queue.enqueueReadBuffer(partial_sum_d, true, 0, floatBytes*n, partialSum);
    queue.finish();

    for(i = 0; i < n; i++)
    {
      result += partialSum[i];
    }

    return result;
}

function matVecMul(trans, m, n, a, lda, x, offsetx, y, offsety){
    if((trans != 'n') && (trans != 't')){
        return;
    }

    if(trans == 't'){
      kernelSGEMVTKernelNaive.setArg(0, new Int32Array([m]));
      kernelSGEMVTKernelNaive.setArg(1, new Int32Array([n]));
      kernelSGEMVTKernelNaive.setArg(2, a); 
      kernelSGEMVTKernelNaive.setArg(3, new Int32Array([lda]));
      kernelSGEMVTKernelNaive.setArg(4, x);
      kernelSGEMVTKernelNaive.setArg(5, new Int32Array([offsetx]));
      kernelSGEMVTKernelNaive.setArg(6, y);
      kernelSGEMVTKernelNaive.setArg(7, new Int32Array([offsety]));

      var globalWorkSize = [mvMulBlockNum*mvMulBlockSize];
      var localWorkSize = [mvMulBlockSize];

      queue.enqueueNDRangeKernel(kernelSGEMVTKernelNaive, 1, null, globalWorkSize, localWorkSize);
      queue.finish();
    }
    else{
      kernelSGEMVNKernelNaive.setArg(0, new Int32Array([m]));
      kernelSGEMVNKernelNaive.setArg(1, new Int32Array([n]));
      kernelSGEMVNKernelNaive.setArg(2, a); 
      kernelSGEMVNKernelNaive.setArg(3, new Int32Array([lda]));
      kernelSGEMVNKernelNaive.setArg(4, x);
      kernelSGEMVNKernelNaive.setArg(5, new Int32Array([offsetx]));
      kernelSGEMVNKernelNaive.setArg(6, y);
      kernelSGEMVNKernelNaive.setArg(7, new Int32Array([offsety]));

      var globalWorkSize = [mvMulBlockNum*mvMulBlockSize];
      var localWorkSize = [mvMulBlockSize];

      queue.enqueueNDRangeKernel(kernelSGEMVNKernelNaive, 1, null, globalWorkSize, localWorkSize);
      queue.finish();
    }
}


function printIM(aa,  m,  n){
    var i=0;
    var j=0;
    for(i=0; i<m;++i){
        for(j=0; j<n;++j){
            console.log(aa[i*n+j]);
        }
    }
}
function printM(aa,  m,  n){
    var i=0;
    var j=0;
    for(i=0; i<m;++i){
        for(j=0; j<n;++j){
            console.log(aa[i*n+j]);
        }
    }
}

/* Calculates the forward variables (alpha) for an HMM and obs. sequence */
function calcAlpha(){
    var threadsPerBlock; 
    var nBlocks;
    var offsetCur;
    var offsetPrev;
    var logLik;
    var t;

    var nstatesA = new Int32Array([nstates]);
    var obstA = new Int32Array([obs[0]]);

    threadsPerBlock = maxThreadsPerBlock; 
    nBlocks = Math.floor((nstates + threadsPerBlock -1)/ threadsPerBlock);

    var globalWorkSize  = [nBlocks * threadsPerBlock];
    var localWorkSize = [threadsPerBlock];

    // initialize alpha variables

    kernelInitAlphaDev.setArg(0, b_d); 
    kernelInitAlphaDev.setArg(1, pi_d);
    kernelInitAlphaDev.setArg(2, nstatesA);
    kernelInitAlphaDev.setArg(3, alpha_d);
    kernelInitAlphaDev.setArg(4, ones_n_d);
    kernelInitAlphaDev.setArg(5, obstA);
    queue.enqueueNDRangeKernel(kernelInitAlphaDev, 1, null, globalWorkSize, localWorkSize);

    /* Sum alpha values to get scaling factor */
    scale[0] = dotProduct(nstates, alpha_d, 0, ones_n_d, 0);

    var temp = 0;

    // Scale the alpha values
    kernelScaleAlphaDev.setArg(0, nstatesA);
    kernelScaleAlphaDev.setArg(1, alpha_d); 
    kernelScaleAlphaDev.setArg(2, new Int32Array([temp]));
    kernelScaleAlphaDev.setArg(3, new Float32Array([scale[0]]));

    queue.enqueueNDRangeKernel(kernelScaleAlphaDev, 1, null, globalWorkSize, localWorkSize);

    queue.finish();

    /* Initilialize log likelihood */
    logLik = Math.log10(scale[0]);


    // better then reallocating each time in the loop
    var offsetPrevA = new Int32Array(1); 
    var offsetCurA = new Int32Array(1);
    var scaletA = new Float32Array(1);

    /* Calculate the rest of the alpha variables */
    for (t = 1; t < length ; t++) {

        /* Calculate offsets */
        offsetPrev = (t-1)*nstates;
        offsetCur = t*nstates;
        offsetPrevA[0] = offsetPrev; 
        offsetCurA[0] = offsetCur; 
        obstA[0] = obs[t];

        /* Multiply transposed A matrix by alpha(t-1) */
        /* Note: the matrix is auto-transposed by cublas reading column-major */
        // matVecMul( 'N', nstates, nstates, 1.0f, a_d, nstates,
        //              alpha_d + offset_prev, 1, 0, alpha_d + offset_cur, 1 );
        matVecMul( 'n', nstates, nstates, a_d, nstates,
                     alpha_d, offsetPrev, alpha_d, offsetCur);

        kernelCalcAlphaDev.setArg(0, nstatesA);
        kernelCalcAlphaDev.setArg(1, alpha_d);
        kernelCalcAlphaDev.setArg(2, offsetCurA); 
        kernelCalcAlphaDev.setArg(3, b_d);
        kernelCalcAlphaDev.setArg(4, obstA);

        queue.enqueueNDRangeKernel(kernelCalcAlphaDev, 1, null, globalWorkSize, localWorkSize);
        queue.finish();

        /* Sum alpha values to get scaling factor */
        scale[t] = dotProduct(nstates, alpha_d, offsetCur, ones_n_d, 0);
        scaletA[0] = scale[t];

        // scale alpha values
        kernelScaleAlphaDev.setArg(0, nstatesA);
        kernelScaleAlphaDev.setArg(1, alpha_d);
        kernelScaleAlphaDev.setArg(2, offsetCurA);
        kernelScaleAlphaDev.setArg(3, scaletA);

        queue.enqueueNDRangeKernel(kernelScaleAlphaDev, 1, null, globalWorkSize, localWorkSize);
        queue.finish();

        logLik += Math.log10(scale[t]);
    }
    return logLik;
}


/* Calculates the backward variables (beta) */
function calcBeta(){
    var threadsPerBlock; 
    var nBlocks; 
    var t; 
    var offset; 
    var nstatesA = new Int32Array([nstates]);
    var scaletA = new Float32Array(1);
    var obstA = new Int32Array(1);
    var tA = new Int32Array(1);

    threadsPerBlock = maxThreadsPerBlock; 
    nBlocks = Math.floor((nstates + threadsPerBlock -1) / threadsPerBlock);
    var globalWorkSize = [ nBlocks * threadsPerBlock ]; 
    var localWorkSize = [threadsPerBlock];

    offset = (length -1)*nstates;
    scaletA[0] = scale[length -1];

    kernelInitBetaDev.setArg(0, nstatesA);
    kernelInitBetaDev.setArg(1, beta_d);
    kernelInitBetaDev.setArg(2, new Int32Array([offset]));
    kernelInitBetaDev.setArg(3, scaletA);
    queue.enqueueNDRangeKernel(kernelInitBetaDev, 1, null, globalWorkSize, localWorkSize);
    queue.finish();

    /* Calculate the rest of the beta variables */
    for (t = length - 2; t >= 0; t--) {
        scaletA[0] = scale[t];
        obstA[0] = obs[t+1];
        tA[0] = t;

        kernelCalcBetaDev.setArg(0, beta_d);
        kernelCalcBetaDev.setArg(1, b_d);
        kernelCalcBetaDev.setArg(2, scaletA);
        kernelCalcBetaDev.setArg(3, nstatesA); 
        kernelCalcBetaDev.setArg(4, obstA);
        kernelCalcBetaDev.setArg(5, tA);

        queue.enqueueNDRangeKernel(kernelCalcBetaDev, 1, null, globalWorkSize, localWorkSize);
        queue.finish();
        
        matVecMul( 'n', nstates, nstates, a_d, nstates,
                     beta_d, t * nstates, beta_d, t * nstates);
    }
    return 0;
}


/* Calculates the gamma sum */
function calcGammaSum(){
    var threadsPerBlock; 
    var nBlocks; 
    var size; 
    var t; 
    var nstatesA = new Int32Array([nstates]);
    var tA = new Int32Array(1);


    threadsPerBlock = maxThreadsPerBlock; 
    nBlocks = Math.floor((nstates + threadsPerBlock -1) / threadsPerBlock);
    var globalWorkSize = [ nBlocks * threadsPerBlock ]; 
    var localWorkSize = [threadsPerBlock];

    var gammaSumZeros = new Float32Array(nstates);
    queue.enqueueWriteBuffer(gamma_sum_d, true, 0, floatBytes*nstates, gammaSumZeros);
    queue.finish();

    /* Find sum of gamma variables */
    for (t = 0; t < length; t++) {
        tA[0] = t; 
        kernelCalcGammaDev.setArg(0, gamma_sum_d);    
        kernelCalcGammaDev.setArg(1, alpha_d);
        kernelCalcGammaDev.setArg(2, beta_d);
        kernelCalcGammaDev.setArg(3, nstatesA);   
        kernelCalcGammaDev.setArg(4, tA);
        queue.enqueueNDRangeKernel(kernelCalcGammaDev, 1, null, globalWorkSize, localWorkSize);
        queue.finish();
    }
}

/* Calculates the sum of xi variables */
function calcXiSum(){
    var sumAB; 
    var nBlocks; 
    var size; 
    var t; 
    var nstatesA = new Int32Array([nstates]);
    var sumABA = new Float32Array(1);
    var obstA = new Int32Array(1); 
    var tA = new Int32Array(1);

    var xiSumZeros = new Float32Array(nstates*nstates);
    queue.enqueueWriteBuffer(xi_sum_d, true, 0, floatBytes*nstates*nstates, xiSumZeros);
    queue.finish();


    nBlocks  = Math.floor((nstates + blockDim -1) / blockDim);

    var globalWorkSize = [ nBlocks * blockDim, nBlocks*blockDim]; 
    var localWorkSize = [ blockDim, blockDim];

    for (t = 0; t < length - 1; t++) {
      obstA[0] = obs[t + 1]; 
      tA[0] = t;
        
      sumAB = dotProduct(nstates, alpha_d, t*nstates, beta_d, t*nstates);
      sumABA[0] = sumAB; 

      kernelCalcXiDev.setArg(0, xi_sum_d);
      kernelCalcXiDev.setArg(1, a_d);
      kernelCalcXiDev.setArg(2, b_d);
      kernelCalcXiDev.setArg(3, alpha_d);
      kernelCalcXiDev.setArg(4, beta_d);
      kernelCalcXiDev.setArg(5, sumABA);
      kernelCalcXiDev.setArg(6, nstatesA);
      kernelCalcXiDev.setArg(7, obstA);
      kernelCalcXiDev.setArg(8, tA);

      queue.enqueueNDRangeKernel(kernelCalcXiDev, 2, null, globalWorkSize, localWorkSize);
      queue.finish();
    }

    return 0;
}

/* Re-estimates the state transition probabilities (A) */
function estimateA(){
    var sumAB;
    var nBlocks; 
    var nstatesA = new Int32Array([nstates]);

    nBlocks = Math.floor((nstates + blockDim -1)/blockDim);

    var globalWorkSize = [ nBlocks*blockDim, nBlocks*blockDim ];
    var localWorkSize = [ blockDim, blockDim ] ;

    sumAB = dotProduct(nstates, alpha_d, (length -1)*nstates, beta_d, (length -1)*nstates);

    kernelEstADev.setArg(0, a_d);
    kernelEstADev.setArg(1, alpha_d);
    kernelEstADev.setArg(2, beta_d);
    kernelEstADev.setArg(3, xi_sum_d);
    kernelEstADev.setArg(4, gamma_sum_d);
    kernelEstADev.setArg(5, new Float32Array([sumAB]));
    kernelEstADev.setArg(6, nstatesA);
    kernelEstADev.setArg(7, new Int32Array([length]));

    queue.enqueueNDRangeKernel(kernelEstADev, 2, null, globalWorkSize, localWorkSize);
    queue.finish(); 

    matVecMul('t', nstates, nstates, a_d, nstates, ones_n_d, 0, c_d, 0);

    kernelScaleADev.setArg(0, a_d);
    kernelScaleADev.setArg(1, c_d);
    kernelScaleADev.setArg(2, nstatesA);

    queue.enqueueNDRangeKernel(kernelScaleADev, 2, null, globalWorkSize, localWorkSize);
    queue.finish();

    return 0;
}

/* Re-estimates the output symbol probabilities (B) */
function estimateB(){

    var sumAB; 
    var size;
    var t;
    var gridX; 
    var gridY; 

    var bDZeros = new Float32Array(nstates*nsymbols);
    queue.enqueueWriteBuffer(b_d, true, 0, floatBytes*nstates*nsymbols, bDZeros);
    queue.finish();

    gridX = Math.floor((nstates+blockDim-1)/blockDim);
    gridY = Math.floor((nsymbols+blockDim-1)/blockDim);
    var globalWorkSize = [ gridX * blockDim, gridY*blockDim ];
    var localWorkSize = [ blockDim, blockDim];

    var nstatesA = new Int32Array([nstates]);
    var nsymbolsA = new Int32Array([nsymbols]);
    var sumABA = new Float32Array(1);
    var obstA = new Int32Array(1); 
    var tA = new Int32Array(1);

    for (t = 0; t < length; t++) {

        /* Calculate denominator */
        sumAB = dotProduct(nstates, alpha_d, t * nstates,
                             beta_d, t * nstates);
        sumABA[0] = sumAB;
        obstA[0] = obs[t];
        tA[0] = t;

        kernelAccBDev.setArg(0, b_d);
        kernelAccBDev.setArg(1, alpha_d);
        kernelAccBDev.setArg(2, beta_d);
        kernelAccBDev.setArg(3, sumABA);
        kernelAccBDev.setArg(4, nstatesA);
        kernelAccBDev.setArg(5, nsymbolsA);
        kernelAccBDev.setArg(6, obstA);
        kernelAccBDev.setArg(7, tA);
        queue.enqueueNDRangeKernel(kernelAccBDev, 2, null, globalWorkSize, localWorkSize);

        queue.finish();

    }

    kernelEstBDev.setArg(0, b_d);
    kernelEstBDev.setArg(1, gamma_sum_d);
    kernelEstBDev.setArg(2, nstatesA);
    kernelEstBDev.setArg(3, nsymbolsA);

    queue.enqueueNDRangeKernel(kernelEstBDev, 2, null, globalWorkSize, localWorkSize);
    queue.finish();

    matVecMul( 'n', nstates, nsymbols, b_d, nstates,
                 ones_s_d, 0, c_d, 0);

    /* Normalize B matrix */
    kernelScaleBDev.setArg(0, b_d);
    kernelScaleBDev.setArg(1, c_d);
    kernelScaleBDev.setArg(2, nstatesA);
    kernelScaleBDev.setArg(3, nsymbolsA);
    queue.enqueueNDRangeKernel(kernelScaleBDev, 2, null, globalWorkSize, localWorkSize);
    queue.finish();
    
    return 0;
}

/* Re-estimates the initial state probabilities (Pi) */
function estimatePi(){
    var sumAB; 
    var threadsPerBlock; 
    var nBlocks; 
    
    sumAB = dotProduct(nstates, alpha_d, 0, beta_d, 0);

    threadsPerBlock = maxThreadsPerBlock; 
    nBlocks = Math.floor((nstates+threadsPerBlock -1)/threadsPerBlock);

    var globalWorkSize = [ nBlocks*threadsPerBlock]; 
    var localWorkSize = [ threadsPerBlock ]; 

    kernelEstPiDev.setArg(0, pi_d);
    kernelEstPiDev.setArg(1, alpha_d);
    kernelEstPiDev.setArg(2, beta_d);
    kernelEstPiDev.setArg(3, new Float32Array([sumAB]));
    kernelEstPiDev.setArg(4, new Int32Array([nstates]));

    queue.enqueueNDRangeKernel(kernelEstPiDev, 1, null, globalWorkSize, localWorkSize);
    queue.finish();

    return 0;
}


function printMD(a, m, n, type){
  var x; 
  var bytes = 4; 
  if(type === "int") x = new Int32Array(m*n); 
  else x = new Float32Array(m*n);

  queue.enqueueReadBuffer(a, true, 0, bytes*m*n, x);
  queue.finish();
  printM(x, m, n);
}
// /*******************************************************************************
//  * BWA function
//  */

// /* Runs the Baum-Welch Algorithm on the supplied HMM and observation sequence */
function run_hmm_bwa(platformIdx, deviceIdx, hmm, in_obs, iterations, threshold){
    /* Host-side variables */
    var a;
    var b;
    var pi;
    var newLogLik;
    var oldLogLik = 0;
    var iter;

    var programSourceId = "clHMM";        
    var threadsPerBlock, nBlocks; 
    
    try {      
        //============ Setup WebCL Program ================
        isWebCL();         
        pd = webCLPlatformDevice(platformIdx, deviceIdx);        
        ctx = webCLContext(pd.device);           
        src = source(programSourceId);
        prgm = program(ctx, src);
        build(prgm, pd.device);            
        queue = ctx.createCommandQueue(pd.device);

        //============ Initialize HMM Values================
        a = hmm.a;
        b = hmm.b;
        pi = hmm.pi;
        nsymbols = hmm.nsymbols;
        nstates = hmm.nstates;
        obs = in_obs.data;
        length = in_obs.length;

        //============ Initialize Kernels================
        kernelInitOnesDev = kernel("init_ones_dev", prgm);
        kernelInitAlphaDev = kernel("init_alpha_dev", prgm);
        kernelCalcAlphaDev = kernel("calc_alpha_dev", prgm);
        kernelScaleAlphaDev = kernel("scale_alpha_dev", prgm);
        kernelInitBetaDev = kernel("init_beta_dev", prgm);
        kernelCalcBetaDev = kernel("calc_beta_dev", prgm);
        kernelCalcGammaDev = kernel("calc_gamma_dev", prgm);
        kernelCalcXiDev = kernel("calc_xi_dev", prgm);
        kernelEstADev = kernel("est_a_dev", prgm);
        kernelScaleADev = kernel("scale_a_dev", prgm);
        kernelAccBDev = kernel("acc_b_dev", prgm);
        kernelEstBDev = kernel("est_b_dev", prgm);
        kernelScaleBDev = kernel("scale_b_dev", prgm);
        kernelEstPiDev = kernel("est_pi_dev", prgm);
        kernelSDotKernelNaive = kernel("s_dot_kernel_naive", prgm);
        kernelSGEMVTKernelNaive = kernel("mvm_trans_kernel_naive", prgm);
        kernelSGEMVNKernelNaive = kernel("mvm_non_kernel_naive", prgm);

        //============ Host Memory================
        scale = new Float32Array(length);

        //============ Device Memory================
        a_d = ctx.createBuffer(WebCL.MEM_READ_WRITE, floatBytes*nstates*nstates);
        b_d = ctx.createBuffer(WebCL.MEM_READ_WRITE, floatBytes*nstates*nsymbols); 
        pi_d = ctx.createBuffer(WebCL.MEM_READ_WRITE, floatBytes*nstates);
        alpha_d = ctx.createBuffer(WebCL.MEM_READ_WRITE, floatBytes*nstates*length);
        beta_d = ctx.createBuffer(WebCL.MEM_READ_WRITE, floatBytes*nstates*length); 
        gamma_sum_d = ctx.createBuffer(WebCL.MEM_READ_WRITE, floatBytes*nstates);
        xi_sum_d =  ctx.createBuffer(WebCL.MEM_READ_WRITE, floatBytes*nstates*nstates);
        c_d = ctx.createBuffer(WebCL.MEM_READ_WRITE, floatBytes*nstates);
        ones_n_d = ctx.createBuffer(WebCL.MEM_READ_WRITE, floatBytes*nstates);
        ones_s_d = ctx.createBuffer(WebCL.MEM_READ_WRITE, floatBytes*nsymbols);

        //============ Load Parameters================
        queue.enqueueWriteBuffer(a_d, true, 0, floatBytes*nstates*nstates, a); 
        queue.enqueueWriteBuffer(b_d, true, 0, floatBytes*nstates*nsymbols, b); 
        queue.enqueueWriteBuffer(pi_d, true, 0, floatBytes*nstates, pi);
        queue.finish(); 

        //============ Init Ones================
        threadsPerBlock = maxThreadsPerBlock; 
        nBlocks = Math.floor((nstates + threadsPerBlock - 1) / threadsPerBlock); 
        var globalWorkSize = [ nBlocks*threadsPerBlock ]; 
        var localWorkSize = [ threadsPerBlock ]; 

        kernelInitOnesDev.setArg(0, ones_s_d); 
        kernelInitOnesDev.setArg(1, new Uint32Array([nsymbols]));
        queue.enqueueNDRangeKernel(kernelInitOnesDev,1, null, globalWorkSize, localWorkSize);
        queue.finish();

        /* Run BWA for either max iterations or until threshold is reached */
        for (iter = 0; iter < iterations; iter++) {
            newLogLik = calcAlpha();

            if (newLogLik == EXIT_ERROR) {
                return EXIT_ERROR;
            }
            
            if (calcBeta() == EXIT_ERROR) {
                return EXIT_ERROR;
            }

            calcGammaSum();

            if (calcXiSum() == EXIT_ERROR) {
                return EXIT_ERROR;
            }

            if (estimateA() == EXIT_ERROR) {
                return EXIT_ERROR;
            }

            if (estimateB() == EXIT_ERROR) {
                return EXIT_ERROR;
            }

            if (estimatePi() == EXIT_ERROR) {
                return EXIT_ERROR;
            }

            /* check log_lik vs. threshold */
            if (threshold > 0 && iter > 0) {
                if (Math.abs(pow(10,newLogLik) - pow(10,oldLogLik)) < threshold) {
                    break;
                }
            }

            oldLogLik = newLogLik;
        }

        queue.enqueueReadBuffer(a_d, true, 0, floatBytes*nstates*nstates, a); 
        queue.enqueueReadBuffer(b_d, true, 0, floatBytes*nsymbols*nstates, b); 
        queue.enqueueReadBuffer(pi_d, true, 0, floatBytes*nstates, pi);
        queue.finish();
    }
    catch(e){
      alert(e);
    }

    return newLogLik;
}

/* Time the forward algorithm and vary the number of states */
function webclBWAHmm(platformIdx, deviceIdx, v_, n_, s_, t_){
    /* Initialize variables */
    hmm = {};                /* Initial HMM */
    obs = {};                /* Observation sequence */
    var a;
    var b;
    var pi;
    var obs_seq;
    var log_lik;           /* Output likelihood of FO */
    var mul;
    var m;
    var s = s_ || S, t = t_ || T;
    var n = n_ || N;
    var v_model= v_;
    var i;

    if(!v_model){
        console.log("invalid arguments, must specify varying model");
        return 1;
    }

    if(v_model == 'n')
    {
        /* Create observation sequence */
        obs.length = T;
        obs_seq = new Int32Array(T);
        for (i = 0; i < T; i++) {
            obs_seq[i] = 0;
        }
        obs.data = obs_seq;

        /* Run timed tests from 1*mul to 9*mul states */
        if (n >= 8000) {
            return 0;
        }
        // n = 7000;
        /* Assign HMM parameters */
        hmm.nstates = n;
        hmm.nsymbols = S;

        a = new Float32Array(n*n);
        for (i = 0; i < (n * n); i++) {
            a[i] = 1.0/n;
        }
        hmm.a = a;

        b = new Float32Array(n*s);
        for (i = 0; i < (n * S); i++) {
            b[i] = 1.0/S;
        }
        hmm.b = b;

        pi = new Float32Array(n);
        for (i = 0; i < n; i++) {
            pi[i] = 1.0/n;
        }
        hmm.pi = pi;


        /* Run the BWA on the observation sequence */
        var t1 = performance.now();
        log_lik = run_hmm_bwa(platformIdx, deviceIdx, hmm, obs, ITERATIONS, 0);
        var t2 = performance.now();

        console.log("The time is " + (t2-t1)/1000 + " seconds");
        console.log("Observations\tLog_likelihood\n");
        console.log(n + "\t");
        console.log(log_lik + "\n");

    } else if(v_model == 's'){
        /* Create observation sequence */
        obs.length = T;
        obs_seq = new Int32Array(T);
        for (i = 0; i < T; i++) {
            obs_seq[i] = 0;
        }
        obs.data = obs_seq;

        if (s >= 8000) {
            return 0;
        }

        /* Assign HMM parameters */
        hmm.nstates = N;
        hmm.nsymbols = s;
        a = new Float32ARray(N*N);
        for (i = 0; i < (N * N); i++) {
            a[i] = 1.0/N;
        }
        hmm.a = a;
        b = new Float32Array(N*s);
        for (i = 0; i < (N * s); i++) {
            b[i] = 1.0/s;
        }
        hmm.b = b;
        pi = new Float32Array(N);
        for (i = 0; i < N; i++) {
            pi[i] = 1.0/N;
        }
        hmm.pi = pi;

        /* Run the BWA on the observation sequence */
        var t1 = performance.now();
        log_lik = run_hmm_bwa(platformIdx, deviceIdx, hmm, obs, ITERATIONS, 0);
        var t2 = performance.now();

        console.log("The time is " + (t2-t1)/1000 + " seconds");
        console.log("Observations\tLog_likelihood\n");
        console.log(s +"\t");
        console.log(log_lik + "\n");

    } else if(v_model == 't')
    {
        if (t >= 10000) {
            return 0;
        }
        /* Create HMM */
        hmm.nstates = N;
        hmm.nsymbols = S;
        a = new Float32Array(N*N);
        for (i = 0; i < (N * N); i++) {
            a[i] = 1.0/N;
        }
        hmm.a = a;
        b = new Float32Array(N*S);
        for (i = 0; i < (N * S); i++) {
            b[i] = 1.0/S;
        }
        hmm.b = b;
        pi = new Float32Array(N);
        for (i = 0; i < N; i++) {
            pi[i] = 1.0/N;
        }
        hmm.pi = pi;

        /* Create observation sequence */
        obs.length = t;
        obs_seq = new Int32Array(t);
        for (i = 0; i < t; i++) {
            obs_seq[i] = 0;
        }
        obs.data = obs_seq;

        /* Run the BWA on the observation sequence */
        var t1 = performance.now();
        log_lik = run_hmm_bwa(platformIdx, deviceIdx, hmm, obs, ITERATIONS, 0);
        var t2 = performance.now();

        console.log("The time is " + (t2-t1)/1000 + " seconds");
        console.log("Observations\tLog_likelihood\n");
        console.log(t + "\t");
        console.log(log_lik + "\n");
    }
    return 0;
}

webclBWAHmm(0, 0, 'n');
