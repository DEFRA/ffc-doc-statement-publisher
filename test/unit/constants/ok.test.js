const ok = require('../../../app/constants/ok')

describe('ok constant', () => {
  test('should export an object', () => {
    expect(ok).toBeInstanceOf(Object)
  })

  test('should have OK property', () => {
    expect(ok).toHaveProperty('OK')
  })

  test('should have OK property with value "ok"', () => {
    expect(ok.OK).toBe('ok')
  })

  test('should only have one property', () => {
    expect(Object.keys(ok)).toHaveLength(1)
  })

  test('should have the expected keys', () => {
    expect(Object.keys(ok)).toStrictEqual(['OK'])
  })
})
