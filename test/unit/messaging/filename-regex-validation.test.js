const validateFilename = require('../../../app/messaging/filename-regex-validation')

describe('validateFilename', () => {
  test('should return true for a valid filename', () => {
    const validFilename = 'FFC_PaymentStatement_DP_2024_1234567890_2022080515301012.pdf'
    expect(validateFilename(validFilename)).toBe(true)
  })

  test.each([
    ['invalid team name', 'FF_PaymentStatement_DP_2024_1234567890_2022080515301012.pdf'],
    ['invalid document prefix', 'FFC_123PaymentStatement_DP_2024_1234567890_2022080515301012.pdf'],
    ['invalid scheme short name', 'FFC_PaymentStatement_D_2024_1234567890_2022080515301012.pdf'],
    ['invalid scheme year', 'FFC_PaymentStatement_DP_22_1234567890_2022080515301012.pdf'],
    ['invalid FRN number', 'FFC_PaymentStatement_DP_2024_123456789_2022080515301012.pdf'],
    ['invalid timestamp', 'FFC_PaymentStatement_DP_2024_1234567890_202208051530101.pdf'],
    ['invalid extension', 'FFC_PaymentStatement_DP_2024_1234567890_2022080515301012.docx']
  ])('should return false for a string with %s', (_, invalidFilename) => {
    expect(validateFilename(invalidFilename)).toBe(false)
  })
})
