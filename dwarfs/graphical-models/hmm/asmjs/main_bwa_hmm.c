#include <stdio.h>
#include <stdlib.h>
#include <ctype.h>
#include <unistd.h>
#include <math.h>
#include <sys/time.h>
#include <getopt.h>
#include<string.h>

// #include "../../include/rdtsc.h"
// #include "../../include/common_args.h"

#define T           1000        /* Number of static observations */
#define S           2           /* Number of static symbols */
#define N           60          /* Number of static states */
#define ITERATIONS  1           /* Number of iterations */
#define EXIT_ERROR 1

static int imax(int x, int y)
{
	return (x > y) ? x: y;
}

/* Subtracts time values to determine run time */
int timeval_subtract(struct timeval *result, struct timeval *t2, 
		struct timeval *t1)
{
	long int diff = (t2->tv_usec + 1000000 * t2->tv_sec) - 
		(t1->tv_usec + 1000000 * t1->tv_sec);
	result->tv_sec = diff / 1000000;
	result->tv_usec = diff % 1000000;

	return (diff<0);
}


/* Starts timer */
void tic(struct timeval *timer)
{
	gettimeofday(timer, NULL);
}

/* Stops timer and prints difference to the screen */
void toc(struct timeval *timer)
{
	struct timeval tv_end, tv_diff;

	gettimeofday(&tv_end, NULL);
	timeval_subtract(&tv_diff, &tv_end, timer);
	printf("time: %ld.%06ld seconds\n", tv_diff.tv_sec, tv_diff.tv_usec);
}

/* individual paramters of a Hidden Markov Model */
typedef struct {
	int nstates;            /**< number of states in the HMM */
	int nsymbols;           /**< number of possible symbols */
	float *a;               /**< A matrix - state transition probabilities */
	float *b;               /**< B matrix - symbol output probabilities */
	float *pi;              /**< Pi matrix - initial state probabilities */
} Hmm;


/* the observation sequence and length */
typedef struct {
	int length;             /**< the length of the observation sequence */
	int *data;              /**< the observation sequence */
} Obs;

/* Free the memory associated with the HMM and observation sequence */
void free_vars(Hmm *hmm, Obs *obs)
{
	if (hmm != NULL) {
		if (hmm->a != NULL) {
			free(hmm->a);
		}
		if (hmm->b != NULL) {
			free(hmm->b);
		}
		if (hmm->pi != NULL) {
			free(hmm->pi);
		}
		free(hmm);
	}
	if (obs != NULL) {
		if (obs->data != NULL) {
			free(obs->data);
		}
		free(obs);
	}
}

// /* Global variables for device */
int nstates;                        /* The number of states in the HMM */
int nsymbols;                       /* The number of possible symbols */
int *obs;                           /* The observation sequence */
int length;                         /* The length of the observation sequence */
float *scale;                       /* Scaling factor as determined by alpha */

float *alpha; 
float *beta;
float *ones_n; 
float *ones_s;
float *gamma_sum; 
float *xi_sum; 
float *c; 

/**
 * Calculates the dot product of two vectors. 
 * Both vectors must be atleast of length n 
 */
float dot_product(int n, float *x, int offsetx, float *y, int offsety){
  float result = 0.0f; 
  int i = 0; 
  if(x == NULL || y == NULL || n == 0) return result; 

  
  for(i = 0; i < n; ++i)
    result += x[i + offsetx]*y[i + offsety];
    
  return result;
}

// there is something fishy about this function  when I translated from opencl need to double check
void mat_vec_mul(char trans, int m, int n, float *a, int lda, float *x, int offsetx, float *y, int offsety){
	if((trans != 'n') && (trans != 't')){
		return;
	}

  int i,j, n_size, m_size;
  float sum;
  if(lda == m){
    n_size = n; 
    m_size = m; 
  } 
  else{ 
    n_size = m; 
    m_size = n;
  }
  if(trans=='n'){
    for(i=0; i<m_size; ++i){
      sum = 0.0f;
      for(j=0; j<n_size; ++j){
        sum  += a[i*n_size + j]*x[offsetx + j];
      }
      y[i + offsety] = sum;
    }
  }
  else{
    for(i=0; i<m_size; ++i){
      sum = 0.0f;
      for(j=0; j<n_size; ++j){
        sum += a[j*n_size + i]*x[offsetx + j];
      }
      y[i + offsety] = sum;
    }
  }
}

