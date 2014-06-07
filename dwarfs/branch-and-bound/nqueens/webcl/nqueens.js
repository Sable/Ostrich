/*
 * The MIT License (MIT)
 *
 * Copyright (c) 2014, Erick Lavoie, Faiz Khan, Sujay Kathrotia, Vincent
 * Foley-Bourgon, Laurie Hendren
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */


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

function build(prgm, device, options){
    try {
      prgm.build ([device], options);
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

function kernelWorkItems(kernel, device){
    var workItems = kernel.getWorkGroupInfo(device, WebCL.KERNEL_WORK_GROUP_SIZE);
    return workItems;
}

function deviceMaxWorkGroupSize(device){
  return device.getInfo(WebCL.DEVICE_MAX_WORK_GROUP_SIZE);
}

function maxComputeUnits(device){
  return device.getInfo(WebCL.DEVICE_MAX_COMPUTE_UNITS);
}
function bitScan(x){
	var res = 0;
	res |= (x & 0xaaaaaaaa) ? 1 : 0;
	res |= (x & 0xcccccccc) ? 2 : 0;
	res |= (x & 0xf0f0f0f0) ? 4 : 0;
	res |= (x & 0xff00ff00) ? 8 : 0;
	res |= (x & 0xffff0000) ? 16 : 0;
	return res;
}

function solverInformation(device, queue){
  var solver = {};
  solver["cpu"] = (device.getInfo(WebCL.DEVICE_TYPE) & WebCL.DEVICE_TYPE_CPU) !=0;
  solver["threads"] = 0;
  solver["queue"] = queue;
  solver["enableAtomics"] = false;
  solver["enableChar"] = false;
  solver["forceLocal"] = false;
  solver["enableVectorize"] = false;
  solver["forceVec4"] = false;
  solver["maxThreads"] = 0;

  var exts = device.getInfo(WebCL.DEVICE_EXTENSIONS);

  if(exts.search("cl_khr_global_int32_base_atomics") != -1 && !solver["cpu"]){
    solver["enableAtomics"] = true;
  }
  if(exts.search("cl_khr_global_int32_base_atomics") != -1){
    solver["enableChar"] = true;
  }
  return solver;
}

function enableVectorization(device, solverInfo, forceNoVectorize){
  var vectorWidth = device.getInfo(WebCL.DEVICE_PREFERRED_VECTOR_WIDTH_INT);

  if(!forceNoVectorize && !solverInfo.cpu && vectorWidth != 1){
    solverInfo.enableVectorize = true;
    solverInfo.enableLocal = true;
  }
}

function buildOpts(solverInfo, workItems){
  var settings = "";

  settings += "-D WORK_ITEMS=" + workItems;

  if(solverInfo.cpu){
    settings += " -D FORCE_CPU";
  }
	else if(solverInfo.forceLocal) {
		settings += " -D FORCE_LOCAL";
	}


  if(solverInfo.enableAtomics && ! solverInfo.cpu){
    settings += " -D USE_ATOMICS";
  }

  if(solverInfo.enableVectorize){
    settings += " -D ENABLE_VECTORIZE";

    if(!solver.forceVec4){
      settings += " -D USE_VEC2";
    }
  }


  if(solverInfo.enableChar){
    settings += " -D ENABLE_CHAR";
  }

  return settings;
}

function sleep(milliseconds) {
    var start = new Date().getTime();
      for (var i = 0; i < 1e7; i++) {
            if ((new Date().getTime() - start) > milliseconds){
                    break;
                        }
              }
}


function printArray(a){
  console.log(Array.prototype.join.call(a, ","));
  console.log("\n");
}


function download(strData, strFileName, strMimeType) {
	var D = document,
		a = D.createElement("a");
		strMimeType= strMimeType || "application/octet-stream";

	if (navigator.msSaveBlob) { // IE10+
		return navigator.msSaveBlob(new Blob([strData], {type: strMimeType}), strFileName);
	} /* end if(navigator.msSaveBlob) */



	if ('download' in a) { //html5 A[download]
		if(window.URL){
			a.href= window.URL.createObjectURL(new Blob([strData]));

 		}else{
			a.href = "data:" + strMimeType + "," + encodeURIComponent(strData);
		}
		a.setAttribute("download", strFileName);
		a.innerHTML = "downloading...";
		D.body.appendChild(a);
		setTimeout(function() {
			a.click();
			D.body.removeChild(a);
			if(window.URL){setTimeout(function(){ window.URL.revokeObjectURL(a.href);}, 250 );}
		}, 66);
		return true;
	} /* end if('download' in a) */


	//do iframe dataURL download (old ch+FF):
	var f = D.createElement("iframe");
	D.body.appendChild(f);
	f.src = "data:" +  strMimeType   + "," + encodeURIComponent(strData);

	setTimeout(function() {
		D.body.removeChild(f);
	}, 333);
	return true;
} /* end download() */

function webclNQ(platformIdx, deviceIdx, boardSize){
    var programSourceId = "clNQueens";
    var blockSize = 0;
    var workItems;
    var maxSize;
    var solutionsFinal = 0;
    var uniqueSolutionsFinal = 0;
    var maxPitch;
    var blockMultiplier;
    var units;
    var lastTotalSize=0;
    var forceNoVectorize = false;
    var t1 = performance.now();
    try {
        //============ Setup WebCL Program ================
        isWebCL();
        var pd = webCLPlatformDevice(platformIdx, deviceIdx);
        var ctx = webCLContext(pd.device);
        var src = source(programSourceId);
        var prgm = program(ctx, src);
        var queue = ctx.createCommandQueue(pd.device);

        var solverInfo = solverInformation(pd.device, queue);

        enableVectorization(pd.device, solverInfo, forceNoVectorize);

        workItems = solverInfo.enableVectorize ?
          (solverInfo.forceVec4 ? 64 : 128) : 256;
        build(prgm, pd.device, buildOpts(solverInfo, workItems));

        //============== Initialize Kernels ================
        solverInfo["nqueen"] = kernel("nqueen", prgm);
        solverInfo["nqueen1"] = kernel("nqueen1", prgm);

        //============== NQueen Specific Setup =============
        solverInfo["maxWorkItems"] = kernelWorkItems(solverInfo.nqueen, pd.device);
        maxSize = deviceMaxWorkGroupSize(pd.device);
        units = maxComputeUnits(pd.device);

        if(solverInfo.maxWorkItems > 256) solverInfo.maxWorkItems = 256;

        if(blockSize != 0){
          solverInfo.maxWorkItems = blockSize * (solverInfo.enableVectorize ?
          (solverInfo.forceVec4 ? 4 : 2) : 1);
        }

        // javaScript does not have integer division
        blockMultiplier = Math.floor((maxSize + 255) / 256);

        if(solverInfo.maxThreads === 0){
          if(solverInfo.enableAtomics){
            solverInfo.maxThreads = solverInfo.maxWorkItems * units *
              (blockMultiplier == 1 ? 1 : blockMultiplier - 1);
          }
          else if(solverInfo.enableVectorize) {
            solverInfo.maxThreads = solverInfo.maxWorkItems * units * blockMultiplier * 2;
          }
          else {
            solverInfo.maxThreads = solverInfo.maxWorkItems * units * blockMultiplier * 4;
          }
        }

        if(solverInfo.forceLocal && solverInfo.maxWorkItems < 256){
          // rebuild program

          if(solverInfo.nqueen != undefined) solverInfo.nqueen.release();
          if(solverInfo.nqueen1 != undefined) solverInfo.nqueen1.release();

          workItems = solverInfo.enableVectorize ?
            (solverInfo.forceVec4 ? Math.floor(solverInfo.maxWorkItems / 4): Math.floor(solverInfo.maxWorkItems/2)) : solverInfo.maxWorkItems;
          build(prgm, pd.device, buildOpts(solverInfo, workItems));
          solverInfo["nqueen"] = kernel("nqueen", prgm);
          solverInfo["nqueen1"] = kernel("nqueen1", prgm);

          if(solverInfo.maxThreads % solverInfo.maxWorkItems != 0){
            solverInfo.maxThreads = Math.floor(solverInfo.maxThreads / solverInfo.maxWorkItems) * solverInfo.maxWorkItems;
          }
        }

        //========= NQUEENS COMPUTE =======================
        var total = 1000000000;
        var level = 0;
        var i = boardSize;
        var enableAtomics = solverInfo.enableAtomics;
        var enableVectorize = solverInfo.enableVectorize;
        var mnThreads = solverInfo.maxThreads;
        var lastTotalSize = 0;
        var nMaxWorkItems = solverInfo.maxWorkItems;
        var nqueen = solverInfo["nqueen"];
        var nqueen1 = solverInfo["nqueen1"];

        while(total > 0 && i > 0){
          total = Math.floor(total / Math.floor((i + 1)/ 2));
          i--;
          level++;
        }

        if(level > boardSize - 2) {
          level = boardSize - 2;
        }

        if(level > 11){
          level = 11;
        }

        var threads;
        var maxThreads = 0;
        var maxPitch;

        if(solverInfo.enableAtomics) {
          threads = mnThreads * 16;
        }
        else {
          threads = mnThreads;
        }

        if(maxThreads < threads) {
          maxThreads = threads;
        }

        maxPitch = (maxThreads + 15) & ~0xf;

        // ============== Setup Kernel Memory ================
        // memory has to be allocated in terms of bytes
        var intBytes = 4;
        var paramBuffer = ctx.createBuffer(WebCL.MEM_READ_ONLY, maxPitch*intBytes*(4+32));
        var resultBuffer = ctx.createBuffer(WebCL.MEM_WRITE_ONLY , maxPitch*intBytes*4 );
        var forbiddenBuffer = ctx.createBuffer(WebCL.MEM_READ_ONLY, intBytes*32);
        var globalIndex = ctx.createBuffer(WebCL.MEM_READ_WRITE, intBytes);

        // ============= NQueen Masks =======================
        var maskVector = new Uint32Array(maxPitch*(4+32));
        var results = new Uint32Array(maxPitch*4);
        var forbiddenWritten = false;
        var solutions = 0;
        var uniqueSolutions = 0;
        var vecSize = solverInfo.forceVec4 ? 4 : 2;

        var boardMask = (1 << boardSize) - 1;
        var totalSize = 0;

        for(var j = 0; j < Math.floor(boardSize / 2); j++) {
          var masks = new Uint32Array(32);
          var leftMasks = new Uint32Array(32);
          var rightMasks = new Uint32Array(32);
          var ms = new Uint32Array(32);
          var ns = new Uint32Array(32);
          var forbidden = new Uint32Array(32);
          var borderMask = 0;
          var idx = 0;
          var i = 0;

          masks[0] = (1 << j);
          leftMasks[0] = 1 << (j + 1);
          rightMasks[0] = (1 << j) >>> 1;
          ms[0] = masks[0] | leftMasks[0] | rightMasks[0];
          ns[0] = (1 << j);

          for(var k = 0; k < j; k++) {
            borderMask |= (1 << k);
            borderMask |= (1 << (boardSize - k - 1));
          }

          for(var k = 0; k < boardSize; k++) {
            if(k == boardSize - 2) {
              forbidden[k] = borderMask;
            }
            else if((k + 1) < j || (k + 1) > boardSize - j - 1) {
              forbidden[k] = 1 | (1 << (boardSize - 1));
            }
            else {
              forbidden[k] = 0;
            }
          }

          forbidden[boardSize - 1] = 0xffffffff;
          forbiddenWritten = false;

          while(i >= 0) {
            if(j == 0) {
              if(i >= 1) {
                var m = ms[i] | (i + 1 < idx ? 2 : 0);
                ns[i + 1] = (m + 1) & ~m;
              }
              else {
                ns[i + 1] = ((ms[i] + 1) & ~ms[i]);
                if(i == 0) {
                  idx = bitScan(ns[i + 1]);
                }
              }
            }
            else {
              var m = ms[i] | forbidden[i];
              ns[i + 1] = (m + 1) & ~m;
            }

            if(i == boardSize - level - 1) {
              maskVector[totalSize] = masks[i];
              maskVector[totalSize + maxPitch] = leftMasks[i];
              maskVector[totalSize + maxPitch * 2] = rightMasks[i];
              if(j == 0) {
                maskVector[totalSize + maxPitch * 3] = idx - i < 0 ? 0 : idx - i;
              }
              else {
                // check rotation
                maskVector[totalSize + maxPitch * 3] = j;
              }

              for(var k = 0; k <= i; k++) {
                maskVector[totalSize + maxPitch * (k + 4)] = ns[k];
              }
              totalSize++;

              if(totalSize == maxThreads) {
                //need to take care of read belwo
                var nqueenKernel = j==0 ? nqueen1 : nqueen;

                var argThreads = solverInfo.enableVectorize ? Math.floor((threads + vecSize - 1) / vecSize) : threads;
                var argPitch = solverInfo.enableVectorize ? Math.floor(maxPitch / vecSize) : maxPitch;
                nqueenKernel.setArg(0, new Uint32Array([boardSize]));
                nqueenKernel.setArg(1, new Uint32Array([level]));
                nqueenKernel.setArg(2, new Uint32Array([argThreads]));
                nqueenKernel.setArg(3, new Uint32Array([argPitch]));
                nqueenKernel.setArg(4, paramBuffer);
                nqueenKernel.setArg(5, resultBuffer);
                nqueenKernel.setArg(6, forbiddenBuffer);
                if(solverInfo.enableAtomics){
                  nqueenKernel.setArg(7, globalIndex);
                }

                if(!forbiddenWritten){
                  var forbidden_sub = new Uint32Array(level + 1);
                  for(var l = 0; l < level + 1; ++l){
                    forbidden_sub[l] = forbidden[boardSize-level-1 + l];
                  }

                  queue.enqueueWriteBuffer(forbiddenBuffer, true, 0, (level +1) *intBytes, forbidden_sub);
                  queue.finish();
                  forbiddenWritten = true;
                }

                queue.enqueueWriteBuffer(paramBuffer, true, 0, maxPitch*intBytes*(4 + 32), maskVector);
                queue.finish();

                var workDim = [enableVectorize ? Math.floor(mnThreads / vecSize) : mnThreads];
                var groupDim = [0];
                var n =  Math.floor(nMaxWorkItems / vecSize);
                groupDim[0] = enableVectorize ? n : nMaxWorkItems;
                var numThreads = workDim[0];
                var nt = new Int32Array([numThreads]);

                if(enableAtomics){
                  queue.enqueueWriteBuffer(globalIndex, true, 0, intBytes, nt);
                  queue.finish();
                }

                queue.enqueueNDRangeKernel(nqueenKernel, 1, null, workDim, groupDim);
                queue.finish();
                queue.flush();

                lastTotalSize = maxThreads;

                if(totalSize > maxThreads){
                  // adjust the data array
                  for(var k = 0; k < 4 + boardSize - level; k++) {
                    for(var ii = 0; ii < (totalSize - maxThreads); ++ii){
                      maskVector[maxPitch*k + i]= maskVector[maxThreads + maxPitch*k + i] ;
                    }
                  }
                }
                totalSize -= threads;
                queue.enqueueReadBuffer(resultBuffer, true, 0, maxPitch*intBytes*4, results);
                queue.finish();

                for(var k = 0; k < lastTotalSize; k++) {
                 if(results[k + maxPitch * 2] != results[k + maxPitch * 3]) {
                    throw "results don't match";
                  }
                  solutions += results[k];
                  uniqueSolutions += results[k + maxPitch];
                }
              }
              i--;
            }
            else if((ns[i + 1] & boardMask) != 0) {
              ms[i] |= ns[i + 1];
              masks[i+1] = masks[i] | ns[i + 1];
              leftMasks[i+1] = (leftMasks[i] | ns[i + 1]) << 1;
              rightMasks[i+1] = (rightMasks[i] | ns[i + 1]) >> 1;
              ms[i+1] = masks[i+1] | leftMasks[i+1] | rightMasks[i + 1];
              i++;
            }
            else {
              i--;
            }
          }

          while(totalSize > 0) {
            for(var k = totalSize; k < maxThreads; k++) {
              maskVector[k] = 0xffffffff;
              maskVector[k + maxPitch] = 0xffffffff;
              maskVector[k + maxPitch * 2] = 0xffffffff;
              maskVector[k + maxPitch * 3] = 0;
              maskVector[k + maxPitch * 4] = 0;
            }

            var nqueenKernel = j === 0 ? nqueen1 : nqueen;

            var tSize = totalSize > threads ? threads : totalSize;
            var argThreads = solverInfo.enableVectorize ? Math.floor((tSize + vecSize - 1) / vecSize) : tSize;
            var argPitch = solverInfo.enableVectorize ? Math.floor(maxPitch / vecSize) : maxPitch;
            nqueenKernel.setArg(0, new Int32Array([boardSize]));
            nqueenKernel.setArg(1, new Int32Array([level]));
            nqueenKernel.setArg(2, new Int32Array([argThreads]));
            nqueenKernel.setArg(3, new Int32Array([argPitch]));
            nqueenKernel.setArg(4, paramBuffer);
            nqueenKernel.setArg(5, resultBuffer);
            nqueenKernel.setArg(6, forbiddenBuffer);
            if(solverInfo.enableAtomics){
              nqueenKernel.setArg(7, globalIndex);
            }

            if(!forbiddenWritten){
              var forbidden_sub = new Uint32Array(level + 1);
              for(var l = 0; l < level + 1; ++l){
                forbidden_sub[l] = forbidden[boardSize-level-1 + l];
              }

              queue.enqueueWriteBuffer(forbiddenBuffer, true, 0, (level +1) *intBytes, forbidden_sub);
              //  this doesn't work for anyone with bright ideas :
              //  queue.enqueueWriteBuffer(forbiddenBuffer, true, 0, (level +1) *intBytes, forbidden.subarray(boardSize-level-1));
              queue.finish();
              forbiddenWritten = true;
            }

            queue.enqueueWriteBuffer(paramBuffer, true, 0, maxPitch*intBytes*(4 + 32), maskVector);
            queue.finish();

            var workDim= [0];

            if(tSize < mnThreads){
              workDim[0] = (enableVectorize ? Math.floor((tSize + vecSize -1)/ vecSize) : tSize);
            }
            else {
              workDim[0] = (enableVectorize ? Math.floor(mnThreads / vecSize) : mnThreads);
            }

            var groupDim = [0];
            var n =  enableVectorize ? Math.floor(nMaxWorkItems / vecSize) : nMaxWorkItems;
            groupDim[0] = n;

            if(workDim[0] % n != 0){
              workDim[0] += n - workDim[0] % n;
            }

            var numThreads = workDim[0];
            var nt= new Int32Array([numThreads]);

            if(solverInfo.enableAtomics){
              queue.enqueueWriteBuffer(globalIndex, true, 0, intBytes, nt);
              queue.finish();
            }

            queue.enqueueNDRangeKernel(nqueenKernel, 1, null, workDim, groupDim);
            queue.finish();
            queue.flush();

            lastTotalSize = tSize;

            if(totalSize > maxThreads){
              // adjust the data array
              for(var k = 0; k < 4 + boardSize - level; k++) {
                for(var ii = 0; ii < (totalSize - maxThreads); ++ii){
                  maskVector[maxPitch*k + ii]= maskVector[maxThreads + maxPitch*k + ii] ;
                }
              }
            }
            totalSize -= tSize;
            queue.enqueueReadBuffer(resultBuffer, true, 0, maxPitch*intBytes*4, results);
            queue.finish();

            for(var k = 0; k < lastTotalSize; k++) {
             if(results[k + maxPitch * 2] != results[k + maxPitch * 3]) {
                throw "results don't match";
              }
              solutions += results[k];
              uniqueSolutions += results[k + maxPitch];
            }
          }
        }

        // // ============== Free Memory ================
        queue.finish();
        paramBuffer.release();
        resultBuffer.release();
        forbiddenBuffer.release();
        solverInfo.nqueen.release();
        solverInfo.nqueen1.release();
        prgm.release();
        queue.release();
        ctx.release();

        uniqueSolutionsFinal = uniqueSolutions;
        solutionsFinal = solutions;
    }
    catch(e){
        alert(e);
    }
    var t2 = performance.now();

    console.log("Solutions: " + solutionsFinal + " unique solutions: " + uniqueSolutionsFinal);
    console.log("Total time elapsed is "+ (t2-t1)/1000+ " seconds");
    return { status: 1,
             options: null,
             time: (t2-t1) / 1000 };
}
