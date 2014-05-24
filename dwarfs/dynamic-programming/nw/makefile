SHELL := /bin/bash

include ../../common/options.mk

EMOPTIONS = -s TOTAL_MEMORY=400000000

DIMENSIONS = "4096"
PENALTY = "1"
ASMJS_RUN_ARGUMENT = "'-n', '"$(DIMENSIONS)"', '-g', '"$(PENALTY)"'"
C_RUN_ARGUMENT = "-n "$(DIMENSIONS)" -g "$(PENALTY)
JS_RUN_ARGUMENT = "runNeedle("$(DIMENSIONS)","$(PENALTY)")"
FILENAME = "needle"

build: build/c/run.sh build/asmjs/run.html build/js/run.html build/opencl build/webcl

build/c:
	mkdir -p build/c

# link objects (binaries) together
build/c/needle:	build/c \
            c/needle.c
	$(CCOMP) c/needle.c \
			 ../../common/common_rand.c \
			 -I../../common \
			 -lm -o build/c/needle

build/c/run.sh: build/c/needle build/c
	echo 'build/c/needle '$(C_RUN_ARGUMENT) > build/c/run.sh && chmod +x build/c/run.sh

build/asmjs:
	mkdir -p build/asmjs

build/asmjs/needle.js: build/asmjs \
            c/needle.c
	$(EMCC) c/needle.c \
			../../common/common_rand.c \
			-I../../common \
			$(EMOPTIONS) -lm -o build/asmjs/needle.js

build/asmjs/run.html: build/asmjs \
            build/asmjs/needle.js
	cat ../../utils/asmjs/run_template.html > build/asmjs/run.html
	sed -i.bak s/FILENAME/$(FILENAME)/g build/asmjs/run.html
	sed -i.bak s/RUN_ARGUMENT/$(ASMJS_RUN_ARGUMENT)/g build/asmjs/run.html


build/js:
	mkdir -p build/js

build/js/needle.js:
	cp js/needle.js build/js/$(FILENAME).js

build/js/run.html: build/js build/js/needle.js
	cat ../../utils/js/run_template.html > build/js/run.html
	sed -i.bak s/FILENAME/$(FILENAME)/g build/js/run.html
	sed -i.bak s/RUN_ARGUMENT/$(JS_RUN_ARGUMENT)/g build/js/run.html

build/opencl:
	mkdir -p build/opencl

build/webcl:
	mkdir -p build/webcl

clean:
	rm -rf build