void init_ones_dev(float *ones, int nsymbols){
  int i; 
  for(i=0; i<nsymbols; ++i) ones[i] = 1.0f;
}

/*******************************************************************************
 * Supporting functions
 */
void init_alpha(float *b_d, float *pi_d, int nstates, float *alpha_d, float *ones_n_d, int obs_t){
  int i = 0; 
  for(i = 0; i < nstates; ++i){
    alpha_d[i] = pi_d[i]*b_d[(obs_t*nstates)+i];
    ones_n_d[i] = 1.0f; 
  }
}


void scale_alpha_values(int nstates, float* alpha_d,  int offset, float scale){
  int i =0; 
  for(i=0; i<nstates; ++i) alpha_d[offset + i] = alpha_d[offset + i]/scale;
}

void calc_alpha_dev(int nstates, float *alpha_d, int offset, float *b_d, int obs_t){
  int i = 0; 
  for(i=0; i<nstates; ++i){
		alpha_d[offset + i] = alpha_d[offset + i] * b_d[(obs_t * nstates) + i];
  }
}

void printIM(int *aa, int m, int n){
  int i=0;
  int j=0; 
  for(i=0; i<m;++i){
    for(j=0; j<n;++j){
      printf("%d,", aa[i*n+j]); 
    }
    printf("\n");
  }
}
void printM(float *aa, int m, int n){
  int i=0;
  int j=0; 
  for(i=0; i<m;++i){
    for(j=0; j<n;++j){
      printf("%lf,", aa[i*n+j]); 
    }
    printf("\n");
  }
}

/* Calculates the forward variables (alpha) for an HMM and obs. sequence */
float calc_alpha(float *a, float *b, float *pi){
	float log_lik;
  int t;
	int offset_cur;
	int offset_prev;

  // initialize alpha variables
  init_alpha(b, pi, nstates, alpha, ones_n, obs[0]);

	/* Sum alpha values to get scaling factor */
	scale[0] = dot_product(nstates, alpha, 0, ones_n, 0);

  // Scale the alpha values
  scale_alpha_values(nstates, alpha,0,scale[0]);

	/* Initilialize log likelihood */
	log_lik = log10(scale[0]);

	/* Calculate the rest of the alpha variables */
	for (t = 1; t < length; t++) {

		/* Calculate offsets */
		offset_prev = (t - 1) * nstates;
		offset_cur = t * nstates;

		/* Multiply transposed A matrix by alpha(t-1) */
		/* Note: the matrix is auto-transposed by cublas reading column-major */
		// mat_vec_mul( 'N', nstates, nstates, 1.0f, a_d, nstates, 
		//              alpha_d + offset_prev, 1, 0, alpha_d + offset_cur, 1 );
		mat_vec_mul( 'n', nstates, nstates, a, nstates, 
				alpha, offset_prev, alpha, offset_cur);

    calc_alpha_dev(nstates, alpha, offset_cur, b, *(obs + t)); 

		/* Sum alpha values to get scaling factor */
		scale[t] = dot_product(nstates, alpha, offset_cur, ones_n, 0);
   
    // scale alpha values  
    scale_alpha_values(nstates, alpha, offset_cur, scale[t]);

		log_lik += log10(scale[t]);
	}
	return log_lik;
}

void init_beta_dev(int nstates, float *beta_d, int offset, float scale){ 
  int i = 0; 
  for(i=0; i < nstates; ++i){
		beta_d[offset + i] = 1.0f / scale;
  }
}

void calc_beta_dev(float *beta_d, float *b_d, float scale_t, int nstates,
    int obs_t, int t){
  int i; 
  for(i=0; i<nstates; ++i){
		beta_d[(t * nstates) + i] = beta_d[((t + 1) * nstates) + i] *
      b_d[(obs_t * nstates) + i] / scale_t;
  }
}

