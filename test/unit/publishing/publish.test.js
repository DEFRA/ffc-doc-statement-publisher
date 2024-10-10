const publish = require("../../../app/publishing/publish")
const publishByEmail = require('../../../app/publishing/publish-by-email')

jest.mock('../../../app/publishing/publish-by-email')

jest.mock('../../../app/storage', () => ({
    getFile: jest.fn().mockResolvedValueOnce(new Buffer.from("Some random byes"))
}))

jest.mock('../../../app/retry', () => jest.fn())

describe('Publish document', () => {
    afterEach(() => {
      jest.clearAllMocks()
    })
    test('Should return rejected promise', () => {
        publishByEmail.mockRejectedValue('Error')
        expect(publish(null, null, null, null))
            .rejects.toBe('Error')
    })
})
  