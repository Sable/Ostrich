SHELL := /bin/bash

include ../../common/options.mk

EMOPTIONS = -s TOTAL_MEMORY=400000000
MATLAB_OPTIONS = "-nodisplay -r "
# 1st step filters out the MATLAB copyright notice and
# 2nd step removes unprintable trailing characters
OUTPUT_FILTER = "sed -n -e '/{/,/}/p' | sed 's/.*\({.*}\).*/\1/g'"

SIZE = "1024"
ASMJS_RUN_ARGUMENT = "'-s', '"$(SIZE)"'"
C_RUN_ARGUMENT = "-s "$(SIZE)
JS_RUN_ARGUMENT = "ludRun("$(SIZE)")"
MATLAB_RUN_ARGUMENT = "cd build/matlab/; runLud("$(SIZE)"); exit();"
MATLAB_NATIVE_RUN_ARGUMENT = "cd build/matlab-native/; runLud("$(SIZE)",2,0,0,0); exit();"
WEBCL_CALL = "webclLUD("$(OPENCL_PLATFORM)", "$(OPENCL_DEVICE)", "$(SIZE)")"
FILENAME = "lud"

build: build/c/run.sh build/asmjs/run.html build/js/run.html  build/js-nota/run.html build/matlab/run.sh build/matjuice/run.html build/matlab-native/run.sh

build-parallel: build/opencl/run.sh build/webcl/run.html

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

build/matlab:
	mkdir -p build/matlab

build/matlab/*.m: matlab/*.m ../../common/*.m
	cp matlab/*.m build/matlab/
	cp ../../common/*.m build/matlab/

build/matlab/run.sh: build/matlab build/matlab/*.m
	echo 'matlab '$(MATLAB_OPTIONS)' '\'$(MATLAB_RUN_ARGUMENT)\'' | '$(OUTPUT_FILTER) > build/matlab/run.sh && chmod +x build/matlab/run.sh

build/matjuice/run.html:
	mkdir -p build/matjuice
	$(HOME)/workspace/matjuice/matjuice.sh "DOUBLE&1*1&REAL" matlab/compile/main.m build/matjuice/main.js
	cp ../../common/matjuice_common.js build/matjuice/
	cp ../../utils/matjuice/run.html build/matjuice/

build/matlab-native:
	mkdir -p build/matlab-native

build/matlab-native/*.m: matlab/*.m ../../common/*.m
	cp matlab/*.m build/matlab-native/
	cp ../../common/*.m build/matlab-native/

build/matlab-native/run.sh: build/matlab-native build/matlab-native/*.m
	echo 'matlab '$(MATLAB_OPTIONS)' '\'$(MATLAB_NATIVE_RUN_ARGUMENT)\'' | '$(OUTPUT_FILTER) > build/matlab-native/run.sh && chmod +x build/matlab-native/run.sh

clean:
	rm -rf build