/* Calculates the backward variables (beta) */
int calc_beta(float *a, float *b){

	/* Initialize beta variables */
	int offset  = ((length - 1) * nstates);
  int t;
  init_beta_dev(nstates, beta, offset, *(scale + length - 1));
	/* Calculate the rest of the beta variables */
	for (t = length - 2; t >= 0; t--) {
    calc_beta_dev(beta, b, scale[t], nstates, *(obs + t + 1),t);

		mat_vec_mul( 'n', nstates, nstates, a, nstates, 
				beta, t * nstates, beta, t * nstates);
	}
	return 0;
}

void calc_gamma_dev(float *gamma_sum_d, float *alpha_d, float *beta_d, 
    int nstates, int t){
  int i; 
  for(i=0; i< nstates; ++i){
		gamma_sum_d[i] += alpha_d[(t * nstates) + i] *
			beta_d[(t * nstates) + i];
  }
}
    
/* Calculates the gamma sum */
void calc_gamma_sum(){
	int size;
	int t;

  for(t=0; t<nstates; ++t) gamma_sum[t] = 0.0f;
	/* Find sum of gamma variables */
	for (t = 0; t < length; t++) {
    calc_gamma_dev(gamma_sum, alpha, beta, nstates, t); 
	}
}

void calc_xi_sum_dev(float *xi_sum_d, float *a_d, float *b_d, float *alpha_d, 
    float *beta_d, float sum_ab, int nstates, int obs_t, int t){
  int i,j; 
  for(i=0; i<nstates; ++i){
    for(j=0;j<nstates; ++j){
      xi_sum_d[(j * nstates) + i] += alpha_d[(t * nstates) + j] *
        a_d[(j * nstates) + i] *
        b_d[(obs_t * nstates) + i] *
        beta_d[((t+1) * nstates) + i] /
        sum_ab;
    }
  }
}

/* Calculates the sum of xi variables */
int calc_xi_sum(float *a, float *b){
	float sum_ab;
	int t;
  memset(xi_sum, 0, sizeof(float *)*nstates);

	/* Find the sum of xi variables */
	for (t = 0; t < length - 1; t++) {
		/* Calculate denominator */
		sum_ab = dot_product(nstates, alpha, t * nstates, 
				beta, t * nstates);
    calc_xi_sum_dev(xi_sum, a, b, alpha, beta, sum_ab, nstates,*(obs+t+1), t);
	}
	return 0;
}

void est_a_dev(float *a_d, float *alpha_d, float *beta_d, 
    float *xi_sum_d, float *gamma_sum_d, float sum_ab, int nstates, int length){

  int i,j;
  for(i=0; i<nstates; ++i){
    for(j=0; j<nstates; ++j){
      a_d[(j * nstates) + i] = xi_sum_d[(j * nstates) + i] /
        (gamma_sum_d[j] -
         alpha_d[(length * nstates) + j] *
         beta_d[(length * nstates) + j] /
         sum_ab);
    }
  }
}

void scale_a_dev(float *a_d, float *c_d, int nstates){
  int i,j;
  for(i=0; i<nstates; ++i){
    for(j=0; j<nstates; ++j){
      a_d[(j * nstates) + i] = a_d[(j * nstates) + i] / c_d[j];
    }
  }
}
/* Re-estimates the state transition probabilities (A) */
int estimate_a(float *a)
{
	float sum_ab;

	/* Calculate denominator */
	sum_ab = dot_product(nstates, alpha, (length - 1) * nstates, 
			beta, (length - 1) * nstates);
  est_a_dev(a, alpha, beta, xi_sum, gamma_sum, sum_ab, nstates, length); 


	/* Sum rows of A to get scaling values */
	// mat_vec_mul( 'T', nstates, nstates, 1.0f, a_d, nstates, 
	// ones_n_d, 1, 0, c_d, 1 );
	mat_vec_mul( 't', nstates, nstates, a, nstates, 
			ones_n, 0, c, 0);


	/* Normalize A matrix */
	// scale_a_dev<<<grid, threads>>>( a_d,
	// c_d,
	// nstates);
  scale_a_dev(a, c, nstates);

	return 0;
}

/* Accumulate B values */
void acc_b_dev(float *b_d, float *alpha_d, float *beta_d, float sum_ab, 
    int nstates, int nsymbols, int obs_t, int t){ 
  int i,j; 
  for(i=0; i<nstates; ++i){
    for(j=0; j<nsymbols; ++j){
      if(j==obs_t){
        b_d[(j * nstates) + i] += alpha_d[(t * nstates) + i] *
          beta_d[(t * nstates) + i] / sum_ab;
      }
    }
  }
}

