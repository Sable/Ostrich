SHELL := /bin/bash

include ../../common/options.mk

EMOPTIONS = -s TOTAL_MEMORY=400000000

ASMJS_RUN_ARGUMENT = "'-v', 'n', '-n', '512'"
C_RUN_ARGUMENT = "-v n -n 512"
JS_RUN_ARGUMENT = "bwa_hmm('n', 512)"
WEBCL_CALL = "webclBWAHmm("$(OPENCL_PLATFORM)", "$(OPENCL_DEVICE)", 'n', 512)"
FILENAME = "hmm"

build: build/c/run.sh build/asmjs/run.html build/js/run.html build/opencl/run.sh build/webcl/run.html

build/c:
	mkdir -p build/c

# link objects (binaries) together
build/c/hmm:	build/c \
            c/main_bwa_hmm.c
	$(CCOMP) c/main_bwa_hmm.c \
			../../common/common.c \
			 ../../common/common_rand.c \
			 -I../../common \
			 -lm -o build/c/hmm

build/c/run.sh: build/c/hmm build/c
	echo 'build/c/hmm '$(C_RUN_ARGUMENT) > build/c/run.sh && chmod +x build/c/run.sh

build/asmjs:
	mkdir -p build/asmjs

build/asmjs/hmm.js: build/asmjs \
            c/main_bwa_hmm.c
	$(EMCC) c/main_bwa_hmm.c \
			../../common/common.c \
			../../common/common_rand.c \
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

build/opencl/hmm:
	$(CCOMP) -o build/opencl/hmm opencl/main_bwa_hmm.c ../../common/common.c ../../common/common_rand.c ../../common/common_args.c ../../common/opts/opts.c $(OPENCL_COMPILE_OPTIONS)  -I../../common/ -lm
	cp opencl/*.cl build/opencl/

build/opencl/run.sh: build/opencl build/opencl/hmm
	cp ../../utils/opencl/run_template.sh build/opencl/run.sh
	echo "./hmm -p $(OPENCL_PLATFORM) -d $(OPENCL_DEVICE) -- $(C_RUN_ARGUMENT)" >> build/opencl/run.sh
	chmod +x build/opencl/run.sh

build/webcl:
	mkdir -p build/webcl

build/webcl/run.html: build/webcl
	cp webcl/* build/webcl/
	mv build/webcl/index.html build/webcl/run.html
	cat ../../utils/webcl/template >> build/webcl/hmm.js
	sed -i.bak s/WEBCL_CALL/$(WEBCL_CALL)/ build/webcl/hmm.js

clean:
	rm -rf build
