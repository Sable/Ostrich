SHELL := /bin/bash

include ../../common/options.mk

EMOPTIONS = -s TOTAL_MEMORY=2000000000

DIM = 100000
DENSITY = 20000
STDDEV = 0.01
ASMJS_RUN_ARGUMENT = "'-n', $(DIM), '-s', $(STDDEV), '-d', $(DENSITY)"
C_RUN_ARGUMENT = "-n $(DIM) -s $(STDDEV) -d $(DENSITY)"
JS_RUN_ARGUMENT = "spmvRun($(DIM), $(DENSITY), $(STDDEV))"
FILENAME = "spmv"

build: build/c/run.sh build/asmjs/run.html build/js/run.html build/opencl build/webcl

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

build/js/run.html: build/js build/js/spmv.js
	cat ../../utils/js/run_template.html > build/js/run.html
	sed -i.bak s/FILENAME/$(FILENAME)/g build/js/run.html
	sed -i.bak s/RUN_ARGUMENT/$(JS_RUN_ARGUMENT)/g build/js/run.html

build/opencl:
	mkdir -p build/opencl

build/webcl:
	mkdir -p build/webcl

clean:
	rm -rf build