/* Re-estimate B values */
void est_b_dev(float *b_d, float *gamma_sum_d, int nstates, int nsymbols){
  int i,j; 
  for(i=0; i<nstates; ++i){
    for(j=0; j<nsymbols; ++j){
      b_d[(j* nstates) + i] = b_d[(j * nstates) + i] /
        gamma_sum_d[i];
    }
  }
}

/* Normalize B matrix */
void scale_b_dev(float *b_d, float *c_d, int nstates, int nsymbols){
  int i,j; 
  for(i=0; i<nstates; ++i){
    for(j=0; j<nsymbols; ++j){
      if (fabs(b_d[(i * nsymbols) + j]) <0.000001)
      {
        b_d[(i * nsymbols) + j] = 1e-10;
      }
      else
      {
        b_d[(i * nsymbols) + j] = b_d[(i * nsymbols) + j] / c_d[i];
      }
      // if (fabs(b_d[(j * nstates) + i]) <0.000001)
      // {
      //   b_d[(j * nstates) + i] = 1e-10;
      //   printf("something hits here\n");
      // }
      // else
      // {
      //   b_d[(j * nstates) + i] = b_d[(j * nstates) + i] / c_d[i];
      // }
    }
  }
}

/* Re-estimates the output symbol probabilities (B) */
int estimate_b(float *b)
{
	float sum_ab;
	int t;
	int offset;

  for(t=0; t<nstates*nsymbols; ++t) b[t] = 0.0f;

	for (t = 0; t < length; t++) {

		/* Calculate denominator */
		sum_ab = dot_product(nstates, alpha, t * nstates, 
				beta, t * nstates);
    acc_b_dev(b, alpha, beta, sum_ab, nstates, nsymbols, *(obs + t+1), t);
	}

	/* Re-estimate B values */
  est_b_dev(b, gamma_sum, nstates, nsymbols); 

	/* Sum rows of B to get scaling values */
	// mat_vec_mul( 'N', nstates, nsymbols, 1.0f, b_d, nstates, 
	// ones_s_d, 1, 0, c_d, 1 );
  for(t=0; t<nstates; ++t) c[t] = 0.0f;
	mat_vec_mul( 'n', nstates, nsymbols, b, nstates, 
			ones_s, 0, c, 0);
	/* Normalize B matrix */
  scale_b_dev(b, c, nstates, nsymbols); 
	return 0;
}    
void est_pi_dev(float *pi_d, float *alpha_d, float *beta_d, float sum_ab, 
    int nstates){ 
  int i;
  for(i=0; i<nstates; ++i){ 
		pi_d[i] = alpha_d[i] * beta_d[i] / sum_ab;
  }
}
/* Re-estimates the initial state probabilities (Pi) */
int estimate_pi(float *pi)
{

	float sum_ab;
	/* Calculate denominator */
	sum_ab = dot_product(nstates, alpha, 0, beta, 0);

	/* Estimate Pi values */
  est_pi_dev(pi, alpha, beta, sum_ab,nstates);

	return 0;
}

// /*******************************************************************************
//  * BWA function
//  */

