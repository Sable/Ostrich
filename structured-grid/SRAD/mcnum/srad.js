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


if (typeof performance === "undefined") {
    performance = Date;
}

Nr = 502;
Nc = 458;
Ne = Nr*Nc;

// allocate variables for surrounding pixels
iN = Int32Array(Nr);							// north surrounding element
iS = Int32Array(Nr);							// south surrounding element
jW = Int32Array(Nc);							// west surrounding element
jE = Int32Array(Nc);							// east surrounding element

// allocate variables for directional derivatives
dN = Float32Array(Ne, [Nc, Nr]);				// north direction derivative
dS = Float32Array(Ne, [Nc, Nr]);				// south direction derivative
dW = Float32Array(Ne, [Nc, Nr]);				// west direction derivative
dE = Float32Array(Ne, [Nc, Nr]);				// east direction derivative

// allocate variable for diffusion coefficient
c  = Float32Array(Ne, [Nc, Nr]);							// diffusion coefficient
// N/S/W/E indices of surrounding pixels (every element of IMAGE)
for (i=0; i<Nr; i++) {
    iN[i] = i-1;									// holds index of IMAGE row above
    iS[i] = i+1;									// holds index of IMAGE row below
}
for (j=0; j<Nc; j++) {
    jW[j] = j-1;									// holds index of IMAGE column on the left
    jE[j] = j+1;									// holds index of IMAGE column on the right
}
// N/S/W/E boundary conditions, fix surrounding indices outside boundary of IMAGE
iN[0]    = 0;										// changes IMAGE top row index from -1 to 0
iS[Nr-1] = Nr-1;									// changes IMAGE bottom row index from Nr to Nr-1
jW[0]    = 0;										// changes IMAGE leftmost column index from -1 to 0
jE[Nc-1] = Nc-1;									// changes IMAGE rightmost column index from Nc to Nc-1

/* Get image data */
// var img = document.getElementById("image");
// var canvas = document.getElementById("canvas");
// var ctx = canvas.getContext("2d");

var image, data, q0sqr;

var expectedOutput = 52608;

//write image
function writeImage() {
    for(var i=0; i<Ne; i++) {
        data[i] = /*Math.round*/(Math.log(image[i])*255)|0;
    }
    /*ctx.clearRect(0, 0, Nc, Nr);
    ctx.putImageData(imageData, 0, 0);*/
}

function calculateSum() {
    var sum=0, sum2=0, i=0, j=0;
    for (i=0; i<Nr; i++) {                                // do for the range of rows in ROI
        for (j=0; j<Nc; j++) {                            // do for the range of columns in ROI
            var tmp   = image[i+Nr*j];                     // get coresponding value in IMAGE
            sum  += tmp;                                    // take corresponding value and add to sum
            sum2 += tmp*tmp;                                // take square of corresponding value and add to sum2
        }
    }
    var meanROI = sum / Ne;                                  // gets mean (average) value of element in ROI
    var varROI  = (sum2 / Ne) - meanROI*meanROI;             // gets variance of ROI
    q0sqr   = varROI / (meanROI*meanROI);                   // gets standard deviation of ROI
}

function calculateDiffusion() {
    var i,j;
    for (j=0; j<Nc; j++) {                                  // do for the range of columns in IMAGE
        for (i=0; i<Nr; i++) {                              // do for the range of rows in IMAGE
            // current index/pixel
            var k = i+j*Nr;
            var Jc = image.get(j,i);                                  // get value of the current element
            // directional derivates (every element of IMAGE)
            dN[k] = image.get(j, iN[i]) - Jc;               // north direction derivative
            dS[k] = image.get(j, iS[i]) - Jc;               // south direction derivative
            dW[k] = image.get(jW[j], i) - Jc;               // west direction derivative
            dE[k] = image.get(jE[j], i) - Jc;               // east direction derivative

            // normalized discrete gradient mag squared (equ 52,53)
            var G2 = (dN.get(j,i)*dN.get(j,i) + dS.get(j,i)*dS.get(j,i) +               // gradient (based on derivatives)
                    dW.get(j,i)*dW.get(j,i) + dE.get(j,i)*dE.get(j,i)) / (Jc*Jc);
            // normalized discrete laplacian (equ 54)
            L = (dN.get(j,i) + dS.get(j,i) + dW.get(j,i) + dE.get(j,i)) / Jc;       // laplacian (based on derivatives)

            // ICOV (equ 31/35)
            var num  = (0.5*G2) - ((1.0/16.0)*(L*L)) ;          // num (based on gradient and laplacian)
            var den  = 1 + (0.25*L);                            // den (based on laplacian)
            var qsqr = num/(den*den);                           // qsqr (based on num and den)

            // diffusion coefficent (equ 33) (every element of IMAGE)
            den = (qsqr-q0sqr) / (q0sqr * (1+q0sqr));       // den (based on qsqr and q0sqr)
            c[k] = 1.0 / (1.0+den);                         // diffusion coefficient (based on den)

            // saturate diffusion coefficent to 0-1 range
            if (c[k] < 0)                                   // if diffusion coefficient < 0
                {c[k] =  0;}                                 // ... set to 0
            else if (c[k] > 1)                              // if diffusion coefficient > 1
                {c[k] = 1;}                                 // ... set to 1
        }
    }
}

function adjustValues(lambda) {
    lambda = 0.25*lambda;
    var i,j;
    for (j=0; j<Nc; j++) {                                  // do for the range of columns in IMAGE
            // printf("NUMBER OF THREADS: %d\n", omp_get_num_threads());
        for (i=0; i<Nr; i++) {                              // do for the range of rows in IMAGE
            // Current index/pixel
            var k = i+j*Nr;
            // diffusion coefficent
            var cN = c.get(j,i);                                      // north diffusion coefficient
            var cS = c.get(j,iS[i]);                           // south diffusion coefficient
            var cW = c.get(j,i);                                      // west diffusion coefficient
            var cE = c.get(jE[j], i);                           // east diffusion coefficient
            // divergence (equ 58)
            var D = cN*dN.get(j,i) + cS*dS.get(j,i) + cW*dW.get(j,i) + cE*dE.get(j,i);  // divergence
            // image update (equ 61) (every element of IMAGE)
            image[k] = image[k] + lambda*D;            // updates image (based on input time step and divergence)
        }
    }
}

function SRAD(niter,lambda) {
    for (var iter=0; iter<niter; iter++) {
        
        calculateSum();
        // directional derivatives, ICOV, diffusion coefficent
        
        calculateDiffusion();
        // divergence & image update
        
        adjustValues(lambda);
    }
}

function runSRAD(niter,lambda) {
    var output = 0, i;
    image = Float32Array(Ne, [Nc, Nr]);
    for(i=0; i<Ne; i++) {
        image[i] = Math.exp(data[i]/255);
    }
    time0 = performance.now();
    SRAD(niter,lambda);
    time1 = performance.now();
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

    console.log("Time: " + ((time1-time0)/1000) + " s");
    return { status: 1,
             options: "runSRAD(" + [niter, lambda].join(",") + ")",
             time: (time1 - time0) / 1000 };
}
