#ifndef SERIAL
#define SERIAL
#endif

#include "../common/sparse_formats.h"
#include "../common/common.h"
#include <getopt.h>
#include <stdlib.h>

#ifdef NV //NVIDIA
    #include <oclUtils.h>
#else
    #include <CL/cl.h>
#endif


// local variables
static cl_context       context;
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


void spmv_csr_cpu(const csr_matrix* csr,const float* x,const float* y,float* out) {
    int sourcesize = 1024*1024;
    char * source = (char *)calloc(sourcesize, sizeof(char));
    if(!source) { fprintf(stderr, "ERROR: calloc(%d) failed\n", sourcesize); return; }

    // read the kernel core source
    char * kernel_csr_src  = "csr_ocl";
    char * tempchar = "./spmv_kernel.cl";
    FILE * fp = fopen(tempchar, "rb");
    if(!fp) { fprintf(stderr, "ERROR: unable to open '%s'\n", tempchar); return; }
    fread(source + strlen(source), sourcesize, 1, fp);
    fclose(fp);

    int use_gpu = 0;
    if(initialize(use_gpu)) return;

    // compile kernel
    cl_int err = 0;
    const char * slist[2] = { source, 0 };
    cl_program prog = clCreateProgramWithSource(context, 1, slist, NULL, &err);
    if(err != CL_SUCCESS) { fprintf(stderr, "ERROR: clCreateProgramWithSource() => %d\n", err); return; }
    err = clBuildProgram(prog, 0, NULL, NULL, NULL, NULL);
    if(err != CL_SUCCESS) { fprintf(stderr, "ERROR: clBuildProgram() => %d\n", err); return; }

    cl_kernel kernel_csr;
    kernel_csr = clCreateKernel(prog, kernel_csr_src, &err);
    if(err != CL_SUCCESS) { fprintf(stderr, "ERROR: clCreateKernel() 0 => %d\n", err); return; }
    clReleaseProgram(prog);

    cl_mem memAp;
    cl_mem memAj;
    cl_mem memAx;
    cl_mem memx;
    cl_mem memy;

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

    err = clGetKernelWorkGroupInfo(kernel_csr, device_list[0], CL_KERNEL_WORK_GROUP_SIZE, sizeof(size_t), (void *) &max_wg_size, NULL);
    if(err) fprintf(stderr, "Failed to retrieve kernel work group info!");
    // all kernels have same max workgroup size
    wg_sizes = default_wg_sizes(&num_wg_sizes,max_wg_size,global_size);

    //fprintf(stderr, "wrk sizez: %d %d %d\n", max_wg_size, wg_sizes[0], global_size[0]);

    err = clEnqueueNDRangeKernel(cmd_queue, kernel_csr, 1, NULL, global_size, wg_sizes, 0, 0, 0);
    if(err != CL_SUCCESS) { fprintf(stderr, "ERROR: 1  clEnqueueNDRangeKernel()=>%d failed\n", err); return; }

    err = clEnqueueReadBuffer(cmd_queue, memy, 1, 0, sizeof(float)*csr->num_rows, out, 0, 0, 0);
    if(err != CL_SUCCESS) { fprintf(stderr, "ERROR: 1  clEnqueueReadBuffer: out\n"); return; }

    clReleaseMemObject(memAp);
    clReleaseMemObject(memAj);
    clReleaseMemObject(memAx);
    clReleaseMemObject(memx);
    clReleaseMemObject(memy);

    shutdown();
}

/**
 * Sparse Matrix-Vector Multiply
 *
 * Multiplies csr matrix by vector x, adds vector y, and stores output in vector out
 */
/*void spmv_csr_cpu(const csr_matrix* csr, const float* x, const float* y, float* out) {
    unsigned int row,row_start,row_end,jj;
    float sum = 0;
    for(row=0; row < csr->num_rows; row++) {
        sum = y[row];
        row_start = csr->Ap[row];
        row_end   = csr->Ap[row+1];

        for (jj = row_start; jj < row_end; jj++){
            sum += csr->Ax[jj] * x[csr->Aj[jj]];
        }
        out[row] = sum;
    }
}*/

static struct option long_options[] = {
    /* name, has_arg, flag, val */
    {"stddev", 1, NULL, 's'},
    {"density", 1, NULL, 'd'},
    {"size", 1, NULL, 'n'},
    {0,0,0,0}
};

int main(int argc, char *argv[]){
    int opt, option_index=0;
    unsigned int dim=1024, density=5000;
    double normal_stdev=0.01;
    unsigned long seed = 10000;
    float *v;
    stopwatch sw;

    while ((opt = getopt_long(argc, argv, "s:d:n:", long_options, &option_index)) != -1){
        switch(opt){
        case 's':
            normal_stdev = atof(optarg);
            break;
        case 'd':
            density =  atoi(optarg);
            break;
        case 'n':
            dim  = atoi(optarg);
            break ;
        default:
            fprintf(stderr, "Usage: %s [-s stddev] [-d density] [-n dimension]", argv[0]);
            break;
        }
    }

    float *sum = (float *) calloc(dim, sizeof(float));
    float *result = (float *) calloc(dim, sizeof(float));
    //memset(sum, 0.0, sizeof(sum));
    //memset(result, 0.0, sizeof(result));

    csr_matrix sm =  rand_csr(dim, density, normal_stdev, &seed, stderr);
    create_vector_from_random(&v, dim);

    stopwatch_start(&sw);
    spmv_csr_cpu(&sm,v,sum, result);
    stopwatch_stop(&sw);

    fprintf(stderr, "The first value of the result is %lf\n", result[0]);
    printf("{ \"status\": %d, \"options\": \"-n %d -d %d -s %f\", \"time\": %f }\n", 1, dim, density, normal_stdev, get_interval_by_sec(&sw));

    free(sum);
    free(result);
    free(v);
}
