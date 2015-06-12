SHELL := /bin/bash

include ../../common/options.mk

# Should be a power of 2
PAGE_SIZE = "65536"
NB_PAGES = "128"
NB_REPETITIONS = "150"

ASMJS_RUN_ARGUMENT = "'-n', '"$(NB_PAGES)"', '-s', '"$(PAGE_SIZE)"', '-r', '"$(NB_REPETITIONS)"'"
C_RUN_ARGUMENT = "-n "$(NB_PAGES)" -s "$(PAGE_SIZE)" -r "$(NB_REPETITIONS)
JS_RUN_ARGUMENT = "runCRC("$(NB_PAGES)","$(PAGE_SIZE)","$(NB_REPETITIONS)")"
MATLAB_RUN_ARGUMENT = "cd build/matlab/; runCRC("$(PAGE_SIZE)","$(NB_PAGES)","$(NB_REPETITIONS)"); exit();"
WEBCL_CALL = "webclCRC("$(OPENCL_PLATFORM)", "$(OPENCL_DEVICE)", "$(NB_PAGES)","$(PAGE_SIZE)","$(NB_REPETITIONS)")"
FILENAME = "crc"

MATJUICE_SHAPES = "DOUBLE&1*1&REAL" "DOUBLE&1*1&REAL" "DOUBLE&1*1&REAL"
MATJUICE_ENTRY_FILE = crc_ostrich
MATJUICE_RUN_ARGUMENT = "runCRC("$(PAGE_SIZE)","$(NB_PAGES)","$(NB_REPETITIONS)")"
MATJUICE_FILES = "\n\
<script src='..\/..\/..\/..\/common\/matjuice_common.js'><\/script>\n\
<script src='.\/runCRC.js'><\/script>\n\
<script src='.\/"$(MATJUICE_ENTRY_FILE)".js'><\/script>\n\
<script src='.\/crc32_8bytes.js'><\/script>\n\
"

build: build/c/run.sh build/asmjs/run.html build/js/run.html build/opencl/run.sh build/webcl/run.html build/js-nota/run.html build/matlab/run.sh build/matjuice/run.html build/matlab-native/run.sh

build/c:
	mkdir -p build/c

# link objects (binaries) together
build/c/crc: build/c c/crc_serial.c common/common.c common/crc_formats.c common/common_args_serial.c
	$(CCOMP) -I./common/ -I../../common/ ../../common/common_rand.c c/crc_serial.c common/common.c common/crc_formats.c common/common_args_serial.c -lm -o build/c/crc

build/c/run.sh: build/c/crc build/c
	echo 'build/c/crc '$(C_RUN_ARGUMENT) > build/c/run.sh && chmod +x build/c/run.sh

build/asmjs:
	mkdir -p build/asmjs

build/asmjs/crc.js: build/asmjs c/crc_serial.c common/common.c common/crc_formats.c common/common_args_serial.c
	$(EMCC) -I./common/ -I../../common/ ../../common/common_rand.c c/crc_serial.c common/common.c common/crc_formats.c common/common_args_serial.c -lm -o build/asmjs/crc.js

build/asmjs/run.html: build/asmjs build/asmjs/crc.js
	cat ../../utils/asmjs/run_template.html > build/asmjs/run.html
	sed -i.bak s/FILENAME/$(FILENAME)/g build/asmjs/run.html
	sed -i.bak s/RUN_ARGUMENT/$(ASMJS_RUN_ARGUMENT)/g build/asmjs/run.html


build/js:
	mkdir -p build/js

build/js/crc.js:
	cp js/crc.js build/js/

build/js/run.html: build/js build/js/crc.js
	cat ../../utils/js/run_template.html > build/js/run.html
	sed -i.bak s/FILENAME/$(FILENAME)/g build/js/run.html
	sed -i.bak s/RUN_ARGUMENT/$(JS_RUN_ARGUMENT)/g build/js/run.html

build/opencl:
	mkdir -p build/opencl

build/opencl/crc:
	$(CCOMP) -o build/opencl/crc opencl/crc_algo.c common/crc_formats.c common/opts/opts.c common/common.c  ../../common/common_args.c  ../../common/common_rand.c -Icommon -I../../common $(OPENCL_COMPILE_OPTIONS) -Llibm -lm -lstdc++
	cp opencl/*.cl build/opencl/
	cp common/*.h build/opencl

build/opencl/run.sh: build/opencl build/opencl/crc
	cp ../../utils/opencl/run_template.sh build/opencl/run.sh
	echo "./crc -p $(OPENCL_PLATFORM) -d $(OPENCL_DEVICE) -- $(C_RUN_ARGUMENT)" >> build/opencl/run.sh
	chmod +x build/opencl/run.sh

build/webcl:
	mkdir -p build/webcl

build/webcl/run.html: build/webcl
	cp webcl/* build/webcl/
	mv build/webcl/index.html build/webcl/run.html
	cat ../../utils/webcl/template >> build/webcl/crc.js
	sed -i.bak s/WEBCL_CALL/$(WEBCL_CALL)/ build/webcl/crc.js

build/js-nota/run.html: js/crc.js
	mkdir -p build/js-nota/
	cp js/crc.js build/js-nota/$(FILENAME).js
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
