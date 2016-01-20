function [res] = SafeShift(base, offset)
shift_max = 4294967295; % max unsigned int32
res = bitand(bitshift(base, offset), shift_max);
end