# -*- coding:utf-8 -*-

import subprocess
import json
import scipy
import os

class Benchmark(object):
    def __init__(self, name, dir):
        self.name = name
        self.dir = dir

    def run_c_benchmark(self):
        prev_dir = os.getcwd()
        os.chdir(self.dir)

        runner_script = ["sh", os.path.join("build", "c", "run.sh")]
        results = []
        for _ in xrange(ITERS):
            stdout, stderr = subprocess.Popen(runner_script,
                                              stdout=subprocess.PIPE,
                                              stderr=subprocess.PIPE).communicate()
            result = json.loads(stdout)
            results.append(result)
        os.chdir(prev_dir)
        return scipy.mean([r['time'] for r in results])


    def build_benchmark(self):
        """Move into the benchmark's directory and run make clean && make."""
        prev_dir = os.getcwd()
        os.chdir(self.dir)
        subprocess.call(["make", "clean"])
        subprocess.call(["make"])
        os.chdir(prev_dir)


ITERS = 10
BENCHMARKS = [
    Benchmark("bfs", "graph-traversal/bfs"),
]

for b in BENCHMARKS:
    b.build_benchmark()
    print "%s,%s" % (b.name, b.run_c_benchmark())
