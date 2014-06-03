SHELL := /bin/bash

include ../../common/options.mk

# Original options used by Vince
EMOPTIONS = -s TOTAL_MEMORY=400000000
NB_PAGES = "5000"
NB_ITERATIONS = "10"
THRESHOLD = "0.00000001"
DIVISOR = "100000"

ASMJS_RUN_ARGUMENT = "'-n', '"$(NB_PAGES)"', '-i', '"$(NB_ITERATIONS)"', '-t', '"$(THRESHOLD)"', '-q', '"$(DIVISOR)"'"
C_RUN_ARGUMENT = "-n "$(NB_PAGES)" -i "$(NB_ITERATIONS)" -t "$(THRESHOLD)" -q "$(DIVISOR)
JS_RUN_ARGUMENT = "runPageRank("$(NB_PAGES)", "$(NB_ITERATIONS)", "$(THRESHOLD)", "$(DIVISOR)")"
WEBCL_CALL = "webclPR("$(OPENCL_PLATFORM)", "$(OPENCL_DEVICE)", "$(NB_PAGES)", "$(NB_ITERATIONS)", "$(THRESHOLD)", "$(DIVISOR)")"
FILENAME = "pagerank"

build: build/c/run.sh build/asmjs/run.html build/js/run.html build/opencl/run.sh build/webcl/run.html

build/c:
	mkdir -p build/c

# link objects (binaries) together
build/c/pagerank:	build/c \
                common/common.c \
                c/pagerank.c
	$(CCOMP) -I../../common/ \
             -Icommon/ \
             ../../common/common_rand.c \
             common/common.c \
             c/pagerank.c \
			 -lm -o build/c/pagerank

build/c/run.sh: build/c/pagerank build/c
	echo 'build/c/pagerank '$(C_RUN_ARGUMENT) > build/c/run.sh && chmod +x build/c/run.sh

build/asmjs:
	mkdir -p build/asmjs

build/asmjs/pagerank.js: build/asmjs \
                    common/common.c \
                    c/pagerank.c
	$(EMCC)  -I../../common/ \
             -Icommon/ \
             ../../common/common_rand.c \
             common/common.c \
             c/pagerank.c \
             $(EMOPTIONS) \
			 -lm -o build/asmjs/pagerank.js

build/asmjs/run.html: build/asmjs \
            build/asmjs/pagerank.js
	cat ../../utils/asmjs/run_template.html > build/asmjs/run.html
	sed -i.bak s/FILENAME/$(FILENAME)/g build/asmjs/run.html
	sed -i.bak s/RUN_ARGUMENT/$(ASMJS_RUN_ARGUMENT)/g build/asmjs/run.html


build/js:
	mkdir -p build/js

build/js/pagerank.js:
	cp js/pagerank.js build/js/

build/js/run.html: build/js build/js/pagerank.js
	cat ../../utils/js/run_template.html > build/js/run.html
	sed -i.bak s/FILENAME/$(FILENAME)/g build/js/run.html
	sed -i.bak s/RUN_ARGUMENT/$(JS_RUN_ARGUMENT)/g build/js/run.html

build/opencl:
	mkdir -p build/opencl

build/opencl/pagerank:
	$(CCOMP) -o build/opencl/pagerank  opencl/pagerank.c ../../common/opts/opts.c ../../common/common.c  ../../common/common_args.c ../../common/common_rand.c -I$(OPENCL_INC) -I../../common/ -L$(OPENCL_LIB) -lOpenCL -lm  -DOPENCL_HEADER_CL_CL
	cp opencl/*.cl build/opencl/

build/opencl/run.sh: build/opencl build/opencl/pagerank
	cp ../../utils/opencl/run_template.sh build/opencl/run.sh
	echo "./pagerank -p $(OPENCL_PLATFORM) -d $(OPENCL_DEVICE) $(C_RUN_ARGUMENT)" >> build/opencl/run.sh
	chmod +x build/opencl/run.sh

build/webcl:
	mkdir -p build/webcl

build/webcl/run.html: build/webcl
	cp webcl/* build/webcl/
	mv build/webcl/index.html build/webcl/run.html
	cat ../../utils/webcl/template >> build/webcl/pagerank.js
	sed -i.bak s/WEBCL_CALL/$(WEBCL_CALL)/ build/webcl/pagerank.js

clean:
	rm -rf build
