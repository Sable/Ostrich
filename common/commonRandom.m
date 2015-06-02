function new_seed = commonRandom()
    global common_seed;
    common_seed = bitand(plus  (plus  (common_seed, 2127912214), bitshift(common_seed,  12)), 4294967295);
    common_seed = bitand(bitxor(bitxor(common_seed, 3345072700), bitshift(common_seed, -19)), 4294967295);
    common_seed = bitand(plus  (plus  (common_seed,  374761393), bitshift(common_seed,   5)), 4294967295);
    common_seed = bitand(bitxor(plus  (common_seed, 3550635116), bitshift(common_seed,   9)), 4294967295);
    common_seed = bitand(plus  (plus  (common_seed, 4251993797), bitshift(common_seed,   3)), 4294967295);
    common_seed = bitand(bitxor(bitxor(common_seed, 3042594569), bitshift(common_seed, -16)), 4294967295);
    new_seed = common_seed;
end

