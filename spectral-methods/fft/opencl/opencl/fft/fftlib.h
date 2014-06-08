/*
 * Copyright July 29, 2011 by Virginia Polytechnic Institute and State University
 * All rights reserved.
 *
 * Virginia Polytechnic Institute and State University (Virginia Tech) owns the
 * OpenCL and the 13 Dwarfs software and its associated documentation (Software).
 * You should carefully read the following terms and conditions before using this
 * software.  Your use of this Software indicates your acceptance of this license
 * agreement and all terms and conditions.
 *
 * You are hereby licensed to use the Software for Non-Commercial Purpose only.
 * Non-Commercial Purpose means the use of the Software solely for research.
 * Non-Commercial Purpose excludes, without limitation, any use of the Software, as
 * part of, or in any way in connection with a product or service which is sold,
 * offered for sale, licensed, leased, loaned, or rented.  Permission to use, copy,
 * modify, and distribute this compilation for Non-Commercial Purpose is hereby
 * granted without fee, subject to the following terms of this license.
 */



#ifndef FFTLIB_H
#define FFTLIB_H

#include "OptionParser.h"

extern cl_device_id fftDev;
extern cl_context fftCtx;
extern cl_command_queue fftQueue;
extern Event fftEvent, ifftEvent, chkEvent;

struct cplxflt {
    float x;
    float y;
};

struct cplxdbl {
    double x;
    double y;
};
void createKernelWithSource();
void init(OptionParser& op, bool dp, int fftn);
void init2(OptionParser& op, bool dp, int fftn1, int fftn2);
void forward(void* work, void* temp, int n_ffts, int fftn);
void forward2(void* work, void* temp,  int n_ffts, int fftn1, int fftn2);
void inverse(void* work, int n_ffts);
int check(void* work, void* check, int half_n_ffts, int half_n_cmplx);
void allocDeviceBuffer(void** bufferp, unsigned long bytes);
void freeDeviceBuffer(void* buffer);
void allocHostBuffer(void** bufp, unsigned long bytes);
void freeHostBuffer(void* buf);
void copyToDevice(void* to_device, void* from_host, unsigned long bytes);
void copyFromDevice(void* to_host, void* from_device, unsigned long bytes);
void getLocalDimension(size_t &localsz, size_t &globalsz, int fftn1, int fftn2);
void getGlobalDimension(size_t  &localsz, size_t &globalsz, int BS, int n_g);
void getLocalRadix(unsigned int n, unsigned int *radixArray, unsigned int *numRadices, unsigned int maxRadix);
void getGlobalRadix(int n, int *radix, int *R1, int *R2, int *numRadices);
void setGlobalOption(string &arg, int fftn1, int fftn2);
#endif
