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

function isAcceptableFile(accept, filePath) {
    if (typeof accept === 'string') {
        return getFileExtension(filePath).toUpperCase() === accept.toUpperCase()
    }
    return accept(filePath)
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
        if (stat.isDirectory()) {
            return {
                isDir: true,
                path,
                key: name,
            }
        } else if (stat.isFile() && isAcceptableFile(accept, path)) {
            return {
                isFile: true,
                path,
                key: getFileNameWithoutExtension(path)
            }
        }
    })
    return mappedEntities.filter(Boolean)
}

/**
 * It looks into the path:
 * * For every JSON file it finds, it creates a key with the file name (without the `.json` extension)
 *   The value will be the contents of the file parsed in JSON.
 * * For every directory, it creates a key with the file name.
 *   The value will be created by calling the `combine()` function recursively on the subdirectory.
 * @param {string} pathToConfig - The path to a folder that contains the files and subdirectories
 * @param {object} [options] - options for customizing the behavior of the algorithm
 * @param {string|function} [options.accept='.json'] - the file extension to accept (including the dot prefix).
 * You can also pass a function that receives the file name and returns a truthy value if it is acceptable.
 * @param {function} [options.parser=JSON.parse] - use a custom parser. If you want to use JSON5 pass JSON5.parse
 * @param {boolean} [options.autoArray=true] - should we automatically assume that if an object only
 *        contains consecutive numerical keys that start with zero represents an array?
 * @throws An error if it can't access or parse a file or directory.
 * @returns {object} A JavaScript object (or an array if that's what the data represents).
 */
async function combine(pathToConfig, options = {}) {
    const { parser = JSON.parse, autoArray = true, accept = '.json'}
    const entities = await getDirEntities(pathToConfig, accept)
    const ret = autoArray && representArrayIndices(entities) ? [] : {}
    await asyncMap(entities, async entity => {
        if (entity.isFile) {
            ret[entity.key] = await parseFile(entity.path, parser)
        } else if (entity.isDir) {
            ret[entity.key] = await combine(entity.path, options)
        }
    })
    return ret
}

module.exports = { combine }
