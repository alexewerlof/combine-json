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
    if (require.main === module) {
        const promise = new Promise(resolve => resolve(main(...args)))
        promise.catch(errorHandler);
    }
}

module.exports = { runAsyncMain }