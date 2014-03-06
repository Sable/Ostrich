/**
  * Class to hold benchmark information
  * @name: Name of benchmark
  * @run: function to run the benchmark
  * @setup(optional): function that will be called before each benchmark run
  * @destroy(optional): function that will be called after each benchmark run
  * @minIterations(optional): integer that depicts minimum number of iterations
  */
function Benchmark(name, run, check, setup, destroy, minIterations) {
	this.name = name;
	this.run = run;
	this.check = check ? check : function() { };
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
	warmupTime: 2,
	minTime: 5
};

// Suites of benchmarks
var BenchmarkSuite = {
	name: "Ostrich",
	version: "1.0",
	benchmarks: [],
	results: [],
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
	var index = 0;

	function start() {
		var elapsed = 0, i = 0;
		if(index >= length) {
			stop();
			return;
		}
		if(config.doWarmup) {
			benchmarks[index].setup();
			while(elapsed < config.warmupTime) {
				try {
					var t0 = performance.now();
					benchmarks[index].run();
					elapsed += (performance.now() - t0)/1000;
					i++;
				} catch(e) {
					BenchmarkSuite.NotifyError(e);
				}
			}
			benchmarks[index].destroy();
		}

		elapsed = 0;
		var result = [];
		benchmarks[index].setup();
		while(elapsed < config.minTime || i < benchmarks[index].minIterations) {
			try {
				var mt0 = performance.now();
				benchmarks[index].run();
				var mt1 = (performance.now() - mt0)/1000;
				elapsed += mt1;
				benchmarks[index].check();
				result.push(mt1);
			} catch(e) {
				BenchmarkSuite.NotifyError(e);
				break;
			}
			i++;
		}
		benchmarks[index].destroy();
		BenchmarkSuite.results.push(result);
		index++;
		window.setTimeout(start, 20);
	}

	function stop() {
		// show final result
		if (runner.NotifyScore) {
			runner.NotifyScore(BenchmarkSuite.results);
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

// Computes the Max of a set of numbers.
BenchmarkSuite.Max = function(numbers) {
	return Math.max.apply(null, numbers);
};

// Computes the Min of a set of numbers.
BenchmarkSuite.Min = function(numbers) {
	return Math.min.apply(null, numbers);
};

// Computes the Avg of a set of numbers.
BenchmarkSuite.Avg = function(numbers) {
	return (numbers.reduce(function(b,c) {return b+c;}) / numbers.length);
};

// Computes the Avg of a set of numbers.
BenchmarkSuite.Std = function(avg, numbers) {
	return Math.sqrt((numbers.map(function(a) { return Math.pow((avg - a) ,2); })
		.reduce(function(b,c) {return b+c;})) / numbers.length);
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

