const validateFilename = require('../../../app/messaging/filename-regex-validation')

describe('validateFilename', () => {
  test('validates a string that matches the pattern', () => {
    const validFilename = 'FFC_PaymentStatement_SFI_2022_1234567890_2022080515301012.pdf'
    expect(validateFilename(validFilename)).toBe(true)
  })

  test('returns false for a string with invalid team name', () => {
    const invalidTeamName = 'FF_PaymentStatement_SFI_2022_1234567890_2022080515301012.pdf'
    expect(validateFilename(invalidTeamName)).toBe(false)
  })

  test('returns false for a string with invalid document prefix', () => {
    const invalidDocumentPrefix = 'FFC_123PaymentStatement_SFI_2022_1234567890_2022080515301012.pdf'
    expect(validateFilename(invalidDocumentPrefix)).toBe(false)
  })

  test('returns false for a string with invalid scheme short name', () => {
    const invalidSchemeShortName = 'FFC_PaymentStatement_S_2022_1234567890_2022080515301012.pdf'
    expect(validateFilename(invalidSchemeShortName)).toBe(false)
  })

  test('returns false for a string with invalid scheme year', () => {
    const invalidSchemeYear = 'FFC_PaymentStatement_SFI_22_1234567890_2022080515301012.pdf'
    expect(validateFilename(invalidSchemeYear)).toBe(false)
  })

  test('returns false for a string with invalid FRN number', () => {
    const invalidFrn = 'FFC_PaymentStatement_SFI_2022_123456789_2022080515301012.pdf'
    expect(validateFilename(invalidFrn)).toBe(false)
  })

  test('returns false for a string with invalid timestamp', () => {
    const invalidTimestamp = 'FFC_PaymentStatement_SFI_2022_1234567890_202208051530101.pdf'
    expect(validateFilename(invalidTimestamp)).toBe(false)
  })

  test('returns false for a string with invalid extension', () => {
    const invalidExtension = 'FFC_PaymentStatement_SFI_2022_1234567890_2022080515301012.docx'
    expect(validateFilename(invalidExtension)).toBe(false)
  })
})
