SHELL := /bin/bash

CCOMP = gcc -O3
EMCC = emcc -O2

NB_BOXES = "6"
JS_RUN_ARGUMENT = "'-boxes1d', '"$(NB_BOXES)"'"
C_RUN_ARGUMENT = "-boxes1d "$(NB_BOXES)
FILENAME = "lavamd"

build: build/c/lavamd build/asmjs/run.html build/opencl build/webcl

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
			 -lm -o build/c/lavamd

build/c/run.sh: build/c/lavamd
	echo 'build/c/lavamd '$(C_RUN_ARGUMENT) > build/c/run.sh
            
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
			 -lm -o build/asmjs/lavamd.js

build/asmjs/run.html: build/asmjs \
            build/asmjs/lavamd.js
	cat ../../utils/asmjs/run_template.html > build/asmjs/run.html
	sed -i.bak s/FILENAME/$(FILENAME)/g build/asmjs/run.html 
	sed -i.bak s/RUN_ARGUMENT/$(JS_RUN_ARGUMENT)/g build/asmjs/run.html 
            

build/js:
	mkdir -p build/js

build/opencl:
	mkdir -p build/opencl

build/webcl:
	mkdir -p build/webcl

clean:
	rm -rf build
