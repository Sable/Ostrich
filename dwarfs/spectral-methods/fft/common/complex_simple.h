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

#ifndef _COMPLEX_SIMPLE_H_
#define _COMPLEX_SIMPLE_H_

typedef struct complex_t {
    double re;
    double im;
} complex;

complex complex_from_polar(double r, double theta_radians);
double  complex_magnitude(complex c);
complex complex_add(complex left, complex right);
complex complex_sub(complex left, complex right);
complex complex_mult(complex left, complex right);


#endif /* #ifndef _COMPLEX_SIMPLE_H_ */

