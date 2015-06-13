function [solutions] = nqueen_solver1(size, idx)
N             = 32;
ms            = zeros(1,N);
solutions     = 0;
masks         = zeros(1,N);
left_masks    = zeros(1,N);
right_masks   = zeros(1,N);

masks(1)      = bitor(1, SafeShift(1, idx-1));
left_masks(1) = bitor(bitshift(1,2), SafeShift(1, idx));
right_masks(1)= bitshift(SafeShift(1,idx-1),-1);
ms(1) = bitor(bitor(masks(1),left_masks(1)), right_masks(1));

board_mask = SafeShift(1,size) - 1;

i = 1;
while i > 0
    m = bitor(ms(i), ((i+1) < idx) * 2);
    ns = bitand(m+1, bitcmp(m,N));
    if bitand(ns, board_mask) ~= 0
        if i == size - 2
            solutions = solutions + 1;
            i = i - 1;
        else
            ms(i) = bitor(ms(i), ns);
            masks(i+1) = bitor(masks(i), ns);
            left_masks(i+1) = SafeShift(bitor(left_masks(i), ns), 1);
            right_masks(i+1)= bitshift(bitor(right_masks(i),ns),-1);
            ms(i+1) = bitor(bitor(masks(i+1),left_masks(i+1)),right_masks(i+1));
            i = i + 1;
        end
    else
        i = i - 1;
    end
end

end