const matchPattern = require('../../../app/messaging/filename-regex-validation')
const mockMessagingSchema = require('../../mocks/messaging-schema')

describe('matchPattern', () => {
  test('validates a string that matches the pattern', () => {
    const str = mockMessagingSchema.filename
    expect(matchPattern(str)).toBe(true)
  })

  test('returns false for a string that does not match the pattern', () => {
    const wrongFilename = mockMessagingSchema.filename + 'wrong'
    expect(matchPattern(wrongFilename)).toBe(false)
  })
})
