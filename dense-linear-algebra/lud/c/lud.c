/*
 * =====================================================================================
 *
 *       Filename:  suite.c
 *
 *    Description:  The main wrapper for the suite
 *
 *        Version:  1.0
 *        Created:  10/22/2009 08:40:34 PM
 *       Revision:  none
 *       Compiler:  gcc
 *
 *         Author:  Liang Wang (lw2aw), lw2aw@virginia.edu
 *        Company:  CS@UVa
 *
 * =====================================================================================
 */

#include <stdio.h>
#include <unistd.h>
#include <getopt.h>
#include <stdlib.h>
#include <assert.h>
#include "common.h"

static int do_verify = 0;

static struct option long_options[] = {
    /* name, has_arg, flag, val */
    {"input", 1, NULL, 'i'},
    {"size", 1, NULL, 's'},
    {"verify", 0, NULL, 'v'},
    {0,0,0,0}
};

extern void
lud_base(double *m, int matrix_dim);

int expected_row_indices[100] = {690, 9, 359, 36, 162, 515, 62, 35, 861, 335, 860,
548, 533, 958, 317, 514, 414, 333, 537, 420, 347, 933, 356, 714, 958, 648, 391,
536, 44, 965, 423, 962, 744, 434, 568, 463, 980, 905, 188, 541, 617, 216, 312,
527, 760, 517, 638, 148, 756, 606, 174, 983, 30, 220, 721, 1001, 687, 355, 982,
930, 534, 758, 177, 60, 841, 367, 22, 629, 468, 259, 327, 805, 491, 501, 160,
750, 420, 664, 630, 841, 542, 114, 769, 590, 510, 635, 794, 259, 9, 715, 842,
860, 469, 242, 731, 144, 980, 370, 344, 598};

int expected_col_indices[100] = {313, 910, 273, 222, 524, 33, 803, 724, 980, 849,
790, 770, 128, 677, 633, 287, 804, 709, 984, 450, 537, 439, 754, 677, 394, 344,
361, 161, 418, 583, 1017, 45, 626, 241, 963, 620, 552, 604, 493, 459, 554, 699,
15, 926, 47, 580, 674, 309, 834, 459, 840, 61, 23, 777, 624, 415, 765, 870,
191, 185, 625, 107, 523, 663, 954, 771, 584, 775, 745, 777, 118, 918, 504, 892,
547, 169, 360, 565, 978, 440, 741, 891, 259, 905, 730, 944, 579, 296, 93, 498,
929, 48, 109, 903, 341, 659, 236, 0, 734, 475};

double expected_values[100] = {-22.848189418846398979213,
0.486575877054862770965, 2.350990332002380611698, 0.255936778601883629936,
0.369716886989750581627, 0.436167974270290970118, 0.146278341558460728278,
0.065941041612251782844, -3.293335001426441976946, 1.676757766030180007988,
0.914670926671572570577, -1.449165223810348734901, -4.062626991062644243868,
8.053719449216675485559, -0.802856897069948227674, 1.286258895854830219818,
1.046663620982626996536, 0.484603780235753345274, 2.177434960082209158827,
-0.076253507783682866750, 1.756722536293205738644, 0.540981804186463688389,
1.160877339446317879634, -0.500662762448355613820, -0.315089287598811773616,
1.487745379848905757925, -0.151896246268855089623, 0.656797241815350263394,
0.400712960066768264511, 0.701017197177835504895, 21.239255832148906222301,
0.385402388730710976361, 0.827099588440812327761, 3.322857338786085801274,
4.566630782122058640482, 1.723268967613441171594, -0.245335815889943242851,
3.310282619080586741234, 0.365940908008368537274, 0.573872758815816563782,
-7.288906901332710575048, 0.038431167008329936152, 0.028831025599041319729,
16.551345012895176012080, 0.572626610991005424722, -5.040356494551264887605,
3.074688991682028138541, 0.509559370036213876709, 1.344846005445668346567,
-0.899161793412182497320, 1.450843036958202159070, 0.707012750727151084718,
0.155740946804082569521, -20.622119724330712386973, 0.310740831317683263713,
4.021615405596988601644, 0.832891886091167044093, 1.736708056130134680828,
1.908346944066334094359, 6.004850895670037047580, -16.157750602775347914530,
0.163978793796913130398, -0.062671443842940877111, 0.929108185567632416380,
2.490843964912780705845, -0.066104762308228259826, 0.386981072535134362766,
-0.823938825980013334060, 0.526846622283516752283, -0.272223830142624412254,
0.378414255255514475618, -0.465486599242579401903, -0.420333065592308097180,
-4.672003607431108207493, 0.901549254898271534842, -0.684091977355238745062,
4.398443774587856403002, 0.065205826885363540879, 5.423729935594375106689,
-0.608124968949819821873, -45.149928055289088035806, 0.244564514518492037709,
-4.507925769188863895920, 56.208587041192998867700, -6.848970386253027342605,
1.248317846059819657967, 0.457962760205558649940, 0.577264680902939586460,
0.987432966002931178373, -24.973096779128248101642, -2.795692544319765548977,
0.158278067517842180312, 0.339449080878009679108, 1.889684533467393734441,
2.543604357651815917052, 5.205758093407768960503, -0.241207430471430422925,
0.660969548700828801735, 1.781811506239100006965, 1.750625326806120041212};

