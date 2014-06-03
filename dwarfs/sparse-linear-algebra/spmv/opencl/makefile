include make.config

INC = -I$(OPENCL_INC) -I../../../common/ -I../common/
LIB = -L$(OPENCL_LIB) -Llibm

#C compiler
CC = g++
CC_FLAGS = -g -O3 -Wall

EXE = spmv

$(EXE): csr_spmv.c
	$(CC) $(CC_FLAGS) -o $(EXE) csr_spmv.c \
			 ../common/common.c \
			 ../common/sparse_formats.c \
			 ../common/common_args_serial.c \
			 ../common/ziggurat.c \
			 ../../../common/common_rand.c $(INC) $(LIB) -lOpenCL -DSERIAL

clean:
	rm -f $(EXE)
