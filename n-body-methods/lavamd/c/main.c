/*
  Copyright (c)2008-2011 University of Virginia
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted without royalty fees or other restrictions, provided that the following conditions are met:

    * Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
    * Neither the name of the University of Virginia, the Dept. of Computer Science, nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE UNIVERSITY OF VIRGINIA OR THE SOFTWARE AUTHORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

//========================================================================================================================================================================================================200
//======================================================================================================================================================150
//====================================================================================================100
//==================================================50

//========================================================================================================================================================================================================200
//  UPDATE
//========================================================================================================================================================================================================200

//  14 APR 2011 Lukasz G. Szafaryn

//========================================================================================================================================================================================================200
//  DEFINE/INCLUDE
//========================================================================================================================================================================================================200

//======================================================================================================================================================150
//  LIBRARIES
//======================================================================================================================================================150

#include <string.h>                 // (in path known to compiler)          needed by strcmp
#include <time.h>                   // (in path known to compiler)          needed by time
#include <stdio.h>                  // (in path known to compiler)          needed by printf
#include <stdlib.h>                 // (in path known to compiler)          needed by malloc
#include <stdbool.h>                // (in path known to compiler)          needed by true/false
#include <math.h>

//======================================================================================================================================================150
//  UTILITIES
//======================================================================================================================================================150

#include "./util/timer/timer.h"         // (in path specified here)
#include "./util/num/num.h"             // (in path specified here)

//======================================================================================================================================================150
//  MAIN FUNCTION HEADER
//======================================================================================================================================================150

#include "./main.h"                     // (in the current directory)

//======================================================================================================================================================150
//  KERNEL
//======================================================================================================================================================150

#include "./kernel/kernel_cpu.h"                // (in library path specified here)

#include "../../../common/common_rand.h"

//========================================================================================================================================================================================================200
//  MAIN FUNCTION
//========================================================================================================================================================================================================200

#ifdef RUN_MAIN
int main(   int argc, char *argv []) {
	LAVAMD(argc, argv);
	return 0;
}
#endif
double LAVAMD(int argc, char *argv[]) {

    //======================================================================================================================================================150
    //  CPU/MCPU VARIABLES
    //======================================================================================================================================================150

    // timer
    long long time0;
    long long time1;

    // counters
    int i, j, k, l, m, n, expected_boxes1d = 6;

    // system memory
    par_str par_cpu;
    dim_str dim_cpu;
    box_str* box_cpu;
    FOUR_VECTOR* rv_cpu;
    fp* qv_cpu;
    FOUR_VECTOR* fv_cpu;
    int nh;
    double expectedAns[4] = {4144561.0, 181665.0, -190914.0, 140373.0};

    //======================================================================================================================================================150
    //  CHECK INPUT ARGUMENTS
    //======================================================================================================================================================150

    // assing default values
    dim_cpu.cores_arg = 1;
    dim_cpu.boxes1d_arg = 1;

    // go through arguments
    for(dim_cpu.cur_arg=1; dim_cpu.cur_arg<argc; dim_cpu.cur_arg++){
        // check if -cores
        if(strcmp(argv[dim_cpu.cur_arg], "-cores")==0){
            // check if value provided
            if(argc>=dim_cpu.cur_arg+1){
                // check if value is a number
                if(isInteger(argv[dim_cpu.cur_arg+1])==1){
                    dim_cpu.cores_arg = atoi(argv[dim_cpu.cur_arg+1]);
                    if(dim_cpu.cores_arg<0){
                        fprintf(stderr, "ERROR: Wrong value to -cores parameter, cannot be <=0\n");
                        return 0;
                    }
                    dim_cpu.cur_arg = dim_cpu.cur_arg+1;
                }
                // value is not a number
                else{
                    fprintf(stderr, "ERROR: Value to -cores parameter in not a number\n");
                    return 0;
                }
            }
            // value not provided
            else{
                fprintf(stderr, "ERROR: Missing value to -cores parameter\n");
                return 0;
            }
        }
        // check if -boxes1d
        else if(strcmp(argv[dim_cpu.cur_arg], "-boxes1d")==0){
            // check if value provided
            if(argc>=dim_cpu.cur_arg+1){
                // check if value is a number
                if(isInteger(argv[dim_cpu.cur_arg+1])==1){
                    dim_cpu.boxes1d_arg = atoi(argv[dim_cpu.cur_arg+1]);
                    if(dim_cpu.boxes1d_arg<0){
                        fprintf(stderr, "ERROR: Wrong value to -boxes1d parameter, cannot be <=0\n");
                        return 0;
                    }
                    dim_cpu.cur_arg = dim_cpu.cur_arg+1;
                }
                // value is not a number
                else{
                    fprintf(stderr, "ERROR: Value to -boxes1d parameter in not a number\n");
                    return 0;
                }
            }
            // value not provided
            else{
                fprintf(stderr, "ERROR: Missing value to -boxes1d parameter\n");
                return 0;
            }
        }
        // unknown
        else{
            fprintf(stderr, "ERROR: Unknown parameter\n");
            return 0;
        }
    }

    // Print configuration
    fprintf(stderr, "Configuration used: cores = %d, boxes1d = %d\n", dim_cpu.cores_arg, dim_cpu.boxes1d_arg);

    //======================================================================================================================================================150
    //  INPUTS
    //======================================================================================================================================================150

    par_cpu.alpha = 0.5;

    //======================================================================================================================================================150
    //  DIMENSIONS
    //======================================================================================================================================================150

    // total number of boxes
    dim_cpu.number_boxes = dim_cpu.boxes1d_arg * dim_cpu.boxes1d_arg * dim_cpu.boxes1d_arg;

    // how many particles space has in each direction
    dim_cpu.space_elem = dim_cpu.number_boxes * NUMBER_PAR_PER_BOX;
    dim_cpu.space_mem = dim_cpu.space_elem * sizeof(FOUR_VECTOR);
    dim_cpu.space_mem2 = dim_cpu.space_elem * sizeof(fp);

    // box array
    dim_cpu.box_mem = dim_cpu.number_boxes * sizeof(box_str);

    //======================================================================================================================================================150
    //  SYSTEM MEMORY
    //======================================================================================================================================================150

    //====================================================================================================100
    //  BOX
    //====================================================================================================100

    // allocate boxes
    box_cpu = (box_str*)malloc(dim_cpu.box_mem);

    // initialize number of home boxes
    nh = 0;

    // home boxes in z direction
    for(i=0; i<dim_cpu.boxes1d_arg; i++){
        // home boxes in y direction
        for(j=0; j<dim_cpu.boxes1d_arg; j++){
            // home boxes in x direction
            for(k=0; k<dim_cpu.boxes1d_arg; k++){

                // current home box
                box_cpu[nh].x = k;
                box_cpu[nh].y = j;
                box_cpu[nh].z = i;
                box_cpu[nh].number = nh;
                box_cpu[nh].offset = nh * NUMBER_PAR_PER_BOX;

                // initialize number of neighbor boxes
                box_cpu[nh].nn = 0;

                // neighbor boxes in z direction
                for(l=-1; l<2; l++){
                    // neighbor boxes in y direction
                    for(m=-1; m<2; m++){
                        // neighbor boxes in x direction
                        for(n=-1; n<2; n++){

                            // check if (this neighbor exists) and (it is not the same as home box)
                            if(     (((i+l)>=0 && (j+m)>=0 && (k+n)>=0)==true && ((i+l)<dim_cpu.boxes1d_arg && (j+m)<dim_cpu.boxes1d_arg && (k+n)<dim_cpu.boxes1d_arg)==true)   &&
                                    (l==0 && m==0 && n==0)==false   ){

                                // current neighbor box
                                box_cpu[nh].nei[box_cpu[nh].nn].x = (k+n);
                                box_cpu[nh].nei[box_cpu[nh].nn].y = (j+m);
                                box_cpu[nh].nei[box_cpu[nh].nn].z = (i+l);
                                box_cpu[nh].nei[box_cpu[nh].nn].number =    (box_cpu[nh].nei[box_cpu[nh].nn].z * dim_cpu.boxes1d_arg * dim_cpu.boxes1d_arg) +
                                                                            (box_cpu[nh].nei[box_cpu[nh].nn].y * dim_cpu.boxes1d_arg) +
                                                                             box_cpu[nh].nei[box_cpu[nh].nn].x;
                                box_cpu[nh].nei[box_cpu[nh].nn].offset = box_cpu[nh].nei[box_cpu[nh].nn].number * NUMBER_PAR_PER_BOX;

                                // increment neighbor box
                                box_cpu[nh].nn = box_cpu[nh].nn + 1;

                            }

                        } // neighbor boxes in x direction
                    } // neighbor boxes in y direction
                } // neighbor boxes in z direction

                // increment home box
                nh = nh + 1;

            } // home boxes in x direction
        } // home boxes in y direction
    } // home boxes in z direction

    //====================================================================================================100
    //  PARAMETERS, DISTANCE, CHARGE AND FORCE
    //====================================================================================================100


    // input (distances)
    rv_cpu = (FOUR_VECTOR*)malloc(dim_cpu.space_mem);
    for(i=0; i<dim_cpu.space_elem; i=i+1){
        rv_cpu[i].v = (common_rand()%10 + 1) / 10.0;            // get a number in the range 0.1 - 1.0
        rv_cpu[i].x = (common_rand()%10 + 1) / 10.0;            // get a number in the range 0.1 - 1.0
        rv_cpu[i].y = (common_rand()%10 + 1) / 10.0;            // get a number in the range 0.1 - 1.0
        rv_cpu[i].z = (common_rand()%10 + 1) / 10.0;            // get a number in the range 0.1 - 1.0
    }

    // input (charge)
    qv_cpu = (fp*)malloc(dim_cpu.space_mem2);
    for(i=0; i<dim_cpu.space_elem; i=i+1){
        qv_cpu[i] = (common_rand()%10 + 1) / 10.0;          // get a number in the range 0.1 - 1.0
    }

    // output (forces)
    fv_cpu = (FOUR_VECTOR*)malloc(dim_cpu.space_mem);
    for(i=0; i<dim_cpu.space_elem; i=i+1){
        fv_cpu[i].v = 0;                                // set to 0, because kernels keeps adding to initial value
        fv_cpu[i].x = 0;                                // set to 0, because kernels keeps adding to initial value
        fv_cpu[i].y = 0;                                // set to 0, because kernels keeps adding to initial value
        fv_cpu[i].z = 0;                                // set to 0, because kernels keeps adding to initial value
    }

    time0 = get_time();

    //======================================================================================================================================================150
    //  KERNEL
    //======================================================================================================================================================150

    //====================================================================================================100
    //  CPU/MCPU
    //====================================================================================================100

    kernel_cpu( par_cpu,
                dim_cpu,
                box_cpu,
                rv_cpu,
                qv_cpu,
                fv_cpu);

    time1 = get_time();

    //======================================================================================================================================================150
    //  SYSTEM MEMORY DEALLOCATION
    //======================================================================================================================================================150
    FOUR_VECTOR sum;
    sum.v = 0; sum.x = 0; sum.y = 0; sum.z = 0;
    if (dim_cpu.boxes1d_arg == expected_boxes1d) {
        for(i=0; i<dim_cpu.space_elem; i=i+1) {
            sum.v += fv_cpu[i].v;
            sum.x += fv_cpu[i].x;
            sum.y += fv_cpu[i].y;
            sum.z += fv_cpu[i].z;
        }
        if(round(sum.v) != expectedAns[0] || round(sum.x) != expectedAns[1] || round(sum.y) != expectedAns[2] || round(sum.z) != expectedAns[3]) {
            fprintf(stderr, "Expected: [%.0f, %.0f, %.0f, %.0f]\n", expectedAns[0], expectedAns[1], expectedAns[2], expectedAns[3]);
            fprintf(stderr, "Got: [%.0f, %.0f, %.0f, %.0f]\n", sum.v, sum.x, sum.y, sum.z);
            exit(1);
        }
    } else {
        fprintf(stderr, "WARNING: no self-checking for input size of '%d'\n", dim_cpu.boxes1d_arg);
    }
    // printf("\n");
    // for(i=0; i<dim_cpu.space_elem; i=i+1) {
    //  printf("[%.2f, %.2f, %.2f, %.2f]\n", fv_cpu[i].v, fv_cpu[i].x, fv_cpu[i].y, fv_cpu[i].z);
    // }

    free(rv_cpu);
    free(qv_cpu);
    free(fv_cpu);
    free(box_cpu);

    //======================================================================================================================================================150
    //  DISPLAY TIMING
    //======================================================================================================================================================150

    // printf("Time spent in different stages of the application:\n");

    // printf("%15.12f s, %15.12f % : VARIABLES\n",                     (float) (time1-time0) / 1000000, (float) (time1-time0) / (float) (time7-time0) * 100);
    // printf("%15.12f s, %15.12f % : INPUT ARGUMENTS\n",                   (float) (time2-time1) / 1000000, (float) (time2-time1) / (float) (time7-time0) * 100);
    // printf("%15.12f s, %15.12f % : INPUTS\n",                            (float) (time3-time2) / 1000000, (float) (time3-time2) / (float) (time7-time0) * 100);
    // printf("%15.12f s, %15.12f % : dim_cpu\n",                           (float) (time4-time3) / 1000000, (float) (time4-time3) / (float) (time7-time0) * 100);
    // printf("%15.12f s, %15.12f % : SYS MEM: ALO\n",                      (float) (time5-time4) / 1000000, (float) (time5-time4) / (float) (time7-time0) * 100);

    // printf("%15.12f s, %15.12f % : KERNEL: COMPUTE\n",                   (float) (time6-time5) / 1000000, (float) (time6-time5) / (float) (time7-time0) * 100);

    // printf("%15.12f s, %15.12f % : SYS MEM: FRE\n",                  (float) (time7-time6) / 1000000, (float) (time7-time6) / (float) (time7-time0) * 100);

    printf("{ \"status\": %d, \"options\": \"-boxes1d %d\", \"time\": %f }\n", 1, 6, (float) (time1-time0) / 1000000);

    //======================================================================================================================================================150
    //  RETURN
    //======================================================================================================================================================150

    return (time1-time0)/1000000.0;
}
