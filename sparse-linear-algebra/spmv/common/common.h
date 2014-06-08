#ifndef _COMMON_H
#define _COMMON_H

#include<time.h>
#include<sys/time.h>
#include<stdlib.h>
#include<strings.h> 
#include "common_args_serial.h"

#ifdef __cplusplus
extern "C" {
#endif



#define GET_RAND_FP ( (float)rand() /   \
                     ((float)(RAND_MAX)+(float)(1)) )

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
create_vector_from_random(float **mp, int size); 

void
print_matrix(float *mm, int matrix_dim);

#ifdef __cplusplus
}
#endif

#endif
