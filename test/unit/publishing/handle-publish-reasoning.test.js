const { EMPTY, INVALID, UNSUCCESFUL } = require('../../../app/constants/failure-reasons')

const handlePublishReasoning = require('../../../app/publishing/handle-publish-reasoning')

let error

describe('Handle error message from attempting to publish a statement', () => {
  describe('When error is an empty email', () => {
    beforeEach(() => {
      error = { message: 'Email is invalid: Email cannot be empty.' }
    })

    test('returns EMPTY', () => {
      const result = handlePublishReasoning(error)
      expect(result).toBe(EMPTY)
    })
  })

  describe('When error is an invalid email', () => {
    beforeEach(() => {
      error = { message: 'Email is invalid: The email provided is invalid.' }
    })

    test('returns INVALID', () => {
      const result = handlePublishReasoning(error)
      expect(result).toBe(INVALID)
    })
  })

  describe('When error is an unrecognised isssue', () => {
    beforeEach(() => {
      error = { message: 'Unknown issue' }
    })

    test('returns UNSUCCESFUL', () => {
      const result = handlePublishReasoning(error)
      expect(result).toBe(UNSUCCESFUL)
    })
  })

  describe('When error is invalid', () => {
    beforeEach(() => {
      error = {}
    })

    test('returns UNSUCCESFUL', () => {
      const result = handlePublishReasoning(error)
      expect(result).toBe(UNSUCCESFUL)
    })
  })
})
