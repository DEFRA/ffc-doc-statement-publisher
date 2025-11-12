const config = require('../../../app/config')
const getPersonalisation = require('../../../app/publishing/get-personalisation')

let businessName
let scheme
let transactionDate

describe('getPersonalisation', () => {
  beforeEach(() => {
    businessName = 'Mr A Farmer'
    scheme = {
      name: 'Test Scheme',
      shortName: 'TS',
      year: '2020',
      frequency: 'Annual'
    }
    transactionDate = '2024-08-01T00:00:00.000Z'
  })

  describe('basic scheme properties', () => {
    const keysToTest = [
      ['schemeName', (r) => r.schemeName, () => scheme.name],
      ['schemeShortName', (r) => r.schemeShortName, () => scheme.shortName],
      ['schemeFrequency', (r) => r.schemeFrequency, () => scheme.frequency.toLowerCase()],
      ['schemeYear', (r) => r.schemeYear, () => scheme.year],
      ['businessName', (r) => r.businessName, () => businessName]
    ]

    test.each(keysToTest)('returns %s correctly', (_, getter, expected) => {
      const result = getPersonalisation(scheme.name, scheme.shortName, scheme.year, scheme.frequency, businessName, transactionDate)
      expect(getter(result)).toBe(expected())
    })
  })

  describe('DP scheme transactionDate formatting', () => {
    beforeEach(() => {
      scheme.shortName = 'DP'
    })

    test('converts ISO date format to human-readable format', () => {
      const result = getPersonalisation(scheme.name, scheme.shortName, scheme.year, scheme.frequency, businessName, transactionDate)
      expect(result.transactionDate).toBe('1 August 2024')
    })

    const dateTestCases = [
      { input: '2024-12-25T00:00:00.000Z', expected: '25 December 2024' },
      { input: '2023-01-01T12:30:45.123Z', expected: '1 January 2023' },
      { input: '2025-06-15T23:59:59.999Z', expected: '15 June 2025' },
      { input: '2024-02-29T00:00:00.000Z', expected: '29 February 2024' },
      { input: '2024-09-03T00:00:00.000Z', expected: '3 September 2024' }
    ]

    test.each(dateTestCases)('formats $input correctly', ({ input, expected }) => {
      const result = getPersonalisation(scheme.name, scheme.shortName, scheme.year, scheme.frequency, businessName, input)
      expect(result.transactionDate).toBe(expected)
    })

    test('handles null/undefined transactionDate', () => {
      const resultNull = getPersonalisation(scheme.name, scheme.shortName, scheme.year, scheme.frequency, businessName, null)
      const resultUndefined = getPersonalisation(scheme.name, scheme.shortName, scheme.year, scheme.frequency, businessName, undefined)
      expect(resultNull.transactionDate).toBeNull()
      expect(resultUndefined.transactionDate).toBeUndefined()
    })

    test('returns schemeFrequency="Annual"', () => {
      const result = getPersonalisation(scheme.name, scheme.shortName, scheme.year, scheme.frequency, businessName, transactionDate)
      expect(result.schemeFrequency).toBe('Annual')
    })

    test('returns latestDownloadDate correctly', () => {
      const result = getPersonalisation(scheme.name, scheme.shortName, scheme.year, scheme.frequency, businessName, transactionDate)
      const currentDate = new Date()
      const daysToAdd = config.retentionPeriodInWeeks * 7
      const expectedDate = new Date(currentDate.setDate(currentDate.getDate() + daysToAdd))
      const expectedFormattedDate = `${expectedDate.getDate()} ${['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][expectedDate.getMonth()]} ${expectedDate.getFullYear()}`
      expect(result.latestDownloadDate).toBe(expectedFormattedDate)
    })
  })

  describe('non-DP scheme transactionDate', () => {
    test('returns undefined transactionDate', () => {
      scheme.shortName = 'TS'
      const result = getPersonalisation(scheme.name, scheme.shortName, scheme.year, scheme.frequency, businessName, transactionDate)
      expect(result.transactionDate).toBeUndefined()
    })
  })
})
