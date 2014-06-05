// #ifdef __cplusplus
// extern "C" {
// #endif

//========================================================================================================================================================================================================200
//======================================================================================================================================================150
//====================================================================================================100
//==================================================50

//========================================================================================================================================================================================================200
//	INCLUDE/DEFINE
//========================================================================================================================================================================================================200

//======================================================================================================================================================150
//	LIBRARIES
//======================================================================================================================================================150

#include <stdio.h>									// (in path known to compiler)	needed by printf
#include <stdlib.h>									// (in path known to compiler)	needed by malloc, free
#include <getopt.h>

//======================================================================================================================================================150
//	HEADER
//======================================================================================================================================================150

#include "./main.h"									// (in current path)

//======================================================================================================================================================150
//	UTILITIES
//======================================================================================================================================================150

#include "./util/graphics/graphics.h"				// (in specified path)
#include "./util/graphics/resize.h"					// (in specified path)
#include "./util/timer/timer.h"						// (in specified path)

//======================================================================================================================================================150
//	KERNEL
//======================================================================================================================================================150

#include "./kernel/kernel_gpu_opencl_wrapper.h"

//======================================================================================================================================================150
//	End
//======================================================================================================================================================150

static struct option long_options[] = {
    /* name, has_arg, flag, val */
    {"platform", 1, NULL, 'p'},
    {"device", 1, NULL, 'd'},
    {"niter", 1, NULL, 'n'},
    {"lambda", 1, NULL, 'l'},
    {0,0,0,0}
};


//========================================================================================================================================================================================================200
//	MAIN FUNCTION
//========================================================================================================================================================================================================200

