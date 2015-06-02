function [m] = lud_base(m,size)
for i = 1:size
    for j = i:size
        temp = m(i,j);
        for k = 1:i-1
            temp = temp - m(i,k) * m(k,j);
        end
        m(i,j) = temp;
        %m(i,j) = m(i,j) - sum(m(i,1:i-1) * m(1:i-1,j));
    end
    for j = i+1:size
        temp = m(j,i);
        for k = 1:i-1
            temp = temp - m(j,k) * m(k,i);
        end
        m(j,i) = temp / m(i,i);
        %m(j,i) = sum(m(j,1:i-1) * m(1:i-1,i)) / m(i,i);
    end
end
end