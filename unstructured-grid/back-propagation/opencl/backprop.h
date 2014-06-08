/*
  Copyright (c)2008-2011 University of Virginia
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted without royalty fees or other restrictions, provided that the following conditions are met:

    * Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
    * Neither the name of the University of Virginia, the Dept. of Computer Science, nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE UNIVERSITY OF VIRGINIA OR THE SOFTWARE AUTHORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

#ifndef _BACKPROP_H_
#define _BACKPROP_H_

#define BIGRND 0x7fffffff
#define THREADS 256
#define WIDTH 16  // shared memory width
#define HEIGHT 16 // shared memory height
#define BLOCK_SIZE 16

#define ETA 0.3       //eta value
#define MOMENTUM 0.3  //momentum value
#define NUM_THREAD 4  //OpenMP threads


typedef struct {
  int input_n;                  /* number of input units */
  int hidden_n;                 /* number of hidden units */
  int output_n;                 /* number of output units */

  float *input_units;          /* the input units */
  float *hidden_units;         /* the hidden units */
  float *output_units;         /* the output units */

  float *hidden_delta;         /* storage for hidden unit error */
  float *output_delta;         /* storage for output unit error */

  float *target;               /* storage for target vector */

  float **input_weights;       /* weights from input to hidden layer */
  float **hidden_weights;      /* weights from hidden to output layer */

                                /*** The next two are for momentum ***/
  float **input_prev_weights;  /* previous change on input to hidden wgt */
  float **hidden_prev_weights; /* previous change on hidden to output wgt */
} BPNN;


/*** User-level functions ***/

//void bpnn_initialize();
void bpnn_initialize(int seed);
BPNN *bpnn_create(int n_in, int n_hidden, int n_out);
void bpnn_free(BPNN *net);
//BPNN *bpnn_create();
//void bpnn_free();
void bpnn_train(BPNN *net, float *eo, float *eh);
//void bpnn_train();
//void bpnn_feedforward();
void bpnn_feedforward(BPNN *net);
void bpnn_save(BPNN *net, char *filename);
//void bpnn_save();
//BPNN *bpnn_read();
BPNN *bpnn_read(char *filename);
void load(BPNN *net);
int bpnn_train_kernel(BPNN *net, float *eo, float *eh, int platform, int device);
void bpnn_layerforward(float *l1, float *l2, float **conn, int n1, int n2);
void bpnn_output_error(float *delta, float *target, float *output, int nj, float *err);
void bpnn_hidden_error(float *delta_h, int nh, float *delta_o, int no, float **who, float *hidden, float *err);
void bpnn_adjust_weights(float *delta, int ndelta, float *ly, int nly, float **w, float **oldw);
int setup(int argc, char** argv);
float **alloc_2d_dbl(int m, int n);
float squash(float x);

#endif
