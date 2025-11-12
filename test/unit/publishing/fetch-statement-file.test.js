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

  const errorScenarios = [
    {
      description: 'when e.response exists',
      mockError: {
        message: 'Request failed with status code 404',
        response: { status: 404, data: { message: 'Not Found' } }
      },
      expectedLogs: [
        'FetchStatementFile Error: Request failed with status code 404',
        'Fetch File Status code: 404',
        'Error message: Not Found'
      ]
    },
    {
      description: 'when e.request exists',
      mockError: {
        message: 'Network Error',
        request: {}
      },
      expectedLogs: [
        'FetchStatementFile Error: Network Error',
        'No response received from the server when fetching file.'
      ]
    },
    {
      description: 'when error is thrown during setup',
      mockError: {
        message: 'Something went wrong'
      },
      expectedLogs: [
        'FetchStatementFile Error: Something went wrong',
        'Error setting up the fetchStatementFile request: Something went wrong'
      ]
    }
  ]

  test.each(errorScenarios)(
    'should throw an error and log messages $description',
    async ({ mockError, expectedLogs }) => {
      const url = 'https://example.com/statement.pdf'
      axios.get.mockRejectedValue(mockError)
      console.error = jest.fn()

      await expect(fetchStatementFile(url)).rejects.toEqual(mockError)
      expectedLogs.forEach(log => {
        expect(console.error).toHaveBeenCalledWith(log)
      })
    }
  )
})
