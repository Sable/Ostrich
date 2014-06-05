CCOMP = gcc -O3
EMCC = emcc -O2

CPPCOMP = g++ -O3
EMCPP = em++ -O2

OPENCL_DIR = /usr/lib64/OpenCL/vendors/intel/
OPENCL_INC = $(OPENCL_DIR)/include/
OPENCL_LIB = $(OPENCL_DIR)/lib/x86_64/ -lOpenCL

OPENCL_PLATFORM = 0
OPENCL_DEVICE   = 2
