/*
    Ported from V8 benchmark suite.    
*/
unsigned int _common_seed = 49734321;

void common_srand(unsigned int seed) {
    _common_seed = seed;
}

int common_rand() {
    // Robert Jenkins' 32 bit integer hash function.
    _common_seed = ((_common_seed + 0x7ed55d16) + (_common_seed << 12))  & 0xffffffff;
    _common_seed = ((_common_seed ^ 0xc761c23c) ^ (_common_seed >> 19)) & 0xffffffff;
    _common_seed = ((_common_seed + 0x165667b1) + (_common_seed << 5))   & 0xffffffff;
    _common_seed = ((_common_seed + 0xd3a2646c) ^ (_common_seed << 9))   & 0xffffffff;
    _common_seed = ((_common_seed + 0xfd7046c5) + (_common_seed << 3))   & 0xffffffff;
    _common_seed = ((_common_seed ^ 0xb55a4f09) ^ (_common_seed >> 16)) & 0xffffffff;
    return _common_seed;
}
