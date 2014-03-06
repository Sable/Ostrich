#include <stdlib.h>
#include <stdio.h>
#include <time.h>

#include <wand/magick_wand.h>

#include "sepia.h"

void usage(char *prog) {
    fprintf(stderr, "Usage: %s <input file> <output file>\n", prog);
    exit(1);
}

int main(int argc, char **argv) {

    if (argc != 3) usage(argv[0]);

    char *infile = argv[1];
    char *outfile = argv[2];

    MagickWand *mw = NULL;

    MagickWandGenesis();

    mw = NewMagickWand();

    MagickReadImage(mw, infile);

    int iters = 10;
    clock_t total_time = 0;
    for (int iter = 0; iter < iters; ++iter) {
        MagickWand *clone = CloneMagickWand(mw);
        clock_t t1 = clock();
        sepia(clone);
        clock_t t2 = clock();
        total_time += t2 - t1;
        DestroyMagickWand(clone);
    }
    printf("Average time: %f secs\n", (double)total_time / CLOCKS_PER_SEC / iters);

    sepia(mw);
    MagickWriteImage(mw, outfile);

    if (mw)
        mw = DestroyMagickWand(mw);

    MagickWandTerminus();

    return 0;
}
