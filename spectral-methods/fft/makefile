SHELL := /bin/bash

include ../../common/options.mk

EMOPTIONS = -s TOTAL_MEMORY=400000000
MATLAB_OPTIONS = "-nodisplay -r "
# 1st step filters out the MATLAB copyright notice and
# 2nd step removes unprintable trailing characters
OUTPUT_FILTER = "sed -n -e '/{/,/}/p' | sed 's/.*\({.*}\).*/\1/g'"

EXPONENT = "10"
ASMJS_RUN_ARGUMENT = "'"$(EXPONENT)"'"
C_RUN_ARGUMENT = $(EXPONENT)
MATLAB_RUN_ARGUMENT = "cd build/matlab/; runFFT("$(EXPONENT)"); exit();"
MATLAB_NATIVE_RUN_ARGUMENT = "cd build/matlab-native/; runFFT("$(EXPONENT)",2); exit();"
JS_RUN_ARGUMENT = "runFFT("$(EXPONENT)")"
FILENAME = "fft"

build: build/c/run.sh build/asmjs/run.html build/js/run.html build/opencl build/webcl build/js-nota/run.html build/matlab/run.sh build/matlab-native/run.sh

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


build/js-nota/run.html: js/fft.js
	mkdir -p build/js-nota/
	cp js/fft.js build/js-nota/$(FILENAME).js
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

build/matlab-native:
	mkdir -p build/matlab-native

build/matlab-native/*.m: matlab/*.m ../../common/*.m
	cp matlab/*.m build/matlab-native/
	cp ../../common/*.m build/matlab-native/

build/matlab-native/run.sh: build/matlab-native build/matlab-native/*.m
	echo 'matlab '$(MATLAB_OPTIONS)' '\'$(MATLAB_NATIVE_RUN_ARGUMENT)\'' | '$(OUTPUT_FILTER) > build/matlab-native/run.sh && chmod +x build/matlab-native/run.sh


clean:
	rm -rf build
