const TABLES = require('../../../app/constants/tables')
const { PRIMARY_KEYS, COLUMNS, pickColumns } = require('../../../app/constants/columns')

describe('pickColumns', () => {
  test('keeps properties that are columns on the table', () => {
    const record = { statementId: 1, method: 'value' }

    expect(pickColumns(record, TABLES.delivery)).toEqual(record)
  })

  test('drops properties that are not columns on the table', () => {
    const result = pickColumns({ statementId: 1, notAColumn: 'value' }, TABLES.delivery)

    expect(result).toEqual({ statementId: 1 })
  })

  test('drops the primary key', () => {
    const result = pickColumns({ deliveryId: 1, statementId: 1 }, TABLES.delivery)

    expect(result).toEqual({ statementId: 1 })
  })

  test('returns an empty object when given no properties', () => {
    expect(pickColumns({}, TABLES.delivery)).toEqual({})
  })
})

describe('PRIMARY_KEYS', () => {
  test('each primary key is a column on its table', () => {
    for (const [table, primaryKey] of Object.entries(PRIMARY_KEYS)) {
      expect(COLUMNS[table]).toContain(primaryKey)
    }
  })
})
