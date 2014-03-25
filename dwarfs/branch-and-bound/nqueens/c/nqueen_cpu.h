// N-queen solver for OpenCL
// Ping-Che Chen


#ifndef NQUEEN_CPU_H
#define NQUEEN_CPU_H

typedef enum {false, true} bool;
long long nqueen_cpu(int size, long long* unique_solutions);

#endif
