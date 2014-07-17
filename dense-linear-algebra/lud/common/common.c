#include <string.h>
#include <stdlib.h>
#include <stdio.h>
#include <time.h>
#include <math.h>

#include "common.h"
#include "common_rand.h"

void stopwatch_start(stopwatch *sw){
    if (sw == NULL)
        return;

    memset(&sw->begin, 0, sizeof(struct timeval));
    memset(&sw->end  , 0, sizeof(struct timeval));

    gettimeofday(&sw->begin, NULL);
}

void stopwatch_stop(stopwatch *sw){
    if (sw == NULL)
        return;

    gettimeofday(&sw->end, NULL);
}

double
get_interval_by_sec(stopwatch *sw){
    if (sw == NULL)
        return 0;
    return ((double)(sw->end.tv_sec-sw->begin.tv_sec)+(double)(sw->end.tv_usec-sw->begin.tv_usec)/1000000);
}

int
get_interval_by_usec(stopwatch *sw){
    if (sw == NULL)
        return 0;
    return ((sw->end.tv_sec-sw->begin.tv_sec)*1000000+(sw->end.tv_usec-sw->begin.tv_usec));
}

func_ret_t
create_matrix_from_random(double **mp, int size){
    double *l, *u, *m;
    int i,j,k;
    double sum;


    l = (double*)malloc(size*size*sizeof(double));
    if ( l == NULL)
       return RET_FAILURE;

    u = (double*)malloc(size*size*sizeof(double));
    if ( u == NULL) {
       free(l);
       return RET_FAILURE;
    }

    m = (double *)malloc(size*size*sizeof(double));
    if ( m == NULL) {
        free(l);
        free(u);
        return RET_FAILURE;
    }

    for (i = 0; i < size; i++) {
        for (j=0; j < size; j++) {
            if (i>j) {
                l[i*size+j] = common_randJS();
            } else if (i == j) {
                l[i*size+j] = 1;
            } else {
                l[i*size+j] = 0;
            }
        }
    }

    // The u matrix is transposed to facilitate indexing
    // during matrix multiplication
    for (j=0; j < size; j++) {
        for (i=0; i < size; i++) {
           if (i>j) {
               u[j*size+i] = 0;
           }else {
               u[j*size+i] = common_randJS();
           }
        }
    }

    for (i=0; i < size; i++) {
        for (j=0; j < size; j++) {
            sum = 0;
            for (k=0; k <= MIN(i,j); k++) {
                sum += l[i*size+k] * u[j*size+k];
            }
            m[i*size+j] = sum;
        }
    }

    free(l);
    free(u);

    *mp = m;

    return RET_SUCCESS;
}

func_ret_t
create_matrix_from_random_float(float **mp, int size){
    float *l, *u, *m;
    int i,j,k;
    float sum;


    l = (float*)malloc(size*size*sizeof(float));
    if ( l == NULL)
       return RET_FAILURE;

    u = (float*)malloc(size*size*sizeof(float));
    if ( u == NULL) {
       free(l);
       return RET_FAILURE;
    }

    m = (float *)malloc(size*size*sizeof(float));
    if ( m == NULL) {
        free(l);
        free(u);
        return RET_FAILURE;
    }

    for (i = 0; i < size; i++) {
        for (j=0; j < size; j++) {
            if (i>j) {
                l[i*size+j] = common_randJS();
            } else if (i == j) {
                l[i*size+j] = 1;
            } else {
                l[i*size+j] = 0;
            }
        }
    }

    // The u matrix is transposed to facilitate indexing
    // during matrix multiplication
    for (j=0; j < size; j++) {
        for (i=0; i < size; i++) {
           if (i>j) {
               u[j*size+i] = 0;
           }else {
               u[j*size+i] = common_randJS();
           }
        }
    }

    for (i=0; i < size; i++) {
        for (j=0; j < size; j++) {
            sum = 0;
            for (k=0; k <= MIN(i,j); k++) {
                sum += l[i*size+k] * u[j*size+k];
            }
            m[i*size+j] = sum;
        }
    }

    free(l);
    free(u);

    *mp = m;

    return RET_SUCCESS;
}


func_ret_t
lud_verify(double *m, double *lu, int matrix_dim){
    int i,j,k;
    double *tmp = (double*)malloc(matrix_dim*matrix_dim*sizeof(double));

    for (i=0; i < matrix_dim; i ++)
        for (j=0; j< matrix_dim; j++) {
            double sum = 0;
            double l,u;
            for (k=0; k <= MIN(i,j); k++){
                if ( i==k)
                    l=1;
                else
                    l=lu[i*matrix_dim+k];
                u=lu[k*matrix_dim+j];
                sum+=l*u;
            }
        tmp[i*matrix_dim+j] = sum;
    }
/*
  fprintf(stderr, ">>>>>LU<<<<<<<\n");
  for (i=0; i<matrix_dim; i++){
    for (j=0; j<matrix_dim;j++){
        fprintf(stderr, "%f ", lu[i*matrix_dim+j]);
    }
    fprintf(stderr, "\n");
  }
  fprintf(stderr, ">>>>>result<<<<<<<\n");
  for (i=0; i<matrix_dim; i++){
    for (j=0; j<matrix_dim;j++){
        fprintf(stderr, "%f ", tmp[i*matrix_dim+j]);
    }
    fprintf(stderr, "\n");
  }
  fprintf(stderr, ">>>>>input<<<<<<<\n");
  for (i=0; i<matrix_dim; i++){
    for (j=0; j<matrix_dim;j++){
        fprintf(stderr, "%f ", m[i*matrix_dim+j]);
    }
    fprintf(stderr, "\n");
  }
*/

    int good = 1;
    for (i=0; i<matrix_dim; i++){
        for (j=0; j<matrix_dim; j++){
            if ( fabs(m[i*matrix_dim+j]-tmp[i*matrix_dim+j])/fabs(m[i*matrix_dim+j])> 0.0000000001){
                fprintf(stderr, "dismatch at (%d, %d): (o)%.*f (n)%.*f\n", i, j, 21, m[i*matrix_dim+j], 21, tmp[i*matrix_dim+j]);
                good = 0;
            }
        }
    }
    if(good) fprintf(stderr, "Good LUD!");
    else fprintf(stderr, "Bad LUD!");
    free(tmp);
}

void
matrix_duplicate(double *src, double **dst, int matrix_dim) {
    int s = matrix_dim*matrix_dim*sizeof(double);
    double *p = (double *) malloc (s);
    memcpy(p, src, s);
    *dst = p;
}

void
print_matrix(double *m, int matrix_dim) {
    int i, j;
    for (i=0; i<matrix_dim;i++) {
        for (j=0; j<matrix_dim;j++)
            fprintf(stderr, "%f ", m[i*matrix_dim+j]);
        fprintf(stderr, "\n");
    }
}
