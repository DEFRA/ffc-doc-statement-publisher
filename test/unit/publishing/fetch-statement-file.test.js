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

  test('should throw an error and log messages when e.response exists', async () => {
    const url = 'https://example.com/statement.pdf'
    const errorMessage = 'Request failed with status code 404'
    const mockError = {
      message: errorMessage,
      response: {
        status: 404,
        data: {
          message: 'Not Found'
        }
      }
    }
    axios.get.mockRejectedValue(mockError)
    console.error = jest.fn()

    await expect(fetchStatementFile(url)).rejects.toEqual(mockError)
    expect(console.error).toHaveBeenCalledWith(`FetchStatementFile Error: ${errorMessage}`)
    expect(console.error).toHaveBeenCalledWith(`Fetch File Status code: ${mockError.response.status}`)
    expect(console.error).toHaveBeenCalledWith(`Error message: ${mockError.response.data.message}`)
  })

  test('should throw an error and log messages when e.request exists', async () => {
    const url = 'https://example.com/statement.pdf'
    const errorMessage = 'Network Error'
    const mockError = {
      message: errorMessage,
      request: {}
    }
    axios.get.mockRejectedValue(mockError)
    console.error = jest.fn()

    await expect(fetchStatementFile(url)).rejects.toEqual(mockError)
    expect(console.error).toHaveBeenCalledWith(`FetchStatementFile Error: ${errorMessage}`)
    expect(console.error).toHaveBeenCalledWith('No response received from the server when fetching file.')
  })

  test('should throw an error and log messages when error is thrown during setup', async () => {
    const url = 'https://example.com/statement.pdf'
    const errorMessage = 'Something went wrong'
    const mockError = {
      message: errorMessage
    }
    axios.get.mockRejectedValue(mockError)
    console.error = jest.fn()

    await expect(fetchStatementFile(url)).rejects.toEqual(mockError)
    expect(console.error).toHaveBeenCalledWith(`FetchStatementFile Error: ${errorMessage}`)
    expect(console.error).toHaveBeenCalledWith(`Error setting up the fetchStatementFile request: ${errorMessage}`)
  })
})
