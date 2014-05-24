# -*- coding: utf-8

import os

from bottle import route, run, static_file

ROOT_DIR = os.getcwd()

@route('/static/<filename:path>')
def index(filename):
    #return template('<b>Hello {{name}}</b>!', name=name)
    return static_file(filename, root=ROOT_DIR)

run(host='localhost', port=8080)
