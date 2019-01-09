const { readFile, readdir, lstat } = require('fs')
const { join, parse } = require('path')
const { promisify } = require('util')
const JSON5 = require('json5')

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

async function parseFile(filePath) {
    const buff = await asyncReadFile(filePath)
    const text = buff.toString()
    try {
        return JSON5.parse(text)
    } catch (json5ParseError) {
        throw new Error(`Failed to parse ${filePath}: ${json5ParseError}`)
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

async function combine(pathToConfig) {
    const contents = await getDirContents(pathToConfig)
    const ret = representArrayIndices(contents) ? [] : {}
    await asyncMap(contents, async content => {
        if (content.isFile) {
            ret[content.key] = await parseFile(content.path)
        } else if (content.isDir) {
            ret[content.key] = await combine(content.path)
        }
    })
    return ret
}

module.exports = { combine }
