/*
  Copyright (c)2008-2011 University of Virginia
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted without royalty fees or other restrictions, provided that the following conditions are met:

    * Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
    * Neither the name of the University of Virginia, the Dept. of Computer Science, nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE UNIVERSITY OF VIRGINIA OR THE SOFTWARE AUTHORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

#define BLOCK_SIZE 16

__kernel void
lud_diagonal(__global float *m,
			 __local  float *shadow,
			 int   matrix_dim,
			 int   offset)
{
	int i,j;
	int tx = get_local_id(0);

	int array_offset = offset*matrix_dim+offset;
	for(i=0; i < BLOCK_SIZE; i++){
		shadow[i * BLOCK_SIZE + tx]=m[array_offset + tx];
		array_offset += matrix_dim;
	}

	barrier(CLK_LOCAL_MEM_FENCE);

	for(i=0; i < BLOCK_SIZE-1; i++) {

    if (tx>i){
      for(j=0; j < i; j++)
        shadow[tx * BLOCK_SIZE + i] -= shadow[tx * BLOCK_SIZE + j] * shadow[j * BLOCK_SIZE + i];
		shadow[tx * BLOCK_SIZE + i] /= shadow[i * BLOCK_SIZE + i];
    }

	barrier(CLK_LOCAL_MEM_FENCE);
    if (tx>i){

      for(j=0; j < i+1; j++)
        shadow[(i+1) * BLOCK_SIZE + tx] -= shadow[(i+1) * BLOCK_SIZE + j]*shadow[j * BLOCK_SIZE + tx];
    }

	barrier(CLK_LOCAL_MEM_FENCE);
    }

    array_offset = (offset+1)*matrix_dim+offset;
    for(i=1; i < BLOCK_SIZE; i++){
      m[array_offset+tx]=shadow[i * BLOCK_SIZE + tx];
      array_offset += matrix_dim;
    }

}

__kernel void
lud_perimeter(__global float *m,
			  __local  float *dia,
			  __local  float *peri_row,
			  __local  float *peri_col,
			  int matrix_dim,
			  int offset)
{
    int i,j, array_offset;
    int idx;

    int  bx = get_group_id(0);
    int  tx = get_local_id(0);

    if (tx < BLOCK_SIZE) {
      idx = tx;
      array_offset = offset*matrix_dim+offset;
      for (i=0; i < BLOCK_SIZE/2; i++){
      dia[i * BLOCK_SIZE + idx]=m[array_offset+idx];
      array_offset += matrix_dim;
      }

    array_offset = offset*matrix_dim+offset;
    for (i=0; i < BLOCK_SIZE; i++) {
      peri_row[i * BLOCK_SIZE+ idx]=m[array_offset+(bx+1)*BLOCK_SIZE+idx];
      array_offset += matrix_dim;
    }

    } else {
    idx = tx-BLOCK_SIZE;

    array_offset = (offset+BLOCK_SIZE/2)*matrix_dim+offset;
    for (i=BLOCK_SIZE/2; i < BLOCK_SIZE; i++){
      dia[i * BLOCK_SIZE + idx]=m[array_offset+idx];
      array_offset += matrix_dim;
    }

    array_offset = (offset+(bx+1)*BLOCK_SIZE)*matrix_dim+offset;
    for (i=0; i < BLOCK_SIZE; i++) {
      peri_col[i * BLOCK_SIZE + idx] = m[array_offset+idx];
      array_offset += matrix_dim;
    }

   }
    barrier(CLK_LOCAL_MEM_FENCE);

    if (tx < BLOCK_SIZE) { //peri-row
     idx=tx;
      for(i=1; i < BLOCK_SIZE; i++){
      for (j=0; j < i; j++)
        peri_row[i * BLOCK_SIZE + idx]-=dia[i * BLOCK_SIZE+ j]*peri_row[j * BLOCK_SIZE + idx];
    }
    } else { //peri-col
     idx=tx - BLOCK_SIZE;
     for(i=0; i < BLOCK_SIZE; i++){
      for(j=0; j < i; j++)
        peri_col[idx * BLOCK_SIZE + i]-=peri_col[idx * BLOCK_SIZE+ j]*dia[j * BLOCK_SIZE + i];
      peri_col[idx * BLOCK_SIZE + i] /= dia[i * BLOCK_SIZE+ i];
     }
   }

	barrier(CLK_LOCAL_MEM_FENCE);

  if (tx < BLOCK_SIZE) { //peri-row
    idx=tx;
    array_offset = (offset+1)*matrix_dim+offset;
    for(i=1; i < BLOCK_SIZE; i++){
      m[array_offset+(bx+1)*BLOCK_SIZE+idx] = peri_row[i*BLOCK_SIZE+idx];
      array_offset += matrix_dim;
    }
  } else { //peri-col
    idx=tx - BLOCK_SIZE;
    array_offset = (offset+(bx+1)*BLOCK_SIZE)*matrix_dim+offset;
    for(i=0; i < BLOCK_SIZE; i++){
      m[array_offset+idx] =  peri_col[i*BLOCK_SIZE+idx];
      array_offset += matrix_dim;
    }
  }

}

__kernel void
lud_internal(__global float *m,
			 __local  float *peri_row,
			 __local  float *peri_col,
			int matrix_dim,
			int offset)
{

  int  bx = get_group_id(0);
  int  by = get_group_id(1);

  int  tx = get_local_id(0);
  int  ty = get_local_id(1);

  int i;
  float sum;

  int global_row_id = offset + (by+1)*BLOCK_SIZE;
  int global_col_id = offset + (bx+1)*BLOCK_SIZE;

  peri_row[ty * BLOCK_SIZE + tx] = m[(offset+ty)*matrix_dim+global_col_id+tx];
  peri_col[ty * BLOCK_SIZE + tx] = m[(global_row_id+ty)*matrix_dim+offset+tx];

  barrier(CLK_LOCAL_MEM_FENCE);

  sum = 0;
  for (i=0; i < BLOCK_SIZE; i++)
    sum += peri_col[ty * BLOCK_SIZE + i] * peri_row[i * BLOCK_SIZE + tx];
  m[(global_row_id+ty)*matrix_dim+global_col_id+tx] -= sum;


}
