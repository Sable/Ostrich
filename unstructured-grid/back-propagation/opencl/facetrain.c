/*
  Copyright (c)2008-2011 University of Virginia
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted without royalty fees or other restrictions, provided that the following conditions are met:

    * Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
    * Neither the name of the University of Virginia, the Dept. of Computer Science, nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE UNIVERSITY OF VIRGINIA OR THE SOFTWARE AUTHORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/


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
