#ifndef SPARSE_FORMATS_H
#define SPARSE_FORMATS_H

/*
 *  Copyright 2008-2009 NVIDIA Corporation
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

#include<math.h>
#include<sys/types.h>
#include<stdio.h>
#include<stdlib.h>
#include<time.h>
#include<string.h>

#ifdef SERIAL
#include "common_args_serial.h"
#else
#include "common_args.h"
#endif

#include "ziggurat.h"

/*
 *  Compressed Sparse Row matrix (aka CSR)
 * valueType = float, IndexType = unsigned int
 */
typedef struct csr_matrix
{//if ith row is empty Ap[i] = Ap[i+1]
    unsigned int index_type;
    float value_type;
    unsigned int num_rows, num_cols, num_nonzeros,density_ppm;
    double density_perc,nz_per_row,stddev;

    unsigned int * Ap;  //row pointer
    unsigned int * Aj;  //column indices
    float * Ax;  //nonzeros
} csr_matrix;

typedef struct triplet
{
	unsigned int i,j;
	float v;
} triplet;

typedef struct coo_matrix
{
	unsigned int index_type;
	float value_type;
	unsigned long density_ppm;
	unsigned int num_rows,num_cols,num_nonzeros;

	triplet* non_zero;
} coo_matrix;

void chck(int b, const char* msg);

int unsigned_int_comparator(const void* v1, const void* v2);

/*
 * Generate random integer between high_bound & low_bound, inclusive.
 *
 * preconditions: 	HB > 0
 * 					LB > 0
 * 					HB >= LB
 * Returns: random int within [LB,HB] otherwise.
 */
unsigned long gen_rand(const long LB, const long HB);

/*
 * Method to generate random matrix of given size and density in compressed sparse row (CSR) form.
 *
 * Preconditions:	N > 0, density > 0
 * Postconditions:	struct csr_matrix representing an NxN matrix of density ~density parts per million is returned
 * 					The exact number of NZ elements as well as the exact density is printed to STDOUT
 *
 * The algorithm used is O[NNZ*lg(NNZ/N)] where NNZ is the number of non-zero elements (N^2 * density/1,000,000)
 *
 * The number of NZ elements in each row is randomly generated from a normal distribution with a mean equal to
 * NNZ / N and a standard deviation equal to this mean scaled by normal_stddev. A corresponding number of column
 * indices is then randomly generated from a normal distribution.
 */
csr_matrix rand_csr(const unsigned int N,const unsigned int density,const double normal_stddev,unsigned long* seed,FILE* log);

#endif
