SHELL := /bin/bash

include ../../common/options.mk

EMOPTIONS = -s TOTAL_MEMORY=400000000

EXPONENT = "10"
ASMJS_RUN_ARGUMENT = "'"$(EXPONENT)"'"
C_RUN_ARGUMENT = $(EXPONENT)
JS_RUN_ARGUMENT = "runFFT("$(EXPONENT)")"
FILENAME = "fft"

build: build/c/run.sh build/asmjs/run.html build/js/run.html build/opencl build/webcl build/js-nota/run.html build/pnacl/run.sh

build/c:
	mkdir -p build/c

# link objects (binaries) together
build/c/fft:	build/c \
            c/fft.c \
			c/main.c \
            common/common.c \
			common/complex_simple.c
	$(CCOMP) c/fft.c \
             c/main.c \
			 common/common.c \
			 ../../common/common_rand.c \
			 common/complex_simple.c \
			 -Icommon \
			 -I../../common \
			 -lm -o build/c/fft

build/c/run.sh: build/c/fft build/c
	echo 'build/c/fft '$(C_RUN_ARGUMENT) > build/c/run.sh && chmod +x build/c/run.sh

build/asmjs:
	mkdir -p build/asmjs

build/asmjs/fft.js: build/asmjs \
            c/fft.c \
			c/main.c \
			common/complex_simple.c \
            common/common.c
	$(EMCC) c/fft.c \
            c/main.c \
			common/common.c \
			../../common/common_rand.c \
			common/complex_simple.c \
			-Icommon \
			-I../../common \
			$(EMOPTIONS) -lm -o build/asmjs/fft.js

build/asmjs/run.html: build/asmjs \
            build/asmjs/fft.js
	cat ../../utils/asmjs/run_template.html > build/asmjs/run.html
	sed -i.bak s/FILENAME/$(FILENAME)/g build/asmjs/run.html
	sed -i.bak s/RUN_ARGUMENT/$(ASMJS_RUN_ARGUMENT)/g build/asmjs/run.html


build/js:
	mkdir -p build/js

build/js/fft.js:
	cp js/fft.js build/js/$(FILENAME).js

build/js/run.html: build/js build/js/fft.js
	cat ../../utils/js/run_template.html > build/js/run.html
	sed -i.bak s/FILENAME/$(FILENAME)/g build/js/run.html
	sed -i.bak s/RUN_ARGUMENT/$(JS_RUN_ARGUMENT)/g build/js/run.html

build/opencl:
	mkdir -p build/opencl

build/webcl:
	mkdir -p build/webcl


build/js-nota/run.html: js/fft.js
	mkdir -p build/js-nota/
	cp js/fft.js build/js-nota/$(FILENAME).js
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
