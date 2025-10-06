jest.mock('../../../app/constants/document-types')
jest.mock('../../../app/constants/map-scheme-template-id')

const documentTypes = require('../../../app/constants/document-types')
const mapSchemeTemplateId = require('../../../app/constants/map-scheme-template-id')
const getSchemeTemplateId = require('../../../app/publishing/get-scheme-template-id')

describe('getSchemeTemplateId', () => {
  let consoleLogSpy

  beforeEach(() => {
    jest.clearAllMocks()
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {})

    // Mock for mapSchemeTemplateId
    mapSchemeTemplateId.DP_2024 = '925c5cee-8721-4786-80ab-a9bef4f22161'
    mapSchemeTemplateId.DP_2025 = '838adf3d-15bd-4db5-b080-a318d54da1fc'
    mapSchemeTemplateId.DP = '925c5cee-8721-4786-80ab-a9bef4f22161'
  })

  afterEach(() => {
    consoleLogSpy.mockRestore()
  })

  test('returns null when scheme is undefined', () => {
    const result = getSchemeTemplateId(undefined)
    expect(result).toBeNull()
  })

  test('returns null when scheme has no shortName', () => {
    const result = getSchemeTemplateId({})
    expect(result).toBeNull()
    expect(consoleLogSpy).not.toHaveBeenCalled() // No log in getSchemeTemplateId for this case
  })

  test('returns null and logs message when getDocTypeIdForScheme is called with no shortName', () => {
    // Create a scheme that will go through all checks and fail at the end
    const scheme = { shortName: 'UNKNOWN' }

    const result = getSchemeTemplateId(scheme)
    expect(result).toBeNull()
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('No template found for scheme'))
  })

  test('returns template ID for DP 2024', () => {
    const scheme = { shortName: 'DP', year: '2024' }
    const result = getSchemeTemplateId(scheme)
    expect(result).toBe(mapSchemeTemplateId.DP_2024)
  })

  test('returns template ID for DP 2025', () => {
    const scheme = { shortName: 'DP', year: '2025' }
    const result = getSchemeTemplateId(scheme)
    expect(result).toBe(mapSchemeTemplateId.DP_2025)
  })

  test('returns general template ID when year-specific template not found', () => {
    const scheme = { shortName: 'DP', year: '2023' } // No specific template for DP_2023
    const result = getSchemeTemplateId(scheme)
    expect(result).toBe(mapSchemeTemplateId.DP)
  })

  test('returns null when no matching template is found anywhere', () => {
    const scheme = { shortName: 'UNKNOWN', year: '2023' }
    documentTypes.find = jest.fn().mockReturnValue(undefined)

    const result = getSchemeTemplateId(scheme)
    expect(result).toBeNull()
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('No template found for scheme'))
  })
})
