SHELL := /bin/bash

include ../../common/options.mk

EMOPTIONS = -s TOTAL_MEMORY=1000000000

DIM = 50000
DENSITY = 2000
STDDEV = 0.01
ITERATIONS = 100
ASMJS_RUN_ARGUMENT = "'-n', $(DIM), '-s', $(STDDEV), '-d', $(DENSITY), '-i', $(ITERATIONS)"
C_RUN_ARGUMENT = "-n $(DIM) -s $(STDDEV) -d $(DENSITY) -i $(ITERATIONS)"
JS_RUN_ARGUMENT = "spmvRun($(DIM), $(DENSITY), $(STDDEV), $(ITERATIONS))"
MATLAB_NATIVE_RUN_ARGUMENT = "cd build/matlab-native/; spmvRun('n',60,2,1000); exit();"
WEBCL_CALL = "spmvRun("$(OPENCL_PLATFORM)", "$(OPENCL_DEVICE)", "$(DIM)", "$(DENSITY)", "$(STDDEV)", "$(ITERATIONS)")"
FILENAME = "spmv"

MATJUICE_SHAPES = "CHAR&1*1&REAL" "DOUBLE&1*1&REAL" "DOUBLE&1*1&REAL" "DOUBLE&1*1&REAL"
MATJUICE_ENTRY_FILE = spmv_ostrich
MATJUICE_RUN_ARGUMENT = "spmvRun($(DIM), $(DENSITY), $(STDDEV), $(ITERATIONS))"
MATJUICE_FILES = "\n\
<script src='..\/..\/..\/..\/common\/matjuice_common.js'><\/script>\n\
<script src='.\/spmvRun.js'><\/script>\n\
<script src='.\/"$(MATJUICE_ENTRY_FILE)".js'><\/script>\n\
<script src='.\/spmv_ostrich_loop.js'><\/script>\n\
"

build: build/c/run.sh build/asmjs/run.html build/js/run.html build/opencl/run.sh build/webcl/run.html build/js-nota/run.html build/matlab/run.sh build/matjuice/run.html build/matlab-native/run.sh

build/c:
	mkdir -p build/c

# link objects (binaries) together
build/c/spmv:	build/c \
            c/csr_spmv.c \
			common/common.c \
			common/common_args_serial.c \
			common/sparse_formats.c \
			common/ziggurat.c
	$(CCOMP) c/csr_spmv.c \
			 common/common.c \
			 common/sparse_formats.c \
			 common/common_args_serial.c \
			 common/ziggurat.c \
			 ../../common/common_rand.c \
			 -Icommon \
			 -I../../common \
			 -DSERIAL \
			 -std=c99 \
			 -lm -o build/c/spmv

build/c/run.sh: build/c/spmv build/c
	echo 'build/c/spmv '$(C_RUN_ARGUMENT) > build/c/run.sh && chmod +x build/c/run.sh

build/asmjs:
	mkdir -p build/asmjs

build/asmjs/spmv.js: build/asmjs \
            c/csr_spmv.c \
			common/common.c \
			common/common_args_serial.c \
			common/sparse_formats.c \
			common/ziggurat.c
	$(EMCC) c/csr_spmv.c \
			common/common.c \
			common/sparse_formats.c \
			common/common_args_serial.c \
			common/ziggurat.c \
			../../common/common_rand.c \
			-Icommon \
			-I../../common \
			-DSERIAL \
			-std=c99 \
			$(EMOPTIONS) -lm -o build/asmjs/spmv.js

build/asmjs/run.html: build/asmjs \
            build/asmjs/spmv.js
	cat ../../utils/asmjs/run_template.html > build/asmjs/run.html
	sed -i.bak s/FILENAME/$(FILENAME)/g build/asmjs/run.html
	sed -i.bak s/RUN_ARGUMENT/$(ASMJS_RUN_ARGUMENT)/g build/asmjs/run.html


build/js:
	mkdir -p build/js

build/js/spmv.js:
	cp js/spmv.js build/js/$(FILENAME).js

