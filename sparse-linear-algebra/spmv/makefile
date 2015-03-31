SHELL := /bin/bash

include ../../common/options.mk

EMOPTIONS = -s TOTAL_MEMORY=1000000000

DIM = 50000
DENSITY = 2000
STDDEV = 0.01
ITERATIONS = 100
ASMJS_RUN_ARGUMENT = "'-n', $(DIM), '-s', $(STDDEV), '-d', $(DENSITY), '-i', $(ITERATIONS)"
C_RUN_ARGUMENT = "-n $(DIM) -s $(STDDEV) -d $(DENSITY) -i $(ITERATIONS)"
JS_RUN_ARGUMENT = "spmvRun($(DIM), $(DENSITY), $(STDDEV), $(ITERATIONS))"
WEBCL_CALL = "spmvRun("$(OPENCL_PLATFORM)", "$(OPENCL_DEVICE)", "$(DIM)", "$(DENSITY)", "$(STDDEV)", "$(ITERATIONS)")"
FILENAME = "spmv"

build: build/c/run.sh build/asmjs/run.html build/js/run.html build/opencl/run.sh build/webcl/run.html build/js-nota/run.html build/pnacl/run.sh

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

build/opencl/spmv:
	g++ -O3 -Wall -o build/opencl/spmv opencl/csr_spmv.c common/common.c common/sparse_formats.c common/common_args_serial.c common/ziggurat.c ../../common/common_rand.c -I../../common/ -Icommon/ $(OPENCL_COMPILE_OPTIONS) -Llibm -DSERIAL
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
	cp ../../common/common_rand.js build/webcl

build/js-nota/run.html: js/spmv.js
	mkdir -p build/js-nota/
	cp js/spmv.js build/js-nota/$(FILENAME).js
	perl -i.bak -n -e 'if (/TA$$/) { print } else { s/\w+Array/Array/; print }' build/js-nota/$(FILENAME).js
	cat ../../utils/js/run_template.html > build/js-nota/run.html
	sed -i.bak s/FILENAME/$(FILENAME)/g build/js-nota/run.html
	sed -i.bak s/RUN_ARGUMENT/$(JS_RUN_ARGUMENT)/g build/js-nota/run.html

build/pnacl:
	mkdir -p build/pnacl
   
build/pnacl/run.nexe: build/pnacl
	make -C nacl
	$(HOME)/400/nacl_sdk/pepper_39/toolchain/linux_pnacl/bin/pnacl-translate -arch x86-64 -o build/pnacl/run.nexe nacl/pnacl/Release/pnacl_runner.pexe
   
build/pnacl/run.sh: build/pnacl/run.nexe
	echo '$(HOME)/400/nacl_sdk/pepper_39/tools/sel_ldr.py build/pnacl/run.nexe -- '$(C_RUN_ARGUMENT) > build/pnacl/run.sh && chmod +x build/pnacl/run.sh

clean:
	rm -rf build
	make -C nacl clean
