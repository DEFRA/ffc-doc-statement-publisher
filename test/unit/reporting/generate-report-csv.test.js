const generateReportCsv = require('../../../app/reporting/generate-report-csv')
describe('generateReportCsv', () => {
  test('should generate a CSV file with the correct filename and data', () => {
    const schemeName = 'Test Scheme'
    const runDate = new Date('2024-12-12T00:00:00Z')
    const deliveries = [
      { deliveryId: 1, statementId: 101, method: 'email', reference: '123e4567-e89b-12d3-a456-426614174000', requested: new Date('2024-12-01T10:00:00Z').toISOString(), completed: new Date('2024-12-02T10:00:00Z').toISOString() },
      { deliveryId: 2, statementId: 102, method: 'letter', reference: '123e4567-e89b-12d3-a456-426614174001', requested: new Date('2024-12-03T10:00:00Z').toISOString(), completed: new Date('2024-12-04T10:00:00Z').toISOString() }
    ]

    const result = generateReportCsv(schemeName, runDate, deliveries)

    const expectedCsv = 'deliveryId,statementId,method,reference,requested,completed\n1,101,email,123e4567-e89b-12d3-a456-426614174000,2024-12-01T10:00:00.000Z,2024-12-02T10:00:00.000Z\n2,102,letter,123e4567-e89b-12d3-a456-426614174001,2024-12-03T10:00:00.000Z,2024-12-04T10:00:00.000Z'
    const expectedFilename = 'test_scheme-2024-12-12T00:00:00.000Z.csv'
    const expectedFiledata = Buffer.from(expectedCsv, 'utf-8')

    expect(result.filename).toBe(expectedFilename)
    expect(result.filedata.toString()).toEqual(expectedFiledata.toString())
  })
})
