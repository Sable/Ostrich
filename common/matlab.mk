MATLAB_OPTIONS = "-nodisplay -nodesktop -r "
MATLAB_OUTPUT_FILTER = "grep status"

MATLAB_FULL_RUN_ARGUMENT = "cd build/matlab/; "$(MATLAB_RUN_ARGUMENT)"; exit();"
MATLAB_NATIVE_FULL_RUN_ARGUMENT = "cd build/matlab-native/; "$(MATLAB_NATIVE_RUN_ARGUMENT)"; exit();"

MATLAB_RUN_FILES = "build/matlab/run.sh build/matlab-native/run.sh"

.PHONY: matlab/all
matlab/all: build/matlab/run.sh build/matlab-native/run.sh

build/matlab:
	mkdir -p build/matlab

build/matlab/*.m: matlab/*.m ../../common/*.m
	cp matlab/*.m build/matlab/
	cp ../../common/*.m build/matlab/

build/matlab/run.sh: build/matlab build/matlab/*.m
	echo 'matlab '$(MATLAB_OPTIONS)' '\'$(MATLAB_FULL_RUN_ARGUMENT)\'' | '$(MATLAB_OUTPUT_FILTER) > build/matlab/run.sh && chmod +x build/matlab/run.sh
    
build/matlab-native:
	mkdir -p build/matlab-native

build/matlab-native/run.sh: build/matlab-native build/matlab-native/*.m
	echo 'matlab '$(MATLAB_OPTIONS)' '\'$(MATLAB_NATIVE_FULL_RUN_ARGUMENT)\'' | '$(MATLAB_OUTPUT_FILTER) > build/matlab-native/run.sh && chmod +x build/matlab-native/run.sh

build/matlab-native/*.m: matlab/*.m ../../common/*.m
	cp matlab/*.m build/matlab-native/
	cp ../../common/*.m build/matlab-native/
