#Benchmark List

##List
|ID | Benchmark | Status | Test |
|--------|--------|--------|--------|
|1 | back-prop  |  done  | The random value of `hidden_weights` is incorrect |
|2 | bfs | working | |
|3 | crc | | |
|4 | fft | done | About 112 seconds when n = 10 |
|5 | hmm | done | Tested |
|6 | lavamd |   | |
|7 | lud | done | Get different but correct result from MATLAB `lu` function |
|8 | nqueens| | |
|9 | nw | | |
|10| page-rank | done | Read data file `pagerank.data` |
|11| spmv | working | |
|12| srad | | |

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
In page-rank:

the precision of double is maximum 16-digits after dot.