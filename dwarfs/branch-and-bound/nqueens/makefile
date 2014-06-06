SHELL := /bin/bash

include ../../common/options.mk

SIZE = "16"
ASMJS_RUN_ARGUMENT = "'-s', '"$(SIZE)"'"
C_RUN_ARGUMENT = "-s "$(SIZE)
JS_RUN_ARGUMENT = "runNQueens("$(SIZE)")"
WEBCL_CALL = "webclNQ("$(OPENCL_PLATFORM)", "$(OPENCL_DEVICE)", "$(SIZE)")"
FILENAME = "nqueens"

build: build/c/run.sh build/asmjs/run.html build/js/run.html build/opencl/run.sh build/webcl/run.html build/js-nota/run.html

build/c:
	mkdir -p build/c

# link objects (binaries) together
build/c/nqueens: build/c c/main.c c/nqueen_cpu.c common/common.c
	$(CCOMP) c/main.c c/nqueen_cpu.c common/common.c -lm -o build/c/nqueens

build/c/run.sh: build/c/nqueens build/c
	echo 'build/c/nqueens '$(C_RUN_ARGUMENT) > build/c/run.sh && chmod +x build/c/run.sh

build/asmjs:
	mkdir -p build/asmjs

build/asmjs/nqueens.js: build/asmjs  c/main.c  c/nqueen_cpu.c  common/common.c
	$(EMCC) c/main.c c/nqueen_cpu.c common/common.c -lm -o build/asmjs/nqueens.js

build/asmjs/run.html: build/asmjs build/asmjs/nqueens.js
	cat ../../utils/asmjs/run_template.html > build/asmjs/run.html
	sed -i.bak s/FILENAME/$(FILENAME)/g build/asmjs/run.html
	sed -i.bak s/RUN_ARGUMENT/$(ASMJS_RUN_ARGUMENT)/g build/asmjs/run.html


build/js:
	mkdir -p build/js

build/js/nqueens.js:
	cp js/nqueens.js build/js/

build/js/run.html: build/js build/js/nqueens.js
	cat ../../utils/js/run_template.html > build/js/run.html
	sed -i.bak s/FILENAME/$(FILENAME)/g build/js/run.html
	sed -i.bak s/RUN_ARGUMENT/$(JS_RUN_ARGUMENT)/g build/js/run.html

build/opencl:
	mkdir -p build/opencl

build/opencl/nqueens: build/opencl opencl/main.cpp opencl/nqueen_cpu.cpp opencl/nqueen_cl.cpp common/opts/opts.c common/common.c
	$(CCOMP) -o build/opencl/nqueens opencl/nqueen_cpu.cpp opencl/main.cpp opencl/nqueen_cl.cpp common/opts/opts.c common/common.c ../../common/common_args.c  -Icommon -I../../common $(OPENCL_COMPILE_OPTIONS) -lm -lstdc++
	cp opencl/kernels_nqueens.cl build/opencl/

build/opencl/run.sh: build/opencl build/opencl/nqueens
	cp ../../utils/opencl/run_template.sh build/opencl/run.sh
	echo "./nqueens -p $(OPENCL_PLATFORM) -d $(OPENCL_DEVICE) -- $(SIZE)" >> build/opencl/run.sh
	chmod +x build/opencl/run.sh

build/webcl:
	mkdir -p build/webcl

build/webcl/run.html: build/webcl
	cp webcl/* build/webcl/
	mv build/webcl/index.html build/webcl/run.html
	cat ../../utils/webcl/template >> build/webcl/nqueens.js
	sed -i.bak s/WEBCL_CALL/$(WEBCL_CALL)/ build/webcl/nqueens.js

build/js-nota/run.html: js/nqueens.js
	mkdir -p build/js-nota/
	cp js/nqueens.js build/js-nota/$(FILENAME).js
	perl -i.bak -n -e 'if (/TA$$/) { print } else { s/\w+Array/Array/; print }' build/js-nota/$(FILENAME).js
	cat ../../utils/js/run_template.html > build/js-nota/run.html
	sed -i.bak s/FILENAME/$(FILENAME)/g build/js-nota/run.html
	sed -i.bak s/RUN_ARGUMENT/$(JS_RUN_ARGUMENT)/g build/js-nota/run.html



clean:
	rm -rf build
