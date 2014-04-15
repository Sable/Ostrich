SHELL := /bin/bash

CCOMP = gcc -O3
EMCC = emcc -O2

SIZE = "16"
ASMJS_RUN_ARGUMENT = "'-s', '"$(SIZE)"'"
C_RUN_ARGUMENT = "-s "$(SIZE)
JS_RUN_ARGUMENT = "runNQueens("$(SIZE)")"
FILENAME = "nqueens"

build: build/c/run.sh build/asmjs/run.html build/js/run.html build/opencl build/webcl

build/c:
	mkdir -p build/c

# link objects (binaries) together
build/c/nqueens:	build/c \
            c/main.c \
			c/nqueen_cpu.c \
            common/common.c
	$(CCOMP) c/main.c \
             c/nqueen_cpu.c \
			 common/common.c \
			 -lm -o build/c/nqueens

build/c/run.sh: build/c/nqueens build/c
	echo 'build/c/nqueens '$(C_RUN_ARGUMENT) > build/c/run.sh && chmod +x build/c/run.sh
            
build/asmjs:
	mkdir -p build/asmjs

build/asmjs/nqueens.js: build/asmjs \
            c/main.c \
			c/nqueen_cpu.c \
            common/common.c
	$(EMCC) c/main.c \
             c/nqueen_cpu.c \
			 common/common.c \
			 -lm -o build/asmjs/nqueens.js

build/asmjs/run.html: build/asmjs \
            build/asmjs/nqueens.js
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

build/webcl:
	mkdir -p build/webcl

clean:
	rm -rf build
