const { statementReceiverApiVersion, statementReceiverEndpoint } = require('../../../app/config')
const getStatementFileUrl = require('../../../app/publishing/get-statement-file-url')

describe('getStatementFileUrl', () => {
  test('should return the correct URL for the given filename', () => {
    const filename = 'test.pdf'
    const expectedUrl = `${statementReceiverEndpoint}/${statementReceiverApiVersion}/statements/statement/${filename}`

    const result = getStatementFileUrl(filename)

    expect(result).toBe(expectedUrl)
  })
})
