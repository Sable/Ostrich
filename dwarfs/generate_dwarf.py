# tool that generates dwarfs in directories 
import sys 
import argparse 
import os

parser = argparse.ArgumentParser("Create dwarf directories")
parser.add_argument('dwarf', help='The dwarf for the new benchmark creates one if it does not exist', nargs=1) 
parser.add_argument('bench', help='The benchmark to be made', nargs=1) 


args= vars(parser.parse_args())
dwarf_dir = args["dwarf"][0] 
bench_dir = dwarf_dir + "/" +args["bench"][0] 
dirs = ["c", "js", "asmjs", "opencl", "webcl", "common", "data", "tools"]

#create the dwarf directory if it does not already exist 
if(not os.path.exists(dwarf_dir)):
  print "Creating dwarf directory " + dwarf_dir + " ..." 
  os.makedirs(dwarf_dir)


#create the bench directory in dwarf 
if(not os.path.exists(bench_dir)):
  print "Creating benchmark directory " + bench_dir +  " ..."
  os.makedirs(bench_dir)
  for d in dirs: 
    print "Creating " + d + " directory ..."
    os.makedirs(bench_dir + "/" + d)
else: 
  print "Benchmark directory " + bench_dir + " already exists!" 


print "done" 



