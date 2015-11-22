RUN_DIR=run
SHORT_NAME      = $(shell cat implementation.json | json '.["short-name"]')
RUNNER_SCRIPT   = $(shell cat implementation.json | json '.["runner-script"]')
EXECUTABLE_NAME = $(shell cat implementation.json | json '.["executable-name"]')

RUNNER_SCRIPT_PATH = $(RUN_DIR)/$(SHORT_NAME)/$(RUNNER_SCRIPT)
EXECUTABLE_PATH    = $(RUN_DIR)/$(SHORT_NAME)/$(EXECUTABLE_NAME)

RUN_ARGUMENTS = "TODO!!!"


.PHONY:
all:
	@echo '' >/dev/null

$(RUN_DIR)/$(SHORT_NAME):
	mkdir -p $(RUN_DIR)

$(EXECUTABLE_PATH): $(RUN_DIR)/$(SHORT_NAME)


$(RUNNER_SCRIPT_PATH): $(EXECUTABLE_PATH) 
	echo $(EXECUTABLE_PATH)' '$(RUN_ARGUMENTS) > $(RUNNER_SCRIPT_PATH) && chmod +x $(RUNNER_SCRIPT_PATH) 

clean:

