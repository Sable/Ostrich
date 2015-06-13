SHELL := /bin/bash

include ../../common/options.mk

build: build/c/run.sh build/asmjs/run.html build/js/run.html  build/js-nota/run.html matlab/all matjuice/all

build-parallel: build/opencl/run.sh build/webcl/run.html

EMOPTIONS = -s TOTAL_MEMORY=400000000

SIZE = "1024"
FILENAME = "lud"

# ------- ASMJS SUPPORT ---------------
ASMJS_RUN_ARGUMENT = "'-s', '"$(SIZE)"'"

# ------- C SUPPORT -------------------
C_RUN_ARGUMENT = "-s "$(SIZE)

# ------- JS SUPPORT ------------------
JS_RUN_ARGUMENT = "runLud("$(SIZE)")"

# ------- WEBCL SUPPORT ---------------
WEBCL_CALL = "webclLUD("$(OPENCL_PLATFORM)", "$(OPENCL_DEVICE)", "$(SIZE)")"

# ------- MATLAB SUPPORT ---------------
MATLAB_RUN_ARGUMENT = "runLud("$(SIZE)")"
MATLAB_NATIVE_RUN_ARGUMENT = "runLud("$(SIZE)",2,0,0,0)"
include ../../common/matlab.mk

# ------- MATJUICE SUPPORT ---------------
MATJUICE_SHAPES = "DOUBLE&?*?&REAL" "DOUBLE&1*1&REAL"
MATJUICE_ENTRY_FILE = lud_base
MATJUICE_RUN_ARGUMENT = "runLud("$(SIZE)")"
MATJUICE_FILES = ../../common/matjuice_common.js matjuice/runLud.js 
include ../../common/matjuice.mk

build/c:
	mkdir -p build/c

# link objects (binaries) together
build/c/lud:	build/c \
            c/lud.c \
			c/lud_base.c \
            common/common.c
	$(CCOMP) c/lud.c \
             c/lud_base.c \
			 common/common.c \
			 ../../common/common_rand.c \
			 -Icommon \
			 -I../../common \
			 -lm -o build/c/lud

build/c/run.sh: build/c/lud build/c
	echo 'build/c/lud '$(C_RUN_ARGUMENT) > build/c/run.sh && chmod +x build/c/run.sh

build/asmjs:
	mkdir -p build/asmjs

build/asmjs/lud.js: build/asmjs \
            c/lud.c \
			c/lud_base.c \
            common/common.c
	$(EMCC) c/lud.c \
            c/lud_base.c \
			common/common.c \
			../../common/common_rand.c \
			-Icommon \
			-I../../common \
			$(EMOPTIONS) -lm -o build/asmjs/lud.js

build/asmjs/run.html: build/asmjs \
            build/asmjs/lud.js
	cat ../../utils/asmjs/run_template.html > build/asmjs/run.html
	sed -i.bak s/FILENAME/$(FILENAME)/g build/asmjs/run.html
	sed -i.bak s/RUN_ARGUMENT/$(ASMJS_RUN_ARGUMENT)/g build/asmjs/run.html


build/js:
	mkdir -p build/js

build/js/lud.js:
	cp js/lud.js build/js/$(FILENAME).js

build/js/run.html: build/js build/js/lud.js
	cat ../../utils/js/run_template.html > build/js/run.html
	sed -i.bak s/FILENAME/$(FILENAME)/g build/js/run.html
	sed -i.bak s/RUN_ARGUMENT/$(JS_RUN_ARGUMENT)/g build/js/run.html

build/opencl:
	mkdir -p build/opencl

build/opencl/lud:
	g++ -O3 -o build/opencl/lud opencl/lud.cpp common/common.c ../../common/common_rand.c $(OPENCL_COMPILE_OPTIONS) -Icommon/ -I../../common/ -Llibm
	cp opencl/*.cl build/opencl/

build/opencl/run.sh: build/opencl build/opencl/lud
	cp ../../utils/opencl/run_template.sh build/opencl/run.sh
	echo "./lud -p $(OPENCL_PLATFORM) -d $(OPENCL_DEVICE) $(C_RUN_ARGUMENT)" >> build/opencl/run.sh
	chmod +x build/opencl/run.sh

build/webcl:
	mkdir -p build/webcl

build/webcl/run.html: build/webcl
	cp webcl/* build/webcl/
	mv build/webcl/index.html build/webcl/run.html
	cat ../../utils/webcl/template >> build/webcl/lud.js
	sed -i.bak s/WEBCL_CALL/$(WEBCL_CALL)/ build/webcl/lud.js


build/js-nota/run.html: js/lud.js
	mkdir -p build/js-nota/
	cp js/lud.js build/js-nota/$(FILENAME).js
	perl -i.bak -n -e 'if (/TA$$/) { print } else { s/\w+Array/Array/; print }' build/js-nota/$(FILENAME).js
	cat ../../utils/js/run_template.html > build/js-nota/run.html
	sed -i.bak s/FILENAME/$(FILENAME)/g build/js-nota/run.html
	sed -i.bak s/RUN_ARGUMENT/$(JS_RUN_ARGUMENT)/g build/js-nota/run.html
