#include <stdio.h>
#include <stdlib.h>
#include <math.h>
#include "backprop.h"
#include "omp.h"
#include "common.h"

extern char *strcpy();
extern void exit();

int layer_size = 0;

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
    bpnn_train_kernel(net, &out_err, &hid_err);
    stopwatch_stop(&sw);

    bpnn_free(net);
    fprintf(stderr, "\nFinish the training for one iteration\n");
    printf("{ \"status\": %d, \"options\": \"%d\", \"time\": %f }\n", 1, layer_size, get_interval_by_sec(&sw));
}

int setup(int argc, char **argv)
{

    int seed;

    if (argc!=2){
        fprintf(stderr, "usage: backprop <num of input elements>\n");
        exit(0);
    }
    layer_size = atoi(argv[1]);
    if (layer_size%16!=0){
        fprintf(stderr, "The number of input points must be divided by 16\n");
        exit(0);
    }


    seed = 7;
    bpnn_initialize(seed);
    backprop_face();

    exit(0);
}
