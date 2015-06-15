SHELL := /bin/bash

include ../../common/options.mk

# Original options used by Vince
EMOPTIONS = -s TOTAL_MEMORY=400000000

NB_PAGES = 5000
NB_ITERATIONS = 10
# Using exponential notation for THRESHOLD because it needs to print and read the same to
# use it in the file name for caching the generated input data and the exponential notation is
# the easiest to make consistent
THRESHOLD = 1e-08
DIVISOR = 100000
FILENAME = pagerank

INPUT_DATA_FILE = input-data-$(NB_PAGES)-$(DIVISOR).csv
OUTPUT_DATA_FILE = output-data-$(NB_PAGES)-$(NB_ITERATIONS)-$(THRESHOLD)-$(DIVISOR).csv

build: build/c/run.sh build/asmjs/run.html build/js/run.html  build/js-nota/run.html data/all matlab/all

build-parallel: build/opencl/run.sh build/webcl/run.html

# ------- DATA GENERATION -------
.PHONY:
data/all: build/data/$(INPUT_DATA_FILE) build/data/$(OUTPUT_DATA_FILE)

build/data:
	mkdir -p build/data

.PHONY:
build/data/all: build/c/$(FILENAME) build/data 
	build/c/$(FILENAME)  $(C_RUN_ARGUMENT) -d build/data/$(INPUT_DATA_FILE) -o build/data/$(OUTPUT_DATA_FILE)

build/data/$(INPUT_DATA_FILE): build/data/all
build/data/$(OUTPUT_DATA_FILE): build/data/all
	
# ------- ASMJS SUPPORT ---------------
ASMJS_RUN_ARGUMENT = "'-n', '"$(NB_PAGES)"', '-i', '"$(NB_ITERATIONS)"', '-t', '"$(THRESHOLD)"', '-q', '"$(DIVISOR)"'"

# ------- C SUPPORT -------------------
C_RUN_ARGUMENT = -n $(NB_PAGES) -i $(NB_ITERATIONS) -t $(THRESHOLD) -q $(DIVISOR)

# ------- JS SUPPORT ------------------
JS_RUN_ARGUMENT = "runPageRank("$(NB_PAGES)", "$(NB_ITERATIONS)", "$(THRESHOLD)", "$(DIVISOR)")"

# ------- WEBCL SUPPORT ---------------
WEBCL_CALL = "webclPR("$(OPENCL_PLATFORM)", "$(OPENCL_DEVICE)", "$(NB_PAGES)", "$(NB_ITERATIONS)", "$(THRESHOLD)", "$(DIVISOR)")"

# ------- MATLAB SUPPORT ---------------
MATLAB_RUN_ARGUMENT = "runPageRank("$(NB_PAGES)","$(NB_ITERATIONS)","$(THRESHOLD)","$(DIVISOR)")"
MATLAB_NATIVE_RUN_ARGUMENT = "error('Unsupported')"
include ../../common/matlab.mk

# ------- MATJUICE SUPPORT ---------------
#MATJUICE_SHAPES = "DOUBLE&1*1&REAL" "DOUBLE&1*1&REAL" "DOUBLE&1*1&REAL" "DOUBLE&1*1&REAL"
#MATJUICE_ENTRY_FILE = pagerank
#MATJUICE_RUN_ARGUMENT = "runPageRank("$(NB_PAGES)","$(NB_ITERATIONS)","$(THRESHOLD)","$(DIVISOR)")"
#MATJUICE_FILES = ../../common/matjuice_common.js matjuice/runPageRank.js 
#include ../../common/matjuice.mk

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
	$(CCOMP) -o build/opencl/pagerank  opencl/pagerank.c ../../common/opts/opts.c ../../common/common.c  ../../common/common_args.c ../../common/common_rand.c $(OPENCL_COMPILE_OPTIONS) -I../../common/ -lm
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

build/js-nota/run.html: js/pagerank.js
	mkdir -p build/js-nota/
	cp js/pagerank.js build/js-nota/$(FILENAME).js
	perl -i.bak -n -e 'if (/TA$$/) { print } else { s/\w+Array/Array/; print }' build/js-nota/$(FILENAME).js
	cat ../../utils/js/run_template.html > build/js-nota/run.html
	sed -i.bak s/FILENAME/$(FILENAME)/g build/js-nota/run.html
	sed -i.bak s/RUN_ARGUMENT/$(JS_RUN_ARGUMENT)/g build/js-nota/run.html
