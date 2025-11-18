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
    mapSchemeTemplateId.SFI_2023 = 'af20f680-43ef-4702-a5e0-832fe967f3a6'
    mapSchemeTemplateId.DP = '925c5cee-8721-4786-80ab-a9bef4f22161'
    mapSchemeTemplateId.SFI = 'af20f680-43ef-4702-a5e0-832fe967f3a6'
  })

  afterEach(() => {
    consoleLogSpy.mockRestore()
  })

  describe('returns null for invalid schemes', () => {
    test('when scheme is undefined', () => {
      expect(getSchemeTemplateId(undefined)).toBeNull()
    })

    test('when scheme has no shortName', () => {
      const result = getSchemeTemplateId({})
      expect(result).toBeNull()
      expect(consoleLogSpy).not.toHaveBeenCalled()
    })

    test('when scheme shortName unknown', () => {
      const scheme = { shortName: 'UNKNOWN' }
      const result = getSchemeTemplateId(scheme)
      expect(result).toBeNull()
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('No template found for scheme'))
    })
  })

  describe('returns template IDs for known year-specific schemes', () => {
    const cases = [
      [{ shortName: 'DP', year: '2024' }, 'DP_2024'],
      [{ shortName: 'DP', year: '2025' }, 'DP_2025'],
      [{ shortName: 'SFI', year: '2023' }, 'SFI_2023']
    ]

    test.each(cases)('scheme %o returns mapped template ID %s', (scheme, mapKey) => {
      const result = getSchemeTemplateId(scheme)
      expect(result).toBe(mapSchemeTemplateId[mapKey])
    })
  })

  test('returns general template ID when year-specific template not found', () => {
    const scheme = { shortName: 'DP', year: '2023' }
    const result = getSchemeTemplateId(scheme)
    expect(result).toBe(mapSchemeTemplateId.DP)
  })

  test('falls back to document types when no direct mapping exists', () => {
    const scheme = { shortName: 'SFI', year: '2023' }
    const mockTemplate = 'mock-template-id'
    const mockDocType = { template: mockTemplate }

    mapSchemeTemplateId.SFI_2023 = undefined
    mapSchemeTemplateId.SFI = undefined

    documentTypes.find = jest.fn().mockReturnValue(mockDocType)
    const result = getSchemeTemplateId(scheme)
    expect(documentTypes.find).toHaveBeenCalled()
    expect(result).toBe(mockTemplate)
  })

  test('returns null when no matching template found anywhere', () => {
    const scheme = { shortName: 'UNKNOWN', year: '2023' }
    documentTypes.find = jest.fn().mockReturnValue(undefined)
    const result = getSchemeTemplateId(scheme)
    expect(result).toBeNull()
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('No template found for scheme'))
  })
})
