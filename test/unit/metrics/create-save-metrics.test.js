const { saveMetrics, createMetricRecord } = require('../../../app/metrics/create-save-metrics')
const { DEFAULT_PRINT_POST_UNIT_COST } = require('../../../app/constants/print-post-pricing')
const { PERIOD_ALL, PERIOD_YEAR, PERIOD_MONTH_IN_YEAR, PERIOD_MONTH } = require('../../../app/constants/periods')

jest.mock('../../../app/data', () => ({
  metric: {
    findAll: jest.fn(),
    update: jest.fn(),
    bulkCreate: jest.fn()
  }
}))

const db = require('../../../app/data')

describe('create-save-metrics', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('createMetricRecord', () => {
    const snapshotDate = '2023-01-01'
    const startDate = new Date(2024, 0, 1)
    const endDate = new Date(2024, 11, 31)

    test('should create metric record for PERIOD_ALL using statement.schemeYear', () => {
      const result = {
        'statement.schemeName': 'SFI',
        'statement.schemeYear': '2024',
        receivedYear: '2023',
        receivedMonth: '1',
        totalStatements: '100',
        printPostCount: '50',
        printPostCost: '3850',
        emailCount: '50',
        failureCount: '0'
      }
      const record = createMetricRecord(result, PERIOD_ALL, snapshotDate, null, null)

      expect(record).toEqual({
        snapshotDate,
        periodType: PERIOD_ALL,
        schemeName: 'SFI',
        schemeYear: '2024', // Uses statement.schemeYear, not receivedYear
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

    test('should create metric record for PERIOD_YEAR with receivedYear and null monthInYear', () => {
      const result = {
        'statement.schemeName': 'DP',
        'statement.schemeYear': '2023',
        receivedYear: '2024',
        receivedMonth: '6',
        totalStatements: '200',
        printPostCount: '100',
        printPostCost: '7700',
        emailCount: '100',
        failureCount: '5'
      }
      const record = createMetricRecord(result, PERIOD_YEAR, snapshotDate, startDate, endDate)

      expect(record.schemeName).toBe('DP')
      expect(record.schemeYear).toBe(2024) // receivedYear parsed as integer
      expect(record.monthInYear).toBe(6)
      expect(record.periodType).toBe(PERIOD_YEAR)
      expect(record.dataStartDate).toEqual(startDate)
      expect(record.dataEndDate).toEqual(endDate)
    })

    test('should create metric record for PERIOD_MONTH_IN_YEAR with monthInYear set', () => {
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
      const record = createMetricRecord(result, PERIOD_MONTH_IN_YEAR, snapshotDate, startDate, endDate)

      expect(record.schemeYear).toBe(2024)
      expect(record.monthInYear).toBe(6)
      expect(record.periodType).toBe(PERIOD_MONTH_IN_YEAR)
      expect(record.dataStartDate).toEqual(startDate)
      expect(record.dataEndDate).toEqual(endDate)
    })

    test('should create metric record for PERIOD_MONTH', () => {
      const result = {
        'statement.schemeName': 'BPS',
        'statement.schemeYear': '2024',
        receivedYear: '2024',
        receivedMonth: '3',
        totalStatements: '75',
        printPostCount: '40',
        printPostCost: '3080',
        emailCount: '35',
        failureCount: '2'
      }
      const record = createMetricRecord(result, PERIOD_MONTH, snapshotDate, startDate, endDate)

      expect(record.schemeYear).toBe(2024)
      expect(record.monthInYear).toBe(3)
      expect(record.periodType).toBe(PERIOD_MONTH)
    })

    test('should handle null receivedMonth for non-PERIOD_ALL', () => {
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
      const record = createMetricRecord(result, PERIOD_YEAR, snapshotDate, null, null)

      expect(record.monthInYear).toBe(null)
      expect(record.schemeYear).toBe(2024)
    })

    test('should handle null receivedYear for non-PERIOD_ALL', () => {
      const result = {
        'statement.schemeName': 'SFI',
        'statement.schemeYear': '2024',
        receivedYear: null,
        receivedMonth: '1',
        totalStatements: '100',
        printPostCount: '50',
        printPostCost: '3850',
        emailCount: '50',
        failureCount: '0'
      }
      const record = createMetricRecord(result, PERIOD_YEAR, snapshotDate, null, null)

      expect(record.schemeYear).toBe(null)
      expect(record.monthInYear).toBe(1)
    })

    test('should parse all string numbers to integers', () => {
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
      const record = createMetricRecord(result, PERIOD_MONTH, snapshotDate, null, null)

      expect(typeof record.totalStatements).toBe('number')
      expect(typeof record.printPostCount).toBe('number')
      expect(typeof record.printPostCost).toBe('number')
      expect(typeof record.emailCount).toBe('number')
      expect(typeof record.failureCount).toBe('number')
      expect(typeof record.schemeYear).toBe('number')
      expect(typeof record.monthInYear).toBe('number')
      expect(record.totalStatements).toBe(100)
      expect(record.printPostCount).toBe(50)
      expect(record.printPostCost).toBe(3850)
    })

    test('should set printPostUnitCost to default constant', () => {
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
      const record = createMetricRecord(result, PERIOD_ALL, snapshotDate, null, null)

      expect(record.printPostUnitCost).toBe(DEFAULT_PRINT_POST_UNIT_COST)
    })

    test('should handle undefined receivedMonth gracefully', () => {
      const result = {
        'statement.schemeName': 'SFI',
        'statement.schemeYear': '2024',
        receivedYear: '2024',
        receivedMonth: undefined,
        totalStatements: '100',
        printPostCount: '50',
        printPostCost: '3850',
        emailCount: '50',
        failureCount: '0'
      }
      const record = createMetricRecord(result, PERIOD_YEAR, snapshotDate, null, null)

      expect(record.monthInYear).toBe(null)
    })
  })

  describe('saveMetrics', () => {
    const snapshotDate = '2023-01-01'
    const startDate = new Date(2024, 0, 1)
    const endDate = new Date(2024, 11, 31)

    test('should handle empty results array', async () => {
      db.metric.findAll.mockResolvedValue([])

      const result = await saveMetrics([], PERIOD_ALL, snapshotDate, null, null)

      expect(result).toEqual({ inserted: 0, updated: 0 })
      expect(db.metric.findAll).toHaveBeenCalledWith({
        where: {
          snapshotDate,
          periodType: PERIOD_ALL
        }
      })
      expect(db.metric.bulkCreate).not.toHaveBeenCalled()
      expect(db.metric.update).not.toHaveBeenCalled()
    })

    test('should insert new metrics when no existing records found', async () => {
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
          receivedMonth: '2',
          totalStatements: '200',
          printPostCount: '100',
          printPostCost: '7700',
          emailCount: '100',
          failureCount: '10'
        }
      ]

      db.metric.findAll.mockResolvedValue([])
      db.metric.bulkCreate.mockResolvedValue([{}, {}])

      const result = await saveMetrics(results, PERIOD_ALL, snapshotDate, null, null)

      expect(result).toEqual({ inserted: 2, updated: 0 })
      expect(db.metric.findAll).toHaveBeenCalledWith({
        where: {
          snapshotDate,
          periodType: PERIOD_ALL
        }
      })
      expect(db.metric.bulkCreate).toHaveBeenCalledTimes(1)
      expect(db.metric.bulkCreate).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            schemeName: 'SFI',
            schemeYear: '2024',
            totalStatements: 100
          }),
          expect.objectContaining({
            schemeName: 'DP',
            schemeYear: '2024',
            totalStatements: 200
          })
        ])
      )
      expect(db.metric.update).not.toHaveBeenCalled()
    })

    test('should update existing metrics when records found', async () => {
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
        }
      ]

      const existingRecord = {
        id: 123,
        schemeName: 'SFI',
        schemeYear: '2024',
        monthInYear: null
      }

      db.metric.findAll.mockResolvedValue([existingRecord])
      db.metric.update.mockResolvedValue([1])

      const result = await saveMetrics(results, PERIOD_ALL, snapshotDate, null, null)

      expect(result).toEqual({ inserted: 0, updated: 1 })
      expect(db.metric.update).toHaveBeenCalledTimes(1)
      expect(db.metric.update).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 123,
          schemeName: 'SFI',
          schemeYear: '2024',
          monthInYear: null,
          totalStatements: 100
        }),
        { where: { id: 123 } }
      )
      expect(db.metric.bulkCreate).not.toHaveBeenCalled()
    })

    test('should handle mixed inserts and updates', async () => {
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
        },
        {
          'statement.schemeName': 'BPS',
          'statement.schemeYear': '2024',
          receivedYear: '2024',
          receivedMonth: '1',
          totalStatements: '150',
          printPostCount: '75',
          printPostCost: '5775',
          emailCount: '75',
          failureCount: '5'
        }
      ]

      const existingRecords = [
        {
          id: 1,
          schemeName: 'SFI',
          schemeYear: '2024',
          monthInYear: null
        },
        {
          id: 2,
          schemeName: 'DP',
          schemeYear: '2024',
          monthInYear: null
        }
      ]

      db.metric.findAll.mockResolvedValue(existingRecords)
      db.metric.update.mockResolvedValue([1])
      db.metric.bulkCreate.mockResolvedValue([{}])

      const result = await saveMetrics(results, PERIOD_ALL, snapshotDate, null, null)

      expect(result).toEqual({ inserted: 1, updated: 2 })
      expect(db.metric.update).toHaveBeenCalledTimes(2)
      expect(db.metric.bulkCreate).toHaveBeenCalledTimes(1)
      expect(db.metric.bulkCreate).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            schemeName: 'BPS'
          })
        ])
      )
    })

    test('should match records correctly using composite key with monthInYear', async () => {
      const results = [
        {
          'statement.schemeName': 'SFI',
          'statement.schemeYear': '2024',
          receivedYear: '2024',
          receivedMonth: '6',
          totalStatements: '100',
          printPostCount: '50',
          printPostCost: '3850',
          emailCount: '50',
          failureCount: '0'
        }
      ]

      const existingRecord = {
        id: 456,
        schemeName: 'SFI',
        schemeYear: 2024,
        monthInYear: 6
      }

      db.metric.findAll.mockResolvedValue([existingRecord])
      db.metric.update.mockResolvedValue([1])

      const result = await saveMetrics(results, PERIOD_MONTH_IN_YEAR, snapshotDate, startDate, endDate)

      expect(result).toEqual({ inserted: 0, updated: 1 })
      expect(db.metric.update).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 456,
          monthInYear: 6
        }),
        { where: { id: 456 } }
      )
    })

    test('should handle multiple updates with Promise.all', async () => {
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

      const existingRecords = [
        {
          id: 1,
          schemeName: 'SFI',
          schemeYear: '2024',
          monthInYear: null
        },
        {
          id: 2,
          schemeName: 'DP',
          schemeYear: '2024',
          monthInYear: null
        }
      ]

      db.metric.findAll.mockResolvedValue(existingRecords)
      db.metric.update.mockResolvedValue([1])

      const result = await saveMetrics(results, PERIOD_ALL, snapshotDate, null, null)

      expect(result).toEqual({ inserted: 0, updated: 2 })
      expect(db.metric.update).toHaveBeenCalledTimes(2)
    })

    test('should propagate error from findAll', async () => {
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
        }
      ]

      db.metric.findAll.mockRejectedValue(new Error('Database connection error'))

      await expect(saveMetrics(results, PERIOD_ALL, snapshotDate, null, null))
        .rejects.toThrow('Database connection error')
    })

    test('should propagate error from bulkCreate', async () => {
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
        }
      ]

      db.metric.findAll.mockResolvedValue([])
      db.metric.bulkCreate.mockRejectedValue(new Error('Bulk insert failed'))

      await expect(saveMetrics(results, PERIOD_ALL, snapshotDate, null, null))
        .rejects.toThrow('Bulk insert failed')
    })

    test('should propagate error from update', async () => {
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
        }
      ]

      const existingRecord = {
        id: 1,
        schemeName: 'SFI',
        schemeYear: '2024',
        monthInYear: null
      }

      db.metric.findAll.mockResolvedValue([existingRecord])
      db.metric.update.mockRejectedValue(new Error('Update failed'))

      await expect(saveMetrics(results, PERIOD_ALL, snapshotDate, null, null))
        .rejects.toThrow('Update failed')
    })

    test('should correctly pass period type to findAll', async () => {
      db.metric.findAll.mockResolvedValue([])

      await saveMetrics([], PERIOD_YEAR, snapshotDate, startDate, endDate)

      expect(db.metric.findAll).toHaveBeenCalledWith({
        where: {
          snapshotDate,
          periodType: PERIOD_YEAR
        }
      })
    })

    test('should handle records with null schemeYear in composite key', async () => {
      const results = [
        {
          'statement.schemeName': 'SFI',
          'statement.schemeYear': '2024',
          receivedYear: null,
          receivedMonth: '1',
          totalStatements: '100',
          printPostCount: '50',
          printPostCost: '3850',
          emailCount: '50',
          failureCount: '0'
        }
      ]

      const existingRecord = {
        id: 1,
        schemeName: 'SFI',
        schemeYear: null,
        monthInYear: 1
      }

      db.metric.findAll.mockResolvedValue([existingRecord])
      db.metric.update.mockResolvedValue([1])

      const result = await saveMetrics(results, PERIOD_MONTH, snapshotDate, null, null)

      expect(result).toEqual({ inserted: 0, updated: 1 })
      expect(db.metric.update).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 1,
          schemeName: 'SFI',
          schemeYear: null
        }),
        { where: { id: 1 } }
      )
    })
  })
})
