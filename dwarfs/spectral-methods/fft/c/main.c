#include <stdio.h>
#include <stdlib.h>
#include "fft.h"
#include "common.h"
#include "common_rand.h"

complex* random_complex_vector(int n){
  complex *x = malloc(sizeof(complex)*n);
  int i;

  for(i=0;i<n; ++i){
      x[i].re = ((abs(common_rand())/(float)RAND_MAX)*2-1);
      x[i].im = ((abs(common_rand())/(float)RAND_MAX)*2-1);
  }
  return x;
}

void print_complex_array(complex *x, int n){
  int i;
  for(i = 0; i < n; ++i) printf("%lf + %lfi,", x[i].re, x[i].im);
  printf("\n");
}

void print_complex_matrix(complex **x, int n){
  int i;
  for(i=0; i < n; ++i) print_complex_array(x[i], n);
  printf("\n");
}

int main(){
  complex *x, **m;
  int n = 1024;
  int i;
  stopwatch sw;

  // Test 1D arrays
  x = random_complex_vector(n);
  stopwatch_start(&sw);
  complex *results = FFT_simple(x,n);
  stopwatch_stop(&sw);
  printf("The total 1D FFT time for %d size was %lf seconds!\n", n,
      get_interval_by_sec(&sw));


  // Test 2D arrays
  m = malloc(sizeof(complex*)*n);
  for(i=0; i<n; ++i) m[i] = random_complex_vector(n);
  stopwatch_start(&sw);
  complex **results2D = FFT_2D(m,n);
  stopwatch_stop(&sw);
  printf("The total 2D FFT time for %d x %d size was %lf seconds!\n", n, n,
      get_interval_by_sec(&sw));


  // printf("1D Input Array: \n");
  // print_complex_array(x, n);
  // printf("2D Input Array \n");
  // print_complex_matrix(m,n);
  // printf("1D Output Array: \n");
  // print_complex_array(results, n);
  // printf("2D Output Array: \n");
  // print_complex_matrix(results2D, n);
  free(x);
  for(i=0; i<n; ++i) free(m[i]);
  free(m);
}
