SHELL := /bin/bash

include ../../common/options.mk

EMOPTIONS = -s TOTAL_MEMORY=400000000

NB_REPETITIONS = "500"
LAMBDA = "1"
ASMJS_RUN_ARGUMENT = "['"$(NB_REPETITIONS)"', '"$(LAMBDA)"'].concat(data)"
C_RUN_ARGUMENT = $(NB_REPETITIONS)" "$(LAMBDA)
JS_RUN_ARGUMENT = "runSRAD("$(NB_REPETITIONS)","$(LAMBDA)")"
WEBCL_CALL = "webclsrad("$(OPENCL_PLATFORM)", "$(OPENCL_DEVICE)", "$(NB_REPETITIONS)","$(LAMBDA)")"
FILENAME = "srad"

PREAMBLE = "<script src=\"data.js\"><\/script>"

build: build/c/run.sh build/asmjs/run.html build/js/run.html build/opencl/run.sh build/webcl/run.html build/js-nota/run.html

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
	mkdir -p build/opencl/kernel


build/opencl/srad:
	g++ -O3 -Wall -o build/opencl/srad opencl/main.c opencl/util/timer/timer.c opencl/util/graphics/resize.c opencl/util/graphics/graphics.c opencl/kernel/kernel_gpu_opencl_wrapper.c opencl/util/opencl/opencl.c -I../../common/ $(OPENCL_COMPILE_OPTIONS) -Llibm
	cp opencl/kernel/*.cl build/opencl/kernel/
	cp opencl/main.h build/opencl/

build/opencl/run.sh: build/opencl build/opencl/srad
	cp ../../utils/opencl/run_template.sh build/opencl/run.sh
	echo "./srad -p $(OPENCL_PLATFORM) -d $(OPENCL_DEVICE) -n $(NB_REPETITIONS) -l $(LAMBDA)" >> build/opencl/run.sh
	chmod +x build/opencl/run.sh


build/webcl:
	mkdir -p build/webcl

build/webcl/run.html: build/webcl
	cp webcl/* build/webcl/
	cp data/data.js build/webcl/data.js
	mv build/webcl/index.html build/webcl/run.html
	cat ../../utils/webcl/template >> build/webcl/srad.js
	sed -i.bak s/WEBCL_CALL/$(WEBCL_CALL)/ build/webcl/srad.js


build/js-nota/run.html: js/srad.js
	mkdir -p build/js-nota/
	cp js/srad.js build/js-nota/$(FILENAME).js
	cp data/data.js build/js-nota/data.js
	perl -i.bak -n -e 'if (/TA$$/) { print } else { s/\w+Array/Array/; print }' build/js-nota/$(FILENAME).js
	cat ../../utils/js/run_template.html > build/js-nota/run.html
	sed -i.bak s/\<\!--PREAMBLE--\>/$(PREAMBLE)/g build/js-nota/run.html
	sed -i.bak s/FILENAME/$(FILENAME)/g build/js-nota/run.html
	sed -i.bak s/RUN_ARGUMENT/$(JS_RUN_ARGUMENT)/g build/js-nota/run.html


clean:
	rm -rf build
