function randomMatrix(matrix, max, min) {
	for(var i = 0; i < matrix.length; ++i) {
		//matrix[i] = Math.random()*(max-min) + min;
        matrix[i] = Math.abs(Math.commonRandomJS()) * (max-min) + min;
	}
}

function lud(size) {
	size = size|0;
	var i=0,j=0,k=0;
	var sum=0.0;

	for(i=0; (i|0)<(size|0); (++i)|0) {
		for(j=i|0; (j|0)<(size|0); (++j)|0) {
			sum = +matrix[((((i|0)*(size|0))+j)|0)];
			for (k=0; (k|0)<(i|0); (++k)|0) {
				sum = +(sum - +(+matrix[((i*size)|0+k)|0] * +matrix[((k*size)|0+j)|0]));
			}

			matrix[((i*size)|0+j)|0] = +sum;
		}

		for (j=(i+1)|0; (j|0)<(size|0); (j++)|0) {
			sum=+matrix[((j*size)|0+i)|0];
			for (k=0; (k|0)<(i|0); (++k)|0) {
				sum = +(sum - +(+matrix[((j*size)|0+k)|0] * +matrix[((k*size)|0+i)|0]));
			}
			matrix[((j*size)|0+i)|0] = +(+sum / +matrix[((i*size)|0+i)|0]);
		}
	}
}

var matrix;

function ludRun(size) {
	matrix = new Float32Array(size*size);
	randomMatrix(matrix, 0, 10000);
	console.log("Matrix of size: " + 1024);
	var t1 = performance.now();
	lud(size);
	var t2 = performance.now();

	console.log("Time consumed typed (s): " + ((t2-t1) / 1000).toFixed(6));
}
