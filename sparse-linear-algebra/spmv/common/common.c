#include <string.h>
#include <stdlib.h>
#include <stdio.h>
#include <time.h>
#include <math.h>

#include "common.h"
#include "common_rand.h"

void stopwatch_start(stopwatch *sw) {
    if (sw == NULL)
        return;

    memset(&sw->begin, 0, sizeof(struct timeval));
    memset(&sw->end  , 0, sizeof(struct timeval));

    gettimeofday(&sw->begin, NULL);
}

void stopwatch_stop(stopwatch *sw) {
    if (sw == NULL)
        return;

    gettimeofday(&sw->end, NULL);
}

double get_interval_by_sec(stopwatch *sw) {
    if (sw == NULL)
        return 0;
    return ((double)(sw->end.tv_sec-sw->begin.tv_sec)+(double)(sw->end.tv_usec-sw->begin.tv_usec)/1000000);
}

int get_interval_by_usec(stopwatch *sw) {
    if (sw == NULL)
        return 0;
    return ((sw->end.tv_sec-sw->begin.tv_sec)*1000000+(sw->end.tv_usec-sw->begin.tv_usec));
}

func_ret_t create_vector_from_random(float **vp, int size) {
  float *v;
  int i;

  srand(time(NULL));

  v = (float *) malloc(size*sizeof(float));
  if( v == NULL){
    return RET_FAILURE;
  }

  for(i = 0; i < size; ++i){
    v[i] = common_randJS();
  }

  *vp = v;
  return RET_SUCCESS;
}

void print_matrix(float *m, int matrix_dim) {
    int i, j;
    for (i=0; i<matrix_dim;i++) {
        for (j=0; j<matrix_dim;j++)
            fprintf(stderr, "%f ", m[i*matrix_dim+j]);
        fprintf(stderr, "\n");
    }
}
