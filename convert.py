# -*- coding:utf-8 -*-
import sys
from optparse import OptionParser
import numpy as np
import matplotlib.pyplot as plt
from matplotlib.colors import colorConverter
from matplotlib.ticker import ScalarFormatter
import matplotlib
from pprint import pprint

fontsize = 12
xlabel_fontsize = 12
matplotlib.rc('font', family='sans-serif')
matplotlib.rc('font', serif='Helvetica')
matplotlib.rc('text', usetex='false')
matplotlib.rcParams.update({'font.size': fontsize})
matplotlib.rcParams['pdf.use14corefonts'] = True


def parse_options():
    parser = OptionParser()
    parser.add_option("-x", "--xaxis", dest="xaxis",
                      action="store", type="string", default="benchmark")
    parser.add_option("-g", "--xaxis-geo-mean", dest="xaxis_geo_mean", action="store_true", default=True)
    parser.add_option("-d", "--ydenominator", dest="ydenominator",
                      action="store", type="string", default="language=C")
    parser.add_option("-r", "--remove", dest="filters_remove",
                      metavar="category1=value1[,value2]:category2=value3[,value4];...", default="")
    parser.add_option("-k", "--keep", dest="filters_keep",
                      metavar="category1=value1[,value2]:category2=value3[,value4];...", default="")
    parser.add_option("-o", "--output-file", dest="output_file",
                      action="store", type="string", default="plot.pdf")
    parser.add_option("-l", "--log-scale", dest="logscale",
                      action="store", type="int", default=None)
    parser.add_option("-v", "--verbose", dest="verbose",
                      action="store_true", default=False)
    parser.add_option("-i", "--interactive", dest="interactive",
                      action="store_true", default=False)
    parser.add_option("-s", "--speedup-graph", dest="speedup_graph",
                      action="store_true", default=False)
    parser.add_option("--y-label", dest="y_label",
                      action="store", default=None)
    return parser.parse_args()

MACHINES = {"Macbook-Air":"mba", "Desktop":"desktop", "I73820":"cpuintel", "Radeon7970":"gpuradeon", "TeslaC2050":"gputesla", "win": "Windows7", "macbook": "macbook"}
LANGUAGES = {"js":"js", "C":"c", "asmjs":"asmjs", "OpenCL":"opencl", "WebCL":"webcl", "js-nota":"js-nota", "pnacl":"pnacl"}
BROWSERS = {"Chrome":"chrome", "Firefox":"firefox", "Safari":"safari", "IE": "ie", "N/A":"native"}
BENCHMARKS = {"srad":"srad", "fft":"fft", "back-prop":"back-prop", "hmm":"hmm", "lavamd":"lavamd", "page-rank":"page-rank", "nqueens":"nqueens", "bfs":"bfs", "crc":"crc", "lud":"lud", "nw":"nw", "spmv":"spmv"}

data_index = {
    "benchmark": 0,
    "browser": 1,
    "language": 2,
    "machine": 3,
    "avg": 4,
    "std": 5
}

categories = {
    "benchmark": BENCHMARKS,
    "language": LANGUAGES,
    "browser": BROWSERS,
    "machine": MACHINES,
}

output_names = {
    "benchmark": "Benchmark",
    "language": "Language",
    "browser": "Browser",
    "machine": "Machine",
    "geomean": "geo.mean",
    "native": "Native",
    "cpuintel":"CPU_I73820",
    "gpuradeon":"GPU_Radeon7970",
    "gputesla":"GPU_TeslaC2050"
}

for category in [MACHINES, LANGUAGES, BROWSERS, BENCHMARKS]:
    for k,v in category.iteritems():
        if v not in output_names:
            output_names[v] = k

def column(data, index):
    values = []
    for row in data:
        values.append(row[index])
    return values

def keep(row, filters):
    # Boolean 'and' for different categories but
    # Boolean 'or' for the values within the same category
    found = True
    for f in filters:
        category = f[0]
        within = False
        for value in f[1]:
            if row[data_index[category]] == categories[category][value]:
                within = within or True
        found = found and within
    return found

def unique(l):
    return list(set(l))

