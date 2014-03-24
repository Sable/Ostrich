/* The authors of this work have released all rights to it and placed it
in the public domain under the Creative Commons CC0 1.0 waiver
(http://creativecommons.org/publicdomain/zero/1.0/).

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

Retrieved from: http://en.literateprograms.org/Cooley-Tukey_FFT_algorithm_(C)?oldid=19032
*/

#include "complex_simple.h"
#include <math.h>

complex complex_from_polar(double r, double theta_radians) {
    complex result;
    result.re = r * cos(theta_radians);
    result.im = r * sin(theta_radians);
    return result;
}

double complex_magnitude(complex c) {
    return sqrt(c.re*c.re + c.im*c.im);
}

complex complex_add(complex left, complex right) {
    complex result;
    result.re = left.re + right.re;
    result.im = left.im + right.im;
    return result;
}

complex complex_sub(complex left, complex right) {
    complex result;
    result.re = left.re - right.re;
    result.im = left.im - right.im;
    return result;
}

complex complex_mult(complex left, complex right) {
    complex result;
    result.re = left.re*right.re - left.im*right.im;
    result.im = left.re*right.im + left.im*right.re;
    return result;
}

