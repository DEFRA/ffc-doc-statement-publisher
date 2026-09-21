const { METRIC_SELECT } = require('../../../app/metrics/metric-columns')
const { DEFAULT_PRINT_POST_UNIT_COST } = require('../../../app/constants/print-post-pricing')
const { PERIOD_ALL, PERIOD_YEAR, PERIOD_MONTH_IN_YEAR, PERIOD_MONTH, PERIOD_WEEK, PERIOD_DAY } = require('../../../app/constants/periods')

const { createKnexMock, createQueryBuilder } = require('../../helpers/mock-knex')

const mockDb = createKnexMock(['metric'])

jest.mock('../../../app/data', () => ({
  client: mockDb.knex,
  transaction: mockDb.transaction,
  close: mockDb.close,
  ...mockDb.tables
}))

const { saveMetrics, createMetricRecord } = require('../../../app/metrics/create-save-metrics')

describe('create-save-metrics', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockDb.builder.resolves([])
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
        monthInYear: null, // PERIOD_ALL never has month
        totalStatements: 100,
        printPostCount: 50,
        printPostCost: 3850,
        printPostUnitCost: DEFAULT_PRINT_POST_UNIT_COST,
        emailCount: 50,
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
      expect(record.monthInYear).toBe(null) // PERIOD_YEAR doesn't store month
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
      expect(record.monthInYear).toBe(6) // Only PERIOD_MONTH_IN_YEAR has month
      expect(record.periodType).toBe(PERIOD_MONTH_IN_YEAR)
      expect(record.dataStartDate).toEqual(startDate)
      expect(record.dataEndDate).toEqual(endDate)
    })

    test('should create metric record for PERIOD_MONTH with null monthInYear', () => {
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
      expect(record.monthInYear).toBe(null) // PERIOD_MONTH doesn't store month
      expect(record.periodType).toBe(PERIOD_MONTH)
    })

    test('should create metric record for PERIOD_WEEK with null monthInYear', () => {
      const result = {
        'statement.schemeName': 'SFI',
        'statement.schemeYear': '2024',
        receivedYear: '2024',
        receivedMonth: '3',
        totalStatements: '50',
        printPostCount: '25',
        printPostCost: '1925',
        emailCount: '25',
        failureCount: '0'
      }
      const record = createMetricRecord(result, PERIOD_WEEK, snapshotDate, startDate, endDate)

      expect(record.schemeYear).toBe(2024)
      expect(record.monthInYear).toBe(null) // PERIOD_WEEK doesn't store month
      expect(record.periodType).toBe(PERIOD_WEEK)
    })

    test('should create metric record for PERIOD_DAY with null monthInYear', () => {
      const result = {
        'statement.schemeName': 'SFI',
        'statement.schemeYear': '2024',
        receivedYear: '2024',
        receivedMonth: '3',
        totalStatements: '20',
        printPostCount: '10',
        printPostCost: '770',
        emailCount: '10',
        failureCount: '0'
      }
      const record = createMetricRecord(result, PERIOD_DAY, snapshotDate, startDate, endDate)

      expect(record.schemeYear).toBe(2024)
      expect(record.monthInYear).toBe(null) // PERIOD_DAY doesn't store month
      expect(record.periodType).toBe(PERIOD_DAY)
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

      expect(record.monthInYear).toBe(null) // Always null for PERIOD_YEAR
      expect(record.schemeYear).toBe(2024)
    })

    test('should handle null receivedYear for PERIOD_YEAR', () => {
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
      expect(record.monthInYear).toBe(null) // Always null for PERIOD_YEAR
    })

    test('should handle null receivedMonth for PERIOD_MONTH_IN_YEAR', () => {
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
      const record = createMetricRecord(result, PERIOD_MONTH_IN_YEAR, snapshotDate, null, null)

      expect(record.schemeYear).toBe(2024)
      expect(record.monthInYear).toBe(null) // null when receivedMonth is null
    })

    test('should parse all string numbers to integers for PERIOD_MONTH_IN_YEAR', () => {
      const result = {
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
      const record = createMetricRecord(result, PERIOD_MONTH_IN_YEAR, snapshotDate, null, null)

      expect(typeof record.totalStatements).toBe('number')
      expect(typeof record.printPostCount).toBe('number')
      expect(typeof record.printPostCost).toBe('number')
      expect(typeof record.emailCount).toBe('number')
      expect(typeof record.schemeYear).toBe('number')
      expect(typeof record.monthInYear).toBe('number')
      expect(record.totalStatements).toBe(100)
      expect(record.printPostCount).toBe(50)
      expect(record.printPostCost).toBe(3850)
      expect(record.monthInYear).toBe(6)
    })

    test('should parse all string numbers to integers for PERIOD_YEAR', () => {
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
      const record = createMetricRecord(result, PERIOD_YEAR, snapshotDate, null, null)

      expect(typeof record.totalStatements).toBe('number')
      expect(typeof record.printPostCount).toBe('number')
      expect(typeof record.printPostCost).toBe('number')
      expect(typeof record.emailCount).toBe('number')
      expect(typeof record.schemeYear).toBe('number')
      expect(record.monthInYear).toBe(null)
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
      const result = await saveMetrics([], PERIOD_ALL, snapshotDate, null, null)

      expect(result).toEqual({ inserted: 0, updated: 0 })
      expect(mockDb.tables.metric).toHaveBeenCalledWith()
      expect(mockDb.builder.select).toHaveBeenCalledWith(METRIC_SELECT)
      expect(mockDb.builder.where).toHaveBeenCalledWith({
        snapshot_date: snapshotDate,
        period_type: PERIOD_ALL
      })
      expect(mockDb.builder.insert).not.toHaveBeenCalled()
      expect(mockDb.builder.update).not.toHaveBeenCalled()
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

      const result = await saveMetrics(results, PERIOD_ALL, snapshotDate, null, null)

      expect(result).toEqual({ inserted: 2, updated: 0 })
      expect(mockDb.builder.insert).toHaveBeenCalledTimes(1)
      expect(mockDb.builder.insert).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            scheme_name: 'SFI',
            scheme_year: '2024',
            total_statements: 100
          }),
          expect.objectContaining({
            scheme_name: 'DP',
            scheme_year: '2024',
            total_statements: 200
          })
        ])
      )
      expect(mockDb.builder.update).not.toHaveBeenCalled()
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

      mockDb.builder.resolves([existingRecord])

      const result = await saveMetrics(results, PERIOD_ALL, snapshotDate, null, null)

      expect(result).toEqual({ inserted: 0, updated: 1 })
      expect(mockDb.builder.update).toHaveBeenCalledTimes(1)
      expect(mockDb.builder.where).toHaveBeenCalledWith({ id: 123 })
      expect(mockDb.builder.update).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 123,
          scheme_name: 'SFI',
          scheme_year: '2024',
          month_in_year: null,
          total_statements: 100
        })
      )
      expect(mockDb.builder.insert).not.toHaveBeenCalled()
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

      mockDb.builder.resolves(existingRecords)

      const result = await saveMetrics(results, PERIOD_ALL, snapshotDate, null, null)

      expect(result).toEqual({ inserted: 1, updated: 2 })
      expect(mockDb.builder.update).toHaveBeenCalledTimes(2)
      expect(mockDb.builder.insert).toHaveBeenCalledTimes(1)
      expect(mockDb.builder.insert).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            scheme_name: 'BPS'
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

      mockDb.builder.resolves([existingRecord])

      const result = await saveMetrics(results, PERIOD_MONTH_IN_YEAR, snapshotDate, startDate, endDate)

      expect(result).toEqual({ inserted: 0, updated: 1 })
      expect(mockDb.builder.where).toHaveBeenCalledWith({ id: 456 })
      expect(mockDb.builder.update).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 456,
          month_in_year: 6
        })
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

      mockDb.builder.resolves(existingRecords)

      const result = await saveMetrics(results, PERIOD_ALL, snapshotDate, null, null)

      expect(result).toEqual({ inserted: 0, updated: 2 })
      expect(mockDb.builder.update).toHaveBeenCalledTimes(2)
    })

    test('should propagate error from the existing-records lookup', async () => {
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

      mockDb.builder.rejects(new Error('Database connection error'))

      await expect(saveMetrics(results, PERIOD_ALL, snapshotDate, null, null))
        .rejects.toThrow('Database connection error')
    })

    test('should propagate error from insert', async () => {
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

      const selectBuilder = createQueryBuilder().resolves([])
      const insertBuilder = createQueryBuilder().rejects(new Error('Bulk insert failed'))
      mockDb.tables.metric
        .mockReturnValueOnce(selectBuilder)
        .mockReturnValueOnce(insertBuilder)

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

      const selectBuilder = createQueryBuilder().resolves([existingRecord])
      const updateBuilder = createQueryBuilder().rejects(new Error('Update failed'))
      mockDb.tables.metric
        .mockReturnValueOnce(selectBuilder)
        .mockReturnValueOnce(updateBuilder)

      await expect(saveMetrics(results, PERIOD_ALL, snapshotDate, null, null))
        .rejects.toThrow('Update failed')
    })

    test('should correctly pass period type to the existing-records lookup', async () => {
      await saveMetrics([], PERIOD_YEAR, snapshotDate, startDate, endDate)

      expect(mockDb.builder.where).toHaveBeenCalledWith({
        snapshot_date: snapshotDate,
        period_type: PERIOD_YEAR
      })
    })

    test('should handle records with null schemeYear in composite key for PERIOD_MONTH', async () => {
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
        monthInYear: null
      }

      mockDb.builder.resolves([existingRecord])

      const result = await saveMetrics(results, PERIOD_MONTH, snapshotDate, null, null)

      expect(result).toEqual({ inserted: 0, updated: 1 })
      expect(mockDb.builder.update).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 1,
          scheme_name: 'SFI',
          scheme_year: null,
          month_in_year: null
        })
      )
    })
  })
})
