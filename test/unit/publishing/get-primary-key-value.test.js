const db = require('../../../app/data')
const getPrimaryKeyValue = require('../../../app/publishing/get-primary-key-value')

describe('getPrimaryKeyValue', () => {
  test('should return the primary key value of the object', () => {
    const object = { id: 1, name: 'Test' }
    const type = 'testType'
    db[type] = { primaryKeyAttributes: ['id'] }

    const result = getPrimaryKeyValue(object, type)

    expect(result).toBe(1)
  })

  test('should return undefined if the primary key does not exist', () => {
    const object = { name: 'Test' }
    const type = 'testType'
    db[type] = { primaryKeyAttributes: ['id'] }

    const result = getPrimaryKeyValue(object, type)

    expect(result).toBeUndefined()
  })
})
