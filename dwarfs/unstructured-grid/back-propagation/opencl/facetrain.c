#include <stdio.h>
#include <stdlib.h>
#include <getopt.h>
#include <math.h>
#include "backprop.h"
#include "omp.h"
#include "common.h"

extern char *strcpy();
extern void exit();

int layer_size = 0;
int platform_idx = 0, device_idx = 0;

static struct option long_options[] = {
    /* name, has_arg, flag, val */
    {"platform", 1, NULL, 'p'},
    {"device", 1, NULL, 'd'},
    {"layer_size", 1, NULL, 'n'},
    {0,0,0,0}
};


void backprop_face()
{
    BPNN *net;
    int i;
    float out_err, hid_err;
    stopwatch sw;

    net = bpnn_create(layer_size, 16, 1); // (16, 1 can not be changed)

    fprintf(stderr, "Input layer size : %d\n", layer_size);
    load(net);
    //entering the training kernel, only one iteration
    fprintf(stderr, "Starting training kernel\n");

    stopwatch_start(&sw);
    bpnn_train_kernel(net, &out_err, &hid_err, platform_idx, device_idx);
    stopwatch_stop(&sw);

    bpnn_free(net);
    fprintf(stderr, "\nFinish the training for one iteration\n");
    printf("{ \"status\": %d, \"options\": \"%d\", \"time\": %f }\n", 1, layer_size, get_interval_by_sec(&sw));
}

int setup(int argc, char **argv)
{

    int seed;
    int opt, option_index=0;
    while ((opt = getopt_long(argc, argv, "d:n:p:", long_options, &option_index)) != -1) {
        switch(opt){
        case 'p':
            platform_idx = atoi(optarg);
            break;
        case 'd':
            device_idx = atoi(optarg);
            break;
        case 'n':
            layer_size = atoi(optarg);
            break;
        default:
            fprintf(stderr, "Usage: %s [-p platform] [-d device] [-n layer_size]", argv[0]);
            break;
        }
    }

    if (layer_size%16!=0){
        fprintf(stderr, "The number of input points must be divided by 16\n");
        exit(0);
    }

    seed = 7;
    bpnn_initialize(seed);
    backprop_face();

    exit(0);
}
