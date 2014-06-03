SHELL := /bin/bash

include ../../common/options.mk

EMOPTIONS = -s TOTAL_MEMORY=450000000

NB_INPUT_ELEMS = "2850000"
ASMJS_RUN_ARGUMENT = "['"$(NB_INPUT_ELEMS)"']"
C_RUN_ARGUMENT = $(NB_INPUT_ELEMS)
JS_RUN_ARGUMENT = "runBackProp("$(NB_INPUT_ELEMS)")"
FILENAME = "backprop"

build: build/c/run.sh build/asmjs/run.html build/js/run.html build/opencl/run.sh build/webcl

build/c:
	mkdir -p build/c

# link objects (binaries) together
build/c/backprop: build/c c/imagenet.c c/backprop_kernel.c c/backprop.c c/facetrain.c
	$(CCOMP) -I../../common/ ../../common/common.c ../../common/common_rand.c c/imagenet.c c/backprop_kernel.c c/backprop.c c/facetrain.c -lm -o build/c/backprop

build/c/run.sh: build/c/backprop build/c
	echo 'build/c/backprop '$(C_RUN_ARGUMENT) > build/c/run.sh && chmod +x build/c/run.sh

build/asmjs:
	mkdir -p build/asmjs

build/asmjs/data.js:
	cp data/data.js build/asmjs/data.js

build/asmjs/backprop.js: build/asmjs c/*.c c/*.h
	$(EMCC) -I../../common/ ../../common/common.c ../../common/common_rand.c c/imagenet.c c/backprop_kernel.c c/backprop.c c/facetrain.c -lm -o build/asmjs/backprop.js $(EMOPTIONS)

build/asmjs/run.html: build/asmjs \
            build/asmjs/backprop.js
	cat ../../utils/asmjs/run_template.html > build/asmjs/run.html
	sed -i.bak s/FILENAME/$(FILENAME)/g build/asmjs/run.html
	sed -i.bak s/RUN_ARGUMENT/$(ASMJS_RUN_ARGUMENT)/g build/asmjs/run.html


build/js:
	mkdir -p build/js

build/js/backprop.js:
	cp js/backprop.js build/js/$(FILENAME).js

build/js/run.html: build/js build/js/backprop.js
	cat ../../utils/js/run_template.html > build/js/run.html
	sed -i.bak s/FILENAME/$(FILENAME)/g build/js/run.html
	sed -i.bak s/RUN_ARGUMENT/$(JS_RUN_ARGUMENT)/g build/js/run.html

build/opencl:
	mkdir -p build/opencl

build/opencl/backprop:
	g++ -O3  -o build/opencl/backprop opencl/backprop_ocl.cpp opencl/backprop.c opencl/imagenet.c opencl/facetrain.c ../../common/common.c -I../../common -I$(OPENCL_INC) -L$(OPENCL_LIB) -lOpenCL
	cp opencl/*.cl build/opencl/

build/opencl/run.sh: build/opencl build/opencl/backprop
	cp ../../utils/opencl/run_template.sh build/opencl/run.sh
	echo "./backprop -p $(OPENCL_PLATFORM) -d $(OPENCL_DEVICE) -n $(C_RUN_ARGUMENT)" >> build/opencl/run.sh
	chmod +x build/opencl/run.sh

build/webcl:
	mkdir -p build/webcl

clean:
	rm -rf build
