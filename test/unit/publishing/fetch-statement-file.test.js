const axios = require('axios')
const fetchStatementFile = require('../../../app/publishing/fetch-statement-file')

jest.mock('axios')

describe('fetchStatementFile', () => {
  test('should fetch the file and return it as a buffer', async () => {
    const url = 'https://example.com/statement.pdf'
    const mockData = new ArrayBuffer(8)
    axios.get.mockResolvedValue({ data: mockData })

    const result = await fetchStatementFile(url)

    expect(result).toBeInstanceOf(Buffer)
    expect(result).toEqual(Buffer.from(mockData))
  })

  test('should throw an error if the fetch fails', async () => {
    const url = 'https://example.com/statement.pdf'
    const mockError = new Error('Network Error')
    axios.get.mockRejectedValue(mockError)

    await expect(fetchStatementFile(url)).rejects.toThrow('Network Error')
  })
})
