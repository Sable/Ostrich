#include <stdio.h> 
#include <stdlib.h>
#include "nqueen_cpu.h"
#include "../common/common.h"
#include <getopt.h>


static struct option long_options[] = {
      {"size", 1, NULL, 's'},
};

int main(int argc, char *argv[]){ 
  int size = 18; 
  long long us = 0; 
  stopwatch sw; 
  int opt, option_index=0;

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

  printf("The number of solution is %lld, the number of unique solutions is \
      %lld and the total time it took is %lf seconds\n", solutions, us, 
      get_interval_by_sec(&sw));
}
