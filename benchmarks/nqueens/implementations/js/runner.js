if (typeof performance === 'undefined') {
  var performance = Date
}

function run (size) {
  var us = {}
  var t1, t2

  var solutions

  t1 = performance.now()
  solutions = nqueenJS(size, us)
  t2 = performance.now()

  console.log('Size: ' + size + ' Time: ' + (t2 - t1) / 1000 + ' s Solutions: ' +
    solutions + ' Unique Solutions: ' + us['solutions'])
  console.log(JSON.stringify({
    status: 1,
    options: 'run(' + size + ')',
    time: (t2 - t1) / 1000,
    output: '[' + solutions + ', ' + us['solutions'] + ']'
  }))
  server.done()
}
