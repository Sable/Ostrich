CC=gcc -O2 -Wall -Wextra -std=c99

all: main.c sepia.c
	$(CC) -c sepia.c
	$(CC) -c `pkg-config --cflags --libs MagickWand` main.c
	$(CC) -o sepia `pkg-config --cflags --libs MagickWand` main.o sepia.o

clean:
	rm -f sepia main.o sepia.o thomas2.jpg
