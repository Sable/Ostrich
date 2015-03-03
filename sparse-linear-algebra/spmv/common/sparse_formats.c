#include "sparse_formats.h"
#include "../../../common/common_rand.h"

int unsigned_int_comparator(const void* v1, const void* v2) {
    const unsigned int int1 = *((unsigned int*) v1);
    const unsigned int int2 = *((unsigned int*) v2);

    if(int1 < int2)
        return -1;
    else if(int1 > int2)
        return +1;
    else
        return 0;
}

unsigned long gen_rand(const long LB, const long HB) {
    int range = HB - LB + 1;
    check((HB >= 0 && LB >= 0 && range > 0),"sparse_formats.gen_rand() - Invalid Bound(s). Exiting...");
    return (common_rand() % range) + LB;
}

csr_matrix rand_csr(const unsigned int N,const unsigned int density, const double normal_stddev,unsigned long* seed,FILE* log)
{
    unsigned int i,j,nnz_ith_row,nnz,update_interval,rand_col;
    double nnz_ith_row_double,nz_error,nz_per_row_doubled,high_bound;
    int kn[128];
    float fn[128],wn[128];
    char* used_cols;
    csr_matrix csr;

    csr.num_rows = N;
    csr.num_cols = N;
    csr.density_perc = (((double)(density))/10000.0);
    csr.nz_per_row = (((double)N)*((double)density))/1000000.0;
    csr.num_nonzeros = round(csr.nz_per_row*N);
    csr.stddev = normal_stddev * csr.nz_per_row; //scale normalized standard deviation by average NZ/row

    fprintf(log,"Average NZ/Row: %-8.3f\n",csr.nz_per_row);
    fprintf(log,"Standard Deviation: %-8.3f\n",csr.stddev);
    fprintf(log,"Target Density: %u ppm = %g%%\n",density,csr.density_perc);
    fprintf(log,"Approximate NUM_nonzeros: %d\n",csr.num_nonzeros);

    csr.Ap = (unsigned int *) int_new_array(csr.num_rows+1,"rand_csr() - Heap Overflow! Cannot Allocate Space for csr.Ap");
    csr.Aj = (unsigned int *) int_new_array(csr.num_nonzeros,"rand_csr() - Heap Overflow! Cannot Allocate Space for csr.Aj");

    csr.Ap[0] = 0;
    nnz = 0;
    nz_per_row_doubled = 2*csr.nz_per_row; //limit nnz_ith_row to double the average because negative values are rounded up to 0. This
    high_bound = MINIMUM(csr.num_cols,nz_per_row_doubled); //limitation ensures the distribution will be symmetric about the mean, albeit not truly normal.
    used_cols = (char *) malloc(csr.num_cols*sizeof(char));
    check(used_cols != NULL,"rand_csr() - Heap Overflow! Cannot allocate space for used_cols");

    r4_nor_setup(kn,fn,wn);
    srand(*seed);

    update_interval = round(csr.num_rows / 10.0);
    if(!update_interval) update_interval = csr.num_rows;

    for(i=0; i<csr.num_rows; i++)
    {
        if(i % update_interval == 0) fprintf(log,"\t%d of %d (%5.1f%%) Rows Generated. Continuing...\n",i,csr.num_rows,((double)(i))/csr.num_rows*100);

        nnz_ith_row_double = r4_nor(seed,kn,fn,wn); //random, normally-distributed value for # of nz elements in ith row, NORMALIZED
        nnz_ith_row_double *= csr.stddev; //scale by standard deviation
        nnz_ith_row_double += csr.nz_per_row; //add average nz/row
        if(nnz_ith_row_double < 0)
            nnz_ith_row = 0;
        else if(nnz_ith_row_double > high_bound)
            nnz_ith_row = high_bound;
        else
            nnz_ith_row = (unsigned int) round(nnz_ith_row_double);

        csr.Ap[i+1] = csr.Ap[i] + nnz_ith_row;
        if(csr.Ap[i+1] > csr.num_nonzeros)
            csr.Aj = (unsigned int *) realloc(csr.Aj,sizeof(unsigned int)*csr.Ap[i+1]);

        for(j=0; j<csr.num_cols; j++)
            used_cols[j] = 0;

        for(j=0; j<nnz_ith_row; j++)
        {
            rand_col = abs(gen_rand(0,csr.num_cols - 1));
            if(used_cols[rand_col]) {
                j--;
            }
            else {
                csr.Aj[csr.Ap[i]+j] = rand_col;
                used_cols[rand_col] = 1;
            }
        }
        qsort((&(csr.Aj[csr.Ap[i]])),nnz_ith_row,sizeof(unsigned int),unsigned_int_comparator);
    }

    nz_error = ((double)abs((signed int)(csr.num_nonzeros - csr.Ap[csr.num_rows]))) / ((double)csr.num_nonzeros);
    if(nz_error >= .05)
        fprintf(stderr,"WARNING: Actual NNZ differs from Theoretical NNZ by %5.2f%%!\n",nz_error*100);
    csr.num_nonzeros = csr.Ap[csr.num_rows];
    fprintf(log,"Actual NUM_nonzeros: %d\n",csr.num_nonzeros);
    csr.density_perc = (((double)csr.num_nonzeros)*100.0)/((double)csr.num_cols)/((double)csr.num_rows);
    csr.density_ppm = (unsigned int)round(csr.density_perc * 10000.0);
    fprintf(log,"Actual Density: %u ppm = %g%%\n",csr.density_ppm,csr.density_perc);

    free(used_cols);
    csr.Ax = (float *) float_new_array(csr.num_nonzeros,"rand_csr() - Heap Overflow! Cannot Allocate Space for csr.Ax");
    for(i=0; i<csr.num_nonzeros; i++)
    {
        csr.Ax[i] = 1.0 - 2.0 * common_randJS();
        while(csr.Ax[i] == 0.0)
            csr.Ax[i] = 1.0 - 2.0 * common_randJS();
    }

    return csr;
}
