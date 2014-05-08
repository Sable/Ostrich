/* The authors of this work have released all rights to it and placed it
in the public domain under the Creative Commons CC0 1.0 waiver
(http://creativecommons.org/publicdomain/zero/1.0/).

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

Retrieved from: http://en.literateprograms.org/Cooley-Tukey_FFT_algorithm_(C)?oldid=19032
*/

#include "fft.h"
#include <stdlib.h>

#define PI  3.1415926535897932

void transpose(complex**, int);

complex* DFT_naive_1(complex* x, int N) {
    complex* X = (complex*) malloc(sizeof(struct complex_t) * N);
    int k, n;
    for(k=0; k<N; k++) {
        X[k].re = X[k].im = 0.0;
        for(n=0; n<N; n++) {
            X[k] = complex_add(X[k], complex_mult(x[n], complex_from_polar(1, -2*PI*n*k/N)));
        }
    }
    return X;
}
complex* DFT_naive_2(complex* x, int N) {
    complex* X = (complex*) malloc(sizeof(struct complex_t) * N);
    complex* Nth_root = (complex*) malloc(sizeof(struct complex_t) * N);
    int k, n;
    for(k=0; k<N; k++) {
        Nth_root[k] = complex_from_polar(1, -2*PI*k/N);
    }
    for(k=0; k<N; k++) {
        X[k].re = X[k].im = 0.0;
        for(n=0; n<N; n++) {
            X[k] = complex_add(X[k], complex_mult(x[n], Nth_root[(n*k) % N]));
        }
    }
    free(Nth_root);
    return X;
}

complex* FFT_simple(complex* x, int N /* must be a power of 2 */) {
    complex* X = (complex*) malloc(sizeof(struct complex_t) * N);
    complex * d, * e, * D, * E;
    int k;

    if (N == 1) {
        X[0] = x[0];
        return X;
    }

    e = (complex*) malloc(sizeof(struct complex_t) * N/2);
    d = (complex*) malloc(sizeof(struct complex_t) * N/2);
    for(k = 0; k < N/2; k++) {
        e[k] = x[2*k];
        d[k] = x[2*k + 1];
    }

    E = FFT_simple(e, N/2);
    D = FFT_simple(d, N/2);



    for(k = 0; k < N/2; k++) {
        /* Multiply entries of D by the twiddle factors e^(-2*pi*i/N * k) */
        complex c = complex_from_polar(1, -2.0*PI*k/N);
        D[k] = complex_mult(D[k], c);
    }

    for(k = 0; k < N/2; k++) {
        X[k]       = complex_add(E[k], D[k]);
        X[k + N/2] = complex_sub(E[k], D[k]);
    }

    free(e);
    free(d);
    free(D);
    free(E);
    return X;
}

void transpose(complex **x, int N){
    int i,j;
    complex t;
    for(i=0; i < N; ++i) {
        for(j=0; j < i; ++j) {
            t = x[i][j];
            x[i][j] = x[j][i];
            x[j][i] = t;
        }
    }
}


complex** FFT_2D(complex **x, int N){
  complex **X = malloc(sizeof(complex*)*N);
  complex *temp;
  int i;

  for(i=0; i<N; ++i){
    X[i] = FFT_simple(x[i], N);
  }

  transpose(X, N);
  for(i=0; i<N; ++i){
    temp = X[i];
    X[i] = FFT_simple(X[i], N);
    free(temp);
  }
  transpose(X, N);
  return X;
}
