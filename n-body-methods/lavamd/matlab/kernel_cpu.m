function [fv] = kernel_cpu(alpha, dim_number_boxes, box_offset, box_nn, box_nei_number, rv, qv, fv, NUMBER_PAR_PER_BOX)
a2 = 2 * alpha * alpha;

for u = 1:dim_number_boxes
    first_i = box_offset(u);
    for k = 1: 1 + box_nn(u)
        if k == 1
            pointer = u;
        else
            pointer = 1 + box_nei_number(u, k-1);
        end
        first_j = box_offset(pointer);
        
        for i = 1:NUMBER_PAR_PER_BOX
            for j = 1:NUMBER_PAR_PER_BOX
                real_i = first_i + i;
                real_j = first_j + j;
                r2 = rv(1, real_i) + rv(1, real_j) - ... %v
                    (rv(2, real_i) * rv(2, real_j) + ... %x
                     rv(3, real_i) * rv(3, real_j) + ... %y
                     rv(4, real_i) * rv(4, real_j));     %z
                 u2 = a2 * r2;
                 vij = exp(-u2);
                 fs = 2 * vij;
                 d_x = rv(2, real_i) - rv(2, real_j); %x
                 d_y = rv(3, real_i) - rv(3, real_j); %y
                 d_z = rv(4, real_i) - rv(4, real_j); %z
                 fxij = fs * d_x;
                 fyij = fs * d_y;
                 fzij = fs * d_z;
                 
                 fv(1, real_i) = fv(1, real_i) + qv(j) * vij;  %v
                 fv(2, real_i) = fv(2, real_i) + qv(j) * fxij; %x
                 fv(3, real_i) = fv(3, real_i) + qv(j) * fyij; %y
                 fv(4, real_i) = fv(4, real_i) + qv(j) * fzij; %z
            end
        end
    end
end

end