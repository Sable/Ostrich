/*
 * =====================================================================================
 *
 *       Filename:  runner.c
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
#include <string.h>
#include "common.h"
#include "common_rand.h"

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

int
main ( int argc, char *argv[] )
{
    int matrix_dim = 32; /* default matrix_dim */
    int opt, option_index=0, error=0;
    func_ret_t ret;
    char *input_path = NULL;
    char *output_path = NULL;
    FILE *file;
    double *m;
    stopwatch sw;
    int i,j;
    int debug = 0;
    size_t linesiz=0;
    char* linebuf=NULL;
    ssize_t linelen=0;
    char* token;
    const char comma[2] = ",";

    while ((opt = getopt_long(argc, argv, ":dvs:i:o:",
                              long_options, &option_index)) != -1 ) {
        switch(opt){
        case 'v':
            do_verify = 1;
            break;
        case 's':
            matrix_dim = atoi(optarg);
            break;
        case 'i':
            input_path = optarg;
            break;
        case 'o':
            output_path = optarg;
            break;
        case '?':
            fprintf(stderr, "invalid option\n");
            error=1;
            break;
        case 'd':
            debug=1;
            break;
        case ':':
            fprintf(stderr, "missing argument\n");
            error=1;
            break;
        default:
            error=1;
        }
    }

    if ((optind < argc) || (optind == 1) || input_path == NULL || error) {
        fprintf(stderr, "Usage: %s -s size -i input_path [-v] [-d] [-o output_path]\n", argv[0]);
        exit(EXIT_FAILURE);
    }

    file = fopen(input_path, "r");
    if (file == NULL) {
        fprintf(stderr, "Invalid input file path: %s\n", input_path);
        exit(EXIT_FAILURE);
    }

    // Read matrix from file
    if (debug) {
        fprintf(stderr, "Reading data from file %s\n", input_path);
    }
    m = (double *)malloc(sizeof(double) * matrix_dim * matrix_dim);
    j = 0;
    while ((linelen=getline(&linebuf, &linesiz, file)) != -1) {
        if (debug) {
            fprintf(stderr, "Read line: %s\n", linebuf);
        }
        /* get the first number */
        i = 0;
        token = strtok(linebuf, comma);
   
        /* walk through other numbers */
        while( token != NULL ) {
            if (debug) {
                fprintf(stderr, "Read token: %s\n", token);
            }
            m[j*matrix_dim + i] = atof(token);
            token = strtok(NULL, comma);
            i = i + 1;
        }

        free(linebuf);
        linebuf=NULL;
        j = j + 1;
    }
    fclose(file);

    if (debug) {
        fprintf(stderr, "Computing LUD\n");
    }
    stopwatch_start(&sw);
    lud_base(m, matrix_dim);
    stopwatch_stop(&sw);

    if (output_path) {
        if (debug) {
            fprintf(stderr, "Saving result in %s\n", output_path);
        }
        file = fopen(output_path, "w");

        if (file == NULL) {
            free(m);
            exit(EXIT_FAILURE);    
        }

        for (j = 0; j < matrix_dim; ++j) {
            for (i = 0; i < matrix_dim; ++i) {
                fprintf(file, "%.*f", 21, m[j*matrix_dim+i]);
                if (i < matrix_dim-1) {
                    fprintf(file, ",");
                }
            }
            fprintf(file, "\n");
        }  
        fclose(file);
    }

    free(m);
    printf("{ \"status\": %d, \"options\": \"-s %d\", \"time\": %f }\n", 1, matrix_dim, get_interval_by_sec(&sw));
    return EXIT_SUCCESS;
}				/* ----------  end of function main  ---------- */
