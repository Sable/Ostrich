Ostrich Benchmark Suite
==========================

Ostrich is a benchmark suite developed in the [Sable Lab](http://www.sable.mcgill.ca/) at [McGill University](//www.mcgill.ca/) with the objective of studying the performance of languages used for numerical computing.

We aim to make the suite:
 1. **Consistent** and **Correct** by providing self-checking runners for every language that automatically ensure that the computation result of the benchmarks are consistent across all language implementations and correct with regard to the algorithm for known inputs;
 2. **Representative** of the most important and popular numerical algorithms with a proper choice of representative input data with a wide range of benchmarks across known numerical categories ([Dwarfs](http://www.eecs.berkeley.edu/Pubs/TechRpts/2006/EECS-2006-183.pdf)) ;
 3. **Extensible** across numerical languages and benchmarks;
 4. **Friendly to language implementation research** by factorizing the core computation from the runners to minimize the non-core functions necessary to validate the output of compilers;
 5. **Easy to use** by automating the deployment of benchmarks, their test on virtual (web browser and others) and native platforms, as well as the gathering and reporting of relative performance data;
 6. **Fast** by making the setup (data generation and loading) and teardown as quick as possible so that most of the time is spent in the core computation in every language;
 7. **Small** by minimizing the amount of data needed to download the suite;
 8. **Simple** by minimizing the amount of external dependencies and tools required to run the suite;
 
Dependencies
------------------------
Although we tried our best to minimize external dependencies, the suite still depends on the following external tools:
 1. Node.js
 2. Python/Numpy/Scipy



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
