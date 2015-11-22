function value = commonRandom(common_seed)
    global common_seed;

    if isempty(common_seed)
        setRandomSeed();
    end

    % Note: Contrary to C, the plus operation in MATLAB max out at the
    %       highest possible value representable using the current data
    %       type rather than 'wrapping around' (which is equivalent to
    %       keeping only the least significant bits).
    %       We therefore simulate the behaviour of C by using unsigned ints
    %       with more bits. The most significant bits get masked out with
    %       the bitwise and operation on everyline.
    common_seed = bitand(plus  (plus  (common_seed, 2127912214), bitshift(common_seed,  12)), uint64(4294967295));
    common_seed = bitand(bitxor(bitxor(common_seed, 3345072700), bitshift(common_seed, -19)), uint64(4294967295));
    common_seed = bitand(plus  (plus  (common_seed,  374761393), bitshift(common_seed,   5)), uint64(4294967295));
    common_seed = bitand(bitxor(plus  (common_seed, 3550635116), bitshift(common_seed,   9)), uint64(4294967295));
    common_seed = bitand(plus  (plus  (common_seed, 4251993797), bitshift(common_seed,   3)), uint64(4294967295));
    common_seed = bitand(bitxor(bitxor(common_seed, 3042594569), bitshift(common_seed, -16)), uint64(4294967295));
    % Split the value in two uint32
    uint_value = typecast(common_seed, 'uint32');
    % Extract the least significant bits and reinterpret them as a signed 
    % integer
    value = typecast(uint_value(1), 'int32');
end
