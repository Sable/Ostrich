COMMON_DIR = ../common

all: bfs.cpp
	em++ -s TOTAL_MEMORY=1000000000 -O2 -o bfs.js -I$(COMMON_DIR) $(COMMON_DIR)/common.c $(COMMON_DIR)/common_rand.c bfs.cpp

clean:
	rm -f bfs.js
