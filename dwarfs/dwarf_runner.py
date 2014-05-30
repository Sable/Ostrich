# -*- coding:utf-8 -*-

import subprocess
import json
import os
import time
import signal
import contextlib
from optparse import OptionParser


@contextlib.contextmanager
def cd(dir):
    cwd = os.getcwd()
    os.chdir(dir)
    yield
    os.chdir(cwd)


class LinuxEnvironment(object):
    def __init__(self, sleep_time):
        self.sleep_time = sleep_time

    @contextlib.contextmanager
    def provision_browser(self, browser, url):
        invocation = [browser, "--incognito" if browser == "google-chrome" else "--private"]
        browser = subprocess.Popen(invocation, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        time.sleep(self.sleep_time)
        subprocess.call(invocation + [url], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        yield
        browser.kill()


class OsxEnvironment(object):
    def __init__(self, sleep_time):
        try:
            import psutil
        except ImportError:
            print >>sys.stderr, "%s: error: module 'psutil' required for OS X." % sys.argv[0]
        self.sleep_time = sleep_time

    @contextlib.contextmanager
    def provision_browser(self, browser, url):
        browser_args = {
            "google-chrome": ["/Applications/Google Chrome.app", "--args", "--incognito"],
            "firefox": ["/Applications/Firefox.app", "--args", "--private"],
            "safari": ["/Applications/Safari.app"]
        }
        invocation = ["open", "--background", "-a"] + browser_args[browser]
        browser = subprocess.Popen(invocation, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        time.sleep(self.sleep_time)
        subprocess.call([invocation[0], url] + invocation[1:], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        yield
        browsers = {"google-chrome": "Google Chrome", "firefox": "firefox", "safari": "Safari"}
        for p in psutil.get_process_list():
            if p.name == browsers[browser]:
                os.kill(p.pid, signal.SIGKILL)


class Benchmark(object):
    def __init__(self, name, dir, env, iters):
        self.name = name
        self.dir = dir
        self.env = env
        self.iters = iters

    def run_c_benchmark(self):
        """Run the C benchmark.  Assume that there is a build/c/run.sh script
           that will feed all the correct parameters."""
        runner_script = ["sh", os.path.join("build", "c", "run.sh")]
        with cd(self.dir):
            for _ in xrange(self.iters):
                stdout, _ = subprocess.Popen(runner_script,
                                             stdout=subprocess.PIPE,
                                             stderr=subprocess.PIPE).communicate()
                yield json.loads(stdout)["time"]

    def run_js_benchmark(self, browser, asmjs=False):
        httpd = subprocess.Popen(["python", "webbench.py"], stdout=subprocess.PIPE)
        url = "http://0.0.0.0:8080/static/" + os.path.join(self.dir, "build", "asmjs" if asmjs else "js", "run.html")

        for _ in xrange(self.iters):
            with self.env.provision_browser(browser, url):
                yield json.loads(httpd.stdout.readline())["time"]

        httpd.kill()

    def build(self):
        """Move into the benchmark's directory and run make clean && make."""
        with self.cd():
            subprocess.call(["make", "clean"], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            subprocess.call(["make"], stdout=subprocess.PIPE, stderr=subprocess.PIPE)


BENCHMARK_INFO = {
    "nqueens": "branch-and-bound/nqueens",
    "crc": "combinational-logic/crc",
    "lud": "dense-linear-algebra/lud",
    "nw": "dynamic-programming/nw",
    "hmm": "graphical-models/hmm",
    "bfs": "graph-traversal/bfs",
    "page-rank": "map-reduce/page-rank",
    "lavamd": "n-body-methods/lavamd",
    "spmv": "sparse-linear-algebra/spmv",
    "fft": "spectral-methods/fft",
    "srad": "structured-grid/SRAD",
    "back-prop": "unstructured-grid/back-propagation",
}

ENVIRONMENTS = {
    "c": ("C", "N/A", lambda b: b.run_c_benchmark()),
    "asmjs-chrome": ("asmjs", "Chrome", lambda b: b.run_js_benchmark("google-chrome", True)),
    "asmjs-firefox": ("asmjs", "Firefox", lambda b: b.run_js_benchmark("firefox", True)),
    "js-chrome": ("js", "Chrome", lambda b: b.run_js_benchmark("google-chrome")),
    "js-firefox": ("js", "Firefox", lambda b: b.run_js_benchmark("firefox")),
    "asmjs-safari": ("asmjs", "Safari", lambda b: b.run_js_benchmark("safari", True)),
    "js-safari": ("js", "Safari", lambda b: b.run_js_benchmark("safari")),
}


def parse_options():
    parser = OptionParser()
    parser.add_option("-b", "--benchmarks", dest="benchmark_csv",
                      metavar="bench1,bench2,...", default=",".join(BENCHMARK_INFO),
                      help="comma-separated list of benchmarks to run (%default)")
    parser.add_option("-e", "--environments", dest="env_csv",
                      metavar="env1,env2,...", default=",".join(ENVIRONMENTS),
                      help="comma-separated list of environments to use (%default)")
    parser.add_option("-i", "--iterations", dest="iters",
                      action="store", type="int", default=10,
                      help="number of iteration for each benchmark")
    parser.add_option("-w", "--wait-before-load", dest="wait",
                      action="store", type="int", default=6,
                      help="number of seconds to wait after having started the browser before sending the load command")
    return parser.parse_args()[0]


def main():
    options = parse_options()
    OS = (OsxEnvironment if os.uname()[0] == "Darwin" else LinuxEnvironment)(options.wait)

    benchmarks_to_run = [
        Benchmark(name, BENCHMARK_INFO[name], OS, options.iters)
        for name in options.benchmark_csv.strip().split(",")
    ]
    environments_to_use = map(ENVIRONMENTS.get, options.env_csv.strip().split(","))

    print "benchmark,language,browser,%s" % ",".join("time" + str(i) for i in xrange(options.iters))
    for b in benchmarks_to_run:
        b.build()
        for env in environments_to_use:
            print ",".join([b.name, env[0], env[1], ",".join(map(str, env[2](b)))])

if __name__ == "__main__":
    main()
