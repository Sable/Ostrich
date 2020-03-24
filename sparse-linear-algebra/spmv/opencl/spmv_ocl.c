

// includes, system
#include <stdlib.h>
#include <stdio.h>
#include <string.h>
#include <math.h>
#include <sys/time.h>

#ifdef NV //NVIDIA
	#include <oclUtils.h>
#else
	#include <CL/cl.h>
#endif

// local variables
static cl_context	    context;
static cl_command_queue cmd_queue;
static cl_device_type   device_type;
static cl_device_id   * device_list;
static cl_int           num_devices;

static int initialize(int use_gpu) {
	cl_int result;
	size_t size;

	// create OpenCL context
	cl_platform_id platform_id;
	if (clGetPlatformIDs(1, &platform_id, NULL) != CL_SUCCESS) { fprintf(stderr, "ERROR: clGetPlatformIDs(1,*,0) failed\n"); return -1; }
	cl_context_properties ctxprop[] = { CL_CONTEXT_PLATFORM, (cl_context_properties)platform_id, 0};
	device_type = use_gpu ? CL_DEVICE_TYPE_GPU : CL_DEVICE_TYPE_CPU;
	context = clCreateContextFromType( ctxprop, device_type, NULL, NULL, NULL );
	if( !context ) { fprintf(stderr, "ERROR: clCreateContextFromType(%s) failed\n", use_gpu ? "GPU" : "CPU"); return -1; }

	// get the list of GPUs
	result = clGetContextInfo( context, CL_CONTEXT_DEVICES, 0, NULL, &size );
	num_devices = (int) (size / sizeof(cl_device_id));
	fprintf(stderr, "num_devices = %d\n", num_devices);

	if( result != CL_SUCCESS || num_devices < 1 ) { fprintf(stderr, "ERROR: clGetContextInfo() failed\n"); return -1; }
	device_list = new cl_device_id[num_devices];
	//device_list = (cl_device_id *)malloc(sizeof(cl_device_id)*num_devices);
	if( !device_list ) { fprintf(stderr, "ERROR: new cl_device_id[] failed\n"); return -1; }
	result = clGetContextInfo( context, CL_CONTEXT_DEVICES, size, device_list, NULL );
	if( result != CL_SUCCESS ) { fprintf(stderr, "ERROR: clGetContextInfo() failed\n"); return -1; }

	// create command queue for the first device
	cmd_queue = clCreateCommandQueue( context, device_list[0], 0, NULL );
	if( !cmd_queue ) { fprintf(stderr, "ERROR: clCreateCommandQueue() failed\n"); return -1; }
	return 0;
}

static int shutdown()
{
	// release resources
	if( cmd_queue ) clReleaseCommandQueue( cmd_queue );
	if( context ) clReleaseContext( context );
	if( device_list ) delete[] device_list;

	// reset all variables
	cmd_queue = 0;
	context = 0;
	device_list = 0;
	num_devices = 0;
	device_type = 0;

	return 0;
}

double gettime() {
  struct timeval t;
  gettimeofday(&t,NULL);
  return t.tv_sec+t.tv_usec*1e-6;
}

unsigned int num_threads = 0;
unsigned int num_blocks = 0;

