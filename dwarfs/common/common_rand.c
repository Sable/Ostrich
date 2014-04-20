/*
Ported from V8 benchmark suite, original copyright:

// Copyright 2013 the V8 project authors. All rights reserved.
// Redistribution and use in source and binary forms, with or without
// modification, are permitted provided that the following conditions are
// met:
//
//     * Redistributions of source code must retain the above copyright
//       notice, this list of conditions and the following disclaimer.
//     * Redistributions in binary form must reproduce the above
//       copyright notice, this list of conditions and the following
//       disclaimer in the documentation and/or other materials provided
//       with the distribution.
//     * Neither the name of Google Inc. nor the names of its
//       contributors may be used to endorse or promote products derived
//       from this software without specific prior written permission.
//
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
// "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
// LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
// A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
// OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
// SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
// LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
// DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
// THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
// (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
// OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
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
