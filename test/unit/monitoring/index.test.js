jest.useFakeTimers()
jest.spyOn(global, 'setTimeout')
jest.mock('../../../app/monitoring/update-deliveries')
const mockUpdateDeliveries = require('../../../app/monitoring/update-deliveries')

// Mock console methods to prevent pollution
jest.spyOn(console, 'log').mockImplementation(() => { })
jest.spyOn(console, 'error').mockImplementation(() => { })
jest.spyOn(console, 'warn').mockImplementation(() => { })

mockUpdateDeliveries.mockResolvedValue({ totalProcessed: 5 })

const monitoring = require('../../../app/monitoring')
const config = require('../../../app/config')

describe('monitoring service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterAll(() => {
    console.log.mockRestore()
    console.error.mockRestore()
    console.warn.mockRestore()
  })

  test('calls update deliveries once', async () => {
    await monitoring.start()
    expect(mockUpdateDeliveries).toHaveBeenCalledTimes(1)
  })

  test('calls setTimeout once', async () => {
    await monitoring.start()
    expect(setTimeout).toHaveBeenCalledTimes(1)
  })

  test('schedules the next update cycle with the correct interval', async () => {
    await monitoring.start()
    expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), config.deliveryCheckInterval)
  })

  test('should use backoff delay when updateDeliveries throws', async () => {
    mockUpdateDeliveries.mockRejectedValueOnce(new Error('error'))
    await monitoring.start()

    expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), 1500)
  })
})
