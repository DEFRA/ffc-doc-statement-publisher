const db = require('../../../app/data')
const getDeliveriesForReport = require('../../../app/reporting/get-deliveries-for-report')
const QueryStream = require('pg-query-stream')

jest.mock('../../../app/data')
jest.mock('pg-query-stream')

describe('getDeliveriesForReport', () => {
  let mockClient
  let mockStream

  beforeEach(() => {
    jest.clearAllMocks()

    mockClient = {
      query: jest.fn()
    }

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

    db.sequelize.connectionManager.getConnection.mockResolvedValue(mockClient)
    mockClient.query.mockReturnValue(mockStream)
  })

  const mockDeliveries = [
    { deliveryId: 1, statementId: 101, method: 'email', reference: '123e4567-e89b-12d3-a456-426614174000', requested: new Date('2024-12-01T10:00:00Z'), completed: new Date('2024-12-02T10:00:00Z') },
    { deliveryId: 2, statementId: 102, method: 'sms', reference: '123e4567-e89b-12d3-a456-426614174001', requested: new Date('2024-12-03T10:00:00Z'), completed: new Date('2024-12-04T10:00:00Z') }
  ]

  test('returns stream of deliveries for date range and scheme', async () => {
    const schemeName = 'TEST'
    const start = new Date('2024-12-01T00:00:00Z')
    const end = new Date('2024-12-31T23:59:59Z')
    const transaction = {}

    const stream = await getDeliveriesForReport(schemeName, start, end, transaction)

    // Check that QueryStream was instantiated correctly
    expect(QueryStream).toHaveBeenCalledWith(
      expect.stringContaining('SELECT d.*, s.*'),
      [schemeName, start, end]
    )

    expect(db.sequelize.connectionManager.getConnection).toHaveBeenCalled()
    expect(mockClient.query).toHaveBeenCalledWith(expect.any(QueryStream))

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
