if (typeof performance === 'undefined') {
  var performance = Date
}

function run (size, inputPath, outputPath) {
  server.loadcsv(inputPath, function (matrix) {
    var t1 = performance.now()
    lud(matrix, size)
    var t2 = performance.now()

    if (outputPath !== undefined) {
      var lines = []
      for (var row = 0; row < size; ++row) {
        var line = []
        for (var col = 0; col < size; ++col) {
          line.push(matrix[row * size + col])
        }
        lines.push(line.join(','))
      }

      server.save(outputPath, lines.join('\n'))
    }

    server.log(JSON.stringify({
      status: 1,
      options: 'run(' + size + ',' + "'" + inputPath + "', '" + outputPath + "')",
      time: (t2 - t1) / 1000
    }))
    server.done()
  })
}
