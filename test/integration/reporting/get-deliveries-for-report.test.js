const mockRaw = jest.fn()

jest.mock('../../../app/database', () => ({
  client: { raw: (...args) => mockRaw(...args) }
}))

const getDeliveriesForReport = require('../../../app/reporting/get-deliveries-for-report')

describe('getDeliveriesForReport', () => {
  let mockStream

  beforeEach(() => {
    jest.clearAllMocks()

    mockStream = {
      on: jest.fn((event, callback) => {
        if (event === 'data') {
          mockDeliveries.forEach(delivery => callback(delivery))
        }
        if (event === 'end') {
          callback()
        }
        return mockStream
      })
    }

    mockRaw.mockReturnValue({ stream: jest.fn(() => mockStream) })
  })

  const mockDeliveries = [
    { deliveryId: 1, statementId: 101, method: 'email', reference: '123e4567-e89b-12d3-a456-426614174000', requested: new Date('2024-12-01T10:00:00Z'), completed: new Date('2024-12-02T10:00:00Z') },
    { deliveryId: 2, statementId: 102, method: 'sms', reference: '123e4567-e89b-12d3-a456-426614174001', requested: new Date('2024-12-03T10:00:00Z'), completed: new Date('2024-12-04T10:00:00Z') }
  ]

  test('returns stream of deliveries for date range and scheme', async () => {
    const schemeName = 'TEST'
    const start = new Date('2024-12-01T00:00:00Z')
    const end = new Date('2024-12-31T23:59:59Z')

    const stream = await getDeliveriesForReport(schemeName, start, end)

    expect(mockRaw).toHaveBeenCalledWith(
      expect.stringContaining('SELECT d.*, s.*'),
      [schemeName, start, end]
    )

    expect(stream).toBe(mockStream)

    // Collect data from stream
    const collected = []
    await new Promise(resolve => {
      stream.on('data', data => collected.push(data))
      stream.on('end', resolve)
    })

    expect(collected).toEqual(mockDeliveries)
  })
})
