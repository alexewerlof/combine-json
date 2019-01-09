const { readFile, readdir, lstat } = require('fs')
const { join, parse } = require('path')
const { promisify } = require('util')
const JSON5 = require('json5')

const aReadFile = promisify(readFile)
const aReadDir = promisify(readdir)
const aLStat = promisify(lstat)

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

async function loadText(filePath) {
    const buff = await aReadFile(filePath)
    return buff.toString()
}

async function parseFile(filePath) {
    const text = await loadText(filePath)
    try {
        return JSON5.parse(text)
    } catch (json5ParseError) {
        throw new Error(`Failed to parse ${filePath}: ${json5ParseError}`)
    }
}

async function getDirContents(dirPath) {
    const allEntities = await aReadDir(dirPath)
    const mappedEntities = await Promise.all(allEntities.map(async entity => {
        const path = join(dirPath, entity)
        const stat = await aLStat(join(dirPath, entity))
        if (stat.isDirectory()) {
            return {
                isDir: true,
                path,
                key: entity,
            }
        } else if (stat.isFile() && hasJsonExtension(path)) {
            return {
                isFile: true,
                path,
                key: getFileNameWithoutExtension(entity)
            }
        }
    }))
    return mappedEntities.filter(Boolean)
}

async function aggregate(pathToConfig) {
    const rootContents = await getDirContents(pathToConfig)
    const ret = representArrayIndices(rootContents) ? [] : {}
    await Promise.all(rootContents.map(async content => {
        if (content.isFile) {
            ret[content.key] = await parseFile(content.path)
        } else if (content.isDir) {
            ret[content.key] = await aggregate(content.path)
        }
    }))
    return ret
}

module.exports = { aggregate }
