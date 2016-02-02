var varchunk = require('./')

var chunks = varchunk('test')

chunks.put(53, 'hello')
chunks.put(20, 'how')
chunks.put(1, 'are')
chunks.put(33, 'you?', function () {
  chunks.get(53, console.log)
})
