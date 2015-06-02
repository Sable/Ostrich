function [y] = mat_vec_mul(trans,m,n,a,lda,x,offsetx,y,offsety)
if and(trans ~= 'n', trans ~= 't')
    return
end

if lda == m
    n_size = n;
    m_size = m;
else
    n_size = m;
    m_size = n;
end

if trans == 'n'
    for i = 1:m_size
        idx_a0 = (i - 1) * n_size + 1;
        idx_a1 = idx_a0 + n_size - 1;
        idx_b0 = offsetx + 1;
        idx_b1 = idx_b0 + n_size - 1;
        y(offsety + i) = sum(a(idx_a0:idx_a1) .* x(idx_b0:idx_b1));
    end
else
    for i = 1:m_size
        val = 0;
        for j = 1:n_size
            val = val + a((j-1) * n_size + i) * x(offsetx + j);
        end
        y(offsety + i) = val;
    end
end
end