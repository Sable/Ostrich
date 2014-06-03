// Taken from: http://wwwhome.ewi.utwente.nl/~fokkinga/mmf2010e.pdf
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>
#include <math.h>
#include <getopt.h>

#include "common.h"
#include "common_rand.h"
#include "common_args.h"

const float d_factor = 0.85; //damping factor
const int max_iter = 1000;
const float threshold= 0.00001;

const char* kernel_file =  "pagerank_kernel.cl";
cl_command_queue queue;//,kernel_queue, (=commands in common_args.x)
cl_context context;
cl_device_id device_id;
cl_program program;
cl_kernel map_kernel, reduce_kernel;
cl_mem page_ranks_d, maps_d, noutlinks_d, pages_d, dif_d;

int max_work_items;

void setup_device(int platform, int device){
    cl_int err;
    cl_int dev_type;

    device_id = _ocd_get_device(platform, device, dev_type);

    // Create a compute context
    context = clCreateContext(0, 1, &device_id, NULL, NULL, &err);
    CHKERR(err, "Failed to create a compute context!");

    // Create a command queue
    queue = clCreateCommandQueue(context, device_id, 0, &err);
    CHKERR(err, "Failed to create a command queue!");

    program = ocdBuildProgramFromFile(context, device_id, kernel_file);
    map_kernel = clCreateKernel(program, "map_page_rank" , &err); // Create the compute kernel in the program we wish to run
    reduce_kernel = clCreateKernel(program, "reduce_page_rank" , &err); // Create the compute kernel in the program we wish to run

    size_t sizes[3];
    err = clGetDeviceInfo(device_id, CL_DEVICE_MAX_WORK_ITEM_SIZES, sizeof(size_t)*3, sizes, NULL);
    CHKERR(err, "Failed to get max work items");

    max_work_items = sizes[0];
}


// generates an array of random pages and their links
int *random_pages(int n, unsigned int *noutlinks, int divisor){
    int i, j, k;
    int *pages = malloc(sizeof(*pages)*n*n); // matrix 1 means link from j->i

    if (divisor <= 0) {
        fprintf(stderr, "ERROR: Invalid divisor '%d' for random initialization, divisor should be greater or equal to 1\n", divisor);
        exit(1);
    }

    for(i=0; i<n; ++i){
        noutlinks[i] = 0;
        for(j=0; j<n; ++j){
            if(i!=j && (abs(common_rand())%divisor == 0)){
                pages[i*n+j] = 1;
                noutlinks[i] += 1;
            }
        }

        // the case with no outlinks is avoided
        if(noutlinks[i] == 0){
            do { k = abs(common_rand()) % n; } while ( k == i);
            pages[i*n + k] = 1;
            noutlinks[i] = 1;
        }
    }
    return pages;
}

void init_array(float *a, int n, float val){
    int i;
    for(i=0; i<n; ++i){
        a[i] = val;
    }
}

void map_page_rank(int *pages, float *page_ranks, float *maps, unsigned int *noutlinks, int n){
    int i,j;
    float outbound_rank = 0.0;
    for(i=0; i<n; ++i){
        outbound_rank = page_ranks[i]/(float)noutlinks[i];
        for(j=0; j<n; ++j){
            maps[i*n+j] = pages[i*n+j] == 0 ? 0.0f : pages[i*n+j]*outbound_rank;
        }
    }
}

float reduce_page_rank(float *page_ranks, float *maps, int n){
    int i, j;
    float dif = 0.0f;
    float new_rank;
    float old_rank;

    for(j=0; j<n; ++j){
        old_rank = page_ranks[j];
        new_rank = 0.0f;
        for(i=0; i< n; ++i){
            new_rank += maps[i*n + j];
        }
        new_rank = ((1-d_factor)/n)+(d_factor*new_rank);
        dif = fabs(new_rank - old_rank) > dif ? fabs(new_rank - old_rank) : dif;
        page_ranks[j] = new_rank;
    }
    return dif;
}

