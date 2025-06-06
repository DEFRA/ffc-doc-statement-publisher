const getPersonalisation = require('../../../app/publishing/get-personalisation')
let businessName
let scheme
let transactionDate

describe('get personalisation', () => {
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

  test('returns scheme name', () => {
    const result = getPersonalisation(scheme.name, scheme.shortName, scheme.year, scheme.frequency, businessName, transactionDate)
    expect(result.schemeName).toBe(scheme.name)
  })

  test('returns scheme short name', () => {
    const result = getPersonalisation(scheme.name, scheme.shortName, scheme.year, scheme.frequency, businessName, transactionDate)
    expect(result.schemeShortName).toBe(scheme.shortName)
  })

  test('returns scheme frequency to lower case', () => {
    const result = getPersonalisation(scheme.name, scheme.shortName, scheme.year, scheme.frequency, businessName, transactionDate)
    expect(result.schemeFrequency).toBe(scheme.frequency.toLowerCase())
  })

  test('returns scheme year', () => {
    const result = getPersonalisation(scheme.name, scheme.shortName, scheme.year, scheme.frequency, businessName, transactionDate)
    expect(result.schemeYear).toBe(scheme.year)
  })

  test('returns business name', () => {
    const result = getPersonalisation(scheme.name, scheme.shortName, scheme.year, scheme.frequency, businessName, transactionDate)
    expect(result.businessName).toBe(businessName)
  })

  test('converts ISO date format to DD-MM-YYYY format for DP scheme', () => {
    scheme.shortName = 'DP'
    const result = getPersonalisation(scheme.name, scheme.shortName, scheme.year, scheme.frequency, businessName, transactionDate)
    expect(result.transactionDate).toBe('01-08-2024')
  })

  test('handles different ISO date formats for DP scheme', () => {
    scheme.shortName = 'DP'
    const testCases = [
      { input: '2024-12-25T00:00:00.000Z', expected: '25-12-2024' },
      { input: '2023-01-01T12:30:45.123Z', expected: '01-01-2023' },
      { input: '2025-06-15T23:59:59.999Z', expected: '15-06-2025' }
    ]

    testCases.forEach(({ input, expected }) => {
      const result = getPersonalisation(scheme.name, scheme.shortName, scheme.year, scheme.frequency, businessName, input)
      expect(result.transactionDate).toBe(expected)
    })
  })

  test('returns undefined transactionDate for non-DP schemes', () => {
    scheme.shortName = 'TS'
    const result = getPersonalisation(scheme.name, scheme.shortName, scheme.year, scheme.frequency, businessName, transactionDate)
    expect(result.transactionDate).toBeUndefined()
  })

  test('handles null/undefined transactionDate for DP scheme', () => {
    scheme.shortName = 'DP'
    const resultNull = getPersonalisation(scheme.name, scheme.shortName, scheme.year, scheme.frequency, businessName, null)
    const resultUndefined = getPersonalisation(scheme.name, scheme.shortName, scheme.year, scheme.frequency, businessName, undefined)

    expect(resultNull.transactionDate).toBeNull()
    expect(resultUndefined.transactionDate).toBeUndefined()
  })

  test('returns schemeShortName="advanced" when scheme.shortName="SFIA" ', () => {
    scheme.shortName = 'SFIA'
    const result = getPersonalisation(scheme.name, scheme.shortName, scheme.year, scheme.frequency, businessName, transactionDate)
    expect(result.schemeShortName).toBe('advanced')
  })

  test('returns schemeFrequency="one-off" when scheme.shortName="SFIA" ', () => {
    scheme.shortName = 'SFIA'
    const result = getPersonalisation(scheme.name, scheme.shortName, scheme.year, scheme.frequency, businessName, transactionDate)
    expect(result.schemeFrequency).toBe('one-off')
  })

  test('returns schemeFrequency="Annual" when scheme.shortName="DP" ', () => {
    scheme.shortName = 'DP'
    const result = getPersonalisation(scheme.name, scheme.shortName, scheme.year, scheme.frequency, businessName, transactionDate)
    expect(result.schemeFrequency).toBe('Annual')
  })
})
