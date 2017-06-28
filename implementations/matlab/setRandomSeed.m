function setRandomSeed(seed)
    global common_seed;
    if nargin < 1
        common_seed = uint64(49734321);
    else
        common_seed = uint64(seed);
    end
end
