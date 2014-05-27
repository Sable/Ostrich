SHELL := /bin/bash

include ../../common/options.mk

EMOPTIONS = -s TOTAL_MEMORY=400000000

NB_REPETITIONS = "500"
LAMBDA = "1"
ASMJS_RUN_ARGUMENT = "['"$(NB_REPETITIONS)"', '"$(LAMBDA)"'].concat(data)"
C_RUN_ARGUMENT = $(NB_REPETITIONS)" "$(LAMBDA)
JS_RUN_ARGUMENT = "runSRAD("$(NB_REPETITIONS)","$(LAMBDA)")"
FILENAME = "srad"

PREAMBLE = "<script src=\"data.js\"><\/script>"

build: build/c/run.sh build/asmjs/run.html build/js/run.html build/opencl build/webcl

build/c:
	mkdir -p build/c

# link objects (binaries) together
build/c/srad:	build/c \
            common/define.c \
            common/graphics.c \
            common/timer.c \
            c/main.c
	$(CCOMP) -Icommon \
             c/main.c \
			 -lm -o build/c/srad

build/c/run.sh: build/c/srad build/c
	echo 'build/c/srad '$(C_RUN_ARGUMENT) > build/c/run.sh && chmod +x build/c/run.sh

build/asmjs:
	mkdir -p build/asmjs

build/asmjs/data.js:
	cp data/data.js build/asmjs/data.js

build/asmjs/srad.js: build/asmjs \
            common/define.c \
            common/graphics.c \
            common/timer.c \
            c/main.c
	$(EMCC) -Icommon \
            c/main.c \
			$(EMOPTIONS) -lm -o build/asmjs/srad.js

build/asmjs/run.html: build/asmjs \
            build/asmjs/data.js \
            build/asmjs/srad.js
	cat ../../utils/asmjs/run_template.html > build/asmjs/run.html
	sed -i.bak s/\<\!--PREAMBLE--\>/$(PREAMBLE)/g build/asmjs/run.html
	sed -i.bak s/FILENAME/$(FILENAME)/g build/asmjs/run.html
	sed -i.bak s/\\[RUN_ARGUMENT\\]/$(ASMJS_RUN_ARGUMENT)/g build/asmjs/run.html


build/js:
	mkdir -p build/js

build/js/srad.js:
	cp js/srad.js build/js/$(FILENAME).js

build/js/data.js:
	cp data/data.js build/js/data.js

build/js/run.html: build/js build/js/srad.js build/js/data.js
	cat ../../utils/js/run_template.html > build/js/run.html
	sed -i.bak s/\<\!--PREAMBLE--\>/$(PREAMBLE)/g build/js/run.html
	sed -i.bak s/FILENAME/$(FILENAME)/g build/js/run.html
	sed -i.bak s/RUN_ARGUMENT/$(JS_RUN_ARGUMENT)/g build/js/run.html

build/opencl:
	mkdir -p build/opencl

build/webcl:
	mkdir -p build/webcl

clean:
	rm -rf build
