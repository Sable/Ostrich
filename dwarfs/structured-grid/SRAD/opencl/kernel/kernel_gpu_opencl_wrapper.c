//========================================================================================================================================================================================================200
//	DEFINE/INCLUDE
//========================================================================================================================================================================================================200

//======================================================================================================================================================150
//	MAIN FUNCTION HEADER
//======================================================================================================================================================150

#include "./../main.h"								// (in the main program folder)

//======================================================================================================================================================150
//	DEFINE
//======================================================================================================================================================150

//======================================================================================================================================================150
//	LIBRARIES
//======================================================================================================================================================150

#include <stdio.h>									// (in path known to compiler)	needed by printf
#include <string.h>									// (in path known to compiler)	needed by strlen

#ifdef __APPLE__
    #include <OpenCL/opencl.h>
#else
    #include <CL/cl.h>   							// (in path specified to compiler)			needed by OpenCL types and functions
#endif

//======================================================================================================================================================150
//	UTILITIES
//======================================================================================================================================================150

#include "./../util/opencl/opencl.h"				// (in directory)							needed by device functions

//======================================================================================================================================================150
//	KERNEL_GPU_CUDA_WRAPPER FUNCTION HEADER
//======================================================================================================================================================150

#include "./kernel_gpu_opencl_wrapper.h"			// (in directory)

//======================================================================================================================================================150
//	END
//======================================================================================================================================================150


int _deviceType;

#define CHKERR(err, str) \
    if (err != CL_SUCCESS) \
    { \
        fprintf(stdout, "CL Error %d: %s\n", err, str); \
        exit(1); \
    }
#define CHECK_ERROR(err) {if (err != CL_SUCCESS) { \
	fprintf(stderr, "Error: %d\n", err);\
	exit(1); \
}}

cl_command_queue cmd_queue;
cl_context context;
cl_device_id device_id;
cl_program prog;

const char* kernel_file =  "./kernel/kernel_gpu_opencl.cl";

