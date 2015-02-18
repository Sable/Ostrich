#ifndef COMMON_RAND_H
#define COMMON_RAND_H

#ifdef __cplusplus
extern "C"{
#endif
	void common_srand(unsigned int seed);
	int common_rand();
	double common_randJS();
#ifdef __cplusplus
}
#endif

#endif
