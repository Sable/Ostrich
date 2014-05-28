# -*- coding:utf-8 -*-

import subprocess
import json
import os
import time
import sys
import signal
from optparse import OptionParser


def make_cmdline(browser, system):
    if OS == "Darwin":
        if browser == "google-chrome":
            return ["open", "/Applications/Google Chrome.app", "--args", "--incognito"]
        elif browser == "firefox":
            return ["open", "/Applications/Firefox.app", "--args", "--private"]
        else:
            return  ["open", "/Applications/Safari.app"]
    elif OS == "Linux":
        return [browser, "--incognito" if browser == "google-chrome" else "--private"]


class WebbenchThread(threading.Thread):
    def __init__(self):
        threading.Thread.__init__(self)
        self.out = "[]"

    def run(self):
        webserver_script = ["python", "webbench.py"]
        stdout, stderr = subprocess.Popen(webserver_script,
                                          stdout=subprocess.PIPE,
                                          stderr=subprocess.PIPE).communicate()
        self.out = stdout[:]


class Benchmark(object):
    def __init__(self, name, dir):
        self.name = name
        self.dir = dir

    def run_c_benchmark(self):
        """Run the C benchmark.  Assume that there is a build/c/run.sh script
           that will feed all the correct parameters."""

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
        return [r['time'] for r in results]


    def run_js_benchmark(self, browser, asmjs=False):
        httpd = subprocess.Popen(["python", "webbench.py"], stdout=subprocess.PIPE)
        url = "http://0.0.0.0:8080/static/" + os.path.join(self.dir, "build", "asmjs" if asmjs else "js", "run.html")
        browser_script = make_cmdline(browser, OS)
        results = []

        for _ in xrange(ITERS):
            br = subprocess.Popen(browser_script, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            time.sleep(5)
            if OS == "Darwin":
                browser_script = browser_script[0] + ["-a", url] + browser_script[1:]
                subprocess.call(browser_script, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            else:
                subprocess.call(browser_script + [url], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            line = httpd.stdout.readline()
            obj = json.loads(line)
            results.append(obj)
            br.kill()

        httpd.kill()
        return [r['time'] for r in results]


    def build(self):
        """Move into the benchmark's directory and run make clean && make."""

        prev_dir = os.getcwd()
        os.chdir(self.dir)
        subprocess.call(["make", "clean"], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        subprocess.call(["make"], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        os.chdir(prev_dir)

OS = os.uname()[0]
ITERS = 10
BENCHMARKS = [
    Benchmark("nqueens", "branch-and-bound/nqueens"),
    Benchmark("crc", "combinational-logic/crc"),
    Benchmark("lud", "dense-linear-algebra/lud"),
    Benchmark("nw", "dynamic-programming/nw"),
    Benchmark("hmm", "graphical-models/hmm"),
    Benchmark("bfs", "graph-traversal/bfs"),
    Benchmark("page-rank", "map-reduce/page-rank"),
    Benchmark("lavamd", "n-body-methods/lavamd"),
    #Benchmark("spmv", "sparse-linear-algebra/spmv"),
    Benchmark("fft", "spectral-methods/fft"),
    Benchmark("srad", "structured-grid/SRAD"),
    Benchmark("back-prop", "unstructured-grid/back-propagation"),
]

benchmark_names = [b.name for b in BENCHMARKS]
environments = ["c",
                "asmjs-chrome",
                "asmjs-firefox",
                "js-chrome",
                "js-firefox",
                "asmjs-safari",
                "js-safari"]

parser = OptionParser()
parser.add_option("-b", "--benchmarks", dest="benchmark_csv",
                  metavar="bench1,bench2,...",
                  help="comma-separated list of benchmarks to run (" +
                  ", ".join(benchmark_names) + ")")
parser.add_option("-e", "--environments", dest="env_csv",
                  metavar="env1,env2,...",
                  help="comma-separated list of environments to use " +
                  "(" + ", ".join(environments) + ")")
(options, args) = parser.parse_args()

if options.benchmark_csv is None:
    benchmarks_to_run = benchmark_names
else:
    benchmarks_to_run = [b.strip() for b in options.benchmark_csv.split(",")]

if options.env_csv is None:
    environments_to_use = environments
else:
    environments_to_use = [b.strip() for b in options.env_csv.split(",")]



print "benchmark,language,browser,%s" % ",".join("time" + str(i) for i in xrange(ITERS))

for b in BENCHMARKS:
    if b.name not in benchmarks_to_run:
        continue
    b.build()

    if "c" in environments_to_use:
        print "%s,C,N/A,%s" % (b.name, ','.join(str(x) for x in b.run_c_benchmark()))

    if "asmjs-chrome" in environments_to_use:
        print "%s,asmjs,Chrome,%s" % (b.name, ','.join(str(x) for x in b.run_js_benchmark("google-chrome", True)))

    if "asmjs-firefox" in environments_to_use:
        print "%s,asmjs,Firefox,%s" % (b.name, ','.join(str(x) for x in b.run_js_benchmark("firefox", True)))

    if "asmjs-safari" in environments_to_use and OS == "Darwin":
        print "%s,asmjs,Safari,%s" % (b.name, ','.join(str(x) for x in b.run_js_benchmark("safari", True)))

    if "js-chrome" in environments_to_use:
        print "%s,js,Chrome,%s" % (b.name, ','.join(str(x) for x in b.run_js_benchmark("google-chrome")))

    if "js-firefox" in environments_to_use:
        print "%s,js,Firefox,%s" % (b.name, ','.join(str(x) for x in b.run_js_benchmark("firefox")))

    if "js-safari" in environments_to_use and OS == "Darwin":
        print "%s,js,Safari,%s" % (b.name, ','.join(str(x) for x in b.run_js_benchmark("safari")))