cl_device_id _ocd_get_device(int platform, int device, cl_int dev_type)
{
    cl_int err;
    cl_uint nPlatforms = 1;
    char DeviceName[100];
    cl_device_id* devices;
    err = clGetPlatformIDs(0, NULL, &nPlatforms);
    CHECK_ERROR(err);

    if (nPlatforms <= 0) {
        fprintf(stderr, "No OpenCL platforms found. Exiting.\n");
        exit(0);
    }
    if (platform < 0 || platform >= nPlatforms) // platform ID out of range
    {
        fprintf(stderr, "Platform index %d is out of range. \n", platform);
        exit(-4);
    }
    cl_platform_id *platforms = (cl_platform_id *) malloc(sizeof (cl_platform_id) * nPlatforms);
    err = clGetPlatformIDs(nPlatforms, platforms, NULL);
    CHECK_ERROR(err);

    cl_uint nDevices = 1;
    char platformName[100];
    err = clGetPlatformInfo(platforms[platform], CL_PLATFORM_VENDOR, sizeof (platformName), platformName, NULL);
    CHECK_ERROR(err);
    fprintf(stderr, "Platform Chosen : %s\n", platformName);


	//IF given device ID, use this, and disregard -t parameter if given
	if(device!=-1){
		err = clGetDeviceIDs(platforms[platform], CL_DEVICE_TYPE_ALL, 0, NULL, &nDevices);
		fprintf(stderr, "Number of available devices: %d\n", nDevices);
    	if (nDevices <= 0) {
        	fprintf(stderr, "No OpenCL Device found. Exiting.\n");
        	exit(0);
    	}
		if (device < 0 || device >= nDevices) // platform ID out of range
    	{
        	fprintf(stderr, "Device index %d is out of range. \n", device);
        	exit(-4);
    	}
    	devices = (cl_device_id *) malloc(sizeof (cl_device_id) * nDevices);
		err = clGetDeviceIDs(platforms[platform], CL_DEVICE_TYPE_ALL, nDevices, devices, NULL);
    	err = clGetDeviceInfo(devices[device], CL_DEVICE_NAME, sizeof (DeviceName), DeviceName, NULL);
    	CHECK_ERROR(err);
	}
	//OTHERWISE, check at the device type parameter
	else{
		// query devices
		err = clGetDeviceIDs(platforms[platform], dev_type, 0, NULL, &nDevices);
		if(err == CL_DEVICE_NOT_FOUND)
		{
			fprintf(stderr,"No supported device of requested type found. Falling back to CPU.\n");
			dev_type = CL_DEVICE_TYPE_CPU;
			err = clGetDeviceIDs(platforms[platform], dev_type, 0, NULL, &nDevices);
			if(err == CL_DEVICE_NOT_FOUND){
				fprintf(stderr, "No CPU device available in this platform. Please, check your available OpenCL devices.\n"); 
				exit(-4);
			}
		}
		CHECK_ERROR(err);
		fprintf(stderr, "Number of available devices: %d\n", nDevices);
    	if (nDevices <= 0) {
        	fprintf(stderr, "No OpenCL Device found. Exiting.\n");
        	exit(0);
    	}
		//if (device < 0 || device >= nDevices) // platform ID out of range
    	//{
       	//	fprintf(stderr, "Device index %d is out of range. \n", device);
        //	exit(-4);
    	//}
    	devices = (cl_device_id *) malloc(sizeof (cl_device_id) * nDevices);
    	err = clGetDeviceIDs(platforms[platform], dev_type, nDevices, devices, NULL);
    	//Get the first available device of requested type
    	err = clGetDeviceInfo(devices[0], CL_DEVICE_NAME, sizeof (DeviceName), DeviceName, NULL);
    	device=0;
    	CHECK_ERROR(err);	
	}
	    
    //Return
    fprintf(stderr, "Device Chosen : %s\n", DeviceName);
    return devices[device];
}
cl_program ocdBuildProgramFromFile(cl_context context, cl_device_id device_id, const char* kernel_file_name)
{
	cl_int err;
	cl_program program;
	size_t kernelLength;
	char* kernelSource;
	FILE* kernel_fp;
	size_t items_read;
	const char* kernel_file_mode;

	if (_deviceType == 3) //FPGA
		kernel_file_mode = "rb";
	else //CPU or GPU or MIC
		kernel_file_mode = "r";

	kernel_fp = fopen(kernel_file_name, kernel_file_mode);
	if(kernel_fp == NULL){
		fprintf(stderr,"common_ocl.ocdBuildProgramFromFile() - Cannot open kernel file!");
		exit(-1);
	}
	fseek(kernel_fp, 0, SEEK_END);
	kernelLength = (size_t) ftell(kernel_fp);
	kernelSource = (char *)malloc(sizeof(char)*kernelLength);
	if(kernelSource == NULL){
		fprintf(stderr,"common_ocl.ocdBuildProgramFromFile() - Heap Overflow! Cannot allocate space for kernelSource.");
		exit(-1);
	}
	rewind(kernel_fp);
	items_read = fread((void *) kernelSource, kernelLength, 1, kernel_fp);
	if(items_read != 1){
		fprintf(stderr,"common_ocl.ocdBuildProgramFromFile() - Error reading from kernelFile");
		exit(-1);
	}
	fclose(kernel_fp);

	/* Create the compute program from the source buffer */
	if (_deviceType == 3) //use Altera FPGA
		program = clCreateProgramWithBinary(context,1,&device_id,&kernelLength,(const unsigned char**)&kernelSource,NULL,&err);
	else //CPU or GPU or MIC
		program = clCreateProgramWithSource(context, 1, (const char **) &kernelSource, &kernelLength, &err);
	CHKERR(err, "common_ocl.ocdBuildProgramFromFile() - Failed to create a compute program!");

	/* Build the program executable */
	if (_deviceType == 3) //use Altera FPGA
		err = clBuildProgram(program,1,&device_id,"-DOPENCL -I.",NULL,NULL);
	else
		err = clBuildProgram(program, 0, NULL, "-DOPENCL -I.", NULL, NULL);
	
	if (err == CL_BUILD_PROGRAM_FAILURE)
	{
		char *buildLog;
		size_t logLen;
		err = clGetProgramBuildInfo(program, device_id, CL_PROGRAM_BUILD_LOG, 0, NULL, &logLen);
		buildLog = (char *) malloc(sizeof(char)*logLen);
		if(buildLog == NULL){
			fprintf(stderr,"common_ocl.ocdBuildProgramFromFile() - Heap Overflow! Cannot allocate space for buildLog.");
			exit(-1);
		}
		err = clGetProgramBuildInfo(program, device_id, CL_PROGRAM_BUILD_LOG, logLen, (void *) buildLog, NULL);
		fprintf(stderr, "CL Error %d: Failed to build program! Log:\n%s", err, buildLog);
		free(buildLog);
		exit(1);
	}
	CHKERR(err,"common_ocl.ocdBuildProgramFromFile() - Failed to build program!");

	free(kernelSource); /* Free kernel source */
	return program;
}
void setup_device(int platform, int device){
    cl_int err;
    cl_int dev_type;

    device_id = _ocd_get_device(platform, device, dev_type);

    // Create a compute context
    context = clCreateContext(0, 1, &device_id, NULL, NULL, &err);
    CHKERR(err, "Failed to create a compute context!");

    // Create a command queue
    cmd_queue = clCreateCommandQueue(context, device_id, 0, &err);
    CHKERR(err, "Failed to create a command queue!");

    prog = ocdBuildProgramFromFile(context, device_id, kernel_file);
}


