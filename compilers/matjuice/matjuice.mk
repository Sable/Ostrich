MATJUICE_NOBC_COMPILATION_OPTIONS = "--enable-bounds-checking=false"

.PHONY: matjuice/all
matjuice/all: build/matjuice/run.html build/matjuice-nobc/run.html

build/matjuice:
	mkdir -p build/matjuice

build/matjuice/$(MATJUICE_ENTRY_FILE).js: matlab/$(MATJUICE_ENTRY_FILE).m build/matjuice
	../../dependencies/matjuice/matjuice.sh matlab/$(MATJUICE_ENTRY_FILE).m build/matjuice/$(MATJUICE_ENTRY_FILE).js $(MATJUICE_SHAPES) 2>&1 >/dev/null

build/matjuice/run.html: ../../utils/matjuice/run_template.html build/matjuice/$(MATJUICE_ENTRY_FILE).js $(MATJUICE_FILES)
	cat $(MATJUICE_FILES) build/matjuice/$(MATJUICE_ENTRY_FILE).js > build/matjuice/matjuice_lib.js
	cat ../../utils/matjuice/run_template.html > build/matjuice/run.html
	sed -i.bak s/RUN_ARGUMENT/$(MATJUICE_RUN_ARGUMENT)/g build/matjuice/run.html

build/matjuice-nobc:
	mkdir -p build/matjuice-nobc

build/matjuice-nobc/run.html:  build/matjuice/run.html build/matjuice-nobc/$(MATJUICE_ENTRY_FILE).js $(MATJUICE_FILES)
	cp build/matjuice/run.html build/matjuice-nobc/
	cat $(MATJUICE_FILES) build/matjuice-nobc/$(MATJUICE_ENTRY_FILE).js > build/matjuice-nobc/matjuice_lib.js

build/matjuice-nobc/$(MATJUICE_ENTRY_FILE).js: matlab/$(MATJUICE_ENTRY_FILE).m build/matjuice-nobc
	../../dependencies/matjuice/matjuice.sh $(MATJUICE_NOBC_COMPILATION_OPTIONS) matlab/$(MATJUICE_ENTRY_FILE).m build/matjuice-nobc/$(MATJUICE_ENTRY_FILE).js $(MATJUICE_SHAPES) 2>&1 >/dev/null

