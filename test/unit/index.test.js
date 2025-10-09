jest.mock('../../app/messaging')
const mockMessaging = require('../../app/messaging')

jest.mock('../../app/monitoring')
const mockMonitoring = require('../../app/monitoring')

jest.mock('../../app/storage')
const mockStorage = require('../../app/storage')

jest.mock('../../app/reporting')
const mockReporting = require('../../app/reporting')

jest.mock('ffc-alerting-utils', () => ({
  init: jest.fn()
}))
const mockAlerting = require('ffc-alerting-utils')

jest.mock('../../app/insights', () => ({
  setup: jest.fn()
}))
const mockInsights = require('../../app/insights')

const messageConfig = require('../../app/config/message')
const { DATA_PUBLISHING_ERROR } = require('../../app/constants/alerts')
const { SOURCE } = require('../../app/constants/source')

describe('app', () => {
  test('uses alerting.init when available', async () => {
    mockAlerting.init.mockReturnValue(true)
    require('../../app')
    expect(mockAlerting.init).toHaveBeenCalledWith({
      topic: messageConfig.alertTopic,
      source: SOURCE,
      defaultType: DATA_PUBLISHING_ERROR,
      EventPublisherClass: expect.any(Function)
    })
  })

  test('sets environment variables when alerting.init is undefined', async () => {
    jest.resetModules()
    jest.doMock('ffc-alerting-utils', () => ({}))
    require('../../app')
    expect(JSON.parse(process.env.ALERT_TOPIC)).toEqual(messageConfig.alertTopic)
    expect(process.env.ALERT_SOURCE).toBe(SOURCE)
    expect(process.env.ALERT_TYPE).toBe(DATA_PUBLISHING_ERROR)
  })

  test('starts messaging', async () => {
    require('../../app')
    expect(mockMessaging.start).toHaveBeenCalled()
  })

  test('starts monitoring', async () => {
    require('../../app')
    expect(mockMonitoring.start).toHaveBeenCalled()
  })

  test('initialises reporting', async () => {
    require('../../app')
    expect(mockReporting.start).toHaveBeenCalled()
  })

  test('initialises containers', async () => {
    require('../../app')
    expect(mockStorage.initialiseContainers).toHaveBeenCalled()
  })

  test('sets up insights', async () => {
    require('../../app')
    expect(mockInsights.setup).toHaveBeenCalled()
  })
})
