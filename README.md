Ostrich Benchmark Suite
==========================

Ostrich is a benchmark suite developed in the [Sable Lab](http://www.sable.mcgill.ca/) at [McGill University](//www.mcgill.ca/) with the objective of studying the performance of languages used for numerical computing.

The main design goals of the suite are:
 1. **Consistency** and **Correctness** by providing self-checking runners for every language that automatically ensure that the computation result of the benchmarks are consistent across all language implementations and correct with regard to the algorithm for known inputs;
 2. **Representativity** of the most important and popular numerical algorithms and a proper choice of representative input data;
 3. **Breadth** of support for both languages and benchmarks by simplifying its extension and maintenance across numerical languages and benchmarks;
 4. **Easy exploration of compilation strategies** by factorizing the core computation from the runners to minimize the non-core functions necessary to validate the output of compilers;
 5. **Ease of use** by automating the deployment of benchmarks, their test on virtual (web browser and others) and native platforms, as well as the gathering and reporting of relative performance data;

Getting Started
------------------------
Please [read our wiki](../../wiki) for more details on obtaining the suite, description of the benchmarks and instruction on running the benchmarks.

Copyright and License
-------------------------
Copyright (c) 2014, Erick Lavoie, Faiz Khan, Sujay Kathrotia, Vincent Foley-Bourgon, Laurie Hendren and McGill University.

- Ostrich: [MIT Licence](LICENSE)
- OpenDwarfs: [GNU Lesser General Public License](//github.com/opendwarfs/OpenDwarfs/blob/master/LICENSE)
- Rodinia: [Rodinia Licence](//www.cs.virginia.edu/~sc5nf/license.htm)
- V8: [BSD 3 Licence](//developers.google.com/v8/terms)
