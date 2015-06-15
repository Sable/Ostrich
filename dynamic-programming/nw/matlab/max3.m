function y = max3(a, b, c)
  if a > b
    y = a;
  else
    y = b;
  end

  if c > y
    y = c;
  end
end
