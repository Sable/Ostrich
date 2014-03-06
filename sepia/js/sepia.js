/*
 * Pixastic Lib - Sepia filter - v0.1.0
 * Copyright (c) 2008 Jacob Seidelin, jseidelin@nihilogic.dk, http://blog.nihilogic.dk/
 * License: [http://www.pixastic.com/lib/license.txt]
 */

function sepia(imgMatrix, width, height) {
    var w4 = width*4;
    var y = height;
    do {
        var offsetY = (y-1)*w4;
        var x = width;
        do {
            var offset = offsetY + (x-1)*4;

            var or = imgMatrix[offset];
            var og = imgMatrix[offset + 1];
            var ob = imgMatrix[offset + 2];

			var r = (or * 0.393 + og * 0.769 + ob * 0.189);
			var g = (or * 0.349 + og * 0.686 + ob * 0.168);
			var b = (or * 0.272 + og * 0.534 + ob * 0.131);

            if (r < 0) r = 0; if (r > 255) r = 255;
            if (g < 0) g = 0; if (g > 255) g = 255;
            if (b < 0) b = 0; if (b > 255) b = 255;

            imgMatrix[offset]     = r;
            imgMatrix[offset + 1] = g;
            imgMatrix[offset + 2] = b;
        } while (--x);
    } while (--y);
}
