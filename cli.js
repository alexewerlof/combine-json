const { isAbsolute, resolve } = require('path')
const { combine } = require('./index')

function errorHandler(err) {
    process.exitCode = process.exitCode || 1
    console.error(err);
    if (err.stack) {
        console.error(err.stack)
    }
}

process.on('unhandledRejection', (err) => {
    console.log(`unhandledRejection`)
    errorHandler(err)
})

function runAsyncMain(main, ...args) {
    const promise = new Promise(resolve => resolve(main(...args)))
    promise.catch(errorHandler);
}

async function main() {
    const dirName = process.argv[2]
    const configPath = isAbsolute(dirName) ? dirName : resolve(process.cwd(), dirName)
    console.log(JSON.stringify(await combine(configPath), undefined, 4))
}

runAsyncMain(main)