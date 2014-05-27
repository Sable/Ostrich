// Taken from: http://wwwhome.ewi.utwente.nl/~fokkinga/mmf2010e.pdf
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
int *random_pages(int n, unsigned int *noutlinks, int divisor){
    int i, j, k;
    int *pages = malloc(sizeof(*pages)*n*n); // matrix 1 means link from j->i

    if (divisor <= 0) {
        printf("ERROR: Invalid divisor '%d' for random initialization, divisor should be greater or equal to 1\n", divisor);
        exit(1);
    }

    for(i=0; i<n; ++i){
        noutlinks[i] = 0;
        for(j=0; j<n; ++j){
            if(i!=j && (common_rand()%divisor == 0)){
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
    float outbound_rank = 0.0;
    for(i=0; i<n; ++i){
        outbound_rank = page_ranks[i]/(float)noutlinks[i];
        for(j=0; j<n; ++j){
            maps[i*n+j] = pages[i*n+j] == 0 ? 0.0f : pages[i*n+j]*outbound_rank;
        }
    }
}

float reduce_page_rank(float *page_ranks, float *maps, int n){
    int i, j;
    float dif = 0.0f;
    float new_rank;
    float old_rank;

    for(j=0; j<n; ++j){
        old_rank = page_ranks[j];
        new_rank = 0.0f;
        for(i=0; i< n; ++i){
            new_rank += maps[i*n + j];
        }
        new_rank = ((1-d_factor)/n)+(d_factor*new_rank);
        dif = fabs(new_rank - old_rank) > dif ? fabs(new_rank - old_rank) : dif;
        page_ranks[j] = new_rank;
    }
    return dif;
}

void usage(char *argv[]){
    fprintf(stderr, "Usage: %s [-n number of pages] [-i max iterations] [-t threshold]\n", argv[0]);
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

    int i = 0;
    int j;
    int n = 1000;
    float sum = 0;
    int iter = max_iter;
    float thresh = threshold;
    int divisor = 2;
    int nb_links = 0;

    int opt, opt_index = 0;
    while((opt = getopt_long(argc, argv, "::n:i:t:d:", size_opts, &opt_index)) != -1)
    {
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
        case 'd':
            divisor = atoi(optarg);
            break;
        default:
            usage(argv);
            exit(EXIT_FAILURE);
        }
    }
    max_diff=99.0f;
    page_ranks = (float*)malloc(sizeof(*page_ranks)*n);
    maps = (float*)malloc(sizeof(*maps)*n*n);
    noutlinks = (unsigned int*)malloc(sizeof(*noutlinks)*n);

    for (i=0; i<n; ++i) {
        noutlinks[i] = 0;
    }
    pages = random_pages(n,noutlinks,divisor);
    init_array(page_ranks, n, 1.0f / (float) n);

    nb_links = 0;
    for (i=0; i<n; ++i) {
        for (j=0; j<n; ++j) {
            nb_links += pages[i*n+j];
        }
    }
    //printf("nb of links: %d/%d\n",nb_links,n*n);

    stopwatch_start(&sw);

    for(t=1; t<=iter && max_diff>=thresh; ++t){
        map_page_rank(pages, page_ranks, maps, noutlinks, n);
        max_diff = reduce_page_rank(page_ranks, maps, n);

        fprintf(stderr, "PageRanks(%.3d) [diff=%.10f]: ", t, max_diff);
        sum = 0;
        for (i=0; i<n; ++i) {
            //printf("%.4f ", page_ranks[i]);
            sum += page_ranks[i];
        }
        fprintf(stderr, " sum=%.3f \n",sum);
    }
    stopwatch_stop(&sw);

    fprintf(stderr, "T reached %d at max dif %lf\n", t, max_diff);
    printf("{ \"status\": %d, \"options\": \"-n %d -i %d -t %f\", \"time\": %f }\n", 1, n, iter, thresh, get_interval_by_sec(&sw));

    // for(t=0; t< n; ++t){
    //   printf("%lf, ", page_ranks[t]);
    // }

    free(pages);
    free(maps);
    free(page_ranks);
    free(noutlinks);
}
