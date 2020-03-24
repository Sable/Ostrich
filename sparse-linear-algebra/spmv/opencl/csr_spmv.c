


#ifndef SERIAL
#define SERIAL
#endif

#include "../common/sparse_formats.h"
#include "../common/common.h"
#include <getopt.h>
#include <stdlib.h>

#ifdef NV //NVIDIA
    #include <oclUtils.h>
#elif defined(__APPLE__)
    #include <OpenCL/opencl.h>
#else
    #include <CL/cl.h>
#endif


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
cl_kernel kernel_csr;
cl_mem memAp;
cl_mem memAj;
cl_mem memAx;
cl_mem memx;
cl_mem memy;

const char* kernel_file =  "spmv_kernel.cl";

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
    // if( device_list ) delete[] device_list;

    // reset all variables
    cmd_queue = 0;
    context = 0;
    // device_list = 0;
    // num_devices = 0;
    // device_type = 0;

    clReleaseMemObject(memAp);
    clReleaseMemObject(memAj);
    clReleaseMemObject(memAx);
    clReleaseMemObject(memx);
    clReleaseMemObject(memy);

    return 0;
}

double gettime() {
  struct timeval t;
  gettimeofday(&t,NULL);
  return t.tv_sec+t.tv_usec*1e-6;
}

unsigned int num_threads = 0;
unsigned int num_blocks = 0;

/*
 * Returns an array of work group sizes with only 1 element. The value is the largest possible
 * work-group size (i.e., fewest number of work-groups possible will be used), whether thats
 * limited by the device or the global size of the application
 */
size_t* default_wg_sizes(unsigned int* num_wg_sizes,const size_t max_wg_size, size_t *global_size)
{
    unsigned int num_wg;
    size_t* wg_sizes;
    (*num_wg_sizes)=1;
    wg_sizes = (size_t*) malloc(sizeof(size_t)*(*num_wg_sizes));
    check(wg_sizes != NULL,"csr.main() - Heap Overflow! Cannot allocate space for wg_sizes");
    wg_sizes[0] = max_wg_size;
    num_wg = global_size[0] / wg_sizes[0];
    while(global_size[0] % wg_sizes[0] != 0) //if wg_size is not a factor of global_size
    {                           //use min num_wg such that wg_size < global_size
        num_wg++;
        wg_sizes[0] = global_size[0] / (num_wg);
    }
    return wg_sizes;
}

void initialize(const csr_matrix *csr, int platform_idx, int device_idx){
    int sourcesize = 1024*1024;
    setup_device(platform_idx, device_idx);

    // read the kernel core source
    char * kernel_csr_src  = "csr_ocl";
    cl_int err = 0;

    kernel_csr = clCreateKernel(prog, kernel_csr_src, &err);
    if(err != CL_SUCCESS) { fprintf(stderr, "ERROR: clCreateKernel() 0 => %d\n", err); return; }
    clReleaseProgram(prog);

    memAp = clCreateBuffer(context, CL_MEM_READ_ONLY, sizeof(int)*(csr->num_rows+1), NULL, &err);
    if(err != CL_SUCCESS) { fprintf(stderr, "ERROR: clCreateBuffer\n"); return;}
    memAj = clCreateBuffer(context, CL_MEM_READ_ONLY, sizeof(int)*csr->num_nonzeros, NULL, &err );
    if(err != CL_SUCCESS) { fprintf(stderr, "ERROR: clCreateBuffer\n"); return;}
    memAx = clCreateBuffer(context, CL_MEM_READ_ONLY, sizeof(float)*csr->num_nonzeros, NULL, &err );
    if(err != CL_SUCCESS) { fprintf(stderr, "ERROR: clCreateBuffer\n"); return;}
    memx = clCreateBuffer(context, CL_MEM_READ_ONLY, sizeof(float)*csr->num_cols, NULL, &err );
    if(err != CL_SUCCESS) { fprintf(stderr, "ERROR: clCreateBuffer\n"); return;}
    memy = clCreateBuffer(context, CL_MEM_READ_WRITE, sizeof(float)*csr->num_rows, NULL, &err );
    if(err != CL_SUCCESS) { fprintf(stderr, "ERROR: clCreateBuffer\n"); return;}
}

