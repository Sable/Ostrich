SHELL := /bin/bash

include ../../common/options.mk

# Original options used by Vince
#EMOPTIONS = -s TOTAL_MEMORY=1000000000
#NB_NODES = "4194304"
EMOPTIONS = -s TOTAL_MEMORY=400000000
NB_NODES = "3000000"

ASMJS_RUN_ARGUMENT = "'"$(NB_NODES)"'"
C_RUN_ARGUMENT = $(NB_NODES)
JS_RUN_ARGUMENT = "BFSGraph("$(NB_NODES)")"
WEBCL_CALL = "webclBFS("$(OPENCL_PLATFORM)", "$(OPENCL_DEVICE)", "$(NB_NODES)")"
FILENAME = "bfs"

build: build/c/run.sh build/asmjs/run.html build/js/run.html build/opencl/run.sh build/webcl/run.html build/js-nota/run.html build/pnacl/run.sh

build/c:
	mkdir -p build/c

# link objects (binaries) together
build/c/bfs: build/c common/common.c c/bfs.cpp
	$(CCOMP) -c ../../common/common_rand.c -o build/c/common_rand.o
	$(CCOMP) -c common/common.c -o build/c/common.o
	$(CPPCOMP) -DRUN_MAIN -I../../common/ -Icommon/ build/c/common_rand.o build/c/common.o c/bfs.cpp -lm -o build/c/bfs

build/c/run.sh: build/c/bfs build/c
	echo 'build/c/bfs '$(C_RUN_ARGUMENT) > build/c/run.sh && chmod +x build/c/run.sh

build/asmjs:
	mkdir -p build/asmjs

build/asmjs/bfs.js: build/asmjs common/common.c c/bfs.cpp
	$(EMCPP) -I../../common/ -Icommon/ ../../common/common_rand.c common/common.c c/bfs.cpp $(EMOPTIONS) -o build/asmjs/bfs.js

build/asmjs/run.html: build/asmjs build/asmjs/bfs.js
	cat ../../utils/asmjs/run_template.html > build/asmjs/run.html
	sed -i.bak s/FILENAME/$(FILENAME)/g build/asmjs/run.html
	sed -i.bak s/RUN_ARGUMENT/$(ASMJS_RUN_ARGUMENT)/g build/asmjs/run.html

build/js:
	mkdir -p build/js

build/js/bfs.js:
	cp js/bfs.js build/js/

build/js/run.html: build/js build/js/bfs.js
	cat ../../utils/js/run_template.html > build/js/run.html
	sed -i.bak s/FILENAME/$(FILENAME)/g build/js/run.html
	sed -i.bak s/RUN_ARGUMENT/$(JS_RUN_ARGUMENT)/g build/js/run.html

build/opencl:
	mkdir -p build/opencl

build/opencl/bfs:
	$(CCOMP) -o build/opencl/opts.o -c ../../common/opts/opts.c $(OPENCL_COMPILE_OPTIONS) -I../../common/ -Llibm
	$(CCOMP) -o build/opencl/common_args.o -c ../../common/common_args.c $(OPENCL_COMPILE_OPTIONS) -I../../common/ -Llibm
	g++ -O3 -o build/opencl/bfs opencl/bfs.cpp ../../common/common.c ../../common/common_rand.c build/opencl/*.o $(OPENCL_COMPILE_OPTIONS) -I../../common/ -Llibm
	cp opencl/*.cl build/opencl/

build/opencl/run.sh: build/opencl build/opencl/bfs
	cp ../../utils/opencl/run_template.sh build/opencl/run.sh
	echo "./bfs  -p $(OPENCL_PLATFORM) -d $(OPENCL_DEVICE) -- $(C_RUN_ARGUMENT)" >> build/opencl/run.sh
	chmod +x build/opencl/run.sh

build/webcl:
	mkdir -p build/webcl

build/webcl/run.html: build/webcl
	cp webcl/* build/webcl/
	mv build/webcl/index.html build/webcl/run.html
	cat ../../utils/webcl/template >> build/webcl/bfs.js
	sed -i.bak s/WEBCL_CALL/$(WEBCL_CALL)/ build/webcl/bfs.js


build/js-nota/run.html: js/bfs.js
	mkdir -p build/js-nota/
	cp js/bfs.js build/js-nota/$(FILENAME).js
	perl -i.bak -n -e 'if (/TA$$/) { print } else { s/\w+Array/Array/; print }' build/js-nota/$(FILENAME).js
	cat ../../utils/js/run_template.html > build/js-nota/run.html
	sed -i.bak s/FILENAME/$(FILENAME)/g build/js-nota/run.html
	sed -i.bak s/RUN_ARGUMENT/$(JS_RUN_ARGUMENT)/g build/js-nota/run.html


build/pnacl:
	mkdir -p build/pnacl

build/pnacl/run.nexe: build/pnacl
	make -C nacl
	$(NACL_SDK_ROOT)/toolchain/linux_pnacl/bin/pnacl-translate -arch x86-64 -o build/pnacl/run.nexe nacl/pnacl/Release/pnacl_runner.pexe

build/pnacl/run.sh: build/pnacl/run.nexe
	echo '$(NACL_SDK_ROOT)/tools/sel_ldr.py build/pnacl/run.nexe '$(C_RUN_ARGUMENT) > build/pnacl/run.sh && chmod +x build/pnacl/run.sh

clean:
	rm -rf build
	make -C nacl clean
