#include <stdlib.h>
#include <stdio.h>
#include <time.h>

#include <wand/magick_wand.h>

#include "sepia.h"

void usage(char *prog) {
    fprintf(stderr, "Usage: %s <input file> <output file>\n", prog);
    exit(1);
}


void magick_wand_to_matrix(MagickWand *mw, double *imgMatrix) {
    int width = MagickGetImageWidth(mw);
    int height = MagickGetImageHeight(mw);
    size_t _ignored;
    int offset = 0;

    PixelIterator *it = NewPixelIterator(mw);
    for (int y = 0; y < height; ++y) {
        PixelWand **pixels = PixelGetNextIteratorRow(it, &_ignored);
        for (int x = 0; x < width; ++x) {
            double r = PixelGetRed(pixels[x]);
            double g = PixelGetGreen(pixels[x]);
            double b = PixelGetBlue(pixels[x]);
            double a = PixelGetAlpha(pixels[x]);

            imgMatrix[offset++] = r;
            imgMatrix[offset++] = g;
            imgMatrix[offset++] = b;
            imgMatrix[offset++] = a;
        }
        PixelSyncIterator(it);

    }
    DestroyPixelIterator(it);
}

void matrix_to_magic_wand(double *imgMatrix, MagickWand *mw) {
    int width = MagickGetImageWidth(mw);
    int height = MagickGetImageHeight(mw);
    size_t _ignored;
    int offset = 0;

    PixelIterator *it = NewPixelIterator(mw);
    for (int y = 0; y < height; ++y) {
        PixelWand **pixels = PixelGetNextIteratorRow(it, &_ignored);
        for (int x = 0; x < width; ++x) {
            double r = imgMatrix[offset++];
            double g = imgMatrix[offset++];
            double b = imgMatrix[offset++];
            double a = imgMatrix[offset++];

            PixelSetRed(pixels[x], r);
            PixelSetGreen(pixels[x], g);
            PixelSetBlue(pixels[x], b);
            PixelSetAlpha(pixels[x], a);
        }
        PixelSyncIterator(it);

    }
    DestroyPixelIterator(it);
}


int main(int argc, char **argv) {

    if (argc != 3) usage(argv[0]);

    char *infile = argv[1];
    char *outfile = argv[2];

    MagickWand *mw = NULL;

    MagickWandGenesis();

    mw = NewMagickWand();

    MagickReadImage(mw, infile);

    int width = MagickGetImageWidth(mw);
    int height = MagickGetImageHeight(mw);
    double *imgMatrix = malloc(sizeof(double) * width * height * 4);

    int iters = 10;
    clock_t total_time = 0;
    for (int iter = 0; iter < iters; ++iter) {
        MagickWand *clone = CloneMagickWand(mw);
        magick_wand_to_matrix(clone, imgMatrix);
        clock_t t1 = clock();
        sepia(imgMatrix, width, height);
        clock_t t2 = clock();
        total_time += t2 - t1;
        DestroyMagickWand(clone);
    }
    printf("Average time: %f secs\n", (double)total_time / CLOCKS_PER_SEC / iters);

    magick_wand_to_matrix(mw, imgMatrix);
    sepia(imgMatrix, width, height);
    matrix_to_magic_wand(imgMatrix, mw);
    MagickWriteImage(mw, outfile);


    if (mw)
        mw = DestroyMagickWand(mw);

    MagickWandTerminus();

    return 0;
}
