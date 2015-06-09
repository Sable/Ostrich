function crc_ostrich(page_size,num_pages,num_execs)
if mod(page_size, 8) ~= 0
    disp('Unsupported page size of ');
    disp(page_size);
    disp(' please choose a page size that is a multiple of 8');
    return ;
end

num_words = page_size / 4;
seed      = 4294967295;
h_num     = randi(seed, num_pages, page_size); %rand_crc
crcs      = zeros(1, num_pages);

% crc32Lookup file input ==> rand
crc32Lookup = randi(seed,8,256);

tic
for j = 1:num_execs
    for i = 1:num_pages
        h_sta = (i - 1) * num_words + 1;
        h_end = h_sta + num_words - 1;
        crcs(i) = crc32_8bytes(h_num(h_sta:h_end), page_size, crc32Lookup);
    end
    final_crc = crc32_8bytes(crcs(1:num_pages), 4 * num_pages, crc32Lookup);
end
elapsedTime = toc;

disp('{');
disp(' "status": 1,');
disp(' "options": ');
disp('"');
disp(' -n'); disp(num_pages);
disp(' -s'); disp(page_size);
disp(' -r'); disp(num_execs);
disp('",');
disp(' "time": ');
disp(elapsedTime);
disp('}');

end