//========================================================================================================================================================================================================200
//	KERNEL_GPU_CUDA_WRAPPER FUNCTION
//========================================================================================================================================================================================================200

void
kernel_gpu_opencl_wrapper(	fp* image,											// input image
							int Nr,												// IMAGE nbr of rows
							int Nc,												// IMAGE nbr of cols
							long Ne,											// IMAGE nbr of elem
							int niter,											// nbr of iterations
							fp lambda,											// update step size
							long NeROI,											// ROI nbr of elements
							int* iN,
							int* iS,
							int* jE,
							int* jW,
							int iter,											// primary loop
							int mem_size_i,
							int mem_size_j, int platform, int device)
{

	//======================================================================================================================================================150
	// SETUP DEVICE
	//======================================================================================================================================================150

    cl_int error;
	setup_device(platform, device);

	//====================================================================================================100
	//	CREATE Kernels
	//====================================================================================================100

	// Prepare kernel
	cl_kernel prepare_kernel;
	prepare_kernel = clCreateKernel(prog,
									"prepare_kernel",
									&error);
	if (error != CL_SUCCESS)
		fatal_CL(error, __LINE__);

	// Reduce kernel
	cl_kernel reduce_kernel;
	reduce_kernel = clCreateKernel(	prog,
									"reduce_kernel",
									&error);
	if (error != CL_SUCCESS)
		fatal_CL(error, __LINE__);

	// SRAD kernel
	cl_kernel srad_kernel;
	srad_kernel = clCreateKernel(	prog,
									"srad_kernel",
									&error);
	if (error != CL_SUCCESS)
		fatal_CL(error, __LINE__);

	// SRAD2 kernel
	cl_kernel srad2_kernel;
	srad2_kernel = clCreateKernel(	prog,
									"srad2_kernel",
									&error);
	if (error != CL_SUCCESS)
		fatal_CL(error, __LINE__);

	//====================================================================================================100
	//	TRIGGERING INITIAL DRIVER OVERHEAD
	//====================================================================================================100

	// cudaThreadSynchronize();		// the above does it

	//======================================================================================================================================================150
	// 	GPU VARIABLES
	//======================================================================================================================================================150

	// CUDA kernel execution parameters
	int blocks_x;

	//======================================================================================================================================================150
	// 	ALLOCATE MEMORY IN GPU
	//======================================================================================================================================================150

	//====================================================================================================100
	// common memory size
	//====================================================================================================100

	int mem_size;															// matrix memory size
	mem_size = sizeof(fp) * Ne;												// get the size of float representation of input IMAGE

	//====================================================================================================100
	// allocate memory for entire IMAGE on DEVICE
	//====================================================================================================100

	cl_mem d_I;
	d_I = clCreateBuffer(	context,
							CL_MEM_READ_WRITE,
							mem_size,
							NULL,
							&error );
	if (error != CL_SUCCESS)
		fatal_CL(error, __LINE__);

	//====================================================================================================100
	// allocate memory for coordinates on DEVICE
	//====================================================================================================100

	cl_mem d_iN;
	d_iN = clCreateBuffer(	context,
							CL_MEM_READ_WRITE,
							mem_size_i,
							NULL,
							&error );
	if (error != CL_SUCCESS)
		fatal_CL(error, __LINE__);

	cl_mem d_iS;
	d_iS = clCreateBuffer(	context,
							CL_MEM_READ_WRITE,
							mem_size_i,
							NULL,
							&error );
	if (error != CL_SUCCESS)
		fatal_CL(error, __LINE__);

	cl_mem d_jE;
	d_jE = clCreateBuffer(	context,
							CL_MEM_READ_WRITE,
							mem_size_j,
							NULL,
							&error );
	if (error != CL_SUCCESS)
		fatal_CL(error, __LINE__);

	cl_mem d_jW;
	d_jW = clCreateBuffer(	context,
							CL_MEM_READ_WRITE,
							mem_size_j,
							NULL,
							&error );
	if (error != CL_SUCCESS)
		fatal_CL(error, __LINE__);

	//====================================================================================================100
	// allocate memory for derivatives
	//====================================================================================================100

	cl_mem d_dN;
	d_dN = clCreateBuffer(	context,
							CL_MEM_READ_WRITE,
							mem_size,
							NULL,
							&error );
	if (error != CL_SUCCESS)
		fatal_CL(error, __LINE__);

	cl_mem d_dS;
	d_dS = clCreateBuffer(	context,
							CL_MEM_READ_WRITE,
							mem_size,
							NULL,
							&error );
	if (error != CL_SUCCESS)
		fatal_CL(error, __LINE__);

	cl_mem d_dW;
	d_dW = clCreateBuffer(	context,
							CL_MEM_READ_WRITE,
							mem_size,
							NULL,
							&error );
	if (error != CL_SUCCESS)
		fatal_CL(error, __LINE__);

	cl_mem d_dE;
	d_dE = clCreateBuffer(	context,
							CL_MEM_READ_WRITE,
							mem_size,
							NULL,
							&error );
	if (error != CL_SUCCESS)
		fatal_CL(error, __LINE__);

	//====================================================================================================100
	// allocate memory for coefficient on DEVICE
	//====================================================================================================100

	cl_mem d_c;
	d_c = clCreateBuffer(	context,
							CL_MEM_READ_WRITE,
							mem_size,
							NULL,
							&error );
	if (error != CL_SUCCESS)
		fatal_CL(error, __LINE__);

	//====================================================================================================100
	// allocate memory for partial sums on DEVICE
	//====================================================================================================100

	cl_mem d_sums;
	d_sums = clCreateBuffer(	context,
							CL_MEM_READ_WRITE,
							mem_size,
							NULL,
							&error );
	if (error != CL_SUCCESS)
		fatal_CL(error, __LINE__);

	cl_mem d_sums2;
	d_sums2 = clCreateBuffer(	context,
							CL_MEM_READ_WRITE,
							mem_size,
							NULL,
							&error );
	if (error != CL_SUCCESS)
		fatal_CL(error, __LINE__);

	//====================================================================================================100
	// End
	//====================================================================================================100

	//======================================================================================================================================================150
	// 	COPY INPUT TO CPU
	//======================================================================================================================================================150

	//====================================================================================================100
	// Image
	//====================================================================================================100

	error = clEnqueueWriteBuffer(	cmd_queue,
									d_I,
									1,
									0,
									mem_size,
									image,
									0,
									0,
									0);
	if (error != CL_SUCCESS)
		fatal_CL(error, __LINE__);

	//====================================================================================================100
	// coordinates
	//====================================================================================================100

	error = clEnqueueWriteBuffer(	cmd_queue,
									d_iN,
									1,
									0,
									mem_size_i,
									iN,
									0,
									0,
									0);
	if (error != CL_SUCCESS)
		fatal_CL(error, __LINE__);

	error = clEnqueueWriteBuffer(	cmd_queue,
									d_iS,
									1,
									0,
									mem_size_i,
									iS,
									0,
									0,
									0);
	if (error != CL_SUCCESS)
		fatal_CL(error, __LINE__);

	error = clEnqueueWriteBuffer(	cmd_queue,
									d_jE,
									1,
									0,
									mem_size_j,
									jE,
									0,
									0,
									0);
	if (error != CL_SUCCESS)
		fatal_CL(error, __LINE__);

	error = clEnqueueWriteBuffer(	cmd_queue,
									d_jW,
									1,
									0,
									mem_size_j,
									jW,
									0,
									0,
									0);
	if (error != CL_SUCCESS)
		fatal_CL(error, __LINE__);

	//====================================================================================================100
	// End
	//====================================================================================================100

	//======================================================================================================================================================150
	// 	KERNEL EXECUTION PARAMETERS
	//======================================================================================================================================================150

	// threads
	size_t local_work_size[1];
	local_work_size[0] = NUMBER_THREADS;

	// workgroups
	int blocks_work_size;
	size_t global_work_size[1];
	blocks_x = Ne/(int)local_work_size[0];
	if (Ne % (int)local_work_size[0] != 0){												// compensate for division remainder above by adding one grid
		blocks_x = blocks_x + 1;
	}
	blocks_work_size = blocks_x;
	global_work_size[0] = blocks_work_size * local_work_size[0];						// define the number of blocks in the grid

	fprintf(stderr, "max # of workgroups = %d, # of threads/workgroup = %d (ensure that device can handle)\n", (int)(global_work_size[0]/local_work_size[0]), (int)local_work_size[0]);

	//======================================================================================================================================================150
	// 	WHAT IS CONSTANT IN COMPUTATION LOOP
	//======================================================================================================================================================150

	//====================================================================================================100
	//	Prepare Kernel
	//====================================================================================================100

	error = clSetKernelArg(	prepare_kernel,
							0,
							sizeof(long),
							(void *) &Ne);
	if (error != CL_SUCCESS)
		fatal_CL(error, __LINE__);
	error = clSetKernelArg(	prepare_kernel,
							1,
							sizeof(cl_mem),
							(void *) &d_I);
	if (error != CL_SUCCESS)
		fatal_CL(error, __LINE__);
	error = clSetKernelArg(	prepare_kernel,
							2,
							sizeof(cl_mem),
							(void *) &d_sums);
	if (error != CL_SUCCESS)
		fatal_CL(error, __LINE__);
	error = clSetKernelArg(	prepare_kernel,
							3,
							sizeof(cl_mem),
							(void *) &d_sums2);
	if (error != CL_SUCCESS)
		fatal_CL(error, __LINE__);

	//====================================================================================================100
	//	Reduce Kernel
	//====================================================================================================100

	int blocks2_x;
	int blocks2_work_size;
	size_t global_work_size2[1];
	long no;
	int mul;
	int mem_size_single = sizeof(fp) * 1;
	fp total;
	fp total2;
	fp meanROI;
	fp meanROI2;
	fp varROI;
	fp q0sqr;

	error = clSetKernelArg(	reduce_kernel,
							0,
							sizeof(long),
							(void *) &Ne);
	if (error != CL_SUCCESS)
		fatal_CL(error, __LINE__);
	error = clSetKernelArg(	reduce_kernel,
							3,
							sizeof(cl_mem),
							(void *) &d_sums);
	if (error != CL_SUCCESS)
		fatal_CL(error, __LINE__);
	error = clSetKernelArg(	reduce_kernel,
							4,
							sizeof(cl_mem),
							(void *) &d_sums2);
	if (error != CL_SUCCESS)
		fatal_CL(error, __LINE__);

	//====================================================================================================100
	//	SRAD Kernel
	//====================================================================================================100

	error = clSetKernelArg(	srad_kernel,
							0,
							sizeof(fp),
							(void *) &lambda);
	if (error != CL_SUCCESS)
		fatal_CL(error, __LINE__);
	error = clSetKernelArg(	srad_kernel,
							1,
							sizeof(int),
							(void *) &Nr);
	if (error != CL_SUCCESS)
		fatal_CL(error, __LINE__);
	error = clSetKernelArg(	srad_kernel,
							2,
							sizeof(int),
							(void *) &Nc);
	if (error != CL_SUCCESS)
		fatal_CL(error, __LINE__);
	error = clSetKernelArg(	srad_kernel,
							3,
							sizeof(long),
							(void *) &Ne);
	if (error != CL_SUCCESS)
		fatal_CL(error, __LINE__);
	error = clSetKernelArg(	srad_kernel,
							4,
							sizeof(cl_mem),
							(void *) &d_iN);
	if (error != CL_SUCCESS)
		fatal_CL(error, __LINE__);
	error = clSetKernelArg(	srad_kernel,
							5,
							sizeof(cl_mem),
							(void *) &d_iS);
	if (error != CL_SUCCESS)
		fatal_CL(error, __LINE__);
	error = clSetKernelArg(	srad_kernel,
							6,
							sizeof(cl_mem),
							(void *) &d_jE);
	if (error != CL_SUCCESS)
		fatal_CL(error, __LINE__);
	error = clSetKernelArg(	srad_kernel,
							7,
							sizeof(cl_mem),
							(void *) &d_jW);
	if (error != CL_SUCCESS)
		fatal_CL(error, __LINE__);
	error = clSetKernelArg(	srad_kernel,
							8,
							sizeof(cl_mem),
							(void *) &d_dN);
	if (error != CL_SUCCESS)
		fatal_CL(error, __LINE__);
	error = clSetKernelArg(	srad_kernel,
							9,
							sizeof(cl_mem),
							(void *) &d_dS);
	if (error != CL_SUCCESS)
		fatal_CL(error, __LINE__);
	error = clSetKernelArg(	srad_kernel,
							10,
							sizeof(cl_mem),
							(void *) &d_dW);
	if (error != CL_SUCCESS)
		fatal_CL(error, __LINE__);
	error = clSetKernelArg(	srad_kernel,
							11,
							sizeof(cl_mem),
							(void *) &d_dE);
	if (error != CL_SUCCESS)
		fatal_CL(error, __LINE__);
	error = clSetKernelArg(	srad_kernel,
							13,
							sizeof(cl_mem),
							(void *) &d_c);
	if (error != CL_SUCCESS)
		fatal_CL(error, __LINE__);
	error = clSetKernelArg(	srad_kernel,
							14,
							sizeof(cl_mem),
							(void *) &d_I);
	if (error != CL_SUCCESS)
		fatal_CL(error, __LINE__);

	//====================================================================================================100
	//	SRAD2 Kernel
	//====================================================================================================100

	error = clSetKernelArg(	srad2_kernel,
							0,
							sizeof(fp),
							(void *) &lambda);
	if (error != CL_SUCCESS)
		fatal_CL(error, __LINE__);
	error = clSetKernelArg(	srad2_kernel,
							1,
							sizeof(int),
							(void *) &Nr);
	if (error != CL_SUCCESS)
		fatal_CL(error, __LINE__);
	error = clSetKernelArg(	srad2_kernel,
							2,
							sizeof(int),
							(void *) &Nc);
	if (error != CL_SUCCESS)
		fatal_CL(error, __LINE__);
	error = clSetKernelArg(	srad2_kernel,
							3,
							sizeof(long),
							(void *) &Ne);
	if (error != CL_SUCCESS)
		fatal_CL(error, __LINE__);
	error = clSetKernelArg(	srad2_kernel,
							4,
							sizeof(cl_mem),
							(void *) &d_iN);
	if (error != CL_SUCCESS)
		fatal_CL(error, __LINE__);
	error = clSetKernelArg(	srad2_kernel,
							5,
							sizeof(cl_mem),
							(void *) &d_iS);
	if (error != CL_SUCCESS)
		fatal_CL(error, __LINE__);
	error = clSetKernelArg(	srad2_kernel,
							6,
							sizeof(cl_mem),
							(void *) &d_jE);
	if (error != CL_SUCCESS)
		fatal_CL(error, __LINE__);
	error = clSetKernelArg(	srad2_kernel,
							7,
							sizeof(cl_mem),
							(void *) &d_jW);
	if (error != CL_SUCCESS)
		fatal_CL(error, __LINE__);
	error = clSetKernelArg(	srad2_kernel,
							8,
							sizeof(cl_mem),
							(void *) &d_dN);
	if (error != CL_SUCCESS)
		fatal_CL(error, __LINE__);
	error = clSetKernelArg(	srad2_kernel,
							9,
							sizeof(cl_mem),
							(void *) &d_dS);
	if (error != CL_SUCCESS)
		fatal_CL(error, __LINE__);
	error = clSetKernelArg(	srad2_kernel,
							10,
							sizeof(cl_mem),
							(void *) &d_dW);
	if (error != CL_SUCCESS)
		fatal_CL(error, __LINE__);
	error = clSetKernelArg(	srad2_kernel,
							11,
							sizeof(cl_mem),
							(void *) &d_dE);
	if (error != CL_SUCCESS)
		fatal_CL(error, __LINE__);
	error = clSetKernelArg(	srad2_kernel,
							12,
							sizeof(cl_mem),
							(void *) &d_c);
	if (error != CL_SUCCESS)
		fatal_CL(error, __LINE__);
	error = clSetKernelArg(	srad2_kernel,
							13,
							sizeof(cl_mem),
							(void *) &d_I);
	if (error != CL_SUCCESS)
		fatal_CL(error, __LINE__);

	//====================================================================================================100
	//	End
	//====================================================================================================100

	//======================================================================================================================================================150
	// 	COMPUTATION
	//======================================================================================================================================================150

	fprintf(stderr, "Iterations Progress: ");

	// execute main loop
	for (iter=0; iter<niter; iter++){										// do for the number of iterations input parameter

		fprintf(stderr, "%d ", iter);
		fflush(NULL);

		//====================================================================================================100
		// Prepare kernel
		//====================================================================================================100

		// launch kernel
		error = clEnqueueNDRangeKernel(	cmd_queue,
										prepare_kernel,
										1,
										NULL,
										global_work_size,
										local_work_size,
										0,
										NULL,
										NULL);
		if (error != CL_SUCCESS)
			fatal_CL(error, __LINE__);

		// synchronize
		// error = clFinish(command_queue);
		// if (error != CL_SUCCESS)
			// fatal_CL(error, __LINE__);

		//====================================================================================================100
		//	Reduce Kernel - performs subsequent reductions of sums
		//====================================================================================================100

		// initial values
		blocks2_work_size = blocks_work_size;							// original number of blocks
		global_work_size2[0] = global_work_size[0];
		no = Ne;														// original number of sum elements
		mul = 1;														// original multiplier

		// loop
		while(blocks2_work_size != 0){

			// set arguments that were uptaded in this loop
			error = clSetKernelArg(	reduce_kernel,
									1,
									sizeof(long),
									(void *) &no);
			if (error != CL_SUCCESS)
				fatal_CL(error, __LINE__);
			error = clSetKernelArg(	reduce_kernel,
									2,
									sizeof(int),
									(void *) &mul);
			if (error != CL_SUCCESS)
				fatal_CL(error, __LINE__);

			error = clSetKernelArg(	reduce_kernel,
									5,
									sizeof(int),
									(void *) &blocks2_work_size);
			if (error != CL_SUCCESS)
				fatal_CL(error, __LINE__);

			// launch kernel
			error = clEnqueueNDRangeKernel(	cmd_queue,
											reduce_kernel,
											1,
											NULL,
											global_work_size2,
											local_work_size,
											0,
											NULL,
											NULL);
			if (error != CL_SUCCESS)
				fatal_CL(error, __LINE__);

			// synchronize
			// error = clFinish(command_queue);
			// if (error != CL_SUCCESS)
				// fatal_CL(error, __LINE__);

			// update execution parameters
			no = blocks2_work_size;												// get current number of elements
			if(blocks2_work_size == 1){
				blocks2_work_size = 0;
			}
			else{
				mul = mul * NUMBER_THREADS;										// update the increment
				blocks_x = blocks2_work_size/(int)local_work_size[0];			// number of blocks
				if (blocks2_work_size % (int)local_work_size[0] != 0){			// compensate for division remainder above by adding one grid
					blocks_x = blocks_x + 1;
				}
				blocks2_work_size = blocks_x;
				global_work_size2[0] = blocks2_work_size * (int)local_work_size[0];
			}

		}

		// copy total sums to device
		error = clEnqueueReadBuffer(cmd_queue,
									d_sums,
									CL_TRUE,
									0,
									mem_size_single,
									&total,
									0,
									NULL,
									NULL);
		if (error != CL_SUCCESS)
			fatal_CL(error, __LINE__);

		error = clEnqueueReadBuffer(cmd_queue,
									d_sums2,
									CL_TRUE,
									0,
									mem_size_single,
									&total2,
									0,
									NULL,
									NULL);
		if (error != CL_SUCCESS)
			fatal_CL(error, __LINE__);

		//====================================================================================================100
		// calculate statistics
		//====================================================================================================100

		meanROI	= total / (fp)(NeROI);										// gets mean (average) value of element in ROI
		meanROI2 = meanROI * meanROI;										//
		varROI = (total2 / (fp)(NeROI)) - meanROI2;							// gets variance of ROI
		q0sqr = varROI / meanROI2;											// gets standard deviation of ROI

		//====================================================================================================100
		// execute srad kernel
		//====================================================================================================100

		// set arguments that were uptaded in this loop
		error = clSetKernelArg(	srad_kernel,
							12,
							sizeof(fp),
							(void *) &q0sqr);
		if (error != CL_SUCCESS)
			fatal_CL(error, __LINE__);

		// launch kernel
		error = clEnqueueNDRangeKernel(	cmd_queue,
										srad_kernel,
										1,
										NULL,
										global_work_size,
										local_work_size,
										0,
										NULL,
										NULL);
		if (error != CL_SUCCESS)
			fatal_CL(error, __LINE__);

		// synchronize
		// error = clFinish(command_queue);
		// if (error != CL_SUCCESS)
			// fatal_CL(error, __LINE__);

		//====================================================================================================100
		// execute srad2 kernel
		//====================================================================================================100

		// launch kernel
		error = clEnqueueNDRangeKernel(	cmd_queue,
										srad2_kernel,
										1,
										NULL,
										global_work_size,
										local_work_size,
										0,
										NULL,
										NULL);
		if (error != CL_SUCCESS)
			fatal_CL(error, __LINE__);

		// synchronize
		// error = clFinish(command_queue);
		// if (error != CL_SUCCESS)
			// fatal_CL(error, __LINE__);

		//====================================================================================================100
		// End
		//====================================================================================================100

	}

	fprintf(stderr, "\n");

	//====================================================================================================100
	// synchronize
	//====================================================================================================100

	error = clFinish(cmd_queue);
	if (error != CL_SUCCESS)
		fatal_CL(error, __LINE__);

	//====================================================================================================100
	//	End
	//====================================================================================================100

	//======================================================================================================================================================150
	// 	COPY RESULTS BACK TO CPU
	//======================================================================================================================================================150

	error = clEnqueueReadBuffer(cmd_queue,
								d_I,
								CL_TRUE,
								0,
								mem_size,
								image,
								0,
								NULL,
								NULL);
	if (error != CL_SUCCESS)
		fatal_CL(error, __LINE__);

	// int i;
	// for(i=0; i<100; i++){
		// fprintf(stderr, "%f ", image[i]);
	// }

	//======================================================================================================================================================150
	// 	FREE MEMORY
	//======================================================================================================================================================150

	// OpenCL structures
	error = clReleaseKernel(prepare_kernel);
	if (error != CL_SUCCESS)
		fatal_CL(error, __LINE__);
	error = clReleaseKernel(reduce_kernel);
	if (error != CL_SUCCESS)
		fatal_CL(error, __LINE__);
	error = clReleaseKernel(srad_kernel);
	if (error != CL_SUCCESS)
		fatal_CL(error, __LINE__);
	error = clReleaseKernel(srad2_kernel);
	if (error != CL_SUCCESS)
		fatal_CL(error, __LINE__);
	error = clReleaseProgram(prog);
	if (error != CL_SUCCESS)
		fatal_CL(error, __LINE__);

	// common_change
	error = clReleaseMemObject(d_I);
	if (error != CL_SUCCESS)
		fatal_CL(error, __LINE__);
	error = clReleaseMemObject(d_c);
	if (error != CL_SUCCESS)
		fatal_CL(error, __LINE__);

	error = clReleaseMemObject(d_iN);
	if (error != CL_SUCCESS)
		fatal_CL(error, __LINE__);
	error = clReleaseMemObject(d_iS);
	if (error != CL_SUCCESS)
		fatal_CL(error, __LINE__);
	error = clReleaseMemObject(d_jE);
	if (error != CL_SUCCESS)
		fatal_CL(error, __LINE__);
	error = clReleaseMemObject(d_jW);
	if (error != CL_SUCCESS)
		fatal_CL(error, __LINE__);

	error = clReleaseMemObject(d_dN);
	if (error != CL_SUCCESS)
		fatal_CL(error, __LINE__);
	error = clReleaseMemObject(d_dS);
	if (error != CL_SUCCESS)
		fatal_CL(error, __LINE__);
	error = clReleaseMemObject(d_dE);
	if (error != CL_SUCCESS)
		fatal_CL(error, __LINE__);
	error = clReleaseMemObject(d_dW);
	if (error != CL_SUCCESS)
		fatal_CL(error, __LINE__);

	error = clReleaseMemObject(d_sums);
	if (error != CL_SUCCESS)
		fatal_CL(error, __LINE__);
	error = clReleaseMemObject(d_sums2);
	if (error != CL_SUCCESS)
		fatal_CL(error, __LINE__);

	// OpenCL structures
	error = clFlush(cmd_queue);
	if (error != CL_SUCCESS)
		fatal_CL(error, __LINE__);
	error = clReleaseCommandQueue(cmd_queue);
	if (error != CL_SUCCESS)
		fatal_CL(error, __LINE__);
	error = clReleaseContext(context);
	if (error != CL_SUCCESS)
		fatal_CL(error, __LINE__);

	//======================================================================================================================================================150
	// 	End
	//======================================================================================================================================================150

}

//========================================================================================================================================================================================================200
//	End
//========================================================================================================================================================================================================200
