# -*- coding:utf-8 -*-

# The MIT License (MIT)
#
# Copyright (c) 2014, Erick Lavoie, Faiz Khan, Sujay Kathrotia, Vincent
# Foley-Bourgon, Laurie Hendren
#
# Permission is hereby granted, free of charge, to any person obtaining a copy
# of this software and associated documentation files (the "Software"), to deal
# in the Software without restriction, including without limitation the rights
# to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
# copies of the Software, and to permit persons to whom the Software is
# furnished to do so, subject to the following conditions:
#
# The above copyright notice and this permission notice shall be included in all
# copies or substantial portions of the Software.
#
# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
# IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
# FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
# AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
# LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
# OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
# SOFTWARE.


import subprocess
import json
import os
import time
import signal
import contextlib
import sys
from optparse import OptionParser

if sys.platform == "darwin":
    try:
        import psutil
    except ImportError:
        print >>sys.stderr, "error: %s: module 'psutil' required for OSX" % sys.argv[0]


@contextlib.contextmanager
def cd(dir):
    cwd = os.getcwd()
    os.chdir(dir)
    yield
    os.chdir(cwd)


class LinuxEnvironment(object):
    def __init__(self, sleep_time):
        self.sleep_time = sleep_time

    def can_use(self, browser):
        return browser not in ("Safari", "IE")

    @contextlib.contextmanager
    def provision_browser(self, browser, url):
        if browser == "google-chrome":
            browser_opts = ["--incognito", "--disable-extensions"]
        elif browser == "firefox":
            browser_opts = ["--private"]

        invocation = [browser] + browser_opts
        browser = subprocess.Popen(invocation, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        time.sleep(self.sleep_time)
        subprocess.call(invocation + [url], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        yield
        browser.kill()

class WindowsEnvironment(object):
    def __init__(self, sleep_time):
        self.sleep_time = sleep_time

    def can_use(self, browser):
        return browser != "Safari"

    @contextlib.contextmanager
    def provision_browser(self, browser, url):
        if browser == "google-chrome":
            browser_path = r'C:\Users\sable\AppData\Local\Google\Chrome SxS\Application\chrome.exe'
            browser_opts = ["--incognito", "--disable-extensions"]
        elif browser == "firefox":
            browser_path = r'C:\Program Files\Nightly\firefox.exe'
            browser_opts = []
        elif browser == "ie":
            browser_path = r'C:\Program Files\Internet Explorer\iexplore.exe'
            browser_opts = []

        invocation = [browser_path] + browser_opts
        browser_inst = subprocess.Popen(invocation, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        time.sleep(self.sleep_time)
        subprocess.Popen(invocation + [url], stdout=subprocess.PIPE, stderr=subprocess.PIPE).communicate()
        yield
        browser_inst.kill()

        

class OsxEnvironment(object):
    def __init__(self, sleep_time):
        self.sleep_time = sleep_time

    def can_use(self, browser):
        return browser != "IE"

    @contextlib.contextmanager
    def provision_browser(self, browser, url):
        browser_args = {
            "google-chrome": ["/Applications/Google Chrome.app", "--args", "--incognito", "--disable-extensions"],
            "firefox": ["/Applications/Firefox.app", "--args", "--private"],
            "safari": ["/Applications/Safari.app"]
        }

        invocation = ["open", "--background", "-a"] + browser_args[browser]

        if browser == "safari":
            browser_process = subprocess.call(["osascript", "utils/start-safari.scpt"])
        else:
            browser_process = subprocess.Popen(invocation, stdout=subprocess.PIPE, stderr=subprocess.PIPE)

        time.sleep(self.sleep_time)
        subprocess.call([invocation[0], url] + invocation[1:], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        yield
        if browser == "safari":
            subprocess.call(["osascript", "utils/stop-safari.scpt"])
        else:
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

    def run_native_benchmark(self, opencl=False):
        """Run the C benchmark.  Assume that there is a build/c/run.sh script
           that will feed all the correct parameters."""
        runner_script = ["sh", os.path.join("build", "c" if not opencl else "opencl", "run.sh")]

        with cd(self.dir):
            for _ in xrange(self.iters):
                stdout, _ = subprocess.Popen(runner_script,
                                             stdout=subprocess.PIPE,
                                             stderr=subprocess.PIPE).communicate()
                yield json.loads(stdout)["time"]

    def run_js_benchmark(self, browser, version="js"):
        httpd = subprocess.Popen(["python", "webbench.py"], stdout=subprocess.PIPE)
        url = "http://localhost:8080/static/" + os.path.join(self.dir, "build", version, "run.html")
        url = url.replace('\\', '/') # Hack to accomodate Firefox on Windows.
        for _ in xrange(self.iters):
            with self.env.provision_browser(browser, url):
                output = httpd.stdout.readline()
                try:
                    yield json.loads(output)["time"]
                except ValueError:
                    print >>sys.stderr, "Cannot load the following JSON string: %r" % output
                    yield { "status": 0, "options": "", "time": -1 }
        httpd.kill()

    def run_matlab_benchmark(self, vm):
        """Run the MATLAB benchmark.  Assume that there is a build/<vm>/run.sh script
           that will feed all the correct parameters."""
        runner_script = ["sh", os.path.join("build", vm, "run.sh")]

        with cd(self.dir):
            for _ in xrange(self.iters):
                stdout, stderr = subprocess.Popen(runner_script,
                                             stdout=subprocess.PIPE,
                                             stderr=subprocess.PIPE).communicate()
                yield json.loads(stdout)["time"]

    def build(self):
        """Move into the benchmark's directory and run make clean && make."""
        with cd(self.dir):
	    subprocess.Popen(["make", "clean"], stdout=subprocess.PIPE, stderr=subprocess.PIPE).communicate()
	    subprocess.Popen(["make", "-k"], stdout=subprocess.PIPE, stderr=subprocess.PIPE).communicate()


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
    "c": ("C", "N/A", lambda b: b.run_native_benchmark()),
    "asmjs-chrome": ("asmjs", "Chrome", lambda b: b.run_js_benchmark("google-chrome", "asmjs")),
    "asmjs-firefox": ("asmjs", "Firefox", lambda b: b.run_js_benchmark("firefox", "asmjs")),
    "asmjs-ie": ("asmjs", "IE", lambda b: b.run_js_benchmark("ie", "asmjs")),
    "asmjs-safari": ("asmjs", "Safari", lambda b: b.run_js_benchmark("safari", "asmjs")),
    "js-chrome": ("js", "Chrome", lambda b: b.run_js_benchmark("google-chrome")),
    "js-firefox": ("js", "Firefox", lambda b: b.run_js_benchmark("firefox")),
    "js-ie": ("js", "IE", lambda b: b.run_js_benchmark("ie")),
    "js-safari": ("js", "Safari", lambda b: b.run_js_benchmark("safari")),
    "js-nota-chrome": ("js-nota", "Chrome", lambda b: b.run_js_benchmark("google-chrome", "js-nota")),
    "js-nota-firefox": ("js-nota", "Firefox", lambda b: b.run_js_benchmark("firefox", "js-nota")),
    "js-nota-ie": ("js-nota", "IE", lambda b: b.run_js_benchmark("ie", "js-nota")),
    "js-nota-safari": ("js-nota", "Safari", lambda b: b.run_js_benchmark("safari", "js-nota")),
    "opencl": ("OpenCL", "N/A", lambda b: b.run_native_benchmark(True)),
    "webcl": ("WebCL", "Firefox", lambda b: b.run_js_benchmark("firefox", "webcl")),
    "matlab-matlab": ("matlab", "Matlab", lambda b: b.run_matlab_benchmark("matlab")),
    "matlab-native-matlab": ("matlab-native", "Matlab", lambda b: b.run_matlab_benchmark("matlab-native")),
    #"matlab-octave": ("matlab", "Octave", lambda b: b.run_matlab_benchmark("octave")),
    "matjuice-chrome": ("matjuice", "Chrome", lambda b: b.run_js_benchmark("google-chrome", "matjuice")),
    "matjuice-firefox": ("matjuice", "Firefox", lambda b: b.run_js_benchmark("firefox", "matjuice")),
    "matjuice-ie": ("matjuice", "IE", lambda b: b.run_js_benchmark("ie", "matjuice")),
    "matjuice-safari": ("matjuice", "Safari", lambda b: b.run_js_benchmark("safari", "matjuice")),
    "matjuice-nobc-chrome": ("matjuice-nobc", "Chrome", lambda b: b.run_js_benchmark("google-chrome", "matjuice-nobc")),
    "matjuice-nobc-firefox": ("matjuice-nobc", "Firefox", lambda b: b.run_js_benchmark("firefox", "matjuice-nobc")),
    "matjuice-nobc-ie": ("matjuice-nobc", "IE", lambda b: b.run_js_benchmark("ie", "matjuice-nobc")),
    "matjuice-nobc-safari": ("matjuice-nobc", "Safari", lambda b: b.run_js_benchmark("safari", "matjuice-nobc"))
}


def parse_options():
    parser = OptionParser()
    parser.add_option("-m", "--machine", dest="machine",
                      action="store", default="Desktop",
                      help="name of the machine on which the benchmarks are run")
    parser.add_option("-b", "--benchmarks", dest="benchmark_csv",
                      metavar="bench1,bench2,...", default=",".join(sorted(BENCHMARK_INFO)),
                      help="comma-separated list of benchmarks to run (%default)")
    parser.add_option("-e", "--environments", dest="env_csv",
                      metavar="env1,env2,...", default=",".join(sorted(ENVIRONMENTS)),
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
    if sys.platform == "darwin":
        os_env = OsxEnvironment
    elif sys.platform == "win32":
        os_env = WindowsEnvironment
    else:
        os_env = LinuxEnvironment
        
    OS = os_env(options.wait)

    benchmarks_to_run = [
        Benchmark(name, BENCHMARK_INFO[name], OS, options.iters)
        for name in sorted(options.benchmark_csv.strip().split(","))
    ]
    environments_to_use = sorted(map(ENVIRONMENTS.get, options.env_csv.strip().split(",")))

    print "machine,benchmark,language,browser,%s" % ",".join("time" + str(i) for i in xrange(options.iters))
    for b in benchmarks_to_run:
        b.build()
        for env in environments_to_use:
            if b.env.can_use(env[1]):
                print ",".join([options.machine,b.name, env[0], env[1], ",".join(map(str, env[2](b)))])
                sys.stdout.flush()

if __name__ == "__main__":
    main()
