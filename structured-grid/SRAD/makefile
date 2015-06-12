SHELL := /bin/bash

include ../../common/options.mk

EMOPTIONS = -s TOTAL_MEMORY=400000000

NB_REPETITIONS = "500"
LAMBDA = "1"
ASMJS_RUN_ARGUMENT = "['"$(NB_REPETITIONS)"', '"$(LAMBDA)"'].concat(data)"
C_RUN_ARGUMENT = $(NB_REPETITIONS)" "$(LAMBDA)
JS_RUN_ARGUMENT = "runSRAD("$(NB_REPETITIONS)","$(LAMBDA)")"
MATLAB_NATIVE_RUN_ARGUMENT = "cd build/matlab-native/; runSRAD("$(NB_REPETITIONS)","$(LAMBDA)"); exit();"
WEBCL_CALL = "webclsrad("$(OPENCL_PLATFORM)", "$(OPENCL_DEVICE)", "$(NB_REPETITIONS)","$(LAMBDA)")"
FILENAME = "srad"

PREAMBLE = "<script src=\"data.js\"><\/script>"

MATJUICE_SHAPES = "DOUBLE&1*1&REAL" "DOUBLE&1*1&REAL"
MATJUICE_ENTRY_FILE = srad_ostrich
MATJUICE_RUN_ARGUMENT = runSRAD("$(NB_REPETITIONS)","$(LAMBDA)")
MATJUICE_FILES = "\n\
<script src='..\/..\/..\/..\/common\/matjuice_common.js'><\/script>\n\
<script src='.\/runSRAD.js'><\/script>\n\
<script src='.\/"$(MATJUICE_ENTRY_FILE)".js'><\/script>\n\
"

build: build/c/run.sh build/asmjs/run.html build/js/run.html build/opencl/run.sh build/webcl/run.html build/js-nota/run.html build/matlab/run.sh build/matjuice/run.html build/matlab-native/run.sh

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
	gcc -O3 -Wall -o build/opencl/srad opencl/main.c opencl/util/timer/timer.c opencl/util/graphics/resize.c opencl/util/graphics/graphics.c opencl/kernel/kernel_gpu_opencl_wrapper.c opencl/util/opencl/opencl.c -I../../common/ $(OPENCL_COMPILE_OPTIONS) -lm
	cp opencl/kernel/*.cl build/opencl/kernel/
	cp opencl/main.h build/opencl/

build/opencl/run.sh: build/opencl build/opencl/srad
	cp -r data build/opencl/
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
