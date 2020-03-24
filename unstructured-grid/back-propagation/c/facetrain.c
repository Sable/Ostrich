
#include <stdio.h>
#include <stdlib.h>
#include <math.h>
#include "backprop.h"
#include "imagenet.h"

extern char *strcpy();
extern void exit();

int layer_size = 0;

void backprop_face() {
    BPNN *net;
    int i,j;
    float out_err, hid_err;
    long long time0,time1;
    double sum_of_hidden_weights = 0;
    double expected_sum_of_hidden_weights = 10.855641469359398;
    int expected_layer_size = 2850000;
    net = bpnn_create(layer_size, 16, 1); // (16, 1 can not be changed)
    load(net);
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
}

int main(argc, argv)
int argc;
char *argv[];
{
    if(argc!=2) {
        fprintf(stderr, "usage: backprop <num of input elements>\n");
        exit(0);
    }

    layer_size = atoi(argv[1]);
    backprop_face();

    exit(0);
}
