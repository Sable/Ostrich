#include "common_args_serial.h" 
#include <stdlib.h>
#include <stdio.h> 

void check(int b,const char* msg)
{
	if(!b)
	{
		fprintf(stderr,"error: %s\n\n",msg);
		exit(-1);
	}
}

void* char_new_array(const size_t N,const char* error_msg)
{
	void* ptr;
  ptr = malloc(N * sizeof(char));
  check(ptr != NULL,error_msg);
	return ptr;
}

void* int_new_array(const size_t N,const char* error_msg)
{
	void* ptr;
  ptr = malloc(N * sizeof(int));
  check(ptr != NULL,error_msg);
	return ptr;
}

void* long_new_array(const size_t N,const char* error_msg)
{
	void* ptr;
  ptr = malloc(N * sizeof(long));
  check(ptr != NULL,error_msg);
	return ptr;
}

void* float_new_array(const size_t N,const char* error_msg)
{
	void* ptr;
  ptr = malloc(N * sizeof(float));
  check(ptr != NULL,error_msg);
	return ptr;
}

void* float_array_realloc(void* ptr,const size_t N,const char* error_msg)
{
  ptr = realloc(ptr,N * sizeof(float));
  check(ptr != NULL,error_msg);
	return ptr;
}
