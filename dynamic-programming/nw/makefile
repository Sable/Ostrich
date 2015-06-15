SHELL := /bin/bash

include ../../common/options.mk

EMOPTIONS = -s TOTAL_MEMORY=400000000

DIMENSIONS = "4096"
PENALTY = "1"
ASMJS_RUN_ARGUMENT = "'-n', '"$(DIMENSIONS)"', '-g', '"$(PENALTY)"'"
C_RUN_ARGUMENT = "-n "$(DIMENSIONS)" -g "$(PENALTY)
JS_RUN_ARGUMENT = "runNeedle("$(DIMENSIONS)","$(PENALTY)")"
MATLAB_RUN_ARGUMENT = "cd build/matlab/; nw_ostrich("$(DIMENSIONS)","$(PENALTY)"); exit();"
WEBCL_CALL = "webclNeedle("$(OPENCL_PLATFORM)", "$(OPENCL_DEVICE)", "$(DIMENSIONS)","$(PENALTY)")"
FILENAME = "needle"

OUTPUT_FILTER = "grep status"

MATJUICE_SHAPES = "DOUBLE&1*1&REAL" "DOUBLE&1*1&REAL"
MATJUICE_ENTRY_FILE = nw_ostrich
MATJUICE_RUN_ARGUMENT = "runNeedle("$(DIMENSIONS)","$(PENALTY)")"
MATJUICE_FILES = "\n\
<script src='..\/..\/..\/..\/common\/matjuice_common.js'><\/script>\n\
<script src='.\/runNeedle.js'><\/script>\n\
<script src='.\/"$(MATJUICE_ENTRY_FILE)".js'><\/script>\n\
"

build: build/c/run.sh build/asmjs/run.html build/js/run.html build/opencl/run.sh build/webcl/run.html build/js-nota/run.html build/matlab/run.sh build/matjuice/run.html build/matlab-native/run.sh matjuice_build

build/c:
	mkdir -p build/c

# link objects (binaries) together
build/c/needle:	build/c \
            c/needle.c
	$(CCOMP) c/needle.c \
			 ../../common/common_rand.c \
			 -I../../common \
			 -lm -o build/c/needle

build/c/run.sh: build/c/needle build/c
	echo 'build/c/needle '$(C_RUN_ARGUMENT) > build/c/run.sh && chmod +x build/c/run.sh

build/asmjs:
	mkdir -p build/asmjs

build/asmjs/needle.js: build/asmjs \
            c/needle.c
	$(EMCC) c/needle.c \
			../../common/common_rand.c \
			-I../../common \
			$(EMOPTIONS) -lm -o build/asmjs/needle.js

build/asmjs/run.html: build/asmjs \
            build/asmjs/needle.js
	cat ../../utils/asmjs/run_template.html > build/asmjs/run.html
	sed -i.bak s/FILENAME/$(FILENAME)/g build/asmjs/run.html
	sed -i.bak s/RUN_ARGUMENT/$(ASMJS_RUN_ARGUMENT)/g build/asmjs/run.html


build/js:
	mkdir -p build/js

build/js/needle.js:
	cp js/needle.js build/js/$(FILENAME).js

build/js/run.html: build/js build/js/needle.js
	cat ../../utils/js/run_template.html > build/js/run.html
	sed -i.bak s/FILENAME/$(FILENAME)/g build/js/run.html
	sed -i.bak s/RUN_ARGUMENT/$(JS_RUN_ARGUMENT)/g build/js/run.html

build/opencl:
	mkdir -p build/opencl

build/opencl/needle:
	$(CCOMP) -o build/opencl/needle opencl/needle.c ../../common/common.c ../../common/common_rand.c ../../common/common_args.c ../../common/opts/opts.c $(OPENCL_COMPILE_OPTIONS)  -I../../common/ -lm
	cp opencl/*.cl build/opencl/

build/opencl/run.sh: build/opencl build/opencl/needle
	cp ../../utils/opencl/run_template.sh build/opencl/run.sh
	echo "./needle -p $(OPENCL_PLATFORM) -d $(OPENCL_DEVICE) -- $(C_RUN_ARGUMENT)" >> build/opencl/run.sh
	chmod +x build/opencl/run.sh

build/webcl:
	mkdir -p build/webcl

build/webcl/run.html: build/webcl
	cp webcl/* build/webcl/
	mv build/webcl/index.html build/webcl/run.html
	cat ../../utils/webcl/template >> build/webcl/needle.js
	sed -i.bak s/WEBCL_CALL/$(WEBCL_CALL)/ build/webcl/needle.js


build/js-nota/run.html: js/needle.js
	mkdir -p build/js-nota/
	cp js/needle.js build/js-nota/$(FILENAME).js
	perl -i.bak -n -e 'if (/TA$$/) { print } else { s/\w+Array/Array/; print }' build/js-nota/$(FILENAME).js
	cat ../../utils/js/run_template.html > build/js-nota/run.html
	sed -i.bak s/FILENAME/$(FILENAME)/g build/js-nota/run.html
	sed -i.bak s/RUN_ARGUMENT/$(JS_RUN_ARGUMENT)/g build/js-nota/run.html

build/matlab:
	mkdir -p build/matlab

build/matlab/*.m: matlab/*.m ../../common/*.m
	cp -r matlab/* build/matlab/
	cp ../../common/*.m build/matlab/

build/matlab/run.sh: build/matlab build/matlab/*.m
	echo 'matlab -nodesktop -nosplash -r '$(MATLAB_OPTIONS)' '\'$(MATLAB_RUN_ARGUMENT)\'' | '$(OUTPUT_FILTER) > build/matlab/run.sh && chmod +x build/matlab/run.sh

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
	cp -r matlab/* build/matlab-native/
	cp ../../common/*.m build/matlab-native/

build/matlab-native/run.sh: build/matlab-native build/matlab-native/*.m
	echo 'matlab '$(MATLAB_OPTIONS)' '\'$(MATLAB_NATIVE_RUN_ARGUMENT)\'' | '$(OUTPUT_FILTER) > build/matlab-native/run.sh && chmod +x build/matlab-native/run.sh

build/matlab-native:
	mkdir -p build/matlab-native

build/matlab-native/*.m: matlab/*.m ../../common/*.m
	cp -r matlab/* build/matlab-native/
	cp ../../common/*.m build/matlab-native/

build/matlab-native/run.sh: build/matlab-native build/matlab-native/*.m
	echo 'matlab '$(MATLAB_OPTIONS)' '\'$(MATLAB_NATIVE_RUN_ARGUMENT)\'' | '$(OUTPUT_FILTER) > build/matlab-native/run.sh && chmod +x build/matlab-native/run.sh

clean:
	rm -rf build

matjuice_build:
	mkdir -p build/matjuice
	cp ../../common/matjuice_common.js build/matjuice
	cp matlab/needle.m build/matjuice
	cp matlab/max3.m build/matjuice
	cp matjuice/* build/matjuice
	MCLAB_CORE_PATH=$(HOME)/workspace/mclab-core matjuice.sh --enable-bounds-checking=false --rename-array-indexing=true build/matjuice/needle.m build/matjuice/needle.js "DOUBLE&1*1&REAL" "DOUBLE&1*1&REAL" "DOUBLE&1*1&REAL" "DOUBLE&?*1&REAL" "DOUBLE&?*1&REAL" "DOUBLE&?*?&REAL" "DOUBLE&?*?&REAL" "DOUBLE&24*24&REAL"
