function complexPolar(r, t){
  return { "r": r*Math.cos(t), "i": r*Math.sin(t)};
}

function fftSimple(r, i){ 
  var N = r.length;
  var R = new Float32Array(N); 
  var I = new Float32Array(N); 
  
  if(N===1){
    R[0] = r[0]; 
    I[0] = i[0];
    return { "r" : R, "i": I}; 
  } 

  var er = new Float32Array(N/2); 
  var ei = new Float32Array(N/2);
  var dr = new Float32Array(N/2);
  var di = new Float32Array(N/2);

  for(var k=0; k < N/2; ++k){
    er[k] = r[2*k];
    ei[k] = i[2*k]; 
    dr[k] = r[2*k + 1]; 
    di[k] = i[2*k + 1]; 
  } 
  
  var E = fftSimple(er, ei); 
  var D = fftSimple(dr, di);
  var ER = E.r; 
  var EI = E.i;
  var DR = D.r; 
  var DI = D.i; 

  for(var k = 0; k<r.length/2; ++k){
    var c = complexPolar(1, -2.0*Math.PI*k/N);
    DR[k] = DR[k]*c.r - DI[k]*c.i; 
    DI[k] = DR[k]*c.i - DI[k]*c.r;
  }

  for(k = 0; k<N/2; ++k){
    R[k] = ER[k] + DR[k];
    I[k] = EI[k] + DI[k];

    R[k +N/2] = ER[k] - DR[k]; 
    I[k + N/2] = EI[k] - DI[k];
  }
  return {"r":R, "i":I};
}

function transpose(m){
  var tempr, tempi;
  for(var i = 0; i < m.length; ++i){
    for(var j = 0; j < m.length; ++j){
      tempr = m[i]["r"][j]; 
      tempi = m[i]["i"][j];

      m[i]["r"][j] =  m[j]["r"][i];
      m[i]["i"][j] =  m[j]["i"][i];
      
      m[j]["r"][i] = tempr; 
      m[j]["i"][i] = tempi;
    }
  }
}

function fft2D(m){
  var M = [];
  for(var i =0; i < m.length; ++i){
    M[i]  = fftSimple(m[i]["r"], m[i]["i"]); 
  } 
  transpose(M);
  for(var i =0; i < m.length; ++i){
    M[i]  = fftSimple(M[i]["r"], M[i]["i"]); 
  } 
  transpose(M);
  return M;
}

function randomComplexArray(n){
  var r = new Float32Array(n); 
  var i = new Float32Array(n);

  for(var j = 0; j < n; ++j){
    r[j] = Math.random()*2 -1; 
    i[j] = Math.random()*2 -1; 
  }
  return {"r": r, "i": i};
}

function randomComplexMatrix(n){
  var M = [];
  for(var i = 0; i < n; ++i) M[i] = randomComplexArray(n);
  return M;
}
  

function printComplexArray(r, i){
  var a = []; 
  for(var j=0; j < r.length; ++j) a[j] = r[j] + " + " + i[j] + "i";
  console.log ("[ " + Array.prototype.join.call(a, ",") + " ] ");
}

function printComplexMatrix(m){
  for(var i = 0; i < m.length; ++i) 
    printComplexArray(m[i]["r"], m[i]["i"]);
}


function runFFT(){
  var n = 1024; 
  var data1D = randomComplexArray(n); 
  var data2D = randomComplexMatrix(n);
  var t1, t2; 

  t1 = Date.now(); 
  var results = fftSimple(data1D.r,data1D.i); 
  t2 = Date.now();
  console.log("1D FFT took " + (t2-t1) + " ms"); 
  

  t1 = Date.now(); 
  var results2D = fft2D(data2D);
  t2 = Date.now();
  console.log("2D FFT took " + (t2-t1) + " ms");
}

runFFT();

