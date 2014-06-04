/*
 * =====================================================================================
 *
 *       Filename:  lud.cu
 *
 *    Description:  The main wrapper for the suite
 *
 *        Version:  1.0
 *        Created:  10/22/2009 08:40:34 PM
 *       Revision:  none
 *       Compiler:  gcc
 *
 *         Author:  Liang Wang (lw2aw), lw2aw@virginia.edu
 *        Company:  CS@UVa
 *
 * =====================================================================================
 */

#include <stdio.h>
#include <unistd.h>
#include <getopt.h>
#include <stdlib.h>
#include <assert.h>


#include <sys/time.h>
#ifdef __APPLE__
#include <OpenCL/opencl.h>
#else
#include <CL/cl.h>
#endif

#include <string.h>
#include <string>
#include "common.h"
#define BLOCK_SIZE 16

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
double gettime() {
    struct timeval t;
    gettimeofday(&t,NULL);
    return t.tv_sec+t.tv_usec*1e-6;
}

cl_command_queue cmd_queue;
cl_context context;
cl_device_id device_id;
cl_program prog;

const char* kernel_file =  "lud_kernel.cl";

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

static int shutdown()
{
    // release resources
    if( cmd_queue ) clReleaseCommandQueue( cmd_queue );
    if( context ) clReleaseContext( context );
    // if( device_list ) delete device_list;

    // reset all variables
    cmd_queue = 0;
    context = 0;

    return 0;
}

static int do_verify = 0;
void lud_cuda(float *d_m, int matrix_dim);

static struct option size_opts[] = {
    /* name, has_arg, flag, val */
    {"platform", 1, NULL, 'p'},
    {"device", 1, NULL, 'd'},
    {"size", 1, NULL, 's'},
    {"verify", 0, NULL, 'v'},
    {0,0,0,0}
};

