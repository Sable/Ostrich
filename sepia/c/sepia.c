#include <stdio.h>

#include <wand/magick_wand.h>

#include "sepia.h"

#define CLAMP(x) if (x < 0) x = 0; if (x > 255) x = 255;

void sepia(MagickWand *mw) {
    int width = MagickGetImageWidth(mw);
    int height = MagickGetImageHeight(mw);
    size_t _ignored;

    PixelIterator *it = NewPixelIterator(mw);
    for (int y = 0; y < height; ++y) {
        PixelWand **pixels = PixelGetNextIteratorRow(it, &_ignored);
        for (int x = 0; x < width; ++x) {
            double or = PixelGetRed(pixels[x]);
            double og = PixelGetGreen(pixels[x]);
            double ob = PixelGetBlue(pixels[x]);

			double r = (or * 0.393 + og * 0.769 + ob * 0.189);
			double g = (or * 0.349 + og * 0.686 + ob * 0.168);
			double b = (or * 0.272 + og * 0.534 + ob * 0.131);

            CLAMP(r);
            CLAMP(g);
            CLAMP(b);

            PixelSetRed(pixels[x], r);
            PixelSetGreen(pixels[x], g);
            PixelSetBlue(pixels[x], b);
        }
        PixelSyncIterator(it);

    }
    DestroyPixelIterator(it);
}
