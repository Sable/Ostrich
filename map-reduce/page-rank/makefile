SHELL := /bin/bash

include ../../common/options.mk

# Original options used by Vince
EMOPTIONS = -s TOTAL_MEMORY=400000000
NB_PAGES = "5000"
NB_ITERATIONS = "10"
THRESHOLD = "0.00000001"
DIVISOR = "100000"

ASMJS_RUN_ARGUMENT = "'-n', '"$(NB_PAGES)"', '-i', '"$(NB_ITERATIONS)"', '-t', '"$(THRESHOLD)"', '-q', '"$(DIVISOR)"'"
C_RUN_ARGUMENT = "-n "$(NB_PAGES)" -i "$(NB_ITERATIONS)" -t "$(THRESHOLD)" -q "$(DIVISOR)
JS_RUN_ARGUMENT = "runPageRank("$(NB_PAGES)", "$(NB_ITERATIONS)", "$(THRESHOLD)", "$(DIVISOR)")"
MATLAB_NATIVE_RUN_ARGUMENT = "cd build/matlab-native/; runPageRank("$(NB_PAGES)","$(NB_ITERATIONS)","$(THRESHOLD)","$(DIVISOR)"); exit();"
WEBCL_CALL = "webclPR("$(OPENCL_PLATFORM)", "$(OPENCL_DEVICE)", "$(NB_PAGES)", "$(NB_ITERATIONS)", "$(THRESHOLD)", "$(DIVISOR)")"
FILENAME = "pagerank"

MATJUICE_SHAPES = "DOUBLE&1*1&REAL" "DOUBLE&1*1&REAL" "DOUBLE&1*1&REAL" "DOUBLE&1*1&REAL"
MATJUICE_ENTRY_FILE = pagerank
MATJUICE_RUN_ARGUMENT = "runPageRank("$(NB_PAGES)","$(NB_ITERATIONS)","$(THRESHOLD)","$(DIVISOR)")"
MATJUICE_FILES = "\n\
<script src='..\/..\/..\/..\/common\/matjuice_common.js'><\/script>\n\
<script src='.\/runPageRank.js'><\/script>\n\
<script src='.\/"$(MATJUICE_ENTRY_FILE)".js'><\/script>\n\
"

build: build/c/run.sh build/asmjs/run.html build/js/run.html build/opencl/run.sh build/webcl/run.html build/js-nota/run.html build/matlab/run.sh build/matjuice/run.html build/matlab-native/run.sh

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
