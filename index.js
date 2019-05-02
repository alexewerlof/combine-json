const { readFile, readdir, lstat } = require('fs')
const { join, parse } = require('path')
const { promisify } = require('util')

const asyncReadFile = promisify(readFile)
const asyncReadDir = promisify(readdir)
const asyncLStat = promisify(lstat)
const asyncMap = (arr, callback) => Promise.all(arr.map((...args) => callback(...args)))

function getFileNameWithoutExtension(filePath) {
    return parse(filePath).name
}

function getFileExtension(filePath) {
    return parse(filePath).ext
}

function strEqualCaseInsensitive(s1, s2) {
    return typeof s1 === 'string' && typeof s2 === 'string' && s1.toUpperCase() === s2.toUpperCase()
}

async function shouldProcess(path, accept, isFile) {
    if (typeof accept === 'function') {
        return await accept(path, isFile)
    }
    if (!isFile) {
        return true
    }
    if (typeof accept !== 'string') {
        throw new TypeError(`invalid 'accept' parameter: ${accept}`)
    }
    return strEqualCaseInsensitive(getFileExtension(path), accept)
}

function representArrayIndices(arr) {
    try {
        const indices = arr.map(a => a.key).map(Number).sort()
        return indices.every((n, i) => n === i)
    } catch {
        return false
    }
}

async function parseFile(filePath, parser) {
    const buff = await asyncReadFile(filePath)
    const text = buff.toString()
    try {
        return parser(text)
    } catch (parseError) {
        throw new Error(`Failed to parse ${filePath}. Error: ${parseError}`)
    }
}

async function getDirEntities(dirPath, accept) {
    const dirEntities = await asyncReadDir(dirPath)
    const mappedEntities = await asyncMap(dirEntities, async name => {
        const path = join(dirPath, name)
        const stat = await asyncLStat(path)
        const isFile = stat.isFile()
        if (!isFile && !stat.isDirectory()) {
            return
        }
        if (await shouldProcess(path, accept, isFile)) {
            return {
                isFile,
                path,
                key: parse(path).name
            }
        }
    })
    return mappedEntities.filter(Boolean)
}

/**
 * This callback decides if a file or directory should be included in the final output or not
 * @callback acceptCallback
 * @param {string} path - path to a file or directory being processed
 * @param {boolean} responseMessage - a flag indicating if it is a file or directory
 * @return {boolean} whether we should include this file/dir in the process or not
 */

/**
 * It looks into the path:
 * * For every JSON file it finds, it creates a key with the file name (without the `.json` extension)
 *   The value will be the contents of the file parsed in JSON.
 * * For every directory, it creates a key with the file name.
 *   The value will be created by calling the `combine()` function recursively on the subdirectory.
 * @param {string} pathToConfig - The path to a folder that contains the files and subdirectories
 * @param {object} [options] - options for customizing the behavior of the algorithm
 * @param {string|acceptCallback} [options.accept='.json'] - the file extension to accept (including the dot prefix).
 * You can also pass a function that returns a truthy value if it is acceptable.
 * @param {function} [options.parser=JSON.parse] - use a custom parser. If you want to use JSON5 pass JSON5.parse
 * @param {boolean} [options.autoArray=true] - should we automatically assume that if an object only
 *        contains consecutive numerical keys that start with zero represents an array?
 * @throws An error if it can't access or parse a file or directory.
 * @returns {object} A JavaScript object (or an array if that's what the data represents).
 */
async function combine(pathToConfig, options = {}) {
    const { parser = JSON.parse, autoArray = true, accept = '.json'} = options
    const entities = await getDirEntities(pathToConfig, accept)
    const ret = autoArray && representArrayIndices(entities) ? [] : {}
    await asyncMap(entities, async entity => {
        ret[entity.key] = entity.isFile ? await parseFile(entity.path, parser) : await combine(entity.path, options)
    })
    return ret
}

module.exports = { combine }
