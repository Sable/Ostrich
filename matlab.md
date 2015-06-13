#Benchmark List

##List (Progress: 9/12)
|ID | Benchmark | Status | Compile Version | Test |
|--------|--------|--------|--------|--------|
|1 | back-prop  |  done  | done | The random value of `hidden_weights` is incorrect |
|2 | bfs | done | Pass | By Vincent |
|3 | crc | done | done  |A data file is created, `Lut.data` |
|4 | fft | done | done  |About 112 seconds when n = 10 |
|5 | hmm | done | done |Tested |
|6 | lavamd |   |  | |
|7 | lud | done | done |Get different but correct result from MATLAB `lu` function |
|8 | nqueens| done | Null | Tested, no random input, verification is simple. |
|9 | nw | done | done |Tested |
|10| page-rank | done | done |Read data file `pagerank.data` |
|11| spmv | done | done |`spmv_ostrich_loop` (0.168) is faster than `spmv_ostrich` (3.067) |
|12| srad | done | done  |precision problem in the expected result (expected output of 52608 but received 5.285761e+04 instead) |

## Updated on June 13, 2015
* Vincent completes `bfs` benchmark
* `nqueens` is tested (pass verification, correct MATLAB code) NO random input.

## Updated on June 12, 2015
* `spmv` is `spmvRun` in c, webcl ..., keep consistant in Matlab version, maybe change it later.
* Not sure about the char argument in `hmm`.  Is `"CHAR&1*1&STRING"` correct?

###Updated on June 08, 2015
* Crc has been tested with the data file, `Lut.data`.

###Updated on June 06, 2015
* Nw is tested with three data files (`*.data`) in the same directory.

###Updated on June 05, 2015
* Lud has three data files for value checking: row indices, column indices and expected value files.
* Page-rank has `pagerank.data` for data input (in the same directory, the same as Lud benchmark).
* Srad is feeded with a fixed size image matrix, `../data/image.pgm`. **NO random number** in this benchmark

###Random number
```matlab
% set rand seed
s = RandStream('mcg16807','Seed',49734321);
RandStream.setDefaultStream(s);
```


###Output
```matlab
msg = sprintf('{ \"status\": %d, \"options\": \"%d\", \"time\": %f seconds}\n', 1, two_exp, elapsedTime);
disp(msg);
```

### Problems
In page-rank: the precision of double is maximum 16-digits after dot.
