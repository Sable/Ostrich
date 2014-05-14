include make.config

INC = -I$(OPENCL_INC) -I../common/ -I../../../common/
LIB = -L$(OPENCL_LIB) -lm -lstdc++
DEF = -DOPENCL_HEADER_CL_CL

#C compiler
CC = gcc
CC_FLAGS = -O3 

EXE = crc 

$(EXE): crc_algo.c 
	$(CC) $(CC_FLAGS) -o $(EXE) crc_algo.c ../common/crc_formats.c ../common/opts/opts.c ../common/common.c  ../common/common_args.c  ../../../common/common_rand.c $(INC) $(LIB) $(DEF)

clean:
	rm -f $(EXE)