// /* Runs the Baum-Welch Algorithm on the supplied HMM and observation sequence */
float run_hmm_bwa(  Hmm *hmm, 
		Obs *in_obs, 
		int iterations, 
		float threshold)
{

	/* Host-side variables */
	float *a;
	float *b;
	float *pi;
	float new_log_lik;
	float old_log_lik = 0;
	int iter;

	/* Initialize HMM values */
	a = hmm->a;
	b = hmm->b;
	pi = hmm->pi;
	nsymbols = hmm->nsymbols;
	nstates = hmm->nstates;
	obs = in_obs->data;
	length = in_obs->length;

	/* Allocate host memory */
	scale = (float *) malloc(sizeof(float) * length);
	if (scale == 0) {
		fprintf (stderr, "ERROR: Host memory allocation error (scale)\n");
		return EXIT_ERROR;
	}

// 	/* Allocate device memory */
  alpha = malloc(sizeof(*alpha)*nstates*length); 
  beta = malloc(sizeof(*beta)*nstates*length);
  gamma_sum = malloc(sizeof(*gamma_sum)*nstates); 
  xi_sum = malloc(sizeof(*xi_sum)*nstates*nstates); 
  c = malloc(sizeof(*c)*nstates); 
  ones_n = malloc(sizeof(*ones_n)*nstates); 
  ones_s = malloc(sizeof(*ones_s)*nsymbols); 

  init_ones_dev(ones_s, nsymbols);

//   /**
//    * a_d => a 
//    * b_d => b 
//    * pi_d => pi 
//    */ 

	/* Run BWA for either max iterations or until threshold is reached */
	for (iter = 0; iter < iterations; iter++) {
		new_log_lik = calc_alpha(a, b, pi);
		if (new_log_lik == EXIT_ERROR) {
			return EXIT_ERROR;
		}

		if (calc_beta(a, b) == EXIT_ERROR) {
			return EXIT_ERROR;
		}

		calc_gamma_sum();

		if (calc_xi_sum(a, b) == EXIT_ERROR) {
			return EXIT_ERROR;
		}

		if (estimate_a(a) == EXIT_ERROR) {
			return EXIT_ERROR;
		}

		if (estimate_b(b) == EXIT_ERROR) {
			return EXIT_ERROR;
		}

		if (estimate_pi(pi) == EXIT_ERROR) {
			return EXIT_ERROR;
		}

		/* check log_lik vs. threshold */
		if (threshold > 0 && iter > 0) {
			if (fabs(pow(10,new_log_lik) - pow(10,old_log_lik)) < threshold) {
				break;
			}
	  }

		old_log_lik = new_log_lik;   
	}
	return new_log_lik;
}

static struct option size_opts[] = 
{
	/* name, has_tag, flag, val*/
	{"state number", 1, NULL, 'n'},
	{"symbol number", 1, NULL, 's'},
	{"observation number", 1, NULL, 't'},
	{"varying mode", 1, NULL, 'v'},
	{0, 0, 0, 0}	
};

