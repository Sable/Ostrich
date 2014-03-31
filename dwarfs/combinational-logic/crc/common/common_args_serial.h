#ifndef __SERIAL_COMMON_ARGS_H__
#define __SERIAL_COMMON_ARGS_H__

#include <string.h> 
#include <stdio.h> 

#define MINIMUM(i,j) ((i)<(j) ? (i) : (j))

void check(int b,const char* msg);

void* char_new_array(const size_t N,const char* error_msg);

void* int_new_array(const size_t N,const char* error_msg);

void* long_new_array(const size_t N,const char* error_msg);

void* float_new_array(const size_t N,const char* error_msg);

void* float_array_realloc(void* ptr,const size_t N,const char* error_msg);

#endif
