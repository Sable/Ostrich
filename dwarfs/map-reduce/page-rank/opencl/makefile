include make.config

INC = -I$(OPENCL_INC) -I../common/ -I../../../common/
LIB = -L$(OPENCL_LIB) -lm 
DEF = -DOPENCL_HEADER_CL_CL

#C compiler
CC = gcc
CC_FLAGS = -g  

EXE = pagerank 

$(EXE): pagerank.c 
	$(CC) $(CC_FLAGS) -o $(EXE) pagerank.c ../common/opts/opts.c ../common/common.c  ../common/common_args.c ../../../common/common_rand.c $(INC) $(LIB) $(DEF)

clean:
	rm -f $(EXE)