int
main(	int argc,
		char* argv []){

	//======================================================================================================================================================150
	// 	VARIABLES
	//======================================================================================================================================================150

	int opt, option_index=0;
	int platform_idx=0, device_idx=0;
	// time
	long long time0;
	long long time1;

	// inputs image, input paramenters
	fp* image;															// input image
	int Nr,Nc;													// IMAGE nbr of rows/cols/elements
	long Ne;

	// algorithm parameters
	int niter;																// nbr of iterations
	fp lambda;															// update step size

	// size of IMAGE
	int r1,r2,c1,c2;												// row/col coordinates of uniform ROI
	long NeROI;														// ROI nbr of elements

	// surrounding pixel indicies
	int *iN, *iS, *jE, *jW;

	// center pixel value
    fp Jc;

	// directional derivatives
	fp *dN,*dS,*dW,*dE;

	// counters
	int iter;   // primary loop
	long i;    // image row
	long j;    // image col

	// memory sizes
	int mem_size_i;
	int mem_size_j;

	time0 = get_time();

	//======================================================================================================================================================150
	//	INPUT ARGUMENTS
	//======================================================================================================================================================150

	while ((opt = getopt_long(argc, argv, "d:n:p:l:", long_options, &option_index)) != -1) {
        switch(opt){
        case 'p':
            platform_idx = atoi(optarg);
            break;
        case 'd':
            device_idx = atoi(optarg);
            break;
        case 'n':
            niter = atoi(optarg);
            break;
        case 'l':
            lambda =  atof(optarg);
            break;
        default:
            fprintf(stderr, "Usage: %s [-p platform] [-d device] [-n niter] [-l lambda]", argv[0]);
            break;
        }
    }

	//====================================================================================================100
	// 	READ IMAGE (SIZE OF IMAGE HAS TO BE KNOWN)
	//====================================================================================================100

	// read image
	Nr = 502;
	Nc = 458;
	Ne = Nr*Nc;
	image = (fp*)malloc(sizeof(fp) * Ne);

	read_graphics("../data/image.pgm", image, Nr, Nc, 1);

	
    // expected results
    long expected_output = 52608;

	//======================================================================================================================================================150
	// 	SETUP
	//======================================================================================================================================================150

	// variables
	r1     = 0;											// top row index of ROI
	r2     = Nr - 1;									// bottom row index of ROI
	c1     = 0;											// left column index of ROI
	c2     = Nc - 1;									// right column index of ROI

	// ROI image size
	NeROI = (r2-r1+1)*(c2-c1+1);											// number of elements in ROI, ROI size

	// allocate variables for surrounding pixels
	mem_size_i = sizeof(int) * Nr;											//
	iN = (int *)malloc(mem_size_i) ;										// north surrounding element
	iS = (int *)malloc(mem_size_i) ;										// south surrounding element
	mem_size_j = sizeof(int) * Nc;											//
	jW = (int *)malloc(mem_size_j) ;										// west surrounding element
	jE = (int *)malloc(mem_size_j) ;										// east surrounding element

	// N/S/W/E indices of surrounding pixels (every element of IMAGE)
	for (i=0; i<Nr; i++) {
		iN[i] = i-1;														// holds index of IMAGE row above
		iS[i] = i+1;														// holds index of IMAGE row below
	}
	for (j=0; j<Nc; j++) {
		jW[j] = j-1;														// holds index of IMAGE column on the left
		jE[j] = j+1;														// holds index of IMAGE column on the right
	}

	// N/S/W/E boundary conditions, fix surrounding indices outside boundary of image
	iN[0]    = 0;															// changes IMAGE top row index from -1 to 0
	iS[Nr-1] = Nr-1;														// changes IMAGE bottom row index from Nr to Nr-1
	jW[0]    = 0;															// changes IMAGE leftmost column index from -1 to 0
	jE[Nc-1] = Nc-1;														// changes IMAGE rightmost column index from Nc to Nc-1

	//================================================================================80
    // 	SCALE IMAGE DOWN FROM 0-255 TO 0-1 AND EXTRACT
    //================================================================================80
    for (i=0; i<Ne; i++) {													// do for the number of elements in input IMAGE
        image[i] = exp(image[i]/255);											// exponentiate input IMAGE and copy to output image
    }

	time0= get_time();

	//======================================================================================================================================================150
	// 	KERNEL
	//======================================================================================================================================================150

	kernel_gpu_opencl_wrapper(	image,											// input image
								Nr,												// IMAGE nbr of rows
								Nc,												// IMAGE nbr of cols
								Ne,												// IMAGE nbr of elem
								niter,											// nbr of iterations
								lambda,											// update step size
								NeROI,											// ROI nbr of elements
								iN,
								iS,
								jE,
								jW,
								iter,											// primary loop
								mem_size_i,
								mem_size_j, platform_idx, device_idx);

	time1 = get_time();

	for (i=0; i<Ne; i++) {													// do for the number of elements in IMAGE
        image[i] = log(image[i])*255;										// take logarithm of image, log compress
        //fprintf(stderr, "%.0f, ", image[i]);
    }

    j = 0;
    for (i=0; i<Nr; i++) {
        j = j + image[i];
    }

	//======================================================================================================================================================150
	// 	WRITE OUTPUT IMAGE TO FILE
	//======================================================================================================================================================150

	write_graphics("../data/image_out_opencl.pgm", image, Nr, Nc, 1, 255);

	//======================================================================================================================================================150
	// 	FREE MEMORY
	//======================================================================================================================================================150

	free(image);
	free(iN);
	free(iS);
	free(jW);
	free(jE);

	//======================================================================================================================================================150
	//	DISPLAY TIMING
	//======================================================================================================================================================150

	if (niter == 500 && lambda == 1) {
        if (j != expected_output) {
            fprintf(stderr, "ERROR: expected output of '%ld' but received '%ld' instead\n", expected_output, j);
            exit(1);
        }
    } else {
        fprintf(stderr, "WARNING: No self-checking step for niter '%d' and lambda '%f'\n", niter, lambda);
    }

	fprintf(stderr, "Computation time: %.12f s\n", (float) (time1-time0) / 1000000);
        printf("{ \"status\": %d, \"options\": \"%d %f\", \"time\": %f }\n", 1, niter, lambda, (float) (time1-time0) / 1000000);
}

//========================================================================================================================================================================================================200
//	END
//========================================================================================================================================================================================================200
