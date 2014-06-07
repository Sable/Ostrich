/*
 * Copyright July 29, 2011 by Virginia Polytechnic Institute and State University
 * All rights reserved.
 *
 * Virginia Polytechnic Institute and State University (Virginia Tech) owns the
 * OpenCL and the 13 Dwarfs software and its associated documentation (Software).
 * You should carefully read the following terms and conditions before using this
 * software.  Your use of this Software indicates your acceptance of this license
 * agreement and all terms and conditions.
 *
 * You are hereby licensed to use the Software for Non-Commercial Purpose only.
 * Non-Commercial Purpose means the use of the Software solely for research.
 * Non-Commercial Purpose excludes, without limitation, any use of the Software, as
 * part of, or in any way in connection with a product or service which is sold,
 * offered for sale, licensed, leased, loaned, or rented.  Permission to use, copy,
 * modify, and distribute this compilation for Non-Commercial Purpose is hereby
 * granted without fee, subject to the following terms of this license.
 */


/*
 */
#define MANUAL_UNROLL_FACTOR 16

	__attribute__((reqd_work_group_size(256,1,1)))
void __kernel csr(const unsigned int num_rows,
		__global const unsigned int* restrict Ap,
		__global const unsigned int* restrict Aj,
		__global const float* restrict Ax,
		__constant float* restrict x,
		__global float* restrict y)
{
	__private size_t row = get_global_id(0);

	if(row < num_rows)
	{
		__private float sum = y[row];

		__private const unsigned int row_start = Ap[row];
		__private const unsigned int row_end   = Ap[row+1];

		__private size_t jj,ii,kk;
		__private float p_Ax[MANUAL_UNROLL_FACTOR];
		__private unsigned int p_Aj[MANUAL_UNROLL_FACTOR];
		for (jj = row_start; jj < row_end; jj=jj+MANUAL_UNROLL_FACTOR)
		{
			if(jj+MANUAL_UNROLL_FACTOR-1 < row_end)
			{
#pragma unroll MANUAL_UNROLL_FACTOR
				for(ii=0; ii<MANUAL_UNROLL_FACTOR; ii++)
					p_Ax[ii] = Ax[jj+ii];

#pragma unroll MANUAL_UNROLL_FACTOR
				for(ii=0; ii<MANUAL_UNROLL_FACTOR; ii++)
					p_Aj[ii] = Aj[jj+ii];

				sum = ((((((sum) + (p_Ax[0]*x[p_Aj[0]])) + ((p_Ax[1]*x[p_Aj[1]]) + (p_Ax[2]*x[p_Aj[2]]))) + (((p_Ax[3]*x[p_Aj[3]]) + (p_Ax[4]*x[p_Aj[4]])) + ((p_Ax[5]*x[p_Aj[5]]) + (p_Ax[6]*x[p_Aj[6]])))) +
							((((p_Ax[7]*x[p_Aj[7]]) + (p_Ax[8]*x[p_Aj[8]])) + ((p_Ax[9]*x[p_Aj[9]]) + (p_Ax[10]*x[p_Aj[10]]))) + (((p_Ax[11]*x[p_Aj[11]]) + (p_Ax[12]*x[p_Aj[12]])) +
								((p_Ax[13]*x[p_Aj[13]]) + (p_Ax[14]*x[p_Aj[14]]))))) + (p_Ax[15]*x[p_Aj[15]]));
			}
			else
			{
				for(kk=jj; kk<row_end; kk++)
					sum += Ax[kk] * x[Aj[kk]];
			}
		}
		y[row] = sum;
	}
}
