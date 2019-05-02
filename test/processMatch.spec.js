const { expect } = require('chai')
const { _test: { processMatch } } = require('../index')

describe('processMatch()', () => {
    it('parses a file into the right place', async () => {
        const result = {}
        const returnedResult = await processMatch(result, 'test/my-data', 'todos/0/id.json')
        expect(returnedResult).to.equal(result)
        expect(result).to.deep.equal({
            todos: [
                {
                    id: 1
                }
            ]
        })
    })
})