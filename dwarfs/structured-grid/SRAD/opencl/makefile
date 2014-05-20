include make.config

INC = -I$(OPENCL_INC) -I../../../common/
LIB = -L$(OPENCL_LIB) -Llibm

#C compiler
CC = g++
CC_FLAGS = -g -O3 -Wall

EXE = srad

$(EXE): main.c
	$(CC) $(CC_FLAGS) -o $(EXE) main.c util/timer/timer.c util/graphics/resize.c \
	util/graphics/graphics.c kernel/kernel_gpu_opencl_wrapper.c \
	util/opencl/opencl.c $(INC) $(LIB) -lOpenCL

clean:
	rm -f $(EXE)
