#ifndef GRAPHICS_H
#define GRAPHICS_H

#ifdef __cplusplus
extern "C" {
#endif

void write_graphics(char* filename, fp* input, int data_rows, int data_cols, int major, int data_range);
void read_graphics(char* filename, fp* input, int data_rows, int data_cols, int major);

#ifdef __cplusplus
}
#endif

#endif
