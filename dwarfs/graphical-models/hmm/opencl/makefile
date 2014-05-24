include make.config

INC = -I$(OPENCL_INC) -I../common/ -I../../../common/
LIB = -L$(OPENCL_LIB) -lm
DEF = -DOPENCL_HEADER_CL_CL

#C compiler
CC = gcc 
GCC = gcc

CC_FLAGS = -O3

EXE = hmm  

$(EXE): main_bwa_hmm.c 
	$(CC) $(CC_FLAGS) -o $(EXE) main_bwa_hmm.c ../common/common.c ../common/opts/opts.c  ../common/common_args.c ../../../common/common_rand.c $(INC) $(LIB)  $(DEF) 


clean:
	rm -f $(EXE) *.o
