include make.config

INC = -I$(OPENCL_INC) -I../common/ -I../../../common/
LIB = -L$(OPENCL_LIB) -Llibm
DEF = -DOPENCL_HEADER_CL_CL

#C compiler
CC = g++ 
GCC = gcc

CC_FLAGS = -g

EXE = bfs  

$(EXE): bfs.cpp common.o
	$(CC) $(CC_FLAGS) -o $(EXE) bfs.cpp ../common/common.c ../../../common/common_rand.c *.o $(INC) $(LIB)  $(DEF) 

common.o: 
	$(GCC) $(CC_FLAGS) -c ../common/common_args.c ../common/opts/opts.c $(INC) $(LIB)  $(DEF) 


clean:
	rm -f $(EXE) *.o