void spmv_csr_cpu(const csr_matrix* csr,const float* x,const float* y,float* out) {
    int num_rows = csr->num_rows;

    int sourcesize = 1024*1024;
	char * source = (char *)calloc(sourcesize, sizeof(char));
	if(!source) { fprintf(stderr, "ERROR: calloc(%d) failed\n", sourcesize); return -1; }

	// read the kernel core source
	char * kernel_csr_src  = "csr_ocl";
	char * tempchar = "./spmv_kernel.cl";
	FILE * fp = fopen(tempchar, "rb");
	if(!fp) { fprintf(stderr, "ERROR: unable to open '%s'\n", tempchar); return -1; }
	fread(source + strlen(source), sourcesize, 1, fp);
	fclose(fp);

	int use_gpu = 1;
	if(initialize(use_gpu)) return -1;

	// compile kernel
	cl_int err = 0;
	const char * slist[2] = { source, 0 };
	cl_program prog = clCreateProgramWithSource(context, 1, slist, NULL, &err);
	if(err != CL_SUCCESS) { fprintf(stderr, "ERROR: clCreateProgramWithSource() => %d\n", err); return -1; }
	err = clBuildProgram(prog, 0, NULL, NULL, NULL, NULL);
	if(err != CL_SUCCESS) { fprintf(stderr, "ERROR: clBuildProgram() => %d\n", err); return -1; }

	cl_kernel kernel_csr;
	kernel_csr = clCreateKernel(prog, kernel_csr_src, &err);
	if(err != CL_SUCCESS) { fprintf(stderr, "ERROR: clCreateKernel() 0 => %d\n", err); return -1; }
	clReleaseProgram(prog);

	cl_mem memAp;
	cl_mem memAj;
	cl_mem memAx;
	cl_mem memx;
	cl_mem memy;

	memAp = clCreateBuffer(context, CL_MEM_READ_ONLY, sizeof(int)*(csr.num_rows+1), NULL, &err);
	if(err != CL_SUCCESS) { fprintf(stderr, "ERROR: clCreateBuffer\n"); return -1;}
	memAj = clCreateBuffer(context, CL_MEM_READ_ONLY, sizeof(int)*csr.num_nonzeros, NULL, &err );
	if(err != CL_SUCCESS) { fprintf(stderr, "ERROR: clCreateBuffer\n"); return -1;}
	memAx = clCreateBuffer(context, CL_MEM_READ_ONLY, sizeof(float)*csr.num_nonzeros, NULL, &err );
	if(err != CL_SUCCESS) { fprintf(stderr, "ERROR: clCreateBuffer\n"); return -1;}
	memx = clCreateBuffer(context, CL_MEM_READ_ONLY, sizeof(float)*csr.num_cols, NULL, &err );
	if(err != CL_SUCCESS) { fprintf(stderr, "ERROR: clCreateBuffer\n"); return -1;}
	memy = clCreateBuffer(context, CL_MEM_READ_WRITE, sizeof(float)*csr.num_rows, NULL, &err );
	if(err != CL_SUCCESS) { fprintf(stderr, "ERROR: clCreateBuffer\n"); return -1;}

	//write buffers
	err = clEnqueueWriteBuffer(cmd_queue, memAp, CL_FALSE, 0, sizeof(unsigned int)*csr.num_rows+4, csr->Ap, 0, NULL, NULL);
	if(err != CL_SUCCESS) { fprintf(stderr, "ERROR: clEnqueueWriteBuffer\n"); return -1; }
	err = clEnqueueWriteBuffer(cmd_queue, memAj, CL_FALSE, 0, sizeof(unsigned int)*csr.num_nonzeros, csr->Aj, 0, NULL, NULL);
	if(err != CL_SUCCESS) { fprintf(stderr, "ERROR: clEnqueueWriteBuffer\n"); return -1; }
	err = clEnqueueWriteBuffer(cmd_queue, memAx, CL_FALSE, 0, sizeof(float)*csr.num_nonzeros, csr->Ax, 0, NULL, NULL);
	if(err != CL_SUCCESS) { fprintf(stderr, "ERROR: clEnqueueWriteBuffer\n"); return -1; }
	err = clEnqueueWriteBuffer(cmd_queue, memx, CL_FALSE, 0, sizeof(float)*csr.num_cols, x, 0, NULL, NULL);
	if(err != CL_SUCCESS) { fprintf(stderr, "ERROR: clEnqueueWriteBuffer\n"); return -1; }
	err = clEnqueueWriteBuffer(cmd_queue, memy, CL_FALSE, 0, sizeof(float)*csr.num_rows, y, 0, NULL, NULL);
	if(err != CL_SUCCESS) { fprintf(stderr, "ERROR: clEnqueueWriteBuffer\n"); return -1; }

	clSetKernelArg(kernel_csr, 0, sizeof(unsigned int *), (unsigned int *) &csr->num_rows);
	clSetKernelArg(kernel_csr, 1, sizeof(void *), (void*) &memAp);
	clSetKernelArg(kernel_csr, 2, sizeof(void *), (void*) &memAj);
	clSetKernelArg(kernel_csr, 3, sizeof(void *), (void*) &memAx);
	clSetKernelArg(kernel_csr, 2, sizeof(void *), (void*) &memx);
	clSetKernelArg(kernel_csr, 3, sizeof(void *), (void*) &memy);

	err = clEnqueueNDRangeKernel(cmd_queue, kernel_csr, 2, NULL, global_work, local_work, 0, 0, 0);
	if(err != CL_SUCCESS) { fprintf(stderr, "ERROR: 1  clEnqueueNDRangeKernel()=>%d failed\n", err); return -1; }

	err = clEnqueueReadBuffer(cmd_queue, memy, 1, 0, sizeof(float)*csr.num_rows, out, 0, 0, 0);
	if(err != CL_SUCCESS) { fprintf(stderr, "ERROR: 1  clEnqueueReadBuffer: out\n"); return -1; }

	clReleaseMemObject(memAp);
	clReleaseMemObject(memAj);
	clReleaseMemObject(memAx);
	clReleaseMemObject(memx);
	clReleaseMemObject(memy);
}
