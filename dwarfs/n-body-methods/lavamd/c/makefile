SHELL := /bin/bash

EMCC = emcc -O2
CCOMP = clang -O3

C_C = $(EMCC)

# link objects (binaries) together
a.out:		main.o \
			./kernel/kernel_cpu.o \
			./util/num/num.o \
			./util/timer/timer.o
	$(CCOMP) main.o \
			 ./kernel/kernel_cpu.o \
			 ./util/num/num.o \
			 ./util/timer/timer.o \
			 -lm
            

# compile function files into objects (binaries)
main.o:		main.h \
			main.c \
			./kernel/kernel_cpu.h \
			./kernel/kernel_cpu.c \
			./util/num/num.h \
			./util/num/num.c \
			./util/timer/timer.h \
			./util/timer/timer.c
	$(CCOMP) main.c \
			 -c \
			 -o main.o

./kernel/kernel_cpu.o:	./kernel/kernel_cpu.h \
						./kernel/kernel_cpu.c
	$(CCOMP)     		./kernel/kernel_cpu.c \
						-c \
						-o ./kernel/kernel_cpu.o

./util/num/num.o:	./util/num/num.h \
					./util/num/num.c
	$(CCOMP)		./util/num/num.c \
					-c \
					-o ./util/num/num.o

./util/timer/timer.o:	./util/timer/timer.h \
						./util/timer/timer.c
	$(CCOMP)			./util/timer/timer.c \
						-c \
						-o ./util/timer/timer.o

# delete all object and executable files
clean:
	rm	*.o *.out \
		./kernel/*.o \
		./util/num/*.o \
		./util/timer/*.o
