/**
  * Class to hold benchmark information
  * @name: Name of benchmark
  * @run: function to run the benchmark
  * @setup(optional): function that will be called before each benchmark run
  * @destroy(optional): function that will be called after each benchmark run
  * @minIterations(optional): integer that depicts minimum number of iterations
  */
function Benchmark(name, run, setup, destroy, minIterations) {
	this.name = name;
	this.run = run;
	this.setup = setup ? setup : function() { };
	this.destroy = destroy ? destroy : function() { };
	this.minIterations = minIterations ? minIterations : 32;
}

// Benchmark results hold the benchmark and the measured time used to
// run the benchmark. The benchmark score is computed later once a
// full benchmark suite has run to completion.
function BenchmarkResult(benchmark, time) {
	this.benchmark = benchmark;
	this.time = time;
}

var config = {
	doWarmup: true,
	warmupTime: 5,
	minTime: 50
};

// Suites of benchmarks
var BenchmarkSuite = {
	name: "Ostrich",
	version: "1.0",
	benchmarks: [],
	results: [],
	scores: [],
	AddBenchmark: function(benchmark) {
		BenchmarkSuite.benchmarks.push(benchmark);
	},
	// Benchmark running operations
	ResetRNG: function() { // Use this to make the benchmark results predictable
		Math.random = (function() {
			var seed = 49734321;
			return function() {
				// Robert Jenkins' 32 bit integer hash function.
				seed = ((seed + 0x7ed55d16) + (seed << 12))  & 0xffffffff;
				seed = ((seed ^ 0xc761c23c) ^ (seed >>> 19)) & 0xffffffff;
				seed = ((seed + 0x165667b1) + (seed << 5))   & 0xffffffff;
				seed = ((seed + 0xd3a2646c) ^ (seed << 9))   & 0xffffffff;
				seed = ((seed + 0xfd7046c5) + (seed << 3))   & 0xffffffff;
				seed = ((seed ^ 0xb55a4f09) ^ (seed >>> 16)) & 0xffffffff;
				return (seed & 0xfffffff) / 0x10000000;
			};
		})();
	}
};

// Runs all registered benchmark suites and optionally yields between
// each individual benchmark to avoid running for too long in the
// context of browsers. Once done, the final score is reported to the
// runner.
BenchmarkSuite.Run = function(runner) {
	BenchmarkSuite.ResetRNG();
	BenchmarkSuite.runner = runner;
	var benchmarks = BenchmarkSuite.benchmarks;
	var length = benchmarks.length;
	BenchmarkSuite.results = [];
	BenchmarkSuite.scores = [];
	var index = 0;

	function start() {
		var elapsed = 0, i = 0;
		if(index >= length) {
			stop();
			return;
		}
		if(config.doWarmup) {
			while(elapsed < config.warmupTime) {
				try {
					benchmarks[index].setup();
					var t0 = performance.now();
					benchmarks[index].run();
					elapsed += (performance.now() - t0)/1000;
					benchmarks[index].destroy();
					i++;
				} catch(e) {
					BenchmarkSuite.NotifyError(e);
				}
			}
		}

		elapsed = 0;
		var result = [];
		while(elapsed < config.minTime || i < benchmarks[index].minIterations) {
			try {
				benchmarks[index].setup();
				var mt0 = performance.now();
				benchmarks[index].run();
				var mt1 = (performance.now() - mt0)/1000;
				elapsed += mt1;
				result.push(mt1);
				benchmarks[index].destroy();
			} catch(e) {
				BenchmarkSuite.NotifyError(e);
				break;
			}
			i++;
		}
		BenchmarkSuite.results.push(result);
		index++;
		window.setTimeout(start, 20);
	}

	function stop() {
		// show final result
		if (runner.NotifyScore) {
			BenchmarkSuite.results.forEach(function (results) {
				var score = BenchmarkSuite.GeometricMean(results);
				BenchmarkSuite.scores.push(score);
			});
			runner.NotifyScore(BenchmarkSuite.scores);
		}
	}
	start();
};

// Computes the geometric mean of a set of numbers.
BenchmarkSuite.GeometricMean = function(numbers) {
	var log = 0;
	for (var i = 0; i < numbers.length; i++) {
		log += Math.log(numbers[i]);
	}
	return Math.pow(Math.E, log / numbers.length);
};

// Converts a score value to a string with at least three significant
// digits.
BenchmarkSuite.FormatScore = function(value) {
	if (value > 100) {
		return value.toFixed(0);
	} else {
		return value.toPrecision(3);
	}
};

// Notifies the runner that running a benchmark resulted in an error.
BenchmarkSuite.NotifyError = function(error) {
	BenchmarkSuite.runner.NotifyError(this.name, error);
};

