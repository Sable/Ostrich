MATJUICE_NOBC_COMPILATION_OPTIONS = "--enable-bounds-checking=false"

.PHONY: matjuice/all
matjuice/all: build/matjuice/run.html build/matjuice-nobc/run.html

build/matjuice:
	mkdir -p build/matjuice

build/matjuice/common: build/matjuice
	mkdir -p build/matjuice/common

build/matjuice/$(MATJUICE_ENTRY_FILE).js: matlab/$(MATJUICE_ENTRY_FILE).m build/matjuice
	../../dependencies/matjuice/matjuice.sh matlab/$(MATJUICE_ENTRY_FILE).m build/matjuice/$(MATJUICE_ENTRY_FILE).js $(MATJUICE_SHAPES) 2>&1 >/dev/null

build/matjuice/*.m: matlab/*.m ../../common/*.m build/matjuice/common
	cp matlab/*.m build/matjuice/
	cp ../../common/*.m build/matjuice/

build/matjuice/common/*.js:  build/matjuice ../../common/*.js matjuice/*.js
	cp ../../common/*.js build/matjuice/common/
	cp matjuice/*.js build/matjuice/common/

build/matjuice/run.html: ../../utils/matjuice/run_template.html build/matjuice/*.m build/matjuice/$(MATJUICE_ENTRY_FILE).js build/matjuice/common/*.js 
	cat ../../utils/matjuice/run_template.html > build/matjuice/run.html
	sed -i.bak s/MATJUICE_FILES/$(MATJUICE_FILES)/g build/matjuice/run.html
	sed -i.bak s/RUN_ARGUMENT/$(MATJUICE_RUN_ARGUMENT)/g build/matjuice/run.html


build/matjuice-nobc:
	mkdir -p build/matjuice-nobc

build/matjuice-nobc/run.html: build/matjuice-nobc/*  build/matjuice/run.html build/matjuice-nobc/$(MATJUICE_ENTRY_FILE).js build/matjuice/common/*.js

build/matjuice-nobc/*: build/matjuice-nobc build/matjuice/run.html
	cp build/matjuice/*.m build/matjuice-nobc/
	cp -r build/matjuice/common/ build/matjuice-nobc/common
	cp build/matjuice/*.html build/matjuice-nobc/

build/matjuice-nobc/$(MATJUICE_ENTRY_FILE).js: matlab/$(MATJUICE_ENTRY_FILE).m build/matjuice-nobc
	../../dependencies/matjuice/matjuice.sh $(MATJUICE_NOBC_COMPILATION_OPTIONS) matlab/$(MATJUICE_ENTRY_FILE).m build/matjuice-nobc/$(MATJUICE_ENTRY_FILE).js $(MATJUICE_SHAPES) 2>&1 >/dev/null

