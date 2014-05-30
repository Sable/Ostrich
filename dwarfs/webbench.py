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

@route("/static/<filename:path>")
def index(filename):
    return static_file(filename, root=ROOT_DIR)

@route("/asmjs/<json_string>")
def asmjs(json_string):
    try:
        obj = json.loads(json_string)
        print json_string
        sys.stdout.flush()
        return "OK"
    except ValueError:
        print json.dumps({ "status": 0, "options": "", "time": -1 })
        sys.stdout.flush()
        return "FAIL"

run(host=HOST, port=PORT, quiet=True)
