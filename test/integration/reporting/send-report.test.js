const publishByEmail = require('../../../app/publishing/publish-by-email')
const db = require('../../../app/data')
jest.mock('../../../app/publishing/publish-by-email')
const sendReport = require('../../../app/reporting/send-report')
const { mockStatement1, mockStatement2 } = require('../../mocks/statement')
const { mockDelivery1, mockDelivery2 } = require('../../mocks/delivery')

describe('sendReport', () => {
  beforeEach(async () => {
    jest.clearAllMocks()
    jest.useFakeTimers().setSystemTime(new Date(2022, 7, 5, 15, 30, 10, 120))

    await db.sequelize.truncate({ cascade: true })
    await db.statement.bulkCreate([mockStatement1, mockStatement2])
    await db.delivery.bulkCreate([mockDelivery1, mockDelivery2])
  })

  afterAll(async () => {
    await db.sequelize.truncate({ cascade: true })
    await db.sequelize.close()
  })

  test('sends report when there are deliveries', async () => {
    const schemeName = mockStatement1.schemeName
    const template = 'template'
    const email = 'test@example.com'
    const startDate = new Date(2022, 6, 1)
    const endDate = new Date(2022, 8, 1)
    await sendReport(schemeName, template, email, startDate, endDate)

    expect(publishByEmail).toHaveBeenCalledWith(
      template,
      email,
      expect.any(Buffer),
      expect.objectContaining({
        schemeName,
        startDate,
        endDate
      }),
      expect.any(String)
    )
  })

  test('does not send report when there are no deliveries', async () => {
    const schemeName = mockStatement1.schemeName
    const template = 'template'
    const email = 'test@example.com'
    const startDate = new Date(2023, 6, 1)
    const endDate = new Date(2023, 8, 1)

    await sendReport(schemeName, template, email, startDate, endDate)

    expect(publishByEmail).not.toHaveBeenCalled()
  })
})