void spmv_csr_cpu(const csr_matrix* csr,const float* x,const float* y,float* out) {
    cl_int err = 0;

    //write buffers
    err = clEnqueueWriteBuffer(cmd_queue, memAp, CL_FALSE, 0, sizeof(unsigned int)*csr->num_rows+4, csr->Ap, 0, NULL, NULL);
    if(err != CL_SUCCESS) { fprintf(stderr, "ERROR: clEnqueueWriteBuffer\n"); return; }
    err = clEnqueueWriteBuffer(cmd_queue, memAj, CL_FALSE, 0, sizeof(unsigned int)*csr->num_nonzeros, csr->Aj, 0, NULL, NULL);
    if(err != CL_SUCCESS) { fprintf(stderr, "ERROR: clEnqueueWriteBuffer\n"); return; }
    err = clEnqueueWriteBuffer(cmd_queue, memAx, CL_FALSE, 0, sizeof(float)*csr->num_nonzeros, csr->Ax, 0, NULL, NULL);
    if(err != CL_SUCCESS) { fprintf(stderr, "ERROR: clEnqueueWriteBuffer\n"); return; }
    err = clEnqueueWriteBuffer(cmd_queue, memx, CL_FALSE, 0, sizeof(float)*csr->num_cols, x, 0, NULL, NULL);
    if(err != CL_SUCCESS) { fprintf(stderr, "ERROR: clEnqueueWriteBuffer\n"); return; }
    err = clEnqueueWriteBuffer(cmd_queue, memy, CL_FALSE, 0, sizeof(float)*csr->num_rows, y, 0, NULL, NULL);
    if(err != CL_SUCCESS) { fprintf(stderr, "ERROR: clEnqueueWriteBuffer\n"); return; }

    clSetKernelArg(kernel_csr, 0, sizeof(int), &csr->num_rows);
    clSetKernelArg(kernel_csr, 1, sizeof(cl_mem), &memAp);
    clSetKernelArg(kernel_csr, 2, sizeof(cl_mem), &memAj);
    clSetKernelArg(kernel_csr, 3, sizeof(cl_mem), &memAx);
    clSetKernelArg(kernel_csr, 4, sizeof(cl_mem), &memx);
    clSetKernelArg(kernel_csr, 5, sizeof(cl_mem), &memy);

    size_t global_size[1] = {csr->num_rows};
    size_t *wg_sizes;
    unsigned int num_wg_sizes=0;
    size_t max_wg_size;

    err = clGetKernelWorkGroupInfo(kernel_csr, device_id, CL_KERNEL_WORK_GROUP_SIZE, sizeof(size_t), (void *) &max_wg_size, NULL);
    if(err) fprintf(stderr, "Failed to retrieve kernel work group info!");
    // all kernels have same max workgroup size
    wg_sizes = default_wg_sizes(&num_wg_sizes,max_wg_size,global_size);

    //fprintf(stderr, "wrk sizez: %d %d %d\n", max_wg_size, wg_sizes[0], global_size[0]);

    err = clEnqueueNDRangeKernel(cmd_queue, kernel_csr, 1, NULL, global_size, wg_sizes, 0, 0, 0);
    if(err != CL_SUCCESS) { fprintf(stderr, "ERROR: 1  clEnqueueNDRangeKernel()=>%d failed\n", err); return; }
    clFinish(cmd_queue);

    err = clEnqueueReadBuffer(cmd_queue, memy, 1, 0, sizeof(float)*csr->num_rows, out, 0, 0, 0);
    if(err != CL_SUCCESS) { fprintf(stderr, "ERROR: 1  clEnqueueReadBuffer: out\n"); return; }
    clFinish(cmd_queue);
}

static struct option long_options[] = {
    /* name, has_arg, flag, val */
    {"platform", 1, NULL, 'p'},
    {"device", 1, NULL, 'c'},
    {"stddev", 1, NULL, 's'},
    {"density", 1, NULL, 'd'},
    {"size", 1, NULL, 'n'},
    {"iterations", 1, NULL, 'i'},
    {0,0,0,0}
};

int main(int argc, char *argv[]){
    int opt, option_index=0;
    unsigned int dim=1024, density=5000;
    double normal_stdev=0.01;
    unsigned long seed = 10000;
    float *v;
    stopwatch sw;
    int platform_idx =0;
    int device_idx = 0;
    unsigned int iterations = 1;
    int i;

    while ((opt = getopt_long(argc, argv, "s:d:n:p:c:i:", long_options, &option_index)) != -1){
        switch(opt){
        case 'p':
            platform_idx = atoi(optarg);
            break;
        case 'c':
            device_idx = atoi(optarg);
            break;
        case 's':
            normal_stdev = atof(optarg);
            break;
        case 'd':
            density =  atoi(optarg);
            break;
        case 'n':
            dim  = atoi(optarg);
            break ;
        case 'i':
            iterations = atoi(optarg);
            break ;
        default:
            fprintf(stderr, "Usage: %s [-p platform] [-c device] [-s stddev] [-d density] [-n dimension]", argv[0]);
            break;
        }
    }

    float *sum = (float *) calloc(dim, sizeof(float));
    float *result = (float *) calloc(dim, sizeof(float));

    csr_matrix sm =  rand_csr(dim, density, normal_stdev, &seed, stderr);
    create_vector_from_random(&v, dim);

    stopwatch_start(&sw);
    initialize(&sm, platform_idx, device_idx);
    for(i=0; i<iterations; ++i) spmv_csr_cpu(&sm,v,sum, result);
    shutdown();
    stopwatch_stop(&sw);

    fprintf(stderr, "The first value of the result is %lf\n", result[0]);
    printf("{ \"status\": %d, \"options\": \"-n %d -d %d -s %f\", \"time\": %f }\n", 1, dim, density, normal_stdev, get_interval_by_sec(&sw));

    free(sum);
    free(result);
    free(v);
}
