/*
  Copyright (c)2008-2011 University of Virginia
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted without royalty fees or other restrictions, provided that the following conditions are met:

    * Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
    * Neither the name of the University of Virginia, the Dept. of Computer Science, nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE UNIVERSITY OF VIRGINIA OR THE SOFTWARE AUTHORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/


//----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------200
//	DEFINE / INCLUDE
//----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------200

#define fp double

#define NUMBER_PAR_PER_BOX 100							// keep this low to allow more blocks that share shared memory to run concurrently, code does not work for larger than 110, more speedup can be achieved with larger number and no shared memory used

#define NUMBER_THREADS 128								// this should be roughly equal to NUMBER_PAR_PER_BOX for best performance

#define DOT(A,B) ((A.x)*(B.x)+(A.y)*(B.y)+(A.z)*(B.z))	// STABLE

//===============================================================================================================================================================================================================200
//	STRUCTURES
//===============================================================================================================================================================================================================200

typedef struct
{
	fp x, y, z;

} THREE_VECTOR;

typedef struct
{
	fp v, x, y, z;

} FOUR_VECTOR;

typedef struct nei_str
{

	// neighbor box
	int x, y, z;
	int number;
	long offset;

} nei_str;

typedef struct box_str
{

	// home box
	int x, y, z;
	int number;
	long offset;

	// neighbor boxes
	int nn;
	nei_str nei[26];

} box_str;

typedef struct par_str
{

	fp alpha;

} par_str;

typedef struct dim_str
{

	// input arguments
	int cur_arg;
	int arch_arg;
	int cores_arg;
	int boxes1d_arg;

	// system memory
	long number_boxes;
	long box_mem;
	long space_elem;
	long space_mem;
	long space_mem2;

} dim_str;

//===============================================================================================================================================================================================================200
//	FUNCTION PROTOTYPES
//===============================================================================================================================================================================================================200

int
main(	int argc,
		char *argv []);
