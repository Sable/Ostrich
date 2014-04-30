# C compiler
CC = g++
CC_FLAGS = -Wall -Wextra -g -fopenmp -O3 -I../common

all: bfs

common_rand.o: ../common/common_rand.c
	$(CC) -Wall -Wextra -g -O3 -c ../common/common_rand.c -o ../common/common_rand.o

common.o: ../common/common.c
	$(CC) -Wall -Wextra -g -O3 -c ../common/common.c -o ../common/common.o

bfs: common.o common_rand.o bfs.cpp
	$(CC) $(CC_FLAGS) ../common/common.o ../common/common_rand.o bfs.cpp -o bfs

clean:
	rm -f bfs result.txt ../common/common_rand.o ../common/common.o
