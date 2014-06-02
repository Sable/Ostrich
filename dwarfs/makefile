
BENCHMARKS = \
    branch-and-bound/nqueens/ \
    combinational-logic/crc/ \
    dense-linear-algebra/lud/ \
    dynamic-programming/nw/ \
    graph-traversal/bfs/ \
    graphical-models/hmm/ \
    map-reduce/page-rank/ \
    n-body-methods/lavamd/ \
    sparse-linear-algebra/spmv/ \
    spectral-methods/fft/ \
    structured-grid/SRAD/ \
    unstructured-grid/back-propagation/

all:
	for d in $(BENCHMARKS); do cd $$d && $(MAKE) && cd ../..; done

clean:
	for d in $(BENCHMARKS); do cd $$d && $(MAKE) clean && cd ../..; done

