#include "sepia.h"

#define CLAMP(x) if (x < 0) x = 0; if (x > 255) x = 255;

void sepia(double *imgMatrix, int width, int height) {
    int w4 = width*4;
    int y = height;
    do {
        int offsetY = (y-1)*w4;
        int x = width;
        do {
            int offset = offsetY + (x-1)*4;

            double or = imgMatrix[offset];
            double og = imgMatrix[offset + 1];
            double ob = imgMatrix[offset + 2];

			double r = (or * 0.393 + og * 0.769 + ob * 0.189);
			double g = (or * 0.349 + og * 0.686 + ob * 0.168);
			double b = (or * 0.272 + og * 0.534 + ob * 0.131);

            CLAMP(r);
            CLAMP(g);
            CLAMP(b);

            imgMatrix[offset]     = r;
            imgMatrix[offset + 1] = g;
            imgMatrix[offset + 2] = b;
        } while (--x);
    } while (--y);
}
