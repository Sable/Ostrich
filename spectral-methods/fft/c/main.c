#include <stdio.h>
#include <stdlib.h>
#include <math.h>
#include "fft.h"
#include "common.h"
#include "common_rand.h"

complex* random_complex_vector(int n){
    complex *x = malloc(sizeof(complex)*n);
    int i;

    for(i=0;i<n; ++i){
        x[i].re = common_randJS()*2 - 1;
        x[i].im = common_randJS()*2 - 1;
    }
    return x;
}

void print_complex_array(complex *x, int n){
    int i;
    for(i = 0; i < n; ++i) fprintf(stderr, "%.6f + %.6fi\n", x[i].re, x[i].im);
}

void print_complex_matrix(complex **x, int n){
    int i;
    for(i=0; i < n; ++i) { print_complex_array(x[i], n); fprintf(stderr, "\n"); }
    fprintf(stderr, "\n");
}

int main(int argc, char** argv){
    complex *x, **m;
    int n = 1024;
    int i;
    stopwatch sw;
    int c;
    int two_exp = 10;

    if (argc > 1) {
        two_exp = atoi(argv[1]);
        n = 1 << two_exp;
        if (two_exp < 0 || two_exp > 30) {
            fprintf(stderr, "ERROR: invalid exponent of '%d' for input size\n",  n);
            exit(1);
        }
    }


    // Test 1D arrays
    /*
    x = random_complex_vector(n);
    stopwatch_start(&sw);
    complex *results = FFT_simple(x,n);
    stopwatch_stop(&sw);
    fprintf(stderr, "The total 1D FFT time for %d size was %lf seconds!\n", n,
      get_interval_by_sec(&sw));
    */

    // Test 2D arrays
    m = malloc(sizeof(complex*)*n);
    for(i=0; i<n; ++i) m[i] = random_complex_vector(n);
    stopwatch_start(&sw);
    complex **results2D = FFT_2D(m,n);
    stopwatch_stop(&sw);

    printf("{ \"status\": %d, \"options\": \"%d\", \"time\": %f }\n", 1, two_exp, get_interval_by_sec(&sw));


    // fprintf(stderr, "1D Input Array: \n");
    // print_complex_array(x, n);
    // fprintf(stderr, "2D Input Array \n");
    // print_complex_matrix(m,n);
    // fprintf(stderr, "1D Output Array: \n");
    // print_complex_array(results, n);
    // fprintf(stderr, "2D Output Array: \n");
    // print_complex_matrix(results2D, n);
    //free(x);
    for(i=0; i<n; ++i) free(m[i]);
    free(m);
}
