/*
 * The MIT License (MIT)
 *
 * Copyright (c) 2014, Erick Lavoie, Faiz Khan, Sujay Kathrotia, Vincent
 * Foley-Bourgon, Laurie Hendren
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

#define D_FACTOR (0.85)

__kernel void map_page_rank(__global int *pages,
    __global float *page_ranks,
    __global float *maps,
    __global unsigned int *noutlinks,
    int n){

    int i = get_global_id(0);

    int j;
    if(i < n){
      float outbound_rank = page_ranks[i]/(float)noutlinks[i];
      for(j=0; j<n; ++j){
          maps[i*n+j] = pages[i*n+j] == 0 ? 0.0f : pages[i*n+j]*outbound_rank;
      }
    }
}


__kernel void reduce_page_rank(__global float *page_ranks,
    __global float *maps,
    int n,
    __global float *dif){

    int j = get_global_id(0);
    int i;
    float new_rank;
    float old_rank;

    if(j<n){
      old_rank = page_ranks[j];
      new_rank = 0.0f;
      for(i=0; i< n; ++i){
          new_rank += maps[i*n + j];
      }

      new_rank = ((1-D_FACTOR)/n)+(D_FACTOR*new_rank);
      dif[j] = fabs(new_rank - old_rank) > dif[j] ? fabs(new_rank - old_rank) : dif[j];
      page_ranks[j] = new_rank;
    }
}
