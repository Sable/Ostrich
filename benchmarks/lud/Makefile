CURRENT_DIR=.
INDENT="--"

.PHONY:
all: runnable/all

#------------------- INPUT DATA GENERATION ----------------------------
SMALL_SIZE  = $(shell cat benchmark.json | utilities/json '.["input-size"].small')
MEDIUM_SIZE = $(shell cat benchmark.json | utilities/json '.["input-size"].medium')
LARGE_SIZE  = $(shell cat benchmark.json | utilities/json '.["input-size"].large')
INPUT_EXT   = $(shell cat benchmark.json | utilities/json '.["input-ext"]')

INPUT_PREFIX  = input
INPUT_SMALL   = $(CURRENT_DIR)/input/$(INPUT_PREFIX)-small.$(INPUT_EXT)
INPUT_MEDIUM  = $(CURRENT_DIR)/input/$(INPUT_PREFIX)-medium.$(INPUT_EXT)
INPUT_LARGE   = $(CURRENT_DIR)/input/$(INPUT_PREFIX)-large.$(INPUT_EXT)


.PHONY:
input/all: input input/small input/medium input/large

input:
	@mkdir -p $(CURRENT_DIR)/input

.PHONY:
input/small: $(INPUT_SMALL)
.PHONY:
input/medium: $(INPUT_MEDIUM)
.PHONY:
input/large: $(INPUT_LARGE)

$(INPUT_SMALL):
	@echo "$(INDENT)Generating small input data of size $(SMALL_SIZE)"
	@touch $(INPUT_SMALL) 

$(INPUT_MEDIUM):
	@echo "$(INDENT)Generating medium input data of size $(MEDIUM_SIZE)"
	@touch $(INPUT_MEDIUM)

$(INPUT_LARGE):
	@echo "$(INDENT)Generating large input data of size $(LARGE_SIZE)"
	@touch $(INPUT_LARGE)

#------------------- RUNNABLE BENCHMARK GENERATION --------------------
RUNNABLE_DIR=run
ifndef LANGUAGES
    LANGUAGES = $(shell cat benchmark.json | utilities/json ".languages" | json -a)
endif

$(RUNNABLE_DIR):
	@mkdir -p $(RUNNABLE_DIR)

.PHONY:
runnable/all: input/all $(RUNNABLE_DIR)
	@for l in $(LANGUAGES); do pushd $(CURRENT_DIR)/$$l >/dev/null; $(MAKE) RUNNABLE_DIR=$(RUNNABLE_DIR) INPUT_DIR=$(CURRENT_DIR)/input; popd >/dev/null; done

#------------------- CLEANUP ------------------------------------------
clean:
	@rm -rf input
	@for l in $(LANGUAGES); do pushd $(CURRENT_DIR)/$$l >/dev/null; $(MAKE) RUNNABLE_DIR=$(RUNNABLE_DIR) INPUT_DIR=$(CURRENT_DIR)/input clean; popd >/dev/null; done

