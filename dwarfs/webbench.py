# -*- coding: utf-8

import os
import json
import sys
import signal

from bottle import route, run, static_file

ITER     = 10
HOST     = "0.0.0.0"
PORT     = 8080
ROOT_DIR = os.getcwd()
TIMES    = []

@route("/static/<filename:path>")
def index(filename):
    return static_file(filename, root=ROOT_DIR)

@route("/asmjs/<json_string>")
def asmjs(json_string):
    global TIMES

    obj = json.loads(json_string)
    TIMES.append(obj["time"])
    #print >>stderr, len(TIMES)
    if len(TIMES) < ITER:
        return "1"
    else:
        res = json.dumps(TIMES)
        sys.stdout.write(res + "\n")
        sys.stdout.flush()
        # Quitting with sys.exit(0) fails and the app keeps running.
        os.kill(os.getpid(), signal.SIGTERM)

run(host=HOST, port=PORT, quiet=True)
