SHELL := /bin/bash

include ../../common/options.mk

EMOPTIONS = -s TOTAL_MEMORY=400000000

ASMJS_RUN_ARGUMENT = "'-v', 'n', '-n', '512'"
C_RUN_ARGUMENT = "-v n -n 512"
JS_RUN_ARGUMENT = "bwa_hmm('n', 512)"
FILENAME = "hmm"

build: build/c/run.sh build/asmjs/run.html build/js/run.html build/opencl build/webcl

build/c:
	mkdir -p build/c

# link objects (binaries) together
build/c/hmm:	build/c \
            c/main_bwa_hmm.c
	$(CCOMP) c/main_bwa_hmm.c \
			 common/common.c \
			 ../../common/common_rand.c \
			 -Icommon \
			 -I../../common \
			 -lm -o build/c/hmm

build/c/run.sh: build/c/hmm build/c
	echo 'build/c/hmm '$(C_RUN_ARGUMENT) > build/c/run.sh && chmod +x build/c/run.sh

build/asmjs:
	mkdir -p build/asmjs

build/asmjs/hmm.js: build/asmjs \
            c/main_bwa_hmm.c
	$(EMCC) c/main_bwa_hmm.c \
			common/common.c \
			../../common/common_rand.c \
			-Icommon \
			-I../../common \
			$(EMOPTIONS) -lm -o build/asmjs/hmm.js

build/asmjs/run.html: build/asmjs \
            build/asmjs/hmm.js
	cat ../../utils/asmjs/run_template.html > build/asmjs/run.html
	sed -i.bak s/FILENAME/$(FILENAME)/g build/asmjs/run.html
	sed -i.bak s/RUN_ARGUMENT/$(ASMJS_RUN_ARGUMENT)/g build/asmjs/run.html


build/js:
	mkdir -p build/js

build/js/hmm.js:
	cp js/bwa_hmm.js build/js/$(FILENAME).js

build/js/run.html: build/js build/js/hmm.js
	cat ../../utils/js/run_template.html > build/js/run.html
	sed -i.bak s/FILENAME/$(FILENAME)/g build/js/run.html
	sed -i.bak s/RUN_ARGUMENT/$(JS_RUN_ARGUMENT)/g build/js/run.html

build/opencl:
	mkdir -p build/opencl

build/webcl:
	mkdir -p build/webcl

clean:
	rm -rf build
