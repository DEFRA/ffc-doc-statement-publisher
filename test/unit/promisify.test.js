const { test } = require("../../app/config/database")
const promisify = require ("../../app/promisify")

function mockFunction(a,b){
    return a+b
}

describe('promisify', () => {
    beforeEach(() => {
      jest.clearAllMocks()
    })
    it('promisifies function', async () => {
        const _sut = promisify(mockFunction)
        expect(_sut().then).toBeTruthy()
        expect(typeof _sut().then).toEqual('function')
    })
    it('promisified function is callable', async () => {
        const _sut = promisify(mockFunction)
        expect.assertions(1)
        _sut(2,2)
            .then(result => {
                expect(result).toEqual(4)
            })
    })
})  