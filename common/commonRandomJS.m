function toReturn = commonRandomJS
    toReturn = commonRandom();
    toReturn = abs(double(toReturn) / 2147483647);
end