function runLud(matrix_dim,version,do_verify,debug,self_check)
% runs the LUD benchmark
%     'matrix_dim' is the size of the square matrix being generated
%     'version'    is the version of lud to use, possible values are:
%         0:  (base) direct translation from the C version
%         1:  (idiomatic) replaces the innermost loop in C with a 'sum' function call
%         2:  (native) directly calls the native implementation of LUD in Matlab
%     'do_verify': can be 0 (does not verify the result) or 1 (verify that the result of multiplying the L and U matrices gives back the original matrix
%     'debug'       1 to print additional debugging information, 0 otherwise
%     'self_check'  1 to perform benchmark self-check, 0 otherwise (defaults to 1)

expected_row_indices = [691 10 360 37 163 516 63 36 862 336 861 549 534 959 318 515 415 334 538 421 348 934 357 715 959 649 392 537 45 966 424 963 745 435 569 464 981 906 189 542 618 217 313 528 761 518 639 149 757 607 175 984 31 221 722 1002 688 356 983 931 535 759 178 61 842 368 23 630 469 260 328 806 492 502 161 751 421 665 631 842 543 115 770 591 511 636 795 260 10 716 843 861 470 243 732 145 981 371 345 599];

expected_col_indices = [314 911 274 223 525 34 804 725 981 850 791 771 129 678 634 288 805 710 985 451 538 440 755 678 395 345 362 162 419 584 1018 46 627 242 964 621 553 605 494 460 555 700 16 927 48 581 675 310 835 460 841 62 24 778 625 416 766 871 192 186 626 108 524 664 955 772 585 776 746 778 119 919 505 893 548 170 361 566 979 441 742 892 260 906 731 945 580 297 94 499 930 49 110 904 342 660 237 1 735 476];

expected_values = [-22.848189418846398979213 ... 
0.486575877054862770965 2.350990332002380611698 0.255936778601883629936 ...
0.369716886989750581627 0.436167974270290970118 0.146278341558460728278 ...
0.065941041612251782844 -3.293335001426441976946 1.676757766030180007988 ...
0.914670926671572570577 -1.449165223810348734901 -4.062626991062644243868 ...
8.053719449216675485559 -0.802856897069948227674 1.286258895854830219818 ...
1.046663620982626996536 0.484603780235753345274 2.177434960082209158827 ...
-0.076253507783682866750 1.756722536293205738644 0.540981804186463688389 ...
1.160877339446317879634 -0.500662762448355613820 -0.315089287598811773616 ...
1.487745379848905757925 -0.151896246268855089623 0.656797241815350263394 ...
0.400712960066768264511 0.701017197177835504895 21.239255832148906222301 ...
0.385402388730710976361 0.827099588440812327761 3.322857338786085801274 ...
4.566630782122058640482 1.723268967613441171594 -0.245335815889943242851 ...
3.310282619080586741234 0.365940908008368537274 0.573872758815816563782 ...
-7.288906901332710575048 0.038431167008329936152 0.028831025599041319729 ...
16.551345012895176012080 0.572626610991005424722 -5.040356494551264887605 ...
3.074688991682028138541 0.509559370036213876709 1.344846005445668346567 ...
-0.899161793412182497320 1.450843036958202159070 0.707012750727151084718 ...
0.155740946804082569521 -20.622119724330712386973 0.310740831317683263713 ...
4.021615405596988601644 0.832891886091167044093 1.736708056130134680828 ...
1.908346944066334094359 6.004850895670037047580 -16.157750602775347914530 ...
0.163978793796913130398 -0.062671443842940877111 0.929108185567632416380 ...
2.490843964912780705845 -0.066104762308228259826 0.386981072535134362766 ...
-0.823938825980013334060 0.526846622283516752283 -0.272223830142624412254 ...
0.378414255255514475618 -0.465486599242579401903 -0.420333065592308097180 ...
-4.672003607431108207493 0.901549254898271534842 -0.684091977355238745062 ...
4.398443774587856403002 0.065205826885363540879 5.423729935594375106689 ...
-0.608124968949819821873 -45.149928055289088035806 0.244564514518492037709 ...
-4.507925769188863895920 56.208587041192998867700 -6.848970386253027342605 ...
1.248317846059819657967 0.457962760205558649940 0.577264680902939586460 ...
0.987432966002931178373 -24.973096779128248101642 -2.795692544319765548977 ...
0.158278067517842180312 0.339449080878009679108 1.889684533467393734441 ...
2.543604357651815917052 5.205758093407768960503 -0.241207430471430422925 ...
0.660969548700828801735 1.781811506239100006965 1.750625326806120041212];

expected_input_values = [...
0.481573149786131970984 0.301748808388446920770 0.340183073820948256305 ...
0.180649106785259638830 0.431881071961759344102 0.436196878628739070916 ...
0.269685438940934441021 0.310521185448687342401 0.332082255015251515129 ...
0.405592626389080113114];


if nargin < 1
   error('Missing matrix_dim argument\n');
end

if nargin < 2
    version = 'base';
end

if nargin < 3
    do_verify = 0;
end

if nargin < 4
    debug = 0;
end

if nargin < 5
    self_check = 1;
end

if matrix_dim > 1
    if debug
        fprintf(2,'Generating matrix of size %d x %d\n', matrix_dim, matrix_dim);
    end

    filename = strcat('input-data-', num2str(matrix_dim), '.csv');
    filepath = fullfile(cd, '../data/', filename);
    if exist(filepath)
        m = dlmread(filepath,',');

        % Sanity check for data
        for i=1:10
            if m(i) ~= expected_input_values(i)
                error('Invalid cached data\n');
                exit(1);
            end
        end
    else 
        m = createMatrixFromRandom(matrix_dim, debug);
        dlmwrite(filepath, m, 'precision', '%.21f');
    end

    if debug
        for i=1:matrix_dim
            for j=1:matrix_dim
                fprintf(2, '%.*f ', 6, m(i,j));
            end
            fprintf(2, '\n');
        end
    end
else
    error('No valid matrix size specified!\n');
end

if version == 1 
    if debug
        fprintf(2, 'computing LUD with vectorized operations\n');
    end 
    tic
    res = lud_base_idiomatic(m,matrix_dim);
elseif version == 2
    if debug
        fprintf(2, 'computing LUD with the MATLAB standard library function\n');
    end
    tic
    res = lu(m);
else
    if debug
        fprintf(2, 'computing LUD with the C implementation literally translated to MATLAB\n');
    end
    tic
    res = lud_base(m,matrix_dim);
end
elapsedTime = toc;

if do_verify ~= 0
    lud_verify(m, res, matrix_dim);
end


if matrix_dim == 1024
    % Convert to linear indexing
    idx = sub2ind([1024,1024],expected_row_indices,expected_col_indices);
    if and(self_check==1, expected_values ~= res(idx))
        first_differing_idx = find(expected_values ~= res(idx), 1);
        fprintf(2, 'ERROR: value at index (%d,%d) = \"%.*f\" is different from the expected value \"%.*f\"\n',...
            expected_row_indices(first_differing_idx),...
            expected_col_indices(first_differing_idx),...
            21, res(first_differing_idx),...
            21, expected_values(first_differing_idx)...
        );
        exit(1);
    end
else 
    if debug
        fprintf(2, 'WARNING: No self-checking step for dimension \"%d\"\n', matrix_dim);
    end
end

fprintf(1, '{ \"status\": %d, \"options\": \"matrix_dim %d\", \"time\": %f }\n', 1, matrix_dim, elapsedTime);
end

