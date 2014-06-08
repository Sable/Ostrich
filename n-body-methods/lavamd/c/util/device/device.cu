/*
  Copyright (c)2008-2011 University of Virginia
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted without royalty fees or other restrictions, provided that the following conditions are met:

    * Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
    * Neither the name of the University of Virginia, the Dept. of Computer Science, nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE UNIVERSITY OF VIRGINIA OR THE SOFTWARE AUTHORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/


//===============================================================================================================================================================================================================200
//	SET_DEVICE CODE
//===============================================================================================================================================================================================================200

//======================================================================================================================================================150
//	INCLUDE/DEFINE
//======================================================================================================================================================150

#include "device.h"					// (in library path specified to compiler)

//======================================================================================================================================================150
//	FUNCTIONS
//======================================================================================================================================================150

//====================================================================================================100
//	SET DEVICE
//====================================================================================================100

void setdevice(void){

	// variables
	int num_devices;
	int device;

	// work
	cudaGetDeviceCount(&num_devices);
	if (num_devices > 1) {

		// variables
		int max_multiprocessors;
		int max_device;
		cudaDeviceProp properties;

		// initialize variables
		max_multiprocessors = 0;
		max_device = 0;

		for (device = 0; device < num_devices; device++) {
			cudaGetDeviceProperties(&properties, device);
			if (max_multiprocessors < properties.multiProcessorCount) {
				max_multiprocessors = properties.multiProcessorCount;
				max_device = device;
			}
		}
		cudaSetDevice(max_device);
	}

}

//====================================================================================================100
//	GET LAST ERROR
//====================================================================================================100

void checkCUDAError(const char *msg)
{
	cudaError_t err = cudaGetLastError();
	if( cudaSuccess != err) {
		// fprintf(stderr, "Cuda error: %s: %s.\n", msg, cudaGetErrorString( err) );
		printf("Cuda error: %s: %s.\n", msg, cudaGetErrorString( err) );
		fflush(NULL);
		exit(EXIT_FAILURE);
	}
}

//===============================================================================================================================================================================================================200
//	END SET_DEVICE CODE
//===============================================================================================================================================================================================================200
