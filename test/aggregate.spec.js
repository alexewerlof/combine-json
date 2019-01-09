const { expect } = require('chai')
const { aggregate } = require('../index')

describe('aggregate()', () => {
    it('should be cool', async () => {
        const myData = await aggregate('test/my-data')
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
            await aggregate('non-existing-path')
        } catch (err) {
            expect(err).to.be.an('error')
        }
    })

    it('throws if both a directory and a JSON file with the same name', () => {
        
    })
})