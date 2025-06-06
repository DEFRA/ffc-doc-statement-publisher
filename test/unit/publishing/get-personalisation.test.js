const getPersonalisation = require('../../../app/publishing/get-personalisation')
let businessName
let scheme

describe('get personalisation', () => {
  beforeEach(() => {
    businessName = 'Mr A Farmer'
    scheme = {
      name: 'Test Scheme',
      shortName: 'TS',
      year: '2020',
      frequency: 'Annual'
    }
  })

  test('returns scheme name', () => {
    const result = getPersonalisation(scheme.name, scheme.shortName, scheme.year, scheme.frequency, businessName)
    expect(result.schemeName).toBe(scheme.name)
  })

  test('returns scheme short name', () => {
    const result = getPersonalisation(scheme.name, scheme.shortName, scheme.year, scheme.frequency, businessName)
    expect(result.schemeShortName).toBe(scheme.shortName)
  })

  test('returns scheme frequency to lower case', () => {
    const result = getPersonalisation(scheme.name, scheme.shortName, scheme.year, scheme.frequency, businessName)
    expect(result.schemeFrequency).toBe(scheme.frequency.toLowerCase())
  })

  test('returns scheme year', () => {
    const result = getPersonalisation(scheme.name, scheme.shortName, scheme.year, scheme.frequency, businessName)
    expect(result.schemeYear).toBe(scheme.year)
  })

  test('returns business name', () => {
    const result = getPersonalisation(scheme.name, scheme.shortName, scheme.year, scheme.frequency, businessName)
    expect(result.businessName).toBe(businessName)
  })

  test('returns schemeShortName="advanced" when scheme.shortName="SFIA" ', () => {
    scheme.shortName = 'SFIA'
    const result = getPersonalisation(scheme.name, scheme.shortName, scheme.year, scheme.frequency, businessName)
    expect(result.schemeShortName).toBe('advanced')
  })

  test('returns schemeFrequency="one-off" when scheme.shortName="SFIA" ', () => {
    scheme.shortName = 'SFIA'
    const result = getPersonalisation(scheme.name, scheme.shortName, scheme.year, scheme.frequency, businessName)
    expect(result.schemeFrequency).toBe('one-off')
  })
  test('returns schemeFrequency="Annual" when scheme.shortName="DP" ', () => {
    scheme.shortName = 'DP'
    const result = getPersonalisation(scheme.name, scheme.shortName, scheme.year, scheme.frequency, businessName)
    expect(result.schemeFrequency).toBe('Annual')
  })
})
