function [m] = lud_base_idiomatic(m,size)
for i = 1:size
    for j = i:size
        m(i,j) = m(i,j) - sum(m(i,1:i-1) * m(1:i-1,j));
    end
    for j = i+1:size
        m(j,i) = (m(j,i) - sum(m(j,1:i-1) * m(1:i-1,i))) / m(i,i);
    end
end
end

