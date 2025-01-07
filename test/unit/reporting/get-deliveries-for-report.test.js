const getDeliveriesForReport = require('../../../app/reporting/get-deliveries-for-report')
const db = require('../../../app/data')

jest.mock('../../../app/data')

describe('getDeliveriesForReport', () => {
  test('should fetch deliveries for the given scheme name and date range', async () => {
    const schemeName = 'Test Scheme'
    const start = new Date('2024-12-01T00:00:00Z')
    const end = new Date('2024-12-31T23:59:59Z')
    const transaction = {}

    const mockDeliveries = [
      { deliveryId: 1, statementId: 101, method: 'email', reference: '123e4567-e89b-12d3-a456-426614174000', requested: new Date('2024-12-01T10:00:00Z'), completed: new Date('2024-12-02T10:00:00Z') },
      { deliveryId: 2, statementId: 102, method: 'sms', reference: '123e4567-e89b-12d3-a456-426614174001', requested: new Date('2024-12-03T10:00:00Z'), completed: new Date('2024-12-04T10:00:00Z') }
    ]

    db.delivery.findAll.mockResolvedValue(mockDeliveries)

    const result = await getDeliveriesForReport(schemeName, start, end, transaction)

    expect(db.delivery.findAll).toHaveBeenCalledWith({
      where: {
        requested: {
          [db.Op.between]: [start, end]
        }
      },
      include: [
        {
          model: db.statement,
          where: {
            schemeName
          },
          required: true
        }
      ],
      raw: true,
      transaction
    })

    expect(result).toEqual(mockDeliveries)
  })
})
