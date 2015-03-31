/*
 * The MIT License (MIT)
 *
 * Copyright (c) 2014, Erick Lavoie, Faiz Khan, Sujay Kathrotia, Vincent
 * Foley-Bourgon, Laurie Hendren
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

#include <stdio.h>
#include <stdlib.h>
#include "main.h"
#include "nqueen_cpu.h"
#include "../common/common.h"
#include <getopt.h>


static struct option long_options[] = {
      {"size", 1, NULL, 's'},
};

#ifdef RUN_MAIN
int main(int argc, char *argv[]){
	nQueens(argc, argv);
	return 0;
}
#endif

double nQueens(int argc, char *argv[]) {
  int size = 18;
  long long us = 0;
  stopwatch sw;
  int opt, option_index=0;
  int status = 1;

  if(argc < 2){
    fprintf(stderr, "Usage: %s [-s board size\n", argv[0]);
    exit(EXIT_FAILURE);
  }


  while ((opt = getopt_long(argc, argv, "s:",
                            long_options, &option_index)) != -1 ) {
    if(opt == 's')size = atoi(optarg);
    else{
      fprintf(stderr, "Usage: %s [-s board size\n", argv[0]);
      exit(EXIT_FAILURE);
    }
  }
  stopwatch_start(&sw);
  long long solutions = nqueen_cpu(size, &us);
  stopwatch_stop(&sw);

  /* Verification for n = 16 */
  if (size == 16) {
      if (solutions != 14772512 || us != 1846955) {
          status = 0;
      }
  }

  fprintf(stderr, "The number of solution is %lld, the number of unique solutions is "
          "%lld and the total time it took is %lf seconds\n", solutions, us,
          get_interval_by_sec(&sw));
  printf("{ \"status\": %d, \"options\": \"-s %d\", \"time\": %f }\n", status, size, get_interval_by_sec(&sw));
  return get_interval_by_sec(&sw);
}
