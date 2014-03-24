function randomMatrix(matrix, max, min){
  for(var i = 0; i < matrix.length; ++i){
    matrix[i] = Math.random()*(max-min) + min; 
  }  
}

function lud(matrix, size){
  var i,j,k; 
  var sum; 

  for(i=0; i<size; ++i){
   for(j=i; j<size; ++j){
     sum = matrix[i*size+j]; 
     for (k=0; k<i; ++k) sum -= matrix[i*size+k]*matrix[k*size+j];

     matrix[i*size+j] = sum; 
   }

   for (j=i+1; j<size; j++){
       sum=matrix[j*size+i];
       for (k=0; k<i; ++k) sum -=matrix[j*size+k]*matrix[k*size+i];
       matrix[j*size+i]=sum/matrix[i*size+i];
   }
  }
}   

function printMatrix(matrix, size){ 
  for(var i = 0; i <size; ++i){
    var row = [] 
    for(var j = 0; j < size; ++j){
      row.push(matrix[i*size+j]); 
    }
    console.log("[ " + row.join(" ")+ " ]"); 
  }
}

function ludRun(size){
  var matrix = new Float32Array(size*size); 
  randomMatrix(matrix, 0, 10000); 
  //console.log("Matrix of size: " + 1024); 
  //console.log("\n"); 
  //printMatrix(matrix,size); 
  var t1 = Date.now(); 
  lud(matrix, size); 
  var t2 = Date.now();
  //console.log("After LUD \n\n"); 
  //printMatrix(matrix, size); 

  console.log("Time consumed(ms): " + (t2-t1).toFixed(6));
}

ludRun(1024);


