SHELL := /bin/bash

include ../../common/options.mk

EMOPTIONS = -s TOTAL_MEMORY=450000000
MATLAB_OPTIONS = "-nodisplay -r "
OUTPUT_FILTER = "sed -n -e '/{/,/}/p'"

NB_INPUT_ELEMS = "2850000"
ASMJS_RUN_ARGUMENT = "['"$(NB_INPUT_ELEMS)"']"
C_RUN_ARGUMENT = $(NB_INPUT_ELEMS)
JS_RUN_ARGUMENT = "runBackProp("$(NB_INPUT_ELEMS)")"
MATLAB_RUN_ARGUMENT = "cd build/matlab/; runBackProp("$(NB_INPUT_ELEMS)"); exit();"
WEBCL_CALL = "webclbackprop("$(OPENCL_PLATFORM)", "$(OPENCL_DEVICE)", "$(NB_INPUT_ELEMS)")"
FILENAME = "backprop"

MATJUICE_SHAPES = "DOUBLE&1*1&REAL"
MATJUICE_ENTRY_FILE = facetrain
MATJUICE_RUN_ARGUMENT = "runBackProp("$(NB_INPUT_ELEMS)")"
MATJUICE_FILES = "\n\
<script src='..\/..\/..\/..\/common\/matjuice_common.js'><\/script>\n\
<script src='.\/runBackProp.js'><\/script>\n\
<script src='.\/"$(MATJUICE_ENTRY_FILE)".js'><\/script>\n\
<script src='.\/backprop.js'><\/script>\n\
<script src='.\/bpnn_adjust_weights.js'><\/script>\n\
<script src='.\/bpnn_hidden_error.js'><\/script>\n\
<script src='.\/bpnn_layerforward.js'><\/script>\n\
<script src='.\/bpnn_output_error.js'><\/script>\n\
"

build: build/c/run.sh build/asmjs/run.html build/js/run.html build/opencl/run.sh build/webcl/run.html build/js-nota/run.html build/matlab/run.sh build/matjuice/run.html build/matlab-native/run.sh

build/c:
	mkdir -p build/c

# link objects (binaries) together
build/c/backprop: build/c c/imagenet.c c/backprop_kernel.c c/backprop.c c/facetrain.c
	$(CCOMP) -I../../common/ ../../common/common.c ../../common/common_rand.c c/imagenet.c c/backprop_kernel.c c/backprop.c c/facetrain.c -lm -o build/c/backprop

build/c/run.sh: build/c/backprop build/c
	echo 'build/c/backprop '$(C_RUN_ARGUMENT) > build/c/run.sh && chmod +x build/c/run.sh

build/asmjs:
	mkdir -p build/asmjs

build/asmjs/data.js:
	cp data/data.js build/asmjs/data.js

build/asmjs/backprop.js: build/asmjs c/*.c c/*.h
	$(EMCC) -I../../common/ ../../common/common.c ../../common/common_rand.c c/imagenet.c c/backprop_kernel.c c/backprop.c c/facetrain.c -lm -o build/asmjs/backprop.js $(EMOPTIONS)

build/asmjs/run.html: build/asmjs \
            build/asmjs/backprop.js
	cat ../../utils/asmjs/run_template.html > build/asmjs/run.html
	sed -i.bak s/FILENAME/$(FILENAME)/g build/asmjs/run.html
	sed -i.bak s/RUN_ARGUMENT/$(ASMJS_RUN_ARGUMENT)/g build/asmjs/run.html

build/js:
	mkdir -p build/js

build/js/backprop.js:
	cp js/backprop.js build/js/$(FILENAME).js

build/js/run.html: build/js build/js/backprop.js
	cat ../../utils/js/run_template.html > build/js/run.html
	sed -i.bak s/FILENAME/$(FILENAME)/g build/js/run.html
	sed -i.bak s/RUN_ARGUMENT/$(JS_RUN_ARGUMENT)/g build/js/run.html

build/opencl:
	mkdir -p build/opencl

build/opencl/backprop:
	g++ -O3  -o build/opencl/backprop opencl/backprop_ocl.cpp opencl/backprop.c opencl/imagenet.c opencl/facetrain.c ../../common/common.c -I../../common $(OPENCL_COMPILE_OPTIONS)
	cp opencl/*.cl build/opencl/

build/opencl/run.sh: build/opencl build/opencl/backprop
	cp ../../utils/opencl/run_template.sh build/opencl/run.sh
	echo "./backprop -p $(OPENCL_PLATFORM) -d $(OPENCL_DEVICE) -n $(C_RUN_ARGUMENT)" >> build/opencl/run.sh
	chmod +x build/opencl/run.sh

build/webcl:
	mkdir -p build/webcl

build/webcl/run.html: build/webcl
	cp webcl/* build/webcl/
	mv build/webcl/index.html build/webcl/run.html
	cat ../../utils/webcl/template >> build/webcl/backprop.js
	sed -i.bak s/WEBCL_CALL/$(WEBCL_CALL)/ build/webcl/backprop.js


build/js-nota/run.html: js/backprop.js
	mkdir -p build/js-nota/
	cp js/backprop.js build/js-nota/$(FILENAME).js
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
