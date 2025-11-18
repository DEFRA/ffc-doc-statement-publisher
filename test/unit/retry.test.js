const { retry } = require('../../app/retry')

describe('retry', () => {
  let mockFunction

  beforeEach(() => {
    jest.clearAllMocks()
    mockFunction = jest.fn()
  })

  test.each([
    ['successful on first try', ['success'], 1],
    ['fails once then succeeds', ['error', 'success'], 2],
    ['fails repeatedly up to max retries', ['error', 'error'], 2]
  ])('%s', async (_, results, expectedCalls) => {
    results.forEach((res, i) => {
      if (res === 'success') {
        mockFunction.mockResolvedValueOnce('success')
      } else {
        mockFunction.mockRejectedValueOnce('error')
      }
    })

    try {
      await retry(mockFunction, expectedCalls - 1)
    } catch {}

    expect(mockFunction).toHaveBeenCalledTimes(expectedCalls)
  })
})
