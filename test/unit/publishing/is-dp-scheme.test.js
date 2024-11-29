const { DP } = require('../../../app/constants/scheme-names').SHORT_NAMES
const isDpScheme = require('../../../app/publishing/is-dp-scheme')

test('should return true for DP scheme', () => {
  const shortName = DP
  const result = isDpScheme(shortName)
  expect(result).toBe(true)
})

test('should return false for non-DP scheme', () => {
  const shortName = 'NON_DP'
  const result = isDpScheme(shortName)
  expect(result).toBe(false)
})
