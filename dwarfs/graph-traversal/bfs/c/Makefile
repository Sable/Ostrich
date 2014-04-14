# C compiler
CC = g++
CC_FLAGS = -g -fopenmp -O0

bfs:
	$(CC) $(CC_FLAGS) bfs.cpp -o bfs
	$(CC) $(CC_FLAGS) bfs_noio.cpp -o bfs_noio

clean:
	rm -f bfs bfs_noio result.txt
