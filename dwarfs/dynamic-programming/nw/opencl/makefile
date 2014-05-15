include make.config

INC = -I$(OPENCL_INC) -I../common/ -I../../../common/
LIB = -L$(OPENCL_LIB) -lm
DEF = -DOPENCL_HEADER_CL_CL

#C compiler
CC = gcc
CC_FLAGS = -g -O3 -Wall

EXE = needle 

$(EXE): needle.c 
	$(CC) $(CC_FLAGS) -o $(EXE) needle.c ../common/common.c ../common/common_args.c ../../../common/common_rand.c ../common/opts/opts.c  $(INC) $(LIB) $(DEF) 

clean:
	rm -f $(EXE)
