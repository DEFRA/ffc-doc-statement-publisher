const { saveMetrics, createMetricRecord } = require('../../../app/metrics/create-save-metrics')
const { DEFAULT_PRINT_POST_UNIT_COST } = require('../../../app/constants/print-post-pricing')
const { PERIOD_YEAR, PERIOD_MONTH_IN_YEAR } = require('../../../app/constants/periods')

jest.mock('../../../app/data', () => ({
  metric: {
    findOne: jest.fn(),
    update: jest.fn(),
    create: jest.fn()
  }
}))

const db = require('../../../app/data')

describe('create-save-metrics', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('createMetricRecord', () => {
    test('should create metric record for all period', () => {
      const result = {
        'statement.schemeName': 'SFI',
        'statement.schemeYear': '2024',
        receivedYear: '2024',
        receivedMonth: '1',
        totalStatements: '100',
        printPostCount: '50',
        printPostCost: '3850',
        emailCount: '50',
        failureCount: '0'
      }
      const record = createMetricRecord(result, 'all', '2023-01-01', null, null)
      expect(record).toEqual({
        snapshotDate: '2023-01-01',
        periodType: 'all',
        schemeName: 'SFI',
        schemeYear: '2024',
        monthInYear: null,
        totalStatements: 100,
        printPostCount: 50,
        printPostCost: 3850,
        printPostUnitCost: DEFAULT_PRINT_POST_UNIT_COST,
        emailCount: 50,
        failureCount: 0,
        dataStartDate: null,
        dataEndDate: null
      })
    })

    test('should create metric record for year period with schemeYear as receivedYear', () => {
      const result = {
        'statement.schemeName': 'DP',
        'statement.schemeYear': '2024',
        receivedYear: '2024',
        receivedMonth: '6',
        totalStatements: '200',
        printPostCount: '100',
        printPostCost: '7700',
        emailCount: '100',
        failureCount: '5'
      }
      const record = createMetricRecord(result, PERIOD_YEAR, '2023-01-01', new Date(2024, 0, 1), new Date(2024, 11, 31))
      expect(record.schemeYear).toBe('2024') // receivedYear
      expect(record.monthInYear).toBe(null)
      expect(record.dataStartDate).toEqual(new Date(2024, 0, 1))
      expect(record.dataEndDate).toEqual(new Date(2024, 11, 31))
    })

    test('should create metric record for month_in_year period with monthInYear set', () => {
      const result = {
        'statement.schemeName': 'SFI',
        'statement.schemeYear': '2024',
        receivedYear: '2024',
        receivedMonth: '6',
        totalStatements: '50',
        printPostCount: '25',
        printPostCost: '1925',
        emailCount: '25',
        failureCount: '0'
      }
      const record = createMetricRecord(result, PERIOD_MONTH_IN_YEAR, '2023-01-01', new Date(2024, 5, 1), new Date(2024, 6, 0))
      expect(record.schemeYear).toBe('2024')
      expect(record.monthInYear).toBe(6)
      expect(record.dataStartDate).toEqual(new Date(2024, 5, 1))
      expect(record.dataEndDate).toEqual(new Date(2024, 6, 0))
    })

    test('should handle null receivedMonth', () => {
      const result = {
        'statement.schemeName': 'SFI',
        'statement.schemeYear': '2024',
        receivedYear: '2024',
        receivedMonth: null,
        totalStatements: '100',
        printPostCount: '50',
        printPostCost: '3850',
        emailCount: '50',
        failureCount: '0'
      }
      const record = createMetricRecord(result, 'all', '2023-01-01', null, null)
      expect(record.monthInYear).toBe(null)
    })

    test('should parse string numbers to integers', () => {
      const result = {
        'statement.schemeName': 'SFI',
        'statement.schemeYear': '2024',
        receivedYear: '2024',
        receivedMonth: '1',
        totalStatements: '100',
        printPostCount: '50',
        printPostCost: '3850',
        emailCount: '50',
        failureCount: '0'
      }
      const record = createMetricRecord(result, 'all', '2023-01-01', null, null)
      expect(typeof record.totalStatements).toBe('number')
      expect(typeof record.printPostCount).toBe('number')
      expect(typeof record.printPostCost).toBe('number')
      expect(typeof record.emailCount).toBe('number')
      expect(typeof record.failureCount).toBe('number')
    })
  })

  describe('saveMetrics', () => {
    test('should handle empty results', async () => {
      await saveMetrics([], 'all', '2023-01-01', null, null)
      expect(db.metric.findOne).not.toHaveBeenCalled()
      expect(db.metric.create).not.toHaveBeenCalled()
      expect(db.metric.update).not.toHaveBeenCalled()
    })

    test('should handle mixed existing and new metrics', async () => {
      const results = [
        {
          'statement.schemeName': 'SFI',
          'statement.schemeYear': '2024',
          receivedYear: '2024',
          receivedMonth: '1',
          totalStatements: '100',
          printPostCount: '50',
          printPostCost: '3850',
          emailCount: '50',
          failureCount: '0'
        },
        {
          'statement.schemeName': 'DP',
          'statement.schemeYear': '2024',
          receivedYear: '2024',
          receivedMonth: '1',
          totalStatements: '200',
          printPostCount: '100',
          printPostCost: '7700',
          emailCount: '100',
          failureCount: '10'
        }
      ]
      db.metric.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce({ id: 1 })
      db.metric.create.mockResolvedValue({})
      db.metric.update.mockResolvedValue([1])
      await saveMetrics(results, 'all', '2023-01-01', null, null)
      expect(db.metric.findOne).toHaveBeenCalledTimes(2)
      expect(db.metric.create).toHaveBeenCalledTimes(1)
      expect(db.metric.update).toHaveBeenCalledTimes(1)
    })
    test('should create metric record for unknown period', () => {
      const result = {
        'statement.schemeName': 'SFI',
        'statement.schemeYear': '2024',
        receivedYear: '2024',
        receivedMonth: '1',
        totalStatements: '100',
        printPostCount: '50',
        printPostCost: '3850',
        emailCount: '50',
        failureCount: '0'
      }
      const record = createMetricRecord(result, 'unknown', '2023-01-01', null, null)
      expect(record.periodType).toBe('unknown')
      expect(record.schemeYear).toBe('2024') // Uses 'statement.schemeYear'
      expect(record.monthInYear).toBe(null)
    })

    test('should create metric record if no existing metric found', async () => {
      const results = [{
        'statement.schemeName': 'SFI',
        'statement.schemeYear': '2024',
        receivedYear: '2024',
        receivedMonth: '1',
        totalStatements: '100',
        printPostCount: '50',
        printPostCost: '3850',
        emailCount: '50',
        failureCount: '0'
      }]
      db.metric.findOne.mockResolvedValue(null)
      db.metric.create.mockResolvedValue({})
      await saveMetrics(results, 'all', '2023-01-01', null, null)
      expect(db.metric.findOne).toHaveBeenCalledTimes(1)
      expect(db.metric.create).toHaveBeenCalledTimes(1)
      expect(db.metric.update).not.toHaveBeenCalled()
    })

    test('should update metric record if existing metric found', async () => {
      const results = [{
        'statement.schemeName': 'SFI',
        'statement.schemeYear': '2024',
        receivedYear: '2024',
        receivedMonth: '1',
        totalStatements: '100',
        printPostCount: '50',
        printPostCost: '3850',
        emailCount: '50',
        failureCount: '0'
      }]
      db.metric.findOne.mockResolvedValue({ id: 1 })
      db.metric.update.mockResolvedValue([1])
      await saveMetrics(results, 'all', '2023-01-01', null, null)
      expect(db.metric.findOne).toHaveBeenCalledTimes(1)
      expect(db.metric.update).toHaveBeenCalledTimes(1)
      expect(db.metric.create).not.toHaveBeenCalled()
    })

    test('should handle multiple results', async () => {
      const results = [
        {
          'statement.schemeName': 'SFI',
          'statement.schemeYear': '2024',
          receivedYear: '2024',
          receivedMonth: '1',
          totalStatements: '100',
          printPostCount: '50',
          printPostCost: '3850',
          emailCount: '50',
          failureCount: '0'
        },
        {
          'statement.schemeName': 'DP',
          'statement.schemeYear': '2024',
          receivedYear: '2024',
          receivedMonth: '1',
          totalStatements: '200',
          printPostCount: '100',
          printPostCost: '7700',
          emailCount: '100',
          failureCount: '10'
        }
      ]
      db.metric.findOne.mockResolvedValue(null)
      db.metric.create.mockResolvedValue({})
      await saveMetrics(results, 'all', '2023-01-01', null, null)
      expect(db.metric.create).toHaveBeenCalledTimes(2)
    })

    test('should propagate error from metric.findOne', async () => {
      db.metric.findOne.mockRejectedValue(new Error('DB error'))
      const results = [{
        'statement.schemeName': 'SFI',
        'statement.schemeYear': '2024',
        receivedYear: '2024',
        receivedMonth: '1',
        totalStatements: '100',
        printPostCount: '50',
        printPostCost: '3850',
        emailCount: '50',
        failureCount: '0'
      }]
      await expect(saveMetrics(results, 'all', '2023-01-01', null, null)).rejects.toThrow('DB error')
    })

    test('should propagate error from metric.create', async () => {
      db.metric.findOne.mockResolvedValue(null)
      db.metric.create.mockRejectedValue(new Error('Create error'))
      const results = [{
        'statement.schemeName': 'SFI',
        'statement.schemeYear': '2024',
        receivedYear: '2024',
        receivedMonth: '1',
        totalStatements: '100',
        printPostCount: '50',
        printPostCost: '3850',
        emailCount: '50',
        failureCount: '0'
      }]
      await expect(saveMetrics(results, 'all', '2023-01-01', null, null)).rejects.toThrow('Create error')
    })

    test('should propagate error from metric.update', async () => {
      db.metric.findOne.mockResolvedValue({ id: 1 })
      db.metric.update.mockRejectedValue(new Error('Update error'))
      const results = [{
        'statement.schemeName': 'SFI',
        'statement.schemeYear': '2024',
        receivedYear: '2024',
        receivedMonth: '1',
        totalStatements: '100',
        printPostCount: '50',
        printPostCost: '3850',
        emailCount: '50',
        failureCount: '0'
      }]
      await expect(saveMetrics(results, 'all', '2023-01-01', null, null)).rejects.toThrow('Update error')
    })
  })
})
