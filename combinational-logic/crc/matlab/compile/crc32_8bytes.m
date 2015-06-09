function [rtn] = crc32_8bytes(data, length, crc32Lookup)
cur = 1;
crc = 4294967295;  %hex value 0xFFFFFFFF
while length >= 8
    one = bitxor(data(cur), crc);
    two = data(cur+1);
    bit = 255; %hex value 0xFF
    cur = cur + 2;
    crc0= bitxor(crc32Lookup(8, 1+bitand(one, bit)),              crc32Lookup(7, 1+bitand(bitshift(one,-8),bit)));
    crc1= bitxor(crc32Lookup(6, 1+bitand(bitshift(one,-16),bit)), crc32Lookup(5, 1+bitshift(one,-24)));
    crc2= bitxor(crc32Lookup(4, 1+bitand(two,bit)),               crc32Lookup(3, 1+bitand(bitshift(two,-8),bit)));
    crc3= bitxor(crc32Lookup(2, 1+bitand(bitshift(two,-16),bit)), crc32Lookup(1, 1+bitshift(two,-24)));
    crc = bitxor(crc0, bitxor(crc1, bitxor(crc2, crc3)));
    length = length - 8;
end

for i = cur:length
    crc = bitxor(shift(crc, -8), crc32Lookup(1, bitxor(bitand(crc,bit), data(i))));
end

rtn = bitcmp(crc, 32); % ~crc

end