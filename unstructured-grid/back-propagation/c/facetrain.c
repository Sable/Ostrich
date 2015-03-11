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
#include <math.h>
#include "backprop.h"
#include "imagenet.h"

extern char *strcpy();
extern void exit();

double backprop_face(int layer_size) {
    BPNN *net;
    int i,j;
    float out_err, hid_err;
    long long time0,time1;
    double sum_of_hidden_weights = 0;
    double expected_sum_of_hidden_weights = 10.855641469359398;
    int expected_layer_size = 2850000;
    net = bpnn_create(layer_size, 16, 1); // (16, 1 can not be changed)
    load(net, layer_size);
    //entering the training kernel, only one iteration
    time0 = gettime();
    bpnn_train_kernel(net, &out_err, &hid_err);
    time1 = gettime();


    if (layer_size == expected_layer_size) {
        for (i=1; i<=net->hidden_n; ++i) {
            for (j=1; j<=net->output_n; ++j) {
                sum_of_hidden_weights += net->hidden_weights[i][j];
            }
        }
        if (sum_of_hidden_weights != expected_sum_of_hidden_weights) {
            fprintf(stderr, "ERROR: expected a sum of hidden weights of '%f' for an input size of '%d' but got '%f' instead\n", expected_sum_of_hidden_weights, expected_layer_size, sum_of_hidden_weights);
            exit(1);
        }
    } else {
        fprintf(stderr, "WARNING: no self-checking for input size of '%d'\n", layer_size);
    }

    //fprintf(stderr, "Output: %.4f\t%.4f\n", net->output_units[1], net->output_delta[1]);
    bpnn_free(net);
    //fprintf(stderr, "Training done\n");
    printf("{ \"status\": %d, \"options\": \"%d\", \"time\": %f }\n", 1, layer_size, (float) (time1-time0) / 1000000);
    return (time1-time0)/1000000.0;
}

#ifdef RUN_MAIN
int main(int argc, char **argv)
{
    if(argc!=2) {
        fprintf(stderr, "usage: backprop <num of input elements>\n");
        exit(0);
    }

    int layer_size = atoi(argv[1]);
    backprop_face(layer_size);

    exit(0);
}
#endif
