jest.useFakeTimers()
jest.spyOn(global, 'setTimeout')
jest.mock('../../../app/monitoring/update-deliveries')
const mockUpdateDeliveries = require('../../../app/monitoring/update-deliveries')
const monitoring = require('../../../app/monitoring')
const config = require('../../../app/config')

describe('app', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('calls update deliveries once', async () => {
    await monitoring.start()
    expect(mockUpdateDeliveries).toHaveBeenCalledTimes(1)
  })

  test('calls setTimeout once', async () => {
    await monitoring.start()
    expect(setTimeout).toHaveBeenCalledTimes(1)
  })

  test('calls setTimeout with start and delivery interval from config as parameters', async () => {
    await monitoring.start()
    expect(setTimeout).toHaveBeenCalledWith(monitoring.start, config.deliveryCheckInterval)
  })

  test('should call setTimeout when updateDeliveries throws', async () => {
    mockUpdateDeliveries.mockRejectedValue(new Error('error'))
    await monitoring.start()
    expect(setTimeout).toHaveBeenCalled()
  })
})
