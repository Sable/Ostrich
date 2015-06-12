SHELL := /bin/bash

include ../../common/options.mk

EMOPTIONS = -s TOTAL_MEMORY=400000000

ASMJS_RUN_ARGUMENT = "'-v', 'n', '-n', '512'"
C_RUN_ARGUMENT = "-v n -n 512"
JS_RUN_ARGUMENT = "bwa_hmm('n', 512)"
MATLAB_NATIVE_RUN_ARGUMENT = "cd build/matlab-native/; bwa_hmm('n',60,2,1000); exit();"
WEBCL_CALL = "webclBWAHmm("$(OPENCL_PLATFORM)", "$(OPENCL_DEVICE)", 'n', 512)"
FILENAME = "hmm"

MATJUICE_SHAPES = "CHAR&1*1&STRING" "DOUBLE&1*1&REAL" "DOUBLE&1*1&REAL" "DOUBLE&1*1&REAL"
MATJUICE_ENTRY_FILE = bwa_hmm
MATJUICE_RUN_ARGUMENT = "bwa_hmm('n',60,2,1000)"
MATJUICE_FILES = "\n\
<script src='..\/..\/..\/..\/common\/matjuice_common.js'><\/script>\n\
<script src='.\/"$(MATJUICE_ENTRY_FILE)".js'><\/script>\n\
<script src='.\/calc_alpha.js'><\/script>\n\
<script src='.\/calc_beta.js'><\/script>\n\
<script src='.\/calc_gamma_sum.js'><\/script>\n\
<script src='.\/calc_xi_sum.js'><\/script>\n\
<script src='.\/estimate_a.js'><\/script>\n\
<script src='.\/estimate_b.js'><\/script>\n\
<script src='.\/estimate_pi.js'><\/script>\n\
<script src='.\/mat_vec_mul.js'><\/script>\n\
<script src='.\/run_hmm_bwa.js'><\/script>\n\
"

build: build/c/run.sh build/asmjs/run.html build/js/run.html build/opencl/run.sh build/webcl/run.html build/js-nota/run.html build/matlab/run.sh build/matjuice/run.html build/matlab-native/run.sh

build/c:
	mkdir -p build/c

# link objects (binaries) together
build/c/hmm:	build/c \
            c/main_bwa_hmm.c
	$(CCOMP) c/main_bwa_hmm.c \
			../../common/common.c \
			 ../../common/common_rand.c \
			 -I../../common \
			 -lm -o build/c/hmm

build/c/run.sh: build/c/hmm build/c
	echo 'build/c/hmm '$(C_RUN_ARGUMENT) > build/c/run.sh && chmod +x build/c/run.sh

build/asmjs:
	mkdir -p build/asmjs

build/asmjs/hmm.js: build/asmjs \
            c/main_bwa_hmm.c
	$(EMCC) c/main_bwa_hmm.c \
			../../common/common.c \
			../../common/common_rand.c \
			-I../../common \
			$(EMOPTIONS) -lm -o build/asmjs/hmm.js

build/asmjs/run.html: build/asmjs \
            build/asmjs/hmm.js
	cat ../../utils/asmjs/run_template.html > build/asmjs/run.html
	sed -i.bak s/FILENAME/$(FILENAME)/g build/asmjs/run.html
	sed -i.bak s/RUN_ARGUMENT/$(ASMJS_RUN_ARGUMENT)/g build/asmjs/run.html


build/js:
	mkdir -p build/js

build/js/hmm.js:
	cp js/bwa_hmm.js build/js/$(FILENAME).js

build/js/run.html: build/js build/js/hmm.js
	cat ../../utils/js/run_template.html > build/js/run.html
	sed -i.bak s/FILENAME/$(FILENAME)/g build/js/run.html
	sed -i.bak s/RUN_ARGUMENT/$(JS_RUN_ARGUMENT)/g build/js/run.html

build/opencl:
	mkdir -p build/opencl

build/opencl/hmm:
	$(CCOMP) -o build/opencl/hmm opencl/main_bwa_hmm.c ../../common/common.c ../../common/common_rand.c ../../common/common_args.c ../../common/opts/opts.c $(OPENCL_COMPILE_OPTIONS)  -I../../common/ -lm
	cp opencl/*.cl build/opencl/

build/opencl/run.sh: build/opencl build/opencl/hmm
	cp ../../utils/opencl/run_template.sh build/opencl/run.sh
	echo "./hmm -p $(OPENCL_PLATFORM) -d $(OPENCL_DEVICE) -- $(C_RUN_ARGUMENT)" >> build/opencl/run.sh
	chmod +x build/opencl/run.sh

build/webcl:
	mkdir -p build/webcl

build/webcl/run.html: build/webcl
	cp webcl/* build/webcl/
	mv build/webcl/index.html build/webcl/run.html
	cat ../../utils/webcl/template >> build/webcl/hmm.js
	sed -i.bak s/WEBCL_CALL/$(WEBCL_CALL)/ build/webcl/hmm.js


build/js-nota/run.html: js/bwa_hmm.js
	mkdir -p build/js-nota/
	cp js/bwa_hmm.js build/js-nota/$(FILENAME).js
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
