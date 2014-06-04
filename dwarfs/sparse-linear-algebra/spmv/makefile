SHELL := /bin/bash

include ../../common/options.mk

EMOPTIONS = -s TOTAL_MEMORY=2000000000

DIM = 100000
DENSITY = 20000
STDDEV = 0.01
USE_GENERATED =true
ifeq ($(USE_GENERATED),true)
	GEN = -g
endif
ASMJS_RUN_ARGUMENT = "'-n', $(DIM), '-s', $(STDDEV), '-d', $(DENSITY), $(GEN))"
C_RUN_ARGUMENT = "-n $(DIM) -s $(STDDEV) -d $(DENSITY) $(GEN)"
JS_RUN_ARGUMENT = "spmvRun($(DIM), $(DENSITY), $(STDDEV), $(USE_GENERATED))"
WEBCL_CALL = "spmvRun("$(OPENCL_PLATFORM)", "$(OPENCL_DEVICE)", "$(DIM)", "$(DENSITY)", "$(STDDEV)")"
FILENAME = "spmv"
PREAMBLE = "<script src=\"data.js\"><\/script>"

build: build/c/run.sh build/asmjs/run.html build/js/run.html build/opencl/run.sh build/webcl/run.html

build/c:
	mkdir -p build/c

# link objects (binaries) together
build/c/spmv:	build/c \
            c/csr_spmv.c \
			common/common.c \
			common/common_args_serial.c \
			common/sparse_formats.c \
			common/ziggurat.c
	$(CCOMP) c/csr_spmv.c \
			 common/common.c \
			 common/sparse_formats.c \
			 common/common_args_serial.c \
			 common/ziggurat.c \
			 ../../common/common_rand.c \
			 -Icommon \
			 -I../../common \
			 -Idata \
			 -DSERIAL \
			 -std=c99 \
			 -lm -o build/c/spmv

build/c/run.sh: build/c/spmv build/c
	echo 'build/c/spmv '$(C_RUN_ARGUMENT) > build/c/run.sh && chmod +x build/c/run.sh

build/asmjs:
	mkdir -p build/asmjs

build/asmjs/spmv.js: build/asmjs \
            c/csr_spmv.c \
			common/common.c \
			common/common_args_serial.c \
			common/sparse_formats.c \
			common/ziggurat.c
	$(EMCC) c/csr_spmv.c \
			common/common.c \
			common/sparse_formats.c \
			common/common_args_serial.c \
			common/ziggurat.c \
			../../common/common_rand.c \
			-Icommon \
			-I../../common \
			-DSERIAL \
			-std=c99 \
			$(EMOPTIONS) -lm -o build/asmjs/spmv.js

build/asmjs/run.html: build/asmjs \
            build/asmjs/spmv.js
	cat ../../utils/asmjs/run_template.html > build/asmjs/run.html
	sed -i.bak s/FILENAME/$(FILENAME)/g build/asmjs/run.html
	sed -i.bak s/RUN_ARGUMENT/$(ASMJS_RUN_ARGUMENT)/g build/asmjs/run.html


build/js:
	mkdir -p build/js

build/js/spmv.js:
	cp js/spmv.js build/js/$(FILENAME).js
	cp data/data.js build/js/data.js

build/js/run.html: build/js build/js/spmv.js
	cat ../../utils/js/run_template.html > build/js/run.html
	sed -i.bak s/\<\!--PREAMBLE--\>/$(PREAMBLE)/g build/js/run.html
	sed -i.bak s/FILENAME/$(FILENAME)/g build/js/run.html
	sed -i.bak s/RUN_ARGUMENT/$(JS_RUN_ARGUMENT)/g build/js/run.html

build/opencl:
	mkdir -p build/opencl

build/opencl/spmv:
	g++ -O3 -Wall -o build/opencl/spmv opencl/csr_spmv.c common/common.c common/sparse_formats.c common/common_args_serial.c common/ziggurat.c ../../common/common_rand.c -I../../common/ -Icommon/ -lOpenCL -Llibm -lOpenCL -DSERIAL
	cp opencl/*.cl build/opencl/

build/opencl/run.sh: build/opencl build/opencl/spmv
	cp ../../utils/opencl/run_template.sh build/opencl/run.sh
	echo "./spmv -p $(OPENCL_PLATFORM) -c $(OPENCL_DEVICE) $(C_RUN_ARGUMENT)" >> build/opencl/run.sh
	chmod +x build/opencl/run.sh

build/webcl:
	mkdir -p build/webcl

build/webcl/run.html: build/webcl
	cp webcl/* build/webcl/
	mv build/webcl/index.html build/webcl/run.html
	cat ../../utils/webcl/template >> build/webcl/spmv.js
	sed -i.bak s/WEBCL_CALL/$(WEBCL_CALL)/ build/webcl/spmv.js

clean:
	rm -rf build
