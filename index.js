var fs = require('fs')
var open = require('random-access-open')
var uint48be = require('uint48be')

module.exports = Varchunk

function Varchunk (name) {
  if (!(this instanceof Varchunk)) return new Varchunk(name)

  this._index = new Indexer(name + '.index')
  this._fd = open.sync(name + '.data')
  this._head = fs.fstatSync(this._fd).size
}

Varchunk.prototype.put = function (index, val, cb) {
  if (!cb) cb = noop

  var self = this
  var pos = this._head
  var buf = toBuffer(val)

  this._head += buf.length

  fs.write(this._fd, buf, 0, buf.length, pos, function (err, bytes) {
    if (err) return cb(err)
    if (bytes !== buf.length) return cb(new Error('Could not write chunk'))
    self._index.put(index, pos, buf.length, cb)
  })
}

Varchunk.prototype.get = function (index, cb) {
  var self = this

  this._index.get(index, function (err, pos, size) {
    if (err) return cb(err)
    var buf = new Buffer(size)

    fs.read(self._fd, buf, 0, size, pos, function (err, bytes) {
      if (err) return cb(err)
      if (bytes < buf.length) return cb(new Error('Could not read chunk'))
      cb(null, buf)
    })
  })
}

Varchunk.prototype.flush = function (cb) {
  if (!cb) cb = noop
  var self = this
  fs.fsync(this._fd, function (err) {
    if (err) return cb(err)
    self._indexer.flush(cb)
  })
}

Varchunk.prototype.close = function (cb) {
  var self = this
  this._index.close(function () {
    fs.close(self._fd, cb || noop)
  })
}

Varchunk.prototype.append = function (buf, cb) {
  if (Array.isArray(buf)) {
    for (var i = 0; i < buf.length; i++) {
      this.put(this._index.values++, toBuffer(buf[i]), i === buf.length - 1 ? cb : noop)
    }
  } else {
    this.put(this._index.values++, toBuffer(buf), cb)
  }
}

function toBuffer (b) {
  if (typeof b === 'string') return Buffer(b)
  return b
}

function Indexer (filename) {
  this._fd = open.sync(filename)
  this.values = Math.max(0, Math.floor(fs.fstatSync(this._fd).size / 6) - 1)
}

Indexer.prototype.put = function (index, offset, size, cb) {
  var self = this
  var buf = Buffer(12)
  uint48be.encode(offset, buf, 0)
  uint48be.encode(offset + size, buf, 6)
  fs.write(this._fd, buf, 0, buf.length, 6 * index, function (err, bytes) {
    if (err) return cb(err)
    if (bytes < buf.length) return cb(new Error('Could not write index'))
    if (index >= self.values) self.values = index + 1
    cb(null)
  })
}

Indexer.prototype.get = function (index, cb) {
  var buf = Buffer(12)
  fs.read(this._fd, buf, 0, buf.length, 6 * index, function (err, bytes) {
    if (err || bytes < buf.length) return cb(err || new Error('Could not read index'))
    var a = uint48be.decode(buf, 0)
    var b = uint48be.decode(buf, 6)
    if ((!a && index) || !b) return cb(new Error('Could not read index'))
    cb(null, a, b - a)
  })
}

Indexer.prototype.flush = function (cb) {
  fs.fsync(this._fd, cb || noop)
}

Indexer.prototype.close = function (cb) {
  fs.close(this._fd, cb || noop)
}

function noop () {}
