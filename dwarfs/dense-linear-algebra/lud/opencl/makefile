include make.config

INC = -I$(OPENCL_INC) -I../common/ -I../../../common/
LIB = -L$(OPENCL_LIB) -lm

#C compiler
CC = gcc
CC_FLAGS = -g -O3 -Wall

EXE = lud

$(EXE): lud.cpp
	$(CC) $(CC_FLAGS) -o $(EXE) lud.cpp ../common/common.c ../../../common/common_rand.c $(INC) $(LIB) -lOpenCL 

clean:
	rm -f $(EXE)
