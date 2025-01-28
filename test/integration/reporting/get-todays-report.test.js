const db = require('../../../app/data')
const getTodaysReport = require('../../../app/reporting/get-todays-report')
const { mockReport1 } = require('../../mocks/report')

describe('getTodaysReport', () => {
  beforeEach(async () => {
    jest.clearAllMocks()
    jest.useFakeTimers().setSystemTime(new Date(2022, 7, 5, 15, 30, 10, 120))

    await db.sequelize.truncate({ cascade: true })
    await db.report.bulkCreate([{ ...mockReport1, ...{ sent: new Date() } }])
  })

  afterAll(async () => {
    await db.sequelize.truncate({ cascade: true })
    await db.sequelize.close()
  })

  test('returns reports sent today for the specified scheme name', async () => {
    const result = await getTodaysReport(mockReport1.schemeName)
    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ reportId: mockReport1.reportId })
      ])
    )
  })

  test('does not return reports sent on a different day', async () => {
    jest.useFakeTimers().setSystemTime(new Date(2022, 7, 6, 15, 30, 10, 120))
    const result = await getTodaysReport(mockReport1.schemeName)
    expect(result.length).toBe(0)
  })

  test('does not return reports for a different scheme name', async () => {
    const result = await getTodaysReport('DifferentSchemeName')
    console.log('whahahah', result)
    expect(result.length).toBe(0)
  })
})
