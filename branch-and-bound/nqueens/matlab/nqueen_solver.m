function [total_solutions,unique_solutions] = nqueen_solver(size, board_mask, mask, left_mask, right_mask)
N = 32;
masks       = zeros(1,N);
left_masks  = zeros(1,N);
right_masks = zeros(1,N);
ms          = zeros(1,N);
ns_array    = zeros(1,N);
board_array = ones(1,N);
forbidden   = zeros(1,N);

solutions       = 0;
total_solutions = 0;
border_mask     = 0;

masks(1)      = mask;
left_masks(1) = left_mask;
right_masks(1)= right_mask;
ms(1)         = bitor(bitor(mask, left_mask), right_mask);
ns_array(1)   = mask;

index = bit_scan(mask);

for j = 1:index-1
    border_mask = bitor(border_mask, SafeShift(1,j-1));
    border_mask = bitor(border_mask, SafeShift(1, size-j));
end

for k = 1:size
    if k == size - 1
        forbidden(k) = border_mask;
    elseif or(k+1 < index, k+1 > size-index+1)
        forbidden(k) = bitor(1, SafeShift(1, size-1));
    else
        forbidden(k) = 0;
    end
end

i = 1;
while i > 0
    m  = bitor(ms(i), forbidden(i));
    ns = bitand(m+1, bitcmp(m,N));
    
    if bitand(ns, board_mask) ~= 0
        ns_array(i+1) = ns;
        if (i == size - 1)
            repeat_times = 8;
            rotate1 = false;
            rotate2 = false;
            rotate3 = false;
            
            if ns_array(index) == SafeShift(1, size - 1);    rotate1 = true; end
            if ns_array(size - index + 1) == 1;              rotate2 = true; end
            if ns_array(size) == SafeShift(1, size - index); rotate3 = true; end
            
            if or(or(rotate1,rotate2),rotate3)
                for t = 1:size; board_array(t) = bit_scan(ns_array(t)); end %transform
                repeat_times = 8;
                equal    = true;
                min_pos  = size;
                relation = 0;
                if rotate1
                    equal = true;
                    relation = 0;
                    for j = 1:size
                        if board_array(size - board_array(j) + 1) ~= j
                            equal = false;
                            if min_pos >= size - board_array(j) + 1
                                relation = board_array(size - board_array(j) + 1) - j;
                                min_pos = size - board_array(j) + 1;
                            end
                        end
                    end
                    if equal; repeat_times = 2; end
                end
                
                if and(relation >= 0, rotate2) % rotate ccw
                    equal    = true;
                    min_pos  = size;
                    relation = 0;
                    for j = 1:size
                        if board_array(board_array(j)) ~= size - j + 1
                            equal = false;
                            if min_pos > board_array(j)
                                relation = board_array(board_array(j)) - (size - j + 1);
                                min_pos = board_array(j);
                            end
                        end
                    end
                    if equal; repeat_times = 2; end
                end
                
                if and(and(relation >= 0, repeat_times == 8), rotate3) %rotate 180
                    equal    = true;
                    min_pos  = size;
                    relation = 0;
                    for j = size + 1 - (1:ceil(size / 2))
                        if board_array(size - j + 1) ~= size - board_array(j) + 1
                            equal = false;
                            relation = board_array(size - j + 1) - (size - board_array(j) + 1);
                            break;
                        end
                    end
                    if equal; repeat_times = 4; end
                end
                total_solutions = total_solutions + (relation >= 0) * repeat_times;
                solutions = solutions + (relation >= 0);
            else
                total_solutions = total_solutions + 8;
                solutions = solutions + 1;
            end
            i = i - 1;
        else
            ms(i)           = bitor(ms(i), ns);
            masks(i+1)      = bitor(masks(i), ns);
            left_masks(i+1) = SafeShift(bitor(left_masks(i),ns),1);
            right_masks(i+1)= bitshift(bitor(right_masks(i),ns),-1);
            ms(i+1)         = bitor(bitor(masks(i+1), left_masks(i+1)), right_masks(i+1));
            i = i + 1;
        end
    else
        i = i - 1;
    end
end

unique_solutions = solutions;
end