int
main ( int argc, char *argv[] )
{
    int matrix_dim = 32; /* default matrix_dim */
    int opt, option_index=0, error=0;
    func_ret_t ret;
    const char *input_file = NULL;
    double *m, *mm;
    stopwatch sw;
    int i,j;

    while ((opt = getopt_long(argc, argv, ":vs:i:",
                              long_options, &option_index)) != -1 ) {
        switch(opt){
        case 'v':
            do_verify = 1;
            break;
        case 's':
            matrix_dim = atoi(optarg);
            break;
        case '?':
            fprintf(stderr, "invalid option\n");
            error=1;
            break;
        case ':':
            fprintf(stderr, "missing argument\n");
            error=1;
            break;
        default:
            error=1;
        }
    }

    if ((optind < argc) || (optind == 1) || error) {
        fprintf(stderr, "Usage: %s [-v] [-s matrix_size]\n", argv[0]);
        exit(EXIT_FAILURE);
    }

     /*if(matrix_dim>1) {
        fprintf(stderr, "Generating matrix of size %d x %d\n", matrix_dim, matrix_dim);
        ret = create_matrix_from_random(&m, matrix_dim);
        if(ret != RET_SUCCESS){
            m = NULL;
            fprintf(stderr, "error could not generate random matrix of size %d x %d!\n", matrix_dim, matrix_dim);
            exit(EXIT_FAILURE);
        }
    }
    else {
        fprintf(stderr, "No input file or valid matrix size specified!\n");
        exit(EXIT_FAILURE);
    }*/
	matrix_dim = 3;
	create_matrix_from_random(&m, matrix_dim);
	double val[] = {25,5,1,64,8,1,144,12,1};
	for(i=0;i<9;i++) m[i] = val[i];

    if (do_verify){
        //printf("Before LUD\n");
        //print_matrix(m, matrix_dim);
        matrix_duplicate(m, &mm, matrix_dim);
    }

    stopwatch_start(&sw);
    lud_base(m, matrix_dim);
    stopwatch_stop(&sw);
	
	for(i = 0;i < matrix_dim; ++i){
		for(j = 0; j < matrix_dim; ++j){
			printf("%lf ",m[i*matrix_dim + j]);
		}
		printf("\n");
	}

    if (matrix_dim == 1024) {
        for (i=0; i<100; ++i) {
            if (m[expected_row_indices[i]*matrix_dim + expected_col_indices[i]] != expected_values[i]) {
                fprintf(stderr, "ERROR: value at index (%d,%d) = '%.*f' is different from the expected value '%.*f'\n", 
                    expected_row_indices[i],
                    expected_col_indices[i],
                    // the 21 parameter prints enough significant decimal digits to obtain the same floating-point number
                    // when read back
                    21, m[expected_row_indices[i]*matrix_dim + expected_col_indices[i]], 
                    21, expected_values[i]
                );
                fprintf(stderr, "Received values:\n");
                for (i=0; i<100; ++i) {
                    fprintf(stderr, "%.*f, ", 21, m[expected_row_indices[i]*matrix_dim + expected_col_indices[i]]);
                }
                fprintf(stderr, "\n");
                exit(1);
            }
        }
    } else {
        fprintf(stderr, "WARNING: No self-checking step for dimension '%d'\n", matrix_dim);
    }

    if (do_verify){
        //fprintf(stderr, "After LUD\n");
        //print_matrix(m, matrix_dim);
        fprintf(stderr, ">>>Verify<<<<\n");
        lud_verify(mm, m, matrix_dim);
        free(mm);
    }

    free(m);
    printf("{ \"status\": %d, \"options\": \"-s %d\", \"time\": %f }\n", 1, matrix_dim, get_interval_by_sec(&sw));
    return EXIT_SUCCESS;
}				/* ----------  end of function main  ---------- */
