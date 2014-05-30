include make.config

INC = -I$(OPENCL_INC) -I../common/ -I../../../common/
LIB = -L$(OPENCL_LIB) -Llibm -lstdc++
DEF = -DOPENCL_HEADER_CL_CL

#C compiler
CC = gcc
CC_FLAGS = -g

EXE = nqueens 

$(EXE): main.cpp
	$(CC) $(CC_FLAGS) -o $(EXE) nqueen_cpu.cpp main.cpp nqueen_cl.cpp ../common/opts/opts.c ../common/common.c  ../common/common_args.c  $(INC) $(LIB) $(DEF)

clean:
	rm -f $(EXE)
