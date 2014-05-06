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
FILENAME = "bfs"

build: build/c/run.sh build/asmjs/run.html build/js/run.html build/opencl build/webcl

build/c:
	mkdir -p build/c

# link objects (binaries) together
build/c/bfs:	build/c \
                common/common.c \
                c/bfs.cpp
	$(CPPCOMP) -I../../common/ \
             -Icommon/ \
             ../../common/common_rand.c \
             common/common.c \
             c/bfs.cpp \
			 -lm -o build/c/bfs

build/c/run.sh: build/c/bfs build/c
	echo 'build/c/bfs '$(C_RUN_ARGUMENT) > build/c/run.sh && chmod +x build/c/run.sh
            
build/asmjs:
	mkdir -p build/asmjs

build/asmjs/bfs.js: build/asmjs \
                    common/common.c \
                    c/bfs.cpp
	$(EMCPP) -I../../common/ \
             -Icommon/ \
             ../../common/common_rand.c \
             common/common.c \
             c/bfs.cpp \
             $(EMOPTIONS) \
			 -lm -o build/asmjs/bfs.js

build/asmjs/run.html: build/asmjs \
            build/asmjs/bfs.js
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

build/webcl:
	mkdir -p build/webcl

clean:
	rm -rf build
