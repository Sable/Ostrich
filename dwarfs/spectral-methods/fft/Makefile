SHELL := /bin/bash

include ../../common/options.mk

EMOPTIONS = -s TOTAL_MEMORY=400000000

ASMJS_RUN_ARGUMENT = ""
C_RUN_ARGUMENT = ""
JS_RUN_ARGUMENT = "runFFT()"
FILENAME = "fft"

build: build/c/run.sh build/asmjs/run.html build/js/run.html build/opencl build/webcl

build/c:
	mkdir -p build/c

# link objects (binaries) together
build/c/fft:	build/c \
            c/fft.c \
			c/main.c \
            common/common.c \
			common/complex_simple.c
	$(CCOMP) c/fft.c \
             c/main.c \
			 common/common.c \
			 ../../common/common_rand.c \
			 common/complex_simple.c \
			 -Icommon \
			 -I../../common \
			 -lm -o build/c/fft

build/c/run.sh: build/c/fft build/c
	echo 'build/c/fft '$(C_RUN_ARGUMENT) > build/c/run.sh && chmod +x build/c/run.sh

build/asmjs:
	mkdir -p build/asmjs

build/asmjs/fft.js: build/asmjs \
            c/fft.c \
			c/main.c \
			common/complex_simple.c \
            common/common.c
	$(EMCC) c/fft.c \
            c/main.c \
			common/common.c \
			../../common/common_rand.c \
			common/complex_simple.c \
			-Icommon \
			-I../../common \
			$(EMOPTIONS) -lm -o build/asmjs/fft.js

build/asmjs/run.html: build/asmjs \
            build/asmjs/fft.js
	cat ../../utils/asmjs/run_template.html > build/asmjs/run.html
	sed -i.bak s/FILENAME/$(FILENAME)/g build/asmjs/run.html
	sed -i.bak s/RUN_ARGUMENT/$(ASMJS_RUN_ARGUMENT)/g build/asmjs/run.html


build/js:
	mkdir -p build/js

build/js/fft.js:
	cp js/fft.js build/js/$(FILENAME).js

build/js/run.html: build/js build/js/fft.js
	cat ../../utils/js/run_template.html > build/js/run.html
	sed -i.bak s/FILENAME/$(FILENAME)/g build/js/run.html
	sed -i.bak s/RUN_ARGUMENT/$(JS_RUN_ARGUMENT)/g build/js/run.html

build/opencl:
	mkdir -p build/opencl

build/webcl:
	mkdir -p build/webcl

clean:
	rm -rf build
