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

 /*
 ** CRC Kernel code optimized for Altera FPGAs
 **
 ** This code computes a 32-bit ethernet CRC using the "Slice-by-8" Algorithm published by Intel
 */


// /////FPGA-optimized Kernel Code///////////////////////
////////altered from the version posted online by Stephan Brumme////////
// Copyright (c) 2013 Stephan Brumme. All rights reserved.
// see http://create.stephan-brumme.com/disclaimer.html

#include "../combinational-logic/crc/inc/eth_crc32_lut.h"

#define BITS_PER_GLOBAL_LD 512
#define BYTES_PER_GLOBAL_LD 64
#define INTS_PER_GLOBAL_LD 16

__kernel void crc32_slice8(__global const uint* restrict data, uint length_bytes, const uint length_ints ,__global uint* restrict res)
{
	__private uint crc;
	__private uchar* currentChar;
	__private uint one,two;
	__private size_t i,j,gid;

	__private uint scratch_pad[INTS_PER_GLOBAL_LD];
	crc = 0xFFFFFFFF;
	gid = get_global_id(0);
	i = gid * length_ints;

#pragma unroll 4
	while (length_bytes >= BYTES_PER_GLOBAL_LD) //load 512 bits at a time into private memory
	{
#pragma unroll INTS_PER_GLOBAL_LD
		for(j=0; j<INTS_PER_GLOBAL_LD; j++)
			scratch_pad[j] = data[i++];
#pragma unroll 8
		for(j=0; j<INTS_PER_GLOBAL_LD; j+=2) // process data in 8 chunks of 8 bytes
		{
			one = scratch_pad[j] ^ crc;
			two = scratch_pad[j+1];
			crc = crc32Lookup[7][ one      & 0xFF] ^
				crc32Lookup[6][(one>> 8) & 0xFF] ^
				crc32Lookup[5][(one>>16) & 0xFF] ^
				crc32Lookup[4][ one>>24        ] ^
				crc32Lookup[3][ two      & 0xFF] ^
				crc32Lookup[2][(two>> 8) & 0xFF] ^
				crc32Lookup[1][(two>>16) & 0xFF] ^
				crc32Lookup[0][ two>>24        ];
		}

		length_bytes -= BYTES_PER_GLOBAL_LD;
	}

	while(length_bytes) // remaining 1 to 63 bytes
	{
		one = data[i++];
		currentChar = (unsigned char*) &one;
		j=0;
		while (length_bytes && j < 4)
		{
			length_bytes = length_bytes - 1;
			crc = (crc >> 8) ^ crc32Lookup[0][(crc & 0xFF) ^ currentChar[j]];
			j = j + 1;
		}
	}

	res[gid] = ~crc;
}