/* Time the forward algorithm and vary the number of states */ 
int main(int argc, char *argv[]) 
{
	/* Initialize variables */
	Hmm *hmm;                /* Initial HMM */
	Obs *obs;                /* Observation sequence */
	float *a;
	float *b;
	float *pi;
	int *obs_seq;
	float log_lik;           /* Output likelihood of FO */
	int mul;
	int m;
	int s = S, t = T;
	int n = N;
	int i;
	struct timeval timer;

	printf("Starting bwa_hmm\n");

	int opt, opt_index = 0;
	char v_model;
	while((opt = getopt_long(argc, argv, "::n:s:t:v:", size_opts, &opt_index)) != -1)
	{
		//printf("here");
		switch(opt)
		{
			case 'v':
				v_model = optarg[0];
				break;
			case 'n':
				n = atoi(optarg);
				break;
			case 's':
				s = atoi(optarg);
				break;
			case 't':
				t = atoi(optarg);
				break;
			default:
				fprintf(stderr, "Usage %s [-n state number | -s symbol number | -t observation number] [-v varying model]\n", argv[0]);
				exit(EXIT_FAILURE);
		}	
	} 

	/* Initialize HMM and observation sequence */
	hmm = (Hmm *)malloc(sizeof(Hmm));
	obs = (Obs *)malloc(sizeof(Obs));

	if(v_model == 'n')
	{
		/* Create observation sequence */
		obs->length = T;
		obs_seq = (int *)malloc(sizeof(int) * T);
		for (i = 0; i < T; i++) {
			obs_seq[i] = 0;
		}
		obs->data = obs_seq;

		// printf("Vary states with S = %i, T = %i\n", S, T);
		// printf("States\tTime (s)\tLog_likelihood\n");

		/* Run timed tests from 1*mul to 9*mul states */
		if (n >= 8000) {
			return 0;
		}
		// n = 7000;           
		/* Assign HMM parameters */
		hmm->nstates = n;
		hmm->nsymbols = S;
		a = (float *)malloc(sizeof(float) * n * n);
		for (i = 0; i < (n * n); i++) {
			a[i] = 1.0f/(float)n;
		}
		hmm->a = a;
		b = (float *)malloc(sizeof(float) * n * S);
		for (i = 0; i < (n * S); i++) {
			b[i] = 1.0f/(float)S;
		}
		hmm->b = b;
		pi = (float *)malloc(sizeof(float) * n);
		for (i = 0; i < n; i++) {
			pi[i] = 1.0f/(float)n;
		}
		hmm->pi = pi;
    

		/* Run the BWA on the observation sequence */

		tic(&timer);
		log_lik = run_hmm_bwa(hmm, obs, ITERATIONS, 0);
		toc(&timer);
		printf("Observations\tLog_likelihood\n");
		printf("%i\t", n);
		printf("%f\n", log_lik);

		/* Free memory */
		free(a);
		free(b);
		free(pi);

		hmm->a = NULL;
		hmm->b = NULL;
		hmm->pi = NULL;
		free_vars(hmm, obs);

		// printf("\n");
	} else if(v_model == 's')
	{	
		/* Create observation sequence */
		obs->length = T;
		obs_seq = (int *)malloc(sizeof(int) * T);
		for (i = 0; i < T; i++) {
			obs_seq[i] = 0;
		}
		obs->data = obs_seq;

		// printf("Vary symbols with N = %i, T = %i\n", N, T);
		// printf("Symbols\tTime (s)\tLog_likelihood\n");

		if (s >= 8000) {
			return 0;
		}

		/* Assign HMM parameters */
		hmm->nstates = N;
		hmm->nsymbols = s;
		a = (float *)malloc(sizeof(float) * N * N);
		for (i = 0; i < (N * N); i++) {
			a[i] = 1.0f/(float)N;
		}
		hmm->a = a;
		b = (float *)malloc(sizeof(float) * N * s);
		for (i = 0; i < (N * s); i++) {
			b[i] = 1.0f/(float)s;
		}
		hmm->b = b;
		pi = (float *)malloc(sizeof(float) * N);
		for (i = 0; i < N; i++) {
			pi[i] = 1.0f/(float)N;
		}
		hmm->pi = pi;

		/* Run the BWA on the observation sequence */

		tic(&timer);
		log_lik = run_hmm_bwa(hmm, obs, ITERATIONS, 0);
		toc(&timer);
		printf("Observations\tTime (s)\tLog_likelihood\n");
		printf("%i\t", s);
		printf("%f\n", log_lik);

		/* Free memory */
		free(a);
		free(b);
		free(pi);

		hmm->a = NULL;
		hmm->b = NULL;
		hmm->pi = NULL;
		free_vars(hmm, obs);

		// printf("\n");

	} else if(v_model == 't')
	{

		if (t >= 10000) {
			return 0;
		}
		/* Create HMM */
		hmm->nstates = N;
		hmm->nsymbols = S;
		a = (float *)malloc(sizeof(float) * N * N);
		for (i = 0; i < (N * N); i++) {
			a[i] = 1.0f/(float)N;
		}
		hmm->a = a;
		b = (float *)malloc(sizeof(float) * N * S);
		for (i = 0; i < (N * S); i++) {
			b[i] = 1.0f/(float)S;
		}
		hmm->b = b;
		pi = (float *)malloc(sizeof(float) * N);
		for (i = 0; i < N; i++) {
			pi[i] = 1.0f/(float)N;
		}
		hmm->pi = pi;

		// printf("Vary observations with N = %i, S = %i\n", N, S);
		// printf("Observations\tTime (s)\tLog_likelihood\n");

		/* Create observation sequence */
		obs->length = t;
		obs_seq = (int *)malloc(sizeof(int) * t);
		for (i = 0; i < t; i++) {
			obs_seq[i] = 0;
		}
		obs->data = obs_seq;

		/* Run the BWA on the observation sequence */

		tic(&timer);
		log_lik = run_hmm_bwa(hmm, obs, ITERATIONS, 0);
		toc(&timer);
		printf("Observations\tTime (s)\tLog_likelihood\n");
		printf("%i\t", t);
		printf("%f\n", log_lik);

		/* Free memory */
		free(obs_seq);

		obs->data = NULL;
		free_vars(hmm, obs);

		// printf("\n");
	}
	return 0;
}
