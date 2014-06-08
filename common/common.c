#include <string.h>
#include <stdlib.h>
#include <stdio.h>
#include <time.h>
#include <math.h>

#include "common.h"
#include "common_rand.h"

void stopwatch_start(stopwatch *sw){
    if (sw == NULL)
        return;

    bzero(&sw->begin, sizeof(struct timeval));
    bzero(&sw->end  , sizeof(struct timeval));

    gettimeofday(&sw->begin, NULL);
}

void stopwatch_stop(stopwatch *sw){
    if (sw == NULL)
        return;

    gettimeofday(&sw->end, NULL);
}

double
get_interval_by_sec(stopwatch *sw){
    if (sw == NULL)
        return 0;
    return ((double)(sw->end.tv_sec-sw->begin.tv_sec)+(double)(sw->end.tv_usec-sw->begin.tv_usec)/1000000);
}

int
get_interval_by_usec(stopwatch *sw){
    if (sw == NULL)
        return 0;
    return ((sw->end.tv_sec-sw->begin.tv_sec)*1000000+(sw->end.tv_usec-sw->begin.tv_usec));
}