int
main ( int argc, char *argv[] )
{
    int matrix_dim = 32; /* default matrix_dim */
    int opt, option_index=0;
    func_ret_t ret;
    const char *input_file = NULL;
    float *m, *mm;
    stopwatch sw;
    int platform_idx = 0; 
    int device_idx = 0;
    cl_int err;

    while ((opt = getopt_long(argc, argv, "::vs:p:d:",
                              size_opts, &option_index)) != -1 ) {
        switch(opt){
        case 'p':
            platform_idx = atoi(optarg);
            break;
        case 'd': 
            device_idx = atoi(optarg);
            break;
        case 'v':
            do_verify = 1;
            break;
        case 's':
            matrix_dim = atoi(optarg);
            fprintf(stderr, "Generate input matrix internally, size =%d\n", matrix_dim);
            // fprintf(stderr, "Currently not supported, use -i instead\n");
            // fprintf(stderr, "Usage: %s [-v] [-s matrix_size|-i input_file]\n", argv[0]);
            // exit(EXIT_FAILURE);
            break;
        case '?':
            fprintf(stderr, "invalid option\n");
            break;
        case ':':
            fprintf(stderr, "missing argument\n");
            break;
        default:
            fprintf(stderr, "Usage: %s [-v] -s <matrix size>\n",
                    argv[0]);
            exit(EXIT_FAILURE);
        }
    }

    if ( (optind < argc) || (optind == 1)) {
        fprintf(stderr, "Usage: %s [-v] -s <matrix size>\n", argv[0]);
        exit(EXIT_FAILURE);
    }

    else if (matrix_dim) {
        fprintf(stderr, "Creating matrix internally size=%d\n", matrix_dim);
        ret = create_matrix_from_random_float(&m, matrix_dim);
        if (ret != RET_SUCCESS) {
	    m = NULL;
	    fprintf(stderr, "error create matrix internally size=%d\n", matrix_dim);
	    exit(EXIT_FAILURE);
        }
    }

    else {
        fprintf(stderr, "No input file specified!\n");
        exit(EXIT_FAILURE);
    }

    if (do_verify){
        fprintf(stderr, "Before LUD\n");
        // print_matrix(m, matrix_dim);
        //matrix_duplicate(m, &mm, matrix_dim);
    }

    setup_device(platform_idx, device_idx);
    int sourcesize = 1024*1024;
    char * source = (char *)calloc(sourcesize, sizeof(char));
    if(!source) { fprintf(stderr, "ERROR: calloc(%d) failed\n", sourcesize); return -1; }

    char * kernel_lud_diag   = "lud_diagonal";
    char * kernel_lud_peri   = "lud_perimeter";
    char * kernel_lud_inter  = "lud_internal";
    // FILE * fp = fopen("./lud_kernel.cl", "rb");
    // if(!fp) { fprintf(stderr, "ERROR: unable to open '%s'\n"); return -1; }
    // fread(source + strlen(source), sourcesize, 1, fp);
    // fclose(fp);

    cl_kernel diagnal;
    cl_kernel perimeter;
    cl_kernel internal;
    diagnal   = clCreateKernel(prog, kernel_lud_diag, &err);
    perimeter = clCreateKernel(prog, kernel_lud_peri, &err);
    internal  = clCreateKernel(prog, kernel_lud_inter, &err);
    if(err != CL_SUCCESS) { fprintf(stderr, "ERROR: clCreateKernel() 0 => %d\n", err); return -1; }
    clReleaseProgram(prog);

    //size_t local_work[3] = { 1, 1, 1 };
    //size_t global_work[3] = {1, 1, 1 };

    cl_mem d_m;
    d_m = clCreateBuffer(context, CL_MEM_READ_WRITE, matrix_dim*matrix_dim * sizeof(float), NULL, &err );
    if(err != CL_SUCCESS) { fprintf(stderr, "ERROR: clCreateBuffer d_m (size:%d) => %d\n", matrix_dim*matrix_dim, err); return -1;}

    /* beginning of timing point */
    stopwatch_start(&sw);
    err = clEnqueueWriteBuffer(cmd_queue, d_m, 1, 0, matrix_dim*matrix_dim*sizeof(float), m, 0, 0, 0);
    if(err != CL_SUCCESS) { fprintf(stderr, "ERROR: clEnqueueWriteBuffer d_m (size:%d) => %d\n", matrix_dim*matrix_dim, err); return -1; }

    int i=0;
    for (i=0; i < matrix_dim-BLOCK_SIZE; i += BLOCK_SIZE) {

        clSetKernelArg(diagnal, 0, sizeof(void *), (void*) &d_m);
        clSetKernelArg(diagnal, 1, sizeof(float) * BLOCK_SIZE * BLOCK_SIZE, (void*)NULL );
        clSetKernelArg(diagnal, 2, sizeof(cl_int), (void*) &matrix_dim);
        clSetKernelArg(diagnal, 3, sizeof(cl_int), (void*) &i);

        size_t global_work1[3]  = {BLOCK_SIZE, 1, 1};
        size_t local_work1[3]  = {BLOCK_SIZE, 1, 1};

        err = clEnqueueNDRangeKernel(cmd_queue, diagnal, 2, NULL, global_work1, local_work1, 0, 0, 0);
        if(err != CL_SUCCESS) { fprintf(stderr, "ERROR:  diagnal clEnqueueNDRangeKernel()=>%d failed\n", err); return -1; }

        clSetKernelArg(perimeter, 0, sizeof(void *), (void*) &d_m);
        clSetKernelArg(perimeter, 1, sizeof(float) * BLOCK_SIZE * BLOCK_SIZE, (void*)NULL );
        clSetKernelArg(perimeter, 2, sizeof(float) * BLOCK_SIZE * BLOCK_SIZE, (void*)NULL );
        clSetKernelArg(perimeter, 3, sizeof(float) * BLOCK_SIZE * BLOCK_SIZE, (void*)NULL );
        clSetKernelArg(perimeter, 4, sizeof(cl_int), (void*) &matrix_dim);
        clSetKernelArg(perimeter, 5, sizeof(cl_int), (void*) &i);

        size_t global_work2[3] = {BLOCK_SIZE * 2 * ((matrix_dim-i)/BLOCK_SIZE-1), 1, 1};
        size_t local_work2[3]  = {BLOCK_SIZE * 2, 1, 1};

        err = clEnqueueNDRangeKernel(cmd_queue, perimeter, 2, NULL, global_work2, local_work2, 0, 0, 0);
        if(err != CL_SUCCESS) { fprintf(stderr, "ERROR:  perimeter clEnqueueNDRangeKernel()=>%d failed\n", err); return -1; }

        clSetKernelArg(internal, 0, sizeof(void *), (void*) &d_m);
        clSetKernelArg(internal, 1, sizeof(float) * BLOCK_SIZE * BLOCK_SIZE, (void*)NULL );
        clSetKernelArg(internal, 2, sizeof(float) * BLOCK_SIZE * BLOCK_SIZE, (void*)NULL );
        clSetKernelArg(internal, 3, sizeof(cl_int), (void*) &matrix_dim);
        clSetKernelArg(internal, 4, sizeof(cl_int), (void*) &i);

        size_t global_work3[3] = {BLOCK_SIZE * ((matrix_dim-i)/BLOCK_SIZE-1), BLOCK_SIZE * ((matrix_dim-i)/BLOCK_SIZE-1), 1};
        size_t local_work3[3] = {BLOCK_SIZE, BLOCK_SIZE, 1};

        err = clEnqueueNDRangeKernel(cmd_queue, internal, 2, NULL, global_work3, local_work3, 0, 0, 0);
        if(err != CL_SUCCESS) { fprintf(stderr, "ERROR:  internal clEnqueueNDRangeKernel()=>%d failed\n", err); return -1; }
    }
    clSetKernelArg(diagnal, 0, sizeof(void *), (void*) &d_m);
    clSetKernelArg(diagnal, 1, sizeof(float) * BLOCK_SIZE * BLOCK_SIZE, (void*)NULL );
    clSetKernelArg(diagnal, 2, sizeof(cl_int), (void*) &matrix_dim);
    clSetKernelArg(diagnal, 3, sizeof(cl_int), (void*) &i);

    size_t global_work1[3]  = {BLOCK_SIZE, 1, 1};
    size_t local_work1[3]  = {BLOCK_SIZE, 1, 1};
    err = clEnqueueNDRangeKernel(cmd_queue, diagnal, 2, NULL, global_work1, local_work1, 0, 0, 0);
    if(err != CL_SUCCESS) { fprintf(stderr, "ERROR:  diagnal clEnqueueNDRangeKernel()=>%d failed\n", err); return -1; }

    err = clEnqueueReadBuffer(cmd_queue, d_m, 1, 0, matrix_dim*matrix_dim*sizeof(float), m, 0, 0, 0);
    if(err != CL_SUCCESS) { fprintf(stderr, "ERROR: clEnqueueReadBuffer  d_m (size:%d) => %d\n", matrix_dim*matrix_dim, err); return -1; }
    clFinish(cmd_queue);
    /* end of timing point */
    stopwatch_stop(&sw);

    printf("{ \"status\": %d, \"options\": \"-s %d\", \"time\": %f }\n", 1, matrix_dim, get_interval_by_sec(&sw));

    clReleaseMemObject(d_m);

    if (do_verify){
        fprintf(stderr, "After LUD\n");
        // print_matrix(m, matrix_dim);
        fprintf(stderr, ">>>Verify<<<<\n");
        //lud_verify(mm, m, matrix_dim);
        free(mm);
    }

    free(m);

    if(shutdown()) return -1;

}

/* ----------  end of function main  ---------- */