void printM(float *aa, int m, int n){
    int i=0;
    int j=0;
    for(i=0; i<m;++i){
        for(j=0; j<n;++j){
            fprintf(stderr, "%lf,", aa[i*n+j]);
        }
        fprintf(stderr, "\n");
    }
}
void usage(char *argv[]){
    fprintf(stderr, "Usage: %s [-p platform] [-d device] [-n number of pages] [-i max iterations] [-t threshold]\n", argv[0]);
}

static struct option size_opts[] =
{
    /* name, has_tag, flag, val*/
    {"platform", 1, NULL, 'p'},
    {"device", 1, NULL, 'd'},
    {"number of pages", 1, NULL, 'n'},
    {"max number of iterations", 1, NULL, 'i'},
    {"minimum threshold", 1, NULL, 't'},
    {"divisor for zero density", 1, NULL, 'q'},
    { 0, 0, 0}
};

float maximum_dif(float *difs, int n){
  int i;
  float max = 0.0f;
  for(i=0; i<n; ++i){
    max = difs[i] > max ? difs[i] : max;
  }
  return max;
}
int main(int argc, char *argv[]){
    int *pages;
    float *maps;
    float *page_ranks;
    unsigned int *noutlinks;
    int t;
    float max_diff;
    stopwatch sw;

    int i = 0;
    int j;
    int n = 1000;
    float sum = 0;
    int iter = max_iter;
    float thresh = threshold;
    int divisor = 2;
    int nb_links = 0;
    int platform = 0;
    int device = 0;

    int opt, opt_index = 0;
    while((opt = getopt_long(argc, argv, "::p:d:n:i:t:q:", size_opts, &opt_index)) != -1){
        switch(opt){
          case 'p':
              platform = atoi(optarg);
              break;
          case 'd':
              device =  atoi(optarg);
              break;
          case 'n':
              n = atoi(optarg);
              break;
          case 'i':
              iter = atoi(optarg);
              break;
          case 't':
              thresh = atof(optarg);
              break;
          case 'q':
              divisor = atoi(optarg);
              break;
          default:
              usage(argv);
              exit(EXIT_FAILURE);
        }
    }
    cl_int err;
    max_diff=99.0f;
    page_ranks = (float*)malloc(sizeof(*page_ranks)*n);
    maps = (float*)malloc(sizeof(*maps)*n*n);
    noutlinks = (unsigned int*)malloc(sizeof(*noutlinks)*n);

    max_diff=99.0f;

    for (i=0; i<n; ++i) {
        noutlinks[i] = 0;
    }
    pages = random_pages(n,noutlinks,divisor);
    init_array(page_ranks, n, 1.0f / (float) n);

    nb_links = 0;
    for (i=0; i<n; ++i) {
        for (j=0; j<n; ++j) {
            nb_links += pages[i*n+j];
        }
    }
    //fprintf(stderr, "nb of links: %d/%d\n",nb_links,n*n);
    stopwatch_start(&sw);
    setup_device(platform, device);

    float *diffs, *nzeros;
    diffs  = malloc(sizeof(float)*n);
    nzeros = malloc(sizeof(float)*n);
    for(i = 0; i < n; ++i){
      diffs[i] = 0.0f;
      nzeros[i] = 0.0f;
    }

    pages_d = clCreateBuffer(context, CL_MEM_READ_ONLY, sizeof(*pages)*n*n, NULL, &err);
    page_ranks_d = clCreateBuffer(context, CL_MEM_READ_WRITE, sizeof(*page_ranks)*n, NULL, &err);
    maps_d = clCreateBuffer(context, CL_MEM_READ_WRITE, sizeof(*maps)*n*n, NULL, &err);
    noutlinks_d = clCreateBuffer(context, CL_MEM_READ_ONLY, sizeof(*noutlinks)*n, NULL, &err);
    dif_d = clCreateBuffer(context, CL_MEM_READ_WRITE, sizeof(*diffs)*n, NULL, &err);

    err = clEnqueueWriteBuffer(queue, pages_d, CL_TRUE, 0, sizeof(*pages)*n*n, pages, 0, NULL, NULL);
    clFinish(queue);
    err = clEnqueueWriteBuffer(queue, maps_d, CL_TRUE, 0, sizeof(*maps)*n*n, maps, 0, NULL, NULL);
    clFinish(queue);
    err = clEnqueueWriteBuffer(queue, page_ranks_d, CL_TRUE, 0, sizeof(*page_ranks)*n, page_ranks, 0, NULL, NULL);
    clFinish(queue);
    err = clEnqueueWriteBuffer(queue, noutlinks_d, CL_TRUE, 0, sizeof(*noutlinks)*n, noutlinks, 0, NULL, NULL);
    clFinish(queue);
    err = clEnqueueWriteBuffer(queue, dif_d, CL_TRUE, 0, sizeof(*diffs)*n, diffs, 0, NULL, NULL);
    clFinish(queue);

    size_t local_size[1] = { n < max_work_items? n : max_work_items};
    size_t global_size[1] = { n % local_size[0] == 0 ? n : ((n/local_size[0])+1)*local_size[0]};

        err = clSetKernelArg(map_kernel, 0, sizeof(cl_mem), &pages_d);
        err |= clSetKernelArg(map_kernel, 1, sizeof(cl_mem), &page_ranks_d);
        err |= clSetKernelArg(map_kernel, 2, sizeof(cl_mem), &maps_d);
        err |= clSetKernelArg(map_kernel, 3, sizeof(cl_mem), &noutlinks_d);
        err |= clSetKernelArg(map_kernel, 4, sizeof(int), &n);
        clFinish(queue);
        CHKERR(err, "Map Kernel Arguments set failed");

        err = clSetKernelArg(reduce_kernel, 0, sizeof(cl_mem), &page_ranks_d);
        err |= clSetKernelArg(reduce_kernel, 1, sizeof(cl_mem), &maps_d);
        err |= clSetKernelArg(reduce_kernel, 2, sizeof(int), &n);
        err |= clSetKernelArg(reduce_kernel, 3, sizeof(cl_mem), &dif_d);
        clFinish(queue);
        CHKERR(err, "REDUCE Kernel Arguments set failed");

    for(t=1; t<=iter && max_diff>=thresh; ++t){
        // // MAP PAGE RANKS
        err = clEnqueueNDRangeKernel(queue, map_kernel, 1, NULL, global_size, local_size, 0, NULL, NULL);
        clFinish(queue);

        // REDUCE PAGE RANKS
        err = clEnqueueNDRangeKernel(queue, reduce_kernel, 1, NULL, global_size, local_size, 0, NULL, NULL);
        clFinish(queue);

        err = clEnqueueReadBuffer(queue, dif_d, CL_TRUE, 0, sizeof(float)*n, diffs, 0, NULL, NULL);
        clFinish(queue);
        max_diff = maximum_dif(diffs, n);
        err = clEnqueueWriteBuffer(queue, dif_d, CL_TRUE, 0, sizeof(*nzeros)*n, nzeros, 0, NULL, NULL);
        clFinish(queue);
    }

    err = clEnqueueReadBuffer(queue, maps_d, CL_FALSE, 0,  sizeof(*maps)*n*n, maps, 0, NULL, NULL);
    err = clEnqueueReadBuffer(queue, page_ranks_d, CL_FALSE, 0, sizeof(*page_ranks)*n, page_ranks, 0, NULL, NULL);
    clFinish(queue);
    stopwatch_stop(&sw);

    fprintf(stderr, "T reached %d at max dif %lf\n", t, max_diff);
    printf("{ \"status\": %d, \"options\": \"-n %d -i %d -t %f\", \"time\": %f }\n", 1, n, iter, thresh, get_interval_by_sec(&sw));

    // printM(page_ranks, 1, n);

    free(pages);
    free(maps);
    free(page_ranks);
    free(noutlinks);

    clReleaseMemObject(pages_d);
    clReleaseMemObject(maps_d);
    clReleaseMemObject(page_ranks_d);
    clReleaseMemObject(noutlinks_d);
    clReleaseMemObject(dif_d);
    clReleaseCommandQueue(queue);
    clReleaseKernel(map_kernel);
    clReleaseKernel(reduce_kernel);
    clReleaseProgram(program);
    clReleaseContext(context);
}
