#include "sparse_formats.h"
#include "common.h"
#include <getopt.h>
#include <stdlib.h>

static struct option long_options[] = {
    /* name, has_arg, flag, val */
    {"stddev", 1, NULL, 's'},
    {"density", 1, NULL, 'd'},
    {"size", 1, NULL, 'n'},
    {0,0,0,0}
};

void output_js_file(unsigned int dim, unsigned int density, double normal_stdev, csr_matrix *sm, float *vector){
    FILE *fp = fopen("data.js", "w");

    fprintf(fp, "var _dim=%u;\n", dim);
    fprintf(fp, "var _density=%u;\n",density);
    fprintf(fp, "var _normal_stdev=%lf;\n", normal_stdev);

    fprintf(fp, "var _m={};\n");
    fprintf(fp, "_m.index_type=%u;\n", sm->index_type);
    fprintf(fp, "_m.value_type=%lf;\n", sm->value_type);
    fprintf(fp, "_m.num_rows=%u;\n", sm->num_rows);
    fprintf(fp, "_m.num_cols=%u;\n", sm->num_cols);
    fprintf(fp, "_m.num_nonzeros=%u;\n", sm->num_nonzeros);
    fprintf(fp, "_m.density_ppm=%u;\n", sm->density_ppm);
    fprintf(fp, "_m.density_perc=%lf;\n", sm->density_perc);
    fprintf(fp, "_m.nz_per_row=%lf;\n", sm->nz_per_row);
    fprintf(fp, "_m.stdev=%lf;\n", sm->stddev);
    
    int i;
    fprintf(fp, "_m.Arow = new Uint32Array([ ");
    for(i=0; i<sm->num_rows+1; ++i){
      fprintf(fp, "%u", sm->Ap[i]);
      if(i < sm->num_rows) fprintf(fp, ", ");
    }
    fprintf(fp, " ]);\n");

    fprintf(fp, "_m.Acol = new Uint32Array([ ");
    for(i=0; i<sm->num_nonzeros; ++i){
      fprintf(fp, "%u", sm->Aj[i]);
      if(i < sm->num_nonzeros-1) fprintf(fp, ", ");
    }
    fprintf(fp, " ]);\n");

    fprintf(fp, "_m.Ax = new Float32Array([");
    for(i=0; i<sm->num_nonzeros; ++i){
      fprintf(fp, "%lf", sm->Ax[i]);
      if(i < sm->num_nonzeros-1) fprintf(fp, ", ");
    }
    fprintf(fp, " ]);\n");

    fprintf(fp, "var _v = new Float32Array([ ");
    for(i=0; i<dim; ++i){
      fprintf(fp, "%lf", vector[i]);
      if(i < dim-1) fprintf(fp, ", ");
    }
    fprintf(fp, "]);\n");

    fclose(fp);
}

void output_c_file(unsigned int dim, unsigned int density, double normal_stdev, csr_matrix *sm, float *vector){
    FILE *fp = fopen("data.h", "w");

    fprintf(fp, "#include \"sparse_formats.h\"\n\n");
    fprintf(fp, "unsigned int _dim=%u;\n", dim);
    fprintf(fp, "unsigned int _density=%u;\n",density);
    fprintf(fp, "double _normal_stdev=%lf;\n", normal_stdev);

    fprintf(fp, "csr_matrix _sm = {\n");
    fprintf(fp, "    %u,\n", sm->index_type);
    fprintf(fp, "    %lf,\n", sm->value_type);
    fprintf(fp, "    %u,\n", sm->num_rows);
    fprintf(fp, "    %u,\n", sm->num_cols);
    fprintf(fp, "    %u,\n", sm->num_nonzeros);
    fprintf(fp, "    %u,\n", sm->density_ppm);
    fprintf(fp, "    %lf,\n", sm->density_perc);
    fprintf(fp, "    %lf,\n", sm->nz_per_row);
    fprintf(fp, "    %lf,\n", sm->stddev);
    fprintf(fp, "NULL, NULL, NULL\n");
    fprintf(fp, "};\n");
    
    int i;
    fprintf(fp, "unsigned int _Ap[%u] = { ", sm->num_rows+1);
    for(i=0; i<sm->num_rows+1; ++i){
      fprintf(fp, "%u", sm->Ap[i]);
      if(i < sm->num_rows) fprintf(fp, ", ");
    }
    fprintf(fp, " };\n");

    fprintf(fp, "unsigned int _Aj[%u] = { ", sm->num_nonzeros);
    for(i=0; i<sm->num_nonzeros; ++i){
      fprintf(fp, "%u", sm->Aj[i]);
      if(i < sm->num_nonzeros-1) fprintf(fp, ", ");
    }
    fprintf(fp, " };\n");

    fprintf(fp, "float _Ax[%u] = { ", sm->num_nonzeros);
    for(i=0; i<sm->num_nonzeros; ++i){
      fprintf(fp, "%lf", sm->Ax[i]);
      if(i < sm->num_nonzeros-1) fprintf(fp, ", ");
    }
    fprintf(fp, "};\n");

    fprintf(fp, "float _v[%u] = { ", dim);
    for(i=0; i<dim; ++i){
      fprintf(fp, "%lf", vector[i]);
      if(i < dim-1) fprintf(fp, ", ");
    }
    fprintf(fp, "};\n");

    fclose(fp);
}
int main(int argc, char *argv[]){
    int opt, option_index=0;
    unsigned int dim=1024, density=5000;
    double normal_stdev=0.01;
    unsigned long seed = 10000;
    float *v;
    stopwatch sw;

    while ((opt = getopt_long(argc, argv, "s:d:n:", long_options, &option_index)) != -1){
        switch(opt){
        case 's':
            normal_stdev = atof(optarg);
            break;
        case 'd':
            density =  atoi(optarg);
            break;
        case 'n':
            dim  = atoi(optarg);
            break ;
        default:
            fprintf(stderr, "Usage: %s [-s stddev] [-d density] [-n dimension]", argv[0]);
            break;
        }
    }

    float *sum = calloc(dim, sizeof(float));
    float *result = calloc(dim, sizeof(float));

    csr_matrix sm =  rand_csr(dim, density, normal_stdev, &seed, stderr);
    create_vector_from_random(&v, dim);

    output_c_file(dim, density, normal_stdev, &sm, v);
    output_js_file(dim, density, normal_stdev, &sm, v);
}
