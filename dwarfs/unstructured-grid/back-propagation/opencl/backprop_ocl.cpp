// includes, system
#include <stdlib.h>
#include <stdio.h>
#include <string.h>
#include <math.h>
#include <sys/time.h>
#include "backprop.h"

#ifdef NV //NVIDIA
	#include <oclUtils.h>
#elif defined(__APPLE__)
    #include <OpenCL/opencl.h>
#else
	#include <CL/cl.h>
#endif


////////////////////////////////////////////////////////////////////////////////

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

const char* kernel_file =  "./backprop_kernel.cl";

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

////////////////////////////////////////////////////////////////////////////////
double gettime() {
  struct timeval t;
  gettimeofday(&t,NULL);
  return t.tv_sec+t.tv_usec*1e-6;
}

unsigned int num_threads = 0;
unsigned int num_blocks = 0;

////////////////////////////////////////////////////////////////////////////////
// Program main
////////////////////////////////////////////////////////////////////////////////
int
main( int argc, char** argv)
{
	setup(argc, argv);
}

int bpnn_train_kernel(BPNN *net, float *eo, float *eh, int platform, int device)
{
	int in, hid, out;
	float out_err, hid_err;

	in = net->input_n;
	hid = net->hidden_n;
	out = net->output_n;

	setup_device(platform, device);

	// read the kernel core source
	char * kernel_bp1  = "bpnn_layerforward_ocl";
	char * kernel_bp2  = "bpnn_adjust_weights_ocl";

	// compile kernel
	cl_int err = 0;

	cl_kernel kernel1;
	cl_kernel kernel2;
	kernel1 = clCreateKernel(prog, kernel_bp1, &err);
	kernel2 = clCreateKernel(prog, kernel_bp2, &err);
	if(err != CL_SUCCESS) { fprintf(stderr, "ERROR: clCreateKernel() 0 => %d\n", err); return -1; }

	float *input_weights_one_dim;
    float *input_weights_prev_one_dim;
	float * partial_sum;
	float sum;
	float num_blocks = in / BLOCK_SIZE;

	input_weights_one_dim = (float *) malloc((in + 1)* (hid + 1) * sizeof(float));
	input_weights_prev_one_dim = (float *) malloc((in + 1)* (hid + 1) * sizeof(float));
	partial_sum = (float *) malloc(num_blocks * WIDTH * sizeof(float));

	// set global and local workitems
	size_t global_work[3] = { BLOCK_SIZE, BLOCK_SIZE * num_blocks, 1 };
	size_t local_work[3] = { BLOCK_SIZE, BLOCK_SIZE, 1 };

	// this preprocessing stage is temporarily added to correct the bug of wrong memcopy using two-dimensional net->inputweights
	// todo: fix mem allocation
	int m = 0;
	for (int k = 0; k <= in; k++) {
		for (int j = 0; j <= hid; j++) {
		input_weights_one_dim[m] = net->input_weights[k][j];
		input_weights_prev_one_dim[m] = net-> input_prev_weights[k][j];
	    m++;
		}
	}

	cl_mem input_hidden_ocl;
	cl_mem input_ocl;
	cl_mem output_hidden_ocl;
	cl_mem hidden_partial_sum;
	cl_mem hidden_delta_ocl;
	cl_mem input_prev_weights_ocl;

	input_ocl = clCreateBuffer(context, CL_MEM_READ_WRITE, (in + 1) * sizeof(float), NULL, &err );
	if(err != CL_SUCCESS) { fprintf(stderr, "ERROR: clCreateBuffer input_ocl\n"); return -1;}
	input_hidden_ocl = clCreateBuffer(context, CL_MEM_READ_WRITE, (in + 1) * (hid + 1) * sizeof(float), NULL, &err );
	if(err != CL_SUCCESS) { fprintf(stderr, "ERROR: clCreateBuffer input_hidden_ocl\n"); return -1;}
	output_hidden_ocl = clCreateBuffer(context, CL_MEM_READ_WRITE, (hid + 1) * sizeof(float), NULL, &err );
	if(err != CL_SUCCESS) { fprintf(stderr, "ERROR: clCreateBuffer output_hidden_ocl\n"); return -1;}
	hidden_partial_sum = clCreateBuffer(context, CL_MEM_READ_WRITE, num_blocks * WIDTH * sizeof(float), NULL, &err );
	if(err != CL_SUCCESS) { fprintf(stderr, "ERROR: clCreateBuffer hidden_partial_sum\n"); return -1;}
	hidden_delta_ocl = clCreateBuffer(context, CL_MEM_READ_WRITE, (hid + 1) * sizeof(float), NULL, &err );
	if(err != CL_SUCCESS) { fprintf(stderr, "ERROR: clCreateBuffer hidden_delta_ocl\n"); return -1;}
	input_prev_weights_ocl = clCreateBuffer(context, CL_MEM_READ_WRITE, (in + 1) * (hid + 1) * sizeof(float), NULL, &err );
	if(err != CL_SUCCESS) { fprintf(stderr, "ERROR: clCreateBuffer input_prev_weights_ocl\n"); return -1;}

	fprintf(stderr, "Performing GPU computation\n");

	//write buffers
	err = clEnqueueWriteBuffer(cmd_queue, input_ocl, 1, 0, (in + 1) * sizeof(float), net->input_units, 0, 0, 0);
	if(err != CL_SUCCESS) { fprintf(stderr, "ERROR: clEnqueueWriteBuffer input_ocl\n"); return -1; }
	err = clEnqueueWriteBuffer(cmd_queue, input_hidden_ocl, 1, 0, (in + 1) * (hid + 1) * sizeof(float), input_weights_one_dim, 0, 0, 0);
	if(err != CL_SUCCESS) { fprintf(stderr, "ERROR: clEnqueueWriteBuffer input_hidden_ocl\n"); return -1; }

	clSetKernelArg(kernel1, 0, sizeof(void *), (void*) &input_ocl);
	clSetKernelArg(kernel1, 1, sizeof(void *), (void*) &output_hidden_ocl);
	clSetKernelArg(kernel1, 2, sizeof(void *), (void*) &input_hidden_ocl);
	clSetKernelArg(kernel1, 3, sizeof(void *), (void*) &hidden_partial_sum );
	clSetKernelArg(kernel1, 4, sizeof(float) *  HEIGHT, (void*)NULL );
	clSetKernelArg(kernel1, 5, sizeof(float ) *  HEIGHT * WIDTH, (void*)NULL );
	clSetKernelArg(kernel1, 6, sizeof(cl_int), (void*) &in);
	clSetKernelArg(kernel1, 7, sizeof(cl_int), (void*) &hid);

	err = clEnqueueNDRangeKernel(cmd_queue, kernel1, 2, NULL, global_work, local_work, 0, 0, 0);
	if(err != CL_SUCCESS) { fprintf(stderr, "ERROR: 1  clEnqueueNDRangeKernel()=>%d failed\n", err); return -1; }

	err = clEnqueueReadBuffer(cmd_queue, hidden_partial_sum, 1, 0, num_blocks * WIDTH * sizeof(float), partial_sum, 0, 0, 0);
	if(err != CL_SUCCESS) { fprintf(stderr, "ERROR: 1  clEnqueueReadBuffer: partial sum\n"); return -1; }

	for (int j = 1; j <= hid; j++) {
		sum = 0.0;
		for (int k = 0; k < num_blocks; k++) {
		sum += partial_sum[k * hid + j-1] ;
    }
		sum += net->input_weights[0][j];
		net-> hidden_units[j] = float(1.0 / (1.0 + exp(-sum)));
	}


	bpnn_layerforward(net->hidden_units, net->output_units, net->hidden_weights, hid, out);
	bpnn_output_error(net->output_delta, net->target, net->output_units, out, &out_err);
	bpnn_hidden_error(net->hidden_delta, hid, net->output_delta, out, net->hidden_weights, net->hidden_units, &hid_err);
	bpnn_adjust_weights(net->output_delta, out, net->hidden_units, hid, net->hidden_weights, net->hidden_prev_weights);

	err = clEnqueueWriteBuffer(cmd_queue, hidden_delta_ocl,       1, 0, (hid + 1) * sizeof(float), net->hidden_delta, 0, 0, 0);
	if(err != CL_SUCCESS) { fprintf(stderr, "ERROR: clEnqueueWriteBuffer hidden_delta_ocl\n"); return -1; }
	err = clEnqueueWriteBuffer(cmd_queue, input_prev_weights_ocl, 1, 0, (in + 1) * (hid + 1) * sizeof(float), input_weights_prev_one_dim, 0, 0, 0);
	if(err != CL_SUCCESS) { fprintf(stderr, "ERROR: clEnqueueWriteBuffer input_prev_weights_ocl\n"); return -1; }
	err = clEnqueueWriteBuffer(cmd_queue, input_hidden_ocl,       1, 0, (in + 1) * (hid + 1) * sizeof(float), input_weights_one_dim, 0, 0, 0);
	if(err != CL_SUCCESS) { fprintf(stderr, "ERROR: clEnqueueWriteBuffer input_hidden_ocl\n"); return -1; }

	clSetKernelArg(kernel2, 0, sizeof(void *), (void*) &hidden_delta_ocl);
	clSetKernelArg(kernel2, 1, sizeof(cl_int), (void*) &hid);
	clSetKernelArg(kernel2, 2, sizeof(void *), (void*) &input_ocl);
	clSetKernelArg(kernel2, 3, sizeof(cl_int), (void*) &in);
	clSetKernelArg(kernel2, 4, sizeof(void *), (void*) &input_hidden_ocl);
	clSetKernelArg(kernel2, 5, sizeof(void *), (void*) &input_prev_weights_ocl );

	err = clEnqueueNDRangeKernel(cmd_queue, kernel2, 2, NULL, global_work, local_work, 0, 0, 0);
	if(err != CL_SUCCESS) { fprintf(stderr, "ERROR: 1  clEnqueueNDRangeKernel()=>%d failed\n", err); return -1; }

	err = clEnqueueReadBuffer(cmd_queue, input_ocl, 1, 0, (in + 1) * sizeof(float), net->input_units, 0, 0, 0);
	if(err != CL_SUCCESS) { fprintf(stderr, "ERROR: 1  clEnqueueReadBuffer: input_ocl\n"); return -1; }
	err = clEnqueueReadBuffer(cmd_queue, input_hidden_ocl, 1, 0, (in + 1) * (hid + 1) * sizeof(float), input_weights_one_dim, 0, 0, 0);
	if(err != CL_SUCCESS) { fprintf(stderr, "ERROR: 1  clEnqueueReadBuffer: input_hidden_ocl\n"); return -1; }

	clReleaseMemObject(input_ocl);
	clReleaseMemObject(output_hidden_ocl);
	clReleaseMemObject(input_hidden_ocl);
	clReleaseMemObject(hidden_partial_sum);
	clReleaseMemObject(input_prev_weights_ocl);

	clReleaseKernel(kernel1);
	clReleaseKernel(kernel2);
	clReleaseProgram(prog);

	clFlush(cmd_queue);
	clReleaseCommandQueue(cmd_queue);
	clReleaseContext(context);

	free(input_weights_prev_one_dim);
	free(partial_sum);
	free(input_weights_one_dim);

}
