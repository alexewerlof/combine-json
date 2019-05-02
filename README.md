![Combine-JSON logo](./logo.png)

[![Build Status](https://travis-ci.org/userpixel/combine-json.svg?branch=master)](https://travis-ci.org/userpixel/combine-json)
[![GitHub issues](https://img.shields.io/github/issues/userpixel/combine-json.svg)](https://github.com/userpixel/combine-json/issues)
[![Version](https://img.shields.io/npm/v/combine-json.svg?style=flat-square)](http://npm.im/combine-json)
[![Downloads](https://img.shields.io/npm/dm/combine-json.svg?style=flat-square)](http://npm-stat.com/charts.html?package=combine-json&from=2017-01-01)
[![MIT License](https://img.shields.io/npm/l/combine-json.svg?style=flat-square)](http://opensource.org/licenses/MIT)

# Combine-JSON

This module (and CLI) allows you to create one JSON file from smaller files stored in a directory hierarchy.
The smaller files can be in JSON (default) or any other format like JSON5 or YAML or even INI (custom parser).

**Why?** Sometimes you have a huge JSON file with lots of nested objects but you want to break it into a file hierarchy because:

* It is easier to browse to a particular section
* It is easier to understand the shape of the data structure at a glance
* Editing any subparts of the document leads to cleaner individual git history and diffs

### Example

Given this JSON file:

##### my-data.json

```json
{
    "name": "Alex Ewerlöf",
        "address": {
        "street": "Hittepågatan 13",
        "city": "Stockholm",
        "country": "Sweden",
        "zip": "11122"
    },
    "todos": [
        {
            "id": 1,
            "title": "document the module",
        },
        {
            "id": 2,
            "title": "write some tests",
        },
        {
            "id": 3,
            "title": "publish it for good",
        }
    ]
}
```

We can break it into several files like this:

##### my-data/name.json

```json
"Alex Ewerlöf"
```

(Yes that's a perfectly valid input to `JSON.parse()`)

##### my-data/address.json

```json
{
    "street": "Hittepågatan 13",
    "city": "Stockholm",
    "country": "Sweden",
    "zip": "11122"
}
```

##### my-data/todos.json

```json
[
    {
        "id": 1,
        "title": "document the module",
    },
    {
        "id": 2,
        "title": "write some tests",
    },
    {
        "id": 3,
        "title": "publish it for good",
    }
]
```

You can write that array of objects into files as well:

##### my-data/todos/0.json

```json
{
    "id": 1,
    "title": "document the module",
}
```
##### my-data/todos/1.json

```json
{
    "id": 2,
    "title": "write some tests",
}
```
##### my-data/todos/2.json

```json
{
    "id": 3,
    "title": "publish it for good",
}
```

So the file structure looks like this:

```txt
my-data/
    |____name.json
    |____address.json
    |____todos/
        |____0.json
        |____1.json
        |____2.json
```

Of course you can have directories for array elements as well:

```txt
my-data/
    |____name.json
    |____address.json
    |____todos/
        |____0/
        |    |____id.json
        |    |____title.json
        |____1.json
        |____2.json
```

Take a look at the [`test/my-data`](./test/my-data) directory to see it in action.

# Usage

`$ npm i combine-json`

```javascript
const { combine } = require('combine-json')

const myBigJsonObject = await combine('path/to/the/root/dir')
```

# API

See the [js docs](https://userpixel.github.io/combine-json/) online.

## Known limitations

* In the current implementation we ignore any directory starting with `.`.
* If a folder contains subfolders or files that look like numbers, an array will be created instead of an object.

# CLI

You can use the CLI for testing what the output may look like.

```json
$ npx combine-json test/my-data/
{
    "address": {
        "street": "Hittepågatan 13",
        "city": "Stockholm",
        "country": "Sweden",
        "zip": "11122"
    },
    "name": "Alex Ewerlöf",
    "todos": [
        {
            "id": 1,
            "title": "document the module"
        },
        {
            "id": 2,
            "title": "write some tests"
        },
        {
            "id": 3,
            "title": "publish it for good"
        }
    ]
}
```

---

_Made in Sweden by [@alexewerlof](https://twitter.com/alexewerlof)_
