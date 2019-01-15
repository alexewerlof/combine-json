const { expect } = require('chai')
const { combine } = require('../index')

describe('combine()', () => {
    it('should be cool', async () => {
        const myData = await combine('test/my-data', { json5: true})
        expect(myData).to.deep.equal({
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
        });
    })

    it('throws if the directory does not exist', async () => {
        try {
            await combine('non-existing-path', { json5: true})
        } catch (err) {
            expect(err).to.be.an('error')
        }
    })

    it('throws if both a directory and a JSON file with the same name', () => {
        // TODO write me
    })
})