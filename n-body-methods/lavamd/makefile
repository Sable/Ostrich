SHELL := /bin/bash

include ../../common/options.mk

NB_BOXES = "6"
ASMJS_RUN_ARGUMENT = "'-boxes1d', '"$(NB_BOXES)"'"
C_RUN_ARGUMENT = "-boxes1d "$(NB_BOXES)
JS_RUN_ARGUMENT = "runLavaMD("$(NB_BOXES)")"
FILENAME = "lavamd"

build: build/c/run.sh build/asmjs/run.html build/js/run.html build/opencl build/webcl build/js-nota/run.html build/pnacl/run.sh

build/c:
	mkdir -p build/c

# link objects (binaries) together
build/c/lavamd:	build/c \
			c/main.c \
			c/kernel/kernel_cpu.h \
			c/kernel/kernel_cpu.c \
			c/util/num/num.h \
			c/util/num/num.c \
			c/util/timer/timer.h \
			c/util/timer/timer.c
	$(CCOMP) c/main.c \
			 c/kernel/kernel_cpu.c \
             c/util/num/num.c \
			 c/util/timer/timer.c \
			 -I../../common \
			 ../../common/common_rand.c \
			 -lm -o build/c/lavamd

build/c/run.sh: build/c/lavamd build/c
	echo './build/c/lavamd '$(C_RUN_ARGUMENT) > build/c/run.sh && chmod +x build/c/run.sh

build/asmjs:
	mkdir -p build/asmjs

build/asmjs/lavamd.js: build/asmjs \
			c/main.c \
			c/kernel/kernel_cpu.h \
			c/kernel/kernel_cpu.c \
			c/util/num/num.h \
			c/util/num/num.c \
			c/util/timer/timer.h \
			c/util/timer/timer.c
	$(EMCC) ./c/main.c \
			 ./c/kernel/kernel_cpu.c \
             ./c/util/num/num.c \
			 ./c/util/timer/timer.c \
			 -I../../common \
			 ../../common/common_rand.c \
			 -lm -o build/asmjs/lavamd.js

build/asmjs/run.html: build/asmjs \
            build/asmjs/lavamd.js
	cat ../../utils/asmjs/run_template.html > build/asmjs/run.html
	sed -i.bak s/FILENAME/$(FILENAME)/g build/asmjs/run.html
	sed -i.bak s/RUN_ARGUMENT/$(ASMJS_RUN_ARGUMENT)/g build/asmjs/run.html

build/js:
	mkdir -p build/js

build/js/lavamd.js: build/js
	cp js/lavamd.js build/js/lavamd.js

build/js/run.html: build/js build/js/lavamd.js
	cat ../../utils/js/run_template.html > build/js/run.html
	sed -i.bak s/FILENAME/$(FILENAME)/g build/js/run.html
	sed -i.bak s/RUN_ARGUMENT/$(JS_RUN_ARGUMENT)/g build/js/run.html


build/opencl:
	mkdir -p build/opencl

build/webcl:
	mkdir -p build/webcl


build/js-nota/run.html: js/lavamd.js
	mkdir -p build/js-nota/
	cp js/lavamd.js build/js-nota/$(FILENAME).js
	perl -i.bak -n -e 'if (/TA$$/) { print } else { s/\w+Array/Array/; print }' build/js-nota/$(FILENAME).js
	cat ../../utils/js/run_template.html > build/js-nota/run.html
	sed -i.bak s/FILENAME/$(FILENAME)/g build/js-nota/run.html
	sed -i.bak s/RUN_ARGUMENT/$(JS_RUN_ARGUMENT)/g build/js-nota/run.html

build/pnacl:
	mkdir -p build/pnacl
 	 
build/pnacl/run.nexe: build/pnacl
	make -C nacl
	$(HOME)/400/nacl_sdk/pepper_39/toolchain/linux_pnacl/bin/pnacl-translate -arch x86-64 -o build/pnacl/run.nexe nacl/pnacl/Release/pnacl_runner.pexe
 	 
build/pnacl/run.sh: build/pnacl/run.nexe
	echo '$(HOME)/400/nacl_sdk/pepper_39/tools/sel_ldr.py build/pnacl/run.nexe -- '$(C_RUN_ARGUMENT) > build/pnacl/run.sh && chmod +x build/pnacl/run.sh 

clean:
	rm -rf build
	make -C nacl clean
