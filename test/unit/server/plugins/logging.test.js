describe('logging plugin', () => {
  let loggingPlugin

  beforeEach(() => {
    loggingPlugin = require('../../../../app/server/plugins/logging')
  })

  test('exports an object', () => {
    expect(typeof loggingPlugin).toBe('object')
  })

  test('has plugin property', () => {
    expect(loggingPlugin).toHaveProperty('plugin')
  })

  test('plugin is hapi-pino', () => {
    expect(loggingPlugin.plugin).toBe(require('hapi-pino'))
  })

  test('has options property', () => {
    expect(loggingPlugin).toHaveProperty('options')
  })

  test('options has correct properties', () => {
    expect(loggingPlugin.options).toEqual({
      logPayload: true,
      level: 'warn'
    })
  })

  test('logPayload is true', () => {
    expect(loggingPlugin.options.logPayload).toBe(true)
  })

  test('level is warn', () => {
    expect(loggingPlugin.options.level).toBe('warn')
  })
})
