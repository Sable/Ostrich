include ../../../common/make.config

INC = -I$(OPENCL_INC) -I../common -I/home/sable/fkhan24/bin/intel_opencl_sdk_xe/opt/intel/opencl-1.2-3.2.1.16712/

LIB = -L$(OPENCL_LIB)

#C compiler
CC = g++
CC_FLAGS = -g -O3 -Wall

EXE = lud

$(EXE): lud.cpp
	$(CC) $(CC_FLAGS) -o $(EXE) lud.cpp ../common/common.c $(INC) $(LIB) -lOpenCL

clean:
	rm -f $(EXE)
