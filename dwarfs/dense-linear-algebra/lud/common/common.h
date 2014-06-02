#ifndef _COMMON_H
#define _COMMON_H

#include <time.h>
#include <sys/time.h>

#ifdef __cplusplus
extern "C" {
#endif



#define GET_RAND_FP ( (double)rand() /   \
                     ((double)(RAND_MAX)+(double)(1)) )

#define MIN(i,j) ((i)<(j) ? (i) : (j))

typedef enum _FUNC_RETURN_CODE {
    RET_SUCCESS,
    RET_FAILURE
}func_ret_t;

typedef struct __stopwatch_t{
    struct timeval begin;
    struct timeval end;
}stopwatch;

void 
stopwatch_start(stopwatch *sw);

void 
stopwatch_stop (stopwatch *sw);

double 
get_interval_by_sec(stopwatch *sw);

int 
get_interval_by_usec(stopwatch *sw);

func_ret_t
create_matrix_from_random(double **mp, int size);

func_ret_t
lud_verify(double *m, double *lu, int size);

void
matrix_multiply(double *inputa, double *inputb, double *output, int size);

void
matrix_duplicate(double *src, double **dst, int matrix_dim);

void
print_matrix(double *mm, int matrix_dim);

#ifdef __cplusplus
}
#endif

#endif
