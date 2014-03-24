#include "fft.h"
#include <stdlib.h>
#include "common.h"

complex* random_complex_vector(int n){
  complex *x = malloc(sizeof(complex)*n);
  int i; 

  for(i=0;i<n; ++i){
    x[i].re = (rand()/(float)RAND_MAX)*2-1;
    x[i].im = (rand()/(float)RAND_MAX)*2-1;
  }
  return x;
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
  FFT_2D(m,n);
  stopwatch_stop(&sw);
  printf("The total 2D FFT time for %d x %d size was %lf seconds!\n", n, n,  
      get_interval_by_sec(&sw));

  free(x);
  for(i=0; i<n; ++i) free(m[i]);
  free(m);
}

