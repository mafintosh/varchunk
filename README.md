# varchunk

On-disk variable sized chunk store

```
npm install varchunk
```

## Usage

``` js
var varchunk = require('varchunk')

// will store data in ./test.data and an index in ./test.index
var chunks = varchunk('test')

chunks.put(10, 'hello', function () {
  chunks.get(10, function (err, data) {
    console.log(data.toString()) // hello
  })
})
```

## API

#### `chunks = varchunk(name)`

Create a new chunk store. Data is stored in `./name.data` and an index is stored in `./name.index`.

#### `chunks.put(index, value, [callback])`

Store a new value at the specified index. Value should be a string or a buffer.

#### `chunks.get(index, callback)`

Retrieve a value.

#### `chunks.append(values, [callback])`

Append values at the end of the store.

#### `chunks.flush([callback])`

Perform an fsync on the underlying file descriptor

#### `chunks.close([callback])`

Close the store.

## License

MIT
