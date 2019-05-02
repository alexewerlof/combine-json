const { expect } = require('chai')
const { _test: { getKey } } = require('../index')

describe('getKey()', () => {
    it('can parse a key name for a file', () => {
        expect(getKey('todos/0/id.json')).to.deep.equal(['todos', '0', 'id'])
    })
    
    it('does not choke when it is a directory name', () => {
        expect(getKey('todos/0/id')).to.deep.equal(['todos', '0', 'id'])
    })
})