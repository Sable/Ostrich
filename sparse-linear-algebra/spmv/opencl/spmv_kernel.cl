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

void __kernel csr_ocl(const unsigned int num_rows,
		__global unsigned int * Ap,
		__global unsigned int * Aj,
		__global float * Ax,
		__global float * x,
		__global float * y)
{
	unsigned int row = get_global_id(0);

	if(row < num_rows) {
		float sum = y[row];

		const unsigned int row_start = Ap[row];
		const unsigned int row_end = Ap[row+1];

		unsigned int jj = 0;
		for (jj = row_start; jj < row_end; jj++)
			sum += Ax[jj] * x[Aj[jj]];

		y[row] = sum;
	}
}
