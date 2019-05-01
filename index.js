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

function hasJsonExtension(filePath) {
    return /.json/i.test(getFileExtension(filePath))
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
    } catch (json5ParseError) {
        throw new Error(`Failed to parse ${filePath} as ${useJson5 ? 'json5' : 'JSON'}: ${json5ParseError}`)
    }
}

async function getDirContents(dirPath) {
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
        } else if (stat.isFile() && hasJsonExtension(path)) {
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
 * @param {function} [options.parser=JSON.parse] - use a custom parser. If you want to use JSON5 pass JSON5.parse
 * @param {boolean} [options.autoArray=true] - should we automatically assume that if an object only
 *        contains consecutive numerical keys that start with zero represents an array?
 * @throws An error if it can't access or parse a file or directory.
 * @returns {object} A JavaScript object (or an array if that's what the data represents).
 */
async function combine(pathToConfig, { parser = JSON.parse, autoArray = true} = {}) {
    const contents = await getDirContents(pathToConfig)
    const ret = autoArray && representArrayIndices(contents) ? [] : {}
    await asyncMap(contents, async content => {
        if (content.isFile) {
            ret[content.key] = await parseFile(content.path, parser)
        } else if (content.isDir) {
            ret[content.key] = await combine(content.path, { parser, autoArray })
        }
    })
    return ret
}

module.exports = { combine }
