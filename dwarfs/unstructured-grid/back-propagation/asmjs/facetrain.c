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
	int i;
	float out_err, hid_err;
	long long time0,time1;
	net = bpnn_create(layer_size, 16, 1); // (16, 1 can not be changed)
	//printf("Input layer size : %d\n", layer_size);
	load(net);
	//entering the training kernel, only one iteration
	//printf("Starting training kernel\n");
	time0 = gettime();
	bpnn_train_kernel(net, &out_err, &hid_err);
	time1 = gettime();
	printf("Output: %.4f\t%.4f\n", net->output_units[1], net->output_delta[1]);
	bpnn_free(net);
	//printf("Training done\n");
	printf("Computation time: %.12f s\n", (float) (time1-time0) / 1000000);
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
	
	int seed;

	seed = 7;
	bpnn_initialize(seed);
	backprop_face();

	exit(0);
}
