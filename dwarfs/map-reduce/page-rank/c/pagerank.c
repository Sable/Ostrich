#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>
#include <math.h>
#include <getopt.h>

#include "common.h"
#include "common_rand.h"

const float d_factor = 0.85; //damping factor
const int max_iter = 1000;
const float threshold= 0.00001;


// generates an array of random pages and their links 
int *random_pages(int n, unsigned int *noutlinks){
  int i, j, k;
  int *pages = malloc(sizeof(*pages)*n*n); // matrix 1 means link from j->i

  for(i=0; i<n; ++i){
    noutlinks[i] = 0;
    for(j=0; j<n; ++j){
      if(i!=j && (common_rand()%2 == 1)){
        pages[i*n+j] = 1; 
        noutlinks[i] += 1; 
      }
    }
    
    // the case with no outlinks is avoided
    if(noutlinks[i] == 0){
      do { k = common_rand() % n; } while ( k == i);
      pages[i*n + k] = 1; 
      noutlinks[i] = 1;
    }
  }
  return pages;
}

void init_array(float *a, int n, float val){
  int i; 
  for(i=0; i<n; ++i){
    a[i] = val;
  }
}

void map_page_rank(int *pages, float *page_ranks, float *maps, unsigned int *noutlinks, int n){
  int i,j;
  for(i=0; i<n; ++i){
    for(j=0; j<n; ++j){
      if(pages[i*n+j] == 1){
        maps[i*n+j] = page_ranks[j]/(float)noutlinks[j];
      }
      else{
        maps[i*n+j] = 0.0f;
      }
    }
  }
}

void reduce_page_rank(float *page_ranks, float *maps, int n, float *max_diff){
  int i, j;
  float dif = 0.0f;
  float new_rank;

  for(i=0; i< n; ++i){
    new_rank = 0.0f;
    for(j=0; j<n; ++j){
      new_rank += maps[i*n + j];
    }

    new_rank = ((1-d_factor)/n)+(d_factor*new_rank);
    dif = fabs(new_rank - page_ranks[i]) > dif ? fabs(new_rank - page_ranks[i]) : dif; 
  }
  *max_diff = dif;
}

void usage(char *argv[]){
  printf("Usage: %s [-n number of pages] [-i max iterations] [-t threshold]\n", argv[0]);
}

static struct option size_opts[] = 
{
	/* name, has_tag, flag, val*/
	{"number of pages", 1, NULL, 'n'},
	{"max number of iterations", 1, NULL, 'i'},
	{"minimum threshold", 1, NULL, 't'},
	{ 0, 0, 0}	
};
int main(int argc, char *argv[]){
  int *pages;
  float *maps;
  float *page_ranks;
  unsigned int *noutlinks;
  int t;
  float max_diff;
  stopwatch sw; 

  int n = 1000;
  int iter = max_iter;
  float thresh = threshold; 

	int opt, opt_index = 0;
	while((opt = getopt_long(argc, argv, "::n:i:t:", size_opts, &opt_index)) != -1)
	{
		//printf("here");
		switch(opt)
		{
			case 'n':
				n = atoi(optarg);
				break;
			case 'i':
				iter = atoi(optarg);
				break;
			case 't':
				thresh = atof(optarg);
				break;
			default:
        usage(argv);
				exit(EXIT_FAILURE);
		}	
	} 
  max_diff=99.0f;
  page_ranks = malloc(sizeof(*page_ranks)*n);
  maps = malloc(sizeof(*maps)*n*n);
  noutlinks = malloc(sizeof(*noutlinks)*n);

  memset(noutlinks, 0, sizeof(*noutlinks)*n);
  pages = random_pages(n,noutlinks);
  init_array(page_ranks, n, 1.0f / (float) n);

  stopwatch_start(&sw);
  for(t=0; t< iter && max_diff > thresh; ++t){
    map_page_rank(pages, page_ranks, maps, noutlinks, n);
    reduce_page_rank(page_ranks, maps, n, &max_diff);
  }
  stopwatch_stop(&sw);

  printf("T reached %d at max dif %lf\n", t, max_diff);
  printf("The total time taken for a random web of %d pages is %lf seconds\n", 
      n, get_interval_by_sec(&sw));

  // for(t=0; t< n; ++t){
  //   printf("%lf, ", page_ranks[t]);
  // }

  free(pages);
  free(maps);
  free(page_ranks);
  free(noutlinks);
}
