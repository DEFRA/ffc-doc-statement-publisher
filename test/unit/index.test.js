jest.mock('../../app/messaging')
const mockMessaging = require('../../app/messaging')
jest.mock('../../app/monitoring')
const mockMonitoring = require('../../app/monitoring')
jest.mock('../../app/storage')
const mockStorage = require('../../app/storage')
jest.mock('../../app/reporting')
const mockReporting = require('../../app/reporting')

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
})
