function [res] = bit_scan(x)
vec = [0,1,2,4,8,16];
res = 0;

res = bitor(res, vec(1 + 1*(bitand(x,2863311530) ~= 0))); %0xaaaaaaaa
res = bitor(res, vec(1 + 2*(bitand(x,3435973836) ~= 0))); %0xcccccccc
res = bitor(res, vec(1 + 3*(bitand(x,4042322160) ~= 0))); %0xf0f0f0f0
res = bitor(res, vec(1 + 4*(bitand(x,4278255360) ~= 0))); %0xff00ff00
res = bitor(res, vec(1 + 5*(bitand(x,4294901760) ~= 0))); %0xffff0000

res = res + 1; % for index offset in Matlab

end