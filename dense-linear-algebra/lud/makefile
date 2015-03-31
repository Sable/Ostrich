SHELL := /bin/bash

include ../../common/options.mk

EMOPTIONS = -s TOTAL_MEMORY=400000000

SIZE = "1024"
ASMJS_RUN_ARGUMENT = "'-s', '"$(SIZE)"'"
C_RUN_ARGUMENT = "-s "$(SIZE)
JS_RUN_ARGUMENT = "ludRun("$(SIZE)")"
WEBCL_CALL = "webclLUD("$(OPENCL_PLATFORM)", "$(OPENCL_DEVICE)", "$(SIZE)")"
FILENAME = "lud"

build: build/c/run.sh build/asmjs/run.html build/js/run.html build/opencl/run.sh build/webcl/run.html build/js-nota/run.html build/pnacl/run.sh

build/c:
	mkdir -p build/c

# link objects (binaries) together
build/c/lud:	build/c \
            c/lud.c \
			c/lud_base.c \
            common/common.c
	$(CCOMP) c/lud.c \
             c/lud_base.c \
			 common/common.c \
			 ../../common/common_rand.c \
			 -Icommon \
			 -I../../common \
			 -lm -o build/c/lud

build/c/run.sh: build/c/lud build/c
	echo 'build/c/lud '$(C_RUN_ARGUMENT) > build/c/run.sh && chmod +x build/c/run.sh

build/asmjs:
	mkdir -p build/asmjs

build/asmjs/lud.js: build/asmjs \
            c/lud.c \
			c/lud_base.c \
            common/common.c
	$(EMCC) c/lud.c \
            c/lud_base.c \
			common/common.c \
			../../common/common_rand.c \
			-Icommon \
			-I../../common \
			$(EMOPTIONS) -lm -o build/asmjs/lud.js

build/asmjs/run.html: build/asmjs \
            build/asmjs/lud.js
	cat ../../utils/asmjs/run_template.html > build/asmjs/run.html
	sed -i.bak s/FILENAME/$(FILENAME)/g build/asmjs/run.html
	sed -i.bak s/RUN_ARGUMENT/$(ASMJS_RUN_ARGUMENT)/g build/asmjs/run.html


build/js:
	mkdir -p build/js

build/js/lud.js:
	cp js/lud.js build/js/$(FILENAME).js

build/js/run.html: build/js build/js/lud.js
	cat ../../utils/js/run_template.html > build/js/run.html
	sed -i.bak s/FILENAME/$(FILENAME)/g build/js/run.html
	sed -i.bak s/RUN_ARGUMENT/$(JS_RUN_ARGUMENT)/g build/js/run.html

build/opencl:
	mkdir -p build/opencl

build/opencl/lud:
	g++ -O3 -o build/opencl/lud opencl/lud.cpp common/common.c ../../common/common_rand.c $(OPENCL_COMPILE_OPTIONS) -Icommon/ -I../../common/ -Llibm
	cp opencl/*.cl build/opencl/

build/opencl/run.sh: build/opencl build/opencl/lud
	cp ../../utils/opencl/run_template.sh build/opencl/run.sh
	echo "./lud -p $(OPENCL_PLATFORM) -d $(OPENCL_DEVICE) $(C_RUN_ARGUMENT)" >> build/opencl/run.sh
	chmod +x build/opencl/run.sh

build/webcl:
	mkdir -p build/webcl

build/webcl/run.html: build/webcl
	cp webcl/* build/webcl/
	mv build/webcl/index.html build/webcl/run.html
	cat ../../utils/webcl/template >> build/webcl/lud.js
	sed -i.bak s/WEBCL_CALL/$(WEBCL_CALL)/ build/webcl/lud.js


build/js-nota/run.html: js/lud.js
	mkdir -p build/js-nota/
	cp js/lud.js build/js-nota/$(FILENAME).js
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
	echo '$(NACL_SDK_ROOT)/tools/sel_ldr.py build/pnacl/run.nexe -- '$(C_RUN_ARGUMENT) > build/pnacl/run.sh && chmod +x build/pnacl/run.sh

clean:
	rm -rf build
	make -C nacl clean
