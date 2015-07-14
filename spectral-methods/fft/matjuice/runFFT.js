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

function runFFT(twoExp){
    if (twoExp === undefined) {
        twoExp = 10;
    }

    if (twoExp < 0 || twoExp > 30) {
        throw new Error("ERROR: invalid exponent of '" + twoExp + "' for input size");
    }
    var n = 1 << twoExp;
    var data2DReals = createMatrixFromRandom(n);
    var data2DImags = createMatrixFromRandom(n);
    var t1, t2;

    t1 = performance.now();
    var results2D = fft2D(data2DReals, data2DImags, n);
    t2 = performance.now();
    console.log("The total 2D FFT time for " + n + " x " + n + " was " + (t2-t1)/1000 + " s");
    return { status: 1,
             options: "runFFT(" + twoExp + ")",
             time: (t2 - t1) / 1000 };
}
