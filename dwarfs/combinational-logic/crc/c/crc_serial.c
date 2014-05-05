#include <stdio.h>
#include <unistd.h>
#include <stdint.h>
#include <getopt.h>
#include "common.h" 
#include "crc_formats.h"
#include "eth_crc32_lut.h"


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

void usage()
{
	printf("crc [-s <page_size>] [-n <num_pages>] [-r <num_execs>] \n");
	printf("Common arguments:\n");
	printf("Program-specific arguments:\n");
	printf("\t-h | 'Print this help message'\n");
	printf("\t-n: Random Generation: Create <num_pages> pages - Default is 1\n");
	printf("\t-s: Random Generation: Set # of bytes with each page to <page_size> - Default is 1024\n");
	printf("\t-r: Specify the number of times the benchmark should be run\n");
	exit(0);
}

int main(int argc, char** argv){
	unsigned int *h_num;
	unsigned int i,j,num_pages=1,num_execs=1;
	int c;
    unsigned int page_size=100, num_words;
    unsigned int* crcs;
    unsigned int final_crc, expected_crc;
    double cumulative_time=0;
    stopwatch sw;

	while((c = getopt(argc, argv, "h::s::n::r::")) != -1)
	{
		switch(c)
		{
			case 'h':
				usage();
				exit(0);
				break;
            case 's':
				if(optarg != NULL) {
					page_size = atoi(optarg);
				} else {
					page_size = atoi(argv[optind]);
                }
				break;
			case 'n':
				if(optarg != NULL) {
					num_pages = atoi(optarg);
                } else {
					num_pages = atoi(argv[optind]);
                }
				break;
			case 'r':
				if(optarg != NULL) {
					num_execs = atoi(optarg);
                } else {
					num_execs = atoi(argv[optind]);
                }
				break;
			default:
				fprintf(stderr, "Invalid argument: '%s'\n\n",optarg);
				usage();
		}	
	}

    if ((page_size % 8) != 0) {
        printf(
            "Unsupported page size of '%u', please choose a page size that is a multiple of 8\n",
            page_size
        );
        exit(1);
    }

	num_words = page_size / 4;
    h_num = rand_crc(num_pages, page_size); 
    crcs = malloc(sizeof(*crcs)*num_pages);

    expected_crc = 2231263667;
    stopwatch_start(&sw);
    for (j=0; j<num_execs; j++) 
    {
        for(i=0; i<num_pages; i++)
        {
            crcs[i] = crc32_8bytes(&h_num[i*num_words], page_size);
        }

        // Self-checking crc results
        final_crc = crc32_8bytes(crcs, sizeof(*crcs)*num_pages);     
        if (final_crc != expected_crc)
        {
            printf("Invalid crc check, received '%u' while expecting '%u'\n", final_crc, expected_crc);
            return 1;
        } 
    }
    stopwatch_stop(&sw);
    cumulative_time += get_interval_by_sec(&sw);


    printf("CPU Slice-by-8 CRC Time: %lf seconds\n", cumulative_time);

    free(h_num);
    return 0;
}
