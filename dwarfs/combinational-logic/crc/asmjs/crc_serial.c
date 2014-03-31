#include <stdio.h>
#include <unistd.h>
#include <stdint.h>
#include "common.h" 
#include "crc_formats.h"
#include "eth_crc32_lut.h"

const uint32_t Polynomial = 0xEDB88320;
// /////Bitwise version of CRC///////////////////////
////////altered from the fastest version of crc32_bitwise() by Stephan Brumme////////
// Copyright (c) 2013 Stephan Brumme. All rights reserved.
// see http://create.stephan-brumme.com/disclaimer.html
//
unsigned int serialCRC(unsigned int* h_num, size_t size){
	unsigned int j;
	uint32_t crc = ~0x00;
	unsigned char* current = (unsigned char*) h_num;
	while (size--)
	{
		crc ^= *current++;
		for (j = 0; j < 8; j++)
			crc = (crc >> 1) ^ (-1*((int)(crc & 0x01)) & Polynomial);
	}
	return ~crc;
}

// /////Slice-by-8 version of CRC///////////////////////
////////altered from the version posted online by Stephan Brumme////////
// Copyright (c) 2013 Stephan Brumme. All rights reserved.
// see http://create.stephan-brumme.com/disclaimer.html
//
uint32_t crc32_8bytes(const void* data, size_t length){
	uint32_t* current = (uint32_t*) data;
	uint32_t crc = 0xFFFFFFFF;
	while (length >= 8) // process eight bytes at once
	{
		uint32_t one = *current++ ^ crc;
		uint32_t two = *current++;
		crc = crc32Lookup[7][ one      & 0xFF] ^
			crc32Lookup[6][(one>> 8) & 0xFF] ^
			crc32Lookup[5][(one>>16) & 0xFF] ^
			crc32Lookup[4][ one>>24        ] ^
			crc32Lookup[3][ two      & 0xFF] ^
			crc32Lookup[2][(two>> 8) & 0xFF] ^
			crc32Lookup[1][(two>>16) & 0xFF] ^
			crc32Lookup[0][ two>>24        ];
		length -= 8;
	}

	unsigned char* currentChar = (unsigned char*) current;
	while (length--) { // remaining 1 to 7 bytes
		crc = (crc >> 8) ^ crc32Lookup[0][(crc & 0xFF) ^ *currentChar++];
	}
	return ~crc;
}
/*
int main(){
  int num_pages = 100; 
  int page_size = 1000; 
  unsigned int num_words = page_size/4;
  unsigned int *h_num = rand_crc2(num_pages, page_size, 1000000); 
  uint32_t cpu_remainder; 
  stopwatch sw; 
  int i; 

  stopwatch_start(&sw);
  for(i=0; i<num_pages; i++)
  {
    cpu_remainder = crc32_8bytes(&h_num[i*num_words], page_size);
    //printf("CPU - Slice-by-8 Computation: '%X'\n", cpu_remainder);
  }
  stopwatch_stop(&sw);
  printf("CPU Slice-by-8 CRC Time: %lf\n", get_interval_by_sec(&sw));
}
*/

void usage()
{
	printf("crc -i <input_file> [hvp] [-r <num_execs>] [-w <wg_size-1>][-w <wg_size-2>]...[-w <wg_size-m>] [-k <kernel_file-1>][-k <kernel_file-2>]...[-k <kernel_file-n>]\n");
	printf("Common arguments:\n");
	printf("Program-specific arguments:\n");
	printf("\t-h | 'Print this help message'\n");
	printf("\t-i | 'Input file name' [string]\n");
	printf("\t-n: Random Generation: Create <num_pages> pages - Default is 1\n");
	printf("\t-s: Random Generation: Set # of bytes with each page to <page_size> - Default is 1024\n");
	exit(0);
}

int main(int argc, char** argv){
	FILE* fp=NULL;
	void* tmp;
	unsigned int *h_num,cpu_remainder;
	unsigned int run_serial=0,seed=time(NULL),h,ii,i,j,k,l,m,num_pages=1,num_execs=1,num_kernels=0;
	char* file=NULL,*optptr;
	int c;
  unsigned int page_size=100, num_words;
  unsigned int* crcs;
  stopwatch sw;

	while((c = getopt (argc, argv, "i::h::sn::")) != -1)
	{
		switch(c)
		{
			case 'h':
				usage();
				exit(0);
				break;
			case 'i':
				if(optarg != NULL)
					file = optarg;
				else
					file = argv[optind];
				printf("Reading Input from '%s'\n",file);
				break;
      case 's':
				if(optarg != NULL)
					page_size = atoi(optarg);
				else
					page_size = atoi(argv[optind]);
				break;
			case 'n':
				if(optarg != NULL)
					num_pages = atoi(optarg);
				else
					num_pages = atoi(argv[optind]);
				break;
			default:
				fprintf(stderr, "Invalid argument: '%s'\n\n",optarg);
				usage();
		}	
	}

	num_words = page_size / 4;
  if(file != NULL)	h_num = read_crc(&num_pages,&page_size,file);
  else h_num = rand_crc2(num_pages, page_size, 10000); 

  crcs = malloc(sizeof(*crcs)*num_pages);
  stopwatch_start(&sw);
  for(i=0; i<num_pages; i++)
  {
    crcs[i] = crc32_8bytes(&h_num[i*num_words], page_size);
    //crcs[i] = cpu_remainder;
//    printf("The code for this page is %d\n", cpu_remainder); 
  }

  stopwatch_stop(&sw);
 
  for(i=0; i<num_pages; i++)
  {
    printf("The code for this page is %d\n", crcs[i]); 
  }
  printf("CPU Slice-by-8 CRC Time: %lf seconds\n", get_interval_by_sec(&sw));

	free(h_num);
	return 0;
}