build/js/run.html: build/js build/js/spmv.js
	cat ../../utils/js/run_template.html > build/js/run.html
	sed -i.bak s/FILENAME/$(FILENAME)/g build/js/run.html
	sed -i.bak s/RUN_ARGUMENT/$(JS_RUN_ARGUMENT)/g build/js/run.html

build/opencl:
	mkdir -p build/opencl

build/opencl/spmv:
	g++ -O3 -Wall -o build/opencl/spmv opencl/csr_spmv.c common/common.c common/sparse_formats.c common/common_args_serial.c common/ziggurat.c ../../common/common_rand.c -I../../common/ -Icommon/ $(OPENCL_COMPILE_OPTIONS) -Llibm -DSERIAL
	cp opencl/*.cl build/opencl/

build/opencl/run.sh: build/opencl build/opencl/spmv
	cp ../../utils/opencl/run_template.sh build/opencl/run.sh
	echo "./spmv -p $(OPENCL_PLATFORM) -c $(OPENCL_DEVICE) $(C_RUN_ARGUMENT)" >> build/opencl/run.sh
	chmod +x build/opencl/run.sh

build/webcl:
	mkdir -p build/webcl

build/webcl/run.html: build/webcl
	cp webcl/* build/webcl/
	mv build/webcl/index.html build/webcl/run.html
	cat ../../utils/webcl/template >> build/webcl/spmv.js
	sed -i.bak s/WEBCL_CALL/$(WEBCL_CALL)/ build/webcl/spmv.js
	cp ../../common/common_rand.js build/webcl

build/js-nota/run.html: js/spmv.js
	mkdir -p build/js-nota/
	cp js/spmv.js build/js-nota/$(FILENAME).js
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

build/matjuice:
	mkdir -p build/matjuice
	
build/matjuice/*.m: matlab/*.m ../../common/*.m build/matjuice
	cp matlab/*.m build/matjuice/
	cp ../../common/*.m build/matjuice/

build/matjuice/*.js:  build/matjuice ../../common/*.js matjuice/*.js
	cp ../../common/*.js build/matjuice/
	cp matjuice/*.js build/matjuice/

build/matjuice/$(MATJUICE_ENTRY_FILE).js: matlab/$(MATJUICE_ENTRY_FILE).m build/matjuice
	../../dependencies/matjuice/matjuice.sh matlab/$(MATJUICE_ENTRY_FILE).m build/matjuice/$(MATJUICE_ENTRY_FILE).js $(MATJUICE_SHAPES) 2>&1 >/dev/null

build/matjuice/run.html: build/matjuice build/matjuice/*.m build/matjuice/*.js build/matjuice/$(MATJUICE_ENTRY_FILE).js
	cat ../../utils/matjuice/run_template.html > build/matjuice/run.html
	sed -i.bak s/MATJUICE_FILES/$(MATJUICE_FILES)/g build/matjuice/run.html
	sed -i.bak s/RUN_ARGUMENT/$(MATJUICE_RUN_ARGUMENT)/g build/matjuice/run.html
	
build/matlab-native:
	mkdir -p build/matlab-native

build/matlab-native/*.m: matlab/*.m ../../common/*.m
	cp matlab/*.m build/matlab-native/
	cp ../../common/*.m build/matlab-native/

build/matlab-native/run.sh: build/matlab-native build/matlab-native/*.m
	echo 'matlab '$(MATLAB_OPTIONS)' '\'$(MATLAB_NATIVE_RUN_ARGUMENT)\'' | '$(OUTPUT_FILTER) > build/matlab-native/run.sh && chmod +x build/matlab-native/run.sh

build/matlab-native:
	mkdir -p build/matlab-native

build/matlab-native/*.m: matlab/*.m ../../common/*.m
	cp matlab/*.m build/matlab-native/
	cp ../../common/*.m build/matlab-native/

build/matlab-native/run.sh: build/matlab-native build/matlab-native/*.m
	echo 'matlab '$(MATLAB_OPTIONS)' '\'$(MATLAB_NATIVE_RUN_ARGUMENT)\'' | '$(OUTPUT_FILTER) > build/matlab-native/run.sh && chmod +x build/matlab-native/run.sh

clean:
	rm -rf build