#
def itercategories(cs):
    values = []
    for k in categories:
        if k in cs:
            if len(values) == 0:
                values = [{k:v} for v in cs[k]]
            else:
                new_values = []
                for v2 in values:
                    for v1 in cs[k]:
                        new_values.append(dict(v2.items()+{k:v1}.items()))
                values = new_values
    #print values
    # Filter out invalid combinations
    return [tuple(v for _, v in sorted(x.items())) for x in values if
        "language" not in x or "browser" not in x or
        (not ((x["browser"] != "native" and x["language"] in ['pnacl', 'c', 'opencl']) or
              (x["browser"] == "native" and x["language"] not in ['pnacl', 'c', 'opencl'])))]



data_average_index = 4
data_std_index = 5

# Taken from https://blog.dlasley.net/2013/08/geometric-mean-in-python/
def geometric_mean(nums):
    '''
        Return the geometric average of nums
        @param    list    nums    List of nums to avg
        @return   float   Geometric avg of nums
    '''
    return (reduce(lambda x, y: x*y, nums))**(1.0/len(nums))


if __name__ == "__main__":
    (options,args) = parse_options()

    if len(args) < 1:
        print "Missing filename"
        sys.exit(1)
    else:
        filenames = args

    data = []
    # Read data from one or more files
    for filename in filenames:
        f = open(filename)
        meta = f.readline().split(",")
        machine_index = meta.index("machine")
        benchmark_index = meta.index("benchmark")
        language_index = meta.index("language")
        browser_index = meta.index("browser")
        result_first_index = 4

        for lstr in f.xreadlines():
            l = lstr[:-2].split(",")
            results = map(float, l[result_first_index:])
            data.append([
                l[benchmark_index],
                BROWSERS[l[browser_index]],
                LANGUAGES[l[language_index]],
                MACHINES[l[machine_index]],
                np.average(results),
                np.std(results)])

        f.close()

    # Remove unwanted results
    filters = []
    for f in options.filters_remove.split(":"):
        if f == "":
            continue
        (category,values) = f.split("=")
        filters.append((category,values.split(",")))

    for f in filters:
        category = f[0]
        for value in f[1]:
            data = filter(lambda row: row[data_index[category]] != categories[category][value], data)

    # Keep only wanted results
    filters = []
    for f in options.filters_keep.split(":"):
        if f == "":
            continue
        (category,values) = f.split("=")
        filters.append((category,values.split(",")))

    if len(filters) != 0:
        data = filter(lambda row: keep(row,filters), data)


    # Convert to dictionary structure for post-processing with ratio
    schema = dict(map(lambda category: (category,unique(column(data, data_index[category]))),categories))
    category_keys = [k for k in sorted(categories)]

    output_keys = []
    for ky in category_keys:
        vy = schema[ky]
        new_output_keys = []
        for v2 in vy:
            if len(output_keys) == 0:
                new_output_keys.append((v2,))
            else:
                for v1 in output_keys:
                    new_output_keys.append(v1 + (v2,))
        output_keys = new_output_keys

    output_data = {}
    for k in output_keys:
        output_data[k] = None

    for row in data:
        output_data[tuple(row[:data_average_index])] = {"ratio":0, "std":row[data_std_index], "avg":row[data_average_index]}

    for k in output_data.keys():
        if output_data[k] == None:
            output_data.pop(k)

    # Compute ratios
    (ydenom_category, ydenom_value) = options.ydenominator.split("=")
    ydenom_value = categories[ydenom_category][ydenom_value]
    ydenom_index = category_keys.index(ydenom_category)
    for k,v in output_data.iteritems():
        ref = list(k)
        ref[ydenom_index] = ydenom_value
        # Some combinations are invalid,
        # therefore also change the browser if the ratio is computed over C
        if ydenom_category == "language" and ydenom_value == "c":
            ref[data_index["browser"]] = "native"
        if ydenom_category == "language" and ydenom_value == "webcl":
            ref[data_index["browser"]] = "firefox"
        if ydenom_category == "language" and ydenom_value == "opencl":
            ref[data_index["browser"]] = "native"
	if ydenom_category == "language" and ydenom_value in ('js', 'js-nota'):
            ref[data_index["browser"]] = "chrome"
        ref = tuple(ref)
        if not ref in output_data:
            raise Exception("invalid reference key '" + str(ref) + "'for ratio computation, please filter invalid results")
        v["ratio"] = v["avg"] /  output_data[ref]["avg"]


    # Output only non-singleton dimensions
    xaxis = options.xaxis
    yaxis = dict(map(lambda category: (category,unique(column(data, data_index[category]))),filter(lambda x: x != options.xaxis, categories)))
    yaxis[ydenom_category].remove(ydenom_value);

    singletons_keys = filter(lambda category: len(yaxis[category]) == 1, yaxis)
    singletons = {}
    for k in singletons_keys:
        singletons[k] = yaxis.pop(k)

    metadata = [output_names[xaxis]]+map(lambda x: "-".join(map(lambda y: output_names[y], x)), sorted(itercategories(dict(yaxis.items() + singletons.items()))))
    formatted_data = []
    for x in categories[xaxis]:
        if not x in schema[xaxis]:
            continue
        cat = dict(yaxis.items() + singletons.items() + [(xaxis, [x])])
        formatted_data.append([output_names[x]] + [output_data[key]["ratio"] for key in sorted(itercategories(cat))])
    formatted_data.sort()

    if options.xaxis_geo_mean:
        geo_mean = [output_names["geomean"]]
        for col in range(1,len(formatted_data[0])):
            geo_mean.append(geometric_mean(column(formatted_data,col)))
        formatted_data.append(geo_mean)

    # print "itercategories:"
    # print itercategories(dict(yaxis.items() + singletons.items()))
    # print "others:"
    # print singletons
    if options.verbose:
        sep = ","
        print sep.join(metadata)
        for tup in formatted_data:
            print sep.join(map(str, tup))

    # Produce Speedup Graph
    N = len(column(formatted_data,0))
    ind = np.arange(N) + 0.15  # the x locations for the groups
    width = (0.7/len(metadata[1:]))       # the width of the bars
    #old_colors = map(lambda c: colorConverter.to_rgba(c, 0.5), ["#00C12B", "#133AAC", "#FFAE00", "#FF1800", "#24913C", "#062170", "#A67100", "#A61000"])
    colors = map(lambda c: colorConverter.to_rgba(c, 0.5), ["#0000DD", "#FF8800",  "#24913C", "#062170", "#123456", "#654321"])
    xlabel_offset = 0
    xbar_offset = 0
    xbar_space = 0.05

    bars = []
    names = []
    legend_colors = []

    fig, ax = plt.subplots()

    if options.logscale:
        ax.set_yscale("log", basey=options.logscale, nonposy="clip")
    ax.get_yaxis().set_major_formatter(ScalarFormatter())

    for i in range(1,len(formatted_data[0])):
        c = colors[i-1]
        col = column(formatted_data,i)

        if options.speedup_graph:
            col = np.divide(np.ones(len(col)), col)

        bars.append(ax.bar(ind+(i-1)*(width+xbar_space), col, width, color=c, edgecolor=c)) #yerr=menStd, error_kw=dict(ecolor='black')))
        names.append(col[0])
        legend_colors.append(plt.Line2D(range(1),range(1),color=c, lw=10.0))

    ax.axhline(1, color="#ff0000", lw=2.0)
    legend_colors.append(plt.Line2D(range(1),range(1),color="#ff0000", lw=2.0))

    ax.yaxis.grid(True)
    # add some
    if options.y_label:
        ax.set_ylabel(options.y_label)
    else:
        ax.set_ylabel(("Speedup" if options.speedup_graph else "Slowdown") + " compared to " + output_names[ydenom_value] + ( "" if options.logscale == None else " (log" + str(options.logscale) + ")"))

    ax.set_xticks(ind+width+xlabel_offset)
    ax.set_xticklabels(column(formatted_data,0), rotation=-45, horizontalalignment="left", verticalalignment="top", size=xlabel_fontsize)

    plt.legend(legend_colors, metadata[1:] + [output_names[ydenom_value]], loc="upper right",prop={'size':fontsize},frameon=False)

    # Adjust figure size to account for axis labels, tick labels and title
    plt.tight_layout()

if options.interactive:
    plt.show()
else:
    plt.savefig(options.output_file)
