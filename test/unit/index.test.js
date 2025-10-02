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

describe('app', () => {
  beforeEach(() => {
    require('../../app')
  })

  test('starts messaging', async () => {
    expect(mockMessaging.start).toHaveBeenCalled()
  })

  test('starts monitoring', async () => {
    expect(mockMonitoring.start).toHaveBeenCalled()
  })

  test('initialises reporting', async () => {
    expect(mockReporting.start).toHaveBeenCalled()
  })

  test('initialises containers', async () => {
    expect(mockStorage.initialiseContainers).toHaveBeenCalled()
  })

  test('initialises alerting if available', async () => {
    expect(mockAlerting.init).toHaveBeenCalled()
  })

  test('sets up insights', async () => {
    expect(mockInsights.setup).toHaveBeenCalled()
  })
})
