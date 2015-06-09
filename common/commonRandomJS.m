function toReturn = commonRandomJS
    toReturn = commonRandom();
    MAXINT32VALUE = 2147483647;
    toReturn = abs(double(toReturn) / double(MAXINT32VALUE));
end
