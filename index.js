const { readFile, readdir, lstat } = require('graceful-fs') //This library avoids errors like EMFILE: too many open files, in folders with many files
const { join, parse, sep } = require('path')
const { promisify } = require('util')
const glob = require('glob')
const set = require('lodash.set')

const asyncReadFile = promisify(readFile)
const asyncGlob = promisify(glob)
const asyncMap = (arr, callback) => Promise.all(arr.map((...args) => callback(...args)))

async function parseFile(filePath, parser = JSON.parse) {
    const buff = await asyncReadFile(filePath)
    const text = buff.toString()
    try {
        return parser(text)
    } catch (parseError) {
        throw new Error(`Failed to parse ${filePath}. Error: ${parseError}`)
    }
}

function getKey(path) {
    const parts = path.split(sep)
    if (parts.length) {
        const fileName = parts[parts.length - 1]
        parts[parts.length - 1] = parse(fileName).name
    }
    return parts
}

async function processMatch(result, root, filePath, parser) {
    const fullPath = join(root, filePath)
    const what = await parseFile(fullPath, parser) 
    const where = getKey(filePath)
    set(result, where, what)
    return result
}

/**
 * It looks into the path:
 * * For every JSON file it finds, it creates a key with the file name (without the `.json` extension)
 *   The value will be the contents of the file parsed in JSON.
 * * For every directory, it creates a key with the file name.
 *   The value will be created by calling the `combine()` function recursively on the subdirectory.
 * @param {string} root - The path to a folder that contains the files and subdirectories
 * @param {object} [options] - options for customizing the behavior of the algorithm
 * @param {function} [options.parser=JSON.parse] - a custom parser that receives the contents of the
 * file as the only argument and returns the parsed value.
 * The `parser` function can even be `async` (returning a promise)
 * @example If you want to use `json5` pass `JSON5.parse`.
 * @example If you use `js-yaml`, pass `jsYaml.safeLoad`.
 * @example If you use `ini`, pass `ini.parse`.
 * @param {string} [options.include='*.json'] - a glob pattern for what to include
 * @param {string} [options.exclude] - a glob pattern for what to exclude
 * @throws An error if it can't access or parse a file or directory.
 * @returns {object} A JavaScript object (or an array if that's what the data represents).
 */
async function combine(root, options = {}) {
    const { parser, include = '*.json', exclude } = options
    const matches = await asyncGlob(include, {
        // glob options: https://www.npmjs.com/package/glob#options
        ignore: exclude,
        cwd: root,
        mark: true,
        nocase: true,
        nodir: true,
        matchBase: true
    })
    const result = {}
    await asyncMap(matches, filePath => processMatch(result, root, filePath, parser))

    return result
}

module.exports = { combine, _test: { getKey, processMatch } }
